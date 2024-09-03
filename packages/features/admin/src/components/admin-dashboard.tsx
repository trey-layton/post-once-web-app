import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { loadAdminDashboard } from '../lib/server/loaders/admin-dashboard.loader';
import { createAdminDashboardService } from '../lib/server/services/admin-dashboard.service';
import { AdminContentDataTable } from './admin-content-data-table';

export async function AdminDashboard({
  contentTablePage,
}: {
  contentTablePage: number;
}) {
  const client = getSupabaseServerComponentClient({ admin: true });
  const service = createAdminDashboardService(client);

  const [data, content] = await Promise.all([
    loadAdminDashboard(),
    service.getGeneratedContent({ page: contentTablePage }),
  ]);

  return (
    <>
      <div
        className={
          'grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3' +
          ' xl:grid-cols-4'
        }
      >
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Daily Active Users</CardTitle>

            <CardDescription>
              Number of users that have been active in the last 24 hours.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>{data.accounts}</Figure>
              <Difference
                currentValue={data?.accounts ?? 0}
                previousValue={data.prior24hrAccounts ?? 0}
                interval={'yesterday'}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Accounts</CardTitle>

            <CardDescription>
              Accounts with the most posts generated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topContentAccounts.map((account, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="text-muted-foreground">{index + 1}.</div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={account.picture_url ?? ''} />
                    <AvatarFallback>
                      {account.name ? account.name[0] : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {account.name}
                  </div>
                </div>
                <div className="text-muted-foreground flex-shrink-0 text-end">
                  {account.content[0]?.count ?? 0} posts
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>MRR</CardTitle>
            <CardDescription>
              Monthly recurring revenue from past 30 days.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>${data.subscriptions?.toFixed(2)}</Figure>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>ARR</CardTitle>

            <CardDescription>
              Annual recurring revenue from past 365 days.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>${data.trials?.toFixed(2)}</Figure>
            </div>
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Total Users</CardTitle>

            <CardDescription>
              The number of personal accounts that have been created.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>{data.accounts}</Figure>
              <Difference
                currentValue={data?.accounts ?? 0}
                previousValue={data.prior24hrAccounts ?? 0}
                interval={'yesterday'}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Team Accounts</CardTitle>

            <CardDescription>
              The number of team accounts that have been created.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>{data.teamAccounts}</Figure>
              <Difference
                currentValue={data?.teamAccounts ?? 0}
                previousValue={data.prior24hrTeamAccounts ?? 0}
                interval={'yesterday'}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Paying Customers</CardTitle>
            <CardDescription>
              The number of paying customers with active subscriptions.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>{data.subscriptions}</Figure>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Trials</CardTitle>

            <CardDescription>
              The number of trial subscriptions currently active.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1">
            <div className={'flex items-end justify-start gap-3'}>
              <Figure>{data.trials}</Figure>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="py-4">
        <h2 className="my-2 text-xl font-semibold">Generated Content</h2>
        <AdminContentDataTable
          pageIndex={contentTablePage - 1}
          pageCount={content.pageCount}
          pageSize={content.pageSize}
          data={content.data}
        />
      </div>
    </>
  );
}

function Figure(props: React.PropsWithChildren) {
  return <div className={'text-3xl font-bold'}>{props.children}</div>;
}

function Difference({
  currentValue,
  previousValue,
  interval,
}: {
  currentValue: number;
  previousValue: number;
  interval: 'yesterday' | 'last week' | 'last month';
}) {
  const difference = currentValue - previousValue;

  let percentage;
  if (previousValue === 0) {
    percentage = currentValue > 0 ? 100 : currentValue < 0 ? -100 : 0;
  } else {
    percentage = (difference / previousValue) * 100;
  }

  return (
    <p className="text-muted-foreground pb-1 text-xs">
      <span
        className={
          percentage > 0
            ? 'text-green-500'
            : percentage === 0
              ? 'text-inherit'
              : 'text-red-500'
        }
      >{`${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`}</span>
      <span>
        {' '}
        from {interval} ({difference > 0 ? '+' : ''}
        {difference})
      </span>
    </p>
  );
}
