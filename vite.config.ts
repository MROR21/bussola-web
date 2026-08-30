import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5093',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      // redirect.html é a "ponte" de redirect do MSAL (login com Microsoft) — precisa ser uma
      // entrada própria do build, sem passar pelo React/router, senão o hash da resposta de login
      // se perde antes do MSAL conseguir lê-lo.
      input: {
        main: resolve(__dirname, 'index.html'),
        redirect: resolve(__dirname, 'redirect.html'),
      },
    },
  },
})
