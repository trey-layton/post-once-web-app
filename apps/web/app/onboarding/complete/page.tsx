'use client';
 
import { useRef } from 'react';
 
import { useQuery } from '@tanstack/react-query';
 
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
 
import pathsConfig from '~/config/paths.config';
 
export default function OnboardingCompletePage() {
  const { error } = useCheckUserOnboarded();
 
  if (error) {
    return (
      <div className={'flex flex-col items-center justify-center'}>
        <p>Something went wrong...</p>
      </div>
    );
  }
 
  return <LoadingOverlay>Setting up your account...</LoadingOverlay>;
}
 
/**
 * @description
 * This function checks if the user is onboarded
 * If the user is onboarded, it redirects them to the home page
 * it retries every second until the user is onboarded
 */
function useCheckUserOnboarded() {
  const client = useSupabase();
  const countRef = useRef(0);
  const maxCount = 10;
  const error = countRef.current >= maxCount;
 
  useQuery({
    queryKey: ['onboarding-complete'],
    refetchInterval: () => (error ? false : 1000),
    queryFn: async () => {
      if (error) {
        return false;
      }
 
      countRef.current++;
 
      const response = await client.auth.getUser();
 
      if (response.error) {
        throw response.error;
      }
 
      const onboarded = response.data.user.app_metadata.onboarded;
 
      // if the user is onboarded, redirect them to the home page
      if (onboarded) {
        return window.location.assign(pathsConfig.app.home);
      }
 
      return false;
    },
  });
 
  return {
    error,
  };
}