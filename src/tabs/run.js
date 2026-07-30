/* ============================================================================
 * tabs/run.js — 탭④ 실행해 보기
 *
 * 설계실에서 만든 코드(또는 손으로 고친 코드)를 그 자리에서 실행한다.
 *   · 출력창           : print 결과와 오류 메시지
 *   · 인스턴스 상자    : 만들어진 객체마다 속성값을 그림으로 보여 준다
 *   · 메소드 호출 기록 : 어떤 메소드가 무엇을 바꾸었는지 남긴다
 *   · 정보 은닉 실험   : 비공개 속성을 밖에서 꺼내면 어떻게 되는지 직접 확인
 * ========================================================================== */

import { h, toast, copyText, download } from '../ui.js';
import { runPython } from '../pymini.js';
import { generate } from '../codegen.js';
import { grade } from '../rubric.js';

export function mountRun(root, app) {
  const editor = h('textarea', {
    class: 'code', rows: '20', spellcheck: 'false',
    placeholder: '여기에 파이썬 코드를 쓰거나, 위 버튼으로 설계실 코드를 가져오세요.',
  });
  const inputBox = h('textarea', { class: 'code', rows: '2', spellcheck: 'false', placeholder: 'input( ) 을 쓸 때만 채우세요. 한 줄에 값 하나.' });
  const outBox = h('pre.out', {}, h('span.muted', {}, '「▶ 실행」을 누르면 결과가 여기에 나옵니다.'));
  const instBox = h('div');
  const traceBox = h('div');
  const rubricBox = h('div');
  const errBox = h('div');

  /* 탭 키로 스페이스 4칸 넣기 — 파이썬은 들여쓰기가 문법이다 */
  editor.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const { selectionStart: s, selectionEnd: t, value } = editor;
    editor.value = `${value.slice(0, s)}    ${value.slice(t)}`;
    editor.selectionStart = editor.selectionEnd = s + 4;
  });
  /* Ctrl+Enter 로 실행 */
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });

  function setCode(code, opts = {}) {
    editor.value = code;
    clearResult();
    if (opts.from) toast(`${opts.from} 의 코드를 가져왔습니다. 「▶ 실행」을 눌러 보세요.`);
    if (opts.autorun) run();
  }

  function clearResult() {
    outBox.textContent = '';
    outBox.append(h('span.muted', {}, '「▶ 실행」을 누르면 결과가 여기에 나옵니다.'));
    instBox.textContent = '';
    traceBox.textContent = '';
    errBox.textContent = '';
    rubricBox.textContent = '';
  }

  /* ── 실행 ────────────────────────────────────────────────────────────── */
  function run() {
    const src = editor.value;
    if (!src.trim()) { toast('실행할 코드가 없습니다.'); return; }

    const inputs = inputBox.value.split('\n').filter((l, i, arr) => l !== '' || i < arr.length - 1);
    const r = runPython(src, { inputs });

    /* 출력 */
    outBox.textContent = '';
    if (r.output) outBox.append(document.createTextNode(r.output));
    else if (r.ok) outBox.append(h('span.muted', {}, '(출력된 것이 없습니다. print( ) 로 결과를 찍어 보세요.)'));
    if (!r.ok) {
      if (r.output) outBox.append(document.createTextNode('\n'));
      outBox.append(h('span.err', {}, `⛔ ${r.error}`));
    }

    /* 오류를 만난 줄 알려 주기 */
    errBox.textContent = '';
    if (!r.ok) {
      const lines = src.split('\n');
      const n = r.errorLine;
      errBox.append(h('div.note.err', {},
        h('b', {}, r.errorType || '오류'),
        h('div', {},
          h('div', {}, n ? `${n}번째 줄 — ${r.errorMsg || r.error}` : (r.errorMsg || r.error)),
          r.errorHint && h('div', { style: { marginTop: '5px' } }, `↳ ${r.errorHint}`),
          n && lines[n - 1] !== undefined && h('pre.code', { style: { marginTop: '9px' } },
            `${n} | ${lines[n - 1]}`))));
    }

    drawInstances(r.instances);
    drawTrace(r.trace);
    drawRubric(src);
  }

  /* ── 인스턴스 상자 ───────────────────────────────────────────────────── */
  function drawInstances(list) {
    instBox.textContent = '';
    if (!list || !list.length) {
      instBox.append(h('p.hint', {}, '아직 만들어진 인스턴스가 없습니다. ',
        h('code', {}, '인스턴스명 = 클래스명()'), ' 을 써 보세요.'));
      return;
    }
    instBox.append(h('p.hint', {}, '클래스는 틀 하나지만, 인스턴스는 각자 자기 값을 따로 가집니다. ',
      h('span', { style: { color: '#c62828', fontWeight: '700' } }, '🔒'), ' 표시는 비공개 속성입니다.'));
    const grid = h('div.inst-grid');
    for (const o of list) {
      const table = h('table');
      if (!o.attrs.length) table.append(h('tr', {}, h('td', { colspan: '2', class: 'k' }, '(속성 없음)')));
      for (const a of o.attrs) {
        table.append(h('tr', {},
          h('td.k', {}, a.private ? h('span.lock', {}, '🔒 ') : '', h('span.mono', {}, a.name)),
          h('td.v.mono', {}, a.value)));
      }
      grid.append(h('div.inst', {},
        h('div.inst-head', {},
          o.names.length ? o.names.join(' = ') : '(이름 없는 객체)',
          h('span.cls', {}, ` : ${o.cls}`)),
        table,
        o.methods.length && h('div.m-list', {}, '메소드 ', o.methods.map((m) => m + '( )').join(', '))));
    }
    instBox.append(grid);
  }

  /* ── 메소드 호출 기록 ────────────────────────────────────────────────── */
  function drawTrace(trace) {
    traceBox.textContent = '';
    if (!trace || !trace.length) {
      traceBox.append(h('p.hint', {}, '메소드를 호출하면 무엇이 어떻게 바뀌었는지 여기에 쌓입니다.'));
      return;
    }
    const table = h('table.trace', {},
      h('tr', {}, h('th', {}, '순서'), h('th', {}, '호출한 메소드'), h('th', {}, '받은 값'),
        h('th', {}, '바뀐 속성'), h('th', {}, '돌려준 값')));
    trace.forEach((t, i) => {
      table.append(h('tr', {},
        h('td', {}, String(i + 1)),
        h('td.mono', {}, `${t.cls}.${t.method}( )`),
        h('td.mono', {}, t.args.length ? t.args.join(', ') : '—'),
        h('td.chg.mono', {}, t.changes.length
          ? t.changes.map((c) => `${c.attr}: ${c.before} → ${c.after}`).join(' / ')
          : '—'),
        h('td.mono', {}, t.returned === null ? 'None' : t.returned)));
    });
    traceBox.append(h('div.table-scroll', {}, table));
  }

  /* ── 손으로 고친 코드도 평가요소를 확인해 준다 ───────────────────────── */
  function drawRubric(src) {
    const g = grade(src);
    rubricBox.textContent = '';
    rubricBox.append(h('div.score-head', {},
      h('div', {},
        h('div.score-num', {}, `평가요소 ${g.count} / 7`),
        h('div.score-note', {}, '지금 편집창에 있는 코드 기준')),
      h('div', { style: { marginLeft: 'auto', textAlign: 'right' } },
        h('div.score-big', {}, g.score === '기본점수' ? '기본점수' : `${g.score}점`),
        h('div.score-note', {}, '예상 점수 (참고용)'))));
    const missing = g.items.filter((i) => !i.pass);
    if (!missing.length) {
      rubricBox.append(h('div.note.tip', {}, h('b', {}, '완성'),
        '평가요소 7가지를 모두 만족합니다. 이제 IDLE 에서 직접 타이핑해 보는 연습을 하세요.'));
    } else {
      rubricBox.append(h('ul.rubric', {}, missing.map((it) => h('li.fail', {},
        h('div.rb-mark', {}, '☐'),   // 표시는 다른 탭과 같게 (빈 상자)
        h('div', {},
          h('div.rb-title', {}, `${'①②③④⑤⑥⑦'[it.n - 1]} ${it.title}`),
          it.detail && h('div.rb-detail', {}, it.detail))))));
    }
    for (const n of g.notes.filter((x) => x.level === 'warn')) {
      rubricBox.append(h('div.note.warn', {}, h('b', {}, '확인'), n.text));
    }
  }

  /* ── 정보 은닉 실험 ──────────────────────────────────────────────────── */
  function hideExperiment() {
    const src = editor.value;
    const r = runPython(src);
    const target = (r.instances || []).find((o) => o.names.length && o.attrs.some((a) => a.private));
    if (!target) {
      toast('먼저 비공개 속성(__)이 있는 객체를 만들고 실행해 주세요.');
      return;
    }
    const attr = target.attrs.find((a) => a.private).name;
    const line = `\nprint(${target.names[0]}.${attr})   # 비공개 속성을 밖에서 직접 꺼내면?`;
    editor.value = src.replace(/\s*$/, '') + line;
    run();
    toast('맨 아래 줄을 보세요. 밖에서는 비공개 속성을 꺼낼 수 없습니다.');
  }

  function openExperiment() {
    const src = editor.value;
    const r = runPython(src);
    const target = (r.instances || []).find((o) => o.names.length && o.attrs.some((a) => !a.private));
    if (!target) {
      toast('공개 속성(밑줄 없는 속성)이 있는 객체가 필요합니다. 교안 예제 탭의 「정보 은닉이 없을 때」를 보세요.');
      return;
    }
    const attr = target.attrs.find((a) => !a.private).name;
    const line = `\n${target.names[0]}.${attr} = -999   # 공개 속성은 이렇게 아무 값이나 들어간다\nprint(${target.names[0]}.${attr})`;
    editor.value = src.replace(/\s*$/, '') + line;
    run();
    toast('공개 속성은 -999 같은 엉뚱한 값도 그대로 들어갑니다. 이것이 정보 은닉이 필요한 이유입니다.');
  }

  /* ── 화면 ────────────────────────────────────────────────────────────── */
  root.append(
    h('div.two-col', {},
      /* 왼쪽: 편집창 */
      h('div', {},
        h('section.card', {},
          h('div.code-bar', {},
            h('h2', { style: { margin: '0' } }, '⌨ 코드 편집창'),
            h('div.btn-row', {},
              h('button', { onclick: run }, '▶ 실행'),
              h('button.soft', { onclick: () => { editor.value = ''; clearResult(); } }, '지우기'))),
          h('p.hint.tight', {}, 'Tab 키를 누르면 스페이스 4칸이 들어갑니다. Ctrl + Enter 로도 실행됩니다.'),
          editor,
          h('div.btn-row', { style: { marginTop: '12px' } },
            h('button.ghost', {
              onclick: () => setCode(generate(app.design, false).code, { from: '설계실' }),
            }, '⬅ 설계실 코드 가져오기'),
            h('button.soft', {
              onclick: async () => {
                const ok = await copyText(editor.value);
                toast(ok ? '코드를 복사했습니다.' : '복사에 실패했습니다.');
              },
            }, '📋 복사'),
            h('button.soft', {
              onclick: () => {
                download(`${app.design.className || 'MyClass'}.py`, editor.value, 'text/x-python');
                toast('.py 파일로 저장했습니다.');
              },
            }, '💾 .py 저장')),
          h('h3', {}, 'input( ) 에 미리 넣어 둘 값 ',
            h('span.hint', { style: { fontWeight: '400' } }, '(안 쓰면 비워 두세요)')),
          inputBox),

        h('section.card', {},
          h('h2', {}, '🔒 정보 은닉 실험'),
          h('p.hint', {}, '「왜 굳이 메소드를 거쳐서 속성을 다뤄야 하는가?」를 직접 확인해 봅시다.'),
          h('div.btn-row', {},
            h('button.ghost', { onclick: hideExperiment }, '비공개 속성을 직접 꺼내 보기'),
            h('button.ghost', { onclick: openExperiment }, '공개 속성에 이상한 값 넣어 보기')),
          h('p.hint', {}, '버튼을 누르면 편집창 맨 아래에 실험용 한 줄이 붙고 바로 실행됩니다.')),

        h('section.card', {},
          h('h2', {}, '✅ 평가요소 자동 확인'),
          h('p.hint.tight', {}, '손으로 고친 코드도 그대로 검사합니다. 실행하면 갱신됩니다.'),
          rubricBox)),

      /* 오른쪽: 결과 */
      h('div', {},
        h('section.card', {},
          h('h2', {}, '🖨 출력 결과'),
          outBox,
          errBox),
        h('section.card', {},
          h('h2', {}, '📦 만들어진 인스턴스'),
          instBox),
        h('section.card', {},
          h('h2', {}, '📜 메소드 호출 기록'),
          traceBox))),
  );

  clearResult();
  return { setCode, run };
}
