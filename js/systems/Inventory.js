const ITEM_DETAILS = {
  "service-key": { name: "Chave de serviço", description: "Abre a porta da enfermaria." },
  "fuse": { name: "Fusível cerâmico", description: "Peça necessária para o gerador." },
  "archive-key": { name: "Chave do arquivo", description: "Abre o arquivo de prontuários." },
  "generator-key": { name: "Chave da casa de força", description: "Abre a sala das máquinas." },
  "battery-cell": { name: "Pilha de lanterna", description: "A lanterna tem carga infinita; esta pilha não é necessária." },
  "med-kit": { name: "Estojo de primeiros socorros", description: "Recupera um ponto de vida." }
};

export class Inventory {
  constructor(items = []) {
    this.items = new Set(ITEM_DETAILS ? items.filter((id) => Object.hasOwn(ITEM_DETAILS, id)) : []);
  }
  has(id) { return this.items.has(id); }
  add(id) { if (!Object.hasOwn(ITEM_DETAILS, id)) return false; this.items.add(id); return true; }
  remove(id) { return this.items.delete(id); }
  list() { return [...this.items].map((id) => ({ id, ...ITEM_DETAILS[id] })); }
  serialize() { return [...this.items]; }
  static details(id) { return ITEM_DETAILS[id] || null; }
}
