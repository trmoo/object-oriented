/* 코드 생성기 + 평가요소 자동 검사 점검
 * 실행: node test/rubric.test.mjs
 */
import { grade } from '../src/rubric.js';
import { emptyDesign, newAttr, newMethod, generate, designSheet, designFromIdea } from '../src/codegen.js';
import { runPython } from '../src/pymini.js';
import { EXAMPLES, CLASS_IDEAS, ASSEMBLE } from '../src/data.js';

let pass = 0, fail = 0;
const ok = (name) => { pass++; console.log(`  ok  ${name}`); };
const no = (name, extra) => { fail++; console.log(`FAIL  ${name}${extra ? '\n      ' + extra : ''}`); };

function expectItems(name, src, want) {
  const g = grade(src);
  const got = g.items.filter((i) => i.pass).map((i) => i.n);
  if (JSON.stringify(got) === JSON.stringify(want)) ok(`${name} → 평가요소 ${got.join(',') || '없음'} (${g.score}점)`);
  else no(name, `기대 ${JSON.stringify(want)} / 실제 ${JSON.stringify(got)}\n      ${g.items.filter((i) => !i.pass).map((i) => i.n + ': ' + i.detail).join('\n      ')}`);
}

console.log('\n── 설계실이 만든 코드는 평가요소 7개를 모두 만족해야 한다 ──');
{
  const d = emptyDesign();
  d.className = 'Car';
  d.korName = '자동차';
  d.attrs = [
    newAttr({ name: 'speed', kor: '속력', type: 'int', init: '0', fromParam: true, getter: true, setter: true, guard: 'min', gmin: '0' }),
    newAttr({ name: 'color', kor: '색상', type: 'str', init: "'red'", fromParam: true, getter: true, setter: false }),
  ];
  d.methods = [newMethod({ name: 'accel', kor: '가속하기', kind: 'inc', attr: 'speed', param: 'amount' })];
  d.useStr = true;
  d.instName = 'myCar';
  d.calls = [{ name: 'accel', args: '10' }, { name: 'getSpeed', args: '', print: true }];
  const { code, marks } = generate(d);
  console.log('\n' + code + '\n');

  const g = grade(code);
  if (g.count === 7) ok('평가요소 7/7');
  else no('평가요소 7/7', g.items.filter((i) => !i.pass).map((i) => i.n + ': ' + i.detail).join(' | '));
  if (g.score === '20') ok('예상 점수 20'); else no('예상 점수 20 → ' + g.score);
  if (!g.notes.some((n) => n.level === 'warn')) ok('경고 없음');
  else no('경고 없음', g.notes.map((n) => n.text).join(' | '));

  const r = runPython(code);
  if (r.ok) ok('생성된 코드가 실제로 실행됨\n      출력: ' + r.output.split('\n').join(' / '));
  else no('생성된 코드 실행', r.error);

  if ([1, 2, 3, 4, 5, 6, 7].every((n) => marks[n] > 0)) ok('평가요소 줄 표시(marks) 모두 있음');
  else no('marks', JSON.stringify(marks));

  const s = designSheet(d);
  if (s.className === 'Car' && s.attrs.includes('__speed') && s.create.includes('myCar = Car(')) ok('설계지 요약');
  else no('설계지 요약', JSON.stringify(s));
}

console.log('── 설정자 유효성 검사가 실제로 잘못된 값을 막는지 ──');
{
  const d = emptyDesign();
  d.className = 'Person';
  d.attrs = [newAttr({ name: 'age', kor: '나이', type: 'int', init: '0', fromParam: false, getter: true, setter: true, guard: 'min', gmin: '0' })];
  d.methods = [newMethod({ name: 'printAge', kor: '나이 출력', kind: 'print', attr: 'age', text: '나이:' })];
  d.instName = 'p';
  d.calls = [{ name: 'setAge', args: '-5' }, { name: 'setAge', args: '17' }, { name: 'printAge', args: '' }];
  const { code } = generate(d);
  const r = runPython(code);
  // 조사가 받침에 맞게 골라지는지도 함께 확인한다 ('나이' → 는)
  const want = '나이는 0 보다 작을 수 없습니다\n나이: 17';
  if (r.ok && r.output === want) ok('음수 나이를 막고 17만 통과');
  else no('설정자 유효성 검사', (r.ok ? r.output : r.error) + '\n' + code);
}

