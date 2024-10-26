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
        teamName: '',
      },
      beehiivDetails: {
        beehiivApiKey: '',
        publicationId: '',
        subscribeUrl: '',
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
          <BeehiivDetailsStep />
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
          <h1 className={'text-xl font-semibold'}>Welcome to PostOnce</h1>

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
        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Team Name</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'New Team'} />
                </FormControl>

                <FormDescription>Enter the name of your team</FormDescription>
              </FormItem>
            );
          }}
          name={'profile.teamName'}
        />

        <div className={'flex justify-end'}>
          <Button onClick={nextStep}>Continue</Button>
        </div>
      </div>
    </Form>
  );
}

function BeehiivDetailsStep() {
  const { nextStep, prevStep, form } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-6'}>
        <div className={'flex flex-col space-y-2'}>
          <h1 className={'text-xl font-semibold'}>
            Let's get your newsletter connected
          </h1>

          <p className={'text-sm text-muted-foreground'}>
            Enter your beehiiv API key to connect your newsletter.
          </p>
        </div>

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>beehiiv API Key</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'Enter your API key'} />
                </FormControl>
              </FormItem>
            );
          }}
          name={'beehiivDetails.beehiivApiKey'}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Publication ID</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'Enter your publication ID'} />
                </FormControl>
              </FormItem>
            );
          }}
          name={'beehiivDetails.publicationId'}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Subscribe URL</FormLabel>

                <FormControl>
                  <Input {...field} placeholder={'Enter your subscribe URL'} />
                </FormControl>
              </FormItem>
            );
          }}
          name={'beehiivDetails.subscribeUrl'}
        />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">How to do this</h3>
          <ol className="space-y-2 text-muted-foreground">
            <li>
              <span className="font-medium">
                1. Navigate to Settings from your beehiiv Dashboard,
              </span>
            </li>
            <li>
              <span className="font-medium">
                2. Click Integrations on the left hand navigation menu,
              </span>
            </li>
            <li>
              <span className="font-medium">
                3. Scroll down and select 'New API Key',
              </span>
            </li>
            <li>
              <span className="font-medium">
                4. Give it a name like 'PostOnce API Key' and click Create New
                Key,
              </span>
            </li>
            <li>
              <span className="font-medium">
                5. Copy this key and paste it in the field above.
              </span>
            </li>
          </ol>
        </div>

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
