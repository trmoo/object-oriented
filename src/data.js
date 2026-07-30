/* ============================================================================
 * data.js — 앱에서 쓰는 학습 자료 모음
 *   ① 수행평가 설계지의 클래스 예시 목록 (+ 속성·메소드 아이디어)
 *   ② 수행평가 평가요소 7가지 원문
 *   ③ 교안 예제 코드
 *   ④ 개념 빈칸 문제 / 코드 조립 문제 / 문법 해부 설명
 * ========================================================================== */

/* ── ① 클래스 예시 ───────────────────────────────────────────────────────────
 * 수행평가 설계지에 실린 목록 그대로다. (설계지에 '학생'이 두 번 적혀 있어 한 번만 둔다)
 * attrs: [영문 속성명, 한글 뜻, 자료형, 초깃값]   methods: [영문 메소드명, 한글 뜻]
 *
 * ⚠ 학생이 예시를 고르면 **클래스 이름만** 채워진다 (`designFromIdea()`).
 *   `attrs` 는 **「이런 속성을 생각해 보세요」 제안으로만** 쓰이고(이름·한글 뜻만),
 *   `methods` 는 **아예 쓰지 않는다.** (2026-07-30 지시)
 *   속성을 만들어 주면 생성자·접근자·설정자가 딸려 생겨서 평가요소 2·3·4 를 앱이 대신
 *   채워 준 셈이 된다. 속성을 직접 추가하게 해야 자료형·초깃값·접근자·설정자를 스스로 정한다.
 *   자동으로 채우도록 되돌리지 말 것.
 * ------------------------------------------------------------------------- */
