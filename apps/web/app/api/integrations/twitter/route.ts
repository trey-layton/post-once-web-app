import { NextResponse } from 'next/server';

import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

//!HANDLE ERRORS

export const revalidate = 0;

const codeVerifier =
  'a4c2a3b5ae3dfc053b65f077c23f9b81cd2889c2ccb0e36ec5532c554bd68758';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const account = searchParams.get('account');
  const slug = searchParams.get('slug');

  if (!code || !account || !slug) {
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  const basicAuthToken = Buffer.from(
    `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
    'utf8',
  ).toString('base64');

  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuthToken}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI}?account=${account}&slug=${slug}`,
      code_verifier: codeVerifier,
    }),
  });

  const token = await tokenResponse.json();

  const tokenData = z
    .object({
      access_token: z.string(),
      expires_in: z.number(),
      refresh_token: z.string(),
    })
    .parse(token);

  const client = getSupabaseRouteHandlerClient({ admin: true });
  const integrationsService = createIntegrationsService(client);

  const userInfoResponse = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url',
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );

  const userInfo = z
    .object({
      username: z.string(),
      name: z.string(),
      profile_image_url: z.string(),
    })
    .parse((await userInfoResponse.json()).data);

  try {
    await integrationsService.addIntegration({
      accountId: account,
      provider: 'twitter',
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      username: userInfo.username,
      avatar: userInfo.profile_image_url,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
}
