# Faroeste Survivors — versão 0.8

Jogo de sobrevivência de 15 minutos por fase, feito com HTML, CSS, JavaScript, Vite e Three.js. O projeto separa regras em src/models e src/systems, interfaces em src/views, estado de interface em src/viewmodels e coordenação em src/app.

## Conteúdo da 0.8

| Conteúdo | Versão 0.7 | Versão 0.8 |
| --- | ---: | ---: |
| Fases | 5 | 10 |
| Campeões jogáveis | 10 | 16 |
| Tipos de inimigos comuns | 7 | 27 |
| Chefes | 15 | 25 |
| Cartas no acervo | 18 | 33 |
| Receitas de fusão | 3 | 8 |

A meta combinada para a versão 1.0 continua sendo 15 fases, 22 campeões, 60 tipos de inimigos comuns, 35 chefes, 150 cartas e pelo menos 500 combinações. A 0.8 acrescenta cinco fases, cinco campeões da expansão, o explosivista Neco Pavio, vinte inimigos, dez chefes, cinco cartas de combate, cinco cartas permanentes do Bento e cinco receitas de fusão.

Os 16 campeões usam modelos low-poly articulados, com roupas e acessórios próprios e sete clipes de animação. O arco de Indigo e Inês fica nas costas até o disparo; armas longas usam as duas mãos. Neco Pavio arremessa dinamite que explode em área. Os retratos incluem arte low-poly e renders dos modelos. O pacote de produção permanece abaixo do novo teto de 150 MB.

### João Vaqueiro e Deserto dos Esquecidos

O GLB de João segue a prancha de quatro vistas: cabelo escuro, rosto sem barba, camisa clara, sobretudo aberto, chapéu vaqueiro, revólver e laço enrolado no cinto. O caminhar movimenta também os braços; o ataque com laço usa o braço esquerdo e o tiro usa o revólver na mão direita. O modelo e seus sete clipes são gerados localmente por `node src/tools/generateV08Heroes.mjs joao` com Three.js; este GLB não foi produzido no Blender.

Na primeira fase, o deserto ganhou carroças abandonadas, postes telegráficos, inscrições de sepulturas e poeira suspensa. No computador, a luz principal projeta sombras próximas ao jogador e um bloom suave realça pontos luminosos; a qualidade do renderizador já se adapta à taxa de quadros. No celular, o cenário usa os detalhes sem o custo do bloom e das sombras dinâmicas.

## Campanha e fases

Conclua os objetivos da fase e derrote todos os seus chefes para liberar a próxima. Os objetivos pausam durante a arena de chefe, e os inimigos comuns deixam de surgir nesse intervalo. Vida, dano e armadura dos inimigos aumentam com o tempo e a dificuldade também cresce a cada fase.

| # | Fase | Inimigos comuns novos | Chefes |
| ---: | --- | --- | --- |
| 1 | Deserto dos Esquecidos | — | Patriarca da Noite, Chupacabra de Brasas, Xerife das Sombras |
| 2 | Mina da Noite | — | Mineiro da Pá, Mariposa da Prata, General Mineiro |
| 3 | Cidade Fantasma | — | Cão de Ossos, Cantor Esqueleto, Delegado Zumbi |
| 4 | Desfiladeiro das Cinzas | — | Serpente das Cinzas, Urubu da Tempestade, Revenante dos Trilhos |
| 5 | Necrópole da Fronteira | — | Mãe da Cripta, Pregador Morto, Último Condutor |
| 6 | Pueblo das Campanas | Sineiro, Coiote da Poeira, Ladrão de Lampião, Espectro do Moinho | Guardião do Campanário, Viúva do Moinho |
| 7 | Pântano de Vidro | Sanguessuga do Brejo, Espreitador dos Juncos, Garimpeiro Afogado, Corvo do Pântano | Rei do Brejo, Noiva Afogada |
| 8 | Dama da Meia-Noite | Carniçal Jogador, Banshee do Bar, Diabrete do Uísque, Piano Rastejante | Barão das Garrafas, Dama Malvina |
| 9 | Ferrovia dos Condenados | Bruxa dos Trilhos, Mímico de Carvão, Gafanhoto de Ferro, Cavaleiro das Covas | Locomotiva de Ferro, Rainha das Bruxas dos Trilhos |
| 10 | Fortaleza dos Corvos | Cacto de Osso, Bandido do Crepúsculo, Falcão de Brasa, Cascavel | Matriarca do Cacto de Osso, Rei dos Corvos |

