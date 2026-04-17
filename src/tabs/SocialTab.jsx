import { SOCIAL_PLATFORMS } from '../data/constants';
import { clamp, fmt, rand } from '../engine/utils';
import { addNews } from '../engine/weekEngine';

// Platform brand colors for card backgrounds
const PLATFORM_COLORS = {
  soundstream: { bg:'rgba(29,185,84,0.08)',  border:'rgba(29,185,84,0.25)',  color:'#1DB954' },
  instapic:    { bg:'rgba(225,48,108,0.08)', border:'rgba(225,48,108,0.25)', color:'#E1306C' },
  chirp:       { bg:'rgba(29,161,242,0.08)', border:'rgba(29,161,242,0.25)', color:'#1DA1F2' },
  vidtube:     { bg:'rgba(255,0,0,0.08)',    border:'rgba(255,0,0,0.25)',    color:'#FF0000' },
  rhythmtok:   { bg:'rgba(105,201,208,0.08)',border:'rgba(105,201,208,0.25)',color:'#69C9D0' },
  soundcloud:  { bg:'rgba(255,85,0,0.08)',   border:'rgba(255,85,0,0.25)',   color:'#FF5500' },
};

// SVG platform icons
const PlatformIcon = ({ id, color }) => {
  if (id === 'soundstream') return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:color }}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
      <path d="M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
    </svg>
  );
  if (id === 'instapic') return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:'none', stroke:color, strokeWidth:2, strokeLinecap:'round' }}>
      <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none"/>
    </svg>
  );
  if (id === 'chirp') return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:color }}>
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
    </svg>
  );
  if (id === 'vidtube') return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:color }}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.95C18.88 4 12 4 12 4s-6.88 0-8.59.47a2.78 2.78 0 0 0-1.95 1.95C1 8.12 1 12 1 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95C23 15.88 23 12 23 12s0-3.88-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#fff"/>
    </svg>
  );
  if (id === 'rhythmtok') return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:color }}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" style={{ width:16, height:16, fill:color }}>
      <path d="M11.56 8.87C10.12 9.32 8 10.22 8 12c0 2.04 2.31 2.99 4 3.44V8.55l-.44.32z"/>
      <path d="M20.54 6.42A2.78 2.78 0 0 0 18.59 4.47C16.88 4 12 4 12 4s-4.88 0-6.59.47A2.78 2.78 0 0 0 3.46 6.42C3 8.12 3 12 3 12s0 3.88.46 5.58a2.78 2.78 0 0 0 1.95 1.95C7.12 20 12 20 12 20s4.88 0 6.59-.47a2.78 2.78 0 0 0 1.95-1.95C21 15.88 21 12 21 12s0-3.88-.46-5.58z"/>
    </svg>
  );
};

