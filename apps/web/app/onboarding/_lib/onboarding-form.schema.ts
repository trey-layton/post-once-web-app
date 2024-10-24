import { z } from 'zod';

export const OnboardingFormSchema = z.object({
  profile: z.object({
    name: z.string().min(1).max(255),
  }),
  team: z.object({
    name: z.string().min(1).max(255),
  }),
  checkout: z.object({
    planId: z.string().min(1),
    productId: z.string().min(1),
  }),
});
