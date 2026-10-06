import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://charcraft.github.io',
  base: '/CXRLOSMP-LANDING/',
  output: 'static',
  trailingSlash: 'never',
  build: {
    inlineStylesheets: 'auto',
    assets: 'assets',
  },
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: 'github-dark' },
  },
});