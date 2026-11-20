# Controles e interface

## Computador

| Entrada | Ação |
|---|---|
| WASD ou setas | Andar em oito direções |
| E | Interagir com o alvo próximo (itens, portas, documentos, painel, rádio ou saída) |
| F | Ligar/desligar a lanterna; a bateria esgota enquanto ligada |
| I | Abrir/fechar inventário |
| Escape | Pausar; enquanto um diálogo está aberto, fechar o diálogo primeiro |
| Botão ♪ no cabeçalho | Alternar áudio geral |

## Celular

O joystick virtual fica no canto inferior esquerdo; interação, lanterna e bolsa ficam à direita. Controles são ativados durante a partida, usam Pointer Events e `touch-action: none`. O posicionamento evita o centro, que permanece livre para ver o ambiente. Em modo retrato, o Canvas mantém proporção 16:9 e se adapta à largura disponível; em paisagem estreita, os controles e menus diminuem.

## HUD e ações

O HUD mostra três pontos de vida, barra da lanterna, objetivo atual, cômodo e sugestão de interação. A bolsa mostra chaves/itens e registros lidos. Pilha e estojo médico podem ser usados diretamente pela bolsa, respeitando carga/vida máximas. Documentos abrem um painel legível em HTML; o puzzle do rádio aceita decimal com ponto ou vírgula.

## Áudio

A primeira ação de iniciar/continuar cria e retoma `AudioContext`, evitando autoplay não solicitado. A tela de configurações oferece volume geral, ambiente e efeitos separados e preferência de efeitos visuais reduzidos. As preferências são guardadas localmente.
