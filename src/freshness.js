/* ============================================================================
 * freshness.js — 배포된 새 버전을 자동으로 받아 오게 한다
 *
 * 왜 필요한가:
 *   이 앱은 자바스크립트가 index.html 안에 통째로 들어 있다(한 파일 배포).
 *   그래서 브라우저가 index.html 을 캐시해 두면 앱을 고쳐 배포해도
 *   학생 화면에는 옛 코드가 그대로 돌아간다. Ctrl+F5 를 눌러야 바뀐다.
 *
 * 어떻게 하는가:
 *   빌드할 때 index.html 의 <meta name="app-version"> 에 내용 해시를 박아 두고,
 *   같은 값을 dist/version.txt 로도 내보낸다. 페이지가 열리면 version.txt 를
 *   캐시 없이 받아 와 서로 다르면 주소에 ?v=<새버전> 을 붙여 다시 불러온다.
 *   주소가 달라지므로 브라우저는 캐시를 쓰지 않고 새로 받아 온다.
 *
 * 학생 작업을 지키기 위한 규칙 (이 앱은 자동 저장을 하지 않는다!):
 *   · 페이지가 열린 직후에만 검사한다. 검사에 실패하면 그냥 넘어간다.
 *   · 학생이 이미 무언가 입력했거나 눌렀으면 절대 다시 불러오지 않는다.
 *   · 브라우저 저장소(localStorage 등)는 쓰지 않는다. 되돌림 방지는 주소로만 한다.
 * ========================================================================== */

/** 새로 고침해도 안전한 시간 (밀리초). 이 시간이 지나면 학생이 쓰고 있을 수 있다. */
const SAFE_WINDOW = 8000;

export function checkFresh() {
  // file:// 로 더블클릭해 열었으면 받아 올 서버가 없다
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

  const meta = document.querySelector('meta[name="app-version"]');
  const mine = meta && meta.content;
  // 개발 서버에서는 빌드를 하지 않아 자리표시자가 그대로 남아 있다 → 검사할 것이 없다
  if (!mine || mine.startsWith('__')) return;

  const url = new URL(location.href);
  if (url.searchParams.get('v')) return; // 이미 새로 받아 온 뒤다

  /* 학생이 손을 대면 그 순간부터 새로 고치지 않는다 (작업이 사라지므로) */
  let touched = false;
  const mark = () => { touched = true; };
  for (const ev of ['input', 'keydown', 'pointerdown']) {
    addEventListener(ev, mark, { once: true, capture: true, passive: true });
  }
  const opened = performance.now();

  fetch(`./version.txt?t=${encodeURIComponent(mine)}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.text() : null))
    .then((text) => {
      if (!text) return;
      const latest = text.trim();
      if (!latest || latest === mine) return;              // 이미 최신
      if (touched || performance.now() - opened > SAFE_WINDOW) return; // 쓰고 있으면 건드리지 않는다
      url.searchParams.set('v', latest);
      location.replace(url.toString());
    })
    .catch(() => { /* 교실 인터넷이 끊겼거나 version.txt 가 없으면 그냥 넘어간다 */ });
}
