'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { LinkedInLogoIcon } from '@radix-ui/react-icons';
import {
  Heart,
  MessageCircleIcon,
  NotebookPen,
  Repeat,
  Share,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Tables } from '@kit/supabase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
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
import { Separator } from '@kit/ui/separator';
import { Sheet, SheetClose, SheetContent, SheetFooter } from '@kit/ui/sheet';

import ThreadsLogoIcon from './threads-logo-icon';
import XLogoIcon from './x-logo-icon';

//!reset account when contentType changes

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

  const [isSheetOpen, setIsSheetOpen] = useState(false);

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

  function onSubmit(values: z.infer<typeof contentHubFormSchema>) {
    console.log(values);
    setIsSheetOpen(true);
  }

  return (
    <>
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
          <Button type="submit" className="w-full gap-2" size="lg">
            <span>Generate</span>
            <NotebookPen className="h-4 w-4" />
          </Button>
        </form>
      </Form>
      <PreviewSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        formData={form.getValues()}
      />
    </>
  );
}

function PreviewSheet({
  isOpen,
  onClose,
  formData,
}: {
  isOpen: boolean;
  onClose: () => void;
  formData: z.infer<typeof contentHubFormSchema>;
}) {
  //fetch content hereee

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent>
        <div className="space-y-4">
          {[0, 1].map((_, index) => (
            <>
              <div key={index} className="flex items-start gap-4">
                <Avatar className="shrink-0 border-2 border-primary">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-bold">Shadcn</div>
                    <div className="text-sm text-muted-foreground">@shadcn</div>
                    <div className="text-sm text-muted-foreground">· 2h</div>
                  </div>
                  <p className="animate-typing">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    euismod, nisl nec ultricies lacinia, nisl nisl aliquam nisl,
                    eget aliquam nisl nisl sit amet nisl. Sed euismod, nisl nec
                    ultricies lacinia, nisl nisl aliquam nisl.
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <MessageCircleIcon className="h-5 w-5" />
                      <span className="sr-only">Reply</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Repeat className="h-5 w-5" />
                      <span className="sr-only">Retweet</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Heart className="h-5 w-5" />
                      <span className="sr-only">Like</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Share className="h-5 w-5" />
                      <span className="sr-only">Share</span>
                    </Button>
                  </div>
                </div>
              </div>
              {index !== 1 && <Separator />}
            </>
          ))}
        </div>
        <SheetFooter className="mt-4">
          <Button className="w-full">Post</Button>
          <Button className="w-full" variant="secondary">
            Regenerate
          </Button>
          <SheetClose asChild>
            <Button type="submit" variant="secondary" className="w-full">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
