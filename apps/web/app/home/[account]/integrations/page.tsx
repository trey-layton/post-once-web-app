import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { buttonVariants } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';
import { cn } from '@kit/ui/utils';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

import { loadTeamWorkspace } from '../_lib/server/team-account-workspace.loader';
import IntegrationsDataTable from './_components/integrations-data-table';

//!DON'T HARDCODE
const codeChallenge = 'sU8s5R59RD6TmljksbSQpAhuXeYQ7d7wGc1SFJnhV3c';

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

  const providers = [
    {
      name: 'linkedin',
      label: 'LinkedIn',
      authUrl: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}?account=${workspace.account.id}&slug=${params.account}`)}&scope=openid%20profile%20email`,
    },
    {
      name: 'twitter',
      label: 'Twitter',
      authUrl: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI}?account=${workspace.account.id}&slug=${params.account}`)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${encodeURIComponent(params.account)}&code_challenge=${codeChallenge}&code_challenge_method=S256`,
    },
    {
      name: 'threads',
      label: 'Threads',
      authUrl: `https://threads.net/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_THREADS_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_THREADS_REDIRECT_URI}?account=${workspace.account.id}&slug=${params.account}`)}&scope=threads_basic,threads_content_publish&response_type=code`,
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
