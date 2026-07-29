/* ============================================================================
 * codegen.js — 설계 내용을 파이썬 코드로 조립한다
 *
 * 학생이 설계실에서 채운 내용(design 객체)을 받아 교안·수행평가 예시와
 * 같은 모양의 파이썬 코드를 만들어 낸다. 들여쓰기는 스페이스 4칸이다.
 * ========================================================================== */

/** 빈 설계 하나 만들기 */
export function emptyDesign() {
  return {
    className: '',
    korName: '',
    attrs: [],
    methods: [],
    useStr: false,
    instName: '',
    calls: [],
  };
}

let seq = 1;
export const newId = () => `id${seq++}`;

/** 속성 하나 만들기 */
export function newAttr(over = {}) {
  return {
    id: newId(),
    name: '', kor: '', type: 'int', init: '0',
    fromParam: true,      // 생성자 매개변수로 받을지
    getter: true, setter: true,
    guard: 'none',        // 설정자의 유효성 검사: none | min | range | nonempty
    gmin: '0', gmax: '100',
    ...over,
  };
}

/** 메소드 하나 만들기 */
export function newMethod(over = {}) {
  return {
    id: newId(),
    name: '', kor: '', kind: 'inc',
    attr: '',             // 다룰 속성 이름
    param: '',            // 매개변수 이름 (빈칸이면 매개변수 없음)
    amount: '1',          // 고정으로 더하거나 뺄 값
    text: '',             // 함께 출력할 문구
    body: '',             // 직접 쓰기(custom)일 때의 본문
    ...over,
  };
}

/** 속성명 speed → getSpeed / setSpeed */
export const getterName = (attr) => `get${attr.charAt(0).toUpperCase()}${attr.slice(1)}`;
export const setterName = (attr) => `set${attr.charAt(0).toUpperCase()}${attr.slice(1)}`;

/** 자료형별 기본 초깃값 */
export const DEFAULT_INIT = { int: '0', float: '0.0', str: "''", bool: 'False', list: '[]' };

/** 메소드 동작 템플릿 목록 (설계실의 「무엇을 하는 메소드인가요?」) */
export const METHOD_KINDS = [
  { kind: 'inc', label: '속성값을 늘린다', desc: '예) 속력을 10 올린다, 점수를 더한다', needAttr: true, numeric: true },
  { kind: 'dec', label: '속성값을 줄인다', desc: '예) 배터리를 5 줄인다, 잔액을 출금한다', needAttr: true, numeric: true },
  { kind: 'print', label: '속성값을 문구와 함께 출력한다', desc: "예) print('현재 속력:', self.__speed)", needAttr: true },
  { kind: 'calc', label: '속성으로 계산해서 돌려준다', desc: '예) 넓이 = 가로 × 세로 를 return', needAttr: true, numeric: true },
  { kind: 'check', label: '조건을 검사해서 알려 준다', desc: '예) 배터리가 20 아래면 경고를 출력한다', needAttr: true, numeric: true },
  { kind: 'toggle', label: '참/거짓을 뒤집는다', desc: '예) 전원을 켜고 끈다 (bool 속성)', needAttr: true },
  { kind: 'reset', label: '초깃값으로 되돌린다', desc: '예) 점수를 0으로 초기화한다', needAttr: true },
  { kind: 'custom', label: '직접 쓴다', desc: '메소드 안의 코드를 직접 입력합니다', needAttr: false },
];

