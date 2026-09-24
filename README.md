# Faroeste Survivors — versão 0.6 (refino dos menus e da partida)

Jogo web de sobrevivência por 15 minutos, em HTML, CSS e JavaScript com Vite e Three.js. A estrutura mantém modelos de estado em `src/models/`, regras em `src/systems/`, apresentação em `src/views/` e coordenação em `src/app/` e `src/viewmodels/` (MVVM adaptado a um jogo).

## Instalação

1. Faça uma cópia do seu projeto se houver alterações locais que deseja preservar.
2. Em `C:\projetos\webjogos\FaroesteSuvivors`, substitua **a pasta `src` inteira** pela do ZIP. Copie `index.html` e `README.md` para a raiz.
3. Mantenha `package.json`, `package-lock.json`, `vite.config.js` e `.github/` do seu repositório. Esta atualização não precisa de novas bibliotecas.
4. Execute `npm ci` (caso faltem dependências), `npm run dev` para jogar localmente e `npm run build` antes de publicar. Se PowerShell bloquear `npm.ps1`, use `npm.cmd run dev` ou `npm.cmd run build`.
5. Para GitHub Pages do repositório, mantenha `base: "/FaroesteSuvivors/"` em `vite.config.js` e use seu fluxo de deploy já configurado.

O ZIP contém apenas `src/`, `index.html` e `README.md`. Os modelos, músicas, efeitos e retratos estão em `src/assets/`.

## Menu e controles

O fluxo é **Novo jogo → personagem → fase → jogar**. A seleção de personagem e a loja usam retratos PNG com movimentos leves em CSS: João Vaqueiro, Maria Bonita, Indigo e Bento. O personagem e Bento continuam com seus modelos GLB animados **dentro da partida**. A animação dos retratos respeita a preferência do sistema por movimento reduzido. Estes retratos são ilustrações para a interface, não novos modelos 3D jogáveis.

A barra de habilidades fica no canto superior direito da partida e mostra somente ícones. O contador de moedas usa o símbolo `◈` sem o rótulo redundante “Partida”; o cronômetro de 15 minutos permanece no centro. As instruções de movimento saíram da tela do jogo: em **Configurações → Como jogar** há o tutorial de WASD, setas, toque, ataques automáticos, caixas, XP, Bento e sequência de cartas. Menu e seleção receberam menos frases. O menu usa apenas logo, escolha de idioma e botões; não mostra “Capítulo Um”, “EST. 1887” nem a antiga frase sobre o deserto.

O idioma padrão continua inglês, com opções de português brasileiro e espanhol. O perfil, idioma e as compras permanentes continuam no armazenamento local do navegador.

## Personagens, armas e fases

| Personagem | Vida inicial | Arma principal |
| --- | ---: | --- |
| João Vaqueiro | 100 | Chicote automático em arco, dano inicial 10 |
| Maria Bonita | 90 | Revólver com tiro automático, dano inicial 14 |
| Indigo | 105 | Arco com flecha perfurante, dano inicial 17 |

Maria agora dispara um projétil de metal dourado com ponta luminosa; as flechas de Indigo têm haste de madeira, ponta metálica e penas turquesas. Os projéteis usam malhas instanciadas, mantendo o custo limitado durante a partida.

As fases continuam Deserto dos Esquecidos, Mina da Noite e Cidade Fantasma, com limites de 240 × 240 unidades. O deserto ganhou sombras leves sob rochas e cactos. Mina e cidade ganharam halos suaves nas lâmpadas feitos por uma única malha instanciada e uma textura produzida por código, sem acrescentar luzes dinâmicas. No celular, o terreno usa menos subdivisões e menos detalhes de areia.

Continuam os morcegos, chupacabras (a partir de 1:00), urubus em bandos (2:00), esqueletos pistoleiros (3:00), espectros mineiros (4:30), Coveiro Maldito (6:00) e Xerife das Sombras (11:00). O chefe interrompe as ondas normais e ativa a arena de fogo; as ondas voltam após sua derrota. Bento continua aparecendo em suas janelas de tempo dentro do mapa, com bússola que acompanha sua posição.

## Caixas e progressão

Existem no máximo **duas caixas** por vez. Elas surgem entre aproximadamente 31 e 42 unidades da posição do personagem, em locais livres e distantes da câmera, e voltam a aparecer durante a exploração. Uma caixa desaparece quando o personagem passa por cima dela; as armas automáticas e habilidades deixam de escolher caixas como alvo. Ao coletar, ela dá uma bandagem (+25 de vida, com chance inicial de 38%) ou 4–10 moedas. A melhoria permanente Sorte de Garimpeiro continua aumentando a chance de bandagem.

A missão de caixas, iniciada aos 4:00, pede encontrar **duas caixas em 130 segundos**. As outras missões continuam eliminar morcegos e esqueletos. As recompensas continuam evoluir uma carta, ganhar moedas da partida ou obter vida máxima e cura.

Ao evoluir, o jogador escolhe uma das três cartas. Permanecem pistola, molotov, coração, ferraduras, bala fantasma, réquiem, chuva de prata, lampião, colheita de almas, estilhaços de ossos, vontade de ferro e último disparo. A compra de melhorias na loja do menu é permanente; as cartas compradas de Bento durante a partida duram apenas aquela partida. Os preços sobem conforme a quantidade de compras.

## Música e desempenho

- Menu, seleção e loja: `vultures-circle-the-bone.mp3`.
- Partida: `seven-black-graves.mp3`, toca de 0:00 a 2:49 e depois repete 0:05–2:49 até a partida terminar.
- Áudio começa após a primeira interação, conforme as regras dos navegadores. Há um botão de teste de som em Configurações.

Os menus não instanciam mais renderizadores WebGL para prévias individuais. O descarte incorreto da geometria móvel das caixas foi desativado para evitar que pisquem conforme a câmera se desloca. A HUD só reconstrói seus SVGs quando uma habilidade muda. Há no máximo 110 inimigos simultâneos em aparelhos com controle de toque, contra 160 no computador; o 3D reduz a resolução gradualmente quando os quadros ficam lentos, e os aparelhos de toque têm meta de até 30 quadros por segundo. Isso reduz o custo, mas o desempenho final ainda depende do aparelho e do navegador.

O build compilou com Vite. A versão foi conferida em navegador de computador e em telas de 390 × 844 e 320 × 568: retratos, menu, loja, HUD, caixas e as doze escolhas de habilidade. Os testes automatizados de desenvolvimento **não fazem parte do ZIP**. O Vite pode avisar que um chunk excede 500 kB por incluir o Three.js; o aviso não impede a compilação. O conteúdo compilado com retratos permanece abaixo do limite de 75 MB.
