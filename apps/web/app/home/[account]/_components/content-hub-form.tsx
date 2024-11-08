'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import { LoaderCircle, NotebookPen } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Textarea } from '@kit/ui/textarea';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';

import PreviewDialog from './preview/preview-dialog';
import PasteArticleDialog from './paste-article-dialog';
import ThreadsLogoIcon from './threads-logo-icon';
import XLogoIcon from './x-logo-icon';

const contentTypes: {
  name: z.infer<typeof contentHubFormSchema>['contentType'];
  label: string;
  provider: Tables<'integrations'>['provider'];
}[] = [
  { name: 'precta_tweet', label: 'Pre-Newsletter CTA', provider: 'twitter' },
  { name: 'postcta_tweet', label: 'Post-Newsletter CTA', provider: 'twitter' },
  { name: 'thread_tweet', label: 'Thread', provider: 'twitter' },
  { name: 'image_list', label: 'Image list', provider: 'twitter' },
  { name: 'long_form_tweet', label: 'Long-form post', provider: 'twitter' },
  {
    name: 'long_form_post',
    label: 'Long-form post',
    provider: 'linkedin',
  },
];

export default function ContentHubForm({
  integrations,
  posts,
}: {
  integrations: Pick<
    Tables<'integrations'>,
    'id' | 'avatar' | 'provider' | 'username'
  >[];
  posts: { id: string; title: string }[];
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof contentHubFormSchema>>({
    resolver: zodResolver(contentHubFormSchema),
    mode: 'onBlur',
  });

  const filteredIntegrations = integrations.filter(
    (integration) =>
      integration.provider ===
      contentTypes.find((type) => type.name === form.watch('contentType'))
        ?.provider,
  );

  function onArticleSubmit(content: string) {
    form.setValue('pastedContent', content);
    form.setValue('beehiivArticleId', undefined); // Ensure this is undefined
    setPastedContent(content);
  }
  

  async function onSubmit(values: z.infer<typeof contentHubFormSchema>) {
    try {
      setIsSubmitted(true);
      // Perform any async operations here
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating an async operation
      console.log('Form submitted:', values);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitted(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <FormField
            control={form.control}
            name="beehiivArticleId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Beehiiv Article</FormLabel>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    {pastedContent ? 'Edit Content' : 'Paste Instead'}
                  </Button>
                </div>
                {pastedContent ? (
                  <FormControl>
                    <Textarea
                      value={pastedContent}
                      readOnly
                      onClick={() => setIsDialogOpen(true)}
                      className="min-h-[100px] resize-none cursor-pointer"
                    />
                  </FormControl>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('pastedContent', undefined);
                      setPastedContent('');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an article" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {posts.length > 0 ? (
                          posts.map((post, index) => (
                            <SelectItem key={index} value={post.id}>
                              {post.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectLabel>No articles available</SelectLabel>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
                            <XLogoIcon className="h-5 w-5" />
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
                                <XLogoIcon className="h-5 w-5" />
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
          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={isSubmitted}
          >
            {isSubmitted ? 'Generating' : 'Generate'}
          </Button>
        </form>
      </Form>
      <PasteArticleDialog
        onArticleSubmit={onArticleSubmit}
        initialContent={pastedContent}
        open={isDialogOpen}
        setOpen={setIsDialogOpen}
      />
      <PreviewDialog
        isSubmitted={isSubmitted}
        setIsSubmitted={setIsSubmitted}
        integrations={integrations}
        formValues={form.getValues()}
      />
    </>
  );
}