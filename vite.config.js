import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import svgLoader from 'vite-svg-loader';
import EnvCaster from '@niku/vite-env-caster';

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/proxy-assets': {
        target: 'https://dnodhcqyo2y9j.cloudfront.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/proxy-assets/, ''),
        headers: {
          Origin: 'https://api.kredium.io',
          Referer: 'https://api.kredium.io/',
        },
      },
    },
  },
  plugins: [
    EnvCaster(),
    svgLoader(),
    vue({
      template: {
        compilerOptions: {
          // Since we are using swiper elements & lite-youtube, which are custom web components,
          // we need to define them here to avoid Vue trying to resolve them.
          isCustomElement: (tag) => tag === 'lite-youtube' || tag.includes('swiper-')
        }
      }
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
