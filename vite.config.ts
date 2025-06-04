import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '',
  plugins: [vue()],
  server: {
    proxy: {
      '^/(api|bg|media|res)': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    }
  }
})
