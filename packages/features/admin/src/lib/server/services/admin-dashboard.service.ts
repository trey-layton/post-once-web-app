import { SupabaseClient } from '@supabase/supabase-js';

import { sub } from 'date-fns';

import { getLogger } from '@kit/shared/logger';
import { Database } from '@kit/supabase/database';

import { AdminContent } from '../schema/admin-content.schema';

export function createAdminDashboardService(client: SupabaseClient<Database>) {
  return new AdminDashboardService(client);
}

export class AdminDashboardService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  /**
   * Get the dashboard data for the admin dashboard
   * @param count
   */
  async getDashboardData(
    { count }: { count: 'exact' | 'estimated' | 'planned' } = {
      count: 'estimated',
    },
  ) {
    const logger = await getLogger();
    const ctx = {
      name: `admin.dashboard`,
    };

    const selectParams = {
      count,
      head: true,
    };

    const twentyFourHoursAgo = sub(new Date(), { hours: 24 }).toISOString();

    const subscriptionsPromise = this.client
      .from('subscriptions')
      .select('*', selectParams)
      .eq('status', 'active')
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching active subscriptions`,
          );

          throw new Error();
        }

        return response.count;
      });

    const trialsPromise = this.client
      .from('subscriptions')
      .select('*', selectParams)
      .eq('status', 'trialing')
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching trialing subscriptions`,
          );

          throw new Error();
        }

        return response.count;
      });

    const accountsPromise = this.client
      .from('accounts')
      .select('*', selectParams)
      .eq('is_personal_account', true)
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching personal accounts`,
          );

          throw new Error();
        }

        return response.count;
      });

    const accounts24hrPromise = this.client
      .from('accounts')
      .select('*', selectParams)
      .eq('is_personal_account', true)
      .lt('created_at', twentyFourHoursAgo)
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching personal accounts`,
          );

          throw new Error();
        }

        return response.count;
      });

    const teamAccountsPromise = this.client
      .from('accounts')
      .select('*', selectParams)
      .eq('is_personal_account', false)
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching team accounts`,
          );

          throw new Error();
        }

        return response.count;
      });

    const teamAccounts24hrPromise = this.client
      .from('accounts')
      .select('*', selectParams)
      .eq('is_personal_account', false)
      .lt('created_at', twentyFourHoursAgo)
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching team accounts`,
          );

          throw new Error();
        }

        return response.count;
      });

    const topContentAccountsPromise = this.client
      .rpc('get_top_content_accounts')
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching top content accounts`,
          );

          throw new Error();
        }

        return response.data;
      });

    const dailyUsersPromise = fetch(
      `https://us.posthog.com/api/projects/85428/insights/?short_id=8uenEdnC`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}`,
        },
      },
    )
      .then((response) => response.json())
      .then((data) => {
        if (!data.results || !data.results[0]?.result) {
          return [];
        }
        return data.results[0].result[0].data as number[];
      })
      .catch((error) => {
        console.error('Error fetching daily users from PostHog:', error);
        throw error;
      });

    const [
      subscriptions,
      trials,
      accounts,
      prior24hrAccounts,
      teamAccounts,
      prior24hrTeamAccounts,
      topContentAccounts,
      dailyUsers,
    ] = await Promise.all([
      subscriptionsPromise,
      trialsPromise,
      accountsPromise,
      accounts24hrPromise,
      teamAccountsPromise,
      teamAccounts24hrPromise,
      topContentAccountsPromise,
      dailyUsersPromise,
    ]);

    return {
      subscriptions,
      trials,
      accounts,
      prior24hrAccounts,
      teamAccounts,
      prior24hrTeamAccounts,
      topContentAccounts,
      dailyUsers,
    };
  }

  async getGeneratedContent({ page }: { page: number }) {
    const limit = 10;
    const startOffset = (page - 1) * limit;
    const endOffset = startOffset + limit;

    const { data, error, count } = await this.client
      .from('content')
      .select<string, AdminContent>(
        `
        *,
        account_id!inner (
            picture_url,
            name
        ),
        integration_id (
            provider,
            username,
            avatar
        )
        `,
        {
          count: 'exact',
        },
      )
      .order('created_at', { ascending: false })
      .range(startOffset, endOffset);

    if (error) {
      throw error;
    }

    return {
      data: data ?? [],
      count: count ?? 0,
      pageSize: limit,
      page: page,
      pageCount: Math.ceil((count ?? 0) / limit),
    };
  }
}
