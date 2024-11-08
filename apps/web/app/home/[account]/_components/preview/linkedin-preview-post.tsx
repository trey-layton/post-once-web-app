'use client';

import { useState } from 'react';

import Image from 'next/image';

import {
  Check,
  Earth,
  MessageSquareText,
  MousePointer2,
  Pencil,
  Repeat2,
  ThumbsUp,
  X,
} from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { cn } from '@kit/ui/utils';

import { GeneratedContent } from '~/lib/forms/types/generated-content.schema';

type LinkedInPreviewPostProps =
  | {
      isViewOnly: true;
      integration?: Pick<
        Tables<'integrations'>,
        'avatar' | 'provider' | 'username'
      >;
      message: GeneratedContent['content'][number]['post_content'][number];
      media?: string;
      onSave?: never;
    }
  | {
      isViewOnly: false;
      integration?: Pick<
        Tables<'integrations'>,
        'avatar' | 'provider' | 'username'
      >;
      message: GeneratedContent['content'][number]['post_content'][number];
      media?: string;
      onSave: (newText: string) => void;
    };

export default function LinkedInPreviewPost({
  integration,
  message,
  onSave,
  media,
  isViewOnly,
}: LinkedInPreviewPostProps) {
  const [isEdit, setIsEdit] = useState(false);
  const [editedText, setEditedText] = useState(message.post_content);
  const [hasError, setHasError] = useState(false);

  return (
    <>
      <div className="relative flex items-start gap-4 px-1">
        {!isViewOnly &&
          (!isEdit ? (
            <button
              className="absolute right-1 top-1 text-muted-foreground/70 transition hover:text-muted-foreground"
              onClick={() => setIsEdit(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute right-1 top-1 flex gap-2">
              <button
                className="text-muted-foreground transition hover:text-red-500 dark:hover:text-red-400"
                onClick={() => {
                  setIsEdit(false);
                  setEditedText(message.post_content);
                  setHasError(false);
                }}
              >
                <X className="h-5 w-5" />
              </button>
              <button
                className="text-muted-foreground transition hover:text-green-500 dark:hover:text-green-400"
                onClick={() => {
                  if (editedText.trim() === '') {
                    setHasError(true);
                  } else {
                    setIsEdit(false);
                    setHasError(false);
                    onSave(editedText);
                  }
                }}
              >
                <Check className="h-5 w-5" />
              </button>
            </div>
          ))}
        <Avatar>
          <AvatarImage src={integration?.avatar ?? ''} />
          <AvatarFallback>
            {integration?.username ? integration.username[0] : '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold">{integration?.username}</div>
            <div className="text-sm text-muted-foreground">· 1st</div>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-xs text-muted-foreground">now</div>
            <div className="text-xs">·</div>
            <Earth className="h-3 w-3" />
          </div>
        </div>
      </div>
      {!isEdit ? (
        <p className="animate-typing space-y-2 whitespace-pre-wrap border border-background px-1 text-sm">
          {message.post_content}
        </p>
      ) : (
        <textarea
          className={cn(
            'w-full rounded-md border border-border bg-background px-1 text-sm',
            hasError && 'border-red-500',
          )}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={25}
        ></textarea>
      )}
      {media && (
        <div className="relative w-full">
          <Image
            src={media}
            alt="LinkedIn Post Media"
            layout="responsive"
            objectFit="cover"
            width={100}
            height={100}
          />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-4 px-6 text-muted-foreground">
        <div className="flex flex-col items-center gap-0.5">
          <ThumbsUp className="h-4 w-4 scale-x-[-1]" />
          <span className="text-xs font-medium">Like</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MessageSquareText className="h-4 w-4 scale-x-[-1]" />
          <span className="text-xs font-medium">Comment</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <Repeat2 className="h-4 w-4 rotate-90" />
          <span className="text-xs font-medium">Repost</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <MousePointer2 className="h-4 w-4 scale-x-[-1]" />
          <span className="text-xs font-medium">Send</span>
        </div>
      </div>
    </>
  );
}
