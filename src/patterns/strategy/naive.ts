// The "before" version — condition logic hard-coded with if/else.
// This file stays in the repo on purpose: the strategy page shows it
// first so the reader feels the pain before seeing the pattern.

export interface Answer {
  text: string;
  ragScore: number; // 0..1 retrieval confidence from RAG
  sources: string[]; // cited document names
}

export type Condition = "plain" | "uncertainty" | "citation";

// Call site 1: render the answer for the UI
export function renderAnswer(answer: Answer, condition: Condition): string {
  if (condition === "plain") {
    return answer.text;
  }
  if (condition === "uncertainty") {
    return `${answer.text}\n⚠ 檢索分數 ${answer.ragScore}，僅供參考`;
  }
  if (condition === "citation") {
    return `${answer.text}\n📄 出處：${answer.sources.join("、")}`;
  }
  throw new Error(`unknown condition: ${condition}`);
}

// Call site 2: record what the participant actually saw.
// In the real experiment this row IS the independent variable —
// if it disagrees with what the UI showed, the data is corrupted.
export function logExposure(answer: Answer, condition: Condition): string {
  if (condition === "plain") {
    return "shown=answer_only";
  }
  if (condition === "uncertainty") {
    return `shown=answer+uncertainty score=${answer.ragScore}`;
  }
  if (condition === "citation") {
    return `shown=answer+citation n_sources=${answer.sources.length}`;
  }
  throw new Error(`unknown condition: ${condition}`);
}
