import { BillingProviderSchema, createBillingSchema } from '@kit/billing';

const provider = BillingProviderSchema.parse(
  process.env.NEXT_PUBLIC_BILLING_PROVIDER,
);

export default createBillingSchema({
  provider,
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
              // Use your actual Stripe Price ID here
              id: 'price_1QCqNqDFhW4fdaSjcUNlEdPp',
              name: 'Standard Tier',
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