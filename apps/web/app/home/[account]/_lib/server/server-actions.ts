'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

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
  async (data) => {
    const client = getSupabaseServerActionClient();

    const { beehiivArticleId, contentType, accountId } = data;
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
          generate_precta_tweet: contentType === 'pre_nl_cta',
          generate_postcta_tweet: contentType === 'post_nl_cta',
          generate_thread_tweet: contentType === 'thread',
          generate_long_form_tweet: contentType === 'long_form',
          generate_linkedin: contentType === 'long_form_li',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const result = z
        .object({
          status: z.enum(['success', 'error']),
          message: z.string(),
          content: z.record(
            z.union([
              z.string(),
              z.array(
                z.object({
                  type: z.string(),
                  text: z.string(),
                }),
              ),
            ]),
          ),
        })
        .parse(await response.json());

      const transformedContent = [];
      for (const key in result.content) {
        if (Array.isArray(result.content[key])) {
          (
            result.content[key] as {
              type: string;
              text: string;
            }[]
          ).forEach((item) => transformedContent.push(item.text));
        } else if (typeof result.content[key] === 'string') {
          transformedContent.push(result.content[key] as string);
        }
      }

      return {
        ...result,
        content: transformedContent,
      };
    } catch (error) {
      throw new Error('Failed to generate content.');
    }
  },
  {
    schema: z.object({
      accountId: z.string(),
      beehiivArticleId: z.string(),
      contentType: z.enum([
        'pre_nl_cta',
        'post_nl_cta',
        'thread',
        'long_form',
        'long_form_li',
      ]),
      account: z.string(),
    }),
  },
);
