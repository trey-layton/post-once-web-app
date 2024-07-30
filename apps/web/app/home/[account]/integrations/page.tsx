import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { buttonVariants } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';
import { cn } from '@kit/ui/utils';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import IntegrationsDataTable from './_components/integrations-data-table';

interface IntegrationsPageProps {
  params: {
    account: string;
  };
}

//!DELETE BUTTON

export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps) {
  const workspace = await loadTeamWorkspace(params.account);
  const client = getSupabaseServerComponentClient();
  const service = createIntegrationsService(client);

  const { data } = await service.getIntegrations({
    accountSlug: params.account,
  });

  const linkedInAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}?account=${workspace.account.id}&slug=${params.account}`)}&scope=openid%20profile%20email`;

  const providers = [
    {
      name: 'linkedin',
      label: 'LinkedIn',
      authUrl: linkedInAuthUrl,
    },
    {
      name: 'twitter',
      label: 'Twitter',
      authUrl: '',
    },
    {
      name: 'threads',
      label: 'Threads',
      authUrl: '',
    },
  ];

  return (
    <>
      <PageHeader
        title={'Integrations'}
        description={
          'Here are your integrations. You can add, edit, and remove them here.'
        }
      />

      <PageBody>
        <div className="max-w-md space-y-6">
          {providers.map((provider, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{provider.label}</h2>
                <a
                  href={provider.authUrl}
                  className={cn(
                    buttonVariants({ size: 'sm' }),
                    'w-fit text-sm',
                  )}
                >
                  New
                </a>
              </div>
              <IntegrationsDataTable
                data={data.filter((i) => i.provider === provider.name)}
              />
            </div>
          ))}
        </div>
      </PageBody>
    </>
  );
}
