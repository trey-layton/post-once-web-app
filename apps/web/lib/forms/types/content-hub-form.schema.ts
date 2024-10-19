import { z } from 'zod';

export const contentHubFormSchema = z.object({
  beehiivArticleId: z.string().min(1, 'Required'),
  contentType: z.enum([
    'precta_tweet',
    'postcta_tweet',
    'thread_tweet',
    'long_form_tweet',
    'linkedin_long_form_post',
    'image_list',
  ]),
  account: z.string(),
});
