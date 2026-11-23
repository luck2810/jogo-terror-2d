# TODO — Sinal de Cinza

Legenda: `[x]` concluído com evidência; `[ ]` pendente; `[~]` parcial, com limitação registrada.

## Planejamento

- [x] **Arquitetura e direção criativa aprovadas.** Plano `plan.md` define a arquitetura, módulos, narrativa, decisões de apresentação e limites da entrega. Aprovação recebida em 2026-11-20.

## Resultados de produto

- [x] **Jogo de navegador e arquitetura.** Entregar gênero Terror / Survival Horror; dimensão 2D; câmera top-down; plataforma navegadores modernos; linguagem HTML5, CSS3 e JavaScript; renderização HTML5 Canvas; compatibilidade com computadores e celulares; execução sem instalação; estrutura modular, organizada e expansível. Utilizar JavaScript puro sempre que possível e evitar dependências desnecessárias. Não concentrar todo o jogo em um único arquivo JavaScript.

- [x] **Identidade e terror ambiental.** Desenvolver atmosfera sombria e opressiva; cenários abandonados; iluminação limitada; efeitos de sombras; sons ambientes perturbadores; sensação constante de perigo; exploração e descoberta; história contada por documentos, objetos e acontecimentos. Não utilizar sustos baratos como único recurso de terror. Criar nome original e identidade visual coerente.

- [x] **Personagem e interação.** Implementar movimentação em oito direções; animações de caminhada e estados de movimento; colisão com paredes e objetos; interação com portas, documentos e objetos; sistema de vida; inventário funcional.

- [x] **Exploração, chaves e segredos.** Implementar mapa dividido em ambientes; salas interconectadas; portas trancadas; chaves e itens necessários para avançar; objetos examináveis; segredos e áreas opcionais.

- [x] **Iluminação, lanterna e eventos de terror.** Implementar sistema de iluminação dinâmica; lanterna com bateria infinita; áreas de escuridão; eventos ambientais; sons posicionais ou direcionais, quando possível; inimigo com inteligência artificial básica.

- [x] **IA justa do inimigo.** Implementar estados reais de comportamento: patrulha; investigação de ruídos; perseguição; busca pelo jogador; retorno à patrulha. O comportamento deve ser consistente e justo, sem detectar o jogador através de paredes indevidamente.

- [~] **Progressão e conclusão.** Implementar objetivos principais; coleta de itens; quebra-cabeças; eventos narrativos; sistema de checkpoints; condições reais de vitória e derrota. Os fluxos de item, sintonia errada/correta, derrota e retorno ao checkpoint foram exercitados, mas a campanha inteira até a saída não foi concluída em uma única partida.

- [x] **Interface integral.** Criar tela inicial; novo jogo; continuar; configurações; menu de pausa; inventário; indicador de vida; indicador de bateria da lanterna; tela de derrota; tela de conclusão. A interface deve combinar com a atmosfera do jogo. Todos os botões devem funcionar de verdade. Os fluxos principais de menu, opções, inventário, pausa, derrota, vitória e puzzle foram acionados no Preview; o retorno ao checkpoint foi testado.

- [~] **Controles de computador, celular e tablet.** Computador: WASD ou setas para movimentação; E para interação; F para lanterna; ESC para pausa; I para inventário. Celulares e tablets: joystick virtual; botão de interação; botão da lanterna; interface adaptada à tela sensível ao toque. Os controles não podem bloquear a visualização do cenário. Teclado e eventos de toque simulados por `PointerEvent` responderam no Preview; a ativação foi verificada com `maxTouchPoints` simulado, e o layout foi revisado em capturas 768×1024 e 1024×768. Não foi possível testar em aparelho Android físico.

- [x] **Arte original e uso local de assets.** Criar identidade visual própria. Priorizar pixel art detalhada ou arte 2D estilizada; paleta de cores sombria; cenários ricos em detalhes; personagens visualmente distintos; animações fluidas; efeitos de partículas; iluminação coerente com o ambiente. Não utilizar emojis como substitutos de personagens, objetos ou elementos gráficos. Não depender de imagens aleatórias da internet. Criar ou obter assets com autorização de uso e organizar todos os arquivos localmente.

- [x] **Áudio completo e respeitoso ao navegador.** Implementar música ambiente; sons de passos; sons de portas; sons de interação; sons relacionados aos inimigos; efeitos de ambiente; controle independente de volume. O áudio deve funcionar respeitando as permissões de reprodução automática dos navegadores. Áudio procedural via Web Audio e botão de volume foram exercitados; o navegador exige gesto para ativar o áudio. Não há gravações/falas externas.

