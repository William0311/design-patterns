import { describe, it, expect, beforeEach } from 'vitest';
import {
  Drawing,
  History,
  AddShape,
  MoveShape,
  RecolorShape,
  ClearAll,
  type Shape,
} from './command';

const shape = (id: string, over: Partial<Shape> = {}): Shape => ({
  id,
  x: 0,
  y: 0,
  color: '#888',
  ...over,
});

describe('Drawing', () => {
  it('存進去的是複本，外部之後改原物件不會影響內部狀態', () => {
    const drawing = new Drawing();
    const original = shape('a');
    drawing.add(original);

    original.x = 999;

    expect(drawing.get('a').x).toBe(0);
  });

  it('取不存在的圖形會丟錯，而不是回傳 undefined', () => {
    expect(() => new Drawing().get('nope')).toThrow('找不到圖形: nope');
  });
});

describe('History 基本 undo/redo', () => {
  let drawing: Drawing;
  let history: History;

  beforeEach(() => {
    drawing = new Drawing();
    history = new History();
  });

  it('undo 後圖形消失，redo 後回來', () => {
    history.run(new AddShape(drawing, shape('a')));
    expect(drawing.size).toBe(1);

    history.undo();
    expect(drawing.has('a')).toBe(false);

    history.redo();
    expect(drawing.has('a')).toBe(true);
  });

  it('空歷史時 undo/redo 回 undefined，不丟錯', () => {
    expect(history.undo()).toBeUndefined();
    expect(history.redo()).toBeUndefined();
  });

  it('canUndo / canRedo 反映當下堆疊狀態', () => {
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);

    history.run(new AddShape(drawing, shape('a')));
    expect(history.canUndo).toBe(true);
    expect(history.canRedo).toBe(false);

    history.undo();
    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(true);
  });

  it('做了新動作之後，原本的 redo 分支被丟棄', () => {
    history.run(new AddShape(drawing, shape('a')));
    history.run(new AddShape(drawing, shape('b')));
    history.undo();
    expect(history.canRedo).toBe(true);

    history.run(new AddShape(drawing, shape('c')));

    expect(history.canRedo).toBe(false);
    expect(drawing.has('b')).toBe(false);
    expect(drawing.has('c')).toBe(true);
  });
});

describe('各個 Command 的還原正確性', () => {
  let drawing: Drawing;
  let history: History;

  beforeEach(() => {
    drawing = new Drawing();
    history = new History();
    history.run(new AddShape(drawing, shape('a', { x: 10, y: 20, color: '#f00' })));
  });

  it('MoveShape 還原回原座標', () => {
    history.run(new MoveShape(drawing, 'a', { x: 99, y: 99 }));
    expect(drawing.get('a')).toMatchObject({ x: 99, y: 99 });

    history.undo();
    expect(drawing.get('a')).toMatchObject({ x: 10, y: 20 });
  });

  it('MoveShape 的 previous 在 execute 時才捕捉，redo 不會還原到過期座標', () => {
    const move = new MoveShape(drawing, 'a', { x: 50, y: 50 });
    history.run(move);
    history.undo();

    // 中間插入另一次移動，改變了「當下」座標
    history.run(new MoveShape(drawing, 'a', { x: 70, y: 70 }));
    history.run(move);
    expect(drawing.get('a')).toMatchObject({ x: 50, y: 50 });

    history.undo();
    expect(drawing.get('a')).toMatchObject({ x: 70, y: 70 });
  });

  it('RecolorShape 還原回原顏色', () => {
    history.run(new RecolorShape(drawing, 'a', '#0f0'));
    expect(drawing.get('a').color).toBe('#0f0');

    history.undo();
    expect(drawing.get('a').color).toBe('#f00');
  });

  it('ClearAll 一次還原整批圖形，含各自的屬性', () => {
    history.run(new AddShape(drawing, shape('b', { x: 5, color: '#00f' })));
    history.run(new ClearAll(drawing));
    expect(drawing.size).toBe(0);

    history.undo();
    expect(drawing.size).toBe(2);
    expect(drawing.get('b')).toMatchObject({ x: 5, color: '#00f' });
  });

  it('undo 在 execute 之前被呼叫會丟錯', () => {
    expect(() => new MoveShape(drawing, 'a', { x: 1, y: 1 }).undo()).toThrow();
    expect(() => new RecolorShape(drawing, 'a', '#fff').undo()).toThrow();
  });
});

describe('連續多步還原', () => {
  it('一路 undo 到底再一路 redo，狀態與軌跡都回到原樣', () => {
    const drawing = new Drawing();
    const history = new History();

    history.run(new AddShape(drawing, shape('a')));
    history.run(new MoveShape(drawing, 'a', { x: 30, y: 40 }));
    history.run(new RecolorShape(drawing, 'a', '#abc'));
    const after = { ...drawing.get('a') };
    const trail = [...history.trail];

    while (history.canUndo) history.undo();
    expect(drawing.size).toBe(0);

    while (history.canRedo) history.redo();
    expect(drawing.get('a')).toEqual(after);
    expect(history.trail).toEqual(trail);
  });
});
