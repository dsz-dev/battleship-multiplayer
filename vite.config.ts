import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: { 
    host: true,
    proxy: {
      "/api.php": {
        target: "http://localhost/battleship",
        changeOrigin: true
      }
    }
  },
  plugins: [react()],
})
