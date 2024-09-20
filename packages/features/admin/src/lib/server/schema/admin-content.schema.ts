import { z } from 'zod';

import { Tables } from '@kit/supabase/database';

export interface AdminContent {
  id: string;
  account_id: {
    picture_url: string | null;
    name: string;
    id: string;
  };
  integration_id: {
    provider: Tables<'integrations'>['provider'];
    username: string;
    avatar: string;
    id: string;
  };
  status: Tables<'content'>['status'];
  generated_content: GeneratedContent;
  edited_content?: GeneratedContent;
  posted_url?: string;
  scheduled_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

const generatedContentSchema = z.object({
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
