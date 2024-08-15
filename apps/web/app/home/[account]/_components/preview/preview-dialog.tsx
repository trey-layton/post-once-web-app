'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';

import { useAppEvents } from '@kit/shared/events';
import { Tables } from '@kit/supabase/database';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Button, buttonVariants } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';

import { contentHubFormSchema } from '~/lib/forms/types/content-hub-form.schema';
import { generatedContentSchema } from '~/lib/forms/types/generated-content.schema';

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
  const [content, setContent] =
    useState<z.infer<typeof generatedContentSchema>>();
  console.log('content', content);

  const integration = integrations.find(
    (integration) => integration.id === formValues.account,
  );

  const mutation = useMutation({
    mutationFn: () =>
      generateContent({ ...formValues, accountId: workspace.account.id }),
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
        <DialogHeader className="mb-2 px-6">
          <DialogTitle>Generated Content Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mx-2 max-h-80 px-4">
          <div className="flex flex-col gap-y-3">
            {content?.content.map((post, index) => {
              return content.provider === 'twitter' ? (
                <div key={index} className="space-y-3">
                  <TwitterPreviewPost
                    integration={integration}
                    message={post}
                    onSave={(newText) => handleSave(index, newText)}
                  />
                  <Separator />
                </div>
              ) : content.provider === 'linkedin' ? (
                <div key={index} className="space-y-3">
                  <LinkedInPreviewPost
                    integration={integration}
                    message={post}
                    onSave={(newText) => handleSave(index, newText)}
                  />
                  <Separator />
                </div>
              ) : null;
            })}
          </div>
        </ScrollArea>
        <DialogFooter className="px-6">
          {content?.type !== 'long_form_tweet' ? (
            <Button
              className="w-full"
              type="button"
              onClick={handlePost}
              disabled={pending}
            >
              Post
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
          <Button className="w-full" variant="secondary" type="button" disabled>
            Regenerate
          </Button>
          <DialogClose asChild>
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={pending}
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
