# Faroeste Survivors — versão 0.4 · Mercadores do Deserto

Atualização sobre o commit `376ee95` do repositório: seleção em etapas, mercado destacado, quatro melhorias permanentes, mercador itinerante, urubus em formação e sons dos monstros. Preserva as correções de áudio da versão 0.3, as cartas de evolução, a animação de João e os controles de toque.

## Aplicar este pacote

1. Faça backup do projeto e revise conflitos se tiver alterações locais posteriores.
2. Extraia o ZIP e copie `src`, `index.html` e `README.md` para `C:\projetos\webjogos\FaroesteSuvivors`, mesclando as pastas e substituindo os arquivos correspondentes.
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

Ao subir de nível, as três opções continuam sendo pistola, molotov e coração, uma escolha por nível. XP exigido dentro de cada nível: 100, 300, 600, 1000… (`100 × nível × (nível + 1) / 2`).

- Pistola: 15 de dano e intervalo base de 1,7 s; +5 de dano e -0,08 s por grau, até 0,65 s antes do bônus permanente de ataque.
- Molotov: 10 de dano/s, fogo por 4 s e intervalo base de 5 s. Cada grau acrescenta 3 de dano/s, 0,25 s de duração (máximo 6 s), 0,15 de raio (máximo 4) e reduz 0,15 s do intervalo (mínimo 3 s antes do bônus permanente).
- Coração: +20 de vida máxima e recuperação de 20 por escolha.
- Alternar naipes nas cartas aumenta a sequência até 3: pistola/molotov recebem +20%/+40% de dano por 20 s; coração recupera 10/20 extras. Repetir reinicia a sequência em 1.
- Escape pausa/retoma; dentro do mercador, fecha a loja. Tab/Enter e toque funcionam nos menus.
- Pausa, cartas e loja não consomem o tempo da fase.

## Áudio

Todos os 12 arquivos WAV ficam em `src/assets/audio/`. São efeitos e músicas sintetizados, PCM mono de 22.050 Hz:

| Arquivo | Uso |
| --- | --- |
| menu-western.wav | Música do menu e mercado permanente |
| desert-western.wav | Música da partida |
| whip.wav, shot.wav | Chicote e disparo |
| glass.wav, fire.wav | Garrafa e fogo |
| level.wav, purchase.wav, hurt.wav | Evolução, compra e dano |
| bat.wav | Guincho agudo e asas de morcego |
| chupacabra.wav | Rosnado |
| vulture.wav | Grasnado de aviso do bando |

Vocalizações de morcegos e chupacabras só ocorrem com a espécie a menos de 18 unidades. Há intervalo por espécie (5–8 s para morcegos, 7–11 s para chupacabras), evitando um som por monstro a cada quadro. Urubus emitem um aviso por bando.

O áudio inicia após clique, toque ou tecla. Configurações permite ligar efeitos, música e testar/repetir o carregamento. Ao voltar à aba, o contexto de áudio é retomado quando o navegador permite. Na loja da partida os sons de combate ficam suspensos, mas o som de compra usa um canal de interface separado. Nenhuma gravação comercial foi adicionada.

## Organização MVVM adaptada

- `models/RunModel.js`: estado, habilidades, carteira e compras temporárias.
- `services/ProfileService.js`: preferências, migração, carteira e compras permanentes.
- `viewmodels/GameViewModel.js`: simulação, eventos sonoros e transferência única do saldo restante.
- `config/shopConfig.js`: catálogo, preços e janelas do mercador.
- `systems/MerchantSystem.js`: aparição, clareiras, aproximação e reentrada.
- `systems/EnemySystem.js`: ondas, progressão, vocalizações e cargas dos urubus.
- `systems/CombatSystem.js`: bônus das armas, projéteis e fogo.
- `views/PreparationView.js`: personagem e fase em telas distintas.
- `views/ShopView.js`: produtos e cartas das duas lojas.
- `views/MapMerchantView.js`, `VultureFactory.js`: modelos procedurais no cenário.
- `app/GameApplication.js`: navegação, ciclo e coordenação dos diálogos.
- `styles/version04.css`: seleção, mercado, avisos e adaptação ao celular.

Modelos e sistemas não dependem do DOM ou de Three.js. Não há novo framework, backend, serviços externos ou mudança de deploy.

## Validação desta entrega

- Build de produção do Vite concluído, incluindo os 12 WAVs no caminho do GitHub Pages.
- Seis testes automatizados das regras: migração e bônus, carteiras e compras, janelas e pausa do mercador, trajetória dos urubus, seleção em etapas e integridade dos WAVs.
- Fluxo exercitado em Chromium, com viewport de computador (1280×900) e celular (390×844): seleção, compras permanentes, encontro com Bento, compras temporárias, relógio congelado, retorno e bando de urubus. Sem erros de JavaScript ou rolagem horizontal nos menus verificados.
- Os 12 arquivos foram decodificados no navegador; contexto Web Audio em execução e sinal não nulo medido na música. Isso não substitui ouvir e testar o volume em aparelhos físicos, especialmente Safari/iOS.
- O aviso já existente sobre o tamanho do pacote JavaScript permanece; ele não impede a compilação.
