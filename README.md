# Faroeste Survivors — versão 0.3 · Cartas do Sertão

Atualização da versão 0.2: animação articulada de João Vaqueiro, três cartas de evolução, pistola, molotov, chupacabras, dificuldade crescente, loja com melhoria permanente de vida e mercador 3D animado. Inclui efeitos e duas músicas originais sintetizadas, em arquivos WAV dentro de `src/assets/audio`.

## Instalação

1. Faça backup do projeto atual e revise conflitos caso tenha feito alterações próprias.
2. Extraia o ZIP e copie `src`, `index.html` e este README para `C:\projetos\webjogos\FaroesteSuvivors`, mesclando pastas e substituindo os arquivos desta entrega.
3. Preserve seu `package.json`, `package-lock.json` e as configurações do Vite. O projeto continua JavaScript com ES Modules (`"type": "module"`).
4. Execute na pasta do projeto:

```powershell
npm install three@0.186.0
npm run dev
```

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd`. Abra o endereço informado pelo Vite; não use `file://`.

O ZIP contém somente `src`, `index.html` e README. Não inclui testes, `node_modules`, `dist`, configurações ou package.json. A entrada permanece `src/menu-main.js`; arquivos antigos que não são importados podem continuar no projeto.

É necessário WebGL2 e aceleração gráfica. Não há nova biblioteca de runtime além do Three.js já utilizado. Áudio e modelos estão no pacote; não há CDN, fontes externas ou download de arte durante a partida.

## O que mudou

- João tem ombros, cotovelos, joelhos, giro suavizado, movimento de cabeça, balanço do gibão e do corpo, recuo no tiro e gesto de arremesso. O ciclo das pernas para ao ficar bloqueado. O chicote enrolado aparece na mão quando não está atacando.
- Ao subir de nível, a partida e seus temporizadores congelam e surgem três cartas. Uma escolha por nível. Se uma coleta atravessar vários níveis, as escolhas são apresentadas sucessivamente, sem perder o XP excedente.
- Cartas adquiridas reaparecem como evolução de grau nas próximas escolhas. As três opções sempre são pistola, molotov e coração.
- Morcegos e chupacabras aumentam vida, dano e armadura com o tempo, inclusive os já presentes.
- A loja tem Bento, o Andarilho: mercador procedural encapuzado, mochila, bolsas, braços cruzados, respiração e gesto de agradecimento após compra aprovada. Sua roupa e silhueta usam a referência visual como inspiração em estilo low-poly.
- A melhoria permanente de vida usa moedas coletadas nas partidas. O saldo da v0.2 é preservado.

## Cartas e regras de combate

| Carta | Primeiro grau | Próximos graus |
| --- | --- | --- |
| Pistola do Sertão · Ferro | 15 de dano; uma bala a cada 1,7 s; mira no inimigo próximo até 18 unidades | +5 de dano por grau; intervalo -0,08 s por grau, mínimo 0,65 s |
| Coquetel Molotov · Fogo | Arremessa a cada 5 s quando existe inimigo até 12 unidades; mira no mais próximo; fogo circular por 4 s; 10 de dano por segundo | +3 de dano/s, +0,25 s de duração (máximo 6 s), +0,15 de raio (máximo 4) e -0,15 s no intervalo (mínimo 3 s) por grau |
| Coração de Vaqueiro · Vida | +20 de vida máxima e recupera 20 de vida na partida | Cada nova escolha repete +20 de vida máxima e recuperação de 20 |

A pistola atira na última direção de movimento quando não encontra alvo. A bala percorre o cenário e acerta o primeiro inimigo em sua trajetória; colisão considera todo o segmento percorrido no passo, evitando atravessar inimigos entre quadros.

O molotov viaja por 0,65 s e deixa o fogo na posição escolhida no lançamento. O círculo permanece no chão e não persegue o alvo. No grau inicial são quatro pulsos de 10 de dano, aos 1, 2, 3 e 4 segundos. Nos graus com duração fracionada, o último trecho aplica dano proporcional. Regiões sobrepostas causam dano independentemente. O fogo não machuca João.

Os valores de dano são anteriores à redução por armadura e aos bônus de sequência. O chicote mantém 10 de dano e ataque automático da v0.2. Esta versão não adiciona uma quarta carta para ele.

