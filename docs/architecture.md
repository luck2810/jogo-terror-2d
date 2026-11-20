# Arquitetura técnica

## Visão geral

A aplicação é uma página estática de rota única. `index.html` carrega `css/style.css` e o ponto de entrada `js/main.js` como ES module. `Game` coordena uma simulação limitada por `requestAnimationFrame`, com `dt` limitado a 50 ms; `Renderer` desenha numa resolução lógica de 960×540 e usa device-pixel-ratio até 2. Menus e diálogos são HTML acessível por cima do Canvas, e os ambientes/personagens são traçados em Canvas.

## Responsabilidades dos módulos

| Módulo | Responsabilidade |
|---|---|
| `js/core/Game.js` | Inicialização, estados título/jogo/pausa/finais, atualização, salvamento periódico, objetivos e checkpoint. |
| `js/core/Input.js` | Normalização de WASD/setas, ações em borda única e joystick via Pointer Events. |
| `js/world/Map.js` | Salas, portas, documentos, itens, objetos, colisão, rotas de sala e serialização do estado espacial. |
| `js/world/Collision.js` | Interseção AABB, movimento com separação por eixos e raycast amostrado para linha de visão. |
| `js/entities/Player.js` | Movimento, orientação, vida, dano com invulnerabilidade curta e bateria. |
| `js/entities/Enemy.js` | Estados patrulha, investigação, perseguição, busca e retorno; locomoção respeita a conectividade e linhas de visão. |
| `js/systems/Interaction.js` | Alvos próximos, coleta, leitura, portas, painel do gerador, rádio e saída. |
| `js/systems/Inventory.js` | Itens válidos, chaves e consumíveis. |
| `js/systems/Lighting.js` | Máscara de escuridão, halo, cone da lanterna e visibilidade que projeta sombras por paredes/obstáculos. |
| `js/systems/Audio.js` | Osciladores e ruído procedural com ganho independente de ambiente e efeitos. |
| `js/systems/Save.js` | Leitura defensiva, validação por versão, armazenamento e preferências. |
| `js/render/Renderer.js`, `js/render/Art.js` | Câmera, mapa, personagens, props, pixel art procedural, iluminação e ruído visual. |
| `js/ui/Interface.js` | Menus, opções, HUD, inventário, leitura, puzzle e telas finais. |

## Progressão e dados

O ponto de entrada é o saguão. A chave de serviço abre a enfermaria, onde há fusível, chave do arquivo e registro. A chave do gerador está no arquivo; a cozinha oferece pilha de lanterna. No painel, primeiro instala-se o fusível e depois se liga o motor. O transmissor só funciona com energia. O caderno no arquivo revela 87,6 MHz. Acertar a sintonia habilita a saída; ao interagir com ela, o jogo conclui. A despensa opcional é revelada examinando a parede marcada por sal.

Portas são entidades persistentes do mapa. Paredes são retângulos estáticos calculados por cômodo, com aberturas somente em portas reveladas; portas fechadas e obstáculos bloqueiam o jogador e o raycast. A navegação da entidade usa um grafo de salas e só atravessa portas abertas. A percepção visual usa uma linha de visão amostrada a cada 8 pixels; ruídos emitidos pelo jogador podem iniciar investigação em alcance limitado apenas sem bloqueio de paredes. A lanterna amplia o alcance visual do inimigo, e a máscara de luz usa um polígono de visibilidade recortado pela mesma geometria de paredes/obstáculos para produzir sombras.

O salvamento principal usa a chave `sinal-de-cinza.save.v1`, com `version: 1`, jogador (posição, vida, bateria, orientação), inventário, mapa (itens recolhidos, documentos lidos, portas), flags de progressão, checkpoint e estado do inimigo. Preferências usam `sinal-de-cinza.settings.v1`. As funções validam estrutura e valores numéricos, ignoram IDs desconhecidos e capturam falhas de acesso/quota de `localStorage`.

## Extensão

Para adicionar uma sala, declarar seu retângulo em `ROOM_DATA`, conectar portas, adicionar decoração, itens e registros no construtor de `GameMap` e atualizar a rota de progressão em `Game`/`Interaction`. Para adicionar item, criar metadados em `Inventory.js` e um handler ao ser usado em `Game.useItem`. Para adicionar um tipo de áudio, declarar seus parâmetros em `AudioEngine.play`. Não é necessário transpilar ou instalar bibliotecas.
