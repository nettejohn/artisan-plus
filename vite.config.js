import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // PDF generation — chargé uniquement quand l'user crée un PDF
          if (id.includes('jspdf') || id.includes('jspdf-autotable')) return 'pdf';
          // Supabase client
          if (id.includes('@supabase')) return 'supabase';
          // html2canvas — utilisé dans les chantiers/outils
          if (id.includes('html2canvas')) return 'html2canvas';
          // QR code
          if (id.includes('qrcode')) return 'qrcode';
          // Anthropic SDK — IA
          if (id.includes('@anthropic-ai')) return 'ai';
          // Stripe
          if (id.includes('stripe')) return 'stripe';
          // Reste des node_modules → chunk vendor partagé
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
})
