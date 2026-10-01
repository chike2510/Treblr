export const COVER_POOL = Array.from({ length:27 }, (_, index) => {
  const row = Math.floor(index / 9) + 1;
  const column = (index % 9) + 1;
  return `cov_${String(row).padStart(2, '0')}_${String(column).padStart(2, '0')}.png`;
});

// The roster currently has no portrait metadata. Keep visual identity explicit and
// limited to the fictional D-tier local-scene collaborators; celebrity NPCs remain unpictured.
export const FEATURE_AVATAR_BY_ARTIST = {
  kingperkins:'/assets/avatars/av_01_06.png',
  gbengad:'/assets/avatars/av_01_03.png',
  olag:'/assets/avatars/av_01_02.png',
  toria:'/assets/avatars/av_02_04.png',
  mcshelo:'/assets/avatars/av_02_05.png',
  zeebeats:'/assets/avatars/av_02_01.png',
  amarajoy:'/assets/avatars/av_01_07.png',
  felajr:'/assets/avatars/av_01_08.png',
  streetkid:'/assets/avatars/av_01_05.png',
  sashav:'/assets/avatars/av_02_08.png',
  bayoraw:'/assets/avatars/av_01_06.png',
  kiddeji:'/assets/avatars/av_01_06.png',
  lenab:'/assets/avatars/av_01_04.png',
  natefresh:'/assets/avatars/av_02_02.png',
};
