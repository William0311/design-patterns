/**
 * Command — 把「一個操作」包成物件，讓它可以被儲存、排隊、還原。
 *
 * 這裡的 receiver 是 Drawing：它只負責存圖形，完全不知道 undo 的存在。
 * 每個 Command 自己記住還原所需的最小資訊，History 只管堆疊。
 */

export interface Shape {
  readonly id: string;
  x: number;
  y: number;
  color: string;
}

/** Receiver：純粹的狀態容器，沒有任何還原邏輯。 */
export class Drawing {
  private readonly shapes = new Map<string, Shape>();

  add(shape: Shape): void {
    // Copy on the way in so callers cannot mutate our state behind our back
    this.shapes.set(shape.id, { ...shape });
  }

  remove(id: string): void {
    this.shapes.delete(id);
  }

  get(id: string): Shape {
    const shape = this.shapes.get(id);
    if (!shape) throw new Error(`找不到圖形: ${id}`);
    return shape;
  }

  has(id: string): boolean {
    return this.shapes.has(id);
  }

  list(): readonly Shape[] {
    return [...this.shapes.values()];
  }

  get size(): number {
    return this.shapes.size;
  }
}

/** 所有可還原操作的共同介面。 */
export interface Command {
  readonly label: string;
  execute(): void;
  undo(): void;
}

export class AddShape implements Command {
  readonly label: string;

  constructor(
    private readonly drawing: Drawing,
    private readonly shape: Shape,
  ) {
    this.label = `新增 ${shape.id}`;
  }

  execute(): void {
    this.drawing.add(this.shape);
  }

  undo(): void {
    this.drawing.remove(this.shape.id);
  }
}

export class MoveShape implements Command {
  readonly label: string;
  private previous: { x: number; y: number } | null = null;

  constructor(
    private readonly drawing: Drawing,
    private readonly id: string,
    private readonly to: { x: number; y: number },
  ) {
    this.label = `移動 ${id}`;
  }

  execute(): void {
    const shape = this.drawing.get(this.id);
    // Captured at execute time, not construction time, so redo works after
    // other commands have moved the shape in between.
    this.previous = { x: shape.x, y: shape.y };
    shape.x = this.to.x;
    shape.y = this.to.y;
  }

  undo(): void {
    if (!this.previous) throw new Error('undo 在 execute 之前被呼叫');
    const shape = this.drawing.get(this.id);
    shape.x = this.previous.x;
    shape.y = this.previous.y;
  }
}

export class RecolorShape implements Command {
  readonly label: string;
  private previous: string | null = null;

  constructor(
    private readonly drawing: Drawing,
    private readonly id: string,
    private readonly color: string,
  ) {
    this.label = `改色 ${id}`;
  }

  execute(): void {
    const shape = this.drawing.get(this.id);
    this.previous = shape.color;
    shape.color = this.color;
  }

  undo(): void {
    if (this.previous === null) throw new Error('undo 在 execute 之前被呼叫');
    this.drawing.get(this.id).color = this.previous;
  }
}

/** 一次清空全部——還原時要把整批倒回去。 */
export class ClearAll implements Command {
  readonly label = '全部清除';
  private removed: Shape[] = [];

  constructor(private readonly drawing: Drawing) {}

  execute(): void {
    this.removed = this.drawing.list().map((s) => ({ ...s }));
    for (const shape of this.removed) this.drawing.remove(shape.id);
  }

  undo(): void {
    for (const shape of this.removed) this.drawing.add(shape);
  }
}

/**
 * 兩個堆疊組成的操作歷史。
 * 注意 run() 會清掉 redo 堆疊：做了新動作之後，原本的「未來」就不存在了。
 */
export class History {
  private readonly done: Command[] = [];
  private readonly undone: Command[] = [];

  run(command: Command): void {
    command.execute();
    this.done.push(command);
    this.undone.length = 0;
  }

  undo(): Command | undefined {
    const command = this.done.pop();
    if (!command) return undefined;
    command.undo();
    this.undone.push(command);
    return command;
  }

  redo(): Command | undefined {
    const command = this.undone.pop();
    if (!command) return undefined;
    command.execute();
    this.done.push(command);
    return command;
  }

  get canUndo(): boolean {
    return this.done.length > 0;
  }

  get canRedo(): boolean {
    return this.undone.length > 0;
  }

  /** 給 UI 顯示用的操作軌跡。 */
  get trail(): readonly string[] {
    return this.done.map((c) => c.label);
  }
}
