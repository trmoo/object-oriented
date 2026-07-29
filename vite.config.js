import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* 빌드 결과를 dist/index.html 한 파일로 묶는다.
 * 교실 PC 에서 인터넷도 서버도 없이 더블클릭만으로 열리게 하려는 것이다.
 *
 * 이때 두 가지를 함께 맞춰 준다.
 *   ① 번들 형식을 iife 로 — ES 모듈은 file:// 에서 브라우저가 막을 수 있다.
 *   ② <script type="module"> 을 그냥 <script> 로 바꿔 준다.
 * 개발 서버(npm start)는 그대로 ES 모듈로 돌아가므로 작업하기에도 편하다.
 */
/* 모든 파일이 다 쓰인 뒤(closeBundle) 마지막으로 손본다.
 * 이 시점이라야 singlefile 이 코드를 안에 집어넣기를 끝낸 상태다. */
const plainScript = {
  name: 'plain-script-for-file-protocol',
  enforce: 'post',
  async closeBundle() {
    const { readFile, writeFile } = await import('node:fs/promises');
    const file = new URL('./dist/index.html', import.meta.url);
    let html = await readFile(file, 'utf8');
    const before = html;
    html = html
      .replace(/<script\s+type="module"\s+crossorigin\s*>/g, '<script>')
      .replace(/<script\s+type="module"\s*>/g, '<script>')
      .replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '');

    /* 검사를 먼저 한다. 위 정규식이 (Vite 가 태그 모양을 바꾸는 등의 이유로) 하나도
     * 안 맞으면 html 이 그대로여서, 예전처럼 여기서 먼저 return 해 버리면
     * 정작 막아야 할 상황에서 검사를 건너뛰고 조용히 성공해 버린다. */
    if (/type="module"/.test(html)) {
      throw new Error(
        '빌드 결과에 type="module" 이 남아 있습니다. 더블클릭(file://) 실행이 막힐 수 있습니다.\n'
        + 'vite.config.js 의 plainScript 플러그인 정규식이 <script> 태그 모양과 맞는지 확인하세요.');
    }
    if (html === before) return; // 바꿀 것이 없으면 다시 쓰지 않는다
    await writeFile(file, html, 'utf8');
  },
};

export default defineConfig({
  base: './',            // GitHub Pages 하위 경로에서도 자원 경로가 맞도록
  plugins: [viteSingleFile({ useRecommendedBuildConfig: false }), plainScript],
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    target: 'es2020',
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
  server: { port: 5174, open: false },
});
