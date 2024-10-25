import { z } from 'zod';

export const OnboardingFormSchema = z.object({
  profile: z.object({
    name: z.string().min(1).max(255),
    teamName: z.string().min(1).max(255),
  }),
  beehiivDetails: z.object({
    beehiivApiKey: z.string().min(1, 'Please enter your beehiiv API key'),
    publicationId: z.string().min(1, 'Please enter your publication ID'),
    subscribeUrl: z
      .string()
      .min(1, 'Please enter your subscribe URL')
      .url('Please enter a valid subscribe URL'),
  }),
  checkout: z.object({
    planId: z.string().min(1),
    productId: z.string().min(1),
  }),
});
