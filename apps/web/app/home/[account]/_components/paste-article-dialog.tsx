'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@kit/ui/form';
import { Textarea } from '@kit/ui/textarea';

const pasteArticleSchema = z.object({
  content: z.string().min(1, 'Article content is required'),
});

type PasteArticleFormValues = z.infer<typeof pasteArticleSchema>;

export default function PasteArticleDialog({
  onArticleSubmit,
  initialContent = '',
  open,
  setOpen,
}: {
  onArticleSubmit: (content: string) => void;
  initialContent?: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const form = useForm<PasteArticleFormValues>({
    resolver: zodResolver(pasteArticleSchema),
    defaultValues: {
      content: initialContent,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ content: initialContent });
    }
  }, [open, initialContent, form]);

  function onSubmit(data: PasteArticleFormValues) {
    onArticleSubmit(data.content);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialContent ? 'Edit Article Content' : 'Paste Article Content'}
          </DialogTitle>
          <DialogDescription>
            {initialContent
              ? 'Edit your article content here.'
              : 'Paste your article content here. The content will be processed and used instead of selecting from Beehiiv.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({
                field,
              }: {
                field: ControllerRenderProps<PasteArticleFormValues, 'content'>;
              }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Paste or edit your article content here..."
                      className="min-h-[300px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {initialContent ? 'Update' : 'Continue'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}