// content-hub-form.schema.ts
import { z } from 'zod';

export const baseContentHubFormSchema = z.object({
  beehiivArticleId: z.string().optional(),
  pastedContent: z.string().optional(),
  contentType: z.enum([
    'precta_tweet',
    'postcta_tweet',
    'thread_tweet',
    'long_form_tweet',
    'long_form_post',
    'image_list',
  ]),
  account: z.string(),
});

// Apply superRefine for mutual exclusivity
export const contentHubFormSchema = baseContentHubFormSchema.superRefine((data, ctx) => {
  if (!data.beehiivArticleId && !data.pastedContent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Either Beehiiv Article or Pasted Content is required',
      path: ['beehiivArticleId'],
    });
  }
  if (data.beehiivArticleId && data.pastedContent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cannot provide both Beehiiv Article and Pasted Content',
      path: ['beehiivArticleId'],
    });
  }
});
