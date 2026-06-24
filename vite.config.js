import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        auth: resolve(__dirname, 'auth.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        product: resolve(__dirname, 'product.html'),
        tracking: resolve(__dirname, 'tracking.html'),
      }
    }
  }
});
