import { AdminDashboard } from '@kit/admin/components/admin-dashboard';
import { AdminGuard } from '@kit/admin/components/admin-guard';
import { PageBody, PageHeader } from '@kit/ui/page';

interface AdminPageProps {
  searchParams: {
    page?: string;
  };
}

function AdminPage(props: AdminPageProps) {
  return (
    <>
      <PageHeader title={'Super Admin'} />

      <PageBody>
        <AdminDashboard
          contentTablePage={Number(props.searchParams.page ?? '1')}
        />
      </PageBody>
    </>
  );
}

export default AdminGuard(AdminPage);
