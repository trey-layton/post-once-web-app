'use client';

import { useState } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '@kit/ui/dialog';

import { TestimonialContainer } from './testimonial-container';
import { TestimonialForm } from './testimonial-form';
import { VideoTestimonialForm } from './testimonial-form';
import { TestimonialSuccessMessage } from './testimonial-success-message';

export function TestimonialDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const onSuccess = () => setSuccess(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {!success ? (
          <TestimonialContainer
            welcomeMessage={<WelcomeMessage />}
            enableTextReview={true}
            enableVideoReview={false}
            textReviewComponent={<TestimonialForm onSuccess={onSuccess} />}
            videoReviewComponent={
              <VideoTestimonialForm onSuccess={onSuccess} />
            }
            textButtonText="Write your thoughts"
            videoButtonText="Share a video message"
            backButtonText="Switch review method"
          />
        ) : (
          <SuccessMessage />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SuccessMessage() {
  return (
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Thank you for your feedback!</h1>

        <p className="text-muted-foreground">
          Your review has been submitted successfully.
        </p>
      </div>

      <div>
        <TestimonialSuccessMessage />
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center space-y-1 p-3 text-center">
      <h1 className="text-2xl font-semibold">
        We&apos;d love to hear your feedback!
      </h1>

      <p className="text-muted-foreground">
        Your opinion helps us improve our service.
      </p>
    </div>
  );
}
