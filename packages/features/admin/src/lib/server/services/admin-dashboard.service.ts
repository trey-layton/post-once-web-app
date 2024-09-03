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

    //!INEFFICIENT QUERY, WAITING FOR FIX OR USE RPC
    //!https://github.com/supabase/supabase-js/issues/971
    const topContentAccountsPromise = this.client
      .from('accounts')
      .select(
        `
        picture_url,
        name,
        content(count)
        `,
      )
      .eq('is_personal_account', false)
      .then((response) => {
        if (response.error) {
          logger.error(
            { ...ctx, error: response.error.message },
            `Error fetching top content accounts`,
          );

          throw new Error();
        }

        response.data.sort((a, b) =>
          b.content.length > 0
            ? (b.content[0]?.count ?? 0 - a.content.length > 0)
              ? (a.content[0]?.count ?? 0)
              : 0
            : 0,
        );

        return response.data.slice(0, 2);
      });

    const [
      subscriptions,
      trials,
      accounts,
      prior24hrAccounts,
      teamAccounts,
      prior24hrTeamAccounts,
      topContentAccounts,
    ] = await Promise.all([
      subscriptionsPromise,
      trialsPromise,
      accountsPromise,
      accounts24hrPromise,
      teamAccountsPromise,
      teamAccounts24hrPromise,
      topContentAccountsPromise,
    ]);

    return {
      subscriptions,
      trials,
      accounts,
      prior24hrAccounts,
      teamAccounts,
      prior24hrTeamAccounts,
      topContentAccounts,
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
