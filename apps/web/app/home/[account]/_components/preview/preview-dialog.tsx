'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAppEvents } from '@kit/shared/events';
import { Tables } from '@kit/supabase/database';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button, buttonVariants } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';
import { Stepper } from '@kit/ui/stepper';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import { GeneratedContent } from '~/lib/forms/types/generated-content.schema';

import { generateContent, postContent } from '../../_lib/server/server-actions';
import LinkedInPreviewPost from './linkedin-preview-post';
import TwitterPreviewPost from './twitter-preview-post';

export default function PreviewDialog({
  isSubmitted,
  setIsSubmitted,
  integrations,
  formValues,
}: {
  isSubmitted: boolean;
  setIsSubmitted: (isSubmitted: boolean) => void;
  integrations: Pick<
    Tables<'integrations'>,
    'id' | 'avatar' | 'provider' | 'username'
  >[];
  formValues: z.infer<typeof contentHubFormSchema>;
}) {
  const { emit } = useAppEvents();
  const workspace = useTeamAccountWorkspace();
  const [pending, startTransition] = useTransition();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [content, setContent] = useState<
    GeneratedContent & {
      id: string;
    }
  >();

  const integration = integrations.find(
    (integration) => integration.id === formValues.account,
  );

  const mutation = useMutation({
    mutationFn: () =>
      generateContent({
        ...formValues,
        accountId: workspace.account.id,
        integrationId: formValues.account,
      }),
    onMutate: () => {
      toast.loading('Generating content...');
    },
    onSuccess: (res) => {
      toast.dismiss();
      toast.success('Content generated successfully.');
      setContent(res);
      setIsDialogOpen(true);
      setIsSubmitted(false);
      emit({
        type: 'content.generate',
        payload: { contentType: formValues.contentType, success: 'true' },
      });
    },
    onError: () => {
      toast.dismiss();
      toast.error('Failed to generate content. Please try again.');
      setIsSubmitted(false);
      emit({
        type: 'content.generate',
        payload: { contentType: formValues.contentType, success: 'false' },
      });
    },
  });

  useEffect(() => {
    if (isSubmitted) {
      mutation.mutate();
    }
  }, [isSubmitted]);

  function handlePost() {
    if (!content) return;
    startTransition(() => {
      toast.promise(
        postContent({
          integrationId: formValues.account,
          content,
        }),
        {
          loading: 'Posting content...',
          success: (res) => {
            setIsDialogOpen(false);
            emit({
              type: 'content.post',
              payload: {
                contentType: formValues.contentType,
                success: 'true',
                postUrl: res?.link ?? '',
              },
            });
            return (
              <p>
                <span>Your content has been posted! </span>
                <a href={res?.link} target="_blank" rel="noopener noreferrer">
                  <span className="underline">Click here</span> to check it out!
                </a>
              </p>
            );
          },
          error: () => {
            emit({
              type: 'content.post',
              payload: {
                contentType: formValues.contentType,
                success: 'false',
                postUrl: '',
              },
            });
            return 'Failed to post content. Please try again.';
          },
          duration: 8000,
        },
      );
    });
  }

  function handleSchedule(time: string) {
    if (!content) return;
    toast.success('schedule api call here');
  }

  const handleSave = useCallback(
    (index: number, newText: string) => {
      setContent((prevContent) => {
        if (!prevContent) return prevContent;
        const updatedPosts = prevContent.content.map((p, i) =>
          i === index ? { ...p, text: newText } : p,
        );
        return { ...prevContent, content: updatedPosts };
      });
    },
    [setContent],
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[450px] px-0">
        <DialogHeader className="px-6">
          <Stepper
            steps={['Prepare Content', 'Schedule & Post']}
            currentStep={step}
            variant="numbers"
          />
          <div className="pt-2">
            <Separator />
          </div>
        </DialogHeader>
        {step === 0 && (
          <>
            <ScrollArea className="mx-2 max-h-80 px-4">
              <div className="flex flex-col gap-y-3">
                {content?.content.map((post, index) => {
                  return content.provider === 'twitter' ? (
                    <div key={index} className="space-y-3">
                      <TwitterPreviewPost
                        integration={integration}
                        message={post}
                        onSave={(newText) => handleSave(index, newText)}
                        isViewOnly={false}
                      />
                      <Separator />
                    </div>
                  ) : content.provider === 'linkedin' ? (
                    <div key={index} className="space-y-3">
                      <LinkedInPreviewPost
                        integration={integration}
                        message={post}
                        onSave={(newText) => handleSave(index, newText)}
                        isViewOnly={false}
                      />
                      <Separator />
                    </div>
                  ) : null;
                })}
              </div>
            </ScrollArea>
            <DialogFooter className="px-6">
              <Button
                className="w-full"
                variant="secondary"
                type="button"
                disabled
              >
                Regenerate
              </Button>
              {content?.type !== 'long_form_tweet' ? (
                <Button
                  className="w-full"
                  type="button"
                  onClick={() => setStep(1)}
                >
                  Next
                </Button>
              ) : (
                <a
                  className={buttonVariants({ className: 'w-full' })}
                  href={`https://twitter.com/intent/tweet?text=${content.content.length > 0 && content.content[0]?.text ? encodeURIComponent(content.content[0].text) : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Post
                </a>
              )}
            </DialogFooter>
          </>
        )}
        {step === 1 && (
          <>
            <div className="flex flex-col gap-3 px-6">
              <Button
                className="w-full"
                type="button"
                onClick={handlePost}
                disabled={pending}
              >
                Post Now
              </Button>
              <div className="flex items-center">
                <Separator className="flex-1" />
                <span className="mx-2 text-sm">or</span>
                <Separator className="flex-1" />
              </div>
              <ScheduleForm pending={pending} onSchedule={handleSchedule} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const scheduleFormSchema = z.object({
  time: z.string().min(1, 'Please select a time.'),
});

export function ScheduleForm({
  pending,
  onSchedule,
}: {
  pending: boolean;
  onSchedule: (time: string) => void;
}) {
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      time: '',
    },
  });

  function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    onSchedule(values.time);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Time</FormLabel>
              <FormControl>
                <Input
                  type="datetime-local"
                  {...field}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={pending ?? !form.formState.isValid}
          >
            {form.formState.isValid
              ? `Schedule for ${format(parseISO(form.getValues('time')), "M/d/yyyy 'at' h:mm a")}`
              : 'Schedule'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
