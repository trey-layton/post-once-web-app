'use server';

import { redirect } from 'next/navigation';

import { createBillingGatewayService } from '@kit/billing-gateway';
import { enhanceAction } from '@kit/next/actions';
import { getLogger } from '@kit/shared/logger';

import appConfig from '~/config/app.config';
import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { OnboardingFormSchema } from '~/onboarding/_lib/onboarding-form.schema';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

export const submitOnboardingFormAction = enhanceAction(
  async (data, user) => {
    const logger = await getLogger();

    logger.info({ userId: user.id }, `Submitting onboarding form...`);

    const isOnboarded = user.app_metadata.onboarded === true;

    if (isOnboarded) {
      logger.info(
        { userId: user.id },
        `User is already onboarded. Redirecting...`,
      );

      redirect(pathsConfig.app.home);
    }

    const client = getSupabaseServerActionClient();

    const createTeamResponse = await client
      .from('accounts')
      .insert({
        name: data.team.name,
        primary_owner_user_id: user.id,
        is_personal_account: false,
      })
      .select('id')
      .single();

    if (createTeamResponse.error) {
      logger.error(
        {
          error: createTeamResponse.error,
        },
        `Failed to create team`,
      );

      throw createTeamResponse.error;
    } else {
      logger.info(
        { userId: user.id, teamId: createTeamResponse.data.id },
        `Team created. Creating onboarding data...`,
      );
    }

    const response = await client.from('onboarding').upsert(
      {
        account_id: user.id,
        data: {
          userName: data.profile.name,
          teamAccountId: createTeamResponse.data.id,
        },
        completed: true,
      },
      {
        onConflict: 'account_id',
      },
    );

    if (response.error) {
      throw response.error;
    }

    logger.info(
      { userId: user.id, teamId: createTeamResponse.data.id },
      `Onboarding data created. Creating checkout session...`,
    );

    const billingService = createBillingGatewayService(billingConfig.provider);

    const { plan } = getPlanDetails(
      data.checkout.productId,
      data.checkout.planId,
    );

    const returnUrl = new URL('/onboarding/complete', appConfig.url).href;

    const checkoutSession = await billingService.createCheckoutSession({
      returnUrl,
      customerEmail: user.email,
      accountId: createTeamResponse.data.id,
      plan,
      variantQuantities: [],
      metadata: {
        source: 'onboarding',
        userId: user.id,
      },
    });

    return {
      checkoutToken: checkoutSession.checkoutToken,
    };
  },
  {
    auth: true,
    schema: OnboardingFormSchema,
  },
);

function getPlanDetails(productId: string, planId: string) {
  const product = billingConfig.products.find(
    (product) => product.id === productId,
  );

  if (!product) {
    throw new Error('Product not found');
  }

  const plan = product?.plans.find((plan) => plan.id === planId);

  if (!plan) {
    throw new Error('Plan not found');
  }

  return { plan, product };
}
