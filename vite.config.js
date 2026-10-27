import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Writes dist/sw.js after the build with every emitted asset + public file precached, versioned by
// a hash of the file list and contents, so each deploy installs a fresh cache and old ones are purged.
function treblrServiceWorker() {
  let outDir = 'dist';
  return {
    name: 'treblr-sw',
    apply: 'build',
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    closeBundle() {
      const files = [];
      const walk = (dir) => {
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f);
          if (fs.statSync(full).isDirectory()) walk(full);
          else files.push(path.relative(outDir, full).split(path.sep).join('/'));
        }
      };
      walk(outDir);
      const list = files.filter((f) => f !== 'sw.js' && !f.endsWith('.map')).sort();
      const hash = crypto.createHash('sha256');
      for (const f of list) hash.update(f).update(fs.readFileSync(path.join(outDir, f)));
      const version = hash.digest('hex').slice(0, 12);
      const tpl = fs.readFileSync(path.resolve(outDir, '..', 'src', 'sw-template.js'), 'utf8');
      const urls = ['/', ...list.map((f) => `/${f}`)];
      fs.writeFileSync(path.join(outDir, 'sw.js'), tpl.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(urls)));
    },
  };
}

export default defineConfig({
  plugins: [react(), treblrServiceWorker()],
});
