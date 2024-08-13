import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

//!HANDLE ERRORS

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const account = searchParams.get('account');
  const slug = searchParams.get('slug');

  if (!code || !account || !slug) {
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  const tokenResponse = await fetch(
    'https://www.linkedin.com/oauth/v2/accessToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri:
          `${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}?account=${account}&slug=${slug}` ??
          '',
        client_id: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID ?? '',
        client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? '',
      }),
    },
  );

  const tokenData = z
    .object({
      access_token: z.string(),
      expires_in: z.number(),
    })
    .parse(await tokenResponse.json());

  const client = getSupabaseRouteHandlerClient({ admin: true });
  const integrationsService = createIntegrationsService(client);

  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
    },
  });

  const userInfo = z
    .object({
      email: z.string(),
      name: z.string(),
      picture: z.string(),
      sub: z.string(),
    })
    .parse(await userInfoResponse.json());

  try {
    await integrationsService.addIntegration({
      accountId: account,
      provider: 'linkedin',
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      username: userInfo.name,
      avatar: userInfo.picture,
      providerUserId: userInfo.sub,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
}
