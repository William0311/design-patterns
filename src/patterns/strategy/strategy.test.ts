import { describe, it, expect } from 'vitest';
import {
  ExperimentPresenter,
  plain,
  withUncertainty,
  withCitation,
  type Answer,
  type PresentationStrategy,
} from './strategy';

const answer: Answer = {
  text: '特休申請請至「請假」頁送出，主管核准後生效。',
  ragScore: 0.83,
  sources: ['就業規則第12條', '請假流程手冊'],
};

describe('內建三個條件', () => {
  it('plain 只顯示回答本身', () => {
    expect(plain.render(answer)).toBe(answer.text);
    expect(plain.logLine(answer)).toBe('shown=answer_only');
  });

  it('uncertainty 顯示與 log 都帶到檢索分數', () => {
    expect(withUncertainty.render(answer)).toContain('0.83');
    expect(withUncertainty.logLine(answer)).toContain('score=0.83');
  });

  it('citation 顯示引用來源，log 記來源數量', () => {
    expect(withCitation.render(answer)).toContain('就業規則第12條');
    expect(withCitation.logLine(answer)).toContain('n_sources=2');
  });
});

describe('ExperimentPresenter', () => {
  it('log 記到的條件永遠是實際拿去渲染的那一個', () => {
    const presenter = new ExperimentPresenter();

    presenter.present(answer, plain);
    presenter.present(answer, withCitation);

    expect(presenter.exposureLog).toEqual([
      `condition=plain shown=answer_only`,
      `condition=citation shown=answer+citation n_sources=2`,
    ]);
  });
});

describe('擴充性：這就是 naive 版做不到的事', () => {
  // Condition D lives entirely in THIS file — strategy.ts is untouched.
  const combo: PresentationStrategy = {
    id: 'combo',
    render: (a) =>
      `${withUncertainty.render(a)}\n📄 出處：${a.sources.join('、')}`,
    logLine: (a) =>
      `shown=answer+uncertainty+citation score=${a.ragScore} n_sources=${a.sources.length}`,
  };

  it('加條件 D 不需要修改任何既有程式碼，顯示與 log 天生一致', () => {
    const presenter = new ExperimentPresenter();

    const shown = presenter.present(answer, combo);

    expect(shown).toContain('⚠');
    expect(shown).toContain('📄');
    expect(presenter.exposureLog[0]).toContain('condition=combo');
    // naive 版在這裡已經 throw "unknown condition: combo" 了
  });
});
