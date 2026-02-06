import react from '@vitejs/plugin-react'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      name: 'ReactIconPicker',
      entry: {
        index: resolve(__dirname, 'src/index.tsx'),
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'hooks/index') {
          return `hooks/index.${format === 'es' ? 'mjs' : 'cjs'}`
        }
        return `index.${format === 'es' ? 'mjs' : 'cjs'}`
      },
    },
    minify: false,
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})
