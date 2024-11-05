'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerActionClient } from '@kit/supabase/server-actions-client';

import { createContentService } from '~/lib/content/content.service';
import {
  contentProviderSchema,
  contentTypeSchema,
  generatedContentSchema,
  postContentSchema,
} from '~/lib/forms/types/generated-content.schema';
import { baseContentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import { createIntegrationsService } from '~/lib/integrations/integrations.service';
import { createLinkedInService } from '~/lib/integrations/linkedin.service';
import { createTwitterService } from '~/lib/integrations/twitter.service';
import { createProfilesService } from '~/lib/profiles/profiles.service';

import { Readable } from 'stream';
import { ReadableStreamDefaultReader } from 'stream/web';

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

const actionSchema = baseContentHubFormSchema
  .extend({
    accountId: z.string(),
    integrationId: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.beehiivArticleId && !data.pastedContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Either Beehiiv Article or Pasted Content is required',
        path: ['beehiivArticleId'],
      });
    }
    if (data.beehiivArticleId && data.pastedContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cannot provide both Beehiiv Article and Pasted Content',
        path: ['beehiivArticleId'],
      });
    }
  });

  export const generateContent = enhanceAction(
    async ({
      beehiivArticleId,
      pastedContent,
      contentType,
      accountId,
      integrationId,
    }) => {
      const client = getSupabaseServerActionClient();
      const service = createContentService(client);
  
      const {
        data: { session },
      } = await client.auth.getSession();
  
      const requestBody: any = {
        account_id: accountId,
        content_type: contentType,
      };
  
      if (pastedContent && !beehiivArticleId) {
        requestBody.content = pastedContent;
      } else if (beehiivArticleId && !pastedContent) {
        requestBody.post_id = beehiivArticleId;
      } else {
        throw new Error(
          'Exactly one of beehiivArticleId or pastedContent must be provided'
        );
      }
  
      console.log('Request Body:', JSON.stringify(requestBody));
  
      const response = await fetch(`${process.env.API_URL}/generate_content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `generate_content error: ${response.statusText}: ${errorText}`
        );
      }
  
      if (!response.body) {
        throw new Error('Response body is null');
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let done = false;
  
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
  
        if (value) {
          const chunk = decoder.decode(value);
          result += chunk;
  
          let lines = result.split('\n');
          result = lines.pop() || '';
  
          for (const line of lines) {
            if (line.trim()) {
              try {
                const parsedMessage = JSON.parse(line);
                if (
                  parsedMessage.status === 'completed' &&
                  parsedMessage.result
                ) {
                  const parsedResult = generatedContentSchema.safeParse(
                    parsedMessage.result
                  );
  
                  if (!parsedResult.success) {
                    throw new Error(
                      `Validation failed: ${JSON.stringify(
                        parsedResult.error.errors
                      )}`
                    );
                  }
  
                  const generatedContent = parsedResult.data;
                  generatedContent.content = await Promise.all(
                    generatedContent.content.map(async (contentItem) => {
                      const { id } = await service.addContent({
                        accountId,
                        integrationId,
                        status: 'generated',
                        generatedContent: contentItem,
                        contentType,
                      });
  
                      return {
                        ...contentItem,
                        id,
                      };
                    })
                  );
  
                  return generatedContent;
                } else if (parsedMessage.status === 'failed') {
                  throw new Error(
                    `Content generation failed: ${parsedMessage.error}`
                  );
                }
                // Handle other statuses or progress updates if needed
              } catch (e) {
                console.error('Error parsing message:', e);
                // Handle parsing errors here
              }
            }
          }
        }
      }
  
      throw new Error('Content generation did not complete successfully');
    },
    {
      schema: actionSchema,
    }
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