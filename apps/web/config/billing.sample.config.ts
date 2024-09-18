/**
 * This is a sample billing configuration file. You should copy this file to `billing.config.ts` and then replace
 * the configuration with your own billing provider and products.
 */
import { z } from 'zod';

import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

// The billing provider to use. This should be set in the environment variables
// and should match the provider in the database. We also add it here so we can validate
// your configuration against the selected provider at build time.
const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

const VariantsSchema = z.object({
  NEXT_PUBLIC_STANDARD_PLAN_MONTHLY_VARIANT_ID: z.string().min(1),
});

const variants = VariantsSchema.parse({
  NEXT_PUBLIC_STANDARD_PLAN_MONTHLY_VARIANT_ID:
    process.env.NEXT_PUBLIC_STANDARD_PLAN_MONTHLY_VARIANT_ID,
});

export default createBillingSchema({
  // also update config.billing_provider in the DB to match the selected
  provider,
  // products configuration
  products: [
    {
      id: 'standard',
      name: 'Standard',
      description: 'The full package to manage your social media content.',
      currency: 'USD',
      badge: `Value`,
      plans: [
        {
          name: 'Standard Monthly',
          id: 'standard-monthly',
          paymentType: 'recurring',
          interval: 'month',
          trialDays: 14,
          lineItems: [
            {
              id: variants.NEXT_PUBLIC_STANDARD_PLAN_MONTHLY_VARIANT_ID,
              name: 'Base Price',
              cost: 14.99,
              type: 'flat' as const,
            },
          ],
        },
      ],
      features: [
        'LinkedIn & Twitter integrations',
        'Content Generation',
        'Content Scheduling & Posting',
      ],
    },
  ],
});
