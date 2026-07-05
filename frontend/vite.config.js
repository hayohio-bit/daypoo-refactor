import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteImagemin from 'vite-plugin-imagemin';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // 서비스 워커가 오프라인 환경을 위해 미리 캐싱할 정적 자산들 경로 수정
      includeAssets: ['favicon.png', 'icons/favicon.ico', 'icons/icon.svg', 'icons/og-image.png'],
      workbox: {
        // 이 경로들은 서비스 워커가 가로채지 않고 서버로 직접 요청을 보냅니다.
        navigateFallbackDenylist: [/^\/api/, /^\/oauth2/, /^\/login/, /^\/swagger-ui/, /^\/v3\/api-docs/],
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
        name: 'DayPoo - 데이푸',
        short_name: 'DayPoo',
        description:
          '데이푸가 분석하는 나만의 배변 건강 리포트. 전국 5만 개 화장실 실시간 지도와 함께.',
        theme_color: '#152e22',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
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
      filename: 'stats.html',
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
          ui: ['framer-motion', 'lucide-react'],
          chart: ['recharts'],
        },
      },
    },
  },
});
