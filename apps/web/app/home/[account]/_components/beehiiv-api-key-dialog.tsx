'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';

import { addBeehiivApiKey } from '../_lib/server/server-actions';

const apiKeyFormSchema = z.object({
  beehiivApiKey: z.string().min(1, 'Please enter your beehiiv API key'),
  publicationId: z.string().min(1, 'Please enter your publication ID'),
  subscribeUrl: z
    .string()
    .min(1, 'Please enter your subscribe URL')
    .url('Please enter a valid subscribe URL'),
});

export default function BeehiivApiKeyDialog({
  accountId,
  data,
}: {
  accountId: string;
  data?: string | null;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!data) {
      setIsDialogOpen(true);
    }
  }, [data]);

  const form = useForm<z.infer<typeof apiKeyFormSchema>>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      beehiivApiKey: '',
      publicationId: '',
      subscribeUrl: '',
    },
  });

  function onSubmit(values: z.infer<typeof apiKeyFormSchema>) {
    setIsSubmitting(true);
    toast.promise(
      addBeehiivApiKey({
        accountId,
        apiKey: values.beehiivApiKey,
        publicationId: values.publicationId,
        subscribeUrl: values.subscribeUrl,
      }),
      {
        loading: 'Adding API key...',
        success: () => {
          setIsSubmitting(false);
          setIsDialogOpen(false);
          return 'Your beehiiv API key has been added!';
        },
        error: () => {
          setIsSubmitting(false);
          return 'Failed to add beehiiv API key. Please try again.';
        },
      },
    );
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={() => setIsDialogOpen((prev) => !prev)}
    >
      <DialogContent className="p-8 sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">
                Let's get your newsletter connected
              </h1>
              <p className="text-muted-foreground">
                Enter your beehiiv API key to connect your newsletter.
              </p>
            </div>
            <div className="space-y-4">
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
                      <Input
                        placeholder="Enter your publication ID"
                        {...field}
                      />
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
                      <Input
                        placeholder="Enter your subscribe URL"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">How to do this</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-medium">
                      1. Navigate to Settings from your beehiiv Dashboard,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      2. Click Integrations on the left hand navigation menu,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      3. Scroll down and select 'New API Key',
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      4. Give it a name like 'PostOnce API Key' and click Create
                      New Key,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      5. Copy this key and paste it in the field above.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                Connect Newsletter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
