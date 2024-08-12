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

  async getUserProfile() {
    const query = this.client.from('user_profiles').select('*').maybeSingle();

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
  }) {
    const { error } = await this.client.from('account_profiles').upsert({
      account_id: params.accountId,
      beehiiv_api_key: params.apiKey,
      publication_id: params.publicationId,
    });

    if (error) {
      throw error;
    }
  }

  async addUserBeehiivApiKey(params: {
    accountId: string;
    apiKey: string;
    publicationId: string;
    subscribeUrl: string;
  }) {
    const {
      data: { user },
    } = await this.client.auth.getUser();

    if (!user) {
      throw new Error('User not found');
    }

    const { error } = await this.client
      .from('user_profiles')
      .upsert({
        id: user.id,
        beehiiv_api_key: params.apiKey,
        publication_id: params.publicationId,
        subscribe_url: params.subscribeUrl,
      })
      .eq('id', user.id);

    if (error) {
      throw error;
    }
  }
}
