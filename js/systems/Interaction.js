export class Interaction {
  constructor() { this.target = null; }

  update(game) {
    this.target = game.map.findNearestInteractable(game.player, game, 55);
    return this.target;
  }

  activate(game) {
    const target = this.update(game);
    if (!target) { game.toast("Nada ao alcance."); return; }
    if (target.kind === "item") return this.#collect(game, target);
    if (target.kind === "document") {
      game.map.readDocuments.add(target.id);
      game.audio.play("interact");
      game.ui.showDocument(target, target.alreadyRead);
      game.autosave();
      return;
    }
    if (target.kind === "door") {
      const result = game.map.interactDoor(target, game.inventory, game.flags);
      if (result.ok) {
        game.audio.play("door");
        game.emitNoise(game.player, 185);
        game.toast(result.message);
        game.autosave();
      } else {
        game.audio.play("error");
        game.toast(result.message, "warning");
      }
      return;
    }
    if (target.kind === "panel") return this.#generator(game);
    if (target.kind === "receiver") {
      game.audio.play("interact");
      game.ui.showRadioPuzzle((answer) => game.solveRadio(answer));
      return;
    }
    if (target.kind === "exit") {
      game.win();
      return;
    }
    if (target.kind === "secret") {
      const found = game.map.revealPantry();
      if (found) {
        game.audio.play("door");
        game.emitNoise(game.player, 140);
        game.toast("Sob o sal, uma emenda. A porta da despensa aparece.");
        game.autosave();
      }
    }
  }

  #collect(game, item) {
    if (!game.inventory.add(item.id)) { game.toast("Você já guardou este objeto."); return; }
    game.map.collected.add(item.id);
    game.audio.play("pickup");
    game.emitNoise(game.player, 75);
    game.toast(`Guardado: ${item.name}.`);
    game.updateObjective();
    game.autosave();
  }

  #generator(game) {
    if (!game.flags.fuseInstalled) {
      if (!game.inventory.has("fuse")) {
        game.toast("O encaixe está vazio. Falta um fusível cerâmico.", "warning");
        game.audio.play("error");
        return;
      }
      game.inventory.remove("fuse");
      game.flags.fuseInstalled = true;
      game.audio.play("interact");
      game.emitNoise(game.player, 95);
      game.toast("O fusível encaixou. Puxe a alavanca para ligar o motor.");
      game.updateObjective();
      game.autosave();
      return;
    }
    if (!game.flags.generatorPowered) {
      game.flags.generatorPowered = true;
      game.enemy.stateTimer = 0;
      game.audio.play("power");
      game.emitNoise(game.player, 370);
      game.toast("O gerador acorda. Algo responde do outro lado do prédio.", "warning");
      game.setCheckpoint(game.player);
      game.updateObjective();
      game.autosave();
      return;
    }
    game.audio.play("interact");
    game.toast("O motor está em marcha. A saída de rádio deve ter destravado.");
  }
}
