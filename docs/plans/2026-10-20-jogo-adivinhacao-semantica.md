# PRD — CaçaPalavra: jogo de adivinhação semântica

**Status:** rascunho de MVP  
**Data:** 2026-10-20  
**Plataforma:** web responsiva  
**Idioma inicial:** português brasileiro (pt-BR)

## 1. Resumo

CaçaPalavra é um jogo casual de palavras em que a pessoa tenta encontrar uma palavra secreta fazendo palpites e recebendo uma posição num ranking de proximidade semântica. O MVP prioriza partidas curtas, prática ilimitada, feedback fácil de entender e acessibilidade. Não haverá desafio diário, limite de tentativas, conta ou competição no escopo inicial.

## 2. Problema e oportunidade

Jogos de palavras oferecem sessões curtas e uma motivação clara para tentar novamente. No formato semântico, o desafio não é encontrar letras corretas, mas formular associações e aprender com a proximidade de cada tentativa. A oportunidade é oferecer essa experiência em pt-BR, com explicação clara do ranking e uma interface acessível, sem exigir cadastro.

## 3. Público e necessidades

### Público primário

Pessoas que gostam de jogos casuais de palavras, querem jogar em sessões curtas e podem acessar pelo celular ou computador.

### Necessidades

- Entender as regras sem tutorial longo.
- Poder experimentar palpites sem penalidade por erro.
- Perceber se uma associação está se aproximando da resposta.
- Usar o jogo por teclado, toque e tecnologias assistivas.
- Começar a jogar sem criar conta ou fornecer dados pessoais.

## 4. Objetivos e não objetivos

### Objetivos do MVP

1. Tornar possível iniciar uma partida de prática em até uma ação após abrir o jogo.
2. Aceitar palpites válidos em pt-BR e apresentar feedback consistente para cada um.
3. Permitir palpites ilimitados até encontrar a palavra secreta.
4. Preservar a partida em andamento após recarregar a página no mesmo navegador.
5. Oferecer uma experiência responsiva e utilizável por teclado, com feedback que não dependa somente de cor.

### Não objetivos

- Desafio diário ou competição por tempo.
- Multiplayer, chat, rankings públicos ou comparação entre contas.
- Perfil, login e sincronização entre dispositivos.
- Monetização e anúncios no MVP.
- Aplicativo nativo separado.
- Cobrir todo o vocabulário do português na primeira versão.

## 5. Pesquisa e implicações de produto

Esta pesquisa foi consultada em 20 out. 2026. As referências descrevem produtos e critérios existentes; as decisões do CaçaPalavra são recomendações de produto a validar.

