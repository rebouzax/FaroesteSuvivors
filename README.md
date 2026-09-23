# Faroeste Survivors — versão 0.5

Jogo web de sobrevivência no deserto, feito com HTML, CSS, JavaScript, Vite e Three.js. João Vaqueiro enfrenta criaturas do faroeste sombrio por 15 minutos. Os sistemas mantêm a separação entre modelos, regras, apresentação e coordenação (MVVM adaptado ao jogo).

## Instalação da atualização

1. Preserve quaisquer alterações próprias antes de instalar o pacote.
2. Substitua a pasta `src` **inteira** pela do ZIP e copie `index.html` e `README.md` para `C:\projetos\webjogos\FaroesteSuvivors`. Isso também elimina arquivos de áudio e desenho removidos nas versões anteriores.
3. Mantenha seu `package.json`, `package-lock.json`, `vite.config.js` e workflow do GitHub Pages; não há dependências adicionais.
4. Na raiz do projeto, execute `npm ci` se ainda não tiver dependências e depois `npm run dev` para jogar ou `npm run build` para verificar o deploy. Se o PowerShell bloquear `npm.ps1`, utilize `npm.cmd`.

O ZIP contém somente `src/`, `index.html` e `README.md`, incluindo músicas, efeitos e arquivos `.glb`. O `package.json` existente ainda pode imprimir versão `0.0.3` no terminal; a versão da entrega e do menu é **0.5**. Para publicar no GitHub Pages, mantenha a configuração `base: "/FaroesteSuvivors/"` do seu Vite.

## Controles e preparação

- **Novo jogo** → escolher João Vaqueiro → escolher Deserto dos Esquecidos → iniciar.
- João caminha por seis segundos antes de a partida começar. Depois anda automaticamente na direção atual; altere-a com WASD, setas ou joystick de toque. Ele ataca automaticamente.
- Escape ou botão de pausa interrompe a partida. Níveis, pausa e compras congelam o relógio e o combate.
- O mercado de Bento no menu oferece melhorias permanentes usando moedas guardadas. O Bento no mapa aparece entre **1:40–3:00** e **7:00–10:00**; suas compras usam moedas obtidas na partida e duram só até ela acabar. Não aparece no meio da batalha contra o chefe.
- Fechar a aba durante uma partida perde o progresso e as moedas ainda não guardadas; encerrar a partida pelo menu salva o saldo restante no armazenamento local.

## Batalha aos seis minutos

**Coveiro Maldito** surge aos **6:00** com **300 de vida e 20 de dano por contato**. Os inimigos comuns desaparecem sem recompensas e novas ondas param de surgir. João é cercado por um círculo de fogo que começa com raio de 12 unidades, encolhe até seis e causa **8 de dano por segundo** a quem tocar a borda; ao tocar a borda o jogador é empurrado para dentro. O chefe persegue João dentro da arena.

Ao derrotá-lo, o círculo desaparece e as ondas normais voltam no próximo quadro. Ele deixa **200 XP e 80 moedas**. O evento ocorre **uma vez por partida**. Sua vida é mostrada no HUD, também no celular.

## Criaturas

| Inimigo | Primeira aparição | Vida base | Dano base | Comportamento |
| --- | ---: | ---: | ---: | --- |
| Morcego | 0:00 | 10 | 10 | Persegue João, sem efeito sonoro próprio |
| Chupacabra | 1:00 | 35 | 14 | Corre e persegue |
| Urubus carniceiros | 2:00 | 6 | 2 | Avançam em bandos de seis na direção marcada ao surgir |
| Esqueleto pistoleiro | 3:00 | 22 | 8 | Mantém distância e dispara projéteis a cada 2,7 s |
| Espectro mineiro | 4:30 | 42 | 12 | Persegue com deslocamento irregular |
| Coveiro Maldito | 6:00 | 300 | 20 | Chefe único, arena de fogo |

A vida/dano de morcegos, chupacabras, esqueleto e mineiro progridem com os minutos conforme a regra anterior: `vida × (1 + 0,18 × minuto)` e `dano × (1 + 0,12 × minuto)`. Os urubus e o chefe mantêm os valores definidos na tabela. O limite de perseguidores continua controlado para preservar o desempenho.

Cada criatura tem seu **próprio GLB** em `src/assets/models/`: `bat.glb`, `dog.glb`, `vulture.glb`, `skeleton.glb`, `miner.glb` e `boss.glb`. Esses arquivos contêm malhas low poly e animações para voo, corrida, caminhada ou ataque. O modelo mais detalhado de João permanece em `joao-vaqueiro.glb`, com clips Idle, Walk, Whip, Shot, Throw e Hurt. O cenário 3D inteiro dos menus fica em `menu.glb`, com o deserto, dois urubus, cerca e crânio; seu clip Wind controla movimentos discretos. A opção de movimento reduzido congela essas animações do menu. Os GLBs são carregados pelo Three.js, de forma compartilhada e assíncrona; o cenário do menu é descartado quando a partida começa.

