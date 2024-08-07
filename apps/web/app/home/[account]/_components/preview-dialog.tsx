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

import { generateContent } from '../_lib/server/server-actions';

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

export default function PreviewDialog({
  isSubmitted,
  setIsSubmitted,
  integrations,
  formValues,
}: {
  isSubmitted: boolean;
  setIsSubmitted: (isSubmitted: boolean) => void;
  integrations: Tables<'integrations'>[];
  formValues: z.infer<typeof contentHubFormSchema>;
}) {
  const workspace = useTeamAccountWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
          <Button className="w-full" disabled>
            Post
          </Button>
          <Button className="w-full" variant="secondary" disabled>
            Regenerate
          </Button>
          <DialogClose asChild>
            <Button type="submit" variant="secondary" className="w-full">
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
  integration?: Tables<'integrations'>;
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
          className="animate-typing text-sm"
          dangerouslySetInnerHTML={{ __html: message }}
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
