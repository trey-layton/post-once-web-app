'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

import { createContentService } from '~/lib/content/content.service';
import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import {
  contentProviderSchema,
  contentTypeSchema,
  generatedContentSchema,
  postContentSchema,
} from '~/lib/forms/types/generated-content.schema';
import { createIntegrationsService } from '~/lib/integrations/integrations.service';
import { createLinkedInService } from '~/lib/integrations/linkedin.service';
import { createTwitterService } from '~/lib/integrations/twitter.service';
import { createProfilesService } from '~/lib/profiles/profiles.service';

export const addBeehiivApiKey = enhanceAction(
  async (data) => {
    const client = getSupabaseServerActionClient();
    const service = createProfilesService(client);

    await service.addBeehiivApiKey(data);

    revalidatePath('/home/[account]', 'page');
    revalidatePath('/home/[account]/settings', 'page');
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
      throw new Error(`generate_content error: ${response.statusText}`);
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

    console.warn('Final result:', JSON.stringify(finalResult, null, 2));

    if (finalResult.status === 'completed' && finalResult.result) {
      let generatedContent;

      const parsedResult = generatedContentSchema.safeParse(finalResult.result);

      if (!parsedResult.success) {
        console.error('ZodError:', parsedResult.error.errors);
        console.error('Invalid input:', finalResult.result);

        throw new Error(
          `Validation failed. Error details: ${JSON.stringify(parsedResult.error.errors, null, 2)}. Invalid object: ${JSON.stringify(finalResult.result, null, 2)}`,
        );
      } else {
        generatedContent = parsedResult.data;
      }

      generatedContent.content = await Promise.all(
        generatedContent.content.map(async (content) => {
          const { id } = await service.addContent({
            accountId,
            integrationId,
            status: 'generated',
            generatedContent: content,
            contentType,
          });

          return {
            ...content,
            id,
          };
        }),
      );

      return {
        ...generatedContent,
        content: await Promise.all(
          generatedContent.content.map(getLinkMetaData),
        ),
      };
    } else {
      throw new Error('Content generation did not complete successfully');
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
  content.post_content = await Promise.all(
    content.post_content.map(async (post) => {
      const urlMatch = post.post_content.match(/(https?:\/\/[^\s]+)/g);
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
          if (!html) return post;

          const pageTitle =
            html.match(
              /<meta property="og:title" content="([^"]+)"\/?>/i,
            )?.[1] ??
            html.match(/<title>([^<]+)<\/title>/i)?.[1] ??
            undefined;

          const thumbnail =
            html.match(
              /<meta property="og:image" content="([^"]+)"\/?>/i,
            )?.[1] ?? undefined;

          const domain = new URL(url).hostname;

          if (pageTitle && thumbnail) {
            post.post_content = post.post_content.replace(url, '');
          }

          return { ...post, thumbnail, pageTitle, domain };
        } catch (error) {
          if ((error as Error)?.name === 'AbortError') {
            console.warn(`Fetch for URL ${url} aborted due to timeout`);
          } else {
            console.error(`Error fetching URL ${url}:`, error);
          }
          return post;
        } finally {
          clearTimeout(timeoutId);
        }
      }

      return post;
    }),
  );

  return content;
}

export const postContent = enhanceAction(
  async ({ integrationId, content, contentId, provider, contentType }) => {
    const client = getSupabaseServerActionClient();
    const twitter = createTwitterService(client);
    const linkedin = createLinkedInService(client);
    const contentService = createContentService(client);

    let postedUrl: string | undefined;

    if (provider === 'twitter') {
      const data = await twitter.threadPost({
        integrationId,
        content: content.post_content,
      });
      postedUrl = data.link;
    } else if (
      provider === 'linkedin' &&
      contentType === 'long_form_post' &&
      content.post_content.length > 0 &&
      content.post_content[0]?.post_content
    ) {
      const data = await linkedin.singlePost({
        integrationId,
        content: content.post_content[0].post_content,
      });
      postedUrl = data.link;
    }

    await contentService.updateContent({
      id: contentId,
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
      contentId: z.string(),
      content: postContentSchema,
      provider: contentProviderSchema,
      contentType: contentTypeSchema,
    }),
  },
);

export const scheduleContent = enhanceAction(
  async ({ content, contentId, scheduledTime }) => {
    const client = getSupabaseServerActionClient();
    const contentService = createContentService(client);

    await contentService.updateContent({
      id: contentId,
      status: 'scheduled',
      editedContent: content,
      scheduledAt: scheduledTime,
    });

    revalidatePath('/home/[account]/content', 'page');
  },
  {
    schema: z.object({
      contentId: z.string(),
      content: postContentSchema,
      scheduledTime: z.string(),
    }),
  },
);

export const getTwitterOAuth1Tokens = enhanceAction(
  async (params) => {
    const twitter = createTwitterService(getSupabaseServerActionClient());
    const tokens = await twitter.getOAuth1Tokens();

    cookies().set('oauth_token_secret', tokens.oauthTokenSecret);
    cookies().set('slug', params.slug);

    redirect(
      `https://api.twitter.com/oauth/authenticate?oauth_token=${tokens.oauthToken}`,
    );
  },
  {
    schema: z.object({
      slug: z.string(),
    }),
  },
);

export const deleteIntegration = enhanceAction(
  async ({ id }) => {
    const client = getSupabaseServerActionClient();
    const service = createIntegrationsService(client);

    await service.deleteIntegration({ id });

    revalidatePath('/home/[account]', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);

export const unscheduleContent = enhanceAction(
  async ({ id }) => {
    const client = getSupabaseServerActionClient();
    const contentService = createContentService(client);

    await contentService.updateContent({
      id,
      status: 'generated',
      scheduledAt: null,
    });

    revalidatePath('/home/[account]/content', 'page');
  },
  {
    schema: z.object({
      id: z.string(),
    }),
  },
);
