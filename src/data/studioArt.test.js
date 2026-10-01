import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NPC_ARTISTS } from './artists';
import { COVER_POOL, FEATURE_AVATAR_BY_ARTIST } from './studioArt';

const publicRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../public');
const assetExists = assetPath => existsSync(resolve(publicRoot, assetPath.replace(/^\//, '')));

describe('Studio art registry', () => {
  it('maps every bundled sleeve to a loadable local cover file', () => {
    expect(COVER_POOL).toHaveLength(27);
    for (const cover of COVER_POOL) expect(assetExists(`/assets/covers/${cover}`)).toBe(true);
  });

  it('uses real local portraits only for the fictional D-tier collaborator roster', () => {
    const byId = new Map(NPC_ARTISTS.map(artist => [artist.id, artist]));
    const mappedIds = Object.keys(FEATURE_AVATAR_BY_ARTIST);
    expect(mappedIds).toHaveLength(14);
    for (const id of mappedIds) {
      expect(byId.get(id)?.tier).toBe('D');
      expect(assetExists(FEATURE_AVATAR_BY_ARTIST[id])).toBe(true);
    }
  });
});
