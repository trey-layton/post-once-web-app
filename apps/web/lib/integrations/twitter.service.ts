import 'server-only';

import { SupabaseClient } from '@supabase/supabase-js';

import { createHmac } from 'crypto';
import OAuth from 'oauth-1.0a';
import { z } from 'zod';

import { Database } from '~/lib/database.types';

import { GeneratedContent } from '../forms/types/generated-content.schema';

const oauth = new OAuth({
  consumer: {
    key: process.env.TWITTER_API_KEY!,
    secret: process.env.TWITTER_API_KEY_SECRET!,
  },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) =>
    createHmac('sha1', key).update(baseString).digest('base64'),
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createTwitterService(client: SupabaseClient<Database>) {
  return new TwitterService(client);
}

class TwitterService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getOAuth1Tokens() {
    const request = {
      url: 'https://api.twitter.com/oauth/request_token',
      method: 'POST',
      data: { oauth_callback: process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI },
    };

    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        ...oauth.toHeader(oauth.authorize(request, { key: '', secret: '' })),
      },
    });

    const data = new URLSearchParams(await response.text());
    const oauthToken = data.get('oauth_token') ?? '';
    const oauthTokenSecret = data.get('oauth_token_secret') ?? '';

    return { oauthToken, oauthTokenSecret };
  }

  async refreshAccessTokenOAuth2(params: { integrationId: string }) {
    const { data: integration, error } = await this.client
      .from('integrations')
      .select('*')
      .eq('id', params.integrationId)
      .single();

    if (error || !integration) {
      throw error;
    }

    const basicAuthToken = Buffer.from(
      `${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
      'utf8',
    ).toString('base64');

    const tokenResponse = await fetch(
      'https://api.twitter.com/2/oauth2/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuthToken}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: integration.refresh_token ?? '',
        }),
      },
    );

    const tokenData = z
      .object({
        access_token: z.string(),
        expires_in: z.number(),
        refresh_token: z.string(),
      })
      .parse(await tokenResponse.json());

    const { data } = await this.client
      .from('integrations')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
      })
      .eq('id', params.integrationId)
      .select('*')
      .single();

    if (error || !data) {
      throw error;
    }

    return data;
  }

  async threadPostOAuth2(params: {
    content: GeneratedContent['content'];
    integrationId: string;
  }) {
    const integration = await this.refreshAccessTokenOAuth2({
      integrationId: params.integrationId,
    });

    let firstTweetId: string | null = null;
    let previousTweetId: string | null = null;

    for (const tweetContent of params.content) {
      if (tweetContent.type === 'quote_tweet') {
        continue;
      }

      const response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: tweetContent.text,
          ...(previousTweetId && {
            reply: { in_reply_to_tweet_id: previousTweetId },
          }),
        }),
      });

      const tweet = z
        .object({
          id: z.string(),
        })
        .parse((await response.json()).data);

      if (!firstTweetId) {
        firstTweetId = tweet.id;
      }
      previousTweetId = tweet.id;
      await delay(4000);
    }

    for (const tweetContent of params.content) {
      if (tweetContent.type === 'quote_tweet') {
        await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${integration.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: tweetContent.text,
            quote_tweet_id: firstTweetId,
          }),
        });

        break;
      }
    }

    return {
      link: `https://twitter.com/user/status/${firstTweetId}`,
    };
  }

  async threadPost(params: {
    content: GeneratedContent['content'];
    integrationId: string;
  }) {
    const { data: integration, error } = await this.client
      .from('integrations')
      .select('*')
      .eq('id', params.integrationId)
      .single();

    if (error || !integration) {
      throw error;
    }

    let firstTweetId: string | null = null;
    let previousTweetId: string | null = null;

    for (const tweetContent of params.content) {
      if (tweetContent.type === 'quote_tweet') {
        continue;
      }

      const request = {
        url: 'https://api.twitter.com/2/tweets',
        method: 'POST',
        body: {
          text: tweetContent.text,
          ...(previousTweetId && {
            reply: { in_reply_to_tweet_id: previousTweetId },
          }),
        },
      };

      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          ...oauth.toHeader(
            oauth.authorize(request, {
              key: integration.access_token,
              secret: integration.refresh_token ?? '',
            }),
          ),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.body),
      });

      const tweet = z
        .object({
          id: z.string(),
        })
        .parse((await response.json()).data);

      if (!firstTweetId) {
        firstTweetId = tweet.id;
      }
      previousTweetId = tweet.id;
      await delay(4000);
    }

    for (const tweetContent of params.content) {
      if (tweetContent.type === 'quote_tweet') {
        const quoteRequest = {
          url: 'https://api.twitter.com/2/tweets',
          method: 'POST',
          body: {
            text: tweetContent.text,
            quote_tweet_id: firstTweetId,
          },
        };

        await fetch(quoteRequest.url, {
          method: quoteRequest.method,
          headers: {
            ...oauth.toHeader(
              oauth.authorize(quoteRequest, {
                key: integration.access_token,
                secret: integration.refresh_token ?? '',
              }),
            ),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quoteRequest.body),
        });

        break;
      }
    }
    return {
      link: `https://twitter.com/user/status/${firstTweetId}`,
    };
  }
}
