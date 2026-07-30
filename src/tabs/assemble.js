/* ============================================================================
 * tabs/assemble.js — 탭① 부품 조립 연습
 *   ① 문법 해부   : 클래스 정의 골격을 눌러 각 부분의 뜻을 확인
 *   ② 상태·동작 분류 : 객체 = 상태 + 동작
 *   ③ 코드 조립   : 흩어진 줄을 올바른 순서·들여쓰기로 맞추기
 *   ④ 빈칸 채우기 : 학습지의 개념 정리
 * ========================================================================== */

import { h, text, highlight } from '../ui.js';
import { ANATOMY, SORT_ITEMS, ASSEMBLE, BLANKS } from '../data.js';
import { runPython } from '../pymini.js';

export function mountAssemble(root, app) {
  root.append(anatomySection(), sortSection(), assembleSection(app), blankSection());
}

/* ══════════════════ ① 문법 해부 ══════════════════════════════════════════ */
function anatomySection() {
  const info = h('div.part-info');
  const pre = h('pre.code');
  let current = null;

  function show(key) {
    current = key;
    const p = ANATOMY.parts[key];
    info.textContent = '';
    info.append(
      h('h4', {}, p.title),
      h('div', {}, p.body),
    );
    for (const b of pre.querySelectorAll('.part')) b.classList.toggle('on', b.dataset.key === key);
  }

  for (const piece of ANATOMY.code) {
    if (!piece.key) { pre.append(document.createTextNode(piece.text)); continue; }
    pre.append(h('button.part', {
      'data-key': piece.key, type: 'button',
      onclick: () => show(piece.key),
    }, piece.text));
  }

  /* 누르기 전에는 하늘색 글씨, 누른 것만 노랗게 바뀐다 (style.css 의 .part / .part.on) */
  info.append(h('h4', {}, '하늘색 글씨를 눌러 보세요'),
    h('div', {}, '클래스를 정의하는 각 부분이 무슨 일을 하는지 하나씩 확인할 수 있습니다.'));

  return h('section.card', {},
    h('h2', {}, h('span.step', {}, '1'), '클래스 정의 해부하기'),
    h('p.hint', {}, '수업에서 한 장씩 넘기며 배운 내용입니다. ',
      h('b', {}, '하늘색 글씨'), '를 눌러 보세요. 누른 부분은 노랗게 표시됩니다.'),
    h('div.anatomy', {}, pre, info));
}

