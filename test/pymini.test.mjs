/* 미니 파이썬 해석기 자체 점검 — 교안(객체 지향 프로그래밍) 예제 기준
 * 실행: node test/pymini.test.mjs
 */
import { runPython, parse } from '../src/pymini.js';

let pass = 0, fail = 0;

function eq(name, src, expected, opts) {
  const r = runPython(src, opts);
  const got = r.ok ? r.output : `ERR<${r.error}>`;
  if (got.trim() === expected.trim()) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      기대: ${JSON.stringify(expected)}\n      실제: ${JSON.stringify(got)}`); }
}
function errLike(name, src, needle) {
  const r = runPython(src);
  if (r.ok) { fail++; console.log(`FAIL  ${name} — 오류가 나야 하는데 정상 실행됨: ${r.output}`); return; }
  if (r.error.includes(needle)) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n      기대 포함: ${needle}\n      실제: ${r.error}`); }
}

console.log('\n── 교안 p.17~18 Dice ──');
const dice = `
import random
class Dice :
    def __init__(self) :
        self.value = 0
    def roll(self) :
        self.value = random.randint(1, 6)
    def get_value(self) :
        return self.value

dice1 = Dice()
dice2 = Dice()

dice1.roll()
dice2.roll()

print('주사위1 값:', dice1.get_value())
print('주사위2 값:', dice2.value)
`;
{
  const r = runPython(dice);
  const good = r.ok && /^주사위1 값: [1-6]\n주사위2 값: [1-6]$/.test(r.output);
  if (good) { pass++; console.log('  ok  Dice 실행'); } else { fail++; console.log('FAIL  Dice 실행 →', r.ok ? r.output : r.error); }
  const two = r.instances.length === 2 && r.instances[0].names[0] === 'dice1';
  if (two) { pass++; console.log('  ok  인스턴스 2개 추적'); } else { fail++; console.log('FAIL  인스턴스 추적', JSON.stringify(r.instances)); }
}

console.log('\n── 교안 p.30 Person (접근자·설정자) ──');
eq('Person getter/setter', `
class Person :
    def __init__(self) :
        self.__name = " "
        self.__age = 0
    def getName(self) :
        return self.__name
    def getAge(self) :
        return self.__age
    def setName(self, name) :
        self.__name = name
    def setAge(self, age) :
        self.__age = age

s = Person()
print(type(s))
print(s.getName())
print(s.getAge())
s.setName("향이")
s.setAge(17)
print(s.getName())
print(s.getAge())
`, `<class '__main__.Person'>\n \n0\n향이\n17`);

console.log('\n── 교안 p.32 BankAccount ──');
eq('BankAccount', `
class BankAccount :
    def __init__(self) :
        self.__balance = 0
    def getBalance(self) :
        return self.__balance
    def withdraw(self, amount) :
        self.__balance -= amount
        print('통장에', amount, '가 출금되었음')
    def deposit(self, amount) :
        self.__balance += amount
        print('통장에', amount, '가 입금되었음')

a = BankAccount()
a.deposit(100)
a.withdraw(10)
print(a.getBalance())
`, `통장에 100 가 입금되었음\n통장에 10 가 출금되었음\n90`);

console.log('\n── 교안 p.33 Circle (return 있는 올바른 형태) ──');
eq('Circle', `
import math
class Circle :
    def __init__(self, radius) :
        self.__radius = radius
    def setRadius(self, r) :
        self.__radius = r
    def calcArea(self) :
        area = math.pi * self.__radius ** 2
        return area
    def calcCircum(self) :
        circum = 2.0 * math.pi * self.__radius
        return circum

c = Circle(10)
print('원의 넓이:', c.calcArea())
print('원의 둘레:', c.calcCircum())
`, `원의 넓이: 314.1592653589793\n원의 둘레: 62.83185307179586`);

console.log('\n── 교안 p.33 Circle 의 return 누락 (교안 지적 사항) ──');
eq('Circle return 누락 → None', `
import math
class Circle :
    def __init__(self, radius) :
        self.__radius = radius
    def calcArea(self) :
        area = math.pi * self.__radius ** 2

c = Circle(10)
print('원의 넓이:', c.calcArea())
`, `원의 넓이: None`);

console.log('\n── 교안 p.34 Car (__str__) ──');
eq('Car __str__', `
class Car :
    def __init__(self, speed, color) :
        self.__speed = speed
        self.__color = color
    def setSpeed(self, speed) :
        self.__speed = speed
    def setColor(self, color) :
        self.__color = color
    def __str__(self) :
        return str(self.__speed) + ", " + str(self.__color)

myCar = Car(0, 'red')
myCar.setSpeed(100)
print(myCar)
`, `100, red`);