### Mecânica original: Trinca do Sertão

Cada carta pertence a um naipe: Ferro, Fogo ou Vida. A ordem das escolhas forma uma sequência:

- Primeira escolha: sequência 1.
- Escolher um naipe diferente do anterior aumenta a sequência, até 3.
- Repetir o mesmo naipe melhora o grau normalmente e reinicia a sequência em 1.
- Pistola ou molotov na sequência 2 ganha +20% de dano durante 20 segundos; na sequência 3, +40%. O bônus vale para novos disparos/arremessos da habilidade escolhida. Cada projétil preserva o dano que tinha ao ser lançado.
- Coração na sequência 2 recupera 10 de vida extra; na sequência 3, 20 extras, respeitando o máximo. A vida máxima continua aumentando em 20.
- Uma nova escolha substitui o bônus temporário anterior. O tempo do bônus congela durante pausa e escolha de cartas.

Assim há uma decisão entre concentrar graus em uma habilidade ou alternar naipes para obter um impulso imediato. As cartas mostram o próximo grau, seus atributos e o bônus previsto antes da escolha.

Graus e aumentos de vida das cartas duram somente a partida. O nível de João segue 100 XP para 1→2, 300 para 2→3, 600 para 3→4, 1000 para 4→5; fórmula por nível: `100 × nível × (nível + 1) / 2`.

## Inimigos e dificuldade

| Inimigo | Vida base | Dano base | Armadura base | Recompensa |
| --- | --- | --- | --- | --- |
| Morcego | 10 | 10 | 0 | Bala de 10 XP; 1 moeda nos marcos de cinco abates quando o abatido é morcego |
| Chupacabra | 35 | 14 | 2 | Bala de 20 XP e 2 moedas |

O primeiro chupacabra pode surgir a partir de 60 segundos de partida, inicialmente um por onda. O intervalo começa em 7 s e diminui até 2 s; a quantidade aumenta a cada quatro minutos após sua estreia. Os morcegos continuam surgindo. Há limite total de 160 inimigos ativos para controlar o custo de renderização e simulação.

A cada minuto completo, a vida base é multiplicada por `1 + 0,18 × minuto`, o dano por `1 + 0,12 × minuto` (ambos arredondados) e a armadura recebe `floor(minuto / 2)`. A velocidade também cresce moderadamente. Como o chupacabra estreia no minuto 1, seu primeiro exemplar tem 41 de vida e 16 de dano. Inimigos existentes preservam a porcentagem de vida restante quando seus atributos crescem.

Mitigação: `dano recebido = dano bruto × 20 / (20 + armadura)`. A armadura afeta chicote, balas e fogo. A proteção de João após contato permanece em 0,9 s.

## Loja e salvamento

**Fôlego de Vaqueiro:** cada compra acrescenta permanentemente +20 de vida inicial. Sem compra: 100; uma compra: 120; duas: 140, e assim por diante.

Preço: `ceil(25 × 1,55 ^ compras anteriores)` → **25, 39, 61, 94, 145…** moedas. Não há teto de compras definido no balanceamento; valores fora do intervalo numérico seguro são recusados. O botão é desabilitado se o saldo não for suficiente. Uma compra desconta o preço atual e incrementa a melhoria exatamente uma vez.

Moedas recolhidas são creditadas imediatamente. O saldo, a melhoria de vida e as preferências usam a mesma chave local da v0.2, `faroeste:profile:v2`, com campos adicionais. Portanto, atualizar não limpa o saldo. Se o navegador bloquear o armazenamento, as alterações continuam somente na sessão e a interface avisa. Não há salvamento da partida em andamento, sincronização online ou moedas pagas com dinheiro real.

Para manter o saldo, use a mesma origem de antes: navegador/perfil, protocolo, host e porta. `localhost:5173` e `localhost:5174`, por exemplo, têm armazenamentos distintos.

## Áudio incluído

Todos os arquivos abaixo estão em `src/assets/audio`, WAV mono de 22.050 Hz:

| Arquivo | Uso |
| --- | --- |
| menu-western.wav | Tema do menu/loja, cerca de 41,74 s, 92 BPM, loop |
| desert-western.wav | Tema da primeira fase, cerca de 34,29 s, 112 BPM, loop |
| whip.wav | Estalo do chicote |
| shot.wav | Disparo da pistola |
| glass.wav | Garrafa quebrando ao atingir o chão |
| fire.wav | Crepitação em loop enquanto houver regiões de fogo |
| level.wav | Subida de nível |
| purchase.wav | Compra aprovada |
| hurt.wav | João recebendo dano |

