import { LinkedInLogoIcon } from '@radix-ui/react-icons';

import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { createTeamAccountsApi } from '@kit/team-accounts/api';
import { Card } from '@kit/ui/card';
import { PageBody } from '@kit/ui/page';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { createIntegrationsService } from '~/lib/integrations/integrations.service';
import { createProfilesService } from '~/lib/profiles/profiles.service';

import BeehiivApiKeyDialog from './_components/beehiiv-api-key-dialog';
import ContentHubForm from './_components/content-hub-form';
import IntegrationsDataTable from './_components/integrations-data-table';
import { TeamAccountLayoutPageHeader } from './_components/team-account-layout-page-header';
import ThreadsLogoIcon from './_components/threads-logo-icon';
import XLogoIcon from './_components/x-logo-icon';

interface Params {
  account: string;
}

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('teams:home.pageTitle');

  return {
    title,
  };
};

export default async function TeamAccountHomePage({
  params,
}: {
  params: Params;
}) {
  const supabase = getSupabaseServerComponentClient();
  const api = createTeamAccountsApi(supabase);
  const integrationsService = createIntegrationsService(supabase);
  const profilesService = createProfilesService(supabase);

  const [team, { data: integrations }, { data: profile }, { posts }] =
    await Promise.all([
      api.getTeamAccount(params.account),
      integrationsService.getIntegrations({ accountSlug: params.account }),
      profilesService.getProfile({ accountSlug: params.account }),
      profilesService.getBeehiivPosts({ accountSlug: params.account }),
    ]);

  const providers = [
    {
      name: 'linkedin',
      label: 'LinkedIn',
      authUrl: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}?account=${team.id}&slug=${params.account}`)}&scope=openid%20profile%20email%20w_member_social`,
      icon: <LinkedInLogoIcon className="h-5 w-5" />,
    },
    {
      name: 'twitter',
      label: 'Twitter',
      icon: <XLogoIcon className="h-5 w-5" />,
    },
    {
      name: 'threads',
      label: 'Threads',
      authUrl: `https://threads.net/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_THREADS_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://post-once-web-app.vercel.app/api/integrations/threads')}&scope=threads_basic,threads_content_publish&response_type=code&state=${encodeURIComponent(JSON.stringify({ account: team.id, slug: params.account }))}`,
      icon: <ThreadsLogoIcon className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <TeamAccountLayoutPageHeader
        account={params.account}
        title="Dashboard"
        description="Manage your accounts and content here."
      ></TeamAccountLayoutPageHeader>
      <PageBody>
        <BeehiivApiKeyDialog
          data={profile?.beehiiv_api_key}
          accountId={team.id}
        />
        <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-8">
          <Card className="w-full p-4 md:w-1/2">
            <div className="text-lg font-semibold">Connected Accounts</div>
            <div className="text-sm text-muted-foreground">
              Quickly access your content repurposing tools.
            </div>
            <div className="mt-8 space-y-6">
              {providers.map((provider, index) => (
                <IntegrationsDataTable
                  key={index}
                  data={integrations.filter(
                    (i) => i.provider === provider.name,
                  )}
                  provider={provider}
                  slug={params.account}
                />
              ))}
            </div>
          </Card>
          <Card className="h-fit w-full p-4 md:w-1/2">
            <div className="text-lg font-semibold">Content Hub</div>
            <div className="text-sm text-muted-foreground">
              Easily access the main features of the tool.
            </div>
            <ContentHubForm integrations={integrations} posts={posts} />
          </Card>
        </div>
      </PageBody>
    </>
  );
}
