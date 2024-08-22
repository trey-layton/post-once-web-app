import { use } from 'react';

import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { PageBody, PageHeader } from '@kit/ui/page';

import { createContentService } from '~/lib/content/content.service';

import { ContentDataTable } from './_components/content-data-table';

interface ContentPageProps {
  params: {
    account: string;
  };

  searchParams: {
    page?: string;
    query?: string;
  };
}

export default function ContentPage(props: ContentPageProps) {
  const client = getSupabaseServerComponentClient();
  const service = createContentService(client);

  const page = Number(props.searchParams.page ?? '1');
  const query = props.searchParams.query ?? '';

  const { data, pageSize, pageCount } = use(
    service.getContent({
      accountSlug: props.params.account,
      page,
      query,
    }),
  );

  return (
    <>
      <PageHeader
        title={'Generated Content'}
        description={'Manage your content here.'}
      />

      <PageBody>
        <ContentDataTable
          pageIndex={page - 1}
          pageCount={pageCount}
          pageSize={pageSize}
          data={data}
        />
      </PageBody>
    </>
  );
}
