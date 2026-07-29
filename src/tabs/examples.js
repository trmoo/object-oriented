/* ============================================================================
 * tabs/examples.js — 탭④ 교안 예제
 *
 * 교안에 나온 예제 6개를 골라 실행하고, 결과를 확인한다.
 * 교안이 「고쳐야 한다」고 표시해 둔 두 곳(Circle 의 return 누락,
 * Car 의 __str__ 반환값)은 오류 찾기 문제로 만들어 두었다.
 * ========================================================================== */

import { h, text, codeBlock, toast, copyText } from '../ui.js';
import { EXAMPLES } from '../data.js';
import { runPython } from '../pymini.js';
import { grade } from '../rubric.js';

export function mountExamples(root, app) {
  let current = 0;
  const listBox = h('div.ex-list');
  const bodyBox = h('div');

  function drawList() {
    listBox.textContent = '';
    EXAMPLES.forEach((ex, i) => {
      listBox.append(h('button.ex-btn', {
        'aria-pressed': String(i === current),
        onclick: () => { current = i; drawList(); drawBody(); },
      }, ex.title));
    });
  }

  function drawBody() {
    const ex = EXAMPLES[current];
    const outBox = h('pre.out', {}, h('span.muted', {}, '「▶ 실행」을 눌러 보세요.'));
    const instBox = h('div');
    const rubric = grade(ex.code);

    function run(code = ex.code) {
      const r = runPython(code);
      outBox.textContent = '';
      if (r.output) outBox.append(document.createTextNode(r.output));
      else if (r.ok) outBox.append(h('span.muted', {}, '(출력 없음)'));
      if (!r.ok) {
        if (r.output) outBox.append(document.createTextNode('\n'));
        outBox.append(h('span.err', {}, `⛔ ${r.error}`));
      }
      /* 인스턴스 상자 */
      instBox.textContent = '';
      if (r.instances && r.instances.length) {
        const grid = h('div.inst-grid');
        for (const o of r.instances) {
          const table = h('table');
          for (const a of o.attrs) {
            table.append(h('tr', {},
              h('td.k', {}, a.private ? h('span.lock', {}, '🔒 ') : '', h('span.mono', {}, a.name)),
              h('td.v.mono', {}, a.value)));
          }
          grid.append(h('div.inst', {},
            h('div.inst-head', {}, o.names.join(' = ') || '(이름 없음)', h('span.cls', {}, ` : ${o.cls}`)),
            table));
        }
        instBox.append(h('h3', {}, '만들어진 인스턴스'), grid);
      }
    }

    bodyBox.textContent = '';
    bodyBox.append(
      h('div.ex-meta', {}, ex.page),
      h('div.point', {}, h('b', {}, '핵심 '), ex.point),
      h('div.two-col', {},
        h('div', {},
          codeBlock(ex.code),
          h('div.btn-row', { style: { marginTop: '12px' } },
            h('button', { onclick: () => run() }, '▶ 실행'),
            h('button.ghost', { onclick: () => app.sendToRun(ex.code, { from: '교안 예제' }) }, '편집창으로 보내기'),
            h('button.soft', {
              onclick: async () => {
                const ok = await copyText(ex.code);
                toast(ok ? '코드를 복사했습니다.' : '복사에 실패했습니다.');
              },
            }, '📋 복사'),
            ex.experiment && h('button.ghost', {
              onclick: () => {
                run(ex.code + ex.experiment.append);
                toast('맨 아래 한 줄을 덧붙여 실행했습니다. 오류 메시지를 읽어 보세요.');
              },
            }, `🔒 ${ex.experiment.label}`)),
          h('p.hint', {}, h('b', {}, '볼 것 '), ex.watch)),
        h('div', {},
          h('h3', {}, '실행 결과'),
          outBox,
          instBox,
          h('h3', {}, '이 예제를 평가요소로 채점하면?'),
          h('div.score-head', {},
            h('div', {},
              h('div.score-num', {}, `평가요소 ${rubric.count} / 7`),
              h('div.score-note', {}, rubric.items.filter((i) => i.pass).map((i) => i.n).join(', ') + '번 만족')),
            h('div', { style: { marginLeft: 'auto', textAlign: 'right' } },
              h('div.score-big', {}, rubric.score === '기본점수' ? '기본점수' : `${rubric.score}점`))),
          rubric.items.filter((i) => !i.pass).length
            ? h('ul.rubric', {}, rubric.items.filter((i) => !i.pass).map((it) => h('li.fail', {},
              h('div.rb-mark', {}, '⬜'),
              h('div', {},
                h('div.rb-title', {}, `${'①②③④⑤⑥⑦'[it.n - 1]} ${it.title}`),
                it.detail && h('div.rb-detail', {}, it.detail)))))
            : h('div.note.tip', {}, h('b', {}, '완성'), '평가요소를 모두 만족하는 코드입니다.'),
          h('p.hint', {}, '교안 예제라도 평가요소를 모두 채우지는 못합니다. ',
            h('b', {}, '수행평가에서는 예제를 그대로 쓰면 감점'),
            '이므로, 설계실에서 나만의 클래스를 만들어야 합니다.'))),
      ex.bug ? bugQuiz(ex, run) : null,
    );
  }

  /* ── 오류 찾기 문제 ─────────────────────────────────────────────────── */
  function bugQuiz(ex, run) {
    const judge = h('div');
    const input = text('', () => { judge.textContent = ''; }, { class: 'code w-lg', placeholder: '답을 입력하세요' });

    const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
    function check() {
      judge.textContent = '';
      const got = norm(input.value);
      if (!got) { judge.append(h('div.note.warn', {}, h('b', {}, '입력'), '답을 적어 주세요.')); return; }
      const ok = ex.bug.answers.some((a) => norm(a) === got || got.includes(norm(a)));
      judge.append(ok
        ? h('div.note.tip', {}, h('b', {}, '⭕ 정답'), ex.bug.explain)
        : h('div.note.warn', {}, h('b', {}, '❌ 다시'), '조금 더 생각해 보세요. 「힌트」를 눌러도 됩니다.'));
      if (ok && ex.bug.fixed) {
        judge.append(h('p.hint', {}, '고친 코드:'), codeBlock(ex.bug.fixed));
        judge.append(h('div.btn-row', { style: { marginTop: '10px' } },
          h('button.ghost', {
            onclick: () => {
              const fixedCode = ex.code.replace(
                '        area = math.pi * self.__radius ** 2',
                '        area = math.pi * self.__radius ** 2\n        return area');
              run(fixedCode);
              toast('고친 코드로 실행했습니다. 이제 넓이가 나옵니다.');
            },
          }, '고친 코드로 실행해 보기')));
      }
    }

    return h('section.card', { style: { marginTop: '18px' } },
      h('h2', {}, '🔍 오류 찾기'),
      h('div.point', {}, h('b', {}, '문제 '), ex.bug.question),
      h('div.quiz-row', {}, input,
        h('button', { onclick: check }, '확인'),
        h('button.soft', {
          onclick: () => {
            judge.textContent = '';
            judge.append(h('div.answer-open', {}, h('b', {}, '힌트 '), ex.bug.hint));
          },
        }, '힌트'),
        h('button.soft', {
          onclick: () => {
            judge.textContent = '';
            judge.append(h('div.answer-open', {}, h('b', {}, '정답 '), ex.bug.answers[0]),
              h('div.note.tip', {}, h('b', {}, '설명'), ex.bug.explain));
          },
        }, '정답')),
      judge);
  }

  root.append(
    h('section.card', {},
      h('h2', {}, '📚 교안에 나온 예제'),
      h('p.hint', {}, '수업에서 함께 본 코드들입니다. 실행해서 결과를 확인하고, ',
        h('b', {}, '왜 그렇게 나오는지'), ' 생각해 보세요.'),
      listBox,
      bodyBox));

  drawList();
  drawBody();
}
