## Testimonial Collection Plugin for Makerkit

This plugin allows Makerkit users to easily collect and manage testimonials from their customers. It integrates seamlessly with the existing Makerkit structure and provides both backend and frontend components.

## Features

1. Testimonial submission form and manual entry
2. Admin panel for managing testimonials
3. API endpoints for CRUD operations
4. Widgets components for showing testimonials on the website

## Installation

To install the plugin, run the following command:

```bash
npx @makerkit/cli plugins install
```

Please select the `testimonial` plugin from the list of available plugins.

### Migration

Create a new migration file by running the following command:

```bash
pnpm --filter web supabase migration new testimonials
```

And place the content you can see at `packages/plugins/testimonial/migrations/migration.sql` into the newly created file.

Then run the migration:

```bash
pnpm run supabase:web:reset
```

And update the types:

```bash
pnpm run supabase:web:typegen
```

Once the plugin is added to your repository, please install it as a dependency in your application in the package.json file of `apps/web`:

```json
{
    "dependencies": {
      "@kit/testimonial": "workspace:*"
    }
}
```

Now run the following command to install the plugin:

```bash
pnpm i
```

You can now add the Admin pages from where you can manage the testimonials. To do so, add the following code to the `apps/web/app/admin/testimonials/page.tsx` file:

```tsx
import { TestimonialsPage } from '@kit/testimonial/admin';

export default TestimonialsPage;
```

And now the testimonial's page at  `apps/web/app/admin/testimonials/[id]/page.tsx`:

```tsx
import { TestimonialPage } from '@kit/testimonial/admin';

export default TestimonialPage;
```

Add the sidebar item as well at `apps/web/app/admin/_components/admin-sidebar.tsx`:

```tsx
<SidebarItem
    path={'/admin/testimonials'}
    Icon={<StarIcon className={'h-4'} />}
>
    Testimonials
</SidebarItem>
```

You can now run the application and navigate to the Admin panel to manage the testimonials.

## Displaying the Testimonial Form

To display the testimonial form on your website, you can import the form component from the plugin and use it in your page.

Create a new component, and import the form:

```tsx
'use client';

import { useState } from 'react';

import {
  TestimonialContainer,
  TestimonialForm,
  TestimonialSuccessMessage,
  VideoTestimonialForm,
} from '@kit/testimonial/client';

export function Testimonial() {
  const [success, setSuccess] = useState(false);
  const onSuccess = () => setSuccess(true);

  if (success) {
    return <SuccessMessage />;
  }

  return (
    <TestimonialContainer
      className={
        'w-full max-w-md rounded-lg border bg-background p-8 shadow-xl'
      }
      welcomeMessage={<WelcomeMessage />}
      enableTextReview={true}
      enableVideoReview={true}
      textReviewComponent={<TestimonialForm onSuccess={onSuccess} />}
      videoReviewComponent={<VideoTestimonialForm onSuccess={onSuccess} />}
      textButtonText="Write your thoughts"
      videoButtonText="Share a video message"
      backButtonText="Switch review method"
    />
  );
}

function SuccessMessage() {
  return (
    <div
      className={
        'w-full max-w-md rounded-lg border bg-background p-8 shadow-xl'
      }
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Thank you for your feedback!
          </h1>

          <p className="text-muted-foreground">
            Your review has been submitted successfully.
          </p>
        </div>

        <div>
          <TestimonialSuccessMessage />
        </div>
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center space-y-1 text-center">
      <h1 className="text-2xl font-semibold">
        We&apos;d love to hear your feedback!
      </h1>

      <p className="text-muted-foreground">
        Your opinion helps us improve our service.
      </p>
    </div>
  );
}
```

Please customize the components as needed to fit your website's design.

## API Endpoints

Please add the GET endpoint to fetch the testimonials at `apps/web/app/api/testimonials/route.ts`:

```ts
import {
    createTestimonialsRouteHandler,
    createVideoTestimonialRouteHandler,
} from '@kit/testimonial/server';

export const GET = createTestimonialsRouteHandler;
export const POST = createVideoTestimonialRouteHandler;
```

## Widgets

To display the testimonials on your website, you can use the following widget:

```tsx
import { TestimonialWallWidget } from '@kit/testimonial/widgets';

export default function TestimonialWidgetPage() {
    return (
        <div className={'flex h-full w-screen flex-1 flex-col items-center py-16'}>
            <TestimonialWallWidget />
        </div>
    );
}
```

Done! You now have a fully functional Testimonial Collection plugin integrated with your Makerkit application.
