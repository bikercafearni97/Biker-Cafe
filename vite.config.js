import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'three'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
    ],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'motion-vendor',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
            },
            {
              name: 'gsap-vendor',
              test: /[\\/]node_modules[\\/]gsap[\\/]/,
            },
            {
              name: 'three-core',
              test: /[\\/]node_modules[\\/]three[\\/]/,
            },
            {
              name: 'three-react',
              test: /[\\/]node_modules[\\/](@react-three|three-stdlib|maath|troika-|suspend-react|react-use-measure|zustand)[\\/]/,
            },
            {
              name: 'firebase-vendor',
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
