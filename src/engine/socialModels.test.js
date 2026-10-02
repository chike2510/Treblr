import { describe, expect, it } from 'vitest';
import { buildCareerPlaylists, getCareerChartRows, getModeledArtistRank } from './socialModels';
import { buildCharts } from './npcEngine';

describe('Social platform career views', () => {
  it('uses the current modeled chart entry for released tracks and keeps unranked releases honest', () => {
    const tracks = [
      { id:'later', title:'Later Song', released:true, releaseWeek:4, chartPos:19 },
      { id:'hit', title:'Chart Hit', released:true, releaseWeek:2, chartPos:30, coverArt:'/assets/covers/hit.png' },
      { id:'draft', title:'Unreleased', released:false, releaseWeek:8 },
    ];
    const rows = getCareerChartRows(tracks, {
      charts:{ streams:[{ id:'hit', isPlayer:true, position:7, metricVal:1250 }, { id:'rival', position:1 }] },
    });

    expect(rows.map(({ id, chartPosition }) => [id, chartPosition])).toEqual([['hit', 7], ['later', 19]]);
    expect(rows[0].chartEntry.metricVal).toBe(1250);
    expect(rows[0].coverArt).toBe('/assets/covers/hit.png');
  });

  it('carries a real position computed by the game chart engine into the service chart view', () => {
    const release = { id:'engine-hit', title:'Engine Hit', released:true, releaseWeek:4, quality:90, weeklyStreams:20_000, lifetimeStreams:80_000, coverArt:'/assets/covers/hit.png' };
    const charts = buildCharts([release], [], { stageName:'Chart Artist', totalWeeks:4, fans:50_000, clout:40, npcCareers:{} });
    const rows = getCareerChartRows([release], { charts });

    expect(charts.streams[0]).toMatchObject({ id:'engine-hit', position:1 });
    expect(rows[0]).toMatchObject({ id:'engine-hit', chartPosition:1, chartEntry:{ position:1 } });
  });

  it('builds local auto-playlists only from released tracks with real counts and deterministic ordering', () => {
    const tracks = [
      { id:'older-hit', title:'Older Hit', released:true, releaseWeek:2, lifetimeStreams:800 },
      { id:'new-song', title:'New Song', released:true, releaseWeek:7, lifetimeStreams:120 },
      { id:'unreleased', title:'Draft', released:false, releaseWeek:9, lifetimeStreams:99_999 },
    ];
    const playlists = buildCareerPlaylists(tracks);

    expect(playlists.map((playlist) => playlist.id)).toEqual(['recently-released', 'popular-in-career']);
    expect(playlists.map((playlist) => playlist.tracks.map((track) => track.id))).toEqual([
      ['new-song', 'older-hit'],
      ['older-hit', 'new-song'],
    ]);
    expect(playlists.every((playlist) => playlist.tracks.length === 2)).toBe(true);
    expect(buildCareerPlaylists([]).every((playlist) => playlist.tracks.length === 0)).toBe(true);
  });

  it('ranks the player against the modeled peer artists using current career fan counts', () => {
    const peers = [
      { id:'rival-a', fans:500 },
      { id:'rival-b', fans:250 },
      { id:'rival-c', fans:100 },
    ];
    const gameState = { fans:300, npcCareers:{ 'rival-a':{ fans:450 }, 'rival-b':{ fans:320 } } };

    expect(getModeledArtistRank(gameState, peers)).toEqual({ rank:3, population:4, playerFans:300, basis:'career fanbase' });
    expect(getModeledArtistRank({ ...gameState, fans:600 }, peers).rank).toBe(1);
    expect(getModeledArtistRank({ ...gameState, fans:320 }, peers).rank).toBe(2);
  });
});