/* ══════════════════ ② 상태·동작 분류 ═════════════════════════════════════ */
function sortSection() {
  const box = h('div');
  const judge = h('div');
  /* 낱말 카드를 눌러 상태/동작 칸으로 보낸다 */
  const state = {}; // 낱말 → 'state' | 'act' | null

  const all = [];
  for (const g of SORT_ITEMS.groups) {
    for (const w of g.state) all.push({ w, g: g.name, right: 'state' });
    for (const w of g.act) all.push({ w, g: g.name, right: 'act' });
  }
  /* 순서를 섞는다 (모둠마다 다르게 보이도록 그룹별로 번갈아 배치) */
  const pool = [];
  const byG = SORT_ITEMS.groups.map((g) => all.filter((x) => x.g === g.name));
  for (let i = 0; ; i++) {
    let added = false;
    for (const list of byG) if (list[i]) { pool.push(list[i]); added = true; }
    if (!added) break;
  }

  function draw() {
    box.textContent = '';
    for (const g of SORT_ITEMS.groups) {
      const mine = pool.filter((x) => x.g === g.name);
      const col = (kind, title) => {
        const c = h(`div.sort-col.${kind}`, {}, h('h5', {}, title));
        const items = mine.filter((x) => state[x.w] === kind);
        if (!items.length) c.append(h('span.hint', {}, '아래 낱말을 눌러 넣으세요'));
        for (const it of items) {
          c.append(h('button.chip', {
            onclick: () => { state[it.w] = null; draw(); },
            title: '누르면 빼냅니다',
          }, it.w));
        }
        return c;
      };
      const rest = mine.filter((x) => !state[x.w]);
      box.append(h('div.sort-group', {},
        h('h4', {}, g.name),
        h('div.sort-cols', {}, col('state', '상태 (속성)'), col('act', '동작 (기능)')),
        h('div.chip-box', {}, rest.length
          /* 낱말마다 「상태」·「동작」 버튼을 붙여 어디로 보낼지 바로 고르게 한다 */
          ? rest.map((it) => h('div.word', {},
            h('span.w', {}, it.w),
            h('button.small', { onclick: () => { state[it.w] = 'state'; draw(); } }, '상태'),
            h('button.soft.small', { onclick: () => { state[it.w] = 'act'; draw(); } }, '동작')))
          : h('span.hint', {}, '모두 넣었습니다. 「정답 확인」을 눌러 보세요.'))));
    }
  }

  function check() {
    const done = pool.filter((x) => state[x.w]);
    if (done.length < pool.length) {
      judge.textContent = '';
      judge.append(h('div.note.tip', {}, h('b', {}, '아직'),
        `${pool.length - done.length}개가 남았습니다. 모두 넣은 뒤 확인해 주세요.`));
      return;
    }
    const wrong = pool.filter((x) => state[x.w] !== x.right);
    judge.textContent = '';
    if (!wrong.length) {
      judge.append(h('div.note.tip', {}, h('b', {}, '정답'),
        '모두 맞았습니다! 상태는 «가지고 있는 값», 동작은 «할 수 있는 일» 입니다. 상태는 속성이 되고 동작은 메소드가 됩니다.'));
    } else {
      judge.append(h('div.note.warn', {}, h('b', {}, `${wrong.length}개 틀림`),
        `${wrong.map((x) => x.w).join(', ')} 을(를) 다시 보세요. 「~하기」로 끝나면 동작일 가능성이 높습니다.`));
    }
  }

  draw();
  return h('section.card', {},
    h('h2', {}, h('span.step', {}, '2'), '객체 = 상태 + 동작 으로 나누기'),
    h('p.hint', {}, '교안의 표를 직접 채워 봅시다. 낱말을 눌러 상태(속성)와 동작(기능)으로 나누세요.'),
    box,
    h('div.btn-row', {}, h('button', { onclick: check }, '정답 확인'),
      h('button.soft', { onclick: () => { for (const k of Object.keys(state)) delete state[k]; judge.textContent = ''; draw(); } }, '다시 하기')),
    judge);
}

