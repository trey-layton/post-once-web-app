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
  generated_content: PostContent;
  edited_content?: PostContent;
  posted_url?: string;
  scheduled_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

const postContentSchema = z.object({
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
