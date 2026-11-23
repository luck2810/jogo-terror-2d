# Sinal de Cinza

Jogo de terror/survival horror 2D top-down, em português brasileiro, feito com HTML5 Canvas, CSS e JavaScript puro. Uma campanha curta pela Casa Salina: encontre as chaves e o fusível, leia os registros, ligue o gerador, sintonize o transmissor em **87,6 MHz** e alcance a saída sem deixar que a entidade o encontre.

## Executar localmente

Requer um navegador moderno e Python 3 ou Node.js 18+. O jogo não usa dependências de runtime nem precisa de instalação. A partir da raiz do projeto, execute `python3 -m http.server 8000` e abra `http://localhost:8000`. (Também é possível usar `npx serve . -l 8000`, se `serve` já estiver instalado.) Não abra `index.html` por `file://`: o navegador bloqueia módulos JavaScript ES nesse modo.

## Publicar no GitHub Pages

O jogo usa só caminhos relativos, então funciona em `usuario.github.io/repositorio/`. Duas opções:

1. **Automática (recomendada):** em *Settings → Pages → Source*, escolha **GitHub Actions**. A cada push na `main`, o workflow `.github/workflows/pages.yml` roda os testes, gera `dist/` e publica.
2. **Direta:** *Source: Deploy from a branch → main → / (root)*. O arquivo `.nojekyll` já está na raiz.

Se a página abrir em branco, o jogo agora mostra uma mensagem de erro no rodapé explicando o motivo (ex.: abrir por `file://`).

## Testar e preparar

- `npm test` — testes automatizados dos sistemas sem DOM, usando o runner integrado do Node.
- `npm run build` — monta a cópia estática em `dist/` para hospedagem simples.

## Controles

No computador: WASD ou setas movem; E interage; F alterna a lanterna; I abre o inventário; Escape pausa ou fecha um diálogo. Em celulares e tablets com toque, use o joystick virtual e os botões de ação, exibidos durante a partida. O navegador só inicia o áudio após um gesto explícito, conforme as regras de autoplay.

## Estrutura

A simulação, renderização, áudio, salvamento, mapa, inimigo, interface e entrada estão em módulos independentes sob `js/`. O mapa e os elementos visuais são desenhados proceduralmente; os efeitos de áudio são sintetizados com Web Audio. A progressão é salva no `localStorage` da origem local. Consulte `docs/architecture.md`, `docs/controls.md` e `docs/development.md`.

## Funcionalidades previstas na versão entregue

Exploração de salas conectadas, portas e chaves, documentos, área secreta, puzzle do rádio, inventário e consumíveis, vida, checkpoint, lanterna de bateria limitada, iluminação, máquina de estados do inimigo, menus e configurações, controles de teclado e toque, salvamento versionado, áudio procedural e finais de vitória/derrota. O status final e eventuais limitações são registrados em `docs/development.md` e `TODO.md`; só são chamados de testados os caminhos efetivamente verificados.

## Assets e licença

Não há imagens, fontes, músicas ou sons externos. A arte é criada por código local em `js/render/Art.js`; o áudio é criado em `js/systems/Audio.js`. Os fontes estão licenciados em `LICENSE` (MIT). O texto e a identidade de Sinal de Cinza foram criados para este projeto.
