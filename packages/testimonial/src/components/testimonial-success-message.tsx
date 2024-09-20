'use client';

import React from 'react';

import { createPortal } from 'react-dom';

import ReactConfetti from 'react-confetti';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';

export function TestimonialSuccessMessage() {
  return (
    <>
      <Alert variant={'success'}>
        <AlertTitle>Thank you for your testimonial!</AlertTitle>

        <AlertDescription>
          Your feedback helps us improve our services. We appreciate your time!
        </AlertDescription>
      </Alert>

      {createPortal(
        <ReactConfetti numberOfPieces={1000} recycle={false} />,
        document.body,
      )}
    </>
  );
}