console.log('\n── 교안 p.34 __str__ 가 문자열을 반환하지 않을 때 ──');
errLike('__str__ 비문자열', `
class Car :
    def __init__(self, speed) :
        self.__speed = speed
    def __str__(self) :
        return self.__speed

myCar = Car(100)
print(myCar)
`, '__str__');

console.log('\n── 교안 p.28 정보 은닉 없이 (공개 속성) ──');
eq('공개 속성 직접 수정', `
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

p = Person("Seungbeom", 18)
print(p.name)
print(p.age)
p.age = -5
print(p.age)
`, `Seungbeom\n18\n-5`);

console.log('\n── 정보 은닉: 비공개 속성 직접 접근 → AttributeError ──');
errLike('비공개 속성 차단', `
class Person:
    def __init__(self):
        self.__age = 18
    def getAge(self):
        return self.__age

p = Person()
print(p.__age)
`, "has no attribute '__age'");
{
  const r = runPython(`
class Person:
    def __init__(self):
        self.__age = 18
p = Person()
print(p.__age)
`);
  if (!r.ok && r.error.includes('접근자')) { pass++; console.log('  ok  비공개 속성 안내문에 접근자 설명 포함'); }
  else { fail++; console.log('FAIL  안내문 →', r.error); }
}

console.log('\n── 이름 맹글링이 실제 저장 키에 반영되는지 ──');
{
  const r = runPython(`
class Car :
    def __init__(self) :
        self.__speed = 0
c = Car()
`);
  const a = r.instances[0].attrs[0];
  if (a.name === '__speed' && a.private) { pass++; console.log('  ok  비공개 속성 표시'); }
  else { fail++; console.log('FAIL  속성 표시', JSON.stringify(r.instances[0].attrs)); }
}

console.log('\n── 설정자 유효성 검사 (교안 p.27 나이 음수 거부) ──');
eq('setter 유효성 검사', `
class Person :
    def __init__(self) :
        self.__age = 0
    def getAge(self) :
        return self.__age
    def setAge(self, age) :
        if age < 0 :
            print('나이는 음수가 될 수 없습니다')
        else :
            self.__age = age

p = Person()
p.setAge(-5)
print(p.getAge())
p.setAge(17)
print(p.getAge())
`, `나이는 음수가 될 수 없습니다\n0\n17`);

console.log('\n── 파이썬 문법 기본기 ──');
eq('정수/실수 출력 구분', 'print(5)\nprint(5.0)\nprint(10/2)\nprint(10//3)\nprint(7%3)\nprint(2**10)', '5\n5.0\n5.0\n3\n1\n1024');
eq('음수 나머지', 'print(-7 % 3)\nprint(-7 // 3)', '2\n-3');
eq('거듭제곱 우선순위', 'print(-2**2)\nprint(2**-1)', '-4\n0.5');
eq('문자열 연산', "print('가' * 3)\nprint('a' + 'b')\nprint(len('안녕'))\nprint('Hi'.upper())\nprint('banana'.count('a'))", '가가가\nab\n2\nHI\n3');
eq('리스트', 'a = [3, 1, 2]\na.append(9)\na.sort()\nprint(a)\nprint(a[0], a[-1], len(a))', '[1, 2, 3, 9]\n1 9 4');
eq('비교 연쇄', 'print(1 < 2 < 3)\nprint(1 < 3 < 2)', 'True\nFalse');
eq('불리언·None', 'print(True, False, None)\nprint(not True)\nprint(3 > 1 and 2 > 5)', 'True False None\nFalse\nFalse');
eq('for/range', 's = 0\nfor i in range(1, 6) :\n    s += i\nprint(s)', '15');
eq('while/break', 'i = 0\nwhile True :\n    i += 1\n    if i >= 3 :\n        break\nprint(i)', '3');
eq('if/elif/else', "x = 85\nif x >= 90 :\n    print('A')\nelif x >= 80 :\n    print('B')\nelse :\n    print('C')", 'B');
eq('f-string', "name = '향이'\nage = 17\nprint(f'{name}는 {age}살')", '향이는 17살');
eq('print sep/end', "print('a', 'b', sep='-')\nprint('x', end='')\nprint('y')", 'a-b\nxy');
eq('한 줄 블록', "if True : print('ok')", 'ok');
eq('메소드가 메소드 부르기', `
class Counter :
    def __init__(self) :
        self.__n = 0
    def up(self) :
        self.__n += 1
    def upTwice(self) :
        self.up()
        self.up()
    def getN(self) :
        return self.__n
c = Counter()
c.upTwice()
print(c.getN())
`, '2');
eq('생성자 기본값', `
class Dog :
    def __init__(self, name = '멍멍이') :
        self.__name = name
    def getName(self) :
        return self.__name
print(Dog().getName())
print(Dog('바둑이').getName())
`, '멍멍이\n바둑이');
eq('키워드 인수', `
class P :
    def __init__(self, a, b) :
        self.__a = a
        self.__b = b
    def show(self) :
        print(self.__a, self.__b)
P(b = 2, a = 1).show()
`, '1 2');
eq('입력값 미리 넣기', "n = int(input('숫자: '))\nprint(n * 2)", '숫자: 10', { inputs: ['5'] });
eq('교안식 스마트 따옴표', "print(‘hello’)", 'hello');

