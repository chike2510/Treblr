const photos = {
  car: { kind: 'car', src: '/assets/treblr-car-s-class.jpg', description: 'Black Mercedes-Benz S-Class W223 sedan, photo by Damian B Oh, CC BY-SA 4.0' },
  festival: { kind: 'festival', src: '/assets/treblr-festival-crowd.jpg', description: 'Crowd and stage at All Good Music Festival, photo by JosephAdams, CC BY 2.0' },
  film: { kind: 'film', src: '/assets/treblr-film-set.jpg', description: 'Bob Hoskins on the set of Ruby Blue, photo by James Stewart, CC BY 2.0' },
  home: { kind: 'home', src: '/assets/treblr-home-penthouse.jpg', description: 'Rosewood São Paulo penthouse suite, photo by Pedu0303, CC0' },
  award: { kind: 'award', src: '/assets/treblr-award-trophy.jpg', description: 'F1 World Championship trophy, photo by Raimond Spekking, CC BY-SA 4.0' },
};

const hash = (value) => [...String(value)].reduce((n, c) => n + c.charCodeAt(0), 0) % 360;

export default function FeatureArt({ kind, name = '', id = '', className = '' }) {
  const hue = hash(`${name}${id}`);
  const photo = photos[kind] || photos[(kind === 'house' || kind === 'rental') ? 'home' : kind];
  if (photo) {
    const label = `${photo.kind} artwork for ${name || id || 'career'}`;
    return <img className={`feature-art ${className}`} src={photo.src} alt={photo.description} aria-label={label} loading="lazy" decoding="async" />;
  }
  return <div className={`feature-art feature-art-fallback ${className}`} role="img" aria-label={`${kind} artwork for ${name || id || 'career'}`} data-art-label={`${kind} · ${name || id || 'career'}`} style={{ background: `linear-gradient(135deg, hsl(${hue} 24% 26%), #14151d)` }} />;
}
