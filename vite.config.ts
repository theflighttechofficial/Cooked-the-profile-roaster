import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Copies the in-browser OCR engine (tesseract.js worker, WASM core, English model) into
 * public/ocr, so screenshot roasts can read text on the device without any CDN.
 */
function ocrAssets(): Plugin {
  const files: [string, string][] = [
    ['node_modules/tesseract.js/dist/worker.min.js', 'worker.min.js'],
    ['node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
    ['node_modules/tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
    ['node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz', 'eng.traineddata.gz'],
  ];
  return {
    name: 'cooked-ocr-assets',
    buildStart() {
      mkdirSync('public/ocr', { recursive: true });
      for (const [from, to] of files) {
        if (!existsSync(from)) this.error(`Missing ${from}. Run npm install.`);
        if (!existsSync(`public/ocr/${to}`)) copyFileSync(from, `public/ocr/${to}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ocrAssets()],
  server: {
    // AI Studio sets DISABLE_HMR to stop flicker while an agent edits files
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