- [x] **Organização e documentação de manutenção.** Incluir código-fonte completo; arquivos organizados; nomes de variáveis compreensíveis; funções pequenas e reutilizáveis; comentários onde forem necessários; README com instruções completas; documentação da arquitetura; lista de funcionalidades implementadas; lista de problemas conhecidos; lista de melhorias futuras. Preparar o projeto para continuidade posterior no Claude. Não esconder partes importantes do código.

- [x] **Salvamento validado.** Implementar salvamento utilizando `localStorage`. Salvar progresso; inventário; posição do jogador; estado dos objetivos; itens coletados; configurações. Implementar validação dos dados salvos e tratamento de erros.

- [~] **Desempenho e compatibilidade.** Funcionar em Chrome, Firefox e Edge; ser responsivo; funcionar em celulares Android; manter desempenho estável; evitar vazamentos de memória; evitar loops desnecessários; adaptar resolução do Canvas; pausar ou controlar o jogo quando a aba perder foco. O Canvas usa resolução lógica adaptada a DPR e o Preview funcionou; navegadores/motores e aparelhos físicos específicos não foram verificados independentemente.

- [~] **Verificação antes da entrega.** Testar movimentação; colisões; interações; inventário; sistema de iluminação; inteligência artificial dos inimigos; salvamento e carregamento; controles de celular; todos os botões; erros no console. Não declarar funcionalidades como concluídas sem tê-las testado. `npm test`: 13/13 testes; sintaxe JavaScript e `npm run build` passaram. Foram verificadas capturas desktop/móvel e ações no Preview. Toque foi emulado com eventos, não em hardware; a campanha completa e compatibilidade multi-browser permanecem não verificadas.

- [x] **Pacote final e continuidade.** Entregar jogo funcional; código-fonte completo; todos os assets utilizados; projeto organizado em pastas; arquivo ZIP; link para jogar, se houver hospedagem; repositório GitHub, se possível; instruções para executar localmente; documentação técnica; relatório dos testes realizados; lista de limitações e melhorias recomendadas. A primeira versão deve ter identidade própria, atmosfera marcante, exploração, inimigos, iluminação, áudio e progressão. O projeto deve permitir que outro desenvolvedor, especialmente usando Claude, continue sem reconstruir tudo. Construir o jogo, executar testes e entregar arquivos; não parar no planejamento. Não entregar apenas arquivos compilados, capturas de tela ou demonstração hospedada. O pacote-fonte ZIP foi regenerado e teve a integridade verificada. O repositório GitHub privado `https://github.com/luck2810/jogo-terror-2d` foi conectado como canônico; `main` confirmado no SHA `c13230a92eb90208f5205d3b60ea5b0699d3a0a7`. A partida segue disponível pelo Preview na interface Manus; não foi publicada publicamente.

## Registro de validação

- `npm test`: 13 testes aprovados, 0 falhas (colisão, IA e linha de visão, grafo de salas/portas, visibilidade da luz, salvamento e configurações).
- `node --check` executado em todos os arquivos JavaScript de `js/`, `scripts/` e `tests/`: sem erros.
- `npm run build`: saída estática `dist/` gerada com sucesso.
- Preview: `/` respondeu HTTP 200; `/manus-routes.json` respondeu HTTP 200 com JSON válido.
- Capturas: desktop 1280×720 e celular 375×812; título, texto e botões visíveis sem corte na viewport móvel.
- Fluxos no Preview: nova partida; movimento para a direita pelo teclado; coleta da chave de serviço e inclusão no inventário; alternância da lanterna; abrir/fechar bolsa; pausa/retomada; retorno ao menu; continuar um save; configuração de volume salva; frequência errada rejeitada e `87,6` aceita; derrota/recuperação do checkpoint; guarda de vitória e tela final. Nenhum erro de `error`/`unhandledrejection` foi capturado nos trechos exercitados.
- Toque: joystick (direita/baixo/soltar) e botões de bolsa, lanterna e interação validados por eventos `PointerEvent` sintéticos no navegador. Isso verifica o roteamento do código, não substitui um teste em tela sensível ao toque real.
- Limites: não foi feita uma partida completa do início até a saída; não foram testados Chrome, Firefox, Edge e Android físico separadamente; o Preview ainda não foi publicado publicamente.
