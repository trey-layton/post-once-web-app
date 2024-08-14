'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Tables } from '@kit/supabase/database';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import { updateBeehiivProfile } from '../../server/actions/beehiiv-profile-server-actions';

const beehiivFormSchema = z.object({
  beehiivApiKey: z.string().min(1, 'Please enter your beehiiv API key'),
  publicationId: z.string().min(1, 'Please enter your publication ID'),
  subscribeUrl: z.string().min(1, 'Please enter your subscribe URL'),
});

export const UpdateTeamAccountBeehiivForm = ({
  accountId,
  beehiivProfile,
}: {
  accountId: string;
  beehiivProfile: Tables<'account_profiles'> | null;
}) => {
  const [pending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(beehiivFormSchema),
    defaultValues: {
      beehiivApiKey: beehiivProfile?.beehiiv_api_key ?? '',
      publicationId: beehiivProfile?.publication_id ?? '',
      subscribeUrl: beehiivProfile?.subscribe_url ?? '',
    },
  });

  function onSubmit(values: z.infer<typeof beehiivFormSchema>) {
    startTransition(() => {
      toast.promise(
        updateBeehiivProfile({
          accountId,
          apiKey: values.beehiivApiKey,
          publicationId: values.publicationId,
          subscribeUrl: values.subscribeUrl,
        }),
        {
          loading: 'Updating beehiiv profile...',
          success: 'Your beehiiv profile has been updated!',
          error: 'Failed to update beehiiv profile. Please try again.',
        },
      );
    });
  }

  return (
    <div className={'space-y-8'}>
      <Form {...form}>
        <form
          data-test={'update-team-account-name-form'}
          className={'flex flex-col space-y-4'}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="beehiivApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>beehiiv API Key</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your API key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="publicationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publication ID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your publication ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subscribeUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subscribe URL</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your subscribe URL" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div>
            <Button className={'w-full md:w-auto'} disabled={pending}>
              Update beehiiv Data
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
