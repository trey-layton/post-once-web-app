import { Badge } from '@kit/ui/badge';

import { Tables } from '~/lib/database.types';

export default function ContentStatusBadge({
  status,
}: {
  status: Tables<'content'>['status'];
}) {
  switch (status) {
    case 'scheduled':
      return <Badge variant={'warning'}>Scheduled</Badge>;

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
