
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines process.env.API_KEY globally for the browser environment
    // taking it from the system environment variables during build/dev.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  server: {
    port: 5173,
    host: true
  }
})
