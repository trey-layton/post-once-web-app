import { z } from 'zod';

export const generatedContentSchema = z.object({
  provider: z.enum(['twitter', 'linkedin', 'threads']),
  type: z.enum([
    'precta_tweet',
    'postcta_tweet',
    'thread_tweet',
    'long_form_tweet',
    'linkedin',
    'image_list',
  ]),
  content: z.array(
    z.object({
      type: z.string(),
      text: z.string(),
      thumbnail: z.string().optional(),
      pageTitle: z.string().optional(),
      domain: z.string().optional(),
      image_url: z.string().optional(),
    }),
  ),
  thumbnail_url: z.string().optional(),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;