/* ══════════════════ ③ 코드 조립 ══════════════════════════════════════════ */
function assembleSection(app) {
  const wrap = h('div');
  let puzzleIndex = 0;
  let placed = [];  // 넣은 줄의 원래 번호
  const judge = h('div');

  /* 문제마다 줄 순서를 섞어 둔다 (실행할 때마다 같게 나오도록 고정 규칙 사용) */
  function shuffled(lines) {
    /* 인덱스를 규칙적으로 뒤섞는다 — 무작위가 아니어서 수업 때 화면이 일정하다 */
    const idx = lines.map((_, i) => i);
    const out = [];
    for (let step = 3; out.length < idx.length; step++) {
      for (let i = 0; i < idx.length; i++) {
        const k = (i * step + 1) % idx.length;
        if (!out.includes(idx[k])) out.push(idx[k]);
      }
    }
    return out;
  }

  function draw() {
    const p = ASSEMBLE[puzzleIndex];
    const order = shuffled(p.lines);

    /* 조립판 */
    const board = h('div.asm-board');
    if (!placed.length) board.append(h('div.asm-line', {}, h('span.asm-slot', {}, '아래 조각을 눌러 위에서부터 차례대로 넣으세요')));
    placed.forEach((lineNo, pos) => {
      const [ind, txt] = p.lines[lineNo];
      board.append(h('div.asm-line', {},
        h('button', { onclick: () => { placed.splice(pos, 1); judge.textContent = ''; draw(); }, title: '빼내기' }, '✕'),
        h('span.txt', { html: '    '.repeat(ind).replace(/ /g, '&nbsp;') + highlight(txt) })));
    });

    /* 조각 */
    const chips = h('div.chip-box');
    for (const lineNo of order) {
      const used = placed.includes(lineNo);
      const [, txt] = p.lines[lineNo];
      chips.append(h('button.chip', {
        class: used ? 'used' : '', disabled: used,
        onclick: () => { placed.push(lineNo); judge.textContent = ''; draw(); },
      }, txt.trim()));
    }

    wrap.textContent = '';
    wrap.append(
      h('div.btn-row', { style: { marginBottom: '12px' } },
        ASSEMBLE.map((q, i) => h('button', {
          class: i === puzzleIndex ? '' : 'ghost',
          onclick: () => { puzzleIndex = i; placed = []; judge.textContent = ''; draw(); },
        }, `문제 ${i + 1}`))),
      h('div.point', {}, h('b', {}, '문제 '), p.goal),
      h('p.hint.tight', {}, '들여쓰기는 자동으로 맞춰집니다. ', h('b', {}, '줄의 순서'), '만 생각하세요.'),
      board,
      h('h3', {}, '코드 조각'),
      chips,
      h('div.btn-row', { style: { marginTop: '12px' } },
        h('button', { onclick: check }, '정답 확인'),
        h('button.soft', { onclick: () => { placed = []; judge.textContent = ''; draw(); } }, '다시 하기'),
        h('button.ghost', { onclick: showAnswer }, '정답 보기')),
      judge);
  }

  function check() {
    const p = ASSEMBLE[puzzleIndex];
    judge.textContent = '';
    if (placed.length < p.lines.length) {
      judge.append(h('div.note.tip', {}, h('b', {}, '아직'), `${p.lines.length - placed.length}줄이 남았습니다.`));
      return;
    }
    const code = placed.map((n) => '    '.repeat(p.lines[n][0]) + p.lines[n][1]).join('\n');
    const right = placed.every((n, i) => n === i);
    if (right) {
      const r = runPython(code);
      const madeInstance = r.instances && r.instances.length;
      judge.append(h('div.note.tip', {}, h('b', {}, '정답'),
        h('div', {},
          '순서가 모두 맞습니다! 실제로 실행해 보면 이렇게 나옵니다.',
          h('pre.out', { style: { marginTop: '9px' } },
            r.ok
              ? (r.output || (madeInstance
                ? '(출력 없음 — print( ) 를 쓰지 않았습니다)'
                : '(출력 없음 — 클래스를 정의하기만 했습니다)'))
              : r.error))));
      if (r.ok && !r.output && !madeInstance) {
        judge.append(h('div.note.tip', {}, h('b', {}, '왜 아무것도 안 나올까?'),
          '클래스는 설계도일 뿐입니다. 설계도를 그렸다고 물건이 생기지는 않습니다. '
          + '아래 버튼으로 실행 탭에 보낸 뒤 인스턴스명 = 클래스명( ) 을 직접 써 보세요.'));
      }
      judge.append(h('div.btn-row', { style: { marginTop: '10px' } },
        h('button.ghost', { onclick: () => app.sendToRun(code, { from: '조립 연습' }) }, '실행 탭에서 더 만져 보기')));
    } else {
      /* 어디서 처음 어긋났는지 알려 준다 */
      const at = placed.findIndex((n, i) => n !== i);
      const want = p.lines[at][1].trim();
      judge.append(h('div.note.warn', {}, h('b', {}, `${at + 1}번째 줄`),
        `이 자리에는 다른 줄이 와야 합니다. 힌트: ${want.split(' ')[0]} 로 시작하는 줄입니다.`));
      const r = runPython(code);
      if (!r.ok) judge.append(h('div.note.err', {}, h('b', {}, '실행하면'), r.error.split('\n')[0]));
    }
  }

  function showAnswer() {
    const p = ASSEMBLE[puzzleIndex];
    placed = p.lines.map((_, i) => i);
    draw();
    judge.textContent = '';
    judge.append(h('div.note.tip', {}, h('b', {}, '정답'),
      'class → def __init__ → 속성 → 다른 메소드 → (클래스 밖) 인스턴스 생성 → 메소드 호출 순서입니다.'));
  }

  draw();
  return h('section.card', {},
    h('h2', {}, h('span.step', {}, '3'), '코드 조각 순서 맞추기'),
    h('p.hint', {}, '클래스가 어떤 순서로 쓰이는지 손으로 익혀 봅시다.'),
    wrap);
}

/* ══════════════════ ④ 빈칸 채우기 ════════════════════════════════════════ */

