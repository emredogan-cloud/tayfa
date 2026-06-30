import type { Ionicons } from '@expo/vector-icons';
import type { FeedEvent } from '@tayfa/shared/types';
import bouldering from '../../assets/events/bouldering.png';
import boardgames from '../../assets/events/boardgames.png';
import coffee from '../../assets/events/coffee.png';
import cycling from '../../assets/events/cycling.png';

/**
 * Feed events carry no cover photo in the model (location/identity are
 * privacy-fuzzed), so we derive a tasteful category tile from the event's
 * category/title/interests. Deterministic: the same event always maps to the
 * same tile, and the indoor/outdoor scene chip is inferred from the tile.
 */
type TileKey = 'cycling' | 'bouldering' | 'coffee' | 'boardgames';

const TILES: Record<TileKey, number> = { cycling, bouldering, coffee, boardgames };

const SCENE: Record<TileKey, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  cycling: { label: 'Outdoor', icon: 'sunny-outline' },
  bouldering: { label: 'Indoor', icon: 'business-outline' },
  coffee: { label: 'Outdoor', icon: 'cafe-outline' },
  boardgames: { label: 'Indoor', icon: 'home-outline' },
};

const RULES: ReadonlyArray<[RegExp, TileKey]> = [
  [/cycl|bike|ride|run|hik|walk|skate|outdoor|trail/i, 'cycling'],
  [/boulder|climb|gym|fitness|yoga|workout|sport|pilates/i, 'bouldering'],
  [/coffee|brunch|caf[eé]|food|dinner|drink|wine|tea|breakfast|tasting|picnic/i, 'coffee'],
  [/board|game|catan|chess|trivia|quiz|cards|puzzle/i, 'boardgames'],
];

export interface EventImage {
  source: number;
  scene: { label: string; icon: keyof typeof Ionicons.glyphMap };
}

export function eventImage(event: FeedEvent): EventImage {
  const hay = `${event.category} ${event.title} ${event.sharedInterests
    .map((i) => `${i.slug} ${i.label}`)
    .join(' ')}`;
  let key: TileKey | null = null;
  for (const [re, k] of RULES) {
    if (re.test(hay)) {
      key = k;
      break;
    }
  }
  if (!key) {
    const order: readonly TileKey[] = ['cycling', 'bouldering', 'coffee', 'boardgames'];
    let h = 0;
    for (let i = 0; i < event.id.length; i += 1) h = (h * 31 + event.id.charCodeAt(i)) >>> 0;
    key = order[h % order.length] ?? 'coffee';
  }
  return { source: TILES[key], scene: SCENE[key] };
}
