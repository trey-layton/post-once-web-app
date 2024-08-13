'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import { generatedContentSchema } from '~/lib/forms/types/generated-content.schema';
import { createTwitterService } from '~/lib/integrations/twitter.service';
import { createProfilesService } from '~/lib/profiles/profiles.service';

export const addBeehiivApiKey = enhanceAction(
  async (data) => {
    const client = getSupabaseServerActionClient();
    const service = createProfilesService(client);

    await service.addBeehiivApiKey(data);
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

export const generateContent = enhanceAction(
  async ({ beehiivArticleId, contentType, accountId }) => {
    const client = getSupabaseServerActionClient();

    const {
      data: { session },
    } = await client.auth.getSession();

    try {
      const response = await fetch(`${process.env.API_URL}/generate_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          account_id: accountId,
          post_id: beehiivArticleId,
          content_type: contentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return generatedContentSchema.parse(await response.json());
    } catch (error) {
      throw new Error('Failed to generate content.');
    }
  },
  {
    schema: contentHubFormSchema.extend({
      accountId: z.string(),
    }),
  },
);

export const postContent = enhanceAction(
  async ({ integrationId, content }) => {
    const client = getSupabaseServerActionClient();
    const twitter = createTwitterService(client);

    if (
      (content.type === 'precta_tweet' || content.type === 'postcta_tweet') &&
      content.content.length > 0 &&
      content.content[0]?.text
    ) {
      return await twitter.singlePost({
        integrationId,
        content: content.content[0].text,
      });
    } else if (content.type === 'thread_tweet') {
      return await twitter.threadPost({
        integrationId,
        content: content.content,
      });
    }
  },
  {
    schema: z.object({
      integrationId: z.string(),
      content: generatedContentSchema,
    }),
  },
);
