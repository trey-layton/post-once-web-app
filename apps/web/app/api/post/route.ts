import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getDatabaseWebhookVerifier } from 'node_modules/@kit/database-webhooks/src/server/services/verifier';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { createContentService } from '~/lib/content/content.service';
import {
  contentTypeSchema,
  postContentSchema,
} from '~/lib/forms/types/generated-content.schema';
import { createLinkedInService } from '~/lib/integrations/linkedin.service';
import { createTwitterService } from '~/lib/integrations/twitter.service';

export const maxDuration = 60;

export const POST = enhanceRouteHandler(
  async function ({ body, request }) {
    const verifier = await getDatabaseWebhookVerifier();
    await verifier.verifySignatureOrThrow(request);

    const client = getSupabaseRouteHandlerClient({
      admin: true,
    });
    const twitter = createTwitterService(client);
    const linkedin = createLinkedInService(client);
    const contentService = createContentService(client);

    const content = body.edited_content ?? body.generated_content;

    let postedUrl: string | undefined;

    if (
      body.content_type === 'precta_tweet' ||
      body.content_type === 'postcta_tweet' ||
      body.content_type === 'thread_tweet' ||
      body.content_type === 'long_form_tweet' ||
      body.content_type === 'image_list'
    ) {
      const data = await twitter.threadPost({
        integrationId: body.integration_id,
        content: content.post_content,
      });
      postedUrl = data.link;
    } else if (
      body.content_type === 'linkedin_long_form_post' &&
      content.post_content.length > 0 &&
      content.post_content[0]?.post_content
    ) {
      const data = await linkedin.singlePost({
        integrationId: body.integration_id,
        content: content.post_content[0].post_content,
      });
      postedUrl = data.link;
    }

    await contentService.updateContent({
      id: body.id,
      status: 'posted',
      postedUrl,
      editedContent: content,
    });
    revalidatePath('/home/[account]/content', 'page');

    return NextResponse.json({
      link: postedUrl,
    });
  },
  {
    schema: z.object({
      id: z.string(),
      account_id: z.string(),
      integration_id: z.string(),
      generated_content: postContentSchema,
      edited_content: postContentSchema,
      content_type: contentTypeSchema,
      scheduled: z.string(),
    }),
    auth: false,
  },
);
