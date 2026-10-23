import themes from './themes';
import { generateTeam } from './generators';
import Bowman from './characters/Bowman';
import Swordsman from './characters/Swordsman';
import Magician from './characters/Magician';
import Vampire from './characters/Vampire';
import Undead from './characters/Undead';
import Daemon from './characters/Daemon';
import PositionedCharacter from './PositionedCharacter';
import GameState from './GameState';
import cursors from './cursors';
import { formatInfo, canMove, canAttack } from './utils';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.onCellEnter = this.onCellEnter.bind(this);
    this.onCellLeave = this.onCellLeave.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.onSaveGame = this.onSaveGame.bind(this);
    this.onLoadGame = this.onLoadGame.bind(this);
  }

  init() {
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addNewGameListener(this.onNewGame);
    this.gamePlay.addSaveGameListener(this.onSaveGame);
    this.gamePlay.addLoadGameListener(this.onLoadGame);

    try {
      const loadedData = this.stateService.load();
      this.state = GameState.from(loadedData);
      this.positionedCharacters = this.state.positionedCharacters;

      const themesByLevel = {
        1: themes.prairie,
        2: themes.desert,
        3: themes.arctic,
        4: themes.mountain,
      };
      this.gamePlay.drawUi(themesByLevel[this.state.level]);

      this.gamePlay.redrawPositions(this.positionedCharacters);
    } catch (e) {
      console.log(e.message);
      this.startGame();
    }
  }

  startGame() {
    this.state = new GameState();
    this.selectedCharacter = null;
    this.gamePlay.drawUi(themes.prairie);

    const boardSize = 8;
    const playerTypes = [Bowman, Swordsman, Magician];
    const rivalTypes = [Vampire, Undead, Daemon];

    const playerTeam = generateTeam(playerTypes, 1, 4);
    const rivalTeam = generateTeam(rivalTypes, 1, 4);

    const playerPositions = [];
    const rivalPositions = [];
    for (let row = 0; row < boardSize; row += 1) {
      playerPositions.push(row * boardSize);
      playerPositions.push(row * boardSize + 1);
      rivalPositions.push(row * boardSize + (boardSize - 2));
      rivalPositions.push(row * boardSize + (boardSize - 1));
    }

    const placeTeam = (team, positions) => {
      const result = [];
      const free = [...positions];
      team.characters.forEach((character) => {
        const idx = Math.floor(Math.random() * free.length);
        const position = free[idx];
        free.splice(idx, 1);
        result.push(new PositionedCharacter(character, position));
      });
      return result;
    };

    this.positionedCharacters = [
      ...placeTeam(playerTeam, playerPositions),
      ...placeTeam(rivalTeam, rivalPositions),
    ];

    this.state.positionedCharacters = this.positionedCharacters;
    this.gamePlay.redrawPositions(this.positionedCharacters);
  }

  onSaveGame() {
    try {
      this.state.positionedCharacters = this.positionedCharacters;

      this.stateService.save(this.state);
      this.gamePlay.showMessage('Игра сохранена');
    } catch (e) {
      this.gamePlay.showError(e.message);
    }
  }

  onLoadGame() {
    try {
      const loadedData = this.stateService.load();
      this.state = GameState.from(loadedData);
      this.positionedCharacters = this.state.positionedCharacters;
      this.selectedCharacter = null;
      const themesByLevel = {
        1: themes.prairie,
        2: themes.desert,
        3: themes.arctic,
        4: themes.mountain,
      };
      this.gamePlay.drawUi(themesByLevel[this.state.level]);
      this.gamePlay.redrawPositions(this.positionedCharacters);

      this.gamePlay.showMessage('Игра загружена!');
    } catch (e) {
      this.gamePlay.showError(e.message);
    }
  }

  onNewGame() {
    const savedMaxScore = this.state.maxScore;
    this.startGame();
    this.state.maxScore = savedMaxScore;
  }

  isDefeat() {
    const player = this.positionedCharacters.filter((pc) =>
      ['bowman', 'swordsman', 'magician'].includes(pc.character.type),
    );
    return player.length === 0;
  }

  gameOver() {
    this.state.isGameOver = true;
    this.state.maxScore = Math.max(this.state.maxScore, this.state.score);
    this.gamePlay.showError(
      `Игра окончена! Счет: ${this.state.score}. Рекорд: ${this.state.maxScore}`,
    );
  }

  moveCharacter(character, targetIndex) {
    this.gamePlay.deselectCell(character.position);
    character.position = targetIndex;
    this.gamePlay.deselectCell(targetIndex);
    this.selectedCharacter = null;
    this.gamePlay.redrawPositions(this.positionedCharacters);
    this.state.toggleTurn();
  }

  computerTurn() {
    const boardSize = 8;
    const playerTypes = ['bowman', 'swordsman', 'magician'];
    const enemyCharacters = this.positionedCharacters.filter((pc) =>
      playerTypes.includes(pc.character.type),
    );
    const alliesCharacters = this.positionedCharacters.filter(
      (pc) => !playerTypes.includes(pc.character.type),
    );

    for (const ally of alliesCharacters) {
      for (const enemy of enemyCharacters) {
        if (canAttack(ally, enemy, boardSize)) {
          this.attackCharacter(ally, enemy);
          return;
        }
      }
    }

    this.state.toggleTurn();
  }

  async onCellClick(index) {
    if (this.state.isGameOver) return;
    const boardSize = 8;
    const playerTypes = ['bowman', 'swordsman', 'magician'];

    if (this.state.currentPlayer !== 'player') {
      return;
    }
    const pc = this.positionedCharacters.find((p) => p.position === index);

    if (!pc) {
      if (
        this.selectedCharacter
        && canMove(this.selectedCharacter, index, boardSize)
      ) {
        this.moveCharacter(this.selectedCharacter, index);
        this.computerTurn();
        return;
      }
      this.gamePlay.showError('Сюда нельзя ходить');
      return;
    }
    const isPlayerChar = playerTypes.includes(pc.character.type);
    if (isPlayerChar) {
      if (this.selectedCharacter) {
        this.gamePlay.deselectCell(this.selectedCharacter.position);
      }
      this.gamePlay.selectCell(pc.position);
      this.selectedCharacter = pc;
      return;
    }

    if (
      this.selectedCharacter
      && canAttack(this.selectedCharacter, pc, boardSize)
    ) {
      await this.attackCharacter(this.selectedCharacter, pc);
      this.computerTurn();
      return;
    }
    this.gamePlay.showError('Вне радиуса атаки');
  }

  async attackCharacter(attacker, target) {
    const damage = Math.max(
      attacker.character.attack - target.character.defence,
      attacker.character.attack * 0.1,
    );

    target.character.health -= damage;

    this.gamePlay.deselectCell(attacker.position);
    this.selectedCharacter = null;

    await this.gamePlay.showDamage(target.position, damage);
    if (target.character.health <= 0) {
      this.positionedCharacters = this.positionedCharacters.filter(
        (pc) => pc !== target,
      );
      if (
        !['bowman', 'swordsman', 'magician'].includes(target.character.type)
      ) {
        this.state.score += 10;
      }
    }
    this.gamePlay.redrawPositions(this.positionedCharacters);

    if (this.isVictory()) {
      await this.nextLevel();
      return;
    }

    if (this.isDefeat()) {
      this.gameOver();
      return;
    }

    this.state.toggleTurn();
  }

  onCellEnter(index) {
    if (this.state.isGameOver) return;
    const boardSize = 8;
    const playerTypes = ['bowman', 'swordsman', 'magician'];

    const pc = this.positionedCharacters.find((p) => p.position === index);
    if (pc) {
      this.gamePlay.showCellTooltip(formatInfo(pc.character), index);
    }
    if (!this.selectedCharacter) {
      if (pc && playerTypes.includes(pc.character.type)) {
        this.gamePlay.setCursor(cursors.pointer);
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
      return;
    }
    const isPlayerChar = pc && playerTypes.includes(pc.character.type);
    const isEnemyChar = pc && !playerTypes.includes(pc.character.type);

    if (isPlayerChar) {
      this.gamePlay.setCursor(cursors.pointer);
      return;
    }
    if (isEnemyChar) {
      if (canAttack(this.selectedCharacter, pc, boardSize)) {
        this.gamePlay.setCursor(cursors.crosshair);
        this.gamePlay.selectCell(index, 'red');
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
      return;
    }

    if (!pc) {
      if (canMove(this.selectedCharacter, index, boardSize)) {
        this.gamePlay.setCursor(cursors.pointer);
        this.gamePlay.selectCell(index, 'green');
      } else {
        this.gamePlay.setCursor(cursors.notallowed);
      }
    }
  }

  onCellLeave(index) {
    this.gamePlay.hideCellTooltip(index);
    this.gamePlay.setCursor('default');

    const cell = this.gamePlay.cells[index];
    if (
      cell
      && (cell.classList.contains('selected-green')
        || cell.classList.contains('selected-red'))
    ) {
      this.gamePlay.deselectCell(index);
    }
  }

  isVictory() {
    const enemies = this.positionedCharacters.filter((pc) =>
      ['vampire', 'undead', 'daemon'].includes(pc.character.type),
    );
    return enemies.length === 0;
  }

  async nextLevel() {
    this.state.level += 1;
    if (this.state.level > 4) {
      this.state.isGameOver = true;
      this.state.maxScore = Math.max(this.state.maxScore, this.state.score);
      this.gamePlay.showError('Все 4 уровня пройдены. Игра завершена!');
      return;
    }
    this.positionedCharacters
      .filter((pc) =>
        ['bowman', 'swordsman', 'magician'].includes(pc.character.type),
      )
      .forEach((pc) => pc.character.levelUp());

    const themeByLevel = {
      1: themes.prairie,
      2: themes.desert,
      3: themes.arctic,
      4: themes.mountain,
    };

    this.gamePlay.drawUi(themeByLevel[this.state.level]);
    await this.startNewLevel();
  }

  async startNewLevel() {
    const boardSize = 8;
    const playerTypes = ['bowman', 'swordsman', 'magician'];

    const survivingPlayers = this.positionedCharacters.filter((pc) =>
      playerTypes.includes(pc.character.type),
    );

    const rivalTypes = [Vampire, Undead, Daemon];
    const rivalTeam = generateTeam(rivalTypes, this.state.level, 4);

    const playerPositions = [];
    const rivalPositions = [];
    for (let row = 0; row < boardSize; row += 1) {
      playerPositions.push(row * boardSize);
      playerPositions.push(row * boardSize + 1);

      rivalPositions.push(row * boardSize + (boardSize - 2));
      rivalPositions.push(row * boardSize + (boardSize - 1));
    }
    const placeExisting = (existing, positions) => {
      const result = [];
      const free = [...positions];
      existing.forEach((pc) => {
        const idx = Math.floor(Math.random() * free.length);
        pc.position = free[idx];
        free.splice(idx, 1);
        result.push(pc);
      });
      return result;
    };

    const placeNewTeam = (team, positions) => {
      const result = [];
      const free = [...positions];
      team.characters.forEach((character) => {
        const idx = Math.floor(Math.random() * free.length);
        result.push(new PositionedCharacter(character, free[idx]));
        free.splice(idx, 1);
      });
      return result;
    };
    this.positionedCharacters = [
      ...placeExisting(survivingPlayers, playerPositions),
      ...placeNewTeam(rivalTeam, rivalPositions),
    ];
    this.selectedCharacter = null;
    this.state.currentPlayer = 'player';

    this.gamePlay.redrawPositions(this.positionedCharacters);
  }
}
