import { SupabaseClient } from '@supabase/supabase-js';

import { Database, Tables } from '~/lib/database.types';

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
    providerUserId?: string;
  }) {
    const { data, error } = await this.client.from('integrations').upsert(
      {
        account_id: params.accountId,
        provider: params.provider,
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
        expires_in: params.expiresIn,
        username: params.username,
        avatar: params.avatar,
        provider_user_id: params.providerUserId,
      },
      { onConflict: 'account_id, provider, username' },
    );

    if (error) {
      throw error;
    }

    return data;
  }

  async deleteIntegration(params: { id: string }) {
    const { error } = await this.client
      .from('integrations')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }
  }

  async getIntegrations(params: { accountSlug: string }) {
    const { data, error } = await this.client
      .from('integrations')
      .select<
        string,
        Pick<Tables<'integrations'>, 'id' | 'avatar' | 'provider' | 'username'>
      >('id, avatar, provider, username, account_id !inner (slug)', {
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
