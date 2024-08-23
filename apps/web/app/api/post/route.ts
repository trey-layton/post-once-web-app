import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getDatabaseWebhookVerifier } from 'node_modules/@kit/database-webhooks/src/server/services/verifier';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { createContentService } from '~/lib/content/content.service';
import { generatedContentSchema } from '~/lib/forms/types/generated-content.schema';
import { createLinkedInService } from '~/lib/integrations/linkedin.service';
import { createTwitterService } from '~/lib/integrations/twitter.service';

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

    if (content.provider === 'twitter') {
      const data = await twitter.threadPost({
        integrationId: body.integration_id,
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
        integrationId: body.integration_id,
        content: content.content[0].text,
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
      generated_content: generatedContentSchema,
      edited_content: generatedContentSchema,
      scheduled: z.string(),
    }),
    auth: false,
  },
);
