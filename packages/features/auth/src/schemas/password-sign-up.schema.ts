import { z } from 'zod';

import { RefinedPasswordSchema, refineRepeatPassword } from './password.schema';

export const PasswordSignUpSchema = z
  .object({
    email: z.string().email(),
    password: RefinedPasswordSchema,
    repeatPassword: RefinedPasswordSchema,
    referralCode: z.string().optional(), // Add this line
  })
  .superRefine(refineRepeatPassword);