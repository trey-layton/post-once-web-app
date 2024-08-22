import { Json, Tables } from '~/lib/database.types';

export default interface Content {
  id: string;
  account_id: { slug: string };
  integration_id: {
    provider: Tables<'integrations'>['provider'];
    username: string;
    avatar: string;
  };
  status: Tables<'content'>['status'];
  generated_content: Json;
  edited_content?: Json;
  posted_url?: string;
  scheduled_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}
