import {
  Drawing,
  History,
  AddShape,
  MoveShape,
  RecolorShape,
  ClearAll,
  type Command,
} from './command';

const COLORS = ['#e06c75', '#61afef', '#98c379', '#e5c07b', '#c678dd', '#56b6c2'];

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`缺少 #${id}`);
  return node as T;
};

const pick = <T>(items: readonly T[]): T => {
  const item = items[Math.floor(Math.random() * items.length)];
  if (item === undefined) throw new Error('不能從空陣列取值');
  return item;
};

const drawing = new Drawing();
const history = new History();

const stage = el<HTMLDivElement>('stage');
const trail = el<HTMLOListElement>('trail');
const undoBtn = el<HTMLButtonElement>('undo');
const redoBtn = el<HTMLButtonElement>('redo');
const moveBtn = el<HTMLButtonElement>('move');
const colorBtn = el<HTMLButtonElement>('recolor');
const clearBtn = el<HTMLButtonElement>('clear');
const hint = el<HTMLParagraphElement>('hint');

let selected: string | null = null;
let counter = 0;

/** 每次狀態變動後整個重畫——demo 求清楚，不求效率。 */
function render(): void {
  stage.replaceChildren();

  for (const shape of drawing.list()) {
    const node = document.createElement('button');
    node.className = 'shape' + (shape.id === selected ? ' selected' : '');
    node.style.left = `${shape.x}px`;
    node.style.top = `${shape.y}px`;
    node.style.background = shape.color;
    node.textContent = shape.id;
    node.title = `選取 ${shape.id}`;
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      selected = shape.id;
      render();
    });
    stage.append(node);
  }

  trail.replaceChildren();
  for (const label of history.trail) {
    const li = document.createElement('li');
    li.textContent = label;
    trail.append(li);
  }

  undoBtn.disabled = !history.canUndo;
  redoBtn.disabled = !history.canRedo;

  const needsSelection = selected === null || !drawing.has(selected);
  if (needsSelection) selected = null;
  moveBtn.disabled = needsSelection;
  colorBtn.disabled = needsSelection;
  clearBtn.disabled = drawing.size === 0;

  hint.textContent = selected
    ? `已選取 ${selected}`
    : drawing.size === 0
      ? '點畫布空白處新增圖形'
      : '點一個圖形來選取它';
}

function run(command: Command): void {
  history.run(command);
  render();
}

stage.addEventListener('click', (event) => {
  if (event.target !== stage) return;
  const box = stage.getBoundingClientRect();
  counter += 1;
  run(
    new AddShape(drawing, {
      id: `#${counter}`,
      // Keep the shape fully inside the stage; 44 is the shape size in CSS
      x: Math.min(Math.max(event.clientX - box.left - 22, 0), box.width - 44),
      y: Math.min(Math.max(event.clientY - box.top - 22, 0), box.height - 44),
      color: pick(COLORS),
    }),
  );
});

moveBtn.addEventListener('click', () => {
  if (!selected) return;
  const box = stage.getBoundingClientRect();
  run(
    new MoveShape(drawing, selected, {
      x: Math.random() * (box.width - 44),
      y: Math.random() * (box.height - 44),
    }),
  );
});

colorBtn.addEventListener('click', () => {
  if (!selected) return;
  const current = drawing.get(selected).color;
  const others = COLORS.filter((c) => c !== current);
  run(new RecolorShape(drawing, selected, pick(others)));
});

clearBtn.addEventListener('click', () => {
  run(new ClearAll(drawing));
});

undoBtn.addEventListener('click', () => {
  history.undo();
  render();
});

redoBtn.addEventListener('click', () => {
  history.redo();
  render();
});

document.addEventListener('keydown', (event) => {
  if (!event.ctrlKey && !event.metaKey) return;
  if (event.key === 'z' && !event.shiftKey) {
    event.preventDefault();
    history.undo();
    render();
  } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
    event.preventDefault();
    history.redo();
    render();
  }
});

render();