### Dama da Meia-Noite

A oitava fase acontece dentro do bar de mesmo nome. Dama Malvina é a chefe final da fase: ela marca a última posição do jogador e, após o aviso visual, lança três pequenos tornados naquele ponto. Saia da marca antes do ataque. A ficha dela no Bestiário registra seus atributos, fraqueza, padrão e campeã recomendada após a derrota.

Cada chefe tem vida, dano, armadura, velocidade, fraqueza, contra-ataque recomendado e padrão de ataque. Investidas, tiros, fogo, invocações e tornados são anunciados antes de atingir a arena. As criaturas comuns também têm atributos que escalam com a fase e fraquezas mostradas no Bestiário depois de derrotadas.

O Bestiário contém 27 tipos de inimigos e 25 chefes. Ao encontrar um chefe, o registro inicial mostra o nome, a vida e o ataque. A derrota revela atributos completos, fraqueza e recomendação de campeão. Inimigos comuns entram no Bestiário após a primeira derrota.

## Campeões

João, Maria, Indigo, Labuta, Rosa, Ada Morrow, Elias Ferro, Ruth Faísca, Silas Corvo e Teo Carril permanecem disponíveis conforme o progresso anterior. Os cinco campeões novos são liberados após concluir as fases 6 a 10:

| Campeão | Vida | Arma e perfil |
| --- | ---: | --- |
| Valéria Vento | 94 | Dois revólveres, alta velocidade e chance crítica. |
| Tomás Trabuco | 128 | Escopeta de quatro projéteis, muita vida e armadura. |
| Luzia do Brejo | 108 | Lampião, armadura e bônus de experiência. |
| Benício Fagulha | 102 | Rifle perfurante de longo alcance. |
| Inês Corvo | 88 | Arco de alto dano, crítico e velocidade. |

Neco Pavio, o novo explosivista, é liberado após concluir a Mina. Os atributos na seleção usam texto branco. Indigo e Inês carregam o arco nas costas e o levam às mãos durante a animação de disparo; rifles e escopetas são segurados com as duas mãos. A dinamite de Neco explode e atinge inimigos próximos.

Os retratos low-poly combinam arte ilustrada e imagens renderizadas dos modelos. O gerador `src/tools/generateV08Heroes.mjs` reconstrói os modelos e animações; `src/tools/renderV08Portraits.py` pode renderizar retratos WebP diretamente dos GLBs e suporta as cores dos vértices de João. Campeões ainda não desbloqueados aparecem como “?”.

### João Vaqueiro modelado no Blender

`src/assets/models/joao.glb` usa o modelo de João exportado no Blender pelo autor. A exportação enviada continha duas cópias do personagem e somente `Idle`; `src/tools/integrateJoaoBlender.py` conserva uma cópia e reconstrói os clipes `Walk`, `Primary`, `Shot`, `Throw`, `Whip` e `Hurt` nos ossos desse modelo. Para atualizar depois de editar o João no Blender, execute `python3 src/tools/integrateJoaoBlender.py caminho/do/novo.glb` na raiz do projeto e rode `npm run build`. O carregador usa clonagem de esqueleto por instância, e o flash acompanha a mão direita. O gerador geral `generateV08Heroes.mjs` pode sobrescrever `joao.glb`; se executá-lo, importe novamente o modelo do Blender.

## Cartas, Arsenal e Bento

