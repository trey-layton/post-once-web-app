import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '~/lib/database.types';

export function createLinkedInService(client: SupabaseClient<Database>) {
  return new LinkedInService(client);
}

class LinkedInService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async singlePost(params: { content: string; integrationId: string }) {
    const { data: integration, error } = await this.client
      .from('integrations')
      .select('*')
      .eq('id', params.integrationId)
      .single();

    if (error || !integration) {
      throw error;
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${integration.provider_user_id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: params.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const post = z
      .object({
        id: z.string(),
      })
      .parse(await response.json());

    return {
      link: `https://www.linkedin.com/feed/update/${post.id}`,
    };
  }
}
