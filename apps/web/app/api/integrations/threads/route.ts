import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

//!HANDLE ERRORS

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  let account = '';
  let slug = '';
  if (state) {
    try {
      const parsedState = JSON.parse(decodeURIComponent(state));
      account = parsedState.account;
      slug = parsedState.slug;
    } catch (error) {
      console.error('Failed to parse state:', error);
      return NextResponse.json(
        { error: 'Failed to parse state' },
        { status: 400 },
      );
    }
  }

  if (!code || !account || !slug) {
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  const shortLivedTokenResponse = await fetch(
    'https://graph.threads.net/oauth/access_token',
    {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_THREADS_CLIENT_ID ?? '',
        client_secret: process.env.THREADS_CLIENT_SECRET ?? '',
        grant_type: 'authorization_code',
        redirect_uri: process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI ?? '',
        code,
      }),
    },
  );

  const shortLivedTokenData = z
    .object({ access_token: z.string(), user_id: z.number() })
    .parse(await shortLivedTokenResponse.json());

  const longLivedTokenResponse = await fetch(
    `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${shortLivedTokenData.access_token}`,
    {
      method: 'GET',
    },
  );

  const longLivedTokenData = z
    .object({ access_token: z.string(), expires_in: z.number() })
    .parse(await longLivedTokenResponse.json());

  const userInfoResponse = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${longLivedTokenData.access_token}`,
    {
      method: 'GET',
    },
  );

  const userInfo = z
    .object({
      id: z.string(),
      username: z.string(),
      threads_profile_picture_url: z.string().optional(),
      threads_biography: z.string().optional(),
    })
    .parse(await userInfoResponse.json());

  const client = getSupabaseRouteHandlerClient({ admin: true });
  const integrationsService = createIntegrationsService(client);

  try {
    await integrationsService.addIntegration({
      accountId: account,
      provider: 'threads',
      accessToken: longLivedTokenData.access_token,
      expiresIn: longLivedTokenData.expires_in,
      username: userInfo.username,
      avatar: userInfo.threads_profile_picture_url,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
}