console.log('\n── 친절한 오류 메시지 ──');
errLike('들여쓰기 없음', 'class A :\nprint(1)', '들여');
errLike('콜론 빠짐', 'class A\n    pass', '콜론');
errLike('없는 이름', 'print(abc)', "'abc' 이(가) 정의되지 않았습니다");
errLike('문자열+숫자', "print('점수' + 3)", 'str( )');
errLike('0으로 나눗셈', 'print(1/0)', '0으로는 나눌 수 없습니다');
errLike('무한 루프 차단', 'while True :\n    x = 1', '너무 오래');
errLike('매개변수 개수', `
class A :
    def m(self, x) :
        return x
A().m()
`, '개수가 맞지 않습니다');
errLike('없는 메소드', `
class A :
    def __init__(self) :
        self.__x = 1
A().nope()
`, "has no attribute 'nope'");
errLike('지원 안 하는 모듈', 'import turtle', 'turtle');

console.log('\n── 교안 범위를 넘는 문법은 무엇이 안 되는지 이름을 대어 알려 준다 ──');
// 상속을 조용히 무시하면 물려받은 메소드를 부를 때 엉뚱한 AttributeError 가 나서 학생이 헤맨다
errLike('상속은 분명히 안내', `
class Animal :
    def speak(self) :
        print('소리')
class Dog(Animal) :
    def __init__(self) :
        self.__kind = '진돗개'
d = Dog()
d.speak()
`, '상속은 이 앱에서 지원하지 않습니다');
{
  const r = runPython(`class Dog(Animal) :\n    pass`);
  if (!r.ok && r.error.includes('class Dog : 로 쓰세요')) { pass++; console.log('  ok  상속 안내에 고치는 방법 포함'); }
  else { fail++; console.log('FAIL  상속 안내 문구 →', r.ok ? '오류가 안 남' : r.error); }
}
eq('class Foo(object) : 는 통과시킨다', `
class Dice(object) :
    def __init__(self) :
        self.__v = 3
    def getV(self) :
        return self.__v
print(Dice().getV())
`, '3');
errLike('try/except 안내', 'try :\n    x = 1\nexcept :\n    pass', '예외 처리(try / except)');
errLike('try/except 안내에 대안 제시', 'try :\n    x = 1\nexcept :\n    pass', 'if 문으로 값을 미리 검사');
errLike('lambda 안내', 'f = lambda x : x + 1', 'lambda 를 지원하지 않습니다');
errLike('with 안내', "with open('a') as f :\n    pass", 'with 문');
errLike('raise 안내', "raise ValueError('x')", 'raise');
// 속성·메소드 이름으로 쓰인 경우는 막지 않아야 한다
eq('with·try 를 이름의 일부로 쓰는 것은 허용', `
class A :
    def __init__(self) :
        self.__withdrawn = 0
    def withdraw(self, n) :
        self.__withdrawn = self.__withdrawn + n
        return self.__withdrawn
a = A()
print(a.withdraw(5))
`, '5');
errLike('속성인데 괄호 붙임', `
class A :
    def __init__(self) :
        self.x = 5
a = A()
print(a.x())
`, '괄호');

console.log('\n── 메소드 호출 기록 (속성 변화 추적) ──');
{
  const r = runPython(`
class Car :
    def __init__(self, speed) :
        self.__speed = speed
    def setSpeed(self, speed) :
        self.__speed = speed
myCar = Car(0)
myCar.setSpeed(100)
`);
  const t = r.trace.find((x) => x.method === 'setSpeed');
  const ok = t && t.changes.length === 1 && t.changes[0].attr === '__speed' && t.changes[0].before === '0' && t.changes[0].after === '100';
  if (ok) { pass++; console.log('  ok  setSpeed 의 속성 변화 기록'); }
  else { fail++; console.log('FAIL  호출 기록', JSON.stringify(r.trace, null, 1)); }
}

console.log('\n── 파서 재사용 (평가요소 검사용 AST) ──');
{
  const ast = parse('class A :\n    def __init__(self) :\n        self.__x = 1');
  const ok = ast.body[0].type === 'ClassDef' && ast.body[0].body[0].type === 'FuncDef';
  if (ok) { pass++; console.log('  ok  AST 구조'); } else { fail++; console.log('FAIL  AST', JSON.stringify(ast)); }
}

console.log(`\n결과: ${pass}개 통과, ${fail}개 실패\n`);
process.exit(fail ? 1 : 0);
