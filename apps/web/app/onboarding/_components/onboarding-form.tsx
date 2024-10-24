'use client';

import { useCallback, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import dynamic from 'next/dynamic';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { PlanPicker } from '@kit/billing-gateway/components';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';
import {
  MultiStepForm,
  MultiStepFormContextProvider,
  MultiStepFormHeader,
  MultiStepFormStep,
  useMultiStepFormContext,
} from '@kit/ui/multi-step-form';
import { Stepper } from '@kit/ui/stepper';

import billingConfig from '~/config/billing.config';
import { OnboardingFormSchema } from '~/onboarding/_lib/onboarding-form.schema';
import { submitOnboardingFormAction } from '~/onboarding/_lib/server/server-actions';

const EmbeddedCheckout = dynamic(
  async () => {
    const { EmbeddedCheckout } = await import('@kit/billing-gateway/checkout');

    return {
      default: EmbeddedCheckout,
    };
  },
  {
    ssr: false,
  },
);

export function OnboardingForm() {
  const [checkoutToken, setCheckoutToken] = useState<string | undefined>(
    undefined,
  );

  const form = useForm({
    resolver: zodResolver(OnboardingFormSchema),
    defaultValues: {
      profile: {
        name: '',
      },
      team: {
        name: '',
      },
      checkout: {
        planId: '',
        productId: '',
      },
    },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: z.infer<typeof OnboardingFormSchema>) => {
      try {
        const { checkoutToken } = await submitOnboardingFormAction(data);

        setCheckoutToken(checkoutToken);
      } catch (error) {
        console.error('Failed to submit form:', error);
      }
    },
    [],
  );

  const checkoutPortalRef = useRef<HTMLDivElement>(null);

  if (checkoutToken) {
    return (
      <EmbeddedCheckout
        checkoutToken={checkoutToken}
        provider={billingConfig.provider}
        onClose={() => setCheckoutToken(undefined)}
      />
    );
  }

  return (
    <div
      className={
        'rounded-lg p-8 shadow-sm duration-500 animate-in fade-in-90 zoom-in-95 slide-in-from-bottom-12 lg:border'
      }
    >
      <MultiStepForm
        className={'space-y-8 p-1'}
        schema={OnboardingFormSchema}
        form={form}
        onSubmit={onSubmit}
      >
        <MultiStepFormHeader>
          <MultiStepFormContextProvider>
            {({ currentStepIndex }) => (
              <Stepper
                variant={'numbers'}
                steps={['Profile', 'Team', 'Complete']}
                currentStep={currentStepIndex}
              />
            )}
          </MultiStepFormContextProvider>
        </MultiStepFormHeader>

        <MultiStepFormStep name={'profile'}>
          <ProfileStep />
        </MultiStepFormStep>

        <MultiStepFormStep name={'team'}>
          <TeamStep />
        </MultiStepFormStep>

        <MultiStepFormStep name={'checkout'}>
          <If condition={checkoutPortalRef.current}>
            {(portalRef) => createPortal(<CheckoutStep />, portalRef)}
          </If>
        </MultiStepFormStep>
      </MultiStepForm>

      <div className={'p-1'} ref={checkoutPortalRef}></div>
    </div>
  );
}

function ProfileStep() {
  const { nextStep, form } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-6'}>
        <div className={'flex flex-col space-y-2'}>
          <h1 className={'text-xl font-semibold'}>Welcome to Makerkit</h1>

          <p className={'text-sm text-muted-foreground'}>
            Welcome to the onboarding process! Let&apos;s get started by
            entering your name.
          </p>
        </div>

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Your Name</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'Name'} />
                </FormControl>

                <FormDescription>Enter your full name here</FormDescription>
              </FormItem>
            );
          }}
          name={'profile.name'}
        />

        <div className={'flex justify-end'}>
          <Button onClick={nextStep}>Continue</Button>
        </div>
      </div>
    </Form>
  );
}

function TeamStep() {
  const { nextStep, prevStep, form } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-6'}>
        <div className={'flex flex-col space-y-2'}>
          <h1 className={'text-xl font-semibold'}>Create Your Team</h1>

          <p className={'text-sm text-muted-foreground'}>
            Let&apos;s create your team. Enter your team name below.
          </p>
        </div>

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Your Team Name</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'Name'} />
                </FormControl>

                <FormDescription>
                  This is the name of your team.
                </FormDescription>
              </FormItem>
            );
          }}
          name={'team.name'}
        />

        <div className={'flex justify-end space-x-2'}>
          <Button variant={'ghost'} onClick={prevStep}>
            Go Back
          </Button>

          <Button onClick={nextStep}>Continue</Button>
        </div>
      </div>
    </Form>
  );
}

function CheckoutStep() {
  const { form, mutation } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <PlanPicker
        pending={mutation.isPending}
        config={billingConfig}
        onSubmit={({ planId, productId }) => {
          form.setValue('checkout.planId', planId);
          form.setValue('checkout.productId', productId);

          mutation.mutate();
        }}
      />
    </Form>
  );
}
