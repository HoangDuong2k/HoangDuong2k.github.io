import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://hoangduong2k.github.io',
  integrations: [react()],
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    // One React copy for R3F, drei and postprocessing.
    resolve: { dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'] },
  },
})
