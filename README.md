# Faroeste Survivors — versão 0.6 (ajustes de interface e personagens)

Jogo web de sobrevivência por 15 minutos, com cenário 2.5D, personagens e criaturas em GLB animado. Feito em HTML, CSS e JavaScript com Vite e Three.js. A lógica vive em `models/` e `systems/`; as telas e o 3D ficam em `views/`; `GameApplication` coordena a interface, o áudio e o modelo da partida (MVVM adaptado).

## Como instalar esta atualização

1. Antes de substituir, faça uma cópia das suas alterações locais.
2. No projeto `C:\projetos\webjogos\FaroesteSuvivors`, **substitua a pasta `src` inteira** pela deste ZIP e copie `index.html` e `README.md` para a raiz. Substituir a pasta elimina músicas e assets removidos.
3. Conserve seus arquivos `package.json`, `package-lock.json`, `vite.config.js` e `.github/`; não há dependências novas. Seu `package.json` pode continuar exibindo `0.0.3`: a versão do conteúdo é **0.6**.
4. Execute `npm ci` se as dependências ainda não estiverem instaladas; use `npm run dev` para testar e `npm run build` para compilar. No PowerShell que bloqueia `npm.ps1`, use `npm.cmd run dev`.
5. Para GitHub Pages, mantenha `base: "/FaroesteSuvivors/"` no Vite; publique após o build pelo fluxo já configurado.

O ZIP contém apenas `src/`, `index.html` e `README.md`. Os MP3, WAV e GLB prontos estão em `src/assets/`.

## Escolha de personagem e fase

**Novo jogo → personagem → fase → jogar.** No menu superior, o idioma inicial é **inglês (EUA)**; você também pode escolher espanhol e português brasileiro. O idioma e as compras permanentes ficam salvos no `localStorage` existente (`faroeste:profile:v2`). O idioma pode ser alterado também em Configurações.

| Personagem | Vida inicial | Arma principal | Ataque automático |
| --- | ---: | --- | --- |
| João Vaqueiro | 100 | Chicote | 10 de dano em arco, a cada 1,05 s |
| Maria Bonita | 90 | Revólver | 14 de dano, tiro direcionado, a cada 1,25 s |
| Indigo | 105 | Arco | 17 de dano, flecha que pode atravessar dois inimigos, a cada 1,55 s |

Cada personagem usa um GLB próprio, com **Idle, Walk, animação da arma principal, Shot, Throw e Hurt**. As armas miram automaticamente no inimigo mais próximo; na ausência de inimigos também miram em caixas próximas. As melhorias permanentes de dano da arma principal se aplicam ao personagem escolhido. Maria e Indigo têm identidade visual e animações próprias; seus arquivos ficam em `src/assets/models/`.

Nesta revisão, João recebeu torso, mangas e chapéu mais arredondados e casaco curvo; Maria ganhou silhueta, traços de rosto, cabelos longos, trança, jaqueta curta, abas de roupa e dois coldres próprios; Indigo ganhou túnica, faixa, cabelo preso, aljava, arco e braços expostos. Cada um tem cadência, postura e ataque próprios: revólver de Maria e arco de Indigo agora acionam a animação principal durante o disparo. Os GLBs foram regenerados localmente com Three.js, usando a imagem de conceito como direção artística. **Não há integração disponível neste projeto que produza personagens 3D automaticamente a partir de imagem**; os modelos continuam estilizados e não são reconstruções fiéis de escultura profissional. Podem ser substituídos no futuro por GLBs criados num editor 3D mantendo os nomes das animações.

| Fase | Ambiente |
| --- | --- |
| Deserto dos Esquecidos | Dunas, rochas, cactos e cercas sob o sol |
| Mina da Noite | Galerias escuras, postes iluminados, trilhos, minério e vagonetes |
| Cidade Fantasma | Rua central, fachadas, marquises, postes, barris e cemitério |

Os mapas mantêm o limite de 240 × 240 unidades e a câmera acompanha o personagem. O mesmo conjunto de inimigos, chefes, mercador, vento, missões e duração está disponível nos três. Personagem caminha automaticamente após a introdução de seis segundos; WASD, setas ou toque mudam a direção. Escape ou o botão de pausa suspende a partida.

## Inimigos e chefes

