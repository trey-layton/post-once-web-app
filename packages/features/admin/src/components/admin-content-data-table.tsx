'use client';

import Link from 'next/link';

import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button } from '@kit/ui/button';
import { Dialog, DialogTrigger } from '@kit/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { DataTable } from '@kit/ui/enhanced-data-table';

import { AdminContent } from '../lib/server/schema/admin-content.schema';
import ContentDialogContent from './content-dialog-content';
import ContentStatusBadge from './content-status-badge';
import ThreadsLogoIcon from './threads-logo-icon';
import XLogoIcon from './x-logo-icon';

export function AdminContentDataTable(props: {
  data: AdminContent[];
  pageSize: number;
  pageIndex: number;
  pageCount: number;
}) {
  return <DataTable {...props} columns={getColumns()} />;
}

function getColumns(): ColumnDef<AdminContent>[] {
  return [
    {
      header: 'Team',
      cell({ row: { original: content } }) {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={content.account_id.picture_url ?? ''} />
              <AvatarFallback>
                {content.account_id.name ? content.account_id.name[0] : '?'}
              </AvatarFallback>
            </Avatar>
            {content.account_id.name}
          </div>
        );
      },
    },
    {
      header: 'Generated On',
      cell({ row }) {
        return getDateString(row.original.created_at);
      },
    },
    {
      header: 'Account',
      cell({ row: { original: content } }) {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={content.integration_id.avatar ?? ''} />
              <AvatarFallback>
                {content.integration_id.username
                  ? content.integration_id.username[0]
                  : '?'}
              </AvatarFallback>
            </Avatar>
            {content.integration_id.username}
            {content.integration_id.provider === 'twitter' ? (
              <XLogoIcon className="h-3 w-3" />
            ) : content.integration_id.provider === 'linkedin' ? (
              <LinkedInLogoIcon className="h-3 w-3" />
            ) : (
              <ThreadsLogoIcon className="h-3 w-3" />
            )}
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell({ row: { original: content } }) {
        return (
          <ContentStatusBadge
            status={content.status}
            scheduledAt={
              content.scheduled_at
                ? getDateString(content.scheduled_at)
                : undefined
            }
          />
        );
      },
    },
    {
      header: '',
      id: 'actions',
      cell({ row: { original: content } }) {
        return (
          <div className="flex w-full justify-end">
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Manage</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="mx-4 w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(content.id)}
                      title={content.id}
                    >
                      Copy Content ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(content.account_id.id)
                      }
                      title={content.account_id.id}
                    >
                      Copy Account ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(content.integration_id.id)
                      }
                      title={content.integration_id.id}
                    >
                      Copy Integration ID
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DialogTrigger asChild>
                      <DropdownMenuItem>View Content</DropdownMenuItem>
                    </DialogTrigger>
                    {content.posted_url && (
                      <DropdownMenuItem asChild>
                        <Link
                          href={content.posted_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Post Link
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <ContentDialogContent content={content} />
            </Dialog>
          </div>
        );
      },
    },
  ];
}

function getDateString(date: string) {
  return format(parseISO(date), "M/d/yyyy 'at' h:mm a");
}