console.log('\n── 메소드 동작 템플릿 8종이 모두 실행되는지 ──');
{
  const kinds = ['inc', 'dec', 'print', 'calc', 'check', 'toggle', 'reset', 'custom'];
  let bad = 0;
  for (const kind of kinds) {
    const d = emptyDesign();
    d.className = 'Test';
    d.attrs = [
      newAttr({ name: 'num', kor: '숫자', type: 'int', init: '10', fromParam: false }),
      newAttr({ name: 'flag', kor: '켜짐', type: 'bool', init: 'False', fromParam: false }),
    ];
    d.methods = [newMethod({
      name: 'act', kor: '동작', kind, attr: kind === 'toggle' ? 'flag' : 'num',
      param: '', amount: '3', text: '지금:',
      body: kind === 'custom' ? "print('직접 쓴 코드')\nself.__num = self.__num * 2\nprint(self.__num)" : '',
    })];
    d.instName = 't';
    d.calls = [{ name: 'act', args: '' }];
    const { code } = generate(d);
    const r = runPython(code);
    const g = grade(code);
    if (!r.ok) { no(`템플릿 ${kind} 실행`, r.error + '\n' + code); bad++; }
    else if (!g.items[4].pass) { no(`템플릿 ${kind} 평가요소5`, g.items[4].detail + '\n' + code); bad++; }
  }
  if (!bad) ok('템플릿 8종 실행 + 평가요소 5 인정');
}

console.log('\n── 교안 예제를 평가요소로 채점하면? ──');
// Dice 는 self.value 를 공개로 쓰므로 비공개 속성(요소2)과 접근자(요소3)로 인정되지 않는다
expectItems('Dice (교안 17쪽, 공개 속성)', EXAMPLES[0].code, [1, 5, 6, 7]);
{
  const g = grade(EXAMPLES[0].code);
  const w = g.notes.filter((n) => n.level === 'warn').map((n) => n.text).join(' ');
  if (g.items[2].detail.includes('self.__value') && w.includes('get_value')) ok('공개 속성 접근자에 고칠 방법을 알려 줌');
  else no('공개 접근자 안내', g.items[2].detail + ' | ' + w);
}
expectItems('Person 공개 속성 (교안 28쪽)', EXAMPLES[1].code, [1, 6]);
expectItems('Person 접근자·설정자 (교안 30쪽)', EXAMPLES[2].code, [1, 2, 3, 4, 6, 7]);
expectItems('BankAccount (교안 32쪽)', EXAMPLES[3].code, [1, 2, 3, 5, 6, 7]);
expectItems('Circle (교안 33쪽)', EXAMPLES[4].code, [1, 2, 4, 5, 6, 7]);
expectItems('Car (교안 34쪽)', EXAMPLES[5].code, [1, 2, 4, 5, 6, 7]);

console.log('\n── 흔한 실수를 잡아내는지 ──');
{
  const g = grade(`class car :
    def __init__(self) :
        self.speed = 0
    def getSpeed(self) :
        return self.speed
c = car()
print(c.getSpeed())`);
  const w = g.notes.filter((n) => n.level === 'warn').map((n) => n.text).join(' ');
  if (w.includes('대문자')) ok('클래스명 소문자 경고'); else no('클래스명 소문자 경고', w);
  if (w.includes('__speed')) ok('공개 속성 → 비공개 안내'); else no('공개 속성 안내', w);
  if (!g.items[1].pass) ok('공개 속성은 평가요소 2 불인정'); else no('평가요소 2 가 잘못 통과함');
}
{
  const g = grade(`class Car :
    def __init__() :
        self.__speed = 0
    def getSpeed() :
        return self.__speed`);
  const w = g.notes.map((n) => n.text).join(' ');
  if (w.includes('self')) ok('self 누락 경고'); else no('self 누락 경고', w);
}
{
  const g = grade(`class Car :
    def init(self) :
        self.__speed = 0`);
  const w = g.notes.map((n) => n.text).join(' ');
  if (w.includes('__init__')) ok('생성자 이름 오타 안내'); else no('생성자 이름 오타 안내', w);
}
{
  const g = grade(`class Car :
    def __init__(self) :
        self._speed = 0`);
  const w = g.notes.map((n) => n.text).join(' ');
  if (w.includes('밑줄이 한 개')) ok('밑줄 한 개 안내'); else no('밑줄 한 개 안내', w);
}
{
  const g = grade(`class Car :
    def __init__(self) :
        self.__speed = 0
    def getSpeed(self) :
        return self.__speed
Car()`);
  if (!g.items[5].pass && g.items[5].detail.includes('변수에 담지')) ok('변수에 안 담은 인스턴스 안내');
  else no('변수에 안 담은 인스턴스 안내', g.items[5].detail);
}
{
  const g = grade(`class Car :
    def __init__(self) :
        self.speed = 0
c = Car()
print(c.speed)`);
  if (!g.items[6].pass && g.items[6].detail.includes('괄호')) ok('속성만 꺼내 쓴 경우 안내');
  else no('속성만 꺼내 쓴 경우 안내', g.items[6].detail);
}
{
  const g = grade('class Car :\n  def __init__(self)\n    pass');
  if (!g.parsed && g.parseError.includes('콜론')) ok('문법 오류일 때 안내');
  else no('문법 오류 안내', g.parseError);
}
{
  const g = grade('');
  if (g.count === 0 && g.score === '기본점수') ok('빈 코드 → 기본점수');
  else no('빈 코드', `${g.count} / ${g.score}`);
}
{
  // 예약어를 클래스 이름으로
  const g = grade('class Print :\n    def __init__(self) :\n        self.__x = 0');
  if (g.items[0].pass) ok('예약어가 아닌 이름은 통과'); else no('Print 클래스', g.items[0].detail);
}

