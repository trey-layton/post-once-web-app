'use client';

import { useTransition } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { cn } from '@kit/ui/utils';

import {
  TextTestimonialFormSchema,
  VideoTestimonialSchema,
} from '../schema/create-testimonial.schema';
import { createTestimonialAction } from '../server/server-actions';
import { StarRating } from './star-rating';
import { VideoRecorder } from './video-recorder';

type TextTestimonialFormData = z.infer<typeof TextTestimonialFormSchema>;
type VideoTestimonialFormData = z.infer<typeof VideoTestimonialSchema>;

interface TestimonialFormProps {
  className?: string;
  onSuccess?: () => void;
}

interface VideoTestimonialFormProps {
  className?: string;
  maxRecordingTime?: number;
  onSuccess?: () => void;
}

export function TestimonialForm(props: TestimonialFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TextTestimonialFormData>({
    resolver: zodResolver(TextTestimonialFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      type: 'text',
      customerName: '',
      content: '',
      rating: undefined,
    },
  });

  function onSubmit(data: TextTestimonialFormData) {
    startTransition(async () => {
      try {
        await createTestimonialAction(data);

        form.reset();

        if (props.onSuccess) {
          props.onSuccess();
        }
      } catch (error) {
        console.error('Error submitting testimonial:', error);
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          props.className,
          'animate-in fade-in slide-in-from-bottom-2 flex flex-col space-y-4',
        )}
      >
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>

              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Testimonial</FormLabel>

              <FormControl>
                <Textarea placeholder="Share your experience..." {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>

              <FormControl>
                <StarRating
                  rating={form.watch(field.name)}
                  onRatingChange={(value) => {
                    form.setValue(field.name, value, {
                      shouldValidate: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button size={'lg'} type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit Testimonial'}
        </Button>
      </form>
    </Form>
  );
}

export function VideoTestimonialForm(props: VideoTestimonialFormProps) {
  const insertVideoTestimonial = useInsertVideoTestimonialMutation();

  const form = useForm<VideoTestimonialFormData>({
    resolver: zodResolver(VideoTestimonialSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      type: 'video',
      customerName: '',
      content: '',
      rating: undefined,
      video: undefined,
    },
  });

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const handleSubmit = async (data: VideoTestimonialFormData) => {
    const video = await blobToBase64(data.video as unknown as Blob);

    await insertVideoTestimonial.mutateAsync({
      ...data,
      video,
    });

    form.reset();

    if (props.onSuccess) {
      props.onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="animate-in fade-in slide-in-from-bottom-2 flex flex-col space-y-4"
      >
        <If condition={insertVideoTestimonial.isError}>
          <Alert variant="destructive">
            <AlertTitle>Sorry, something went wrong</AlertTitle>

            <AlertDescription>
              Apologies, we were unable to submit your video review. Please try
              again later.
            </AlertDescription>
          </Alert>
        </If>

        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>

              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>

              <FormDescription>
                Your name will be displayed with your video review
              </FormDescription>

              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>

              <FormControl>
                <StarRating
                  rating={form.watch(field.name)}
                  onRatingChange={(value) => {
                    form.setValue(field.name, value, {
                      shouldValidate: true,
                    });
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormControl>
                  <VideoRecorder
                    onVideoRecorded={(video) => {
                      form.setValue(field.name, video as unknown as string, {
                        shouldValidate: true,
                      });
                    }}
                    maxRecordingTime={props.maxRecordingTime}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'video'}
        />

        <If condition={form.formState.isValid}>
          <Button
            size={'lg'}
            className={'w-full'}
            type="submit"
            disabled={insertVideoTestimonial.isPending}
          >
            {insertVideoTestimonial.isPending
              ? 'Submitting...'
              : 'Submit Video Review'}
          </Button>
        </If>
      </form>
    </Form>
  );
}

function useInsertVideoTestimonialMutation() {
  const mutationFn = async (body: z.infer<typeof VideoTestimonialSchema>) => {
    const response = await fetch(`/api/testimonials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to submit video testimonial');
    }

    return (await response.json()) as Promise<{ success: boolean }>;
  };

  return useMutation({ mutationFn });
}
