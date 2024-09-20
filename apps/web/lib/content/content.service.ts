import { SupabaseClient } from '@supabase/supabase-js';

import { Database, Tables } from '~/lib/database.types';

import { GeneratedContent } from '../forms/types/generated-content.schema';
import Content from './types/content';

export function createContentService(client: SupabaseClient<Database>) {
  return new ContentService(client);
}

class ContentService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getContent(params: {
    accountSlug: string;
    page: number;
    limit?: number;
    query?: string;
  }) {
    const limit = params.limit ?? 10;
    const startOffset = (params.page - 1) * limit;
    const endOffset = startOffset + limit;

    let query = this.client
      .from('content')
      .select<string, Content>(
        `
        *,
        account_id!inner (slug),
        integration_id (
            provider,
            username,
            avatar
        )
        `,
        {
          count: 'exact',
        },
      )
      .eq('account_id.slug', params.accountSlug)
      .order('created_at', { ascending: false })
      .range(startOffset, endOffset);

    if (params.query) {
      query = query.textSearch('title', `"${params.query}"`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      count: count ?? 0,
      pageSize: limit,
      page: params.page,
      pageCount: Math.ceil((count ?? 0) / limit),
    };
  }

  async addContent(params: {
    accountId: string;
    integrationId: string;
    status: 'scheduled' | 'posted' | 'generated';
    generatedContent: GeneratedContent;
  }) {
    const { data, error } = await this.client
      .from('content')
      .insert([
        {
          account_id: params.accountId,
          integration_id: params.integrationId,
          status: params.status,
          generated_content: params.generatedContent,
        },
      ])
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async updateContent(params: {
    id: string;
    status: 'scheduled' | 'posted' | 'generated';
    editedContent?: GeneratedContent;
    postedUrl?: string;
    scheduledAt?: string | null;
  }) {
    const updatedContent: Partial<Tables<'content'>> = {
      status: params.status,
      edited_content: params.editedContent,
      posted_url: params.postedUrl,
      scheduled_at: params.scheduledAt,
    };

    if (params.status === 'posted') {
      updatedContent.posted_at = new Date().toISOString();
    }

    const { data, error } = await this.client
      .from('content')
      .update(updatedContent)
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return data;
  }
}
