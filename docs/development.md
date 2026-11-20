# Desenvolvimento, verificações e limitações

## Estado da versão

A versão 0.3.0 é uma campanha curta executável no navegador, sem backend e sem dependências de runtime. A arte é desenhada no Canvas e o áudio é sintetizado no cliente. O projeto permanece fonte-first: o diretório `dist/` é uma saída reconstruível, não substitui os módulos-fonte.

## Comandos

- Executar localmente: `python3 -m http.server 8000` e abrir `http://localhost:8000`.
- Testes automatizados: `npm test`.
- Gerar build estático: `npm run build`.

## Funcionalidades implementadas

- Campanha da Casa Salina com salas conectadas, portas, chaves, documentos, pilha, curativo, área secreta, gerador, frequência de rádio, saída, checkpoint e estados finais.
- Canvas 960×540 com adaptação a DPR, câmera, arte procedural, máscara de escuridão e luz com recorte por paredes/obstáculos, lanterna, partículas e interface DOM responsiva.
- Jogador com movimento em oito direções, colisão, vida e bateria; inimigo com patrulha, investigação, perseguição, busca e retorno, linha de visão bloqueada por paredes e portas fechadas.
- Menus, configurações e volume separado, HUD, inventário, leitura de documentos, sintonia do rádio, derrota, recuperação e conclusão.
- Teclado e joystick/botões touch; salvamento local versionado com validação; áudio procedural via Web Audio.

## Registro de verificações

| Verificação | Resultado observado |
|---|---|
| `npm test` | Aprovado: 13 testes, 0 falhas. Cobre colisões/raycast, investigação e portas da IA, geometria do polígono de luz, mapa/portas e validação/persistência de salvamentos/configurações. |
| Sintaxe JavaScript | `node --check` passou para todos os arquivos `.js` em `js/`, `scripts/` e `tests/`. |
| Build estático | `npm run build` passou e gerou `dist/`. |
| Servidor e manifesto de rotas | Preview na porta configurada respondeu HTTP 200 em `/`; `/manus-routes.json` respondeu HTTP 200 com JSON válido da rota `/`. |
| Layout desktop | Captura 1280×720; identidade visual, menu, texto e botões ficaram visíveis. A tela de jogo também foi observada no Preview. |
| Layout móvel | Captura 375×812; título, descrição, os três botões e instruções ficaram dentro da viewport, sem corte. Não equivale a teste em aparelho físico. |
| Interação de teclado e interface | No Preview: nova partida, deslocamento por `D`, `F`, `I`, `ESC`, retomada, retorno ao menu, continuar, áudio, ajuste/salvamento de volume, inventário, coleta da chave e ciclo de derrota/checkpoint foram exercitados. |
| Puzzle e conclusão | O formulário do rádio rejeitou `87,5` e aceitou `87,6` com o pré-requisito de leitura habilitado para o teste. A guarda da vitória e a tela final foram verificadas; não se concluiu a campanha inteira caminhando até a saída. |
| Touch | Eventos `PointerEvent` sintéticos verificaram joystick para direita/baixo e soltura, além das entradas da bolsa, lanterna e interação. Nenhum toque físico foi executado. |
| Erros no navegador | Nenhum evento `error` ou `unhandledrejection` foi capturado nos fluxos exercitados; isso não é uma auditoria de todas as sessões possíveis. |
| Compatibilidade real | Chrome/Firefox/Edge e Android físico não foram executados separadamente neste ambiente. |

## Limitações conhecidas

A IA navega por um grafo de salas, com movimento local simples, sem pathfinding detalhado por tile nem desvio A*. A campanha completa não foi concluída em uma partida de validação ponta a ponta. O áudio é sintetizado e minimalista, não utiliza gravações ou música externa e depende de um gesto do usuário para iniciar, conforme as políticas do navegador. Os saves vivem no `localStorage` da origem/dispositivo e não sincronizam. Controles móveis passaram por captura responsiva e simulação de eventos, não por dispositivo Android real. Compatibilidade entre diferentes motores de navegador continua pendente.

