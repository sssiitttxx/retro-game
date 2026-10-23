import Bowman from "./characters/Bowman";
import Swordsman from "./characters/Swordsman";
import Magician from "./characters/Magician";
import Vampire from "./characters/Vampire";
import Undead from "./characters/Undead";
import Daemon from "./characters/Daemon";
import PositionedCharacter from "./PositionedCharacter";

const typeToClass = {
  bowman: Bowman,
  swordsman: Swordsman,
  magician: Magician,
  vampire: Vampire,
  undead: Undead,
  daemon: Daemon,
};

export default class GameState {
  constructor() {
    this.currentPlayer = "player";
    this.level = 1;
    this.score = 0;
    this.maxScore = 0;
    this.isGameOver = false;
    this.positionedCharacters = [];
  }

  static from(object) {
    const state = new GameState();
    state.currentPlayer = object.currentPlayer;
    state.level = object.level
    state.score = object.score;
    state.maxScore = object.maxScore;
    state.isGameOver = object.isGameOver;
    

    if(object.positionedCharacters) {
      state.positionedCharacters = object.positionedCharacters.map((pc) => {
        const characterClass = typeToClass[pc.character.type];
        const character = new characterClass(1);
        character.level = pc.character.level;
        character.attack = pc.character.attack;
        character.defence = pc.character.defence;
        character.health = pc.character.health;

        return new PositionedCharacter(character, pc.position)
      });
    }
    return state;
  }

  toggleTurn() {
    this.currentPlayer = this.currentPlayer === "player" ? "enemy" : "player";
  }
}
