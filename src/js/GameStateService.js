export default class GameStateService {
  constructor(storage) {
    this.storage = storage;
  }

  save(state) {
    try {
      const stringified = JSON.stringify(state);
      this.storage.setItem('state', stringified);
    } catch (e) {
      throw new Error(`Не удалось сохранить игру: ${e.message}`);
    }
  }

  load() {
    try {
      const rawstate = this.storage.getItem('state');
      if (!rawstate) {
        throw new Error('Сохранений. не найдено');
      }
      return JSON.parse(rawstate);
    } catch (e) {
      throw new Error(`Не удалось загрузить игру${e.massage}`);
    }
  }
}
