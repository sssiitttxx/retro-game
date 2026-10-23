import Team from './Team';
/**
 * Формирует экземпляр персонажа из массива allowedTypes со
 * случайным уровнем от 1 до maxLevel
 *
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @returns генератор, который при каждом вызове
 * возвращает новый экземпляр класса персонажа
 *
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  if (!Array.isArray(allowedTypes) || allowedTypes.length === 0) {
    throw new Error('Нужен непустой массив классов');
  }
  if (typeof maxLevel !== 'number' || maxLevel < 1) {
    throw new Error('maxLevel должен быть числом >=1');
  }
  while (true) {
    const RandomClass = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    const level = Math.floor(Math.random() * maxLevel) + 1;
    yield new RandomClass(level);
  }
}

/**
 * Формирует массив персонажей на основе characterGenerator
 * @param allowedTypes массив классов
 * @param maxLevel максимальный возможный уровень персонажа
 * @param characterCount количество персонажей, которое нужно сформировать
 *
 * @returns экземпляр Team, хранящий экземпляры персонажей.
 * Количество персонажей в команде - characterCount
 */

export function generateTeam(allowedTypes, maxLevel, characterCount) {
  const generator = characterGenerator(allowedTypes, maxLevel);
  const characters = [];
  for (let index = 0; index < characterCount; index += 1) {
    characters.push(generator.next().value);
  }
  return new Team(characters);
}
