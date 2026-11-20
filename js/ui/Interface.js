function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export class Interface {
  constructor() {
    this.layer = document.getElementById("screen-layer");
    this.modalRoot = document.getElementById("modal-root");
    this.hud = document.getElementById("hud");
    this.toastNode = document.getElementById("toast");
    this.toastTimer = null;
    this.game = null;
    this.layer.addEventListener("click", (event) => this.#handleScreenClick(event));
    this.modalRoot.addEventListener("click", (event) => this.#handleModalClick(event));
    this.modalRoot.addEventListener("submit", (event) => this.#handleSubmit(event));
    this.modalRoot.addEventListener("input", (event) => this.#handleSettingInput(event));
  }

  connect(game) { this.game = game; }

  showTitle(canContinue, notice = "") {
    this.currentScreen = "title";
    this.hud.classList.add("is-hidden");
    this.setTouchActive(false);
    this.layer.innerHTML = `<section class="screen-card" aria-labelledby="title-name">
      <p class="eyebrow">CASA SALINA · ARQUIVO 03</p><h1 class="screen-title" id="title-name">SINAL<br>DE CINZA</h1>
      <p class="screen-subtitle">A maré subiu. O rádio ainda chama.</p>
      <p class="screen-copy">Uma tempestade cortou a estrada. No sanatório, a luz caiu há anos — mas há um sinal no transmissor. Atravesse a Casa Salina, encontre sua origem e saia antes da próxima maré.</p>
      <div class="menu-actions"><button class="game-button primary" data-action="new">INICIAR NOVA PARTIDA</button><button class="game-button" data-action="continue" ${canContinue ? "" : "disabled"}>CONTINUAR</button><button class="game-button" data-action="settings">CONFIGURAÇÕES</button></div>
      <p class="menu-note">WASD ou setas para andar · E para interagir · F para a lanterna · ESC pausa · I abre a bolsa</p>
      ${notice ? `<p class="menu-note warning">${escapeHTML(notice)}</p>` : ""}
    </section>`;
    this.closeModal();
  }

  showPause() {
    this.currentScreen = "paused";
    this.layer.innerHTML = `<section class="screen-card"><p class="eyebrow">TEMPO SUSPENSO</p><h2 class="screen-title">PAUSA</h2><p class="screen-copy">O silêncio do lado de fora não é o mesmo que segurança.</p><div class="menu-actions"><button class="game-button primary" data-action="resume">RETOMAR</button><button class="game-button" data-action="inventory">INVENTÁRIO</button><button class="game-button" data-action="settings">CONFIGURAÇÕES</button><button class="game-button" data-action="title">SALVAR E VOLTAR AO MENU</button></div></section>`;
    this.closeModal();
    this.setTouchActive(false);
  }

  showSettings(settings) {
    this.showModal("Configurações", `<label class="setting-row"><span>Volume geral</span><input class="range-field" data-setting="master" aria-label="Volume geral" type="range" min="0" max="1" step="0.05" value="${settings.master}"></label>
      <label class="setting-row"><span>Ambiente</span><input class="range-field" data-setting="ambience" aria-label="Volume ambiente" type="range" min="0" max="1" step="0.05" value="${settings.ambience}"></label>
      <label class="setting-row"><span>Efeitos</span><input class="range-field" data-setting="effects" aria-label="Volume dos efeitos" type="range" min="0" max="1" step="0.05" value="${settings.effects}"></label>
      <label class="setting-row"><span>Reduzir efeitos visuais</span><input type="checkbox" data-setting="reducedMotion" ${settings.reducedMotion ? "checked" : ""}></label>
      <p class="screen-copy">O áudio começa após sua primeira ação, conforme as permissões do navegador. As preferências são guardadas neste dispositivo.</p>`, [{ label: "VOLTAR", action: "close" }, { label: "SALVAR", action: "settings-save", primary: true }]);
  }

  showInventory(items, documents = []) {
    const itemHTML = items.length ? items.map((item) => `<div class="inventory-item"><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.description)}</small>${["battery-cell", "med-kit"].includes(item.id) ? `<button class="game-button" data-use-item="${escapeHTML(item.id)}">USAR</button>` : ""}</div>`).join("") : `<p class="screen-copy">A bolsa está vazia.</p>`;
    const docsHTML = documents.length ? `<h3 class="eyebrow">DOCUMENTOS LIDOS</h3><div class="inventory-grid">${documents.map((doc) => `<div class="inventory-item">${escapeHTML(doc.name)}<small>Registro guardado na memória.</small></div>`).join("")}</div>` : "";
    this.showModal("Inventário", `<div class="inventory-grid">${itemHTML}</div>${docsHTML}<p class="menu-note">Chaves e peças necessárias são usadas automaticamente. Cargas e curativos podem ser usados daqui.</p>`, [{ label: "FECHAR · I", action: "close", primary: true }]);
  }

  showDocument(document, alreadyRead = false) {
    this.showModal(document.name, `<p class="modal-body">${escapeHTML(document.text)}</p>${alreadyRead ? `<p class="menu-note">Você já leu este registro.</p>` : ""}`, [{ label: "GUARDAR NA MEMÓRIA", action: "close", primary: true }]);
  }

  showRadioPuzzle(onSubmit) {
    this.onPuzzleSubmit = onSubmit;
    this.showModal("Transmissor de emergência", `<p class="modal-body">O seletor está coberto de ferrugem. Uma anotação de manutenção indica a frequência de estabilidade.</p><label class="field-label" for="frequency-input">FREQUÊNCIA · MHz</label><input class="text-field" id="frequency-input" name="frequency" type="text" inputmode="decimal" autocomplete="off" maxlength="6" placeholder="00,0" aria-label="Frequência de rádio">`, [{ label: "CANCELAR", action: "close" }, { label: "SINTONIZAR", action: "submit-frequency", primary: true }], true);
    document.getElementById("frequency-input")?.focus();
  }

  showDeath(onRetry) {
    this.currentScreen = "dead";
    this.hud.classList.add("is-hidden");
    this.setTouchActive(false);
    this.layer.innerHTML = `<section class="screen-card"><p class="eyebrow warning">SINAL PERDIDO</p><h2 class="screen-title">A CASA<br>FICOU QUIETA</h2><p class="screen-copy">O corredor volta a respirar. O último ponto seguro ainda existe — mas você não pode levar tudo consigo.</p><div class="menu-actions"><button class="game-button primary" data-action="checkpoint">RETOMAR DO CHECKPOINT</button><button class="game-button" data-action="title">VOLTAR AO MENU</button></div></section>`;
    this.retryHandler = onRetry;
    this.closeModal();
  }

  showVictory() {
    this.currentScreen = "won";
    this.hud.classList.add("is-hidden");
    this.setTouchActive(false);
    this.layer.innerHTML = `<section class="screen-card"><p class="eyebrow">TRANSMISSÃO RECEBIDA</p><h2 class="screen-title">A MARÉ<br>VAI BAIXAR</h2><p class="screen-copy">Do lado de fora, a chuva enfim parece chuva. O último sinal atravessa o estático e encontra alguém que responde.</p><div class="menu-actions"><button class="game-button primary" data-action="title">VOLTAR AO MENU</button></div><p class="menu-note">CASA SALINA · REGISTRO ENCERRADO</p></section>`;
    this.closeModal();
  }

  showModal(title, body, buttons = [{ label: "FECHAR", action: "close" }], form = false) {
    const actions = buttons.map((button) => `<button type="button" class="game-button ${button.primary ? "primary" : ""}" data-modal-action="${escapeHTML(button.action)}">${escapeHTML(button.label)}</button>`).join("");
    this.modalRoot.innerHTML = `<section class="modal-card" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">${form ? `<form id="modal-form">` : ""}<p class="eyebrow">CASA SALINA · ANOTAÇÃO</p><h2 class="modal-title">${escapeHTML(title)}</h2>${body}<div class="modal-actions">${actions}</div>${form ? `</form>` : ""}</section>`;
    this.currentModal = title;
  }

  closeModal() { this.modalRoot.innerHTML = ""; this.currentModal = null; this.onPuzzleSubmit = null; }
  get modalOpen() { return Boolean(this.currentModal); }

  updateHUD(player, objective, roomName, target) {
    this.hud.classList.remove("is-hidden");
    const pips = document.getElementById("health-pips");
    pips.innerHTML = Array.from({ length: player.maxHealth }, (_, index) => `<i class="pip ${index >= player.health ? "empty" : ""}"></i>`).join("");
    document.getElementById("battery-level").style.width = `${Math.max(0, player.battery)}%`;
    document.getElementById("battery-number").textContent = `${Math.round(player.battery)}%`;
    document.getElementById("objective-text").textContent = objective;
    document.getElementById("room-name").textContent = roomName;
    const hint = document.getElementById("interaction-hint");
    hint.textContent = target ? `E · ${target.name}` : "";
  }

  setTouchActive(active) {
    const controls = document.getElementById("touch-controls");
    const isTouch = window.matchMedia?.("(pointer: coarse)").matches || window.innerWidth < 720;
    controls.classList.toggle("active", Boolean(active && isTouch));
  }

  toast(message, kind = "") {
    this.toastNode.textContent = message;
    this.toastNode.className = `toast visible ${kind}`;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastNode.classList.remove("visible"), 2400);
  }

  setAudioState(enabled) {
    const button = document.getElementById("sound-toggle");
    button.textContent = enabled ? "♪" : "×";
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "Silenciar áudio" : "Ativar áudio");
  }

  #handleSettingInput(event) {
    const key = event.target.dataset.setting;
    if (!key || !this.game) return;
    const value = event.target.type === "checkbox" ? event.target.checked : Number(event.target.value);
    this.game.updateSettings({ [key]: value }, false);
  }

  #handleSubmit(event) {
    if (event.target.id !== "modal-form") return;
    event.preventDefault();
    const input = document.getElementById("frequency-input");
    if (!input || !this.onPuzzleSubmit) return;
    const success = this.onPuzzleSubmit(input.value);
    if (success) this.closeModal();
    else { input.focus(); input.select(); }
  }

  #handleScreenClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button || !this.game) return;
    switch (button.dataset.action) {
      case "new": this.game.startNew(); break;
      case "continue": this.game.continueGame(); break;
      case "settings": this.showSettings(this.game.settings); break;
      case "resume": this.game.resume(); break;
      case "inventory": this.game.openInventory(); break;
      case "title": this.game.returnToTitle(); break;
      case "checkpoint": this.retryHandler?.(); break;
    }
  }

  #handleModalClick(event) {
    const useButton = event.target.closest("[data-use-item]");
    if (useButton) {
      this.game?.useItem(useButton.dataset.useItem);
      const docs = this.game.map.documents.filter((doc) => this.game.map.readDocuments.has(doc.id));
      this.showInventory(this.game.inventory.list(), docs);
      return;
    }
    const button = event.target.closest("[data-modal-action]");
    if (!button) return;
    if (button.dataset.modalAction === "close") this.closeModal();
    if (button.dataset.modalAction === "settings-save") {
      this.game?.persistSettings();
      this.closeModal();
    }
    if (button.dataset.modalAction === "submit-frequency") {
      const form = document.getElementById("modal-form");
      if (form) form.requestSubmit();
    }
  }
}
