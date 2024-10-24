import { AppLogo } from '~/components/app-logo';

import { OnboardingForm } from './_components/onboarding-form';

function OnboardingPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-16">
      <AppLogo />

      <div className="w-full max-w-2xl">
        <OnboardingForm />
      </div>
    </div>
  );
}

export default OnboardingPage;
