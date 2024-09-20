'use client';

import React, { ReactNode, useState } from 'react';

import { PencilIcon, VideoIcon } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

interface TestimonialContainerProps {
  className?: string;
  welcomeMessage: ReactNode;
  enableTextReview: boolean;
  enableVideoReview: boolean;
  textReviewComponent: ReactNode;
  videoReviewComponent: ReactNode;
  successMessage?: ReactNode;
  chooseText?: string;
  textButtonText?: string;
  videoButtonText?: string;
  backButtonText?: string;
}

export function TestimonialContainer({
  className,
  welcomeMessage,
  enableTextReview,
  enableVideoReview,
  textReviewComponent,
  videoReviewComponent,
  textButtonText = 'Write a review',
  videoButtonText = 'Record a video review',
  backButtonText = 'Choose a different review type',
}: TestimonialContainerProps) {
  const onlyOptionAvailable =
    enableTextReview && !enableVideoReview
      ? 'text'
      : enableVideoReview && !enableTextReview
        ? 'video'
        : null;

  const [reviewType, setReviewType] = useState<'text' | 'video' | null>(
    onlyOptionAvailable,
  );

  return (
    <div className={cn(className, 'space-y-6')}>
      {welcomeMessage}

      {!reviewType && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2.5">
            {enableTextReview && (
              <Button
                className={'relative'}
                size={'lg'}
                variant={'outline'}
                onClick={() => setReviewType('text')}
              >
                <PencilIcon className={'absolute left-3 h-4'} />
                <span>{textButtonText}</span>
              </Button>
            )}

            {enableVideoReview && (
              <Button
                className={'relative'}
                size={'lg'}
                onClick={() => setReviewType('video')}
              >
                <VideoIcon className={'absolute left-4 h-4'} />
                <span>{videoButtonText}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {reviewType === 'text' && enableTextReview && textReviewComponent}

      {reviewType === 'video' && enableVideoReview && videoReviewComponent}

      {!onlyOptionAvailable && reviewType && (
        <div className={'flex flex-col justify-center space-y-4'}>
          <hr />

          <Button
            size={'sm'}
            variant="link"
            onClick={() => setReviewType(null)}
          >
            {backButtonText}
          </Button>
        </div>
      )}
    </div>
  );
}
