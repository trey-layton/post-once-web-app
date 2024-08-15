/**
 * Create a Posthog analytics service.
 */
export function createPostHogAnalyticsService() {
  //!USE ENV
  const projectKey = 'phc_9XGZpZROmsbTNXhUcpcBBOpHkzk9m1FfBw2L0HxfQcs';

  const posthogUrl = 'https://us.i.posthog.com/capture/';

  return new PostHogAnalyticsService(projectKey, posthogUrl);
}

/**
 * Posthog analytics service that sends events to Posthog.
 */
class PostHogAnalyticsService {
  private userId: string | undefined;
  private initialized = false;

  constructor(
    private readonly projectKey: string,
    private readonly url: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async initialize() {
    if (!this.projectKey) {
      console.warn(
        'Posthog project key is not set. Skipping Posthog analytics initialization.',
      );

      return;
    }

    this.initialized = true;
  }

  async trackPageView(path: string) {
    if (!this.initialized) {
      this.logUninitializedError('trackPageView');
      return;
    }

    if (!this.userId) {
      this.logUnidentifiedError('trackPageView');
      return;
    }

    const url = new URL(path, window.location.origin).href;

    return captureEvent(
      this.url,
      '$pageview',
      {
        $current_url: url,
      },
      this.userId,
      this.projectKey,
    );
  }

  async trackEvent(
    eventName: string,
    eventProperties?: Record<string, string | string[]>,
  ) {
    if (!this.initialized) {
      this.logUninitializedError('trackEvent');
      return;
    }

    if (!this.userId) {
      this.logUnidentifiedError('trackEvent');
      return;
    }

    return captureEvent(
      this.url,
      eventName,
      eventProperties,
      this.userId,
      this.projectKey,
    );
  }

  async identify(userId: string, traits: Record<string, string> = {}) {
    if (!this.initialized) {
      this.logUninitializedError('identify');
      return;
    }

    this.userId = userId;

    return captureEvent(this.url, '$identify', traits, userId, this.projectKey);
  }

  private logUninitializedError(method: string) {
    console.debug(
      `Posthog analytics service is not initialized. Skipping ${method}.`,
    );
  }

  private logUnidentifiedError(method: string) {
    console.debug(`User is not identified. Skipping ${method}.`);
  }
}

async function captureEvent(
  url: string,
  event: string,
  properties: unknown = {},
  userId: string,
  projectKey: string,
) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const payload: {
    api_key: string;
    event: string;
    properties: unknown;
    distinct_id?: string;
  } = {
    api_key: projectKey,
    event,
    properties,
  };

  if (userId) {
    payload.distinct_id = userId;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload),
  });

  return (await response.json()) as unknown;
}