As duas composições são originais, instrumentais e sintetizadas, com assovio, cordas dedilhadas com timbre de violão, baixo e percussão leve. Não contêm canto nem gravações de músicas comerciais. São trilhas de protótipo, prontas para substituir por gravações produzidas posteriormente.

Por exigência dos navegadores, o áudio começa após um clique, toque ou tecla. Música e efeitos têm controles separados nas Configurações. Ao entrar na fase, o tema muda; ao voltar aos menus, retorna ao tema do menu. Pausas/cartas reduzem a música e silenciam efeitos; ocultar a aba suspende o áudio. Os loops e os efeitos são descartados corretamente ao sair/reiniciar.

## Controles e ciclo de partida

- A entrada de João dura seis segundos: caminha por 5,6 s e para por 0,4 s. O cronômetro e inimigos só começam depois.
- WASD/setas ou joystick de toque mudam a direção. João continua automaticamente na última direção escolhida.
- Chicote, pistola e molotov atacam automaticamente; os dois últimos precisam ser desbloqueados nas cartas.
- Escape/botão pausa: interrompe a simulação. Se usado durante uma escolha, permite pausar/sair e retornar às mesmas cartas; não elimina escolhas pendentes.
- Tab/Enter e toque permitem selecionar cartas e produtos. As cartas ficam em uma coluna com rolagem no celular.
- Vitória aos 15 minutos de tempo de jogo; derrota ao zerar a vida. Introdução, pausas e escolhas não consomem a duração da fase. Reiniciar limpa os graus das cartas, preservando a melhoria comprada na loja.

## Arquitetura

- `models/RunModel.js`: estado da partida, XP, escolhas e sequência de naipes.
- `config/abilityConfig.js`: atributos, descrições, progressão dos inimigos e preço da loja.
- `systems/RunSystem.js`: movimento, contatos, drops e coleta.
- `systems/EnemySystem.js`: ondas, perseguição e escalada de dificuldade.
- `systems/CombatSystem.js`: chicote, balas, arremessos, fogo e mitigação.
- `viewmodels/GameViewModel.js`: coordenação entre simulação, áudio e saldo.
- `views/CowboyRig.js`: modelo articulado e animação; `ChupacabraFactory.js`: novo inimigo.
- `views/MerchantView.js`: mercador, animação de repouso e agradecimento.
- `views/AbilityEffectsView.js`: renderização instanciada dos projéteis, garrafas, fogo e impactos.
- `views/UpgradeCardsView.js`: apresentação das cartas; `ScreenView.js`: telas e HUD.
- `services/ProfileService.js`: migração, compra e persistência; `AudioService.js`: arquivos de áudio, buses, loops e preferências.
- `app/GameApplication.js`: composição, navegação e ciclo de vida.

Os Models e Systems não importam Three.js nem acessam DOM. A simulação usa passos fixos de 1/60 s. Balas usam colisão contínua por segmento; os inimigos reutilizam modelos, e efeitos/XP usam instanciamento. Renders, eventos, contextos e buffers são liberados ao trocar telas. A entrega permanece em HTML, CSS e JavaScript, sem Angular.

## Validação desta entrega

Build de produção com Vite 8.3.0 e Three.js 0.186.0. Nove testes de regras verificam pausa de evolução, escolhas enfileiradas, atributos, cadência/dano da pistola, quatro pulsos de fogo, surgimento e escalada dos cães, armadura, migração/compras e uma simulação completa de 15 minutos.

Fluxos de navegador verificados: compra e agradecimento, leitura dos nove arquivos de áudio, troca de música, escolha e evolução das cartas, vida máxima, pausa, cão após um minuto, fogo no chão e layouts desktop/celular. Os testes utilizados na produção não estão no ZIP.

Ainda é um protótipo: visual low-poly procedural, animações por código e música sintetizada. O balanceamento foi definido para esta etapa e deve ser ajustado com partidas reais. A verificação automatizada não substitui a avaliação de desempenho e áudio no celular/computador de destino.