## Melhorias futuras recomendadas

Adicionar navegação A* com desvio de mobiliário, ampliar variações de eventos e ambiente sonoro, criar mais estados de animação, opções de acessibilidade (alto contraste, remapeamento e velocidade do inimigo), expandir conteúdo narrativo e rodar testes ponta a ponta em Chrome, Firefox, Edge e Android físico.

## Versão 0.2 — estabilização (auditoria técnica)

Corrigido, com teste automático ou execução real em Chromium headless:

- **GitHub Pages:** `index.html` usava caminhos absolutos (`/css/...`, `/js/...`), que dão 404 fora da raiz do domínio. Agora são relativos; há `.nojekyll`, workflow de deploy e mensagem de erro de inicialização.
- **IA travada:** o inimigo parava a ~15 px de qualquer porta (limite de chegada maior que a margem de `getRoomAt`) e nunca saía do corredor; também travava em estantes/móveis e ficava congelado com porta fechada. Agora atravessa portas em duas etapas, contorna obstáculos, e ronda a sala atual se o caminho estiver fechado.
- **IA justa:** detecção gradual (barra de consciência), som propaga por portas abertas (antes o ruído de passos nunca disparava investigação), velocidade de perseguição 86→98.
- **ESC** não retomava a pausa e deixava comandos acumulados; entrada agora usa `event.code` e ignora campos de texto.
- Itens não são mais coletados através de paredes; porta não fecha com alguém no vão.
- HUD só toca o DOM quando algo muda (e saiu de `aria-live`); piso pré-renderizado em cache.
- `reducedMotion` agora funciona; mute preserva o volume; aviso e falha da lanterna com pouca bateria; tensão sonora, batimento e passos do inimigo em estéreo; confirmação antes de apagar o save.

Verificado: `npm test` 19/19; campanha completa até a vitória no navegador (com teleporte entre objetos e inimigo desativado para isolar a lógica); rádio 87,5 rejeitado e 87,6 aceito pela interface; zero erros de JS/HTTP sob subcaminho.

Ainda **não** verificado: Firefox/Safari, aparelho Android físico, partida longa com o inimigo ativo e desempenho em GPU real (o FPS medido foi em headless sem GPU).

## Versão 0.3 — arte, conteúdo e sustos

- **Arte:** personagem com 4 direções e animação de caminhada (cachecol ferrugem, mochila, lanterna na mão); inimigo alongado com máscara pálida, braços balançando, olhos que mudam na perseguição e interferência ocasional; ícones próprios para chaves, fusível, pilha, estojo e documentos (com marca de "não lido"); paredes com juntas, topo iluminado e sombra; decoração de piso por cômodo (tapetes, manchas, papéis, cabos, arranhões, rachaduras). Todo o cenário estático fica num cache e só é redesenhado quando uma porta oculta é revelada.
- **Dormitório (sala opcional):** acessível pelo corredor, começa com a porta fechada. É um refúgio (o inimigo não abre portas), tem a **cama de plantão** (ponto seguro), o diário da enfermeira e a fita rotulada (pistas sobre as batidas e a maré). Ao morrer, o inimigo renasce longe de você.
- **Eventos de terror (`js/systems/Events.js`):** três batidas ao entrar no corredor, sussurro na casa de força, rangido na cozinha, estática no rádio e sustos ambientais aleatórios (porta ao longe, rangido, sussurro, falha de luz) que nunca ocorrem durante uma perseguição. Eventos únicos são salvos. "Reduzir efeitos visuais" desliga as falhas de luz.
- **Áudio:** passos, batidas, sussurros e rangidos agora vêm de ruído filtrado (não só osciladores), com pan estéreo.
- **Testes:** 26 automáticos. Campanha completa e eventos verificados em Chromium headless.

Ainda não verificado: Firefox/Safari, Android físico, partida longa com o inimigo ativo, GPU real.
