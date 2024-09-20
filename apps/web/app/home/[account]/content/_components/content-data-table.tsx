'use client';

import { useTransition } from 'react';

import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import { ColumnDef } from '@tanstack/react-table';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button } from '@kit/ui/button';
import { DataTable } from '@kit/ui/enhanced-data-table';

import Content from '~/lib/content/types/content';

import ThreadsLogoIcon from '../../_components/threads-logo-icon';
import XLogoIcon from '../../_components/x-logo-icon';
import { unscheduleContent } from '../../_lib/server/server-actions';
import ContentDialog from './content-dialog';
import ContentStatusBadge from './content-status-badge';

export function ContentDataTable(props: {
  data: Content[];
  pageSize: number;
  pageIndex: number;
  pageCount: number;
}) {
  return <DataTable {...props} columns={getColumns()} />;
}

function getColumns(): ColumnDef<Content>[] {
  return [
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
        const [pending, startTransition] = useTransition();

        return (
          <div className={'flex justify-end gap-2'}>
            {content.status === 'posted' && content.posted_url && (
              <Button asChild variant={'outline'} size="sm">
                <a
                  href={content.posted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Post
                </a>
              </Button>
            )}
            {content.status === 'scheduled' && (
              <Button
                variant={'destructive'}
                size="sm"
                onClick={() =>
                  startTransition(() => {
                    toast.promise(
                      unscheduleContent({
                        id: content.id,
                      }),
                      {
                        loading: 'Unscheduling post...',
                        success: 'Post unscheduled.',
                        error: 'Failed to unschedule.',
                      },
                    );
                  })
                }
                disabled={pending}
              >
                Cancel
              </Button>
            )}
            <ContentDialog content={content} />
          </div>
        );
      },
    },
  ];
}

function getDateString(date: string) {
  return format(parseISO(date), "M/d/yyyy 'at' h:mm a");
}
