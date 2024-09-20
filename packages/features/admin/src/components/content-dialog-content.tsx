'use client';

import { DialogContent, DialogHeader, DialogTitle } from '@kit/ui/dialog';
import { ScrollArea } from '@kit/ui/scroll-area';
import { Separator } from '@kit/ui/separator';

import { AdminContent } from '../lib/server/schema/admin-content.schema';
import LinkedInPreviewPost from './linkedin-preview-post';
import TwitterPreviewPost from './twitter-preview-post';

export default function ContentDialogContent({
  content,
}: {
  content: AdminContent;
}) {
  const displayedContent =
    content?.edited_content ?? content?.generated_content;
  const integration = content?.integration_id;

  return (
    <DialogContent className="w-[450px] px-0">
      <DialogHeader className="mb-2 px-6">
        <DialogTitle>Generated Content</DialogTitle>
      </DialogHeader>
      <ScrollArea className="mx-2 max-h-80 px-4">
        <div className="flex flex-col gap-y-3">
          {displayedContent.content.map((post, index) => {
            return integration.provider === 'twitter' ? (
              <div key={index} className="space-y-3">
                <TwitterPreviewPost
                  integration={content.integration_id}
                  message={post}
                  isViewOnly={true}
                  media={
                    index === 0 ? displayedContent.thumbnail_url : undefined
                  }
                />
                {index !== displayedContent.content.length - 1 && <Separator />}
              </div>
            ) : integration.provider === 'linkedin' ? (
              <div key={index} className="space-y-3">
                <LinkedInPreviewPost
                  integration={integration}
                  message={post}
                  isViewOnly={true}
                  media={displayedContent.thumbnail_url}
                />
                {index !== displayedContent.content.length - 1 && <Separator />}
              </div>
            ) : null;
          })}
        </div>
      </ScrollArea>
    </DialogContent>
  );
}
