'use client';

import { useState } from 'react';

import Image from 'next/image';

import {
  ChartNoAxesColumn,
  Check,
  Heart,
  MessageCircleIcon,
  Pencil,
  Repeat,
  Share,
  X,
} from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { cn } from '@kit/ui/utils';

import { GeneratedContent } from '~/lib/forms/types/generated-content.schema';

type TwitterPreviewPostProps =
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

export default function TwitterPreviewPost({
  integration,
  message,
  onSave,
  media,
  isViewOnly,
}: TwitterPreviewPostProps) {
  const [isEdit, setIsEdit] = useState(false);
  const [editedText, setEditedText] = useState(message.post_content);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative flex items-start gap-3">
      {message.post_content.length !== 0 &&
        !isViewOnly &&
        (!isEdit ? (
          <button
            className="absolute right-0.5 top-0.5 text-muted-foreground/70 transition hover:text-muted-foreground"
            onClick={() => setIsEdit(true)}
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="absolute right-0.5 top-0.5 flex gap-2">
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
        <div className="ml-1 flex items-center gap-2">
          <div className="text-sm font-bold">{integration?.username}</div>
          <div className="text-sm text-muted-foreground">
            @{integration?.username} · now
          </div>
        </div>
        {message.post_content.length !== 0 &&
          (!isEdit ? (
            <>
              <p className="animate-typing mx-1 whitespace-pre-wrap border border-background pb-2 text-sm leading-[1.125rem]">
                {message.post_content}
              </p>
              {message.thumbnail && message.pageTitle && message.domain && (
                <>
                  <div className="relative mb-1 overflow-hidden rounded-xl border">
                    <img
                      src={message.thumbnail}
                      alt={message.pageTitle}
                      className="aspect-video object-cover"
                    />
                    <div className="absolute bottom-0 left-0 m-3 rounded-sm bg-black bg-opacity-60 px-1.5 py-0.5 text-xs font-medium text-white">
                      {message.pageTitle}
                    </div>
                  </div>
                  <div className="mb-2 text-xs text-muted-foreground">
                    From {message.domain}
                  </div>
                </>
              )}
            </>
          ) : (
            <textarea
              className={cn(
                'w-full rounded-md border border-border bg-background px-1 pb-0.5 text-sm leading-[1.125rem]',
                hasError && 'border-red-500',
              )}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={message.post_type === 'long_post' ? 20 : 3}
            ></textarea>
          ))}
        {(message.image_url || media) && (
          <div className="relative mb-4 mt-2 w-full overflow-hidden rounded-xl">
            <Image
              src={message.image_url || media!}
              alt="Twitter Post Media"
              layout="responsive"
              objectFit="cover"
              width={100}
              height={100}
            />
          </div>
        )}
        <div className="ml-1 flex items-center justify-between gap-4">
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
