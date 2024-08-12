import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

export function createProfilesService(client: SupabaseClient<Database>) {
  return new ProfilesService(client);
}

class ProfilesService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getProfile(params: { accountSlug: string }) {
    const query = this.client
      .from('account_profiles')
      .select('*, account_id !inner (slug)')
      .eq('account_id.slug', params.accountSlug)
      .maybeSingle();

    const { data, error } = await query;

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
}