export const CLASS_IDEAS = [
  { en: 'Car', ko: '자동차', attrs: [['speed', '속력', 'int', '0'], ['color', '색상', 'str', "'red'"]], methods: [['accel', '가속하기'], ['stop', '멈추기']] },
  { en: 'MediaPlayer', ko: '미디어 플레이어', attrs: [['volume', '음량', 'int', '5'], ['title', '재생 중인 곡', 'str', "'없음'"]], methods: [['play', '재생하기'], ['volumeUp', '음량 올리기']] },
  { en: 'Student', ko: '학생', attrs: [['name', '이름', 'str', "'홍길동'"], ['score', '점수', 'int', '0']], methods: [['study', '공부하기'], ['printReport', '성적 출력하기']] },
  { en: 'RemoteControl', ko: '리모컨', attrs: [['channel', '채널 번호', 'int', '1'], ['power', '전원 상태', 'bool', 'False']], methods: [['togglePower', '전원 켜고 끄기'], ['nextChannel', '다음 채널로']] },
  { en: 'Animal', ko: '동물', attrs: [['name', '이름', 'str', "'멍멍이'"], ['age', '나이', 'int', '0']], methods: [['speak', '소리 내기'], ['grow', '나이 먹기']] },
  { en: 'DocumentEditor', ko: '문서 편집기', attrs: [['content', '내용', 'str', "''"], ['fontSize', '글자 크기', 'int', '11']], methods: [['write', '글 쓰기'], ['countLength', '글자 수 세기']] },
  { en: 'Clock', ko: '시계', attrs: [['hour', '시', 'int', '0'], ['minute', '분', 'int', '0']], methods: [['tick', '1분 흐르기'], ['printTime', '시각 출력하기']] },
  { en: 'Professor', ko: '교수', attrs: [['name', '이름', 'str', "'김교수'"], ['subject', '담당 과목', 'str', "'정보'"]], methods: [['teach', '강의하기'], ['printInfo', '정보 출력하기']] },
  { en: 'BlogPost', ko: '블로그 글', attrs: [['title', '제목', 'str', "'첫 글'"], ['likes', '좋아요 수', 'int', '0']], methods: [['like', '좋아요 누르기'], ['printPost', '글 출력하기']] },
  { en: 'Book', ko: '책', attrs: [['title', '제목', 'str', "'파이썬'"], ['page', '펼친 쪽', 'int', '1']], methods: [['turnPage', '쪽 넘기기'], ['printInfo', '책 정보 출력하기']] },
  { en: 'CreditCard', ko: '신용카드', attrs: [['limit', '한도', 'int', '100000'], ['used', '사용액', 'int', '0']], methods: [['pay', '결제하기'], ['printRemain', '남은 한도 출력하기']] },
  { en: 'Computer', ko: '컴퓨터', attrs: [['cpu', 'CPU 이름', 'str', "'i5'"], ['ram', '램 크기', 'int', '8']], methods: [['boot', '켜기'], ['upgradeRam', '램 늘리기']] },
  { en: 'ATM', ko: 'ATM 기기', attrs: [['cash', '보유 현금', 'int', '1000000'], ['count', '사용 횟수', 'int', '0']], methods: [['withdraw', '출금하기'], ['deposit', '입금하기']] },
  { en: 'Smartphone', ko: '스마트폰', attrs: [['battery', '배터리', 'int', '100'], ['model', '모델명', 'str', "'S24'"]], methods: [['useApp', '앱 쓰기'], ['charge', '충전하기']] },
  { en: 'Camera', ko: '카메라', attrs: [['photoCount', '찍은 사진 수', 'int', '0'], ['mode', '촬영 모드', 'str', "'자동'"]], methods: [['shoot', '사진 찍기'], ['changeMode', '모드 바꾸기']] },
  { en: 'GameCharacter', ko: '게임 캐릭터', attrs: [['hp', '체력', 'int', '100'], ['level', '레벨', 'int', '1']], methods: [['attack', '공격하기'], ['levelUp', '레벨 올리기']] },
  { en: 'Weather', ko: '날씨', attrs: [['temp', '기온', 'int', '20'], ['sky', '하늘 상태', 'str', "'맑음'"]], methods: [['printToday', '오늘 날씨 출력하기'], ['isHot', '더운지 판단하기']] },
  { en: 'Robot', ko: '로봇', attrs: [['x', 'x 위치', 'int', '0'], ['battery', '배터리', 'int', '100']], methods: [['moveRight', '오른쪽으로 가기'], ['charge', '충전하기']] },
  { en: 'SportsTeam', ko: '스포츠 팀', attrs: [['name', '팀 이름', 'str', "'향남FC'"], ['win', '승 수', 'int', '0']], methods: [['addWin', '승리 추가하기'], ['printRecord', '전적 출력하기']] },
  { en: 'Employee', ko: '회사 직원', attrs: [['salary', '월급', 'int', '3000000'], ['name', '이름', 'str', "'이사원'"]], methods: [['payRaise', '월급 올리기'], ['printInfo', '정보 출력하기']] },
  { en: 'School', ko: '학교', attrs: [['name', '학교 이름', 'str', "'향남고'"], ['studentCount', '학생 수', 'int', '0']], methods: [['enroll', '학생 받기'], ['printInfo', '학교 정보 출력하기']] },
  { en: 'Product', ko: '상품', attrs: [['name', '상품명', 'str', "'연필'"], ['price', '가격', 'int', '1000']], methods: [['discount', '할인하기'], ['printPrice', '가격 출력하기']] },
  { en: 'Hospital', ko: '병원', attrs: [['name', '병원 이름', 'str', "'향남병원'"], ['patientCount', '환자 수', 'int', '0']], methods: [['receive', '환자 접수하기'], ['printInfo', '병원 정보 출력하기']] },
  { en: 'Order', ko: '주문', attrs: [['item', '주문 상품', 'str', "'치킨'"], ['amount', '수량', 'int', '1']], methods: [['addAmount', '수량 늘리기'], ['printOrder', '주문서 출력하기']] },
  { en: 'Doctor', ko: '의사', attrs: [['name', '이름', 'str', "'박의사'"], ['part', '진료과', 'str', "'내과'"]], methods: [['treat', '진료하기'], ['printInfo', '정보 출력하기']] },
  { en: 'ShoppingCart', ko: '장바구니', attrs: [['count', '담은 개수', 'int', '0'], ['total', '합계 금액', 'int', '0']], methods: [['addItem', '물건 담기'], ['printTotal', '합계 출력하기']] },
  { en: 'Nurse', ko: '간호사', attrs: [['name', '이름', 'str', "'최간호사'"], ['shift', '근무조', 'str', "'주간'"]], methods: [['care', '간호하기'], ['changeShift', '근무조 바꾸기']] },
  { en: 'DateTime', ko: '날짜와 시간', attrs: [['month', '월', 'int', '1'], ['day', '일', 'int', '1']], methods: [['nextDay', '하루 넘기기'], ['printDate', '날짜 출력하기']] },
  { en: 'Cinema', ko: '영화관', attrs: [['seat', '남은 좌석', 'int', '100'], ['movie', '상영 영화', 'str', "'인사이드아웃'"]], methods: [['sellTicket', '표 팔기'], ['printSeat', '남은 좌석 출력하기']] },
  { en: 'Shape', ko: '그래픽 도형', attrs: [['kind', '도형 종류', 'str', "'원'"], ['size', '크기', 'int', '10']], methods: [['resize', '크기 바꾸기'], ['printShape', '도형 정보 출력하기']] },
  { en: 'Audiobook', ko: '오디오북', attrs: [['title', '제목', 'str', "'어린왕자'"], ['position', '재생 위치(분)', 'int', '0']], methods: [['play', '재생하기'], ['printPosition', '위치 출력하기']] },
  { en: 'Rectangle', ko: '직사각형', attrs: [['width', '가로', 'int', '10'], ['height', '세로', 'int', '5']], methods: [['calcArea', '넓이 계산하기'], ['calcPerimeter', '둘레 계산하기']] },
  { en: 'Email', ko: '전자우편', attrs: [['subject', '제목', 'str', "'안녕하세요'"], ['isRead', '읽음 여부', 'bool', 'False']], methods: [['read', '읽음으로 표시하기'], ['printMail', '메일 출력하기']] },
  { en: 'Image', ko: '이미지', attrs: [['width', '너비', 'int', '1920'], ['angle', '회전 각도', 'int', '0']], methods: [['rotate', '회전하기'], ['printSize', '크기 출력하기']] },
  { en: 'ChatApp', ko: '채팅 앱', attrs: [['msgCount', '메시지 수', 'int', '0'], ['room', '방 이름', 'str', "'1반'"]], methods: [['send', '메시지 보내기'], ['printCount', '메시지 수 출력하기']] },
  { en: 'Bus', ko: '버스', attrs: [['number', '노선 번호', 'int', '720'], ['passenger', '탑승객 수', 'int', '0']], methods: [['board', '태우기'], ['printInfo', '운행 정보 출력하기']] },
  { en: 'PostalAddress', ko: '우편 주소', attrs: [['city', '시', 'str', "'화성시'"], ['zipcode', '우편번호', 'str', "'18579'"]], methods: [['changeCity', '시 바꾸기'], ['printAddress', '주소 출력하기']] },
  { en: 'Branch', ko: '지점', attrs: [['name', '지점명', 'str', "'향남지점'"], ['staff', '직원 수', 'int', '5']], methods: [['hire', '직원 뽑기'], ['printInfo', '지점 정보 출력하기']] },
  { en: 'GPS', ko: 'GPS 시스템', attrs: [['lat', '위도', 'float', '37.2'], ['lng', '경도', 'float', '126.8']], methods: [['move', '위치 옮기기'], ['printPosition', '현재 위치 출력하기']] },
  { en: 'ParkingLot', ko: '차량 주차 시스템', attrs: [['total', '전체 자리', 'int', '50'], ['used', '사용 중인 자리', 'int', '0']], methods: [['parkIn', '입차하기'], ['printRemain', '남은 자리 출력하기']] },
  { en: 'VideoGame', ko: '비디오 게임', attrs: [['title', '제목', 'str', "'테트리스'"], ['score', '점수', 'int', '0']], methods: [['addScore', '점수 올리기'], ['printScore', '점수 출력하기']] },
  { en: 'Movie', ko: '영화', attrs: [['title', '제목', 'str', "'라이온킹'"], ['rating', '평점', 'float', '0.0']], methods: [['rate', '평점 주기'], ['printMovie', '영화 정보 출력하기']] },
  { en: 'Desk', ko: '책상', attrs: [['height', '높이(cm)', 'int', '70'], ['material', '재질', 'str', "'나무'"]], methods: [['adjustHeight', '높이 조절하기'], ['printInfo', '정보 출력하기']] },
  { en: 'FlightTicket', ko: '비행기 티켓', attrs: [['seat', '좌석 번호', 'str', "'12A'"], ['price', '가격', 'int', '350000']], methods: [['changeSeat', '좌석 바꾸기'], ['printTicket', '티켓 출력하기']] },
  { en: 'PhysicsObject', ko: '물리 객체', attrs: [['mass', '질량', 'float', '1.0'], ['velocity', '속도', 'float', '0.0']], methods: [['push', '힘 주기'], ['calcEnergy', '운동 에너지 계산하기']] },
  { en: 'Recipe', ko: '요리 레시피', attrs: [['name', '요리 이름', 'str', "'김밥'"], ['minute', '조리 시간(분)', 'int', '30']], methods: [['cook', '조리하기'], ['printRecipe', '레시피 출력하기']] },
  { en: 'Drone', ko: '드론', attrs: [['height', '고도', 'int', '0'], ['battery', '배터리', 'int', '100']], methods: [['takeOff', '이륙하기'], ['land', '착륙하기']] },
  { en: 'MusicPlayer', ko: '음악 플레이어', attrs: [['song', '재생 곡', 'str', "'봄날'"], ['volume', '음량', 'int', '5']], methods: [['play', '재생하기'], ['volumeDown', '음량 내리기']] },
  { en: 'TrafficLight', ko: '교통 신호등', attrs: [['color', '현재 색', 'str', "'red'"], ['count', '바뀐 횟수', 'int', '0']], methods: [['change', '신호 바꾸기'], ['printColor', '현재 색 출력하기']] },
];

