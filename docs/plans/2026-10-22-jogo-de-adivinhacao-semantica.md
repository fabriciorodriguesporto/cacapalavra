# PRD — Jogo de adivinhação semântica

**Data:** 2026-10-22  
**Status:** Aprovado para prototipagem  
**Idioma inicial:** Português do Brasil (pt-BR)

## 1. Visão do produto

Um jogo casual para navegador em que a pessoa tenta descobrir uma palavra secreta enviando palpites livres e usando um ranking de proximidade semântica como pista. Deve ser acolhedor para quem está começando, rápido de entender, jogável sem cadastro e sem depender de anúncios ou de uma conexão permanente.

## 2. Problema e oportunidade

Jogos de palavras com regras simples são fáceis de compartilhar, mas desafios por associação semântica podem parecer arbitrários quando o retorno é opaco ou quando o vocabulário é raro. O produto deve tornar o progresso legível e a tentativa seguinte interessante, preservando a surpresa da resposta.

### Síntese da pesquisa de categoria

- **Dedução por letras — Wordle:** o formato diário, um conjunto de palavras familiares selecionadas e o compartilhamento compacto de resultados ajudam a tornar a rodada fácil de aprender e social. O limite de um desafio diário, por outro lado, não atende quem quer continuar jogando.
- **Associação semântica — Contexto e Semantle:** palpites em texto livre com posições/pontuações de proximidade transformam a rodada em exploração de conceitos. No Semantle, tentativas sem limite favorecem sondagem ampla, mas uma experiência muito difícil sem contexto pode afastar iniciantes.
- **Princípios de interação:** feedback imediato e legível, prevenção de erros, linguagem familiar e informação visível reduzem o esforço de descobrir as regras. Um ranking precisa explicar o que seu número significa e dar retorno útil tanto para palavras próximas quanto distantes.
- **Acessibilidade:** controles centrais precisam funcionar por teclado; contraste, foco visível e mensagens textuais devem permanecer adequados. Cor pode reforçar uma pista, nunca ser a única forma de comunicá-la.
- **Implicações para este produto:** usar pt-BR comum, explicar “posição 1 = mais perto”, oferecer desafio diário e modo livre, evitar cronômetro/pressão, mostrar feedback com número e rótulo, e compartilhar resultados sem expor a resposta nem os palpites.

