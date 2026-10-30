
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/Smart_Factory/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