/* ── ② 수행평가 평가요소 (유의사항·설계지 원문) ───────────────────────────── */
export const RUBRIC_ITEMS = [
  { n: 1, title: '키워드를 활용하여 클래스를 올바른 형태로 정의했는가?', tips: ['클래스 정의하는 키워드는 class'] },
  { n: 2, title: '클래스 내 생성자를 속성을 활용하여 올바르게 정의하였는가? (비공개 속성 1개 이상, 생성자 1개)', tips: ['def __init__(self) :', 'self.__속성명 = 초깃값'] },
  { n: 3, title: '클래스 내 접근자 메소드를 속성을 활용하여 올바르게 정의하였는가? (접근자 1개 이상)', tips: ['def get속성명(self) :', 'return self.__속성명'] },
  { n: 4, title: '클래스 내 설정자 메소드를 속성을 활용하여 올바르게 정의하였는가? (설정자 1개 이상)', tips: ['def set속성명(self, 매개변수) :', 'self.__속성명 = 매개변수'] },
  { n: 5, title: '클래스 내 메소드를 속성을 활용하여 올바르게 정의하였는가? (생성자, 접근자, 설정자 외 메소드 1개 이상)', tips: ['def 메소드명(self, 매개변수) :', '메소드 안에서 self.__속성명 을 활용할 것'] },
  { n: 6, title: '정의한 클래스의 생성자를 호출하여 생성된 객체를 변수에 저장할 수 있는가?', tips: ['인스턴스명 = 클래스명()'] },
  { n: 7, title: '생성한 객체에 대하여 메소드를 올바르게 호출할 수 있는가? (메소드 호출 1회 이상)', tips: ['인스턴스명.메소드명()'] },
];

