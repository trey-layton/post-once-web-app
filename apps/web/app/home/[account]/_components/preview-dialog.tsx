'use client';

import { useEffect, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import {
  ChartNoAxesColumn,
  Heart,
  MessageCircleIcon,
  Repeat,
  Share,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Tables } from '@kit/supabase/database';
import { useTeamAccountWorkspace } from '@kit/team-accounts/hooks/use-team-account-workspace';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
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

import { generateContent, postContent } from '../_lib/server/server-actions';


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
  const workspace = useTeamAccountWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [content, setContent] =
    useState<z.infer<typeof generatedContentSchema>>();

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
    },
    onError: (error) => {
      toast.dismiss();
      toast.error('Failed to generate content. Please try again.');
      setIsSubmitted(false);
    },
  });

  useEffect(() => {
    if (isSubmitted) {
      mutation.mutate();
    }
  }, [isSubmitted]);

  function handlePost() {
    if (!content) return;
    setIsPosting(true);
    if (content.provider === 'twitter') {
      toast.promise(
        postContent({
          integrationId: formValues.account,
          content,
        }),
        {
          loading: 'Posting content...',
          success: (res) => {
            setIsPosting(false);
            setIsDialogOpen(false);
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
            setIsPosting(false);
            return 'Failed to post content. Please try again.';
          },
          duration: 8000,
        },
      );
    } else if (content.provider === 'linkedin') {
    }
  }

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
                <>
                  <TwitterPreviewPost
                    key={index}
                    integration={integration}
                    message={post.text}
                  />
                  <Separator />
                </>
              ) : null; //linkedin post here
            })}
          </div>
        </ScrollArea>
        <DialogFooter className="px-6">
          {content?.type !== 'long_form_tweet' ? (
            <Button
              className="w-full"
              type="button"
              onClick={handlePost}
              disabled={isPosting}
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
              disabled={isPosting}
            >
              Cancel
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TwitterPreviewPost({
  integration,
  message,
}: {
  integration?: Pick<
    Tables<'integrations'>,
    'id' | 'avatar' | 'provider' | 'username'
  >;
  message: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Avatar>
        <AvatarImage src={integration?.avatar ?? ''} />
        <AvatarFallback>
          {integration?.username ? integration.username[0] : '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold">{integration?.username}</div>
          <div className="text-sm text-muted-foreground">
            @{integration?.username} · now
          </div>
        </div>
        <p
          className="animate-typing space-y-2 text-sm"
          dangerouslySetInnerHTML={{
            __html: message.replace(
              /<br\s*\/?>/gi,
              '<span class="block mt-2"></span>',
            ),
          }}
        ></p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <MessageCircleIcon className="h-4 w-4 text-muted-foreground" />
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <Heart className="h-4 w-4 text-muted-foreground" />
          <ChartNoAxesColumn className="h-4 w-4 text-muted-foreground" />
          <Share className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
