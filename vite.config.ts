import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Небольшой плагин для очистки невалидных атрибутов у <style> и <script>
function cleanupSingleFileHtml(): Plugin {
  return {
    name: 'cleanup-single-file-html',
    transformIndexHtml(html: string): string {
      return html
        // Убираем rel и crossorigin из <style>
        .replace(/<style([^>]*?)\srel="stylesheet"([^>]*?)>/g, '<style$1$2>')
        .replace(/<style([^>]*?)\scrossorigin([^>]*?)>/g, '<style$1$2>')
        // На всякий случай можно убрать и у <script>, если они там есть
        .replace(/<script([^>]*?)\scrossorigin([^>]*?)>/g, '<script$1$2>');
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