/** 만족한 평가요소 개수 → 점수 (수행평가 유의사항의 배점표)
 *  0가지일 때는 원문 표에도 숫자가 아니라 **「기본점수」**라고 적혀 있다. (2026-07-30 교사 확인)
 *  값이 빠진 것이 아니므로 임의의 숫자로 바꾸지 말 것. 화면에도 「기본점수」로 그대로 보인다.
 *  참고로 미제출·백지는 8점, 미인정결시는 7점이지만 이것은 앱이 판단할 수 없어 넣지 않았다. */
export const SCORE_TABLE = [
  { min: 6, score: '20', label: '6가지 이상 만족' },
  { min: 5, score: '18', label: '5가지 만족' },
  { min: 4, score: '16', label: '4가지 만족' },
  { min: 3, score: '14', label: '3가지 만족' },
  { min: 2, score: '12', label: '2가지 만족' },
  { min: 1, score: '10', label: '1가지 만족' },
  { min: 0, score: '기본점수', label: '평가요소를 모두 만족하지 않는 경우' },
];

/* ── ③ 교안 예제 코드 ────────────────────────────────────────────────────── */
export const EXAMPLES = [
  {
    id: 'dice',
    title: '주사위 (Dice)',
    point: '클래스 하나로 인스턴스를 두 개 만들면, 각 인스턴스는 서로 다른 값을 따로 가진다.',
    watch: '실행할 때마다 값이 바뀐다. dice1 과 dice2 의 값이 다른 것을 확인하자.',
    code: `import random

class Dice :                          # 주사위 클래스
    def __init__(self) :              # 생성자
        self.value = 0                # value 속성을 0으로 초기화
    def roll(self) :                  # 주사위 값을 임의로 구하는 메소드
        self.value = random.randint(1, 6)
    def get_value(self) :             # 주사위 값을 반환하는 메소드
        return self.value

dice1 = Dice()                        # 인스턴스 2개 생성 (생성자 호출)
dice2 = Dice()

dice1.roll()                          # 각각의 인스턴스에서 메소드 호출
dice2.roll()

print('주사위1 값:', dice1.get_value())
print('주사위2 값:', dice2.value)`,
  },
  {
    id: 'open',
    title: '정보 은닉이 없을 때 (Person)',
    point: '속성을 공개해 두면 외부에서 나이를 -5 로 바꿔 버릴 수 있다. 논리적으로 잘못된 상태가 된다.',
    watch: '나이가 -5 로 출력되는 것을 확인하자. 막아 주는 장치가 아무것도 없다.',
    code: `class Person:
    def __init__(self, name, age):
        self.name = name    # 공개 속성
        self.age = age      # 공개 속성

# 외부 코드
p = Person("Seungbeom", 18)
print(p.name)
print(p.age)

# 외부에서 속성 직접 수정
p.age = -5                  # 잘못된 값 입력
print(p.age)                # -5 (논리적으로 잘못된 상태)`,
  },
  {
    id: 'person',
    title: '접근자·설정자 (Person)',
    point: '__를 붙여 비공개로 만들고, 접근자(getter)와 설정자(setter)로만 드나들게 한다.',
    watch: 'type(s) 이 <class \'__main__.Person\'> 으로 나온다. 아래 「정보 은닉 실험」 버튼도 눌러 보자.',
    code: `class Person :
    def __init__(self) :          # 생성자
        self.__name = " "
        self.__age = 0
    def getName(self) :           # 접근자
        return self.__name
    def getAge(self) :            # 접근자
        return self.__age
    def setName(self, name) :     # 설정자
        self.__name = name
    def setAge(self, age) :       # 설정자
        self.__age = age

s = Person()
print(type(s))
print(s.getName())
print(s.getAge())
s.setName("향이")
s.setAge(17)
print(s.getName())
print(s.getAge())`,
    experiment: { label: '비공개 속성을 직접 꺼내 보기', append: `\nprint(s.__age)   # 이 줄이 왜 오류가 날까?` },
  },
  {
    id: 'bank',
    title: '은행 계좌 (BankAccount)',
    point: '생성자 · 접근자 · 일반 메소드(입금·출금)를 모두 갖춘 형태. 수행평가 예시에 가장 가깝다.',
    watch: '입금 100 → 출금 10 → 잔액 90. 잔액은 __balance 라서 밖에서 직접 못 바꾼다.',
    code: `class BankAccount :
    def __init__(self) :                # 생성자
        self.__balance = 0
    def getBalance(self) :              # 접근자
        return self.__balance
    def withdraw(self, amount) :        # 일반 메소드 (출금)
        self.__balance -= amount
        print('통장에', amount, '가 출금되었음')
    def deposit(self, amount) :         # 일반 메소드 (입금)
        self.__balance += amount
        print('통장에', amount, '가 입금되었음')

a = BankAccount()
a.deposit(100)
a.withdraw(10)
print(a.getBalance())`,
  },
  {
    id: 'circle',
    title: '원 (Circle) — 오류 찾기',
    point: '교안 코드에는 잘못된 곳이 하나 있다. calcArea 가 계산만 하고 결과를 돌려주지 않는다.',
    watch: '실행하면 「원의 넓이: None」 이 나온다. 왜 None 일까? 아래 문제를 풀어 보자.',
    code: `import math

class Circle :
    def __init__(self, radius) :          # 생성자
        self.__radius = radius
    def setRadius(self, r) :              # 설정자
        self.__radius = r
    def calcArea(self) :                  # 면적 계산 메소드
        area = math.pi * self.__radius ** 2
    def calcCircum(self) :                # 둘레 계산 메소드
        circum = 2.0 * math.pi * self.__radius
        return circum

c = Circle(10)
print('원의 넓이:', c.calcArea())
print('원의 둘레:', c.calcCircum())`,
    bug: {
      question: 'calcArea 메소드가 넓이를 제대로 돌려주게 하려면 어떤 줄을 넣어야 할까요?',
      answers: ['return area', 'return  area'],
      hint: '접근자와 마찬가지로, 값을 돌려주려면 return 문이 필요합니다.',
      explain: 'calcArea 안에서 area 를 계산만 하고 끝냈기 때문에 파이썬은 자동으로 None 을 돌려줍니다. 마지막 줄에 return area 를 넣어야 314.159… 가 나옵니다.',
      fixed: `    def calcArea(self) :
        area = math.pi * self.__radius ** 2
        return area`,
    },
  },
  {
    id: 'car',
    title: '자동차 (Car) — 문자열 표현 메소드',
    point: '__str__ 은 print(인스턴스) 했을 때 대신 보여 줄 문자열을 돌려주는 특별한 메소드다.',
    watch: '반드시 문자열을 돌려줘야 한다. 숫자를 그냥 돌려주면 오류가 난다.',
    code: `class Car :
    def __init__(self, speed, color) :      # 생성자
        self.__speed = speed
        self.__color = color
    def setSpeed(self, speed) :             # 설정자
        self.__speed = speed
    def setColor(self, color) :             # 설정자
        self.__color = color
    def __str__(self) :                     # 문자열 표현 메소드
        return str(self.__speed) + ", " + str(self.__color)

myCar = Car(0, 'red')
myCar.setSpeed(100)
print(myCar)`,
    bug: {
      question: '__str__ 안의 return 을 `return self.__speed` 로 바꾸면 왜 오류가 날까요? 반드시 무엇을 돌려줘야 하나요?',
      answers: ['문자열', '문자열을 반환해야 함', 'str', '문자열 반환'],
      hint: '교안에 「문자열을 반환해야 함」이라고 표시된 부분입니다.',
      explain: '__str__ 은 print 가 화면에 찍을 글자를 만들어 주는 메소드입니다. 그래서 반드시 문자열(str)을 return 해야 하고, 숫자는 str( ) 로 감싸야 합니다.',
    },
  },
];

