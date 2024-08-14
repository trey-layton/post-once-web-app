import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '~/lib/database.types';

export function createProfilesService(client: SupabaseClient<Database>) {
  return new ProfilesService(client);
}

class ProfilesService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getProfile(params: { accountSlug: string }) {
    const { data, error } = await this.client
      .from('account_profiles')
      .select('*, account_id !inner (slug)')
      .eq('account_id.slug', params.accountSlug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data };
  }

  async addBeehiivApiKey(params: {
    accountId: string;
    apiKey: string;
    publicationId: string;
    subscribeUrl: string;
  }) {
    const { error } = await this.client.from('account_profiles').upsert({
      account_id: params.accountId,
      beehiiv_api_key: params.apiKey,
      publication_id: params.publicationId,
      subscribe_url: params.subscribeUrl,
    });

    if (error) {
      throw error;
    }
  }

  async getBeehiivPosts(params: { accountSlug: string }) {
    const { data, error } = await this.client
      .from('account_profiles')
      .select('*, account_id !inner (slug)')
      .eq('account_id.slug', params.accountSlug)
      .maybeSingle();

    if (error) {
      throw error;
    } else if (!data) {
      return { posts: [] };
    }

    try {
      const response = await fetch(
        `https://api.beehiiv.com/v2/publications/${data.publication_id}/posts?order_by=displayed_date&direction=desc`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${data.beehiiv_api_key}`,
          },
        },
      );

      const posts = z
        .object({
          id: z.string(),
          title: z.string(),
        })
        .array()
        .parse((await response.json()).data);

      return { posts };
    } catch (error) {
      console.error(error);
      return { posts: [] };
    }
  }
}