Fontes consultadas: [Wordle](https://en.wikipedia.org/wiki/Wordle) (história, seleção de vocabulário, desafio diário e compartilhamento); [Contexto](https://contexto.me/) e [Semantle](https://semantle.com/) (formatos de proximidade semântica); [heurísticas de usabilidade da NN/g](https://www.nngroup.com/articles/ten-usability-heuristics/) (visibilidade do estado, prevenção de erros e reconhecimento); [WCAG 2.2 — teclado](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) e [contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

## 3. Público e contexto

- Público geral falante de português brasileiro, incluindo pessoas que não jogam puzzles regularmente.
- Uso casual em celular ou computador, em sessões curtas.
- A interface deve funcionar em telas pequenas, com toque, mouse e teclado; não exigir conta.

## 4. Proposta de valor e princípios

1. Cada palpite ensina algo: mostrar uma posição relativa clara e consistente.
2. A dificuldade deve vir das associações, não de vocabulário obscuro ou regras escondidas.
3. Explicar como jogar sem interromper partidas futuras.
4. Manter um desafio diário compartilhado, oferecendo também partidas livres sem limite.
5. Respeitar privacidade e acessibilidade desde o primeiro uso.

## 5. Experiência principal

1. A pessoa abre o jogo e escolhe o desafio do dia ou uma partida livre.
2. Uma explicação curta informa que o objetivo é encontrar a palavra secreta e que palpites semanticamente mais próximos sobem no ranking.
3. A pessoa digita uma palavra e envia o palpite.
4. O jogo valida a entrada, registra o palpite uma única vez e informa sua posição de proximidade; uma posição menor significa maior proximidade.
5. O histórico permanece visível e ordenável pelo progresso, sem apagar a ordem em que os palpites foram feitos.
6. Ao acertar, o jogo celebra a conclusão e oferece estatísticas e compartilhamento sem revelar a resposta.
7. A partida diária concluída não pode ser reiniciada para obter outra tentativa; partidas livres podem ser iniciadas novamente.

## 6. Requisitos funcionais

### RF-1 — Modos

- Disponibilizar um desafio diário e partidas livres ilimitadas.
- Todos recebem a mesma palavra para cada dia civil de São Paulo (`America/Sao_Paulo`), sem revelar a resposta antes da conclusão.
- Uma partida livre recebe uma palavra dentre as disponíveis e pode ser reiniciada.

### RF-2 — Palpites

- Aceitar palavras em português brasileiro, normalizando maiúsculas/minúsculas, espaços nas extremidades e diacríticos para comparação.
- Rejeitar entrada vazia, palavras fora do vocabulário suportado e palpites repetidos com mensagens compreensíveis; erros não consomem tentativa.
- Permitir enviar pelo botão e pela tecla Enter.
- Não impor limite de tentativas nem cronômetro no MVP.

### RF-3 — Proximidade e progresso

- Apresentar para cada palpite válido uma posição numérica de proximidade, explicitamente identificada como ranking (posição menor é melhor).
- Permitir comparar palpites sem depender exclusivamente de cor: usar posição, rótulo textual e indicador visual complementar.
- Mostrar quantidade de palpites e ordenação por proximidade; a ordem cronológica também deve ser recuperável.
- A correspondência exata encerra a rodada como vitória.

### RF-4 — Persistência local

- Salvar progresso, estatísticas e sequência diária no armazenamento local do navegador, sem exigir login.
- Restaurar a partida em andamento após atualizar ou reabrir a página.
- Não enviar palpites, identificadores pessoais ou telemetria a um servidor no MVP.
- Se o armazenamento local estiver indisponível, informar que o progresso pode não persistir e manter a partida ativa enquanto a página permanecer aberta.

### RF-5 — Estatísticas e compartilhamento

- Mostrar partidas concluídas, vitórias, distribuição de palpites e sequência diária atual/máxima.
- Oferecer cópia de um resumo textual compartilhável com modo, número de palpites e resultado, sem palavra secreta nem lista que a revele.
- Se a API de área de transferência não estiver disponível, permitir selecionar e copiar o texto manualmente.

### RF-6 — Ajuda e estados

- Fornecer regras acessíveis sob demanda, incluindo um exemplo de como ler o ranking.
- Incluir estados de carregamento, erro de validação, partida em andamento, vitória e falha técnica sem respostas enganosas.
- Exibir instruções persistentes suficientes para que o ranking seja interpretável durante a partida.

## 7. Requisitos de UX, visual e acessibilidade

- Layout responsivo com prioridade para celular; a entrada de palpites deve permanecer fácil de localizar e usar.
- Navegação por teclado, foco visível, rótulos acessíveis, mensagens de estado anunciáveis por leitor de tela e ordem de leitura coerente.
- Não comunicar proximidade, vitória ou erro somente por cor.
- Contraste de texto compatível com WCAG 2.2 AA (4,5:1 para texto normal; 3:1 para texto grande), inclusive estados de foco e erro.
- Respeitar redução de movimento do sistema; animações são decorativas e dispensáveis.
- Evitar distrações, pressão por sequência e linguagem punitiva.

## 8. Fora de escopo do MVP

- Contas, sincronização entre dispositivos, ranking competitivo ou partidas multiplayer.
- Anúncios, compras, monetização e rastreamento analítico.
- Cronômetro, limite de palpites, pistas pagas ou geração livre de palavras por IA.
- Aplicativo nativo, instalação obrigatória ou dependência de serviços externos para jogar.

## 9. Critérios de sucesso

- Uma pessoa que nunca viu o jogo consegue iniciar uma rodada e explicar o significado do ranking sem assistência externa.
- Palpites válidos atualizam ranking e histórico; entrada inválida ou repetida recebe feedback e não altera a partida.
- A mesma data e modo diário produzem a mesma resposta para diferentes jogadores; partidas livres não mudam o desafio diário.
- Partida em andamento e estatísticas sobrevivem a recarregamento em navegador com armazenamento local disponível.
- Conclusão, estatísticas e compartilhamento não expõem a palavra antes da escolha explícita de quem joga.
- Todas as ações centrais são utilizáveis por teclado e não dependem exclusivamente de cor.

## 10. Premissas de implementação a validar no protótipo

- O MVP será uma aplicação web estática, executável sem conta e sem backend obrigatório.
- O conjunto inicial de palavras e os rankings semânticos serão explícitos e revisados para pt-BR, permitindo funcionamento offline e resultados determinísticos.
- O design final será escolhido entre três protótipos independentes de UX, acessibilidade e direção visual.

## 11. Decisões do produto

- Mecânica: palpites livres com ranking semântico.
- Modos: desafio diário e partidas livres.
- Dificuldade: sem limite de palpites e sem cronômetro.
- Recursos iniciais: tutorial breve, estatísticas locais, sequência diária e compartilhamento sem spoiler.
- Privacidade: sem cadastro, anúncios ou coleta desnecessária; progresso salvo localmente.