/* 한글 낱자의 첫소리(초성) 19개 — 유니코드 순서 그대로다 */
const LEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/**
 * 답을 초성 힌트로 바꾼다.
 *   '상태'     → 'ㅅㅌ'
 *   'class'    → 'c····'      (영문은 첫 글자만 남긴다)
 *   '__init__' → '__i···__'   (밑줄 같은 기호는 그대로 보여 준다)
 */
function toChosung(word) {
  const chars = [...String(word)];
  let firstLatinDone = false;
  return chars.map((ch) => {
    const c = ch.charCodeAt(0);
    // 한글 낱자(가~힣) 이면 초성만 뽑는다
    if (c >= 0xac00 && c <= 0xd7a3) return LEAD[Math.floor((c - 0xac00) / 588)];
    if (/[A-Za-z]/.test(ch)) {
      if (!firstLatinDone) { firstLatinDone = true; return ch; }
      return '·';
    }
    if (/[0-9]/.test(ch)) return '·';
    return ch; // 밑줄·점 같은 기호는 그대로
  }).join('');
}

/** 인정하는 답이 여러 개면 한글이 든 것을 골라 초성을 만든다 (예: 2 / 두 / 둘 → ㄷ) */
function chosungOf(alts) {
  const pick = alts.find((w) => /[가-힣]/.test(w)) || alts[0];
  return toChosung(pick);
}

function blankSection() {
  const list = h('div');
  const rows = BLANKS.map((q, i) => {
    const judge = h('span.judge');
    const extra = h('div');
    /* 빈칸 하나당 입력칸 하나 */
    const inputs = q.a.map((_, k) => text('', () => { judge.textContent = ''; },
      { class: 'w-md', placeholder: q.a.length > 1 ? `${k + 1}번째 빈칸` : '답' }));

    const normalize = (s) => String(s).trim().toLowerCase().replace(/\s+/g, '').replace(/[()]/g, '');

    function check() {
      extra.textContent = '';
      const got = inputs.map((el) => normalize(el.value));
      if (got.some((g) => !g)) { judge.className = 'judge no'; judge.textContent = '빈칸을 모두 채워 주세요'; return; }
      /* 빈칸마다 인정하는 답이 여러 개일 수 있다 */
      const wrongAt = got.findIndex((g, k) => !q.a[k].some((w) => normalize(w) === g));
      if (wrongAt < 0) { judge.className = 'judge ok'; judge.textContent = '⭕ 정답'; }
      else {
        judge.className = 'judge no';
        judge.textContent = q.a.length > 1 ? `❌ ${wrongAt + 1}번째 빈칸을 다시` : '❌ 다시';
      }
    }
    function hint() {
      extra.textContent = '';
      /* 설명 힌트와 함께 초성을 보여 준다. 빈칸이 여러 개면 순서대로 나란히 놓는다. */
      extra.append(
        h('div.answer-open', {}, h('b', {}, '힌트 '), q.hint),
        h('div.answer-open.chosung-row', {},
          h('b', {}, '초성 '),
          q.a.map((alts, k) => h('span.chosung', {},
            q.a.length > 1 ? h('span.cs-no', {}, `${k + 1}번째`) : null,
            chosungOf(alts)))),
      );
    }
    function answer() {
      extra.textContent = '';
      extra.append(h('div.answer-open', {}, h('b', {}, '정답 '), q.a.map((alts) => alts[0]).join(' , ')));
      inputs.forEach((el, k) => { el.value = q.a[k][0]; });
      judge.textContent = '';
    }

    return h('div.quiz-item', {},
      h('div.quiz-q', {}, h('span.no', {}, `${i + 1}.`), q.q),
      h('div.quiz-row', {}, inputs,
        h('button.small', { onclick: check }, '확인'),
        h('button.soft.small', { onclick: hint }, '힌트'),
        h('button.soft.small', { onclick: answer }, '정답'),
        judge),
      extra);
  });
  list.append(...rows);

  return h('section.card', {},
    h('h2', {}, h('span.step', {}, '4'), '개념 빈칸 채우기'),
    h('p.hint', {}, '학습지의 빈칸입니다. 시험에 그대로 나올 수 있는 용어들입니다.'),
    list);
}
