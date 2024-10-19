'use client';

import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';

import Content from '~/lib/content/types/content';

import LinkedInPreviewPost from '../../_components/preview/linkedin-preview-post';
import TwitterPreviewPost from '../../_components/preview/twitter-preview-post';

export default function ContentDialog({ content }: { content: Content }) {
  const displayedContent =
    content?.edited_content ?? content?.generated_content;
  const integration = content?.integration_id;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Content</Button>
      </DialogTrigger>
      <DialogContent className="w-[450px] px-0">
        <DialogHeader className="mb-2 px-6">
          <DialogTitle>Generated Content</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mx-2 max-h-80 px-4">
          <div className="flex flex-col gap-y-3">
            {displayedContent.post_content.map((post, index) => {
              return integration.provider === 'twitter' ? (
                <div key={index} className="space-y-3">
                  <TwitterPreviewPost
                    integration={content.integration_id}
                    message={post}
                    isViewOnly={true}
                    media={index === 0 ? post.thumbnail : undefined}
                  />
                  {index !== displayedContent.post_content.length - 1 && (
                    <Separator />
                  )}
                </div>
              ) : integration.provider === 'linkedin' ? (
                <div key={index} className="space-y-3">
                  <LinkedInPreviewPost
                    integration={integration}
                    message={post}
                    isViewOnly={true}
                    media={post.thumbnail}
                  />
                  {index !== displayedContent.post_content.length - 1 && (
                    <Separator />
                  )}
                </div>
              ) : null;
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
