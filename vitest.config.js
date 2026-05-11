import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js'],
      exclude: ['js/supabase-config.js', 'js/supabase-client.js']
    }
  }
});
