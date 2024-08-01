'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LinkedInLogoIcon, TwitterLogoIcon } from '@radix-ui/react-icons';
import { NotebookPen } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import ThreadsLogoIcon from './threads-logo-icon';

const contentHubFormSchema = z.object({
  beehiivArticleUrl: z.string().url(),
  contentType: z.enum([
    'pre_nl_cta',
    'post_nl_cta',
    'thread',
    'long_form',
    'long_form_li',
  ]),
  account: z.string(),
});

export default function ContentHubForm({
  integrations,
}: {
  integrations: Tables<'integrations'>[];
}) {
  const contentTypes = [
    { name: 'pre_nl_cta', label: 'Pre-Newsletter CTA', provider: 'twitter' },
    { name: 'post_nl_cta', label: 'Post-Newsletter CTA', provider: 'twitter' },
    { name: 'thread', label: 'Thread', provider: 'twitter' },
    { name: 'long_form', label: 'Long-form post', provider: 'twitter' },
    { name: 'long_form_li', label: 'Long-form post', provider: 'linkedin' },
  ];

  const form = useForm<z.infer<typeof contentHubFormSchema>>({
    resolver: zodResolver(contentHubFormSchema),
    defaultValues: {
      beehiivArticleUrl: '',
    },
  });

  const filteredIntegrations = integrations.filter(
    (integration) =>
      integration.provider ===
      contentTypes.find((type) => type.name === form.watch('contentType'))
        ?.provider,
  );

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof contentHubFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <FormField
          control={form.control}
          name="beehiivArticleUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beehiiv Article URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your Beehiiv article URL"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Content Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contentTypes.map((contentType, index) => (
                    <SelectItem key={index} value={contentType.name}>
                      <div className="flex items-center gap-2">
                        {contentType.provider === 'twitter' ? (
                          <TwitterLogoIcon className="h-5 w-5" />
                        ) : contentType.provider === 'linkedin' ? (
                          <LinkedInLogoIcon className="h-5 w-5" />
                        ) : (
                          <ThreadsLogoIcon className="h-5 w-5" />
                        )}
                        <span>{contentType.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="account"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!form.watch('contentType')}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {filteredIntegrations.length > 0 ? (
                      filteredIntegrations.map((integration, index) => (
                        <SelectItem key={index} value={integration.id}>
                          <div className="flex items-center gap-2">
                            {integration.provider === 'twitter' ? (
                              <TwitterLogoIcon className="h-5 w-5" />
                            ) : integration.provider === 'linkedin' ? (
                              <LinkedInLogoIcon className="h-5 w-5" />
                            ) : (
                              <ThreadsLogoIcon className="h-5 w-5" />
                            )}
                            <span>{integration.username}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectLabel>No accounts available</SelectLabel>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gap-2" size="lg">
          <span>Generate</span>
          <NotebookPen className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
