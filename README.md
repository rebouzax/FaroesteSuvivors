# Faroeste Survivors — versão 0.4 · Expansão do Sertão

Continuação da versão 0.4 do repositório público: nova arte de menu, chupacabra animado, personagem e deserto 3D refinados, três novas habilidades e trilhas musicais fornecidas pelo autor. Mantém as funcionalidades dos mercadores e dos urubus.

## Aplicar este pacote

1. Faça backup do projeto e revise conflitos se tiver alterações locais posteriores.
2. Extraia o ZIP. Após preservar quaisquer mudanças suas, substitua a pasta `src` inteira em `C:\projetos\webjogos\FaroesteSuvivors` pela versão do ZIP, e copie `index.html` e `README.md`. Assim os antigos WAV do morcego e das músicas também serão removidos.
3. Preserve `package.json`, `package-lock.json`, configuração do Vite e workflow do GitHub Pages. Não há dependências novas; usa o Three.js e o Vite existentes.
4. Execute:

```powershell
npm run dev
npm run build
```

Use `npm ci` antes se as dependências ainda não estiverem instaladas. Se o PowerShell bloquear `npm.ps1`, use `npm.cmd`. Abra o endereço do Vite, não o arquivo HTML diretamente.

O pacote contém somente `src/`, `index.html` e este README. Testes, ferramentas de validação, `dist` e `node_modules` não estão incluídos. Como o package.json foi preservado, o log do npm pode continuar mostrando 0.0.3; a interface e esta entrega são 0.4.

Para publicar, envie os arquivos atualizados ao repositório. O workflow existente fará o build. Mantenha `base: "/FaroesteSuvivors/"` na configuração do Vite. Após a publicação, atualize a página com Ctrl+F5.

## Preparação e acesso ao mercado

- Novo jogo abre apenas a escolha de personagem.
- Escolher João abre apenas a escolha de fase.
- Escolher o Deserto dos Esquecidos inicia a partida.
- Voltar permite trocar a escolha anterior.
- Mercado do Bento aparece como botão grande logo abaixo de Novo jogo e junto das escolhas, com o saldo guardado.
- Entrar no mercado e voltar preserva a etapa de preparação.

## Mercado permanente do menu

| Produto | Bônus por compra | Preço inicial |
| --- | --- | --- |
| Coração de Vaqueiro | +20 de vida inicial | 25 |
| Mãos Ligeiras | +8% de velocidade de ataque, aplicada a todas as armas | 35 |
| Passo do Sertão | +5% de velocidade de movimento | 30 |
| Couro e Aço | +2 de dano base da arma principal; para João, o chicote | 40 |

O preço de cada produto é `ceil(preço inicial × 1,55 ^ compras anteriores daquele produto)`. São compras repetíveis; cada produto tem seu próprio nível e preço. Valores que ultrapassam o intervalo seguro de números são recusados.

Os bônus de velocidade são aditivos sobre a base: duas compras de ataque dão +16%; duas de movimento dão +10%. O intervalo de ataque é dividido pelo multiplicador de velocidade. Para respeitar as animações e limitar a carga, os intervalos finais têm mínimos: chicote 0,40 s, pistola 0,15 s, molotov 0,70 s.

O dano do chicote é `10 + 2 × nível permanente + 3 × melhorias temporárias`, antes da armadura do alvo.

## Mercador itinerante da partida

Bento aparece uma vez em cada janela, usando tempo efetivo da partida:

| Aparece | Desaparece |
| --- | --- |
| 1:40 (100 s) | 3:00 (180 s) |
| 7:00 (420 s) | 10:00 (600 s) |

Cada aparição escolhe um ponto aleatório numa clareira a aproximadamente 18–30 unidades do jogador, dentro dos limites do mapa. Há busca alternativa de clareira caso os obstáculos bloqueiem as tentativas. O mercador tem um modelo 3D, banca, anel dourado e marcador flutuante. O HUD mostra direção, distância e tempo até a partida de Bento.

Aproximar-se a menos de 2,4 unidades abre a loja automaticamente. Personagem, inimigos, ataques, efeitos temporizados e relógio congelam. Portanto Bento não desaparece enquanto o jogador está comprando.

A loja apresenta apenas habilidades já possuídas:

- Chicote: sempre disponível; +3 de dano por compra temporária.
- Pistola: aparece após desbloqueada; compra sobe um grau, usando a mesma progressão das cartas.
- Molotov: aparece após desbloqueado; compra sobe um grau.
- Coração: aparece após adquirido por carta; +20 de vida máxima e recupera 20 de vida.

Cada produto começa em 8 moedas da partida. Preço: `ceil(8 × 1,6 ^ compras anteriores daquele produto nesta partida)` → 8, 13, 21, 33… Os graus obtidos ao subir de nível não aumentam o contador de compras. Compras no mercador não consomem escolhas de nível nem ativam/alteram a sequência de naipes.

