'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button } from '@kit/ui/button';
import { DataTable } from '@kit/ui/data-table';

import { Tables } from '~/lib/database.types';

type Integrations = Tables<'integrations'>;

export default function IntegrationsDataTable(props: { data: Integrations[] }) {
  return <DataTable {...props} columns={getColumns()} />;
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
            <Button variant="outline" size="sm" className="text-sm">
              Delete
            </Button>
          </div>
        );
      },
    },
  ];
}
