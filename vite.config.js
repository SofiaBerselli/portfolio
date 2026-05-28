import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        mollie:  resolve(__dirname, 'mollie/index.html'),
        leica:   resolve(__dirname, 'leica/index.html'),
        blinkoo: resolve(__dirname, 'blinkoo/index.html'),
      },
    },
  },
})
