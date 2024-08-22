import { z } from 'zod';

export const generatedContentSchema = z.object({
  status: z.string(),
  message: z.string(),
  provider: z.enum(['twitter', 'linkedin', 'threads']),
  type: z.enum([
    'precta_tweet',
    'postcta_tweet',
    'thread_tweet',
    'long_form_tweet',
    'linkedin',
  ]),
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string(),
      thumbnail: z.string().optional(),
      pageTitle: z.string().optional(),
      domain: z.string().optional(),
    }),
  ),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;
