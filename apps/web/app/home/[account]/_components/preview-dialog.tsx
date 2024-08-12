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
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Separator } from '@kit/ui/separator';

import { generateContent, postContent } from '../_lib/server/server-actions';

const contentHubFormSchema = z.object({
  beehiivArticleId: z.string(),
  contentType: z.enum([
    'pre_nl_cta',
    'post_nl_cta',
    'thread',
    'long_form',
    'long_form_li',
  ]),
  account: z.string(),
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
  const workspace = useTeamAccountWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const integration = integrations.find(
    (integration) => integration.id === formValues.account,
  );

  const mutation = useMutation({
    mutationFn: () =>
      generateContent({ ...formValues, accountId: workspace.account.id }),
    onMutate: () => {
      toast.loading('Generating content...');
    },
    onSuccess: (response) => {
      toast.dismiss();
      toast.success('Content generated successfully.');
      setMessages(response.content);
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
    setIsPosting(true);
    toast.promise(
      postContent({
        integrationId: formValues.account,
        content: messages,
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
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="w-[450px]">
        <DialogHeader className="mb-2">
          <DialogTitle>Generated Content Preview</DialogTitle>
        </DialogHeader>
        {messages.map((message, index) => (
          <div key={index} className="space-y-4">
            <TwitterPreviewPost integration={integration} message={message} />
            {index !== 1 && <Separator />}
          </div>
        ))}
        <DialogFooter>
          <Button
            className="w-full"
            type="button"
            onClick={handlePost}
            disabled={isPosting}
          >
            Post
          </Button>
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
