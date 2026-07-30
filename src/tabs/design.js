/* ============================================================================
 * tabs/design.js — 탭③ 클래스 설계실
 *
 * 수행평가 설계지의 5칸(클래스 이름 / 비공개 속성 / 메소드 / 객체 생성 /
 * 메소드 호출)을 화면에서 채우면, 오른쪽에 파이썬 코드가 바로 조립되고
 * 평가요소 7가지가 자동으로 확인된다.
 * ========================================================================== */

import { h, text, checkbox, select, highlight, toast, copyText, download } from '../ui.js';
import {
  emptyDesign, newAttr, newMethod, generate, designFromIdea,
  getterName, setterName, DEFAULT_INIT, METHOD_KINDS, ctorParams,
} from '../codegen.js';
import { grade } from '../rubric.js';
import { CLASS_IDEAS, RUBRIC_ITEMS, SCORE_TABLE } from '../data.js';

const TYPES = [
  ['int', '정수 (int)'], ['float', '실수 (float)'], ['str', '문자열 (str)'],
  ['bool', '참/거짓 (bool)'], ['list', '리스트 (list)'],
];
const GUARDS = [
  ['none', '검사하지 않음'],
  ['min', '최솟값보다 작으면 거부'],
  ['range', '정해진 범위를 벗어나면 거부'],
  ['nonempty', '빈 문자열이면 거부'],
];

