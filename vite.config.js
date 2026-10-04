import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['4176-ijjnkgy6vv7j4tg2n1q3l-3f4d8410.us2.manus.computer'],
  },
});
