# Relatório técnico — Sinal de Cinza v0.1 → v0.2

## Arquitetura (boa base, preservada)
Módulos separados (core / world / entities / systems / render / ui), sem dependências, saves versionados e validados, testes sem DOM. Mantida integralmente.

## Problemas encontrados
| Gravidade | Problema | Situação |
|---|---|---|
| Crítica | Não roda no GitHub Pages: caminhos absolutos → 404 em `/css` e `/js` | Corrigido |
| Crítica | Inimigo congela a ~15 px de qualquer porta; nunca sai do corredor (300 s simulados: parado 295 s) | Corrigido + testes |
| Alta | Inimigo trava em móveis; porta fechada o congela para sempre (exploit) | Corrigido + testes |
| Alta | ESC não retoma a pausa; comandos acumulados disparam ao retomar | Corrigido |
| Média | Ruído de passos (128) < alcance visual (185) e exigia visão: INVESTIGAR era código morto | Corrigido |
| Média | Itens coletáveis através de paredes; porta fecha sobre o jogador/inimigo | Corrigido |
| Média | HUD regravava DOM todo quadro em região `aria-live`; piso (1320 ladrilhos) redesenhado todo quadro | Corrigido |
| Baixa | `reducedMotion` sem efeito; mute zera volume salvo; "Nova partida" apaga save sem aviso | Corrigido |

Medido e **descartado** como gargalo: `getSolidRects` (3 µs), visibilidade da luz (0,4 ms/quadro).

## Próximos passos recomendados
1. Playtest longo com inimigo ativo e ajuste de dificuldade (velocidades, alcance de detecção).
2. Testar em Firefox, Safari e Android real; medir FPS com GPU.
3. Arte: sprites animados (4 direções), tiles com variação, props com mais detalhe.
4. Áudio: sons de passos/portas baseados em ruído filtrado, música adaptativa por sala.
5. Conteúdo: mais salas, eventos de susto ambientais, um segundo inimigo/mecânica, finais alternativos.
6. Acessibilidade: remapear teclas, alto contraste, velocidade do inimigo ajustável.