export default function SocialTab({ gs, patch, patchFn, showToast }) {
  const platforms = gs.socialPlatforms || {};

  const post = (platformId, contentType, seCost) => {
    if ((gs.se || 0) < seCost) { showToast(`Need ${seCost} Social Energy`); return; }
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    patchFn(prev => {
      const currentFollowers = (prev.socialPlatforms || {})[platformId] || 0;
      const charismaBonus = 1 + ((prev.charisma || 5) / 50);
      const careerBonus = prev.careerType === 'social_media' ? 3 : 1;

      let followerGain = 0;
      let cloutGain = 0;
      let moneyGain = 0;

      if (platformId === 'instapic') {
        followerGain = rand(200, 800) * charismaBonus * careerBonus;
        cloutGain = 1;
      } else if (platformId === 'chirp') {
        followerGain = rand(100, 500) * charismaBonus * careerBonus;
        cloutGain = contentType === 'Start Beef' ? 3 : 1;
        if (contentType === 'Start Beef') {
          // Beef: fans but reputation risk
          const rep = clamp((prev.reputation || 50) - rand(3,8), 0, 100);
          return {
            se: clamp((prev.se || 0) - seCost, 0, prev.maxSe || 7),
            clout: clamp((prev.clout || 0) + cloutGain, 0, 100),
            reputation: rep,
            socialPlatforms: { ...(prev.socialPlatforms || {}), chirp: Math.round(currentFollowers + followerGain) },
            news: addNews(prev.news, `Stirred controversy on Chirp. Clout up, rep took a hit.`, '', prev.totalWeeks),
          };
        }
      } else if (platformId === 'vidtube') {
        followerGain = rand(500, 2000) * charismaBonus;
        cloutGain = 2;
        if (contentType === 'Post Music Video') {
          // Music video also boosts existing track streams
        }
      } else if (platformId === 'rhythmtok') {
        // Luck-based viral chance
        const isViral = Math.random() < 0.12;
        followerGain = isViral ? rand(5000, 50000) : rand(200, 1500);
        if (isViral) {
          setTimeout(() => showToast('WENT VIRAL ON RHYTHMTOK!'), 200);
        }
        cloutGain = isViral ? 5 : 1;
      } else if (platformId === 'soundcloud') {
        followerGain = rand(100, 400);
        cloutGain = 1;
      }

      const newFollowers = Math.round(currentFollowers + followerGain * charismaBonus);

      return {
        se: clamp((prev.se || 0) - seCost, 0, prev.maxSe || 7),
        clout: clamp((prev.clout || 0) + cloutGain, 0, 100),
        socialPlatforms: {
          ...(prev.socialPlatforms || {}),
          [platformId]: newFollowers,
        },
        news: addNews(prev.news, `Posted on ${platform.name} · +${Math.round(followerGain).toLocaleString()} followers`, 'pos', prev.totalWeeks),
      };
    });
  };

  const totalFollowers = Object.values(platforms).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="tab-content">
      <div className="sec-head">
        <div className="sec-title">Social Media</div>
        <div style={{ display:'flex', gap:8 }}>
          <span className="tag tag-cyan">{gs.se || 0} SE left</span>
          <span className="tag tag-purple">{fmt(totalFollowers)} total</span>
        </div>
      </div>

      <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:16 }}>
        Social Energy (SE) refreshes every week. Soundstream grows automatically with your streams.
      </div>

      {SOCIAL_PLATFORMS.map(platform => {
        const followers = platforms[platform.id] || 0;
        const colors = PLATFORM_COLORS[platform.id] || { bg:'var(--surface-1)', border:'var(--border)', color:'var(--text-muted)' };

        return (
          <div
            key={platform.id}
            className="platform-card"
            style={{ background: colors.bg, border:`1px solid ${colors.border}` }}
          >
            <div className="platform-header">
              <div className="platform-name-row">
                <div className="platform-icon" style={{ background: colors.color + '22' }}>
                  <PlatformIcon id={platform.id} color={colors.color} />
                </div>
                <div className="platform-name">{platform.name}</div>
              </div>
              {platform.auto && (
                <span className="platform-badge tag tag-green">AUTO</span>
              )}
            </div>

            <div className="platform-followers" style={{ color: colors.color }}>
              {fmt(followers)}
            </div>
            <div className="platform-follower-label" style={{ color: colors.color }}>
              {platform.id === 'soundstream' ? 'Monthly Listeners' : 'Followers'}
            </div>

            {!platform.auto && (
              <div className="platform-actions">
                {(platform.contentTypes || []).map((ct, i) => (
                  <button
                    key={i}
                    className="btn btn-sm"
                    style={{ background: colors.color + '22', color: colors.color, border:`1px solid ${colors.color}40`, fontSize:10 }}
                    disabled={(gs.se || 0) < (platform.seCost || 1)}
                    onClick={() => post(platform.id, ct, platform.seCost || 1)}
                  >
                    {ct} · {platform.seCost}SE
                  </button>
                ))}
              </div>
            )}

            {platform.auto && (
              <div style={{ fontSize:11, color:'var(--text-muted)' }}>{platform.desc}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
