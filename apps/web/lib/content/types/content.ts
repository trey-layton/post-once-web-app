import { Tables } from '~/lib/database.types';
import { GeneratedContent } from '~/lib/forms/types/generated-content.schema';

export default interface Content {
  id: string;
  account_id: { slug: string };
  integration_id: {
    provider: Tables<'integrations'>['provider'];
    username: string;
    avatar: string;
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