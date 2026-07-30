/* ============================================================================
 * main.js — 탭 4개를 연결하는 곳
 * 설계 내용(design)은 여기 한 군데에만 두고, 각 탭이 함께 본다.
 * ========================================================================== */

import { emptyDesign } from './codegen.js';
import { checkFresh } from './freshness.js';
import { mountAssemble } from './tabs/assemble.js';
import { mountExamples } from './tabs/examples.js';
import { mountDesign } from './tabs/design.js';
import { mountRun } from './tabs/run.js';

/* 탭 순서 = 수업 흐름.
 * ① 부품 익히기 → ② 예제 살펴보기 → ③ 내 클래스 설계 → ④ 실행해 보기
 * 이 배열의 순서는 index.html 의 버튼·패널 순서와 같게 유지한다. */
const TABS = ['assemble', 'examples', 'design', 'run'];

/** 모든 탭이 함께 쓰는 알림판 */
const app = {
  design: emptyDesign(),
  goTab,
  /** 실행 탭으로 코드를 보내고 그 탭을 연다 */
  sendToRun(code, opts = {}) {
    app.run.setCode(code, opts);
    goTab('run');
  },
};

function goTab(id) {
  for (const t of TABS) {
    const on = t === id;
    document.getElementById(`tab-${t}`).setAttribute('aria-selected', String(on));
    document.getElementById(`panel-${t}`).classList.toggle('on', on);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function start() {
  /* 배포된 새 버전이 있으면 곧바로 다시 불러온다.
     학생이 손을 대기 전에만 동작하므로 작업이 사라질 일은 없다. */
  checkFresh();
  for (const t of TABS) {
    document.getElementById(`tab-${t}`).addEventListener('click', () => goTab(t));
  }
  mountAssemble(document.getElementById('panel-assemble'), app);
  mountExamples(document.getElementById('panel-examples'), app);
  app.designTab = mountDesign(document.getElementById('panel-design'), app);
  app.run = mountRun(document.getElementById('panel-run'), app);
}

/* 빌드 결과물은 <head> 안의 일반 스크립트로 들어간다(더블클릭 실행을 위해).
   그래서 문서가 다 읽히기를 기다린 뒤에 화면을 만든다. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
