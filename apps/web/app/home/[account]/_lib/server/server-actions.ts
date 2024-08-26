'use server';

import { revalidatePath } from 'next/cache';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

import { createContentService } from '~/lib/content/content.service';
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
  async ({ beehiivArticleId, contentType, accountId, integrationId }) => {
    const client = getSupabaseServerActionClient();
    const service = createContentService(client);

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

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Unable to read stream');
      }

      let accumulatedChunks = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedChunks += chunk;
      }

      const jsonObjects = accumulatedChunks.split('\n').filter(Boolean);

      let finalResult;
      try {
        const lastJsonObject = jsonObjects[jsonObjects.length - 1];
        if (lastJsonObject === undefined) {
          throw new Error('No valid JSON objects found in the response');
        }
        finalResult = JSON.parse(lastJsonObject);
      } catch (error) {
        console.error('Error parsing final chunk:', error);
        throw new Error(`Failed to parse the generated content: ${error}`);
      }

      if (finalResult.status === 'completed' && finalResult.result) {
        let generatedContent;
        let contentId;
        try {
          generatedContent = generatedContentSchema.parse(finalResult.result);

          const { id } = await service.addContent({
            accountId,
            integrationId,
            status: 'generated',
            generatedContent: generatedContent,
          });
          contentId = id;
        } catch (error) {
          console.error('Error parsing generated content:', error);
          throw new Error('Generated content does not match expected schema');
        }

        return {
          ...generatedContent,
          id: contentId,
          content: await Promise.all(
            generatedContent.content.map(getLinkMetaData),
          ),
        };
      } else {
        throw new Error('Content generation did not complete successfully');
      }
    } catch (error) {
      throw new Error('Failed to generate content.');
    }
  },
  {
    schema: contentHubFormSchema.extend({
      accountId: z.string(),
      integrationId: z.string(),
    }),
  },
);

async function getLinkMetaData(
  content: z.infer<typeof generatedContentSchema>['content'][number],
  timeout = 3000,
) {
  const urlMatch = content.text.match(/(https?:\/\/[^\s]+)/g);
  const url = urlMatch ? urlMatch[0] : null;

  if (url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      if (!html) return content;

      const pageTitle =
        html.match(/<meta property="og:title" content="([^"]+)"\/?>/i)?.[1] ??
        html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
        undefined;

      const thumbnail =
        html.match(/<meta property="og:image" content="([^"]+)"\/?>/i)?.[1] ??
        undefined;

      const domain = new URL(url).hostname;

      if (pageTitle && thumbnail) {
        content.text = content.text.replace(url, '');
      }
      return { ...content, thumbnail, pageTitle, domain };
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        console.warn(`Fetch for URL ${url} aborted due to timeout`);
      } else {
        console.error(`Error fetching URL ${url}:`, error);
      }
      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return content;
}

export const postContent = enhanceAction(
  async ({ integrationId, content }) => {
    const client = getSupabaseServerActionClient();
    const twitter = createTwitterService(client);
    const linkedin = createLinkedInService(client);
    const contentService = createContentService(client);

    let postedUrl: string | undefined;

    if (content.provider === 'twitter') {
      const data = await twitter.threadPost({
        integrationId,
        content: content.content,
      });
      postedUrl = data.link;
    } else if (
      content.provider === 'linkedin' &&
      content.type === 'linkedin' &&
      content.content.length > 0 &&
      content.content[0]?.text
    ) {
      const data = await linkedin.singlePost({
        integrationId,
        content: content.content[0].text,
      });
      postedUrl = data.link;
    }

    await contentService.updateContent({
      id: content.id,
      status: 'posted',
      postedUrl,
      editedContent: content,
    });
    revalidatePath('/home/[account]/content', 'page');

    return {
      link: postedUrl,
    };
  },
  {
    schema: z.object({
      integrationId: z.string(),
      content: generatedContentSchema.extend({
        id: z.string(),
      }),
    }),
  },
);

export const scheduleContent = enhanceAction(
  async ({ content, scheduledTime }) => {
    const client = getSupabaseServerActionClient();
    const contentService = createContentService(client);

    await contentService.updateContent({
      id: content.id,
      status: 'scheduled',
      editedContent: content,
      scheduledAt: scheduledTime,
    });

    revalidatePath('/home/[account]/content', 'page');
  },
  {
    schema: z.object({
      integrationId: z.string(),
      content: generatedContentSchema.extend({
        id: z.string(),
      }),
      scheduledTime: z.string(),
    }),
  },
);
