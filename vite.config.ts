// vite.config.ts
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function cleanupSingleFileHtml(): Plugin {
  return {
    name: 'cleanup-single-file-html',
    apply: 'build',
    enforce: 'post',
    async writeBundle(options, bundle) {
      const outDir = options.dir || 'dist';
      const htmlFileName = Object.keys(bundle).find((f) => f.endsWith('.html'));
      if (!htmlFileName) return;

      const htmlPath = resolve(outDir, htmlFileName);
      let html = await readFile(htmlPath, 'utf-8');

      // Более гибкое регулярное выражение: ловит rel=stylesheet с кавычками или без,
      // в любом порядке с другими атрибутами.
      const cleaned = html
        .replace(/<style([^>]*?)\srel=(?:"stylesheet"|'stylesheet'|stylesheet)([^>]*?)>/gi, '<style$1$2>')
        .replace(/<style([^>]*?)\scrossorigin(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?([^>]*?)>/gi, '<style$1$2>');

      if (cleaned !== html) {
        await writeFile(htmlPath, cleaned, 'utf-8');
      }
    },
  };
}

export default defineConfig({
  plugins: [
    viteSingleFile(),
    cleanupSingleFileHtml(),
  ],
  build: {
    target: 'es2021',
  },
});
