# Plano de implementação — Sinal de Cinza

## Objetivo e decisões

Criar uma primeira versão de survival horror 2D top-down, de jogador solo, executada no navegador e escrita em HTML5, CSS3, JavaScript puro e Canvas. O projeto foi inicializado como Web, e não como jogo Godot, para respeitar a tecnologia solicitada. Não haverá backend, contas, dependências de runtime, imagens externas, fontes remotas ou áudio de terceiros. O código-fonte será modular e continuará legível para manutenção posterior, inclusive com Claude.

A campanha se passa no sanatório costeiro abandonado Casa Salina. A protagonista procura reativar um transmissor de emergência e sair do prédio antes que a entidade que ronda os corredores a alcance. A progressão percorre sete áreas conectadas (saguão, corredor, enfermaria, arquivo, cozinha, sala do gerador e sala do rádio/saída), com um desvio opcional. Documentos e objetos contam a história; um fusível, uma chave e pistas escritas habilitam um puzzle de frequência do rádio. O inimigo usa rota de patrulha, investigação de ruído, perseguição com linha de visão, busca na última posição conhecida e retorno à rota. Paredes e portas fechadas bloqueiam visão e deslocamento; a lanterna consome bateria e sua luz afeta a detecção.

A experiência será uma campanha curta e completa, com menu, continuar/salvar, configurações, pausa, inventário, checkpoint, derrota e vitória. A ambientação e o conteúdo estarão em português brasileiro. O áudio será gerado no cliente por Web Audio após a primeira interação do usuário, respeitando as restrições de autoplay.

## Estrutura do projeto

- `index.html`: ponto de entrada semântico e contêiner do jogo.
- `css/style.css`: identidade, layout adaptável, HUD e controles touch.
- `js/main.js`: boot, carregamento e ligação de eventos globais.
- `js/core/Game.js`: loop limitado por `requestAnimationFrame`, estados de tela, pausa por foco e ciclo de vida.
- `js/core/Input.js`: teclado, gamepad virtual, toque e normalização de comandos.
- `js/world/Map.js`: salas, conexões, tiles, portas, objetos e dados do cenário.
- `js/world/Collision.js`: colisão e raycast/grid traversal com bloqueio por paredes.
- `js/entities/Player.js`: movimento em oito direções, animação, vida, dano e lanterna.
- `js/entities/Enemy.js`: máquina de estados, percepção, navegação por grid e temporizadores justos.
- `js/systems/Interaction.js`: alcance/seleção, portas, documentos, itens, rádio e puzzle.
- `js/systems/Inventory.js`: dados e apresentação de itens.
- `js/systems/Lighting.js`: cone/halo da lanterna, sombras e vinheta.
- `js/systems/Audio.js`: camadas independentes de ambiente e efeitos Web Audio.
- `js/systems/Save.js`: serialização versionada, validação, tratamento de erro e migrações simples.
- `js/ui/Interface.js`: menus, configurações, mensagens, HUD, inventário e finais.
- `js/render/Renderer.js` e `js/render/Art.js`: desenho Canvas, pixel-art procedural e partículas, sem carregar recursos externos.
- `tests/`: testes de lógica isolável executáveis com `node --test`, sem dependências externas.
- `docs/architecture.md`, `docs/controls.md`, `docs/development.md`: decisões, instruções e limitações.
- `README.md`, `LICENSE`, `public/manus-routes.json`, `scripts/build.mjs`: uso, licença, declaração da rota e preparação de saída estática para publicação/ZIP.

## Direção visual e de interação

Opções estilísticas consideradas (probabilidades criativas pequenas, cada uma < 0,10): **pixel art costeira com ruído analógico — 0,0646**; **silhuetas industriais em nanquim — 0,0586**; **quadrinhos monocromáticos desbotados — 0,0172**. Escolhida a primeira, com execução própria de pixel art e ruído discreto, não filtros que prejudiquem a legibilidade.

- **Movimento de referência:** horror analógico e pixel art de survival horror, sem reproduzir personagens, mapas ou marcas de obras existentes.
- **Princípios centrais:** legibilidade em baixa luminosidade; cada interação reforça a história; o perigo dá sinais perceptíveis antes de punir; a exploração é recompensada por informação e atalhos.
- **Filosofia de cor:** azul-petróleo, carvão e cinza salino produzem isolamento e frio; lâmpadas de tungstênio e o laranja ferrugem da marca indicam calor, ação e risco.
- **Paradigma de layout:** canvas domina a área de jogo; HUD permanece em moldura estreita, com painéis contextuais laterais no desktop e controles táteis nos cantos inferiores em celular.
- **Elementos-símbolo:** onda de rádio irregular; manchas de sal nas bordas dos cômodos; linha de luz âmbar da lanterna.
- **Interação:** foco no objeto ao alcance, texto conciso e resposta sonora/visual; portas, notas e itens usam o mesmo gesto contextual. Os controles touch são transparentes e mantêm o centro visível.
- **Animação:** pixel-perfect em escala inteira sempre que possível; passo alternado e balanço mínimo; oscilação de luz lenta; inimigo muda de pose conforme estado; transições por escurecimento breve, sem jumpscare obrigatório.
- **Tipografia:** pilha local do sistema; serifada de exibição (`Georgia`, fallback serif) apenas para títulos de atmosfera; monoespaçada (`ui-monospace`, fallback monospace) para HUD e documentos; sem downloads externos.
- **Essência da marca:** uma fuga tensa guiada por sinais imperfeitos, feita para quem prefere exploração e leitura do ambiente a sustos repetidos; personalidade: austera, inquieta, humana.
- **Voz:** frases curtas, concretas e com subtexto. Exemplos: “A maré subiu. O rádio ainda chama.” e “O corredor ficou quieto depressa demais.”
- **Wordmark/marca:** “SINAL DE CINZA” em caixa alta, com traço de onda interrompido atravessando o espaço entre “SINAL” e “CINZA”.
- **Cor proprietária:** laranja ferrugem `#c06a46`, reservado a foco, perigo e pistas acionáveis.

## Entrega e limites

A entrega será o projeto-fonte completo e organizado, ZIP reproduzível, documentação e relatório de verificações executadas. Será testado no Preview e por testes automatizados para lógica sem DOM; falhas ou limitações restantes serão explicitadas. O Preview é de desenvolvimento, não uma publicação pública. A disponibilidade/ligação de GitHub será verificada; se houver integração autorizada, o repositório solicitado será criado privado por padrão. Não serão enviados dados do jogo a um servidor: progresso e configurações ficam no `localStorage` do navegador.
