import type { Item, PreviousAnswer } from '../types';
import { makeItem, makeAnswer } from './mst-test-utils';

export interface TestScenario {
  name: string;
  description: string;
  previousAnswers: PreviousAnswer[];
  remainingItems: Item[];
  expectedBehavior: string;
}

export const PRESET_SCENARIOS: TestScenario[] = [
  {
    name: 'Этап 1: начало темы',
    description: 'Ещё нет ответов — алгоритм должен выбрать задание средней сложности',
    previousAnswers: [],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -1.0, 'Лёгкое 2'),
      makeItem('m1', -0.3, 'Среднее 1'),
      makeItem('m2', 0.0, 'Среднее 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
      makeItem('h1', 1.0, 'Тяжёлое 1'),
      makeItem('h2', 1.8, 'Тяжёлое 2'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Должно быть выбрано задание из средней группы (b от -0.7 до 0.7)',
  },
  {
    name: 'Этап 2: оба верно → тяжёлые',
    description: '2 средних задания решены верно — алгоритм должен выбрать тяжёлое',
    previousAnswers: [
      makeAnswer('m1', 0.0, true),
      makeAnswer('m2', 0.3, true),
    ],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -1.0, 'Лёгкое 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
      makeItem('h1', 1.0, 'Тяжёлое 1'),
      makeItem('h2', 1.8, 'Тяжёлое 2'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Должно быть выбрано задание из тяжёлой группы (b > 0.7)',
  },
  {
    name: 'Этап 2: оба неверно → лёгкие',
    description: '2 средних задания решены неверно — алгоритм должен выбрать лёгкое',
    previousAnswers: [
      makeAnswer('m1', -0.2, false),
      makeAnswer('m2', 0.4, false),
    ],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -1.0, 'Лёгкое 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
      makeItem('h1', 1.0, 'Тяжёлое 1'),
      makeItem('h2', 1.8, 'Тяжёлое 2'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Должно быть выбрано задание из лёгкой группы (b < -0.7)',
  },
  {
    name: 'Этап 2: одно верно, одно неверно → средние',
    description: '1 верно + 1 неверно — алгоритм должен выбрать ближайшее к средней b',
    previousAnswers: [
      makeAnswer('m1', -0.1, true),
      makeAnswer('m2', 0.5, false),
    ],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -1.0, 'Лёгкое 2'),
      makeItem('m3', 0.6, 'Среднее 3'),
      makeItem('h1', 1.0, 'Тяжёлое 1'),
      makeItem('h2', 1.8, 'Тяжёлое 2'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Должно быть выбрано задание, ближайшее к средней b средней группы',
  },
  {
    name: 'Этап 3: случайное задание',
    description: '4 ответа уже дано — алгоритм должен выбрать любое оставшееся',
    previousAnswers: [
      makeAnswer('m1', 0.0, true),
      makeAnswer('m2', 0.3, true),
      makeAnswer('h1', 1.0, true),
      makeAnswer('h2', 1.8, false),
    ],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -1.0, 'Лёгкое 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Любое из оставшихся заданий (этап 3 — случайный выбор)',
  },
  {
    name: 'Тема завершена (6 ответов)',
    description: '6 ответов уже дано — алгоритм должен вернуть null',
    previousAnswers: [
      makeAnswer('m1', 0.0, true),
      makeAnswer('m2', 0.3, false),
      makeAnswer('m3', 0.5, true),
      makeAnswer('e1', -1.0, true),
      makeAnswer('h1', 1.0, false),
      makeAnswer('h2', 1.8, true),
    ],
    remainingItems: [
      makeItem('e2', -1.5, 'Лёгкое 2'),
      makeItem('h3', 2.5, 'Тяжёлое 3'),
    ],
    expectedBehavior: 'Должен вернуть null — тема завершена',
  },
  {
    name: 'Fallback: нет заданий в нужной группе',
    description: 'Оба верно, но тяжёлых заданий нет — должен взять ближайшее по b',
    previousAnswers: [
      makeAnswer('m1', 0.0, true),
      makeAnswer('m2', 0.3, true),
    ],
    remainingItems: [
      makeItem('e1', -1.5, 'Лёгкое 1'),
      makeItem('e2', -0.9, 'Лёгкое 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
      makeItem('m4', 0.6, 'Среднее 4'),
    ],
    expectedBehavior: 'Нет тяжёлых → должен выбрать ближайшее к средней b тяжёлой группы (среднее 3 или 4)',
  },
  {
    name: 'Мало заданий: только 3 осталось',
    description: 'Этап 1, но в теме всего 3 задания (все средние)',
    previousAnswers: [],
    remainingItems: [
      makeItem('m1', -0.3, 'Среднее 1'),
      makeItem('m2', 0.1, 'Среднее 2'),
      makeItem('m3', 0.5, 'Среднее 3'),
    ],
    expectedBehavior: 'Должен выбрать одно из средних заданий',
  },
  {
    name: 'Пустой remainingItems',
    description: 'Нет заданий — алгоритм должен вернуть null',
    previousAnswers: [makeAnswer('m1', 0.0, true)],
    remainingItems: [],
    expectedBehavior: 'Должен вернуть null',
  },
];

export interface SimulationStep {
  step: number;
  stage: number;
  selectedItem: Item | null;
  isCorrect: boolean | null;
  previousAnswers: PreviousAnswer[];
  remainingBefore: Item[];
}

export function runSimulation(
  fn: (prev: PreviousAnswer[], remaining: Item[]) => Item | null,
  allItems: Item[],
  correctPattern: boolean[],
): SimulationStep[] {
  const steps: SimulationStep[] = [];
  const answers: PreviousAnswer[] = [];
  let remaining = [...allItems];

  for (let i = 0; i < 6; i++) {
    const stage = Math.floor(i / 2);
    const prevSnapshot = [...answers];
    const remainingSnapshot = [...remaining];

    let selected: Item | null = null;
    try {
      selected = fn(prevSnapshot, remaining);
    } catch {
      selected = null;
    }

    if (!selected || !remaining.some((it) => it.id === selected!.id)) {
      steps.push({
        step: i + 1,
        stage: stage + 1,
        selectedItem: null,
        isCorrect: null,
        previousAnswers: prevSnapshot,
        remainingBefore: remainingSnapshot,
      });
      break;
    }

    const isCorrect = correctPattern[i] ?? false;
    steps.push({
      step: i + 1,
      stage: stage + 1,
      selectedItem: selected,
      isCorrect,
      previousAnswers: prevSnapshot,
      remainingBefore: remainingSnapshot,
    });

    answers.push({ itemId: selected.id, b: selected.b, se: selected.se, isCorrect });
    remaining = remaining.filter((it) => it.id !== selected!.id);
  }

  return steps;
}