Voltar à partida ou Escape fecha a loja. João recebe 1,5 s de proteção de contato e precisa se afastar mais de 4 unidades antes de reabrir a mesma banca. O preço e as melhorias persistem entre as duas visitas da mesma partida; tudo temporário é reiniciado na próxima.

## Duas carteiras e salvamento

- **Moedas guardadas:** saldo do menu. Compra melhorias permanentes.
- **Moedas da partida:** começa em zero e recebe as moedas recolhidas no mapa. Compra melhorias temporárias.
- O saldo guardado nunca é debitado pelas compras no mapa.
- Ao vencer, perder ou encerrar pelo menu, somente as moedas não gastas da partida são transferidas ao saldo guardado, uma única vez.
- Gastos temporários não são reembolsados. Uma nova partida começa sem as melhorias temporárias e com carteira zero.

A chave de armazenamento continua `faroeste:profile:v2`. Saldo, vida e preferências existentes são preservados; os novos níveis de ataque, movimento e arma principal começam em zero. Se o navegador bloquear o armazenamento, as alterações valem apenas na sessão e a interface informa.

Não existe salvamento da partida em andamento: fechar ou recarregar a página antes de encerrar perde o progresso e as moedas daquela partida. Use Encerrar e voltar para guardar o saldo restante. O armazenamento é local por navegador, perfil e origem (host/porta/protocolo); não sincroniza entre aparelhos.

## Inimigos e urubus

| Inimigo | Entrada | Vida base | Dano base | Comportamento |
| --- | --- | --- | --- | --- |
| Morcego | Início | 10 | 10 | Persegue João |
| Chupacabra | 1:00 | 35 | 14 | Persegue João, mais rápido e resistente |
| Urubu carniceiro | 2:00 | 6 | 2 | Bando de seis, avanço em linhas paralelas |

Morcegos e chupacabras mantêm a progressão anterior: a cada minuto, vida base × `(1 + 0,18 × minuto)`, dano base × `(1 + 0,12 × minuto)`, arredondados; armadura base + `floor(minuto / 2)`. Base de armadura: morcego 0, chupacabra 2. Os urubus ficam com 6 de vida, 2 de dano e zero armadura durante toda a fase.

O primeiro bando surge aos 120 s; os próximos usam intervalo `max(12, 22 - minuto)` segundos. Cada bando fixa a direção na posição de João no instante do surgimento. São seis faixas paralelas espaçadas em 1,4 unidade, com origem a 26 unidades do alvo inicial:

1. Aviso de 1,5 s, com faixas vermelhas no solo, texto no HUD e som de urubu.
2. Avanço a 10 unidades/s, sem perseguir a nova posição de João.
3. Após atravessar a área, os sobreviventes saem e são removidos aos 10 s de existência, sem gerar recompensa.

Urubus em aviso ainda não causam contato. Mortos em combate deixam bala de 10 XP; seguem a regra de moeda a cada quinto abate não canino. Chupacabras deixam 20 XP e duas moedas. A armadura reduz dano pela fórmula `dano × 20 / (20 + armadura)`.

A população de perseguidores respeita o limite geral anterior de 160; bandos têm reserva de até 24 urubus, permitindo no máximo 184 entidades no cenário.

## Cartas e controles preservados

A partida dura 15 minutos após a entrada animada de seis segundos. WASD/setas ou joystick de toque mudam a direção; João continua andando automaticamente na última direção. As armas atacam automaticamente.

Ao subir de nível, aparecem três cartas sorteadas entre seis habilidades: pistola, molotov, coração, ferraduras, bala fantasma e réquiem. Apenas uma carta pode ser escolhida por nível. As opções mudam a cada evolução; uma habilidade adquirida poderá voltar como melhoria em uma evolução futura. XP exigido dentro de cada nível: 100, 300, 600, 1000… (`100 × nível × (nível + 1) / 2`).

