import { Game } from "./core/Game.js";

const canvas = document.getElementById("game-canvas");
if (!canvas) throw new Error("Canvas do jogo não encontrado.");

const game = new Game(canvas);
window.sinalDeCinza = game;
