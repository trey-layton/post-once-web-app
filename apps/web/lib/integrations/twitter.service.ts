import { SupabaseClient } from '@supabase/supabase-js';

import { z } from 'zod';

import { Database } from '~/lib/database.types';

export function createTwitterService(client: SupabaseClient<Database>) {
  return new TwitterService(client);
}

class TwitterService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async refreshAccessToken(params: { integrationId: string }) {
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

  async singlePost(params: { content: string; integrationId: string }) {
    const integration = await this.refreshAccessToken({
      integrationId: params.integrationId,
    });

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: params.content,
      }),
    });

    const tweet = z
      .object({
        id: z.string(),
      })
      .parse((await response.json()).data);

    return {
      link: `https://twitter.com/${integration.username}/status/${tweet.id}`,
    };
  }

  async threadPost(params: {
    content: { text: string; type: string }[];
    integrationId: string;
  }) {
    const integration = await this.refreshAccessToken({
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
      link: `https://twitter.com/${integration.username}/status/${firstTweetId}`,
    };
  }
}