- Pistola: 15 de dano e intervalo base de 1,7 s; +5 de dano e -0,08 s por grau, até 0,65 s antes do bônus permanente de ataque.
- Molotov: 10 de dano/s, fogo por 4 s e intervalo base de 5 s. Cada grau acrescenta 3 de dano/s, 0,25 s de duração (máximo 6 s), 0,15 de raio (máximo 4) e reduz 0,15 s do intervalo (mínimo 3 s antes do bônus permanente).
- Coração: +20 de vida máxima e recuperação de 20 por escolha.
- Ferraduras Malditas: começam com duas ferraduras girando ao redor de João, causando 8 de dano por contato; ganham 3 de dano por grau e uma ferradura extra a cada dois graus, até seis. Um mesmo inimigo tem intervalo de 0,45 s entre contatos.
- Bala Fantasma: dispara sozinha na direção do inimigo mais próximo e atravessa dois alvos, 18 de dano inicial e intervalo base de 3,5 s; cada grau dá +5 de dano, +1 alvo atravessado e reduz 0,2 s do intervalo.
- Réquiem da Poeira: libera onda circular ao redor do personagem, começa com raio 4,3 unidades, 12 de dano e intervalo de 6 s; empurra inimigos atingidos e aumenta dano/raio a cada grau.
- Alternar naipes nas cartas aumenta a sequência até 3: qualquer carta ofensiva recebe +20%/+40% de dano por 20 s; coração recupera 10/20 extras. Repetir reinicia a sequência em 1.
- Escape pausa/retoma; dentro do mercador, fecha a loja. Tab/Enter e toque funcionam nos menus.
- Pausa, cartas e loja não consomem o tempo da fase.

## Música e efeitos

As duas faixas MP3 enviadas foram incluídas em `src/assets/audio/`. O anexo da segunda música se chamava **The_Outlaw_s_Last_Prayer.mp3.mpeg** (no pedido, “Last Player”); por isso usamos a música realmente fornecida.

| Arquivo | Onde toca |
| --- | --- |
| `one-bullet-left.mp3` | Menu principal, seleção, configurações e mercado permanente |
| `the-outlaws-last-prayer.mp3` | Partida, incluindo a loja do mercador itinerante |

As músicas tocam em loop via elemento de áudio, evitando decodificar três minutos de MP3 na memória. O navegador exige o primeiro clique ou toque para iniciar o áudio. Configurações permite ligar/desligar os efeitos e a música. Efeitos de chicote, bala, garrafa, fogo, compra, dano, nível, chupacabra e urubu continuam em WAV. **O som de morcego foi removido**: não há arquivo nem acionamento em jogo. As faixas WAV sintetizadas anteriores do menu e da partida foram substituídas pelas músicas novas. Ajuste o volume do aparelho e a opção de áudio do site caso o navegador esteja mudo.

## Arte e desempenho

A logo do menu é um PNG transparente baseado na capa do próprio jogo. Um chupacabra desenhado por código rói um osso no deserto de fundo; com movimento reduzido do sistema, ele fica estático. João mantém seu chapéu de vaqueiro, cabelo curto e rosto sem barba/lenço, agora com lapelas, cinturão, coldre, esporas, revolver mais detalhado e animações de caminhada, chicote e disparo aprimoradas. O retrato 3D na seleção tem animação suave de espera.

O mapa ganhou ondulações rasas, cores do terreno por vértice, cercas, arbustos, ossos, cactos e paredões mais variados. Grande parte da decoração está em `InstancedMesh` para reduzir chamadas de desenho, preservando o solo transitável plano e os limites da fase. Os novos efeitos usam instâncias com limites fixos para evitar crescimento infinito em partidas longas.

## Organização MVVM adaptada

- `models/RunModel.js`: estado, habilidades, carteira e compras temporárias.
- `services/ProfileService.js`: preferências, migração, carteira e compras permanentes.
- `viewmodels/GameViewModel.js`: simulação, eventos sonoros e transferência única do saldo restante.
- `config/shopConfig.js`: catálogo, preços e janelas do mercador.
- `systems/MerchantSystem.js`: aparição, clareiras, aproximação e reentrada.
- `systems/EnemySystem.js`: ondas, progressão, vocalizações e cargas dos urubus.
- `systems/CombatSystem.js`: bônus das armas, projéteis, fogo e novas habilidades.
- `config/abilityConfig.js`: catálogo, progressão e textos das seis cartas.
- `views/DesertWorldView.js`, `MenuChupacabraView.js`: cenário otimizado e mascote animado do menu.
- `views/CowboyRig.js`, `AbilityEffectsView.js`: João e efeitos das habilidades.
- `views/PreparationView.js`: personagem e fase em telas distintas.
- `views/ShopView.js`: produtos e cartas das duas lojas.
- `views/MapMerchantView.js`, `VultureFactory.js`: modelos procedurais no cenário.
- `app/GameApplication.js`: navegação, ciclo e coordenação dos diálogos.
- `styles/version04.css`: seleção, mercado, avisos e adaptação ao celular.

Modelos e sistemas não dependem do DOM ou de Three.js. Não há novo framework, backend, serviços externos ou mudança de deploy.

## Verificação

Execute `npm ci` (se necessário) e `npm run build` antes de enviar ao GitHub Pages. Teste em navegador com áudio liberado após interação, incluindo troca de menu para partida, evoluções, chegada ao mercador e controles no celular. Os arquivos `package.json`, Vite e workflow existentes permanecem compatíveis; o pacote solicitado traz somente `src`, `index.html` e `README.md`.
