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
 * 이 시점이라야 singlefile 이 코드를 안에 집어넣기를 끝낸 상태다.
 *
 * 여기서 두 가지를 한다.
 *   ① <script type="module"> 을 일반 <script> 로 바꾼다 (더블클릭 실행용)
 *   ② 결과물의 내용 해시를 버전으로 박고 dist/version.txt 로도 내보낸다
 *      → 브라우저가 옛 index.html 을 캐시해도 자동으로 새로 받아 온다 (src/freshness.js)
 */
const VERSION_MARK = '__APP_VERSION__';

const finishBuild = {
  name: 'plain-script-and-version-stamp',
  enforce: 'post',
  async closeBundle() {
    const { readFile, writeFile } = await import('node:fs/promises');
    const { createHash } = await import('node:crypto');
    const dir = new URL('./dist/', import.meta.url);
    const file = new URL('index.html', dir);
    let html = await readFile(file, 'utf8');

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
        + 'vite.config.js 의 정규식이 <script> 태그 모양과 맞는지 확인하세요.');
    }

    /* ② 버전 도장. 자리표시자가 들어 있는 상태의 내용으로 해시를 만들기 때문에
       내용이 같으면 버전도 같다 → 괜한 새로고침이 일어나지 않는다. */
    if (!html.includes(VERSION_MARK)) {
      throw new Error(
        `index.html 에 <meta name="app-version" content="${VERSION_MARK}"> 이 없습니다.\n`
        + '이것이 없으면 배포 후에도 학생 화면이 캐시된 옛 버전에 머무를 수 있습니다.');
    }
    const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
    html = html.replace(new RegExp(VERSION_MARK, 'g'), version);

    await writeFile(file, html, 'utf8');
    await writeFile(new URL('version.txt', dir), `${version}\n`, 'utf8');
  },
};

export default defineConfig({
  base: './',            // GitHub Pages 하위 경로에서도 자원 경로가 맞도록
  plugins: [viteSingleFile({ useRecommendedBuildConfig: false }), finishBuild],
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
