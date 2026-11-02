import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const escapeAttr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Injects title, description and Open Graph / Twitter tags from src/config.js so the
// link preview on WhatsApp always matches the content.
function seoFromConfig(mode) {
  return {
    name: 'seo-from-config',
    async transformIndexHtml(html) {
      Object.assign(process.env, loadEnv(mode, process.cwd(), 'VITE_'));
      // Fresh import each time so edits to config.js show up without restarting the dev server
      const configUrl = pathToFileURL(path.resolve('src/config.js')).href;
      const { seo, SITE_URL } = await import(/* @vite-ignore */ configUrl + '?t=' + Date.now());
      const image = `${SITE_URL}${seo.image}`;
      const tags = [
        `<title>${escapeAttr(seo.title)}</title>`,
        `<meta name="description" content="${escapeAttr(seo.description)}" />`,
        `<link rel="canonical" href="${SITE_URL}/" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:url" content="${SITE_URL}/" />`,
        `<meta property="og:title" content="${escapeAttr(seo.title)}" />`,
        `<meta property="og:description" content="${escapeAttr(seo.description)}" />`,
        `<meta property="og:image" content="${image}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta property="og:image:alt" content="${escapeAttr(seo.title)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeAttr(seo.title)}" />`,
        `<meta name="twitter:description" content="${escapeAttr(seo.description)}" />`,
        `<meta name="twitter:image" content="${image}" />`,
      ];
      return html.replace('<!-- seo -->', tags.join('\n    '));
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFromConfig(mode)],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 0,
  },
}));
