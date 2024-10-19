import { z } from 'zod';

export const postContentSchema = z.object({
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
});
export type PostContent = z.infer<typeof postContentSchema>;

export const contentProviderSchema = z.enum(['twitter', 'linkedin', 'threads']);

export const contentTypeSchema = z.enum([
  'precta_tweet',
  'postcta_tweet',
  'thread_tweet',
  'long_form_tweet',
  'long_form_post',
  'image_list',
]);

export const generatedContentSchema = z.object({
  provider: contentProviderSchema,
  type: contentTypeSchema,
  content: z.array(postContentSchema),
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