console.log('\n── 점수 구간이 배점표와 맞는지 ──');
{
  const cases = [
    ['요소 1개만', 'class Car :\n    def __init__(self) :\n        pass', '10'],
    ['요소 2개', 'class Car :\n    def __init__(self) :\n        self.__x = 0', '12'],
  ];
  let bad = 0;
  for (const [name, src, want] of cases) {
    const g = grade(src);
    if (g.score !== want) { no(`${name} → ${want}점`, `실제 ${g.score}점 (요소 ${g.count}개)`); bad++; }
  }
  if (!bad) ok('배점표 대응');
}

console.log('\n── 클래스 예시 49개를 모두 골라 봤을 때 ──');
{
  const bad = [];
  for (const idea of CLASS_IDEAS) {
    const d = designFromIdea(idea);
    const { code } = generate(d, false);
    const r = runPython(code);
    const g = grade(code);
    if (!r.ok) bad.push(`${idea.en} 실행실패: ${r.error.split('\n')[0]}`);
    else if (g.count !== 7) bad.push(`${idea.en} 평가요소 ${g.count}/7: ${g.items.filter((i) => !i.pass).map((i) => i.n).join(',')}번 미달`);
    else if (g.notes.some((n) => n.level === 'warn')) bad.push(`${idea.en} 경고: ${g.notes.filter((n) => n.level === 'warn')[0].text}`);
  }
  if (!bad.length) ok(`예시 49개 전부 → 실행 성공 + 평가요소 7/7 + 경고 없음`);
  else no('예시 49개 점검', bad.join('\n      '));
}
{
  // 줄이는 뜻의 메소드가 'dec' 로 잡히는지
  const atm = CLASS_IDEAS.find((c) => c.en === 'ATM');
  const code = generate(designFromIdea(atm), false).code;
  if (code.includes('self.__cash - amount') && code.includes('줄어든')) ok('ATM.withdraw → 값을 줄이는 메소드로 인식');
  else no('withdraw 판단', code);
  const gc = CLASS_IDEAS.find((c) => c.en === 'GameCharacter');
  const code2 = generate(designFromIdea(gc), false).code;
  if (code2.includes('self.__hp + amount')) ok('GameCharacter.attack → 값을 늘리는 메소드로 인식');
  else no('attack 판단', code2);
}

console.log('\n── 자료 파일 점검 ──');
{
  if (CLASS_IDEAS.length === 49) ok(`클래스 예시 ${CLASS_IDEAS.length}개`);
  else no('클래스 예시 개수', String(CLASS_IDEAS.length));
  const dup = CLASS_IDEAS.map((c) => c.en).filter((v, i, a) => a.indexOf(v) !== i);
  if (!dup.length) ok('클래스 예시 중복 없음'); else no('중복', dup.join(','));
  const badInit = CLASS_IDEAS.filter((c) => c.attrs.some(([n, k, t, init]) => {
    const r = runPython(`x = ${init}`);
    return !r.ok;
  }));
  if (!badInit.length) ok('모든 예시 초깃값이 올바른 파이썬 값');
  else no('예시 초깃값', badInit.map((c) => c.en).join(','));
}
{
  // 조립 문제의 정답 순서가 실제로 실행되는지
  let bad = 0;
  for (const p of ASSEMBLE) {
    const code = p.lines.map(([ind, t]) => '    '.repeat(ind) + t).join('\n');
    const r = runPython(code);
    if (!r.ok) { no(`조립 문제 ${p.id} 정답 실행`, r.error + '\n' + code); bad++; }
  }
  if (!bad) ok('조립 문제 3개의 정답 코드가 모두 실행됨');
}
{
  // 교안 예제 6개가 모두 실행되는지 (오류 예제는 오류가 나야 함)
  let bad = 0;
  for (const ex of EXAMPLES) {
    const r = runPython(ex.code);
    if (!r.ok) { no(`예제 ${ex.id} 실행`, r.error); bad++; }
  }
  if (!bad) ok('교안 예제 6개 모두 실행됨');
  const circle = runPython(EXAMPLES[4].code);
  if (circle.output.includes('넓이: None')) ok('Circle 의 return 누락이 None 으로 드러남');
  else no('Circle None', circle.output);
  const fixed = runPython(EXAMPLES[4].code.replace('        area = math.pi * self.__radius ** 2', '        area = math.pi * self.__radius ** 2\n        return area'));
  if (fixed.output.includes('314.1592653589793')) ok('return area 를 넣으면 넓이가 나온다');
  else no('Circle 수정', fixed.ok ? fixed.output : fixed.error);
}

console.log(`\n결과: ${pass}개 통과, ${fail}개 실패\n`);
process.exit(fail ? 1 : 0);
