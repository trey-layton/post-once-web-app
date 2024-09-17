'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button, buttonVariants } from '@kit/ui/button';
import { DataTable } from '@kit/ui/data-table';
import { cn } from '@kit/ui/utils';

import { Tables } from '~/lib/database.types';

import { getTwitterOAuth1Tokens } from '../_lib/server/server-actions';

type Integrations = Pick<
  Tables<'integrations'>,
  'id' | 'avatar' | 'provider' | 'username'
>;

export default function IntegrationsDataTable({
  data,
  provider,
  slug,
}: {
  data: Integrations[];
  provider: {
    label: string;
    icon: JSX.Element;
    authUrl?: string;
    name: string;
    disabled?: boolean;
  };
  slug: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {provider.icon}
          <h3 className="text-base font-semibold">{provider.label}</h3>
        </div>
        {provider.disabled !== true ? (
          provider.name !== 'twitter' ? (
            <a
              href={provider.authUrl}
              className={cn(buttonVariants({ size: 'sm' }), 'w-fit text-sm')}
            >
              Connect
            </a>
          ) : (
            <Button
              size="sm"
              className="w-fit text-sm"
              onClick={() => getTwitterOAuth1Tokens({ slug })}
            >
              Connect
            </Button>
          )
        ) : (
          <Button size="sm" className="w-fit text-sm" disabled>
            Coming Soon
          </Button>
        )}
      </div>

      <DataTable
        data={data}
        columns={getColumns()}
        noDataMessage="No accounts added"
      />
    </div>
  );
}

function getColumns(): ColumnDef<Integrations>[] {
  return [
    {
      header: 'Accounts',
      cell({ row }) {
        const integration = row.original;

        return (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={integration.avatar ?? ''} />
              <AvatarFallback>
                {integration.username ? integration.username[0] : '?'}
              </AvatarFallback>
            </Avatar>
            {integration.username}
          </div>
        );
      },
    },
    {
      header: '',
      id: 'actions',
      cell() {
        return (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-sm" disabled>
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}