| Evidência / referência | Implicação para o CaçaPalavra |
|---|---|
| O Wordle combina tentativas limitadas, feedback imediato e compartilhamento sem expor a resposta ([NYT Wordle](https://www.nytimes.com/games/wordle/index.html)). | Feedback após cada palpite ajuda a sustentar o loop. O CaçaPalavra adapta o princípio, mas escolhe prática sem limite e não inclui pontuação de sequência no MVP. |
| Connections pede que a pessoa agrupe palavras por uma relação comum e publica um novo quebra-cabeça diariamente ([NYT Connections](https://www.nytimes.com/games/connections)). | Relações entre palavras podem ser ambíguas; seleção e revisão editorial do vocabulário são essenciais. O formato diário não foi escolhido para este MVP. |
| Semantle apresenta uma experiência de adivinhação guiada por relação semântica, em vez de correspondência de letras ([Semantle — About](https://semantle.com/about)). | A proximidade precisa ser o núcleo do feedback, e as regras devem explicar como interpretar a classificação. |
| WCAG recomenda não usar cor como único meio de transmitir informação ([W3C — Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)) e define contraste mínimo para texto ([W3C — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)). | Cada resultado combina posição numérica, rótulo textual e sinal visual; cores não são a única forma de compreender o progresso. |
| WCAG define requisitos de operação por teclado ([W3C — Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)). | Toda ação essencial precisa ser possível sem mouse ou gestos precisos. |

### Recomendações de retenção e qualidade

- Priorizar resposta rápida e progresso compreensível, sem temporizador ou notificações invasivas.
- Oferecer variedade de palavras por meio de um catálogo revisado; não confundir quantidade de palpites com diversão.
- Medir sessões concluídas e dificuldades de compreensão antes de introduzir sequências diárias, anúncios ou competição.
- Revisar relações semânticas, homônimos e variantes regionais, especialmente porque modelos e corpora podem não representar igualmente o pt-BR.
- Verificar licenças e proveniência de vocabulários e modelos antes de uso ou distribuição.

## 6. Loop principal e regras

1. A pessoa abre o jogo e inicia uma nova palavra de prática.
2. A interface mostra uma explicação breve e oferece um campo para o palpite.
3. A pessoa envia uma palavra.
4. O jogo valida a entrada. Vazia, inválida ou não reconhecida não consome tentativa e recebe uma mensagem clara.
5. Um palpite válido aparece no histórico com sua posição semântica, rótulo de proximidade e indicador visual.
6. A pessoa pode continuar tentando sem limite.
7. Ao acertar, a interface celebra a conclusão, revela a resposta, informa o número de palpites e oferece começar outra partida.

### Regras do feedback

- Ranking: `1` representa a resposta; números menores representam maior proximidade dentro do vocabulário do desafio.
- Resultado deve incluir texto (por exemplo, “muito perto”, “perto” ou “distante”) e representação visual acessível.
- Não apresentar similaridade como porcentagem, pois o ranking é mais interpretável e foi escolhido durante a definição do produto.
- A escala exata de rótulos/faixas deve ser calibrada com testes de compreensão; não prometer que uma faixa representa uma medida universal de significado.
- Palpite duplicado: não acrescenta tentativa ao histórico; apresentar a entrada ou resultado existente em vez de penalizar.
- Após acertar, encerrar a partida atual e preservar seu resultado. Nova palavra exige ação explícita da pessoa.

## 7. Escopo funcional

### P0 — obrigatório para MVP

- Tela inicial/jogo com instruções breves e acesso direto à prática.
- Iniciar uma partida e carregar uma palavra secreta de um conjunto de conteúdo aprovado.
- Campo de palpite com envio por Enter e botão visível.
- Normalização básica e validação de entradas.
- Ranking, rótulo textual e indicador visual acessível para cada palpite aceito.
- Histórico ordenado de palpites, com indicação de duplicatas.
- Tentativas ilimitadas até acertar.
- Estado de vitória, resposta revelada e opção de começar outra partida.
- Persistência local de partidas em andamento e concluídas.
- Layout responsivo para celular e desktop.
- Estado de erro recuperável quando uma palavra ou classificação não puder ser carregada.
- Ações e conteúdo essenciais acessíveis por teclado e leitor de tela.

### P1 — após validar o MVP

- Compartilhamento do resultado anonimamente.
- Estatísticas locais de partidas concluídas.
- Categorias ou níveis de dificuldade.
- Mais idiomas ou variantes regionais.
- Pistas opcionais com custo ou regra claramente explicados.

### Explicitamente fora do MVP

- Partida diária, sequência de dias ou contagem regressiva.
- Login, nuvem e sincronização.
- Multiplayer, ranking global, chat.
- Anúncios, compras ou assinatura.

## 8. Requisitos não funcionais

- **Responsividade:** conteúdo utilizável em larguras de tela de 320 px em diante, sem rolagem horizontal da área de jogo.
- **Acessibilidade:** objetivo WCAG 2.2 AA; foco visível, navegação por teclado, contraste suficiente, rótulos programáticos e anúncios de feedback via região acessível.
- **Desempenho:** carregar a interface inicial sem depender de modelos externos em tempo de partida; mostrar estado de carregamento somente quando necessário.
- **Privacidade:** jogo sem conta; manter no navegador apenas estado necessário à continuidade. Sem enviar texto dos palpites para terceiros por padrão.
- **Confiabilidade:** mesma palavra e mesmo ranking durante uma partida; estados de erro devem ser explícitos e recuperáveis.
- **Conteúdo:** cada alvo e respectivo ranking devem ser revisados antes de serem disponibilizados.

## 9. Métricas de sucesso

Instrumentar somente o necessário, de forma agregada e respeitando a política de privacidade.

- Taxa de partidas que chegam à resposta.
- Mediana e distribuição de palpites por vitória.
- Taxa de início de uma segunda partida após concluir a primeira.
- Erros de validação e falhas ao iniciar/carregar uma partida.
- Resultado de testes de compreensão: proporção de pessoas que entendem ranking e rótulos sem ajuda após ler a instrução.
- Verificações de acessibilidade automatizadas e manuais, incluindo teclado e leitor de tela.

Metas numéricas de conversão/retenção ficam pendentes de uma linha de base após teste com pessoas usuárias; não assumir números sem dados.

## 10. Conteúdo e localização

- Idioma inicial: pt-BR.
- Guardar palavra canônica e forma de exibição separadamente quando necessário.
- Definir e testar regras para caixa, espaços, Unicode, acentos, hífen, flexões e locuções.
- Evitar alvos com resposta excessivamente ambígua ou conteúdo ofensivo sem decisão editorial.
- Manter a lista aceita e as relações semânticas versionadas; revisar manualmente palavras e vizinhos usados no jogo.
- Registrar fonte e licença do vocabulário, corpus e modelos utilizados.

## 11. Critérios de aceite

1. Uma pessoa consegue iniciar uma partida sem cadastro.
2. Uma entrada vazia ou desconhecida recebe orientação e não aparece como palpite válido.
3. Um palpite válido mostra ranking, texto e sinal visual correspondentes.
4. A mesma entrada, na mesma palavra/versão, sempre produz o mesmo ranking.
5. A pessoa pode enviar qualquer número de palpites até encontrar a resposta.
6. O acerto revela a resposta e permite iniciar outra partida intencionalmente.
7. Recarregar a página restaura a partida em andamento no mesmo navegador.
8. O fluxo principal funciona por teclado e resultado não é comunicado só por cor.
9. A interface funciona em viewport móvel e desktop, sem dependência de rede para fontes externas essenciais.
10. Respostas e erros de API não revelam palavras secretas de outra partida nem estados internos.

## 12. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Relações semânticas parecem erradas ou injustas | Curadoria, testes com falantes de pt-BR, versionamento e canal para reportar termos problemáticos. |
| Modelo/corpus tem vieses ou cobertura fraca de variantes | Verificar proveniência/licença e avaliar exemplos regionais antes de expandir. |
| Usuários não compreendem o ranking | Instruções curtas, exemplos, rótulos além do número e testes de usabilidade. |
| O alvo fica exposto no cliente | Manter alvo e classificação completa no servidor na versão de produção. |
| Tentativas ilimitadas reduzem o desafio | Validar satisfação e duração em testes; considerar modos opcionais apenas em etapa posterior. |
| Armazenamento local se perde ou fica corrompido | Validar versão e estrutura dos dados e informar quando o progresso não puder ser restaurado. |

## 13. Decisões tomadas e pendências

### Confirmadas nesta conversa

- Mecânica: adivinhar palavra com feedback de proximidade semântica.
- Plataforma: aplicação web responsiva.
- Modo: prática ilimitada, sem desafio diário.
- Tentativas: sem limite até acertar.
- Feedback: posição numérica + rótulo + indicador visual/textual.

### Assumidas para o rascunho e a validar

- Idioma inicial pt-BR.
- Sem conta e sem anúncios no MVP.
- Nova palavra somente após ação explícita ao terminar uma partida.
- Dados de progresso ficam no navegador.

### Pendências para uma próxima revisão

- Escolha final de stack e hospedagem.
- Modelo/fonte e tamanho inicial do vocabulário.
- Escala e limites exatos dos rótulos de proximidade.
- Compartilhamento e estatísticas locais no primeiro lançamento ou em fase posterior.
- Política editorial detalhada para flexões, acentos, locuções e termos sensíveis.

## 14. Referências

- [NYT Wordle](https://www.nytimes.com/games/wordle/index.html)
- [NYT Connections](https://www.nytimes.com/games/connections)
- [Semantle — About](https://semantle.com/about)
- [W3C WCAG 2.2 — Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)
- [W3C WCAG 2.2 — Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [W3C WCAG 2.2 — Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
