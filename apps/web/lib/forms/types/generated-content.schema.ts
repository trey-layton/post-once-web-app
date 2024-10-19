import { z } from 'zod';

export const generatedContentSchema = z.object({
  provider: z.enum(['twitter', 'linkedin', 'threads']),
  type: z.enum([
    'precta_tweet',
    'postcta_tweet',
    'thread_tweet',
    'long_form_tweet',
    'linkedin_long_form_post',
    'image_list',
  ]),
  content: z.array(
    z.object({
      post_number: z.number(),
      post_content: z.array(
        z.object({
          post_type: z.string(),
          post_content: z.string(),
          thumbnail: z.string().optional(),
          pageTitle: z.string().optional(),
          domain: z.string().optional(),
          image_url: z.string().optional(),
        }),
      ),
    }),
  ),
  thumbnail_url: z.string().optional(),
  metadata: z
    .object({
      web_url: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
  success: z.boolean(),
});

export type GeneratedContent = z.infer<typeof generatedContentSchema>;
