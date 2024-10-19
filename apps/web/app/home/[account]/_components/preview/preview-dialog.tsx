'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CircleCheckBig } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAppEvents } from '@kit/shared/events';
import { Tables } from '@kit/supabase/database';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
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
import { Separator } from '@kit/ui/separator';
import { Stepper } from '@kit/ui/stepper';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import {
  generatedContentSchema,
  postContentSchema,
} from '~/lib/forms/types/generated-content.schema';

import {
  generateContent,
  postContent,
  scheduleContent,
} from '../../_lib/server/server-actions';
import LinkedInPreviewPost from './linkedin-preview-post';
import TwitterPreviewPost from './twitter-preview-post';

//!fix schedule content
//!fix post status among all posts
//!fix content tables

const previewContentSchema = generatedContentSchema.extend({
  content: z.array(
    postContentSchema.extend({
      id: z.string(),
    }),
  ),
});

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
  const [step, setStep] = useState<
    {
      step: number;
      posted: boolean;
      scheduled: boolean;
      postUrl?: string;
    }[]
  >([]);
  const [content, setContent] =
    useState<z.infer<typeof previewContentSchema>>();

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
      setContent(previewContentSchema.parse(res));
      setStep(() =>
        Array.from({ length: res.content.length }, () => {
          return { step: 0, posted: false, scheduled: false };
        }),
      );
      toast.dismiss();
      toast.success('Content generated successfully.');
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

  function handlePost(contentId: string) {
    const toPost = content?.content.find((c) => c.id === contentId);

    if (!toPost || !content) return;

    startTransition(() => {
      toast.promise(
        postContent({
          integrationId: formValues.account,
          content: toPost,
          contentId: contentId,
          provider: content.provider,
          contentType: content.type,
        }),
        {
          loading: 'Posting content...',
          success: (res) => {
            emit({
              type: 'content.post',
              payload: {
                contentType: formValues.contentType,
                success: 'true',
                postUrl: res?.link ?? '',
              },
            });
            setStep((prev) =>
              prev.map((p, i) =>
                i === content?.content.findIndex((c) => c.id === contentId)
                  ? { ...p, posted: true, postUrl: res?.link }
                  : p,
              ),
            );
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

  function handleSchedule(time: string, contentId: string) {
    const toSchedule = content?.content.find((c) => c.id === contentId);

    if (!toSchedule || !content) return;
    startTransition(() => {
      toast.promise(
        scheduleContent({
          content: toSchedule,
          scheduledTime: time,
          contentId,
        }),
        {
          loading: 'Scheduling content...',
          success: (res) => {
            emit({
              type: 'content.schedule',
              payload: {
                contentType: formValues.contentType,
                success: 'true',
                scheduleTime: time,
              },
            });
            setStep((prev) =>
              prev.map((p, i) =>
                i === content?.content.findIndex((c) => c.id === contentId)
                  ? { ...p, scheduled: true }
                  : p,
              ),
            );
            return 'Your content has been scheduled!';
          },
          error: () => {
            emit({
              type: 'content.schedule',
              payload: {
                contentType: formValues.contentType,
                success: 'false',
                scheduleTime: time,
              },
            });
            return 'Failed to schedule content. Please try again.';
          },
        },
      );
    });
  }

  const handleSave = useCallback(
    (postIndex: number, index: number, newText: string) => {
      setContent((prevContent) => {
        if (!prevContent) return prevContent;

        const updatedPosts = prevContent.content.map((p, i) => {
          if (i === postIndex) {
            return {
              ...p,
              post_content: p.post_content.map((pp, ii) =>
                ii === index ? { ...pp, post_content: newText } : pp,
              ),
            };
          }
          return p;
        });

        return { ...prevContent, content: updatedPosts };
      });
    },
    [setContent],
  );

  useEffect(() => {
    if (!isDialogOpen) {
      setTimeout(() => {
        setStep([]);
      }, 500);
    }
  }, [isDialogOpen]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent
        className="flex w-fit max-w-screen-2xl divide-x overflow-x-auto px-0"
        closeButton={false}
      >
        {content?.content.map((postContent, postIndex) => (
          <div className="h-full w-[450px]" key={postIndex}>
            <DialogHeader className="px-6">
              <Stepper
                steps={['Prepare Content', 'Schedule & Post']}
                currentStep={step[postIndex]?.step ?? 0}
                variant="numbers"
              />
              <Separator />
            </DialogHeader>
            {step[postIndex]?.step === 0 && (
              <>
                <div className="mx-2 max-h-96 overflow-y-auto px-4 pt-2">
                  <div className="flex flex-col gap-y-3">
                    {postContent?.post_content.map((post, index) => {
                      return content.provider === 'twitter' ? (
                        <div key={index} className="space-y-3">
                          <TwitterPreviewPost
                            integration={integration}
                            message={post}
                            onSave={(newText) =>
                              handleSave(postIndex, index, newText)
                            }
                            isViewOnly={false}
                            media={
                              index === 0 ? content.thumbnail_url : undefined
                            }
                          />
                          <Separator />
                        </div>
                      ) : content.provider === 'linkedin' ? (
                        <div key={index} className="space-y-3">
                          <LinkedInPreviewPost
                            integration={integration}
                            message={post}
                            onSave={(newText) =>
                              handleSave(postIndex, index, newText)
                            }
                            isViewOnly={false}
                            media={content.thumbnail_url}
                          />
                          <Separator />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <DialogFooter className="px-6 pt-2">
                  {content?.type !== 'long_form_tweet' ? (
                    <Button
                      className="w-full"
                      type="button"
                      onClick={() =>
                        setStep((prev) =>
                          prev.map((p, i) =>
                            i === postIndex ? { ...p, step: p.step + 1 } : p,
                          ),
                        )
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <a
                      className={buttonVariants({ className: 'w-full' })}
                      href={`https://twitter.com/intent/tweet?text=${postContent.post_content.length > 0 && postContent.post_content[0]?.post_content ? encodeURIComponent(postContent.post_content[0].post_content) : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Post
                    </a>
                  )}
                </DialogFooter>
              </>
            )}
            {step[postIndex]?.step === 1 &&
              (step[postIndex]?.posted ? (
                <Alert className="mx-8 my-24 w-fit">
                  <CircleCheckBig className="h-4 w-4" />
                  <AlertTitle>Congrats!</AlertTitle>
                  <AlertDescription>
                    Your content has been posted successfully!{' '}
                    <a
                      href={step[postIndex]?.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="underline">Click here</span> to check it
                      out!
                    </a>
                  </AlertDescription>
                </Alert>
              ) : step[postIndex]?.scheduled ? (
                <Alert className="mx-8 my-24 w-fit">
                  <CircleCheckBig className="h-4 w-4" />
                  <AlertTitle>Congrats!</AlertTitle>
                  <AlertDescription>
                    Your content has been scheduled successfully!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex flex-col gap-3 px-6 pt-5">
                  <Button
                    className="w-full"
                    type="button"
                    onClick={() => handlePost(postContent.id)}
                    disabled={pending}
                  >
                    Post Now
                  </Button>
                  <div className="flex items-center">
                    <Separator className="flex-1" />
                    <span className="mx-2 text-sm">or</span>
                    <Separator className="flex-1" />
                  </div>
                  <ScheduleForm
                    pending={pending}
                    onSchedule={(time) => handleSchedule(time, postContent.id)}
                  />
                </div>
              ))}
          </div>
        ))}
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
    onSchedule(
      new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(new Date(values.time)),
    );
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
