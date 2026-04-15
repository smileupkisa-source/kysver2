import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Termux 환경에서 리소스 점유율을 줄여 안정성을 높입니다.
    },
    host: '0.0.0.0'
  }
})