O Deck Arsenal determina quais cartas podem surgir durante a partida. Equipe de 3 a 8 cartas. As cinco novas cartas de combate entram no acervo quando a campanha libera cada uma:

- Cartuchos Salmourados: aumenta o dano da arma principal.
- Valsa da Poeira: aumenta a velocidade de movimento.
- Rosário de Ferro: aumenta a armadura.
- Tônico Azul: aumenta a vida máxima e recupera vida.
- Mira do Horizonte: aumenta o alcance da arma principal.

O Bento vende cinco cartas permanentes novas com moedas salvas. Cada uma entra no acervo somente depois da compra e pode ser equipada no Arsenal: Ampulheta do Bento (velocidade de ataque), Estrela da Sorte (moedas e experiência), Sela do Relâmpago (movimento), Moeda da Misericórdia (cura) e Chumbo Fantasma (dano da arma). Elas são liberadas após as fases 6, 7, 8, 9 e 10, respectivamente. Melhorias compradas do Bento durante uma fase continuam temporárias.

As cinco novas fusões são:

| Cartas equipadas | Combinação |
| --- | --- |
| Cartuchos Salmourados + Valsa da Poeira | Juramento do Vendaval |
| Pistola do Sertão + Rosário de Ferro | Tempestade do Saloon |
| Coquetel Molotov + Valsa da Poeira | Fogo do Brejo |
| Bala Fantasma + Rosário de Ferro | Quebra-Trilhos |
| Ferraduras Malditas + Réquiem da Poeira | Nuvem de Corvos |

As combinações passam a ser forjáveis depois da fase indicada na tela do Arsenal. O contador e as regras de combinação da versão anterior permanecem.

## Modo livre e progresso

O modo livre só abre depois de concluir o Deserto no modo história. Ele respeita os desbloqueios salvos: fases, campeões, cartas de combate, receitas e cartas permanentes ainda bloqueadas não ficam disponíveis antes da campanha. O perfil local existente é preservado, inclusive os desbloqueios e descobertas anteriores.

## Música e controles

As faixas das fases fazem streaming pelo elemento de áudio, sem carregar o MP3 inteiro em memória:

| Fase | Faixa | Loop |
| --- | --- | --- |
| Deserto | Seven Black Graves | 00:05–02:49 |
| Mina | Under the Silver Vein | 00:04–02:56 |
| Cidade Fantasma | The Devil at Noon | 00:00–02:56 |
| Desfiladeiro das Cinzas | Heel and Hardwood | 00:00–02:50, retorna a 00:00 |
| Necrópole da Fronteira | Seven Bullets Left | 00:00–02:56 |
| Pueblo das Campanas | Three Steps West | 00:00–02:56 |
| Pântano de Vidro | Black Powder Prayer | 00:00–02:56 |
| Dama da Meia-Noite | Last Drink for the Wicked | 00:00–02:27, retorna a 00:00 |
| Ferrovia dos Condenados | Iron Boots on Wicked Ground | 00:00–02:56 |
| Fortaleza dos Corvos | Vengeance Has a Heavy Heel | Primeira passagem: 00:00–02:55; loops seguintes: 00:06–02:55 |

WASD, setas ou toque e arraste movimentam o personagem. Ele fica parado quando nenhuma direção está pressionada. Ataques são automáticos. Os tornados do clima e os chefes ainda causam dano, mas o vento não arrasta o personagem sem comando. Escape pausa a partida. A interface, os controles e a câmera se ajustam a celular e desktop; no celular o jogo reduz a resolução do renderizador para preservar a taxa de quadros.

## Rodar e validar

1. Instale o Node.js compatível com o Vite do projeto.
2. Na pasta do projeto, execute npm ci.
3. Execute npm run dev para jogar localmente.
4. Execute npm run build para validar a versão de produção.

Para publicar no GitHub Pages, mantenha base como /FaroesteSuvivors/ no vite.config.js. O pacote da atualização contém src, index.html e README.md; package.json, package-lock.json e vite.config.js continuam na raiz do repositório.
