import RANGES from './ranges';

/**
 * @todo
 * @param index - индекс поля
 * @param boardSize - размер квадратного поля (в длину или ширину)
 * @returns строка - тип ячейки на поле:
 *
 * top-left
 * top-right
 * top
 * bottom-left
 * bottom-right
 * bottom
 * right
 * left
 * center
 *
 * @example
 * ```js
 * calcTileType(0, 8); // 'top-left'
 * calcTileType(1, 8); // 'top'
 * calcTileType(63, 8); // 'bottom-right'
 * calcTileType(7, 7); // 'left'
 * ```
 * */
export function calcTileType(index, boardSize) {
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;

  if (row === 0 && col === 0) return 'top-left';
  if (row === 0 && col === boardSize - 1) return 'top-right';
  if (row === 0) return 'top';
  if (row === boardSize - 1 && col === 0) return 'bottom-left';
  if (row === boardSize - 1 && col === boardSize - 1) return 'bottom-right';
  if (row === boardSize - 1) return 'bottom';
  if (col === 0) return 'left';
  if (col === boardSize - 1) return 'right';
  return 'center';
}

export function formatInfo(character) {
  return `🎖${character.level} ⚔${character.attack} 🛡${character.defence} ❤${character.health}`;
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}

export function getDistance(index1, index2, boardSize) {
  const row1 = Math.floor(index1 / boardSize);
  const row2 = Math.floor(index2 / boardSize);
  const col1 = index1 % boardSize;
  const col2 = index2 % boardSize;

  const dr = Math.abs(row1 - row2);
  const dc = Math.abs(col1 - col2);

  return Math.max(dr, dc);
}

export function canMove(pc, targetIndex, boardSize) {
  const distance = getDistance(pc.position, targetIndex, boardSize);
  const range = RANGES[pc.character.type].move;

  if (distance === 0) return false;
  if (distance > range) return false;

  const row1 = Math.floor(pc.position / boardSize);
  const col1 = pc.position % boardSize;
  const row2 = Math.floor(targetIndex / boardSize);
  const col2 = targetIndex % boardSize;

  const dr = Math.abs(row1 - row2);
  const dc = Math.abs(col1 - col2);

  return dr === 0 || dc === 0 || dr === dc;
}
export function canAttack(attacker, target, boardSize) {
  const distance = getDistance(attacker.position, target.position, boardSize);
  const range = RANGES[attacker.character.type].attack;
  if (distance === 0) return false;
  return distance <= range;
}