/* ── ④-1 개념 빈칸 문제 (학습지의 빈칸 정리) ──────────────────────────────
 * a 는 「빈칸의 배열」이고, 각 빈칸은 「인정하는 답의 배열」이다.
 * 예) a: [['상태'], ['동작', '기능']] → 빈칸 2개, 두 번째 빈칸은 두 답 모두 정답
 * ------------------------------------------------------------------------- */
export const BLANKS = [
  { q: '객체는 (　　　)(= 속성)와 (　　　)(= 기능)을 가지고 있다.', a: [['상태'], ['동작']], hint: 'TV 를 떠올려 보자. 채널번호·볼륨은 무엇이고, 켜기·끄기는 무엇일까?' },
  { q: '속성이란 객체 안에 정의된 (　　　)이다.', a: [['변수']], hint: '값을 담아 두는 것.' },
  { q: '메소드란 클래스 안에 정의된 (　　　)이다.', a: [['함수']], hint: 'def 로 정의하는 것.' },
  { q: '클래스로부터 만들어지는 각각의 객체를 그 클래스의 (　　　)라고 한다.', a: [['인스턴스']], hint: '붕어빵 틀이 클래스라면, 찍어 낸 붕어빵 하나하나는?' },
  { q: '클래스 정의를 나타내는 키워드는 (　　　)이다.', a: [['class']], hint: '영어 소문자 5글자.' },
  { q: '일반적으로 클래스 이름의 첫 문자는 (　　　)를 사용한다.', a: [['대문자']], hint: 'Car, Dice, BankAccount …' },
  { q: '모든 메소드의 첫 번째 매개변수는 자기 자신을 나타내는 (　　　) 변수이다.', a: [['self']], hint: '메소드를 호출한 인스턴스 자신을 가리킨다.' },
  { q: '인스턴스를 생성하면서 속성값을 초기화하는 메소드를 (　　　)라고 하고, 이름은 (　　　)으로 쓴다.', a: [['생성자'], ['__init__', 'init']], hint: 'initialize 의 줄임말이며 앞뒤로 밑줄 두 개씩 붙는다.' },
  { q: '속성을 비공개로 만들 때에는 속성명 앞에 밑줄 (　　　)개를 붙여 self.__속성명 처럼 쓴다.', a: [['2', '두', '둘', '이']], hint: '__balance, __age …' },
  { q: '비공개 속성값을 돌려주는 메소드를 (　　　), 값을 설정하는 메소드를 (　　　)라고 한다.', a: [['접근자', 'getter'], ['설정자', 'setter']], hint: '영어로는 getter 와 setter.' },
];

