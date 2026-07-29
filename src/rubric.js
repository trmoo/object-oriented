/* ============================================================================
 * rubric.js — 수행평가 평가요소 7가지를 코드에서 자동으로 확인한다
 *
 * 설계실이 만들어 준 코드뿐 아니라 학생이 손으로 고친 코드도 그대로 검사한다.
 * 그래서 겉모습(글자 맞추기)이 아니라 pymini 의 문법 나무(AST)를 읽는다.
 *
 * ※ 여기 나오는 점수는 「예상 점수」다. 실제 채점은 선생님이 한다.
 * ========================================================================== */

import { parse, PyError } from './pymini.js';
import { RUBRIC_ITEMS, SCORE_TABLE } from './data.js';

const PY_KEYWORDS = new Set(['class', 'def', 'return', 'if', 'else', 'elif', 'while', 'for', 'in',
  'not', 'and', 'or', 'pass', 'break', 'continue', 'import', 'from', 'True', 'False', 'None',
  'is', 'global', 'del', 'try', 'except', 'lambda', 'with', 'as', 'yield', 'print', 'str', 'int',
  'float', 'list', 'dict', 'self']);

/* ── 문법 나무를 훑는 작은 도구들 ─────────────────────────────────────────── */

/** 나무 아래의 모든 마디를 하나씩 넘겨 준다 */
function* walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const n of node) yield* walk(n); return; }
  if (node.type) yield node;
  for (const k of Object.keys(node)) {
    if (k === 'type' || k === 'line') continue;
    const v = node[k];
    if (v && typeof v === 'object') yield* walk(v);
  }
}

/** self.__무엇 형태인가? (비공개 속성 접근) */
function privAttr(n) {
  if (!n || n.type !== 'Attribute') return null;
  if (!n.obj || n.obj.type !== 'Name' || n.obj.id !== 'self') return null;
  const a = n.attr;
  if (a.startsWith('__') && !a.endsWith('__')) return a;
  return null;
}
/** self.무엇 형태인가? (공개 속성까지 포함) */
function anyAttr(n) {
  if (!n || n.type !== 'Attribute') return null;
  if (!n.obj || n.obj.type !== 'Name' || n.obj.id !== 'self') return null;
  return n.attr;
}

/** 메소드 안에서 쓰인 self 속성 이름 모음 */
function attrsUsed(fn) {
  const s = new Set();
  for (const n of walk(fn.body)) { const a = anyAttr(n); if (a) s.add(a); }
  return s;
}

/**
 * 코드를 읽어 평가요소 7가지를 채점한다.
 * @returns {{
 *   parsed: boolean, parseError: string,
 *   items: Array<{n, title, tips, pass, detail}>,
 *   count: number, score: string, scoreLabel: string,
 *   notes: Array<{level:'warn'|'tip', text:string}>,
 *   classNames: string[]
 * }}
 */
