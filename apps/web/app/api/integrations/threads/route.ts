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
    return NextResponse.redirect(
      new URL(`/home/${slug}/integrations`, request.url),
    );
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

  if (!shortLivedTokenResponse.ok) {
    const errorData = await shortLivedTokenResponse.json();
    console.error('Failed to fetch short-lived token:', errorData);
    return NextResponse.json(
      { error: 'Failed to fetch short-lived token', details: errorData },
      { status: shortLivedTokenResponse.status },
    );
  }

  const shortLivedTokenJson = await shortLivedTokenResponse.json();
  const shortLivedTokenData = z
    .object({ access_token: z.string(), user_id: z.number() })
    .safeParse(shortLivedTokenJson);

  if (!shortLivedTokenData.success) {
    console.error(
      'Failed to parse short-lived token:',
      shortLivedTokenData.error,
    );
    return NextResponse.json(
      {
        error: 'Failed to parse short-lived token',
        details: shortLivedTokenData.error,
        json: shortLivedTokenJson,
      },
      { status: 500 },
    );
  }

  const longLivedTokenResponse = await fetch(
    `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_CLIENT_SECRET}&access_token=${shortLivedTokenData.data.access_token}`,
    {
      method: 'GET',
    },
  );

  if (!longLivedTokenResponse.ok) {
    const errorData = await longLivedTokenResponse.json();
    console.error('Failed to fetch long-lived token:', errorData);
    return NextResponse.json(
      { error: 'Failed to fetch long-lived token', details: errorData },
      { status: longLivedTokenResponse.status },
    );
  }

  const longLivedTokenJson = await longLivedTokenResponse.json();
  const longLivedTokenData = z
    .object({ access_token: z.string(), expires_in: z.number() })
    .safeParse(longLivedTokenJson);

  if (!longLivedTokenData.success) {
    console.error(
      'Failed to parse long-lived token:',
      longLivedTokenData.error,
    );
    return NextResponse.json(
      {
        error: 'Failed to parse long-lived token',
        details: longLivedTokenData.error,
        json: longLivedTokenJson,
      },
      { status: 500 },
    );
  }

  const userInfoResponse = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${longLivedTokenData.data.access_token}`,
    {
      method: 'GET',
    },
  );

  if (!userInfoResponse.ok) {
    const errorData = await userInfoResponse.json();
    console.error('Failed to fetch user info:', errorData);
    return NextResponse.json(
      { error: 'Failed to fetch user info', details: errorData },
      { status: userInfoResponse.status },
    );
  }

  const userInfoJson = await userInfoResponse.json();
  const userInfo = z
    .object({
      id: z.string(),
      username: z.string(),
      threads_profile_picture_url: z.string().optional(),
      threads_biography: z.string().optional(),
    })
    .safeParse(userInfoJson);

  if (!userInfo.success) {
    console.error('Failed to parse user info:', userInfo.error);
    return NextResponse.json(
      {
        error: 'Failed to parse user info',
        details: userInfo.error,
        json: userInfoJson,
      },
      { status: 500 },
    );
  }

  const client = getSupabaseRouteHandlerClient({ admin: true });
  const integrationsService = createIntegrationsService(client);

  try {
    await integrationsService.addIntegration({
      accountId: account,
      provider: 'threads',
      accessToken: longLivedTokenData.data.access_token,
      expiresIn: longLivedTokenData.data.expires_in,
      username: userInfo.data.username,
      avatar: userInfo.data.threads_profile_picture_url,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL(`/home/${slug}/integrations`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/home/${slug}/integrations`, request.url),
  );
}
