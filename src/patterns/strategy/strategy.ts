/**
 * Strategy — 把「會變的做法」抽成可替換的物件，主流程只依賴共同介面。
 *
 * 場景：RAG 助手的 A/B 介入實驗。每一題被隨機分配一個呈現條件
 * （純回答／附不確實性提示／附引用）。naive.ts 把條件寫成散落各處的
 * if/else；這裡改成：一個條件 = 一個物件，畫面顯示與實驗 log 收攏在
 * 同一個物件裡，所以兩者永遠一致，加新條件也不必動任何舊程式碼。
 */

export interface Answer {
  text: string;
  ragScore: number; // 0..1 retrieval confidence from RAG
  sources: string[]; // cited document names
}

/** 一個呈現條件：怎麼顯示、log 怎麼記，全部收在這裡。 */
export interface PresentationStrategy {
  /** 寫進實驗 log 的條件代號。 */
  readonly id: string;
  render(answer: Answer): string;
  logLine(answer: Answer): string;
}

export const plain: PresentationStrategy = {
  id: 'plain',
  render: (answer) => answer.text,
  logLine: () => 'shown=answer_only',
};

export const withUncertainty: PresentationStrategy = {
  id: 'uncertainty',
  render: (answer) => `${answer.text}\n⚠ 檢索分數 ${answer.ragScore}，僅供參考`,
  logLine: (answer) => `shown=answer+uncertainty score=${answer.ragScore}`,
};

export const withCitation: PresentationStrategy = {
  id: 'citation',
  render: (answer) => `${answer.text}\n📄 出處：${answer.sources.join('、')}`,
  logLine: (answer) => `shown=answer+citation n_sources=${answer.sources.length}`,
};

/**
 * Context：實驗主流程。它只認識 PresentationStrategy 介面，
 * 不認識任何具體條件——所以新條件出現時，這個 class 一行都不用改。
 */
export class ExperimentPresenter {
  private readonly exposures: string[] = [];

  present(answer: Answer, strategy: PresentationStrategy): string {
    // Display and log come from the SAME object, so they cannot disagree.
    this.exposures.push(`condition=${strategy.id} ${strategy.logLine(answer)}`);
    return strategy.render(answer);
  }

  /** 實驗結束後匯出的曝露紀錄（受試者實際看到了什麼）。 */
  get exposureLog(): readonly string[] {
    return [...this.exposures];
  }
}
