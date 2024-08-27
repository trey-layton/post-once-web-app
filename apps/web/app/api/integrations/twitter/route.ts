import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createHmac } from 'crypto';
import OAuth from 'oauth-1.0a';
import { z } from 'zod';

import { getSupabaseRouteHandlerClient } from '@kit/supabase/route-handler-client';

import { loadTeamWorkspace } from '~/home/[account]/_lib/server/team-account-workspace.loader';
import { createIntegrationsService } from '~/lib/integrations/integrations.service';

//!HANDLE ERRORS

export const revalidate = 0;

const oauth = new OAuth({
  consumer: {
    key: process.env.TWITTER_API_KEY!,
    secret: process.env.TWITTER_API_KEY_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) =>
    createHmac('sha1', key).update(baseString).digest('base64'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oauthToken = searchParams.get('oauth_token');
  const oauthVerifier = searchParams.get('oauth_verifier');
  const oauthTokenSecret = cookies().get('oauth_token_secret')?.value;
  const slug = cookies().get('slug')?.value;

  if (!oauthToken || !oauthVerifier || !oauthTokenSecret || !slug) {
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  const accessRequest = {
    url: 'https://api.twitter.com/oauth/access_token',
    method: 'POST',
    data: { oauth_token: oauthToken, oauth_verifier: oauthVerifier },
  };

  const accessResponse = await fetch(accessRequest.url, {
    method: accessRequest.method,
    headers: {
      ...oauth.toHeader(
        oauth.authorize(accessRequest, {
          key: oauthToken,
          secret: oauthTokenSecret,
        }),
      ),
    },
  });

  const text = await accessResponse.text();
  const data = new URLSearchParams(text);
  const accessToken = data.get('oauth_token') ?? '';
  const accessTokenSecret = data.get('oauth_token_secret') ?? '';

  if (!accessToken || !accessTokenSecret) {
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  const credentialsRequest = {
    url: 'https://api.twitter.com/1.1/account/verify_credentials.json',
    method: 'GET',
  };

  const credentialsResponse = await fetch(credentialsRequest.url, {
    method: credentialsRequest.method,
    headers: {
      ...oauth.toHeader(
        oauth.authorize(credentialsRequest, {
          key: accessToken,
          secret: accessTokenSecret,
        }),
      ),
    },
  });

  const credentials = z
    .object({
      screen_name: z.string(),
      profile_image_url: z.string(),
    })
    .parse(await credentialsResponse.json());

  try {
    const client = getSupabaseRouteHandlerClient({ admin: true });
    const integrationsService = createIntegrationsService(client);

    const { account } = await loadTeamWorkspace(slug);

    await integrationsService.addIntegration({
      accountId: account.id,
      provider: 'twitter',
      accessToken: accessToken,
      refreshToken: accessTokenSecret,
      username: credentials.screen_name,
      avatar: credentials.profile_image_url,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
  }

  cookies().delete('oauth_token_secret');
  cookies().delete('slug');

  return NextResponse.redirect(new URL(`/home/${slug}`, request.url));
}