export function grade(src) {
  const items = RUBRIC_ITEMS.map((it) => ({ ...it, pass: false, detail: '' }));
  const notes = [];
  const set = (n, detail) => { items[n - 1].pass = true; items[n - 1].detail = detail; };
  const miss = (n, detail) => { if (!items[n - 1].pass) items[n - 1].detail = detail; };

  let ast;
  try {
    ast = parse(src || '');
  } catch (e) {
    return {
      parsed: false,
      parseError: e instanceof PyError ? e.format() : String(e.message || e),
      items, count: 0, ...scoreOf(0), notes: [{ level: 'warn', text: '문법 오류가 있어 평가요소를 확인할 수 없습니다. 먼저 오류를 고쳐 주세요.' }],
      classNames: [],
    };
  }

  /* ── 클래스 찾기 ── */
  const classes = ast.body.filter((s) => s.type === 'ClassDef');
  const classNames = classes.map((c) => c.name);

  if (!classes.length) {
    miss(1, 'class 로 시작하는 클래스 정의가 없습니다.');
    for (let n = 2; n <= 5; n++) miss(n, '먼저 클래스를 정의해야 합니다.');
  }

  // 여러 개면 메소드가 가장 많은 클래스를 기준으로 본다 (학생이 예제를 남겨 둔 경우 대비)
  const main = classes.slice().sort((a, b) =>
    b.body.filter((x) => x.type === 'FuncDef').length - a.body.filter((x) => x.type === 'FuncDef').length)[0];

  if (main) {
    set(1, `class ${main.name} 을(를) 찾았습니다.`);
    if (!/^[A-Z]/.test(main.name)) {
      notes.push({ level: 'warn', text: `클래스 이름 '${main.name}' 의 첫 문자를 대문자로 바꾸는 것이 좋습니다.` });
    }
    if (PY_KEYWORDS.has(main.name)) {
      notes.push({ level: 'warn', text: `'${main.name}' 은(는) 파이썬이 이미 쓰는 이름입니다. 다른 이름으로 바꿔 주세요.` });
    }
    if (classes.length > 1) {
      notes.push({ level: 'tip', text: `클래스가 ${classes.length} 개 있습니다. ${main.name} 을(를) 기준으로 검사했습니다.` });
    }

    const methods = main.body.filter((s) => s.type === 'FuncDef');
    const init = methods.find((m) => m.name === '__init__');

    /* ── 평가요소 2: 생성자 + 비공개 속성 ── */
    if (!init) {
      miss(2, 'def __init__(self) : 형태의 생성자가 없습니다.');
      const looksLikeInit = methods.find((m) => /^_*init_*$/.test(m.name) && m.name !== '__init__');
      if (looksLikeInit) notes.push({ level: 'warn', text: `'${looksLikeInit.name}' 은(는) 생성자로 인정되지 않습니다. 앞뒤로 밑줄 두 개씩 붙여 __init__ 으로 써 주세요.` });
    } else {
      const privSet = new Set();
      const openSet = new Set();
      for (const st of walk(init.body)) {
        if (st.type !== 'Assign') continue;
        for (const t of st.targets) {
          const p = privAttr(t);
          if (p) privSet.add(p);
          else { const a = anyAttr(t); if (a) openSet.add(a); }
        }
      }
      if (privSet.size) {
        set(2, `생성자에서 비공개 속성 ${[...privSet].join(', ')} 을(를) 초기화합니다.`);
      } else if (openSet.size) {
        miss(2, `속성 ${[...openSet].join(', ')} 이(가) 공개 속성입니다. 앞에 밑줄 두 개를 붙여 self.__${[...openSet][0]} 으로 만들어야 합니다.`);
        notes.push({ level: 'warn', text: `비공개 속성이 1개 이상 필요합니다. self.${[...openSet][0]} → self.__${[...openSet][0]} 로 고쳐 주세요.` });
        const single = [...openSet].find((a) => /^_[^_]/.test(a));
        if (single) notes.push({ level: 'warn', text: `밑줄이 한 개(self.${single})면 비공개가 되지 않습니다. 두 개여야 합니다.` });
      } else {
        miss(2, '생성자 안에서 self.__속성명 = 초깃값 형태로 속성을 초기화해 주세요.');
      }
      if (!init.params.length || init.params[0].name !== 'self') {
        notes.push({ level: 'warn', text: '생성자의 첫 매개변수는 반드시 self 여야 합니다.' });
      }
    }

    /* ── 평가요소 3·4: 접근자와 설정자 ──
     * 유의사항의 Tip 이 return self.__속성명 / self.__속성명 = 매개변수 이므로
     * 비공개 속성을 다룰 때만 인정한다. 공개 속성으로 쓴 경우는 따로 알려 준다. */
    const getters = [];
    const setters = [];
    const openGetters = [];
    const openSetters = [];
    for (const m of methods) {
      if (m.name === '__init__') continue;

      // 접근자: 몸통에 return self.속성 이 있다
      let isGetter = false, openGetter = null;
      for (const n of walk(m.body)) {
        if (n.type !== 'Return' || !n.value) continue;
        if (privAttr(n.value)) { isGetter = true; break; }
        const a = anyAttr(n.value);
        if (a) openGetter = a;
      }
      // 설정자: 매개변수를 받아 self.속성 = 그 매개변수
      // 「= 매개변수」로 곧바로 넣는 것만 설정자로 본다.
      // self.__speed = self.__speed + amount 처럼 계산이 끼면 그것은 일반 메소드다.
      let isSetter = false, openSetter = null;
      const pnames = new Set(m.params.slice(1).map((p) => p.name));
      const directParam = (v) => {
        if (!v) return false;
        if (v.type === 'Name') return pnames.has(v.id);
        // int(age) · str(name) 처럼 자료형만 바꿔 넣는 것도 설정자로 인정
        if (v.type === 'Call' && v.func.type === 'Name'
          && ['int', 'float', 'str', 'bool'].includes(v.func.id) && v.args.length === 1) {
          return directParam(v.args[0].value);
        }
        return false;
      };
      if (pnames.size) {
        for (const n of walk(m.body)) {
          if (n.type !== 'Assign') continue;
          const target = n.targets.find((t) => privAttr(t) || anyAttr(t));
          if (!target) continue;
          if (!directParam(n.value)) continue;
          if (privAttr(target)) { isSetter = true; break; }
          openSetter = anyAttr(target);
        }
      }
      if (isGetter && !isSetter) getters.push(m);
      else if (isSetter) setters.push(m);
      else if (openSetter) openSetters.push({ m, attr: openSetter });
      else if (openGetter) openGetters.push({ m, attr: openGetter });
    }

    if (getters.length) {
      set(3, `접근자 ${getters.map((g) => g.name + '( )').join(', ')} 을(를) 찾았습니다.`);
      const bad = getters.filter((g) => !/^get/i.test(g.name));
      if (bad.length) notes.push({ level: 'tip', text: `접근자 이름은 get속성명 형태를 권합니다. 예) ${bad[0].name} → get… (유의사항 Tip)` });
    } else if (openGetters.length) {
      const { m, attr } = openGetters[0];
      miss(3, `${m.name}( ) 이(가) return self.${attr} 로 공개 속성을 돌려줍니다. 속성을 self.__${attr} 로 바꾸면 접근자로 인정됩니다.`);
      notes.push({ level: 'warn', text: `${m.name}( ) 은(는) 접근자의 모양이지만 속성이 공개(self.${attr})입니다. 비공개(self.__${attr})로 바꿔 주세요.` });
    } else {
      miss(3, 'return self.__속성명 을 하는 메소드(접근자)가 필요합니다.');
    }

    if (setters.length) {
      set(4, `설정자 ${setters.map((s) => s.name + '( )').join(', ')} 을(를) 찾았습니다.`);
      const bad = setters.filter((s) => !/^set/i.test(s.name));
      if (bad.length) notes.push({ level: 'tip', text: `설정자 이름은 set속성명 형태를 권합니다. 예) ${bad[0].name} → set… (유의사항 Tip)` });
    } else if (openSetters.length) {
      const { m, attr } = openSetters[0];
      miss(4, `${m.name}( ) 이(가) self.${attr} 로 공개 속성에 값을 넣습니다. self.__${attr} 로 바꾸면 설정자로 인정됩니다.`);
      notes.push({ level: 'warn', text: `${m.name}( ) 은(는) 설정자의 모양이지만 속성이 공개(self.${attr})입니다. 비공개(self.__${attr})로 바꿔 주세요.` });
    } else {
      miss(4, 'def set속성명(self, 매개변수) : 안에서 self.__속성명 = 매개변수 를 하는 메소드가 필요합니다.');
    }

    /* ── 평가요소 5: 생성자·접근자·설정자 외의 메소드 (속성을 활용해야 함) ── */
    const used = new Set([...getters, ...setters].map((m) => m.name));
    const others = methods.filter((m) => m.name !== '__init__' && !used.has(m.name));
    const withAttr = others.filter((m) => attrsUsed(m).size > 0);
    if (withAttr.length) {
      set(5, `메소드 ${withAttr.map((m) => m.name + '( )').join(', ')} 이(가) 속성을 활용합니다.`);
    } else if (others.length) {
      miss(5, `메소드 ${others.map((m) => m.name + '( )').join(', ')} 이(가) 속성(self.__…)을 쓰지 않습니다.`);
      notes.push({ level: 'warn', text: `메소드 안에서 self.__속성명 을 활용해야 평가요소 5가 인정됩니다.` });
    } else {
      miss(5, '생성자·접근자·설정자 말고 다른 메소드가 1개 이상 필요합니다.');
    }

    /* ── self 를 빠뜨린 메소드 찾기 ── */
    const noSelf = methods.filter((m) => !m.params.length || m.params[0].name !== 'self');
    if (noSelf.length) {
      notes.push({ level: 'warn', text: `${noSelf.map((m) => m.name + '( )').join(', ')} 의 첫 매개변수가 self 가 아닙니다. 모든 메소드의 첫 매개변수는 self 입니다.` });
    }
  }

  /* ── 평가요소 6: 클래스 밖에서 인스턴스 생성 ── */
  const instVars = new Map(); // 변수 이름 → 클래스 이름
  const clsSet = new Set(classNames);
  for (const st of ast.body) {
    if (st.type !== 'Assign' || !st.value) continue;
    if (st.value.type !== 'Call' || st.value.func.type !== 'Name') continue;
    if (!clsSet.has(st.value.func.id)) continue;
    for (const t of st.targets) if (t.type === 'Name') instVars.set(t.id, st.value.func.id);
  }
  if (instVars.size) {
    const [name, cls] = [...instVars.entries()][0];
    set(6, `${name} = ${cls}( ) — 인스턴스를 변수에 저장했습니다.`);
  } else {
    const anyCall = ast.body.some((s) => s.type === 'Expr' && s.value.type === 'Call' && s.value.func.type === 'Name' && clsSet.has(s.value.func.id));
    miss(6, anyCall
      ? '클래스를 호출했지만 변수에 담지 않았습니다. 인스턴스명 = 클래스명() 형태로 저장해 주세요.'
      : '클래스 정의 아래에 인스턴스명 = 클래스명() 을 써서 객체를 만들어 주세요.');
  }

  /* ── 평가요소 7: 인스턴스의 메소드 호출 ── */
  const calls = [];
  for (const st of ast.body) {
    if (st.type === 'ClassDef' || st.type === 'FuncDef') continue;
    for (const n of walk(st)) {
      if (n.type !== 'Call' || !n.func || n.func.type !== 'Attribute') continue;
      const obj = n.func.obj;
      if (obj.type === 'Name' && instVars.has(obj.id)) calls.push(`${obj.id}.${n.func.attr}( )`);
    }
  }
  if (calls.length) {
    set(7, `${[...new Set(calls)].slice(0, 4).join(', ')} — 메소드를 호출했습니다.`);
  } else {
    const attrOnly = ast.body.some((st) => [...walk(st)].some((n) =>
      n.type === 'Attribute' && n.obj.type === 'Name' && instVars.has(n.obj.id)));
    miss(7, attrOnly
      ? '속성만 꺼내 썼습니다. 인스턴스명.메소드명() 처럼 괄호를 붙여 메소드를 호출해 주세요.'
      : '인스턴스명.메소드명() 형태로 메소드를 한 번 이상 호출해 주세요.');
  }

  const count = items.filter((i) => i.pass).length;
  return { parsed: true, parseError: '', items, count, ...scoreOf(count), notes, classNames };
}

function scoreOf(count) {
  const row = SCORE_TABLE.find((r) => count >= r.min);
  return { score: row.score, scoreLabel: row.label };
}
