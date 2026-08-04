import {
  ExperimentPresenter,
  plain,
  withUncertainty,
  withCitation,
  type Answer,
  type PresentationStrategy,
} from './strategy';

// Condition D is defined HERE, outside strategy.ts, on purpose:
// adding a condition touches zero lines of existing code.
const combo: PresentationStrategy = {
  id: 'combo',
  render: (a) =>
    `${withUncertainty.render(a)}\n📄 出處：${a.sources.join('、')}`,
  logLine: (a) =>
    `shown=answer+uncertainty+citation score=${a.ragScore} n_sources=${a.sources.length}`,
};

const STRATEGIES: readonly PresentationStrategy[] = [
  plain,
  withUncertainty,
  withCitation,
  combo,
];

/** 模擬 RAG 助手的問答庫：檢索分數有高有低，看 demo 時值得留意低分那題。 */
const QA: readonly { question: string; answer: Answer }[] = [
  {
    question: '特休要怎麼申請？',
    answer: {
      text: '特休申請請至「請假」頁送出，主管核准後生效。',
      ragScore: 0.83,
      sources: ['就業規則第12條', '請假流程手冊'],
    },
  },
  {
    question: '加班費怎麼計算？',
    answer: {
      text: '平日加班前兩小時以時薪 1.34 倍計算，之後為 1.67 倍；休息日另計。',
      ragScore: 0.61,
      sources: ['薪資計算辦法 3.2 節'],
    },
  },
  {
    question: '出差可以帶寵物嗎？',
    answer: {
      text: '內部文件沒有直接規範，以下為推測：出差住宿由合作旅館決定，多數不允許攜帶寵物。',
      ragScore: 0.18,
      sources: ['2019 福委會會議紀錄（相關性低）'],
    },
  },
];

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少 #${id}`);
  return node as T;
};

const questionEl = el<HTMLParagraphElement>('question');
const cardEl = el<HTMLDivElement>('answer-card');
const logEl = el<HTMLOListElement>('exposure-log');
const conditionButtons = el<HTMLDivElement>('condition-buttons');
const randomBtn = el<HTMLButtonElement>('random-assign');

const presenter = new ExperimentPresenter();
let questionIndex = 0;

function ask(strategy: PresentationStrategy): void {
  const qa = QA[questionIndex % QA.length];
  if (!qa) return;
  questionIndex += 1;

  questionEl.textContent = `Q${questionIndex}：${qa.question}`;
  cardEl.textContent = presenter.present(qa.answer, strategy);

  // Re-render the whole log from the presenter — the panel is a pure view
  // of what was actually recorded, not a copy maintained by hand.
  logEl.replaceChildren();
  for (const line of presenter.exposureLog) {
    const li = document.createElement('li');
    li.textContent = line;
    logEl.append(li);
  }
  logEl.lastElementChild?.scrollIntoView({ block: 'nearest' });
}

for (const strategy of STRATEGIES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent =
    strategy === combo ? `條件 ${strategy.id}（後加的）` : `條件 ${strategy.id}`;
  button.addEventListener('click', () => ask(strategy));
  conditionButtons.append(button);
}

randomBtn.addEventListener('click', () => {
  const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
  if (strategy) ask(strategy);
});
