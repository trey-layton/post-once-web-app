import { Tables } from '@kit/supabase/database';
import { Badge } from '@kit/ui/badge';

export default function ContentStatusBadge({
  status,
  scheduledAt,
}: {
  status: Tables<'content'>['status'];
  scheduledAt?: string;
}) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant={'warning'} className="whitespace-nowrap">
          Scheduled for {scheduledAt}
        </Badge>
      );

    case 'generated':
      return <Badge variant={'info'}>Generated</Badge>;

    case 'posted':
      return <Badge variant={'success'}>Posted</Badge>;
    default:
      return (
        <Badge variant={'secondary'} className="capitalize">
          {status}
        </Badge>
      );
  }
}
