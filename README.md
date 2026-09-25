# Faroeste Survivors — atualização da versão 0.7

Jogo de sobrevivência de 15 minutos por fase, feito com HTML, CSS, JavaScript, Vite e Three.js. A arquitetura mantém regras em `src/models/` e `src/systems/`, interfaces em `src/views/`, estado de interface em `src/viewmodels/` e coordenação em `src/app/`.

## Atualizar o projeto existente

1. Faça uma cópia das suas alterações locais, se houver.
2. Em `C:\projetos\webjogos\FaroesteSuvivors`, **substitua a pasta `src` inteira** pela pasta `src` deste ZIP. Copie `index.html` e `README.md` para a raiz.
3. Preserve `package.json`, `package-lock.json`, `vite.config.js` e `.github/`. Não há dependências novas. Rode `npm ci` se ainda não tiver as bibliotecas instaladas, depois `npm run dev` e `npm run build`. Se o PowerShell bloquear `npm.ps1`, use `npm.cmd run dev` ou `npm.cmd run build`.
4. Para publicar pelo GitHub Pages, mantenha `base: "/FaroesteSuvivors/"` no `vite.config.js`.

O pacote inclui apenas `src/`, `index.html` e `README.md`. O perfil existente é preservado no armazenamento local do navegador.

## Menus, campanha e jogo livre

O menu principal agora tem apenas **Novo jogo, Configurações e Sair**. Novo jogo abre a escolha entre **Modo história** e **Jogo livre**. Depois, escolha **campeão → fase → jogar**. Deck Arsenal, Bestiário e Mercado do Bento ficam no topo da seleção. A grade de personagens tem rolagem interna, e o botão para avançar permanece visível em desktop e celular. Personagens e fases ainda fechados aparecem em cinza com “?”.

No modo história, sobreviva até 15:00, cumpra **todas as sub missões da fase** e derrote seus **três chefes** para concluir. As missões deixam de perder tempo durante a arena de chefes, quando inimigos comuns estão suspensos. Rejogue a fase se faltar um objetivo. A conclusão libera as fases seguintes, personagens e cartas do mercado conforme o avanço. O **Jogo livre** abre após completar o Deserto e só permite personagens, fases e cartas já desbloqueados na campanha. As melhorias permanentes compradas valem para ambos os modos; compras feitas com Bento *dentro* da partida continuam temporárias.

| Fase | Sub missões | Chefes e estratégias |
| --- | --- | --- |
| **1. Deserto dos Esquecidos** | 3: morcegos, caixas, esqueletos. | Patriarca da Noite (3.000 HP; lento, projéteis radiais), Chupacabra de Brasas (5.000 HP; fogo na posição marcada), Xerife das Sombras (6.800 HP; disparos em leque). |
| **2. Mina da Noite** | 3: chupacabras, caixas, espectros. | Mineiro da Pá (3.500 HP; investida lenta), Mariposa da Prata (5.000 HP; avanço sinalizado), General Mineiro (7.300 HP; invoca mineiros de **100 HP**). |
| **3. Cidade Fantasma** | 4: chupacabras, morcegos, esqueletos, caixas. | Cão de Ossos (6.000 HP; investida marcada), Cantor Esqueleto (8.000 HP; invoca esqueletos de **150 HP**), Delegado Zumbi (10.000 HP; escopeta tripla na posição marcada). |
| **4. Desfiladeiro das Cinzas** | 4: urubus, chupacabras, espectros de cinza, caixas. | Serpente das Cinzas (fogo marcado), Urubu da Tempestade (investida), Revenante dos Trilhos (rajada). |
| **5. Necrópole da Fronteira** | 5: corvos, esqueletos, espectros, caixas, mineiros. | Mãe da Cripta (invocação), Pregador Morto (esqueletos), Último Condutor (escopeta tripla). |

Os dois mapas novos usam cenários 2.5D com malhas instanciadas, paletas próprias, penhascos e passarelas no Desfiladeiro, sepulturas, cercas e mausoléus na Necrópole. Urubus já existentes continuam atacando em linhas pré marcadas; espectros de cinza e corvos são os dois tipos comuns novos. Os chefes têm identidade, atributos, tamanho, cores, fraquezas, campeões recomendados e padrões de ataque próprios. Eles reutilizam modelos 3D de espécies existentes, com escala e cores diferentes; **não são 15 modelos 3D esculpidos individualmente**.

