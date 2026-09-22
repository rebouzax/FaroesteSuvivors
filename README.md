# Faroeste Survivors — protótipo jogável 0.2

Seleção de personagem/fase, loja vazia e primeira partida com João Vaqueiro, deserto cartoon 3D, morcegos, chicote, sons procedurais, coleta de XP e moedas.

## Instalação no seu projeto Vite

1. Faça backup dos arquivos atuais, especialmente index.html e src/menu-main.js.
2. Extraia este ZIP em uma pasta temporária.
3. Copie src, index.html e README.md para C:\projetos\webjogos\FaroesteSuvivors, mesclando as pastas. Revise alterações próprias antes de substituir arquivos com o mesmo nome.
4. No PowerShell, dentro do projeto, execute:

```powershell
npm install three@0.186.0
npm run dev
```

Se o PowerShell bloquear npm.ps1, use npm.cmd no lugar de npm. Vite já deve estar configurado no projeto. O ZIP não inclui package.json, node_modules, dist nem testes. Mantenha o package.json do projeto com type: module; npm registra a versão instalada de Three.js e atualiza o lockfile. Validado nesta entrega com a versão registrada na seção de validação abaixo.

Abra o endereço exibido pelo Vite. O index.html inicia src/menu-main.js. O antigo src/main.js e as classes de menu do pacote anterior não são carregados; podem permanecer no projeto. Não abra a página com file://. É necessário navegador com WebGL2 e aceleração gráfica disponíveis.

## Fluxo e controles

- Novo jogo → escolher João Vaqueiro → escolher Deserto dos Esquecidos → Jogar.
- Loja acessível na preparação; saldo visível, sem habilidades ou compras nesta etapa.
- João entra caminhando por 5,6 segundos, para por 0,4 segundo e a partida começa: introdução total de 6 segundos. Inimigos, ataques e cronômetro só começam depois dela.
- Movimento automático na última direção escolhida. WASD/setas ou joystick virtual alteram a direção; soltar mantém a caminhada. Essa é uma adaptação ao movimento automático pedido, diferente da movimentação padrão de Vampire Survivors. Obstáculos e bordas podem interromper o avanço; mude de direção para contorná-los.
- Chicote automático, com mira assistida no morcego próximo, varredura visual e estalo sintetizado por Web Audio. Ataca também quando o personagem encosta em um obstáculo.
- Escape ou botão de pausa interrompe a partida e a introdução. Ao ocultar a aba, pausa e exige Continuar. A pausa não conta nos 15 minutos.
- Sair no menu mostra despedida; não tenta fechar a aba.
- Configurações: som do jogo e vento do menu. Preferências antigas de vento são migradas quando possível.

## Regras implementadas

| Item               | Valor                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| Mapa               | 240 × 240 unidades, limite físico cercado por rochas                   |
| Conteúdo           | Dunas baixas, cactos, rochas e cercas decorativas                      |
| João               | 100 de vida, roupa de couro gasta, chapéu e chicote                    |
| Morcego            | 10 de vida, 10 de dano por contato                                     |
| Proteção após dano | 0,9 segundo                                                            |
| Chicote            | 10 de dano por golpe, intervalo de 1,05 segundo, alcance de 5 unidades |
| XP                 | Cada morcego deixa uma bala amarela com ponta cinza que vale 10 XP     |
| Ímã                | A bala começa a seguir João a 3,5 unidades; crédito somente na coleta  |
| Níveis             | 1→2: 100 XP; 2→3: 300 XP; 3→4: 600 XP; 4→5: 1000 XP                    |
| Moedas             | Cada quinto morcego derrotado deixa 1 moeda separada do XP             |
| Duração            | 15 minutos de partida, sem contar introdução e pausas                  |

A fórmula do próximo nível é 100 × nível × (nível + 1) / 2. São requisitos por nível: atingir o nível 3 exige 400 XP totais. XP excedente é preservado e uma coleta pode subir vários níveis. Nesta etapa, subir de nível exibe feedback e atualiza a progressão; não concede habilidades nem aumenta automaticamente o dano do chicote. Os atributos estão em src/config/gameConfig.js.

Morcegos surgem ao redor do jogador e perseguem João; frequência, quantidade por onda e velocidade aumentam com o tempo. Até 160 ficam ativos simultaneamente. Inimigos muito distantes são reposicionados. Ao zerar a vida ocorre derrota; sobreviver até 15:00 encerra com vitória. Ambos permitem reiniciar ou voltar à seleção.

Moedas recolhidas são creditadas imediatamente no saldo local, inclusive em partidas perdidas ou encerradas. Repetir a partida não duplica créditos. Não há backend, sincronização entre dispositivos, proteção antitrapaça nem continuação de uma partida ao recarregar. Se localStorage estiver bloqueado, saldo/preferências só duram a sessão. XP, nível e inimigos reiniciam a cada partida.

## Organização (MVVM adaptado)

- src/app/GameApplication.js: composição, telas e ciclo de vida.
- src/config/gameConfig.js: balanceamento e fórmula de XP.
- src/models/RunModel.js e WorldModel.js: dados da partida e geração determinística de obstáculos, sem DOM/Three.js.
- src/systems/RunSystem.js: movimento, colisão, geração de inimigos, ataque, drops e coleta, sem renderização.
- src/viewmodels/GameViewModel.js: coordena simulação, áudio e persistência dos ganhos.
- src/views/ScreenView.js: menus e HUD; GameView.js: renderização 3D; CharacterFactory.js: modelos procedurais; CharacterPreview.js: prévia; DesertBackgroundView.js: fundo original em Canvas 2D.
- src/services/: entrada, áudio e perfil local.
- src/styles/: estilos responsivos do menu e partida.

Não existe um ViewModel para cada inimigo. A simulação usa passos fixos de 1/60 s, renderização independente, pooling dos modelos de morcegos, geometria compartilhada e instanciamento das balas. Ao atingir o limite de drops, novos valores são consolidados em um drop existente do mesmo tipo, preservando recompensas. Materiais, geometrias, eventos e loops são descartados ao sair ou recarregar módulos. O fundo do menu é suspenso durante a partida.

Tudo visual e sonoro é criado por código: não há imagens, fontes, modelos nem áudios externos. O mapa usa geometria low-poly real; o fundo do menu mantém a ilustração 2D anterior. Os modelos são estilizados e básicos, próprios deste protótipo.

## Validação

Build de produção verificada com Vite 8.3.0 e Three.js 0.186.0. Sete testes da simulação passaram, incluindo uma partida simulada de 15 minutos, dano, XP, moedas, pausa e limites. Também foram verificados no Chromium: seleção, introdução, ataque, coleta, pausa por Escape, saldo, reinício e layouts desktop/celular. Os testes de desenvolvimento não fazem parte do ZIP, conforme solicitado.

Ao executar localmente, confira: seleção dos dois cartões; entrada de 6 segundos; movimentação no teclado e toque; ataque/estalo; coleta; pausa/retorno; moedas na loja; reinício da partida. Desempenho e áudio precisam ser avaliados também no dispositivo de destino.

Referências técnicas: https://threejs.org/docs/pages/OrthographicCamera.html e https://threejs.org/docs/pages/InstancedMesh.html.
