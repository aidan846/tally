import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function normalizeBasePath(value) {
  let basePath = value?.trim() || '/';
  if (!basePath.startsWith('/')) basePath = `/${basePath}`;
  if (!basePath.endsWith('/')) basePath = `${basePath}/`;
  return basePath;
}

const base = normalizeBasePath(process.env.TALLY_WEB_BASE);

export default defineConfig({
  base,
  root: 'src',
  publicDir: 'public',
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
    sourcemap: Boolean(process.env.TAURI_ENV_DEBUG)
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/icon.svg', 'assets/150.png', 'assets/300.png'],
      manifest: {
        id: './',
        name: 'Tally | Smart Calculator',
        short_name: 'Tally',
        description: 'A simple calculator for your daily tasks.',
        theme_color: '#1e1e1e',
        background_color: '#1e1e1e',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'assets/150.png', sizes: '150x150', type: 'image/png' },
          { src: 'assets/300.png', sizes: '300x300', type: 'image/png' },
          { src: 'assets/1080.png', sizes: '1080x1080', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html'
      }
    })
  ]
});