/* ── ④-2 코드 조립 문제 ─────────────────────────────────────────────────── */
/* lines: [들여쓰기 단계, 코드]  — 학생은 올바른 순서로 줄을 골라 넣는다 */
export const ASSEMBLE = [
  {
    id: 'a1',
    title: '주사위 클래스 만들기',
    goal: '값(value) 속성을 가지고, 주사위를 굴리고, 값을 돌려주는 Dice 클래스를 완성하세요.',
    lines: [
      [0, 'import random'], [0, 'class Dice :'], [1, 'def __init__(self) :'], [2, 'self.value = 0'],
      [1, 'def roll(self) :'], [2, 'self.value = random.randint(1, 6)'],
      [1, 'def get_value(self) :'], [2, 'return self.value'],
    ],
  },
  {
    id: 'a2',
    title: '접근자·설정자 만들기',
    goal: '비공개 속성 __age 를 가진 Person 클래스에 접근자와 설정자를 붙이세요.',
    lines: [
      [0, 'class Person :'], [1, 'def __init__(self) :'], [2, 'self.__age = 0'],
      [1, 'def getAge(self) :'], [2, 'return self.__age'],
      [1, 'def setAge(self, age) :'], [2, 'self.__age = age'],
    ],
  },
  {
    id: 'a3',
    title: '객체 생성하고 활용하기',
    goal: 'BankAccount 클래스를 만들고, 객체를 생성해 100원을 입금한 뒤 잔액을 출력하세요.',
    lines: [
      [0, 'class BankAccount :'], [1, 'def __init__(self) :'], [2, 'self.__balance = 0'],
      [1, 'def getBalance(self) :'], [2, 'return self.__balance'],
      [1, 'def deposit(self, amount) :'], [2, 'self.__balance += amount'],
      [0, 'a = BankAccount()'], [0, 'a.deposit(100)'], [0, 'print(a.getBalance())'],
    ],
  },
];