Continuam os morcegos, chupacabras (1:00), urubus em bandos de seis (2:00), esqueletos pistoleiros (3:00) e espectros mineiros (4:30). Morcegos seguem sem som próprio. Todos os sete tipos de inimigo, contando os chefes, usam GLBs separados com clips de voo, corrida, caminhada ou golpe.

- **Coveiro Maldito**, às **6:00**: 300 de vida, 20 de dano, 200 XP e 80 moedas deixadas no chão quando derrotado.
- **Xerife das Sombras**, às **11:00**: 520 de vida, 26 de dano, 320 XP e 120 moedas deixadas no chão.

Ao começar cada encontro, os inimigos comuns desaparecem sem recompensa, e suas ondas param. Uma roda de fogo encolhe de raio 12 para 6, empurra o personagem para dentro e causa 8 de dano por segundo na borda. Quando o chefe morre, o círculo some e as ondas voltam; o próximo chefe aparece no seu horário ou após o encontro anterior terminar. Cada chefe ocorre uma vez por partida.

## Eventos, caixas e missões

A partir de **2:30**, tempestades acontecem aproximadamente a cada **2:25**: três pequenos tornados atravessam a região por 21 segundos, com rajadas que deslocam João, Maria ou Indigo. Tocar um tornado causa 8 de dano antes da redução por armadura e usa a mesma imunidade breve dos demais golpes. Os tornados cessam durante o combate com chefes.

Caixas surgem em posições livres próximas ao personagem e são renovadas quando ele avança pelo mapa. Cada caixa tem **18 de vida**. Ao quebrá-la, há **38% de chance** de cair uma bandagem (+25 de vida até o máximo); caso contrário, caem **4 a 10 moedas**. É preciso chegar perto para coletar o item. Comprar **Sorte de Garimpeiro** aumenta a chance de bandagem até 75%.

Missões secundárias aparecem durante a partida: eliminar sete morcegos em 65 s (início 0:45), quebrar três caixas em 100 s (4:00) e eliminar seis esqueletos em 105 s (8:15). Cumprir a meta pausa o jogo e permite escolher **uma** recompensa: evoluir uma carta disponível, +25 moedas dessa partida ou +20 de vida máxima e cura de 40. Missões falhadas expiram; o cronômetro para quando aparece uma escolha de carta, o mercador ou a pausa.

## Cartas e mercador

Além das nove cartas anteriores, três novas surgem entre as opções de nível e no mercado durante a partida depois de adquiridas:

| Carta | Efeito |
| --- | --- |
| Estilhaços de Ossos | Seis projéteis em círculo, 12 de dano, a cada 5 segundos no nível 1; cresce em quantidade, dano e frequência |
| Vontade de Ferro | +3 de armadura por nível da carta na partida |
| Último Disparo | Abaixo de 35% de vida, +20% de velocidade de ataque por nível da carta |

O conjunto completo de cartas continua em `src/config/abilityConfig.js`: pistola, molotov, coração, ferraduras, bala fantasma, réquiem, chuva de prata, lampião, colheita de almas e as três acima. Ao subir de nível, três opções aleatórias são oferecidas; o jogador escolhe uma. Alternar cartas pode formar uma sequência temporária de dano. A progressão de XP começa em **100, 300, 600 e 1000** para os níveis seguintes.

O mercador Bento usa um GLB animado próprio, com animações **Idle** e **Thanks** após comprar. A loja do menu cobra moedas guardadas e vende melhorias permanentes; dentro do mapa, Bento aparece entre **1:40–3:00** e **7:00–10:00**, cobra moedas coletadas nessa partida, oferece as cartas já desbloqueadas e melhorias temporárias da arma, ataque e movimento. Cada compra aumenta o preço do mesmo produto. As compras temporárias somem ao voltar ao menu.

No mapa, Bento fica de pé em escala maior e aparece com um **ícone de bússola que acompanha sua posição na câmera**, preso à borda da tela quando está fora dela. A distância aparece abaixo do ícone; ao chegar perto, a partida pausa e abre a loja. A frase fixa de orientação sobre o centro do jogo foi removida. Cartas, mercador, recompensas, melhorias e a barra de habilidades usam ícones SVG locais em `src/views/GameIcons.js`.

