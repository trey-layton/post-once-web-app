import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

export function createIntegrationsService(client: SupabaseClient<Database>) {
  return new IntegrationsService(client);
}

//!USE SUPABASE TYPE FOR PARAMS

class IntegrationsService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async addIntegration(params: {
    accountId: string;
    provider: 'linkedin' | 'twitter' | 'threads';
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    username?: string;
    avatar?: string;
  }) {
    const { data, error } = await this.client.from('integrations').insert({
      account_id: params.accountId,
      provider: params.provider,
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
      expires_in: params.expiresIn,
      username: params.username,
      avatar: params.avatar,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async getIntegrations(params: { accountSlug: string }) {
    const { data, error } = await this.client
      .from('integrations')
      .select('*, account_id !inner (slug)', {
        count: 'exact',
      })
      .eq('account_id.slug', params.accountSlug);

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
    };
  }
}