O **Bestiário** guarda a primeira aparição de cada chefe mesmo se você perder: mostra nome, vida e tipo de ataque. Ao derrotá-lo e salvar a partida, revela dano, armadura, velocidade, fraqueza e campeão recomendado. Inimigos comuns revelam suas entradas após a primeira derrota.

## Campeões, deck e mercado

Há dez campeões: João, Maria, Indigo e Labuta no início; Rosa e Ada Morrow ao completar o Deserto; Elias Ferro e Ruth Faísca após a Mina; Silas Corvo e Teo Carril após a Cidade Fantasma. Os três novos possuem retratos próprios e GLB animados para a partida:

| Novo campeão | Vida inicial | Arma | Perfil |
| --- | ---: | --- | --- |
| **Ada Morrow** | 98 | Besta perfurante, 24 de dano. | Armadura 2, +8% de experiência; favorecida contra o Mineiro da Pá e o Cão de Ossos. |
| **Ruth Faísca** | 112 | Escopeta curta, dois chumbos de 18 de dano cada. | Armadura 2; favorecida contra a Mãe da Cripta. |
| **Teo Carril** | 84 | Rifle de repetição, 13 de dano por tiro. | Ataque rápido e 14% de chance crítica; favorecido contra o Urubu da Tempestade e o Último Condutor. |

O Deck Arsenal surge após a primeira partida. Equipe de 3 a 8 cartas; as escolhas de nível vêm somente das cartas equipadas. Cada carta tem, nesta atualização, limite de quatro níveis por partida. As três combinações da 0.7 anterior continuam: **Coração + Vontade de Ferro → Bastião de Ferro**; **Molotov + Lampião → Fogo Profano** (Mina); **Pistola + Chuva de Prata → Tempestade de Prata** (Cidade Fantasma). Fraquezas de chefes podem receber bônus de dano; escolha um deck adequado a cada confronto.

O Mercado do Bento fora da fase agora exibe mercadorias em uma grade com rolagem vertical. Além das oito melhorias permanentes anteriores, existem **Mira de Bento** (+2,5% de crítico; desbloqueia na Mina) e **Bolsa do Caçador** (+8% de moedas coletadas; desbloqueia na Cidade). Os preços sobem por compra, até oito níveis por melhoria. O **Deck Adicional do Bento** vende uma vez cada uma das cartas permanentes para o acervo: **Amuleto de Bento** (+2 de armadura por nível, após o Deserto), **Olho de Chumbo** (+4 de dano principal por nível, após a Mina) e **Pacto da Fronteira** (+12 de vida máxima e cura lenta por nível, após a Cidade). Depois de compradas, é possível equipá-las no Deck Arsenal; nenhuma entra automaticamente no deck. O Bento encontrado *durante* uma fase usa moedas da partida e oferece somente melhorias temporárias.

## Trilha sonora por fase

O menu e as telas de seleção conservam a música existente. A primeira fase usa `seven-black-graves.mp3`, de 0:00 até 2:49, repetindo de 0:05 a 2:49. A Mina usa `under-the-silver-vein.mp3`: primeira execução de 0:00 até 2:56, depois ciclos de **0:04 a 2:56**. A Cidade Fantasma usa `the-devil-at-noon.mp3`: **0:00 a 2:56**, sempre recomeçando em **0:00**. Desfiladeiro e Necrópole usam a música existente da primeira fase enquanto recebem trilhas próprias em versões futuras. Os três loops usam música em streaming HTML Audio; efeitos curtos continuam no Web Audio. O navegador só libera áudio depois da primeira interação.

## Controles, responsividade e limites

WASD e setas movimentam o personagem; em touchscreen, toque e arraste em qualquer área livre da tela. Ataques são automáticos. A bala grande e amarela de experiência e o joystick sob o dedo continuam da versão anterior. Tutorial completo em **Configurações → Como jogar**. Idioma padrão inglês, com português brasileiro e espanhol.

O build usa menos de 75 MB. Malhas de cenário e projéteis são instanciadas ou limitadas; há limite de inimigos, projéteis, ajudantes invocados e resolução dinâmica no 3D. O desempenho final depende do aparelho. A validação incluiu `npm run build`, testes das condições da campanha, padrões de 15 chefes, loja e músicas, e navegação em browser nos tamanhos de 1258×910, 390×844 e 320×568. Esses scripts de desenvolvimento não estão no ZIP.
