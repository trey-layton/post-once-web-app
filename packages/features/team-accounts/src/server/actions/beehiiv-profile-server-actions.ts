'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

export const updateBeehiivProfile = enhanceAction(
  async (data) => {
    const client = getSupabaseServerActionClient();

    const { error } = await client.from('account_profiles').upsert({
      account_id: data.accountId,
      beehiiv_api_key: data.apiKey,
      publication_id: data.publicationId,
      subscribe_url: data.subscribeUrl,
    });

    if (error) {
      throw error;
    }
  },
  {
    schema: z.object({
      accountId: z.string(),
      apiKey: z.string(),
      publicationId: z.string(),
      subscribeUrl: z.string(),
    }),
  },
);
