import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    vue(),
    legacy({
      targets: ['defaults', 'chrome 49'],
    }),
  ],
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  server: {
    proxy: {
      '^/(api|bg|media|res)': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    }
  }
})
