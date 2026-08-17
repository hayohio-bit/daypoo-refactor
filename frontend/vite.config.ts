import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { type Plugin, defineConfig } from 'vite';
import viteImagemin from 'vite-plugin-imagemin';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const copyWellKnownPlugin = (): Plugin => ({
  name: 'copy-well-known',
  writeBundle() {
    const srcDir = path.resolve(__dirname, 'public/.well-known');
    const destDir = path.resolve(__dirname, 'dist/.well-known');
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
    }
  },
  closeBundle() {
    const srcDir = path.resolve(__dirname, 'public/.well-known');
    const destDir = path.resolve(__dirname, 'dist/.well-known');
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
    }
  },
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/.well-known/')) {
        const filePath = path.resolve(__dirname, 'public', req.url.slice(1));
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath));
          return;
        }
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    copyWellKnownPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      // 서비스 워커가 오프라인 환경을 위해 미리 캐싱할 정적 자산들 경로 수정
      includeAssets: ['favicon.png', 'icons/favicon.ico', 'icons/icon.svg', 'icons/og-image.png'],
      workbox: {
        // 이 경로들은 서비스 워커가 가로채지 않고 서버로 직접 요청을 보냅니다.
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/oauth2/,
          /^\/login/,
          /^\/swagger-ui/,
          /^\/v3\/api-docs/,
        ],
        runtimeCaching: [
          {
            // 카카오맵 SDK (dapi.kakao.com) — iOS PWA에서 외부 스크립트 로드 실패 방지
            // NetworkFirst: 항상 최신 SDK를 우선 시도, 네트워크 실패 시 캐시 폴백
            urlPattern: /^https:\/\/dapi\.kakao\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'kakao-maps-sdk',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 3, // 3일
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        id: '/',
        name: 'DayPoo - 급똥 위치 기반 화장실 탐색',
        short_name: 'DayPoo',
        description:
          '급할 때 가장 가까운 화장실을 1초 만에 찾아주는 급똥 SOS 앱. 전국 5만 개 화장실 실시간 지도.',
        theme_color: '#111E18',
        background_color: '#111E18',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['health', 'medical', 'lifestyle', 'utilities'],
        icons: [
          {
            src: '/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: '급똥 SOS',
            short_name: 'SOS',
            description: '가장 가까운 화장실을 즉시 찾습니다',
            url: '/map?openNearest=true',
            icons: [
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
              },
            ],
          },
          {
            name: '화장실 지도',
            short_name: '지도',
            description: '주변 화장실을 찾습니다',
            url: '/map',
            icons: [
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
              },
            ],
          },
          {
            name: '마이페이지',
            short_name: '마이',
            description: '내 화장실 방문 기록을 확인합니다',
            url: '/mypage',
            icons: [
              {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
              },
            ],
          },
        ],
      },
    }),
    viteImagemin({
      gifsicle: { optimizationLevel: 7, interlaced: false },
      optipng: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9], speed: 4 },
      svgo: {
        plugins: [{ name: 'removeViewBox' }, { name: 'removeEmptyAttrs', active: false }],
      },
    }),
    visualizer({
      open: false,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  envDir: '../',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
      '/login/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
      '/swagger-ui': { target: 'http://localhost:8080', changeOrigin: true },
      '/v3/api-docs': { target: 'http://localhost:8080', changeOrigin: true },
    },
    middlewareMode: false,
  },
  preview: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          ui: ['lucide-react'],
          chart: ['recharts'],
        },
      },
    },
  },
  // Vitest 설정 — jsdom 환경, 커버리지
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/hooks/useToilets.ts', 'src/components/HeroSection.tsx'],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
      },
    },
  },
});
