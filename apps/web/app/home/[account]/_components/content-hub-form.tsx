'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { NotebookPen } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

const contentHubFormSchema = z.object({
  beehiivArticleUrl: z.string().url(),
  contentType: z.enum(['pre_nl_cta', 'post_nl_cta', 'thread', 'long_form']),
  account: z.string(),
});

export default function ContentHubForm() {
  const form = useForm<z.infer<typeof contentHubFormSchema>>({
    resolver: zodResolver(contentHubFormSchema),
    defaultValues: {
      beehiivArticleUrl: '',
    },
  });

  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof contentHubFormSchema>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-8">
        <FormField
          control={form.control}
          name="beehiivArticleUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beehiiv Article URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter your Beehiiv article URL"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="m@example.com">m@example.com</SelectItem>
                  <SelectItem value="m@google.com">m@google.com</SelectItem>
                  <SelectItem value="m@support.com">m@support.com</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full gap-2" size="lg">
          Submit
          <NotebookPen className="h-4 w-4" />
        </Button>
      </form>
    </Form>
  );
}
