'use client';

import { useState, useTransition } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

import { PlanPicker } from '@kit/billing-gateway/components';
import { useAppEvents } from '@kit/shared/events';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import billingConfig from '~/config/billing.config';

import { createTeamAccountCheckoutSession } from '../_lib/server/server-actions';

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

export function TeamAccountCheckoutForm(params: {
  accountId: string;
  customerId: string | null | undefined;
}) {
  const routeParams = useParams();
  const [pending, startTransition] = useTransition();
  const appEvents = useAppEvents();
  const [error, setError] = useState<string | null>(null);

  const [checkoutToken, setCheckoutToken] = useState<string | undefined>(
    undefined,
  );

  // If the checkout token is set, render the embedded checkout component
  if (checkoutToken) {
    return (
      <EmbeddedCheckout
        checkoutToken={checkoutToken}
        provider={billingConfig.provider}
        onClose={() => setCheckoutToken(undefined)}
      />
    );
  }

  // only allow trial if the user is not already a customer
  const canStartTrial = !params.customerId;

  // Otherwise, render the plan picker component
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <Trans i18nKey={'billing:manageTeamPlan'} />
          </CardTitle>

          <CardDescription>
            <Trans i18nKey={'billing:manageTeamPlanDescription'} />
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <PlanPicker
            pending={pending}
            config={billingConfig}
            canStartTrial={canStartTrial}
            onSubmit={({ planId, productId }) => {
              console.log('Selected Plan:', planId, 'Product:', productId);
              console.log('TeamAccountCheckoutForm onSubmit called with planId:', planId, 'productId:', productId);
              startTransition(async () => {
                try {
                  const slug = routeParams.account as string;

                  appEvents.emit({
                    type: 'checkout.started',
                    payload: {
                      planId,
                      account: slug,
                    },
                  });

                  const { checkoutToken } =
                    await createTeamAccountCheckoutSession({
                      planId,
                      productId,
                      slug,
                      accountId: params.accountId,
                    });

                  setCheckoutToken(checkoutToken);
                  setError(null); // Clear any previous errors
                } catch (e: any) {
                  console.error('Error creating checkout session:', error);
                  setError('Failed to create checkout session. Please try again.');
                }
              });
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
