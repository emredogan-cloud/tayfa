/**
 * Dev-only mock data. When the BFF is unreachable (no `EXPO_PUBLIC_API_URL`
 * backend running) AND the build is __DEV__, the API client falls back to these
 * canned responses so every screen renders with realistic Istanbul data. This is
 * ONLY for local/device validation — it never runs in a release build, and it is
 * the LAST resort (a real BFF response always wins).
 *
 * Shapes mirror src/api/types.ts exactly (which mirror @tayfa/shared).
 */
import type {
  CatalogInterest,
  ChatThread,
  CreatedEvent,
  EventDetail,
  FeedResponse,
  MyProfileResponse,
  RsvpResult,
  SessionBootstrap,
} from '@/api/types';
import {
  asId,
  type Crew,
  type FeedEvent,
  type InterestSummary,
  type PublicProfile,
  type RankingExplanation,
} from '@tayfa/shared/types';

// Generic so the branded ID type (UserId/EventId/…) is inferred from context.
const uid = <T extends string = string>(n: number): T =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}` as T;
const ME = asId<'UserId'>('00000000-0000-0000-0000-000000000001');

const interest = (
  n: number,
  domain: InterestSummary['domain'],
  label: string,
): InterestSummary => ({
  id: uid(n),
  domain,
  label,
  slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
});

const CATALOG: CatalogInterest[] = [
  ['sport', 'Cycling'],
  ['sport', 'Bouldering'],
  ['sport', 'Padel'],
  ['sport', 'Running'],
  ['sport', 'Football'],
  ['sport', 'Yoga'],
  ['hobby', 'Board Games'],
  ['hobby', 'Film Photography'],
  ['hobby', 'Pottery'],
  ['hobby', 'Hiking'],
  ['hobby', 'Cooking'],
  ['music_genre', 'Indie'],
  ['music_genre', 'Techno'],
  ['music_genre', 'Jazz'],
  ['music_genre', 'Turkish Rock'],
  ['artist', 'Tame Impala'],
  ['artist', 'Mor ve Ötesi'],
  ['tv_show', 'Severance'],
  ['tv_show', 'The Bear'],
  ['film', 'A24 Films'],
  ['cuisine', 'Specialty Coffee'],
  ['cuisine', 'Street Food'],
  ['cuisine', 'Natural Wine'],
  ['cause', 'Beach Cleanups'],
  ['game', 'Catan'],
  ['game', 'Chess'],
].map(([domain, label], i) => ({
  ...interest(100 + i, domain as InterestSummary['domain'], label as string),
  popularity: 100 - i,
}));

const findInterest = (label: string): InterestSummary =>
  CATALOG.find((c) => c.label === label) ?? CATALOG[0]!;

const profile = (
  n: number,
  displayName: string,
  opts: { verified?: boolean; bio?: string; neighborhood?: string; interests?: string[] } = {},
): PublicProfile => ({
  userId: uid(n),
  displayName,
  bio: opts.bio ?? null,
  avatarUrl: null, // initials avatar — no network needed
  verificationLevel: opts.verified ? 'id_live' : 'phone',
  reliabilityScore: 72 + (n % 25),
  neighborhood: opts.neighborhood ?? 'Kadıköy',
  sharedInterests: (opts.interests ?? []).map(findInterest),
});

const ranking = (score: number, distanceMeters: number, mutual: number): RankingExplanation => ({
  score,
  interestSimilarity: score - 0.05,
  distanceMeters,
  distanceScore: 1 / (1 + distanceMeters / 5000),
  recencyScore: 0.8,
  capacityScore: 0.85,
  serendipity: 0.15,
  mutualInterestCount: mutual,
});

const hoursFromNow = (h: number): string => {
  // Deterministic-ish: base on a fixed epoch + offset (no Date.now sensitivity needed for UI).
  const base = new Date('2026-07-01T17:00:00Z').getTime();
  return new Date(base + h * 3_600_000).toISOString();
};

const event = (
  n: number,
  title: string,
  category: string,
  host: PublicProfile,
  opts: {
    neighborhood: string;
    going: number;
    max: number;
    interests: string[];
    distance: number;
    startsInH: number;
    womenOnly?: boolean;
    verifiedOnly?: boolean;
  },
): FeedEvent => ({
  id: uid(n),
  hostId: host.userId,
  title,
  category,
  startsAt: hoursFromNow(opts.startsInH),
  endsAt: hoursFromNow(opts.startsInH + 2),
  capacity: { min: 2, max: opts.max, going: opts.going },
  visibility: 'public',
  status: 'open',
  location: {
    geocell: '881ec902edfffff',
    centroid: { lat: 40.99, lng: 29.03 },
    approxRadiusMeters: 461,
    neighborhood: opts.neighborhood,
  },
  venueName: opts.neighborhood,
  sharedInterests: opts.interests.map(findInterest),
  host,
  ranking: ranking(0.92 - n * 0.01, opts.distance, opts.interests.length),
});

const HOSTS = {
  nilay: profile(11, 'Nilay D.', {
    verified: true,
    neighborhood: 'Kadıköy',
    interests: ['Cycling', 'Specialty Coffee'],
    bio: 'New to Istanbul, here to ride and find good coffee.',
  }),
  burak: profile(12, 'Burak A.', {
    verified: true,
    neighborhood: 'Beşiktaş',
    interests: ['Bouldering', 'Indie'],
  }),
  ece: profile(13, 'Ece K.', {
    verified: true,
    neighborhood: 'Moda',
    interests: ['Board Games', 'Catan'],
  }),
  deniz: profile(14, 'Deniz Y.', {
    verified: false,
    neighborhood: 'Karaköy',
    interests: ['Specialty Coffee', 'Film Photography'],
  }),
};

const EVENTS: FeedEvent[] = [
  event(201, 'Sunday Coastal Ride', 'Cycling', HOSTS.nilay, {
    neighborhood: 'Kadıköy',
    going: 4,
    max: 6,
    interests: ['Cycling', 'Specialty Coffee'],
    distance: 800,
    startsInH: 20,
  }),
  event(202, 'Bouldering @ BoulderPlus', 'Bouldering', HOSTS.burak, {
    neighborhood: 'Beşiktaş',
    going: 3,
    max: 5,
    interests: ['Bouldering'],
    distance: 2400,
    startsInH: 6,
  }),
  event(203, 'Board Game Night', 'Board Games', HOSTS.ece, {
    neighborhood: 'Moda',
    going: 5,
    max: 6,
    interests: ['Board Games', 'Catan'],
    distance: 1200,
    startsInH: 30,
    verifiedOnly: true,
  }),
  event(204, 'Third-wave Coffee Crawl', 'Specialty Coffee', HOSTS.deniz, {
    neighborhood: 'Karaköy',
    going: 2,
    max: 4,
    interests: ['Specialty Coffee', 'Film Photography'],
    distance: 5200,
    startsInH: 48,
  }),
  event(205, 'Golden-hour Photo Walk', 'Film Photography', HOSTS.deniz, {
    neighborhood: 'Balat',
    going: 3,
    max: 5,
    interests: ['Film Photography'],
    distance: 7400,
    startsInH: 54,
    womenOnly: true,
  }),
  event(206, 'Morning Run Crew', 'Running', HOSTS.nilay, {
    neighborhood: 'Caddebostan',
    going: 6,
    max: 8,
    interests: ['Running'],
    distance: 3100,
    startsInH: 14,
  }),
];

const FEED: FeedResponse = {
  events: EVENTS,
  liquidity: { eventsThisWeek: 42, radiusMeters: 5000, widened: false },
  nextCursor: null,
};

const eventDetail = (id: string): EventDetail => {
  const ev = EVENTS.find((e) => e.id === id) ?? EVENTS[0]!;
  return {
    event: ev,
    members: [
      { profile: ev.host, rsvpStatus: 'going', isHost: true },
      { profile: HOSTS.ece, rsvpStatus: 'going', isHost: false },
      { profile: HOSTS.burak, rsvpStatus: 'approved', isHost: false },
    ],
    viewerRsvpStatus: null,
    preciseLocation: null, // released only by the BFF gate near start time
    viewerIsHost: false,
  };
};

const chatThread = (eventId: string): ChatThread => {
  const ev = EVENTS.find((e) => e.id === eventId) ?? EVENTS[0]!;
  return {
    conversationId: uid(900),
    eventId: ev.id,
    messages: [
      {
        id: uid(901),
        conversationId: uid(900),
        senderId: ev.host.userId,
        body: `Hey everyone! Excited for ${ev.title.toLowerCase()} 🙌`,
        mediaUrl: null,
        createdAt: hoursFromNow(-2),
        kind: 'user',
        sender: ev.host,
      },
      {
        id: uid(902),
        conversationId: uid(900),
        senderId: HOSTS.ece.userId,
        body: 'Same! First time joining — what should I bring?',
        mediaUrl: null,
        createdAt: hoursFromNow(-1.5),
        kind: 'user',
        sender: HOSTS.ece,
      },
      {
        id: uid(903),
        conversationId: uid(900),
        senderId: ME,
        body: 'Ece joined the meetup',
        mediaUrl: null,
        createdAt: hoursFromNow(-1),
        kind: 'system',
        sender: null,
      },
    ],
    icebreakers: [
      'You both love Specialty Coffee — favourite roaster in Kadıköy?',
      'First time at one of these?',
      'Anyone want to grab food after?',
    ],
  };
};

const MY_PROFILE: MyProfileResponse = {
  profile: {
    id: uid(1),
    userId: ME as MyProfileResponse['profile']['userId'],
    displayName: 'You',
    bio: 'New in Istanbul, looking for an activity crew.',
    age: 29,
    homeCityId: null,
    neighborhood: 'Kadıköy',
    avatarUrl: null,
    languages: ['tr', 'en'],
    verificationLevel: 'phone',
    reliabilityScore: 70,
    safetyScore: 75,
    entitlement: 'free',
    createdAt: hoursFromNow(-200),
  },
  interests: ['Cycling', 'Specialty Coffee', 'Board Games', 'Indie', 'Film Photography'].map(
    (l) => ({
      ...findInterest(l),
      weight: 1,
    }),
  ),
  completedMeetups: 1,
  activeCrews: 0,
};

const CREWS: Crew[] = [
  {
    id: uid(300),
    name: 'Sunday Bike Crew',
    memberCount: 5,
    cadence: 'weekly',
    nextMeetupAt: hoursFromNow(20),
  },
];

const SESSION: SessionBootstrap = {
  userId: ME as SessionBootstrap['userId'],
  verificationLevel: 'phone',
  entitlement: 'free',
  onboardingComplete: false,
};

/**
 * Resolve a mock response for a given request, or `undefined` if unmocked.
 * `path` is the BFF path (no host), e.g. "/feed" or "/events/<id>".
 */
export function getMockResponse(method: string, path: string): unknown | undefined {
  const p = path.split('?')[0] ?? path;

  if (method === 'GET' && p === '/interests/catalog') return CATALOG;
  if (method === 'POST' && p === '/feed') return FEED;
  if (method === 'GET' && p === '/me/session') return SESSION;
  if (method === 'GET' && p === '/me/profile') return MY_PROFILE;
  if (method === 'GET' && p === '/me/crews') return CREWS;

  const chatMatch = p.match(/^\/events\/([^/]+)\/chat$/);
  if (chatMatch) return chatThread(chatMatch[1]!);

  const rsvpMatch = p.match(/^\/events\/([^/]+)\/rsvp$/);
  if (rsvpMatch) {
    return {
      eventId: asId<'EventId'>(rsvpMatch[1] ?? ''),
      status: 'going',
      requiresApproval: false,
    } satisfies RsvpResult;
  }

  const eventMatch = p.match(/^\/events\/([^/]+)$/);
  if (eventMatch && method === 'GET') return eventDetail(eventMatch[1]!);

  if (method === 'POST' && p === '/events') return { id: uid(999) } satisfies CreatedEvent;
  if (
    method === 'POST' &&
    (p === '/me/onboarding' || p === '/reports' || p === '/blocks' || p.startsWith('/safety/'))
  ) {
    return { ok: true };
  }
  if (method === 'PATCH' && p === '/me/profile') return { ok: true };

  return undefined;
}
