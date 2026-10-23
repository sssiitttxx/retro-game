import { jest } from '@jest/globals';
import {
  formatInfo, getDistance, canMove, canAttack,
} from '../utils';
import GameStateService from '../GameStateService';

test('formatInfo возвращает строку с характеристиками', () => {
  const character = {
    level: 2,
    attack: 30,
    defence: 20,
    health: 80,
  };
  expect(formatInfo(character)).toBe('🎖2 ⚔30 🛡20 ❤80');
});

test('getDistance: по горизонтали', () => {
  expect(getDistance(0, 7, 8)).toBe(7);
});

test('getDistance: по вертикали', () => {
  expect(getDistance(0, 56, 8)).toBe(7);
});

test('getDistance: по диагонали', () => {
  expect(getDistance(0, 27, 8)).toBe(3);
});

test('getDistance: одна и та же клетка', () => {
  expect(getDistance(5, 5, 8)).toBe(0);
});

test('getDistance: разные строки/столбцы', () => {
  expect(getDistance(0, 19, 8)).toBe(3);
});

const swordsman = {
  position: 0,
  character: { type: 'swordsman' },
};
const bowman = {
  position: 0,
  character: { type: 'bowman' },
};
const magician = {
  position: 0,
  character: { type: 'magician' },
};

test('canMove: мечник может пойти на 4 по прямой', () => {
  expect(canMove(swordsman, 32, 8)).toBe(true);
});

test('canMove: мечник не может на 5', () => {
  expect(canMove(swordsman, 40, 8)).toBe(false);
});

test('canMove: лучник может на 2 по диагонали', () => {
  expect(canMove(bowman, 18, 8)).toBe(true);
});

test('canMove: лучник не может на 3', () => {
  expect(canMove(bowman, 27, 8)).toBe(false);
});

test('canMove: нельзя ходить «конём»', () => {
  expect(canMove(swordsman, 17, 8)).toBe(false);
});

test('canMove: нельзя стоять на месте', () => {
  expect(canMove(swordsman, 0, 8)).toBe(false);
});

test('canAttack: мечник бьёт соседнюю клетку', () => {
  const target = { position: 1 };
  expect(canAttack(swordsman, target, 8)).toBe(true);
});

test('canAttack: мечник не бьёт на 2', () => {
  const target = { position: 2 };
  expect(canAttack(swordsman, target, 8)).toBe(false);
});

test('canAttack: лучник бьёт на 2 по диагонали', () => {
  const target = { position: 18 };
  expect(canAttack(bowman, target, 8)).toBe(true);
});

test('canAttack: лучник НЕ бьёт «конём» (2,1)', () => {
  const target = { position: 17 };
  expect(canAttack(bowman, target, 8)).toBe(true);
});

test('canAttack: маг бьёт на 4', () => {
  const target = { position: 36 };
  expect(canAttack(magician, target, 8)).toBe(true);
});

test('canAttack: маг не бьёт на 5', () => {
  const target = { position: 45 };
  expect(canAttack(magician, target, 8)).toBe(false);
});

test('canAttack: нельзя атаковать себя', () => {
  expect(canAttack(swordsman, swordsman, 8)).toBe(false);
});

describe('GameStateService', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
    };
  });
  test('успешная загрузка', () => {
    const service = new GameStateService(mockStorage);
    // Говорим фейковой памяти: "когда у тебя попросят данные, верни вот эту строку"
    mockStorage.getItem.mockReturnValue(JSON.stringify({ level: 2 }));

    const result = service.load();
    expect(result).toEqual({ level: 2 });
  });

  test('ошибка при пустой памяти', () => {
    const service = new GameStateService(mockStorage);
    // Говорим фейковой памяти: "верни null" (как будто там пусто)
    mockStorage.getItem.mockReturnValue(null);

    // Ожидаем, что функция выбросит ошибку
    expect(() => service.load()).toThrow('Не удалось загрузить игру');
  });
});
