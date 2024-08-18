'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import { generatedContentSchema } from '~/lib/forms/types/generated-content.schema';
import { createLinkedInService } from '~/lib/integrations/linkedin.service';
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

      const generatedContent = generatedContentSchema.parse(
        await response.json(),
      );

      return {
        ...generatedContent,
        content: await Promise.all(
          generatedContent.content.map(getLinkMetaData),
        ),
      };
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

async function getLinkMetaData(
  content: z.infer<typeof generatedContentSchema>['content'][number],
  timeout: number = 3000,
) {
  const urlMatch = content.text.match(/(https?:\/\/[^\s]+)/g);
  const url = urlMatch ? urlMatch[0] : null;

  if (url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      if (!html) return content;

      const pageTitle =
        html.match(/<meta property="og:title" content="([^"]+)"\/?>/i)?.[1] ||
        html.match(/<title>([^<]+)<\/title>/i)?.[1] ||
        undefined;

      const thumbnail =
        html.match(/<meta property="og:image" content="([^"]+)"\/?>/i)?.[1] ||
        undefined;

      const domain = new URL(url).hostname;

      if (pageTitle && thumbnail) {
        content.text = content.text.replace(url, '');
      }
      return { ...content, thumbnail, pageTitle, domain };
    } catch (error) {
      console.error(`Error fetching URL ${url}:`, error);
      return content;
    }
  }

  return content;
}

export const postContent = enhanceAction(
  async ({ integrationId, content }) => {
    const client = getSupabaseServerActionClient();
    const twitter = createTwitterService(client);
    const linkedin = createLinkedInService(client);

    if (content.provider === 'twitter') {
      return await twitter.threadPost({
        integrationId,
        content: content.content,
      });
    } else if (
      content.provider === 'linkedin' &&
      content.type === 'linkedin' &&
      content.content.length > 0 &&
      content.content[0]?.text
    ) {
      return await linkedin.singlePost({
        integrationId,
        content: content.content[0].text,
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
