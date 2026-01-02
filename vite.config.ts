
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Injects the API key during build time. 
    // Prioritizes environment variables, with your provided key as a fallback.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || 'AIzaSyCDIbD4ay8qslsl6cThrGnjBKuGkBiXP7w')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
