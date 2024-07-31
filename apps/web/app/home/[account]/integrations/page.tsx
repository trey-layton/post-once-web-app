import Link from 'next/link';

import {
  InstagramLogoIcon,
  LinkedInLogoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons';
import {
  ArrowRight,
  Bolt,
  Book,
  CheckIcon,
  Facebook,
  FilePen,
  Gauge,
  Heart,
  Inbox,
  MessageCircleIcon,
  Plus,
  Recycle,
  Repeat,
  Share,
  Wand,
  X,
} from 'lucide-react';

import { getSupabaseServerComponentClient } from '@kit/supabase/server-component-client';
import { createTeamAccountsApi } from '@kit/team-accounts/api';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button, buttonVariants } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { PageBody, PageHeader } from '@kit/ui/page';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Separator } from '@kit/ui/separator';
import { cn } from '@kit/ui/utils';

import { createIntegrationsService } from '~/lib/integrations/integrations.service';

import IntegrationsDataTable from '../_components/integrations-data-table';

//!DON'T HARDCODE
const codeChallenge = 'sU8s5R59RD6TmljksbSQpAhuXeYQ7d7wGc1SFJnhV3c';

interface IntegrationsPageProps {
  params: {
    account: string;
  };
}

//!DELETE BUTTON

export default async function IntegrationsPage({
  params,
}: IntegrationsPageProps) {
  const supabase = getSupabaseServerComponentClient();
  const api = createTeamAccountsApi(supabase);
  const integrationsService = createIntegrationsService(supabase);

  const team = await api.getTeamAccount(params.account);
  const { data } = await integrationsService.getIntegrations({
    accountSlug: params.account,
  });

  const providers = [
    {
      name: 'linkedin',
      label: 'LinkedIn',
      authUrl: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI}?account=${team.id}&slug=${params.account}`)}&scope=openid%20profile%20email`,
    },
    {
      name: 'twitter',
      label: 'Twitter',
      authUrl: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${process.env.NEXT_PUBLIC_TWITTER_REDIRECT_URI}?account=${team.id}&slug=${params.account}`)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${encodeURIComponent(params.account)}&code_challenge=${codeChallenge}&code_challenge_method=S256`,
    },
    {
      name: 'threads',
      label: 'Threads',
      authUrl: `https://threads.net/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_THREADS_CLIENT_ID}&redirect_uri=${encodeURIComponent('https://post-once-web-app.vercel.app/api/integrations/threads')}&scope=threads_basic,threads_content_publish&response_type=code&state=${encodeURIComponent(JSON.stringify({ account: team.id, slug: params.account }))}`,
    },
  ];

  return (
    <>
      <PageHeader
        title={'Integrations'}
        description={
          'Here are your integrations. You can add, edit, and remove them here.'
        }
      />

      <PageBody>
        <div className="flex flex-col items-center justify-center bg-background py-12">
          <Card className="w-full max-w-md space-y-6 p-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">
                Let's get your newsletter connected
              </h1>
              <p className="text-muted-foreground">
                Enter your beehiiv API key to connect your newsletter.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">beehiiv API Key</Label>
                <Input id="api-key" placeholder="Enter your API key" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">How to do this</h3>
                <ol className="space-y-2 text-muted-foreground">
                  <li>
                    <span className="font-medium">
                      1. Navigate to Settings from your beehiiv Dashboard,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      2. Click Integrations on the left hand navigation menu,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      3. Scroll down and select 'New API Key',
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      4. Give it a name like 'PostOnce API Key' and click Create
                      New Key,
                    </span>
                  </li>
                  <li>
                    <span className="font-medium">
                      5. Copy this key and paste it in the field above.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Button>Connect Newsletter</Button>
              <div className="mt-4 text-sm text-muted-foreground">
                <Link href="#" className="hover:underline" prefetch={false}>
                  Do this later
                </Link>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex min-h-screen flex-col bg-background">
          <header className="flex h-16 shrink-0 items-center border-b px-6">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
              prefetch={false}
            >
              <Recycle className="h-6 w-6" />
              <span>PostOnce</span>
            </Link>
            <nav className="ml-auto flex items-center gap-4">
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
                prefetch={false}
              >
                Accounts
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground"
                prefetch={false}
              >
                Settings
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Feedback
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>AC</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5 text-xs">
                  <div className="font-medium">John Doe</div>
                  <div className="text-muted-foreground">Newsletter</div>
                </div>
              </div>
            </nav>
          </header>
          <main className="flex flex-1 items-start justify-center gap-6 p-6">
            <div className="w-full max-w-md">
              <Card className="flex flex-col gap-4">
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>
                    Quickly access your content repurposing tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Link
                    href="#"
                    className="relative flex flex-col items-center gap-2 rounded-lg border-2 border-primary bg-muted p-4 transition-colors hover:bg-muted/50"
                    prefetch={false}
                  >
                    <TwitterLogoIcon className="h-8 w-8" />
                    <span className="text-sm font-medium">Twitter</span>
                    <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  </Link>
                  <Link
                    href="#"
                    className="relative flex flex-col items-center gap-2 rounded-lg border-2 border-primary bg-muted p-4 transition-colors hover:bg-muted/50"
                    prefetch={false}
                  >
                    <InstagramLogoIcon className="h-8 w-8" />
                    <span className="text-sm font-medium">Instagram</span>
                    <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  </Link>
                  <Link
                    href="#"
                    className="relative flex flex-col items-center gap-2 rounded-lg border-2 border-primary bg-muted p-4 transition-colors hover:bg-muted/50"
                    prefetch={false}
                  >
                    <LinkedInLogoIcon className="h-8 w-8" />
                    <span className="text-sm font-medium">LinkedIn</span>
                    <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="h-3 w-3" />
                    </div>
                  </Link>
                  <Link
                    href="#"
                    className="relative flex flex-col items-center gap-2 rounded-lg bg-muted p-4 transition-colors hover:bg-muted/50"
                    prefetch={false}
                  >
                    <Facebook className="h-8 w-8" />
                    <span className="text-sm font-medium">Facebook</span>
                    <div className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Plus className="h-3 w-3" />
                    </div>
                  </Link>
                  <a
                    href="#"
                    className="relative flex flex-col items-center gap-2 rounded-lg bg-muted p-4 transition-colors hover:bg-muted/50"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-sm font-medium">
                      Request Platform
                    </span>
                  </a>
                </CardContent>
              </Card>
            </div>
            <div className="w-full max-w-md">
              <Card className="flex flex-col gap-4">
                <CardHeader>
                  <CardTitle>Content Hub</CardTitle>
                  <CardDescription>
                    Easily access the main features of the tool.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="beehiiv-url">Beehiiv Article URL</Label>
                    <Input
                      id="beehiiv-url"
                      placeholder="Enter your Beehiiv article URL"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select id="content-type" className="w-full">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select content type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="pre-newsletter-cta">
                            <div className="flex items-center gap-2">
                              <TwitterLogoIcon className="h-5 w-5" />
                              <span>Pre-Newsletter CTA</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="post-newsletter-cta">
                            <div className="flex items-center gap-2">
                              <TwitterLogoIcon className="h-5 w-5" />
                              <span>Post-Newsletter CTA</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter-thread">
                            <div className="flex items-center gap-2">
                              <TwitterLogoIcon className="h-5 w-5" />
                              <span>Thread</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="twitter-long-form">
                            <div className="flex items-center gap-2">
                              <TwitterLogoIcon className="h-5 w-5" />
                              <span>Long-form Post</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="linkedin-long-form">
                            <div className="flex items-center gap-2">
                              <LinkedInLogoIcon className="h-5 w-5" />
                              <span>Long-form Post</span>
                            </div>
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <Link
                    href="#"
                    className="flex flex-col items-center gap-2 rounded-lg bg-primary p-4 text-primary-foreground transition-colors hover:bg-primary/90"
                    prefetch={false}
                  >
                    <Book className="h-8 w-8" />
                    <span className="text-sm font-medium">Generate</span>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <div className="flex min-h-[100dvh] flex-col">
          <header className="flex h-14 items-center px-4 lg:px-6">
            <Link
              href="#"
              className="flex items-center justify-center"
              prefetch={false}
            >
              <img
                src="/placeholder.svg"
                width="24"
                height="24"
                alt="Acme Inc"
                className="h-6 w-6"
              />
              <span className="sr-only">Acme Inc</span>
            </Link>
            <nav className="ml-auto flex gap-4 sm:gap-6">
              <Link
                href="#"
                className="text-sm font-medium underline-offset-4 hover:underline"
                prefetch={false}
              >
                Features
              </Link>
              <Link
                href="#"
                className="text-sm font-medium underline-offset-4 hover:underline"
                prefetch={false}
              >
                Pricing
              </Link>
              <Link
                href="#"
                className="text-sm font-medium underline-offset-4 hover:underline"
                prefetch={false}
              >
                About
              </Link>
              <Link
                href="#"
                className="text-sm font-medium underline-offset-4 hover:underline"
                prefetch={false}
              >
                Contact
              </Link>
            </nav>
          </header>
          <main className="flex-1">
            <section className="relative w-full bg-gradient-to-br from-primary to-secondary py-24 md:py-32 lg:py-40">
              <div className="container px-4 md:px-6">
                <div className="mx-auto max-w-3xl space-y-6 text-center">
                  <h1 className="text-4xl font-bold tracking-tighter text-primary-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                    Transform Your Newsletter into Engaging Social Media Content
                    in Minutes
                  </h1>
                  <p className="text-lg text-primary-foreground md:text-xl lg:text-2xl">
                    AI-powered content repurposing for busy newsletter writers
                  </p>
                  <div>
                    <Button
                      size="lg"
                      className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-50 blur-3xl" />
                <div className="animate-transform-content absolute inset-0 bg-[url('/newsletter-to-social.gif')] bg-cover bg-center bg-no-repeat opacity-20" />
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      Key Benefits
                    </h2>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Our AI-powered content repurposing tool helps you
                      transform your newsletter content into engaging social
                      media posts in just a few clicks.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Bolt className="h-8 w-8" />
                      <h3 className="text-xl font-bold">Save Time</h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Cut content creation time by 90%
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Wand className="h-8 w-8" />
                      <h3 className="text-xl font-bold">Boost Engagement</h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Consistent, platform-optimized posts
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Gauge className="h-8 w-8" />
                      <h3 className="text-xl font-bold">Grow Audience</h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Drive more newsletter subscriptions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      How It Works
                    </h2>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Our AI-powered content repurposing tool makes it easy to
                      transform your newsletter content into engaging social
                      media posts.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Inbox className="h-8 w-8" />
                      <h3 className="text-xl font-bold">
                        Connect your newsletter
                      </h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Link your newsletter account and we'll analyze your
                        content.
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Wand className="h-8 w-8" />
                      <h3 className="text-xl font-bold">
                        Choose content types
                      </h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Select the social media platforms and post formats you
                        want to create.
                      </p>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <Gauge className="h-8 w-8" />
                      <h3 className="text-xl font-bold">Review and post</h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Preview your content, make any adjustments, and schedule
                        or publish directly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      Supported Platforms
                    </h2>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Transform your newsletter content into engaging posts for
                      the platforms your audience uses.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <img
                        src="/placeholder.svg"
                        width="48"
                        height="48"
                        alt="Twitter"
                        className="h-12 w-12"
                      />
                      <h3 className="text-xl font-bold">Twitter</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <img
                        src="/placeholder.svg"
                        width="48"
                        height="48"
                        alt="LinkedIn"
                        className="h-12 w-12"
                      />
                      <h3 className="text-xl font-bold">LinkedIn</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6 opacity-50 blur-sm">
                      <img
                        src="/placeholder.svg"
                        width="48"
                        height="48"
                        alt="Threads"
                        className="h-12 w-12"
                      />
                      <h3 className="text-xl font-bold">Threads</h3>
                      <p className="text-center text-sm text-primary-foreground/80">
                        Coming soon
                      </p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      className="inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Request other platforms
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      Testimonials
                    </h2>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      Hear what our customers have to say about our AI-powered
                      content repurposing tool.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 justify-center gap-6 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex flex-col items-center justify-center space-y-2 rounded-md bg-primary/10 p-6">
                      <blockquote className="text-lg font-semibold leading-snug">
                        "I used to spend 4 hours researching, writing, then
                        editing my newsletter. Then, I'd spend just as much time
                        going back through and picking out pieces that I wanted
                        to then rewrite to fit each social platform. Now, I do
                        all of this in minutes, and it's better than if I'd
                        tried to do it myself."
                      </blockquote>
                      <div>
                        <div className="font-semibold">
                          Trey, Creator of The Startup Breakdown
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      Pricing
                    </h2>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      7-Day Free Trial, No Credit Card Required
                    </p>
                    <p className="max-w-[900px] text-primary-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                      $9.99/month after trial
                    </p>
                  </div>
                  <div>
                    <Button
                      size="lg"
                      className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
            <section className="w-full bg-gradient-to-br from-primary to-secondary py-12 md:py-24 lg:py-32">
              <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center text-primary-foreground">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                      Ready to supercharge your social media presence?
                    </h2>
                    <Button
                      size="lg"
                      className="inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium transition-colors hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      Start Your Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-center text-sm text-primary-foreground/80">
                      Contact us at laytontrey3@gmail.com
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </main>
          <footer className="flex flex-col gap-2 sm:flex" />
        </div>
        <div className="mx-auto max-w-md space-y-6 px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Connect Socials
            </h2>
            <p className="text-muted-foreground">
              Connect your social accounts to get started.
            </p>
          </div>
          <div className="space-y-2">
            <Button variant="outline" className="w-full">
              Connect Twitter
            </Button>
            <Button variant="outline" className="w-full">
              Connect LinkedIn
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Do this later
          </div>
        </div>
        <div className="flex h-screen flex-col">
          <header className="flex items-center justify-between bg-black px-4 py-3 text-white">
            <h1 className="text-lg font-semibold">Previewing Twitter Thread</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white">
                <FilePen className="h-5 w-5" />
                <span className="sr-only">Edit</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </header>
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-2xl px-4 py-8">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <Avatar className="shrink-0 border-2 border-primary">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-black">Shadcn</div>
                      <div className="text-sm text-gray-500">@shadcn</div>
                      <div className="text-sm text-gray-500">· 2h</div>
                    </div>
                    <div className="text-black">
                      <p className="animate-typing">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        Sed euismod, nisl nec ultricies lacinia, nisl nisl
                        aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed
                        euismod, nisl nec ultricies lacinia, nisl nisl aliquam
                        nisl, eget aliquam nisl nisl sit amet nisl.
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <MessageCircleIcon className="h-5 w-5" />
                        <span className="sr-only">Reply</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Repeat className="h-5 w-5" />
                        <span className="sr-only">Retweet</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Heart className="h-5 w-5" />
                        <span className="sr-only">Like</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Share className="h-5 w-5" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <Avatar className="shrink-0 border-2 border-primary">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-black">Shadcn</div>
                      <div className="text-sm text-gray-500">@shadcn</div>
                      <div className="text-sm text-gray-500">· 2h</div>
                    </div>
                    <div className="text-black">
                      <p className="animate-typing">
                        Sed euismod, nisl nec ultricies lacinia, nisl nisl
                        aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed
                        euismod, nisl nec ultricies lacinia, nisl nisl aliquam
                        nisl, eget aliquam nisl nisl sit amet nisl.
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <MessageCircleIcon className="h-5 w-5" />
                        <span className="sr-only">Reply</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Repeat className="h-5 w-5" />
                        <span className="sr-only">Retweet</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Heart className="h-5 w-5" />
                        <span className="sr-only">Like</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Share className="h-5 w-5" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-4">
                  <Avatar className="shrink-0 border-2 border-primary">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-black">Shadcn</div>
                      <div className="text-sm text-gray-500">@shadcn</div>
                      <div className="text-sm text-gray-500">· 2h</div>
                    </div>
                    <div className="text-black">
                      <p className="animate-typing">
                        Sed euismod, nisl nec ultricies lacinia, nisl nisl
                        aliquam nisl, eget aliquam nisl nisl sit amet nisl. Sed
                        euismod, nisl nec ultricies lacinia, nisl nisl aliquam
                        nisl, eget aliquam nisl nisl sit amet nisl.
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <MessageCircleIcon className="h-5 w-5" />
                        <span className="sr-only">Reply</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Repeat className="h-5 w-5" />
                        <span className="sr-only">Retweet</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Heart className="h-5 w-5" />
                        <span className="sr-only">Like</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-primary"
                      >
                        <Share className="h-5 w-5" />
                        <span className="sr-only">Share</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-4">
                  <Button>Post</Button>
                  <Button variant="secondary">Regenerate</Button>
                  <Button variant="secondary">Cancel</Button>
                </div>
              </div>
            </div>
          </div>
          {/* {postStatus === 'success' && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Success!</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your tweet has been posted successfully.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {postStatus === 'error' && (
            <AlertDialog>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Failed to post</AlertDialogTitle>
                  <AlertDialogDescription>
                    There was an error posting your tweet. Please try again
                    later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )} */}
        </div>
      </PageBody>
    </>
  );
}
