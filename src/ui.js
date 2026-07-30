/* ============================================================================
 * ui.js — 화면을 만들 때 쓰는 작은 도구들
 *   h()       : 태그를 간단히 만드는 함수
 *   highlight(): 파이썬 코드에 색을 입힌다
 *   toast()   : 화면 아래에 잠깐 뜨는 알림
 *   download(): 파일로 저장
 * ========================================================================== */

/** 태그 만들기.  h('button.ghost', {onclick: f}, '누르기') */
export function h(spec, props = {}, ...kids) {
  const [tag, ...cls] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (cls.length) el.className = cls.join(' ');
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = el.className ? `${el.className} ${v}` : v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
    else el.setAttribute(k, v);
  }
  add(el, kids);
  return el;
}

function add(el, kids) {
  for (const kid of kids) {
    if (kid === null || kid === undefined || kid === false) continue;
    if (Array.isArray(kid)) { add(el, kid); continue; }
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
}

export const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── 파이썬 코드 색칠 ───────────────────────────────────────────────────────
 * 정규식으로 한 번에 훑는다. 문자열·주석을 먼저 잡아야 그 안의 키워드가
 * 색칠되지 않는다.
 * ------------------------------------------------------------------------- */
const KW = ['class', 'def', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'not',
  'and', 'or', 'pass', 'break', 'continue', 'import', 'from', 'True', 'False', 'None', 'is'];

const RE = new RegExp([
  '(#[^\\n]*)',                                     // 1 주석
  '(f?[\'"](?:\\\\.|[^\'"\\\\\\n])*[\'"])',         // 2 문자열
  '\\b(' + KW.join('|') + ')\\b',                   // 3 키워드
  '\\b(self)\\b',                                   // 4 self
  '(?<=\\.)(__[A-Za-z_][A-Za-z0-9_]*)\\b',          // 5 비공개 속성 (.__name)
  '(?<=\\b(?:class|def)\\s)([A-Za-z_][A-Za-z0-9_]*)', // 6 정의 이름
  '\\b(\\d+\\.?\\d*)\\b',                           // 7 숫자
].join('|'), 'g');

/** 파이썬 코드 → 색칠된 HTML */
export function highlight(code) {
  let out = '';
  let last = 0;
  for (const m of String(code).matchAll(RE)) {
    out += esc(code.slice(last, m.index));
    const [full, comment, str, kw, self, priv, defName, num] = m;
    if (comment) {
      // # 평가요소 3 처럼 평가요소를 가리키는 주석은 더 눈에 띄게
      out += /평가요소/.test(comment)
        ? `<span class="c mark">${esc(comment)}</span>`
        : `<span class="c">${esc(comment)}</span>`;
    } else if (str) out += `<span class="s">${esc(str)}</span>`;
    else if (kw) out += `<span class="k">${esc(kw)}</span>`;
    else if (self) out += `<span class="self">${esc(self)}</span>`;
    else if (priv) out += `<span class="priv">${esc(priv)}</span>`;
    else if (defName) out += `<span class="d">${esc(defName)}</span>`;
    else if (num) out += `<span class="n">${esc(num)}</span>`;
    else out += esc(full);
    last = m.index + full.length;
  }
  out += esc(code.slice(last));
  return out;
}

/** <pre class="code"> 를 만들어 준다 */
export function codeBlock(code) {
  return h('pre.code', { html: highlight(code) });
}

/* ── 알림 ───────────────────────────────────────────────────────────────── */
let toastTimer = null;
export function toast(msg) {
  const box = document.getElementById('toast');
  if (!box) return;
  box.textContent = msg;
  box.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.remove('on'), 2200);
}

/** 클립보드 복사 (구형 브라우저 대비 포함) */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', top: '-1000px' } });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** 파일로 저장 */
export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([`﻿${text}`], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/* 파일 열기(pickFile)는 「설계 불러오기」와 함께 없앴다. (2026-07-30)
   파일을 읽어 들이는 기능이 다시 필요해지면 이 자리에 되살릴 것. */

/** 여러 개 중 하나를 고르는 <select> */
export function select(options, value, onchange, cls = '') {
  const sel = h(`select${cls ? '.' + cls : ''}`, { onchange: (e) => onchange(e.target.value) });
  for (const o of options) {
    const [v, label] = Array.isArray(o) ? o : [o, o];
    sel.append(h('option', { value: v, selected: String(v) === String(value) }, label));
  }
  return sel;
}

/** 글자 입력칸 */
export function text(value, onInput, props = {}) {
  return h('input', {
    type: 'text', value: value ?? '',
    oninput: (e) => onInput(e.target.value),
    ...props,
  });
}

/** 체크박스 + 설명 */
export function checkbox(labelText, checked, onChange) {
  return h('label.check', {},
    h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) }),
    labelText);
}