export function mountDesign(root, app) {
  const d = app.design;

  /* 화면을 담을 상자들 — 다시 그릴 때 이 안만 갈아 끼운다 */
  const formBox = h('div');
  const codeBox = h('pre.code');
  const rubricBox = h('div');
  const pickerBox = h('div', { style: { display: 'none' } });
  let showMarks = true;

  /* ── 왼쪽: 입력 폼 ───────────────────────────────────────────────────── */
  function drawForm() {
    formBox.textContent = '';
    formBox.append(
      cardName(), cardAttrs(), cardMethods(), cardUse(), cardSave(),
    );
  }

  /* [1] 클래스 이름 */
  function cardName() {
    const warn = classNameNote(d.className);
    return h('section.card', {},
      h('h2', {}, h('span.step', {}, '1'), '클래스 이름 정하기'),
      h('p.hint', {}, '내가 만들고 싶은 것을 하나 고르세요. 클래스는 ',
        h('b', {}, '객체를 찍어내는 틀'), ' 입니다. 이름의 첫 문자는 대문자로 씁니다.'),
      h('div.row', {},
        h('div.field', {},
          h('label', { for: 'in-cls' }, '영문 클래스명'),
          text(d.className, (v) => { d.className = v.trim(); refresh(); },
            { id: 'in-cls', class: 'code w-lg', placeholder: '예) Car', maxlength: '30' })),
        h('button.ghost', { onclick: togglePicker }, '📋 예시 49개에서 고르기'),
      ),
      warn && h('div.note', { class: warn.level }, h('b', {}, warn.label), warn.text),
      pickerBox,
    );
  }

  function classNameNote(name) {
    if (!name) return { level: 'tip', label: '먼저', text: '클래스 이름을 정해 주세요. 만들고 싶은 것 하나를 떠올려 보세요.' };
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      return { level: 'warn', label: '확인', text: '클래스 이름은 영문자·숫자·밑줄만 쓸 수 있고, 숫자로 시작할 수 없습니다. 한글이나 빈칸이 섞이지 않았는지 확인해 보세요.' };
    }
    if (!/^[A-Z]/.test(name)) {
      return { level: 'warn', label: '확인', text: `첫 문자를 대문자로 바꿔 ${name.charAt(0).toUpperCase()}${name.slice(1)} 처럼 쓰는 것이 규칙입니다.` };
    }
    return { level: 'tip', label: '좋아요', text: `class ${name} : 형태로 정의됩니다.` };
  }

  function togglePicker() {
    if (pickerBox.style.display === 'none') { drawPicker(); pickerBox.style.display = ''; }
    else pickerBox.style.display = 'none';
  }

  function drawPicker() {
    const grid = h('div.idea-grid');
    const fill = (list) => {
      grid.textContent = '';
      for (const idea of list) {
        grid.append(h('button.idea', { onclick: () => applyIdea(idea) },
          h('span.ko', {}, idea.ko), h('span.en', {}, idea.en)));
      }
      if (!list.length) grid.append(h('p.hint', {}, '찾는 이름이 없습니다. 직접 지어도 좋습니다.'));
    };
    pickerBox.textContent = '';
    pickerBox.append(h('div.picker', {},
      h('p.hint.tight', {}, '수행평가 설계지에 실린 예시입니다. 고르면 ',
        h('b', {}, '클래스 이름만 채워지고'), ', 어떤 속성을 만들면 좋을지 ',
        h('b', {}, '제안'), '해 드립니다. ',
        '속성·생성자·접근자·설정자·메소드는 모두 직접 만들어야 합니다 — 그것이 이 수행평가의 설계입니다.'),
      text('', (v) => {
        const q = v.trim().toLowerCase();
        fill(!q ? CLASS_IDEAS : CLASS_IDEAS.filter((i) => i.ko.includes(q) || i.en.toLowerCase().includes(q)));
      }, { placeholder: '이름으로 찾기 (예: 자동차, Car)', class: 'w-lg' }),
      grid));
    fill(CLASS_IDEAS);
  }

  function applyIdea(idea) {
    Object.assign(d, designFromIdea(idea));
    pickerBox.style.display = 'none';
    refresh(true);
    toast(`${idea.ko}(${idea.en}) 로 정했습니다. 2번에 속성 제안이 있으니 보고 직접 만들어 보세요.`);
  }

  /* [2] 비공개 속성 */
  function cardAttrs() {
    const box = h('section.card', {},
      h('h2', {}, h('span.step', {}, '2'), '비공개 속성 정하기 ',
        h('span.hint', { style: { fontWeight: '400' } }, '(상태 = 속성)')),
      h('p.hint', {}, '객체가 ', h('b', {}, '기억해 둘 값'), '입니다. 앞에 밑줄 두 개(',
        h('code', {}, '__'), ')를 붙이면 클래스 밖에서 함부로 바꿀 수 없는 ',
        h('b', {}, '비공개 속성'), '이 됩니다. ',
        h('b', {}, '평가요소 2는 비공개 속성 1개 이상'), '을 요구합니다.'),
    );

    /* 예시를 골랐다면 「이런 속성을 생각해 보세요」로 제안만 해 준다.
       만들어 주지는 않는다 — 속성을 직접 추가해야 생성자·접근자·설정자를 스스로 결정한다. */
    if (d.attrIdeas && d.attrIdeas.length) {
      box.append(h('div.note.tip', {},
        h('b', {}, '제안'),
        h('div', {},
          /* 클래스 이름이 영문이라 「Drone 라면 / Car 라면」처럼 조사가 갈린다.
             줄표로 이어 조사를 아예 쓰지 않는다. (codegen 의 jo() 는 한글 낱말용) */
          h('div', {}, d.className ? `${d.className} — 이런 속성을 생각해 볼 수 있습니다.`
            : '이런 속성을 생각해 볼 수 있습니다.'),
          h('div.idea-attrs', {}, d.attrIdeas.map((a) => h('span.idea-attr', {},
            a.kor, h('span.en', {}, a.name)))),
          h('div', { style: { marginTop: '6px' } },
            '그대로 쓰지 않아도 됩니다. 아래 ', h('b', {}, '「+ 속성 추가」'),
            ' 로 직접 만들면서 자료형·초깃값과 접근자·설정자를 스스로 정해 보세요.'))));
    }

    if (!d.attrs.length) {
      box.append(h('div.empty', {}, '아직 속성이 없습니다. 아래 버튼으로 하나 추가해 보세요. 예) 속력, 배터리, 점수'));
    }
    d.attrs.forEach((a, i) => box.append(attrItem(a, i)));
    box.append(h('button', {
      onclick: () => {
        d.attrs.push(newAttr({ fromParam: d.attrs.length === 0 }));
        refresh(true);
      },
    }, '+ 속성 추가'));
    return box;
  }

  function attrItem(a, i) {
    const dup = a.name && d.attrs.filter((x) => x.name === a.name).length > 1;
    const badName = a.name && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(a.name);
    return h('div.item', {},
      h('div.item-head', {},
        h('span.name', {}, `속성 ${i + 1}`,
          a.name ? h('span.mono', { style: { color: '#c62828', marginLeft: '10px' } }, `self.__${a.name}`) : ''),
        h('div.btn-row', {},
          i > 0 && h('button.soft.small', { onclick: () => { swap(d.attrs, i, i - 1); refresh(true); }, title: '위로' }, '↑'),
          i < d.attrs.length - 1 && h('button.soft.small', { onclick: () => { swap(d.attrs, i, i + 1); refresh(true); }, title: '아래로' }, '↓'),
          h('button.danger', { onclick: () => { d.attrs.splice(i, 1); cleanCalls(); refresh(true); } }, '삭제'))),

      h('div.row', {},
        h('div.field', {}, h('label', {}, '영문 속성명'),
          text(a.name, (v) => { a.name = v.trim(); syncCalls(); refresh(); },
            { class: 'code w-md', placeholder: '예) speed', maxlength: '24' })),
        h('div.field', {}, h('label', {}, '한글 뜻'),
          text(a.kor, (v) => { a.kor = v; refresh(); }, { class: 'w-md', placeholder: '예) 속력', maxlength: '16' })),
        h('div.field', {}, h('label', {}, '자료형'),
          select(TYPES, a.type, (v) => {
            a.type = v;
            a.init = DEFAULT_INIT[v];
            if (v === 'str') a.guard = a.guard === 'min' || a.guard === 'range' ? 'nonempty' : a.guard;
            if (v === 'bool' || v === 'list') a.guard = 'none';
            refresh(true);
          }))),

      (dup || badName) && h('div.note.warn', {}, h('b', {}, '확인'),
        dup ? '같은 이름의 속성이 두 개 있습니다. 이름을 다르게 지어 주세요.'
          : '속성 이름은 영문자·숫자·밑줄만 쓸 수 있고 숫자로 시작할 수 없습니다.'),

      h('div.row.center.sub-row', {},
        h('label.check', {},
          h('input', {
            type: 'radio', name: `src-${a.id}`, checked: a.fromParam,
            onchange: () => { a.fromParam = true; refresh(true); },
          }), '객체를 만들 때 값을 받는다'),
        h('label.check', {},
          h('input', {
            type: 'radio', name: `src-${a.id}`, checked: !a.fromParam,
            onchange: () => { a.fromParam = false; refresh(true); },
          }), '초깃값으로 고정한다'),
        h('div.field', {},
          h('label', {}, a.fromParam ? '기본으로 넣을 값' : '초깃값'),
          text(a.init, (v) => { a.init = v; refresh(); },
            { class: 'code w-md', placeholder: DEFAULT_INIT[a.type] }))),

      h('div.row.center.sub-row', {},
        checkbox(a.name ? `접근자 ${getterName(a.name)}( ) 만들기` : '접근자 만들기 (평가요소 3)',
          a.getter, (v) => { a.getter = v; cleanCalls(); refresh(true); }),
        checkbox(a.name ? `설정자 ${setterName(a.name)}( ) 만들기` : '설정자 만들기 (평가요소 4)',
          a.setter, (v) => { a.setter = v; cleanCalls(); refresh(true); })),

      a.setter && h('div.row.center.sub-row', {},
        h('div.field', {},
          h('label', {}, '설정자에서 잘못된 값 막기 ',
            h('span.hint', { style: { fontWeight: '400' } }, '(정보 은닉의 필요성)')),
          select(GUARDS.filter(([g]) => {
            if (a.type === 'str') return g === 'none' || g === 'nonempty';
            if (a.type === 'bool' || a.type === 'list') return g === 'none';
            return g !== 'nonempty';
          }), a.guard, (v) => { a.guard = v; refresh(true); })),
        (a.guard === 'min' || a.guard === 'range') && h('div.field', {},
          h('label', {}, '최솟값'),
          text(a.gmin, (v) => { a.gmin = v; refresh(); }, { class: 'code w-sm' })),
        a.guard === 'range' && h('div.field', {},
          h('label', {}, '최댓값'),
          text(a.gmax, (v) => { a.gmax = v; refresh(); }, { class: 'code w-sm' }))),

      a.setter && a.guard !== 'none' && h('p.hint.tight', {},
        '이렇게 하면 「', h('b', {}, '메소드를 통해서만 속성을 바꾸게 하는 이유'),
        '」를 눈으로 확인할 수 있습니다. 잘못된 값을 넣어 보세요.'),
    );
  }

  /* [3] 메소드 */
  function cardMethods() {
    const box = h('section.card', {},
      h('h2', {}, h('span.step', {}, '3'), '메소드 만들기 ',
        h('span.hint', { style: { fontWeight: '400' } }, '(동작 = 기능)')),
      h('p.hint', {}, '객체가 ', h('b', {}, '할 수 있는 일'), '입니다. 접근자·설정자는 위에서 자동으로 만들어지니, ',
        '여기에는 ', h('b', {}, '그 밖의 메소드'), '를 만듭니다. ',
        h('b', {}, '평가요소 5는 이런 메소드 1개 이상'), '을 요구하고, 메소드 안에서 속성을 써야 인정됩니다.'),
    );
    if (!d.methods.length) {
      box.append(h('div.empty', {}, '아직 메소드가 없습니다. 예) 가속하기, 입금하기, 공격하기, 충전하기'));
    }
    d.methods.forEach((m, i) => box.append(methodItem(m, i)));
    box.append(
      h('div.btn-row', {},
        h('button', {
          onclick: () => {
            d.methods.push(newMethod({ attr: d.attrs.find((a) => a.name)?.name || '' }));
            refresh(true);
          },
        }, '+ 메소드 추가')),
      h('div', { style: { marginTop: '14px' } },
        checkbox('__str__ (문자열 표현 메소드) 도 추가하기 — print(인스턴스) 했을 때 보여 줄 글자를 정한다',
          d.useStr, (v) => { d.useStr = v; refresh(true); })),
    );
    return box;
  }

  function methodItem(m, i) {
    const kindInfo = METHOD_KINDS.find((k) => k.kind === m.kind) || METHOD_KINDS[0];
    const numericAttrs = d.attrs.filter((a) => a.name && (!kindInfo.numeric || ['int', 'float'].includes(a.type)));
    const attrOptions = (m.kind === 'toggle'
      ? d.attrs.filter((a) => a.name && a.type === 'bool')
      : numericAttrs).map((a) => [a.name, `${a.kor ? a.kor + ' ' : ''}__${a.name}`]);
    const reserved = d.attrs.flatMap((a) => (a.name ? [getterName(a.name), setterName(a.name)] : []));
    const clash = m.name && reserved.includes(m.name);
    const dup = m.name && d.methods.filter((x) => x.name === m.name).length > 1;

    return h('div.item', {},
      h('div.item-head', {},
        h('span.name', {}, `메소드 ${i + 1}`,
          m.name ? h('span.mono', { style: { color: '#2f5bd7', marginLeft: '10px' } },
            `${m.name}(self${m.param.trim() ? ', ' + m.param.trim() : ''})`) : ''),
        h('div.btn-row', {},
          i > 0 && h('button.soft.small', { onclick: () => { swap(d.methods, i, i - 1); refresh(true); } }, '↑'),
          i < d.methods.length - 1 && h('button.soft.small', { onclick: () => { swap(d.methods, i, i + 1); refresh(true); } }, '↓'),
          h('button.danger', { onclick: () => { d.methods.splice(i, 1); cleanCalls(); refresh(true); } }, '삭제'))),

      h('div.row', {},
        h('div.field', {}, h('label', {}, '영문 메소드명'),
          text(m.name, (v) => { m.name = v.trim(); syncCalls(); refresh(); },
            { class: 'code w-md', placeholder: '예) accel', maxlength: '24' })),
        h('div.field', {}, h('label', {}, '한글 뜻'),
          text(m.kor, (v) => { m.kor = v; refresh(); }, { class: 'w-md', placeholder: '예) 가속하기', maxlength: '16' }))),

      (clash || dup) && h('div.note.warn', {}, h('b', {}, '확인'),
        clash ? `${m.name} 은(는) 위에서 자동으로 만드는 접근자·설정자와 이름이 겹칩니다. 다른 이름을 쓰세요.`
          : '같은 이름의 메소드가 두 개 있습니다.'),

      h('div.field.sub-row', {},
        h('label', {}, '이 메소드는 무엇을 하나요?'),
        select(METHOD_KINDS.map((k) => [k.kind, k.label]), m.kind, (v) => {
          m.kind = v;
          const ok = (v === 'toggle' ? d.attrs.filter((a) => a.type === 'bool') : d.attrs).find((a) => a.name);
          if (ok && !attrOk(m.attr, v)) m.attr = ok.name;
          refresh(true);
        }),
        h('p.hint.tight', {}, kindInfo.desc)),

      kindInfo.needAttr && h('div.row.sub-row', {},
        h('div.field', {}, h('label', {}, '다룰 속성'),
          attrOptions.length
            ? select(attrOptions, m.attr, (v) => { m.attr = v; refresh(true); })
            : h('p.hint.tight', {}, m.kind === 'toggle'
              ? '참/거짓(bool) 속성이 필요합니다. 위에서 자료형을 bool 로 만들어 주세요.'
              : '먼저 위에서 숫자 속성을 만들어 주세요.')),
        ['inc', 'dec', 'check'].includes(m.kind) && h('div.field', {},
          h('label', {}, '매개변수 이름 ', h('span.hint', { style: { fontWeight: '400' } }, '(비우면 고정값 사용)')),
          text(m.param, (v) => { m.param = v.trim(); refresh(); },
            { class: 'code w-md', placeholder: '예) amount' })),
        ['inc', 'dec', 'check'].includes(m.kind) && !m.param.trim() && h('div.field', {},
          h('label', {}, m.kind === 'check' ? '기준값' : '얼마씩'),
          text(m.amount, (v) => { m.amount = v; refresh(); }, { class: 'code w-sm' })),
        m.kind === 'print' && h('div.field', {},
          h('label', {}, '함께 출력할 문구'),
          text(m.text, (v) => { m.text = v; refresh(); },
            { class: 'w-lg', placeholder: `예) 현재 ${m.attr || '값'}:` }))),

      m.kind === 'custom' && h('div.field.sub-row', {},
        h('label', {}, '메소드 안에 들어갈 코드 (들여쓰기는 자동으로 맞춰집니다)'),
        h('textarea', {
          class: 'code', rows: '5', spellcheck: 'false',
          placeholder: d.attrs[0] && d.attrs[0].name
            ? `예)\nself.__${d.attrs[0].name} = self.__${d.attrs[0].name} + 1\nprint('바뀌었습니다')`
            : "예)\nprint('안녕하세요')",
          value: m.body,
          oninput: (e) => { m.body = e.target.value; refresh(); },
        }),
        h('p.hint.tight', {}, '속성을 쓸 때는 ', h('code', {}, 'self.__속성명'),
          ' 형태로 씁니다. random·math 를 쓰면 import 문이 자동으로 붙습니다.')),
    );
  }

  function attrOk(name, kind) {
    const a = d.attrs.find((x) => x.name === name);
    if (!a) return false;
    if (kind === 'toggle') return a.type === 'bool';
    const k = METHOD_KINDS.find((x) => x.kind === kind);
    if (k && k.numeric) return ['int', 'float'].includes(a.type);
    return true;
  }

  /* [4] 객체 만들고 활용하기 */
  function cardUse() {
    const params = ctorParams(d);
    const callable = [
      ...d.attrs.filter((a) => a.name && a.getter).map((a) => [getterName(a.name), `${getterName(a.name)}( ) — 값 꺼내기`]),
      ...d.attrs.filter((a) => a.name && a.setter).map((a) => [setterName(a.name), `${setterName(a.name)}( ) — 값 바꾸기`]),
      ...d.methods.filter((m) => m.name).map((m) => [m.name, `${m.name}( )${m.kor ? ' — ' + m.kor : ''}`]),
    ];
    const box = h('section.card', {},
      h('h2', {}, h('span.step', {}, '4'), '객체 만들고 활용하기'),
      h('p.hint', {}, '설계도(클래스)로 실제 물건(인스턴스)을 찍어냅니다. ',
        h('b', {}, '평가요소 6은 인스턴스를 변수에 저장'), ', ',
        h('b', {}, '평가요소 7은 메소드 호출 1회 이상'), ' 입니다.'),
      h('div.row', {},
        h('div.field', {}, h('label', {}, '인스턴스명 (객체를 담을 변수)'),
          text(d.instName, (v) => { d.instName = v.trim(); refresh(); },
            { class: 'code w-md', placeholder: d.className ? 'my' + d.className : '예) myCar', maxlength: '24' })),
        h('p.hint.tight', {}, d.className && d.instName
          ? `${d.instName} = ${d.className}( ) 형태로 만들어집니다.`
          : '보통 소문자로 시작하는 이름을 씁니다.')),
    );

    if (params.length) {
      box.append(h('h3', {}, '생성자에 넣을 값'),
        h('p.hint.tight', {}, '「객체를 만들 때 값을 받는다」로 정한 속성입니다. 만들 때 넣어 줄 값을 적으세요.'),
        h('div.row', {}, params.map((a) => h('div.field', {},
          h('label', {}, `${a.kor || a.name} `, h('span.mono', { style: { fontWeight: '400' } }, `(${a.name})`)),
          text(a.ctorArg ?? a.init, (v) => { a.ctorArg = v; refresh(); }, { class: 'code w-md' })))));
    }

    box.append(h('h3', {}, '호출할 메소드'));
    if (!callable.length) {
      box.append(h('div.empty', {}, '먼저 위에서 속성이나 메소드를 만들어 주세요.'));
    } else {
      if (!d.calls.length) box.append(h('div.empty', {}, '아직 호출이 없습니다. 아래 버튼으로 추가하세요. 평가요소 7에 필요합니다.'));
      d.calls.forEach((c, i) => box.append(callItem(c, i, callable)));
      box.append(h('button', {
        onclick: () => { d.calls.push({ name: callable[0][0], args: '', print: false }); refresh(true); },
      }, '+ 호출 추가'));
    }
    return box;
  }

  function callItem(c, i, callable) {
    const isSetter = d.attrs.some((a) => a.name && a.setter && setterName(a.name) === c.name);
    const isGetter = d.attrs.some((a) => a.name && a.getter && getterName(a.name) === c.name);
    const m = d.methods.find((x) => x.name === c.name);
    const needArg = isSetter || (m && m.param.trim());
    const argLabel = isSetter
      ? `${(d.attrs.find((a) => setterName(a.name) === c.name) || {}).kor || ''} 새 값`
      : (m && m.param.trim() ? m.param.trim() : '인수');
    return h('div.item', {},
      h('div.row.center', {},
        select(callable, c.name, (v) => { c.name = v; refresh(true); }),
        needArg && h('div.field', {}, h('label', {}, argLabel),
          text(c.args, (v) => { c.args = v; refresh(); }, { class: 'code w-md', placeholder: '예) 10' })),
        checkbox('print( ) 로 감싸 결과 출력', !!c.print, (v) => { c.print = v; refresh(true); }),
        h('button.danger', { onclick: () => { d.calls.splice(i, 1); refresh(true); } }, '삭제')),
      isGetter && !c.print && h('p.hint.tight', {}, '접근자는 값을 돌려주기만 합니다. 화면에서 보려면 ',
        h('b', {}, 'print( ) 로 감싸기'), '를 켜세요.'));
  }

  /* [5] 저장 */
  function cardSave() {
    return h('section.card', {},
      h('h2', {}, h('span.step', {}, '5'), '저장하고 제출 준비하기'),
      h('p.hint', {}, '이 앱은 브라우저에 아무것도 저장하지 않습니다. 창을 닫으면 설계가 사라지니 ',
        h('b', {}, '코드를 복사하거나 .py 파일로 저장'), '해 두세요.'),
      h('div.btn-row', {},
        h('button', { onclick: () => app.sendToRun(generate(d, false).code, { from: '설계실' }) }, '▶ 실행해 보기'),
        h('button.ghost', {
          onclick: async () => {
            const okCopy = await copyText(generate(d, false).code);
            toast(okCopy ? 'IDLE 에 붙여 넣을 수 있도록 코드를 복사했습니다.' : '복사에 실패했습니다. 코드를 직접 선택해 복사해 주세요.');
          },
        }, '📋 코드 복사'),
        h('button.ghost', {
          onclick: () => {
            download(`${d.className || 'MyClass'}.py`, generate(d, false).code, 'text/x-python');
            toast('파이썬 파일(.py)로 저장했습니다.');
          },
        }, '💾 .py 파일로 저장'),
        h('button.soft', {
          onclick: () => {
            if (!confirm('설계를 모두 지우고 처음부터 다시 시작할까요?')) return;
            Object.assign(d, emptyDesign());
            refresh(true);
            toast('새로 시작합니다.');
          },
        }, '🗑 처음부터'),
      ),
      h('p.hint', {}, '수행평가는 컴퓨터실 IDLE 에서 직접 타이핑합니다. 이 앱은 ',
        h('b', {}, '설계와 연습'), '을 돕는 도구입니다. 손으로 쳐 보는 연습을 꼭 하세요.'));
  }

  /* ── 오른쪽: 코드 + 평가요소 ─────────────────────────────────────────── */
  function drawCode() {
    const { code } = generate(d, showMarks);
    codeBox.innerHTML = highlight(code);
  }

  function drawRubric() {
    rubricBox.textContent = '';

    /* 아직 클래스 이름조차 없으면 점수를 매기지 않는다.
       빈 설계에서 만들어지는 「class 클래스명」 견본에 점수가 붙으면
       아무것도 안 했는데 점수를 받은 것처럼 보이기 때문이다. */
    if (!d.className.trim()) {
      rubricBox.append(
        h('div.note.tip', {}, h('b', {}, '먼저'),
          '위 1번에서 클래스 이름을 정하면 평가요소 7가지를 하나씩 확인해 드립니다.'),
        h('ul.rubric', {}, RUBRIC_ITEMS.map((it) => h('li.fail', {},
          h('div.rb-mark', {}, '☐'),
          h('div', {},
            h('div.rb-title', {}, `${'①②③④⑤⑥⑦'[it.n - 1]} ${it.title}`),
            it.tips.map((t) => h('span.rb-tip', {}, `Tip ${t}`)))))),
      );
      return;
    }

    const { code } = generate(d, false);
    const g = grade(code);
    const scoreRow = SCORE_TABLE.find((r) => g.count >= r.min);
    rubricBox.append(
      h('div.score-head', {},
        h('div', {},
          h('div.score-num', {}, `평가요소 ${g.count} / 7`),
          h('div.score-note', {}, scoreRow.label)),
        h('div', { style: { marginLeft: 'auto', textAlign: 'right' } },
          h('div.score-big', {}, g.score === '기본점수' ? '기본점수' : `${g.score}점`),
          h('div.score-note', {}, '예상 점수 (참고용)'))),
    );

    if (!g.parsed) {
      rubricBox.append(h('div.note.err', {}, h('b', {}, '문법 오류'), g.parseError));
    }

    const ul = h('ul.rubric');
    g.items.forEach((it) => {
      ul.append(h('li', { class: it.pass ? 'pass' : 'fail' },
        /* 만족한 것은 체크된 상자, 못 한 것은 빈 상자 (교안 예제 탭과 같은 표시) */
        h('div.rb-mark', {}, it.pass ? '☑' : '☐'),
        h('div', {},
          h('div.rb-title', {}, `${'①②③④⑤⑥⑦'[it.n - 1]} ${it.title}`),
          it.detail && h('div.rb-detail', {}, it.detail),
          !it.pass && it.tips.map((t) => h('span.rb-tip', {}, `Tip ${t}`)))));
    });
    rubricBox.append(ul);

    if (g.notes.length) {
      const nb = h('div.notes');
      for (const n of g.notes) {
        nb.append(h('div.note', { class: n.level }, h('b', {}, n.level === 'warn' ? '확인' : '도움말'), n.text));
      }
      rubricBox.append(nb);
    }

    rubricBox.append(h('p.hint', {},
      '이 점수는 코드 모양만 보고 매긴 ', h('b', {}, '예상 점수'),
      '입니다. 실제 채점은 선생님이 하며, 평가요소 6가지 이상이면 20점입니다.'));
  }


  /* ── 보조 ────────────────────────────────────────────────────────────── */
  function swap(arr, i, j) { [arr[i], arr[j]] = [arr[j], arr[i]]; }

  /** 속성·메소드 이름이 바뀌면 호출 목록의 이름도 따라 고친다 */
  function syncCalls() { cleanCalls(); }

  /** 없어진 메소드를 가리키는 호출을 지운다 */
  function cleanCalls() {
    const valid = new Set([
      ...d.attrs.filter((a) => a.name && a.getter).map((a) => getterName(a.name)),
      ...d.attrs.filter((a) => a.name && a.setter).map((a) => setterName(a.name)),
      ...d.methods.filter((m) => m.name).map((m) => m.name),
    ]);
    d.calls = d.calls.filter((c) => valid.has(c.name));
  }

  /** 코드·평가요소만 다시 그린다. redrawForm 이 true 면 폼까지 다시 그린다. */
  function refresh(redrawForm = false) {
    if (redrawForm) drawForm();
    drawCode();
    drawRubric();
  }

  /* ── 처음 화면 ───────────────────────────────────────────────────────── */
  root.append(
    h('div.two-col', {},
      h('div', {}, formBox),
      h('div.sticky', {},
        h('section.card', {},
          h('div.code-bar', {},
            h('h2', { style: { margin: '0' } }, '📄 만들어진 파이썬 코드'),
            checkbox('평가요소 번호 보이기', showMarks, (v) => { showMarks = v; drawCode(); })),
          h('div.code-wrap', {}, codeBox),
          h('p.hint', {}, '들여쓰기는 스페이스 4칸입니다. IDLE 에 붙여 넣어도 그대로 실행됩니다.')),
        h('section.card', {},
          h('h2', {}, '✅ 평가요소 자동 확인'),
          rubricBox))),
  );

  drawForm();
  drawCode();
  drawRubric();

  return { refresh: () => refresh(true) };
}
