// MST-алгоритм для адаптивного тестирования
// Вставить в админке: раздел «Алгоритм»
//
// previousAnswers — массив предыдущих ответов в текущей теме:
//   [{ itemId: string, b: number, se: number, isCorrect: boolean }, ...]
//
// remainingItems — оставшиеся задания (ещё не показанные):
//   [{ id, topic_id, b, se, ... }, ...]
//
// Верните один элемент из remainingItems или null.

// --- Настройки ---
var EASY_THRESHOLD = -0.7;
var HARD_THRESHOLD = 0.7;
var ITEMS_PER_STAGE = 2;
var TOTAL_ITEMS = 6; // 3 этапа по 2 задания

// --- Вспомогательные функции ---

// Разбить массив заданий на группы сложности
function classifyItems(items) {
  var easy = [];
  var medium = [];
  var hard = [];
  for (var i = 0; i < items.length; i++) {
    if (items[i].b < EASY_THRESHOLD) {
      easy.push(items[i]);
    } else if (items[i].b > HARD_THRESHOLD) {
      hard.push(items[i]);
    } else {
      medium.push(items[i]);
    }
  }
  return { easy: easy, medium: medium, hard: hard };
}

// Средняя арифметическая b группы
function meanB(items) {
  if (items.length === 0) return 0;
  var sum = 0;
  for (var i = 0; i < items.length; i++) {
    sum += items[i].b;
  }
  return sum / items.length;
}

// Найти ближайшее задание по b из массива
function closestByB(items, targetB) {
  if (items.length === 0) return null;
  var best = items[0];
  var bestDist = Math.abs(items[0].b - targetB);
  for (var i = 1; i < items.length; i++) {
    var dist = Math.abs(items[i].b - targetB);
    if (dist < bestDist) {
      best = items[i];
      bestDist = dist;
    }
  }
  return best;
}

// Случайный элемент из массива
function randomItem(items) {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

// --- Основной алгоритм ---

// Все задания темы = уже показанные + оставшиеся
// Для расчёта средних b по группам берём ВСЕ задания темы
var allTopicItems = previousAnswers
  .map(function(a) { return { id: a.itemId, b: a.b, se: a.se }; })
  .concat(remainingItems);

var groups = classifyItems(allTopicItems);
var meanEasy = meanB(groups.easy);
var meanMedium = meanB(groups.medium);
var meanHard = meanB(groups.hard);

// Если заданий нет — завершаем
if (remainingItems.length === 0) return null;

// Завершаем тему после 6 заданий
var answeredCount = previousAnswers.length;
if (answeredCount >= TOTAL_ITEMS) return null;

// Определяем текущий этап (0, 1, 2)
var stage = Math.floor(answeredCount / ITEMS_PER_STAGE);

// Определяем какое задание нужно на текущем этапе
var targetB = null;
var targetGroup = null;

if (stage === 0) {
  // Этап 1: два задания из средней группы
  targetB = meanMedium;
  targetGroup = 'medium';

} else if (stage === 1) {
  // Этап 2: зависит от результатов этапа 1
  var stage1Answers = previousAnswers.slice(0, ITEMS_PER_STAGE);
  var correctCount = 0;
  for (var i = 0; i < stage1Answers.length; i++) {
    if (stage1Answers[i].isCorrect) correctCount++;
  }

  if (correctCount === ITEMS_PER_STAGE) {
    // Оба верно — тяжёлые
    targetB = meanHard;
    targetGroup = 'hard';
  } else if (correctCount === 0) {
    // Оба неверно — лёгкие
    targetB = meanEasy;
    targetGroup = 'easy';
  } else {
    // Один верно, один неверно — приближенные к средней сложности
    targetB = meanMedium;
    targetGroup = 'medium';
  }

} else {
  // Этап 3: любые оставшиеся задания (случайные)
  return randomItem(remainingItems);
}

// Выбираем задание: ближайшее по b к целевому значению из оставшихся
return closestByB(remainingItems, targetB);
