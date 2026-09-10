import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      devOptions: {
        enabled: true // Macht PWA & Manifest auch im Dev-Modus verfügbar!
      },
      manifest: {
        name: 'Trading Journal',
        short_name: 'Journal',
        icons: [
          {
            src: 'icon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // --- NEU: Dieser Teil bindet Vite an den Docker-Container ---
  server: {
    host: true, // Lauscht auf 0.0.0.0 (wichtig für Docker!)
    port: 5173,
    watch: {
      usePolling: true // Stellt sicher, dass Änderungen unter Windows/Docker erkannt werden
    }
  }
})