Novas melhorias permanentes: **Sorte de Garimpeiro** (+4 pontos percentuais na chance de bandagem por compra, preço inicial 55 moedas) e **Lenda Aprendiz** (+5% no XP recebido por compra, preço inicial 50 moedas). Continuam à venda vida, velocidade de ataque, movimento, dano base, armadura e atração de itens. O preço permanente cresce por `ceil(preço inicial × 1,55 ^ compras anteriores)`; o temporário cresce por `ceil(8 × 1,6 ^ compras anteriores)`.

## Música e otimização

- **Menu, seleção e mercado permanente:** `vultures-circle-the-bone.mp3`, em loop.
- **Partida:** `seven-black-graves.mp3` toca de **0:00 até 2:49 (169 segundos)** na primeira reprodução. Depois repete apenas **0:05–2:49** até terminar a partida. Uma nova partida recomeça em 0:00; a música para após vitória ou derrota.
- Os efeitos de chicote, revólver, flecha, coquetel, fogo, ferimento, compra, evolução, chupacabra e urubu são WAV. O áudio depende de um clique ou toque prévio por regra dos navegadores; pode ser ativado ou desativado em Configurações.

Modelos, cenário e efeitos usam instâncias de geometria quando possível; GLBs são compartilhados e carregados de forma assíncrona, mixers de inimigos distantes não avançam a animação, a proporção de pixels é limitada no celular, e o número de caixas, efeitos, inimigos e itens é limitado. O logo agora usa WebP. **O build de produção pesa cerca de 12 MB**, bem abaixo do limite de 75 MB. O aviso do Vite de chunk JavaScript acima de 500 kB pode aparecer por causa do Three.js; ele não impede o build.

No celular, as telas ocupam uma viewport (`100dvh`) sem rolagem da página; a seleção apresenta escolhas compactas e a loja mostra um produto por vez com botões e gesto horizontal. As três cartas de nível cabem juntas no diálogo de telas pequenas. Tablets preservam grade de escolhas e produtos. Menu e prévias 3D usam limite de pixels e até 30 quadros por segundo em telas de toque; a partida reduz gradualmente a resolução se a taxa de atualização cair. O 3D da partida continua a evoluir em tempo real, e os efeitos de áudio permanecem iguais.

### Medição dos modelos

O valor abaixo conta **triângulos exportados** (polígonos triangulados) por GLB. A arte mantém silhuetas e materiais low poly com detalhes inspirados na era PS2:

| Modelo | Triângulos |
| --- | ---: |
| João Vaqueiro | 7.636 |
| Maria Bonita | 9.868 |
| Indigo | 10.082 |
| Mercador Bento | 600 |
| Morcego / chupacabra / urubu | 206 / 574 / 656 |
| Esqueleto / espectro mineiro | 1.000 / 1.142 |
| Coveiro / xerife | 1.020 / 1.166 |
| Cada urubu decorativo do menu | 160 |

O cenário do menu completo tem 4.722 triângulos, incluindo as rochas, dunas, cerca, crânio e os dois urubus decorativos. Os modelos são regeneráveis com `node src/tools/generateJoaoModel.mjs joao` (ou `maria` e `indigo`) e `node src/tools/generateWorldModels.mjs`, com a dependência `three` já instalada. Esses scripts executam no Node durante a criação dos assets; o navegador usa apenas os GLBs prontos.

## Organização e verificação

- `config/`: valores de personagens, mapas, habilidades, compras e duração.
- `models/`: estado da partida, terreno e perfil.
- `systems/`: combate, ondas, chefes, clima, caixas, missões e mercador.
- `services/`: música/efeitos, armazenamento, controles e tradução.
- `views/`: telas, HUD, modelos 3D e geometria das fases.
- `app/GameApplication.js` e `viewmodels/GameViewModel.js`: coordenação da interface com as regras.

A compilação Vite passou. Em navegador de computador e celular foram percorridos idioma, seleção dos três personagens e mapas, troca de faixa e loop, missão e recompensa, mercado, ambos os chefes, retorno à seleção e conclusão da partida. A lógica conferiu chance de caixa, coleta de bandagem, tempestade, recompensas, modelos e preços das novas melhorias. Nesta revisão também foram verificados tamanhos 320 × 568, 390 × 844 e tablet 768 × 1024, seleção, mercado, opções de cartas, indicador do Bento e rolagem da página.