const IND = '    ';
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** 파이썬에서 문자열이 필요한 자리에 안전하게 값을 넣는다 */
function pyStr(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** 마지막 글자에 받침이 있는지 — 조사를 고르기 위해 쓴다 */
function hasJong(word) {
  const w = String(word).trim();
  if (!w) return false;
  const c = w.charCodeAt(w.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return false; // 한글이 아니면 받침 없다고 본다
  return (c - 0xac00) % 28 !== 0;
}
/** 조사 붙이기.  jo('속력', '은') → '속력은',  jo('배터리', '은') → '배터리는' */
function jo(word, kind) {
  const pair = { 은: ['은', '는'], 이: ['이', '가'], 을: ['을', '를'] }[kind];
  return `${word}${pair[hasJong(word) ? 0 : 1]}`;
}

/** 생성자 매개변수로 받을 속성들 */
export function ctorParams(design) {
  return design.attrs.filter((a) => a.fromParam && a.name);
}

/** 메소드 본문 한 개를 줄 배열로 만든다 */
function methodBody(m, design) {
  const at = design.attrs.find((a) => a.name === m.attr);
  const priv = at ? `self.__${at.name}` : 'self.__속성명';
  const kor = at && at.kor ? at.kor : m.attr || '속성';
  const p = m.param.trim();
  const amount = p || (m.amount === '' ? '1' : m.amount);
  const L = [];

  switch (m.kind) {
    case 'inc':
      L.push(`${priv} = ${priv} + ${amount}`);
      L.push(`print(${pyStr(`늘어난 ${kor}:`)}, ${priv})`);
      break;
    case 'dec':
      L.push(`${priv} = ${priv} - ${amount}`);
      L.push(`print(${pyStr(`줄어든 ${kor}:`)}, ${priv})`);
      break;
    case 'print':
      L.push(`print(${pyStr((m.text || `현재 ${kor}:`))}, ${priv})`);
      break;
    case 'calc': {
      const other = design.attrs.find((a) => a.name && a.name !== m.attr && ['int', 'float'].includes(a.type));
      const expr = other ? `${priv} * self.__${other.name}` : `${priv} * 2`;
      L.push(`result = ${expr}`);
      L.push('return result');
      break;
    }
    case 'check':
      L.push(`if ${priv} < ${amount} :`);
      L.push(`${IND}print(${pyStr(`${jo(kor, '이')} 부족합니다!`)})`);
      L.push('else :');
      L.push(`${IND}print(${pyStr(`${jo(kor, '은')} 넉넉합니다.`)})`);
      break;
    case 'toggle':
      L.push(`${priv} = not ${priv}`);
      L.push(`print(${pyStr(kor + ':')}, ${priv})`);
      break;
    case 'reset':
      L.push(`${priv} = ${at ? at.init || DEFAULT_INIT[at.type] : '0'}`);
      L.push(`print(${pyStr(`${jo(kor, '을')} 처음 상태로 되돌렸습니다`)})`);
      break;
    case 'custom': {
      const raw = (m.body || '').replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+$/, ''));
      const kept = raw.filter((l, i) => l.trim() !== '' || (i > 0 && i < raw.length - 1));
      if (!kept.length || kept.every((l) => !l.trim())) L.push('pass');
      else {
        // 학생이 붙여 넣은 코드의 공통 들여쓰기를 덜어 낸 뒤 다시 맞춘다
        const base = Math.min(...kept.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
        kept.forEach((l) => L.push(l.trim() ? l.slice(base) : ''));
      }
      break;
    }
    default:
      L.push('pass');
  }
  return L;
}

/** 설정자 본문 (유효성 검사 옵션 포함 — 교안 27쪽 「정보 은닉의 필요성」) */
function setterBody(a) {
  const priv = `self.__${a.name}`;
  const kor = a.kor || a.name;
  const p = a.name;
  if (a.guard === 'min') {
    return [
      `if ${p} < ${a.gmin} :`,
      `${IND}print(${pyStr(`${jo(kor, '은')} ${a.gmin} 보다 작을 수 없습니다`)})`,
      'else :',
      `${IND}${priv} = ${p}`,
    ];
  }
  if (a.guard === 'range') {
    return [
      `if ${p} < ${a.gmin} or ${p} > ${a.gmax} :`,
      `${IND}print(${pyStr(`${jo(kor, '은')} ${a.gmin} ~ ${a.gmax} 사이여야 합니다`)})`,
      'else :',
      `${IND}${priv} = ${p}`,
    ];
  }
  if (a.guard === 'nonempty') {
    return [
      `if ${p} == '' :`,
      `${IND}print(${pyStr(`${jo(kor, '은')} 비워 둘 수 없습니다`)})`,
      'else :',
      `${IND}${priv} = ${p}`,
    ];
  }
  return [`${priv} = ${p}`];
}

/**
 * 설계 → 파이썬 코드
 * @param {object} design
 * @param {boolean} withMarks  평가요소 번호를 주석으로 달지
 * @returns {{code: string, marks: object}} marks: 평가요소 번호 → 줄 번호(1부터)
 */
export function generate(design, withMarks = true) {
  const cls = design.className || '클래스명';
  const L = [];
  const marks = {};
  const mark = (n) => { if (!marks[n]) marks[n] = L.length + 1; };
  const tag = (n) => (withMarks ? `  # 평가요소 ${n}` : '');

  const attrs = design.attrs.filter((a) => a.name);
  const params = ctorParams(design);
  const usesRandom = design.methods.some((m) => m.kind === 'custom' && /random\./.test(m.body || ''));
  const usesMath = design.methods.some((m) => m.kind === 'custom' && /math\./.test(m.body || ''));
  if (usesRandom) L.push('import random');
  if (usesMath) L.push('import math');
  if (usesRandom || usesMath) L.push('');

  /* ── 클래스 정의 (평가요소 1) ── */
  mark(1);
  L.push(`class ${cls} :${tag(1)}`);

  /* ── 생성자 (평가요소 2) ── */
  mark(2);
  const plist = ['self', ...params.map((a) => a.name)].join(', ');
  L.push(`${IND}def __init__(${plist}) :${tag(2)}`);
  if (!attrs.length) {
    L.push(`${IND}${IND}pass    # 속성을 추가해 보세요`);
  } else {
    attrs.forEach((a) => {
      const value = a.fromParam ? a.name : (a.init || DEFAULT_INIT[a.type]);
      L.push(`${IND}${IND}self.__${a.name} = ${value}`);
    });
  }

  /* ── 접근자 (평가요소 3) ── */
  attrs.filter((a) => a.getter).forEach((a, i) => {
    L.push('');
    if (i === 0) mark(3);
    L.push(`${IND}def ${getterName(a.name)}(self) :${i === 0 ? tag(3) : ''}`);
    L.push(`${IND}${IND}return self.__${a.name}`);
  });

  /* ── 설정자 (평가요소 4) ── */
  attrs.filter((a) => a.setter).forEach((a, i) => {
    L.push('');
    if (i === 0) mark(4);
    L.push(`${IND}def ${setterName(a.name)}(self, ${a.name}) :${i === 0 ? tag(4) : ''}`);
    setterBody(a).forEach((l) => L.push(`${IND}${IND}${l}`));
  });

  /* ── 그 외 메소드 (평가요소 5) ── */
  design.methods.filter((m) => m.name).forEach((m, i) => {
    L.push('');
    if (i === 0) mark(5);
    const ps = ['self'];
    if (m.param.trim()) ps.push(m.param.trim());
    L.push(`${IND}def ${m.name}(${ps.join(', ')}) :${i === 0 ? tag(5) : ''}`);
    methodBody(m, design).forEach((l) => L.push(l ? `${IND}${IND}${l}` : ''));
  });

  /* ── 문자열 표현 메소드 (교안 34쪽) ── */
  if (design.useStr && attrs.length) {
    L.push('');
    if (!marks[5]) mark(5);
    L.push(`${IND}def __str__(self) :`);
    const parts = attrs.map((a) => (a.type === 'str' ? `self.__${a.name}` : `str(self.__${a.name})`));
    L.push(`${IND}${IND}return ${parts.join(" + ', ' + ")}`);
  }

  /* ── 인스턴스 생성 (평가요소 6) ── */
  const inst = design.instName || 'my' + cap(cls);
  L.push('');
  const args = params.map((a) => {
    const v = (a.ctorArg ?? '').trim();
    if (v) return v;
    return a.init || DEFAULT_INIT[a.type];
  });
  mark(6);
  L.push(`${inst} = ${cls}(${args.join(', ')})${tag(6)}`);

  /* ── 메소드 호출 (평가요소 7) ── */
  const calls = design.calls.filter((c) => c.name);
  calls.forEach((c, i) => {
    if (i === 0) mark(7);
    const a = (c.args || '').trim();
    if (c.print) L.push(`print(${inst}.${c.name}(${a}))${i === 0 ? tag(7) : ''}`);
    else L.push(`${inst}.${c.name}(${a})${i === 0 ? tag(7) : ''}`);
  });
  if (design.useStr && attrs.length) L.push(`print(${inst})`);

  return { code: L.join('\n'), marks };
}

/** 예시 메소드 이름과 속성 자료형을 보고 알맞은 동작 템플릿을 짐작한다 */
export function guessKind(attr, methodName) {
  const t = attr[2];
  const n = String(methodName).toLowerCase();
  if (/^calc/.test(n)) return 'calc';
  if (/^(print|show|report)/.test(n)) return 'print';
  if (/^(is|check)/.test(n)) return t === 'bool' ? 'toggle' : 'check';
  if (t === 'bool') return 'toggle';
  if (/^reset/.test(n)) return 'reset';
  /* 값을 줄이는 뜻의 낱말들 — 출금·사용·지불·판매·착륙 등 */
  if (/^(withdraw|pay|use|spend|sell|down|land|stop|drop|remove|dec|discount|volumedown)/.test(n)) return 'dec';
  if (t === 'str' || t === 'list') return 'print';
  return 'inc';
}

/** 클래스 예시(CLASS_IDEAS 의 한 항목) → 바로 쓸 수 있는 설계 */
export function designFromIdea(idea) {
  const d = emptyDesign();
  d.className = idea.en;
  d.korName = idea.ko;
  d.attrs = idea.attrs.map(([name, kor, type, init], i) => newAttr({
    name, kor, type, init,
    fromParam: i === 0,
    getter: true,
    setter: i === 0,
    guard: type === 'int' || type === 'float' ? 'min' : 'none',
    gmin: '0',
  }));
  /* 동작 템플릿에 맞는 속성을 골라 준다.
     숫자를 더하고 빼는 템플릿에 문자열 속성이 걸리면 실행할 때 오류가 나기 때문이다. */
  const numAttr = idea.attrs.find((a) => ['int', 'float'].includes(a[2]));
  const boolAttr = idea.attrs.find((a) => a[2] === 'bool');
  d.methods = idea.methods.slice(0, 1).map(([name, kor]) => {
    let kind = guessKind(idea.attrs[0], name);
    let target = idea.attrs[0];
    if (['inc', 'dec', 'calc', 'check'].includes(kind)) {
      if (numAttr) target = numAttr;
      else kind = 'print';                       // 숫자 속성이 없으면 출력으로 바꾼다
    } else if (kind === 'toggle') {
      if (boolAttr) target = boolAttr;
      else kind = 'print';
    }
    /* 늘리기·줄이기·검사하기는 매개변수를 받는 형태로 만들어 준다.
       매개변수 있는 메소드를 호출해 보는 것도 수행평가에 나오는 연습이다. */
    const takesParam = ['inc', 'dec', 'check'].includes(kind);
    return newMethod({
      name, kor, kind, attr: target[0],
      param: takesParam ? 'amount' : '', amount: '1',
    });
  });
  d.instName = 'my' + idea.en;
  d.useStr = false;
  const m0 = d.methods[0];
  d.calls = [
    // 계산해서 돌려주는 메소드는 print( ) 로 감싸야 결과가 화면에 보인다
    { name: m0.name, args: m0.param ? '10' : '', print: m0.kind === 'calc' },
    { name: getterName(idea.attrs[0][0]), args: '', print: true },
  ];
  return d;
}

/** 설계 → 설계지 5칸 요약 (인쇄·제출용) */
export function designSheet(design) {
  const attrs = design.attrs.filter((a) => a.name);
  const inst = design.instName || 'my' + cap(design.className || '클래스명');
  const methodNames = [
    '생성자(__init__)',
    ...attrs.filter((a) => a.getter).map((a) => `접근자(${getterName(a.name)})`),
    ...attrs.filter((a) => a.setter).map((a) => `설정자(${setterName(a.name)})`),
    ...design.methods.filter((m) => m.name).map((m) => `${m.name}${m.kor ? `(${m.kor})` : ''}`),
    ...(design.useStr && attrs.length ? ['문자열표현메소드(__str__)'] : []),
  ];
  const args = ctorParams(design).map((a) => (a.ctorArg ?? '').trim() || a.init || DEFAULT_INIT[a.type]);
  return {
    className: design.className || '(비어 있음)',
    attrs: attrs.length ? attrs.map((a) => `${a.kor ? a.kor + ' ' : ''}(__${a.name})`).join(', ') : '(비어 있음)',
    methods: methodNames.join(', '),
    create: `${inst} = ${design.className || '클래스명'}(${args.join(', ')})`,
    calls: design.calls.filter((c) => c.name).length
      ? design.calls.filter((c) => c.name).map((c) => `${c.print ? 'print(' : ''}${inst}.${c.name}(${(c.args || '').trim()})${c.print ? ')' : ''}`).join(', ')
      : '(비어 있음)',
  };
}