/* ── ④-3 문법 해부 (교안의 단계별 설명) ─────────────────────────────────── */
export const ANATOMY = {
  code: [
    { text: 'class', key: 'class' }, { text: ' ' }, { text: '클래스명', key: 'name' }, { text: ' :' }, { text: '\n' },
    { text: '    def ' }, { text: '__init__', key: 'init' }, { text: '(' }, { text: 'self', key: 'self' }, { text: ') :' }, { text: '\n' },
    { text: '        ' }, { text: 'self.속성명', key: 'attr' }, { text: ' = 초깃값' }, { text: '\n' },
    { text: '        # ...' }, { text: '\n' },
    { text: '    def ' }, { text: '메소드명', key: 'method' }, { text: '(self) :' }, { text: '\n' },
    { text: '        # 명령문s' },
  ],
  parts: {
    class: { title: 'class 키워드', body: '클래스 정의를 나타내는 키워드입니다. 반드시 소문자로 씁니다.' },
    name: { title: '클래스명', body: '일반적으로 클래스 이름의 첫 문자는 대문자를 사용합니다. 예) Car, Dice, BankAccount' },
    init: { title: '생성자 __init__', body: '인스턴스를 생성할 때 속성값을 초기화하는 메소드입니다. initialize 의 줄임말이고, 앞뒤로 밑줄 두 개씩 붙습니다. 클래스마다 하나만 정의할 수 있습니다.' },
    self: { title: 'self 변수', body: '현재 인스턴스 자신을 참조합니다. 곧 「메소드를 호출한 인스턴스」입니다. 모든 메소드의 첫 번째 매개변수는 self 여야 합니다.' },
    attr: { title: 'self.속성명', body: '메소드 안에서 속성을 쓸 때에는 속성명 앞에 self. 을 붙입니다. self. 을 빼면 그냥 메소드 안에서만 쓰는 임시 변수가 되어 버립니다.' },
    method: { title: '메소드명', body: '클래스 안에 정의된 함수를 메소드라고 합니다. 첫 매개변수 self 뒤에 필요한 매개변수를 더 쓸 수 있습니다.' },
  },
};

/* ── ④-4 객체 = 상태 + 동작 분류 활동 (교안의 표) ────────────────────────── */
export const SORT_ITEMS = {
  groups: [
    { name: 'TV', state: ['채널번호', '볼륨', '전원상태'], act: ['켜기', '끄기', '채널 변경하기'] },
    { name: '자동차', state: ['방향', '속도', '색상'], act: ['앞으로 가기', '멈추기', '후진하기'] },
    { name: '터틀(거북이)', state: ['모양', '크기', 'x 위치'], act: ['모양 바꾸기', '이동하기', '펜 들기'] },
    { name: '문자열', state: ['내용', '길이', '대문자 여부'], act: ['대문자로 바꾸기', '개수 세기'] },
  ],
};