Os arquivos são reproduzíveis sem Blender por `node src/tools/generateJoaoModel.mjs` e `node src/tools/generateWorldModels.mjs`, usando apenas a dependência Three.js já instalada. Esses scripts rodam somente durante a criação dos assets; o navegador carrega os GLBs prontos. Eles podem servir de base para substituir um modelo por outro feito em uma ferramenta 3D, mantendo as posições e os nomes dos clips usados pelo jogo.

## Cartas e habilidades

A cada nível surgem **três cartas sorteadas** do catálogo, das quais o jogador escolhe uma. Cada aquisição posterior da mesma carta aumenta seu grau. Alternar cartas ativa a sequência de dano temporária; Coração oferece cura. XP exigido para níveis sucessivos começa em 100, 300, 600 e 1000.

| Carta | Efeito inicial | Progressão |
| --- | --- | --- |
| Pistola do Sertão | 15 de dano, tiro automático a cada 1,7 s | +5 de dano e menor intervalo |
| Coquetel Molotov | Fogo de 10 de dano/s por quatro segundos | Maior dano, raio e duração |
| Coração de Vaqueiro | +20 de vida máxima e cura 20 | Mesma melhoria por grau |
| Ferraduras Malditas | Duas ferraduras giratórias, 8 de dano | Mais dano, ferraduras e alcance |
| Bala Fantasma | 18 de dano, atravessa dois inimigos | Mais dano, penetração e frequência |
| Réquiem da Poeira | Pulso de 12 de dano e empurrão | Mais dano, alcance e frequência |
| **Chuva de Prata** | Seis balas em círculo, 9 de dano cada | Mais balas, dano e frequência |
| **Lampião Maldito** | Aura próxima de 4 de dano/s | Mais dano e raio |
| **Colheita de Almas** | Recupera 2 de vida por abate | +1 de cura por grau, limitada pela vida máxima |

As três cartas novas também aparecem no mercado durante a partida depois de desbloqueadas. O Bento também vende **Tambor Acelerado** (+6% de velocidade de ataque) e **Esporas do Andarilho** (+5% de velocidade de movimento), ambos temporários e sempre disponíveis. Cada produto temporário começa em oito moedas e custa `ceil(8 × 1,6 ^ compras anteriores)` nas próximas compras daquele produto.

No mercado permanente, os produtos existentes continuam disponíveis: vida (+20), velocidade de ataque (+8%), velocidade de movimento (+5%) e dano base do chicote (+2). Entraram **Couro Reforçado** (+2 de armadura; preço inicial 45 moedas) e **Ímã do Garimpo** (+0,7 de raio de coleta; preço inicial 38). Cada compra de um produto permanente aumenta o preço daquele produto por `ceil(preço inicial × 1,55 ^ compras anteriores)`. Os novos níveis são migrados automaticamente do mesmo armazenamento `faroeste:profile:v2`.

## Música

A faixa `one-bullet-left.mp3` toca em loop nos menus, nas escolhas e no mercado permanente. Na partida, `the-outlaws-last-prayer.mp3` toca **do início até 2:23 (143 s)**; depois, enquanto a partida continuar, repete apenas o trecho **0:16–2:23 (16–143 s)**. A faixa para na vitória ou derrota e, ao iniciar uma nova partida, começa novamente em 0:00. O navegador só pode iniciar áudio após clique, toque ou tecla; a opção Música nas Configurações pode desligá-lo.

Os efeitos WAV de chicote, disparo, garrafa, fogo, compra, evolução, dano, chupacabra e urubu continuam incluídos. Morcegos não emitem som. O arquivo da faixa de gameplay enviado pelo autor foi nomeado `The_Outlaw_s_Last_Prayer.mp3.mpeg`; por isso o asset integrado utiliza **Prayer**.

## Organização

- `models/RunModel.js`: estado da partida, moedas, cartas e encontro.
- `systems/RunSystem.js`, `EnemySystem.js`, `BossSystem.js`, `CombatSystem.js`, `MerchantSystem.js`: regras determinísticas de combate, ondas, arena e mercador.
- `config/abilityConfig.js`, `shopConfig.js`: valores de habilidades e preços.
- `services/AudioService.js`, `ProfileService.js`: reprodução de música e efeitos, compras salvas.
- `views/GameView.js`, `AbilityEffectsView.js`, `EnemyAssetView.js`, `CowboyRig.js`, `DesertBackgroundView.js`: modelos, animações e cenário 3D.
- `app/GameApplication.js`: navegação, renderização e interação entre os componentes.
- `tools/generateJoaoModel.mjs`, `generateWorldModels.mjs`: construção offline dos assets 3D.

As regras de jogo não dependem de DOM ou Three.js. Os modelos inimigos compartilham assets entre instâncias, têm animação pausada longe da câmera e são reciclados após sair de cena. Para a renderização, o mapa conserva decoração por instâncias e efeitos com capacidade limitada.

## Verificação

O build de produção foi gerado com Vite. Foram conferidos: duração e posição do loop musical, migração das compras, aparição de novos inimigos, entrada e morte do chefe, bloqueio e retomada das ondas, borda de fogo, modelo 3D carregado e funcionamento em viewport de computador e celular. O aviso do Vite sobre o tamanho do chunk JavaScript pode aparecer por conta do Three.js e não impede a compilação.
