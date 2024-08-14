import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, LayoutDashboard } from 'lucide-react';

import { PricingTable } from '@kit/billing-gateway/marketing';
import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  GradientSecondaryText,
  Hero,
  Pill,
  SecondaryHero,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <Hero
        pill={
          <Pill label={'New'}>
            <span>Create original content in seconds</span>
          </Pill>
        }
        title={
          <>
            <span>Transform your Newsletter</span>
            <span>into Social Media Content</span>
          </>
        }
        subtitle={
          <span>
            AI-powered content repurposing for busy newsletter writers
          </span>
        }
        cta={<MainCallToActionButton />}
        // image={
        //   <Image
        //     priority
        //     className={
        //       'delay-250 rounded-2xl border border-gray-200 duration-1000 ease-out animate-in fade-in zoom-in-50 fill-mode-both dark:border-primary/10'
        //     }
        //     width={3558}
        //     height={2222}
        //     src={`/images/dashboard.webp`}
        //     alt={`App Image`}
        //   />
        // }
      />

      <div className={'container mx-auto'}>
        <div
          className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}
        >
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Everything you need
                </b>
                .{' '}
                <GradientSecondaryText>
                  Unleash your creativity and build your social media presence.
                </GradientSecondaryText>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <LayoutDashboard className="h-5" />
                <span>All-in-one solution</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={
                  'relative col-span-2 overflow-hidden bg-violet-500 text-white lg:h-96'
                }
                label={'Connect your newsletter'}
                description={`Link your newsletter account and we'll analyze your content.`}
              ></FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'Choose content types'}
                description={`Select the social media platforms and post formats you want to create.`}
              ></FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 overflow-hidden lg:col-span-1 lg:h-96'
                }
                label={'Review and post'}
                description={`Preview your content, make any adjustments, and schedule or publish directly.`}
              ></FeatureCard>

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:h-96'}
                label="I used to spend 4 hours researching, writing, then editing my newsletter. Then, I'd spend just as much time going back through and picking out pieces that I wanted to then rewrite to fit each social platform. Now, I do all of this in minutes, and it's better than if I'd tried to do it myself."
                description="Trey, Creator of The Startup Breakdown"
              ></FeatureCard>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* <div className={'container mx-auto'}>
        <div
          className={
            'flex flex-col items-center justify-center space-y-16 py-16'
          }
        >
          <SecondaryHero
            pill={<Pill>Get started for free. No credit card required.</Pill>}
            heading="Fair pricing for all types of businesses"
            subheading="Get started on our free plan and upgrade when you are ready."
          />

          <div className={'w-full'}>
            <PricingTable
              config={billingConfig}
              paths={{
                signUp: pathsConfig.auth.signUp,
                return: pathsConfig.app.home,
              }}
            />
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex space-x-4'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>
              <Trans i18nKey={'common:getStarted'} />
            </span>

            <ArrowRightIcon
              className={
                'h-4 animate-in fade-in slide-in-from-left-8' +
                ' delay-1000 duration-1000 zoom-in fill-mode-both'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'}>
        <Link href={'/contact'}>
          <Trans i18nKey={'common:contactUs'} />
        </Link>
      </CtaButton>
    </div>
  );
}
