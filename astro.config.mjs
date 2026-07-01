import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // A fully static, pre-rendered site — deployable to any static host or CDN.
  output: 'static',

  // `site` is used for canonical URLs and sitemap generation.
  // Override at build time with e.g. `SITE_URL=https://example.com npm run build`.
  site: process.env.SITE_URL || 'https://ki-beratung.example.com',

  // `base` lets the same build work under a subpath (e.g. GitHub Pages
  // project sites served from /<repo>/). Set BASE_PATH=/ConsultingSolutionsApp
  // for GitHub Pages; leave empty for root-domain hosts (Netlify/Vercel/Docker).
  base: process.env.BASE_PATH || '/',

  build: {
    // Emit clean `/modul-1/` style directories with index.html files.
    format: 'directory',
  },

  compressHTML: true,
});
