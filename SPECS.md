# Especificação técnica — Palavra Perto

**Base de produto:** [PRD de adivinhação semântica](./docs/plans/2026-10-22-jogo-de-adivinhacao-semantica.md)
**Design selecionado:** Protótipo 01 — Palavra perto (UX), com padrões de acessibilidade incorporados
**Data:** 2026-10-22

## 1. Objetivo e limites

Implementar um jogo web casual em pt-BR com desafio diário e partidas livres. O protótipo aprovado fornece a hierarquia e a direção visual; este documento define o comportamento funcional e os contratos que a implementação deverá preservar.

O produto é estático e executável sem conta, backend de jogo, telemetria ou serviços de terceiros. A pontuação semântica usa um vocabulário e relações curadas e incluídas no próprio app. Por ser um jogo local, a proteção contra inspeção do arquivo de palavras não é um objetivo de segurança.

## 2. Direção de interface

- Marca e tela acolhedoras, com fundo marfim, superfícies claras, verde-escuro para ações e amarelo quente para ênfase.
- Cabeçalho compacto com marca, ajuda e estatísticas.
- Introdução breve seguida de uma área principal: controles do modo, instrução de como ler o ranking e formulário de palpite.
- Em telas largas, formulário e histórico ficam lado a lado; em telas estreitas, ficam empilhados, com o formulário antes do histórico.
- O histórico mostra palavra, posição numérica e rótulo textual; ordena por proximidade ou ordem de envio, sem perder o índice original.
- Uma dica contextual pode orientar a próxima tentativa sem entregar a resposta.
- Diálogos de ajuda/estatísticas devem fechar com botão explícito e Escape, devolver o foco ao acionador e manter a ordem de foco contida quando abertos.
- Cores, barras e ícones são redundantes: o número e seu significado aparecem sempre em texto.

## 3. Arquitetura

Aplicação de página única em HTML, CSS e JavaScript nativos, sem framework e sem dependências de runtime.

```text
package.json                 scripts start/test
server.js                    servidor estático Node.js para desenvolvimento
public/
  index.html                 estrutura semântica da aplicação
  styles.css                 tokens, layout responsivo e estados
  app.js                     inicialização, eventos e apresentação
  game.js                    regras determinísticas e persistência local
  catalog.js                 vocabulário, associações e palavras-alvo
test/
  game.test.js               testes unitários com node:test
prototypes/
  index.html                 seletor dos três protótipos
  01-ux.html                 conceito selecionado
  02-accessibility.html      conceito acessível alternativo
  03-visual.html             conceito visual alternativo
```

- `server.js` usa apenas módulos nativos do Node.js 20+, serve somente arquivos de `public/` e não oferece endpoints de jogo. O app pode ser publicado em qualquer hospedagem estática que preserve os módulos ES.
- `app.js` coordena a tela; não decide regras de normalização, ranking ou calendário.
- `game.js` exporta funções puras para normalização, escolha do desafio diário, consulta de ranking, validação/submissão de palpites e cálculo de estatísticas. A persistência é uma camada explicitamente separada.
- `catalog.js` contém palavras normalizadas e tags semânticas curadas. Uma palavra pode pertencer a mais de um conceito para aproximar associações de linguagem natural.
- O arquivo de catálogo limita deliberadamente o vocabulário aceito. O formulário informa que somente palavras reconhecidas pelo jogo recebem posição; a resposta de palavra desconhecida explica isso sem alterar o estado da rodada.

## 4. Modelo de dados semântico

### 4.1 Vocabulário

Cada entrada contém a forma de exibição pt-BR, sua chave normalizada e um vetor esparso de associações semânticas ponderadas. O conjunto inicial deve conter um número suficiente de palavras comuns para representar domínios diversos (natureza, casa, comida, corpo, emoções, transporte, cultura e clima), mais palavras-alvo elegíveis.

Exemplo conceitual:

```js
{
  key: "praia",
  word: "praia",
  features: { agua: 0.8, natureza: 0.5, lazer: 0.7 }
}
```

Entradas, associações, valores e alvos são dados versionados no repositório; o catálogo inicial contém 319 termos, todos habilitados como alvos para evitar que o ciclo diário se repita em poucas semanas. Não se faz chamada de rede nem geração probabilística em tempo de jogo.

### 4.2 Similaridade e posição

- Comparar o vetor do palpite ao vetor da resposta pela similaridade de cosseno, calculada somente sobre as características explícitas do catálogo.
- Para cada resposta, classificar todas as palavras válidas, incluindo a própria resposta, da maior para a menor similaridade.
- Desempatar por chave normalizada em ordem lexical para que o ranking não varie entre navegadores.
- A posição começa em 1; a resposta exata sempre recebe posição 1.
- A interface chama o número de “posição no ranking”, não de nota, percentual ou quantidade de palpites.
- A tabela de características é uma aproximação editorial para o MVP, não um modelo linguístico treinado. O tamanho e a cobertura do léxico devem ser ampliados por revisão de conteúdo, sem alterar o contrato da interface.

Normalização: converter para minúsculas pt-BR, Unicode NFD, remover marcas combinantes, aparar espaços externos e colapsar espaços consecutivos. Aceitar somente palavras do vocabulário (sem espaços, números ou pontuação; hífen interno entre componentes é permitido); comparar aliases normalizados caso existam. Palpite repetido, vazio ou desconhecido não é inserido no histórico.

## 5. Regras de jogo

### 5.1 Desafio diário

- A chave de calendário é a data civil em `America/Sao_Paulo`, obtida com `Intl.DateTimeFormat` e nunca pelo fuso local configurado no dispositivo.
- Um índice determinístico baseado na diferença de dias entre uma data-âncora versionada e a data atual seleciona o alvo diário. A sequência é igual para todos e não depende de estado aleatório.
- O app persiste uma única partida diária por chave de data. Após vitória, ela permanece concluída e não oferece reinício.
- O alvo não aparece na UI, no histórico, em estatísticas nem no texto compartilhado antes de a pessoa acertar. Como os dados são locais, não é possível impedir inspeção do catálogo pelo navegador.

### 5.2 Partida livre

- Inicia imediatamente com um alvo aleatório entre os elegíveis; injeção de função aleatória permite testes determinísticos.
- Permite palpites sem limite e pode ser reiniciada a qualquer momento.
- Não altera sequência nem estatísticas do desafio diário.

### 5.3 Estados e erros

`in_progress` aceita palpites; `won` registra conclusão e bloqueia novo envio para aquela partida. Antes de alterar o estado, validar tipo, normalização, existência no vocabulário, duplicidade e status da partida.

Para uma rejeição, manter os palpites e contadores inalterados, fornecer mensagem em português e devolver o foco ao campo. A falha de armazenamento local não bloqueia a sessão em memória; informar visivelmente que o progresso pode não sobreviver ao fechamento. Erros inesperados não devem ser convertidos em sucesso nem ocultados.

## 6. Persistência e estatísticas

- Chave versionada, por exemplo `palavra-perto:v1`, armazena partida diária, partida livre ativa e estatísticas. Toda carga valida versão e forma dos dados antes de usá-los.
- Registrar sequência e distribuição apenas para desafios diários concluídos; jogos livres não interferem nesses números.
- Atualizar estatísticas de forma idempotente por chave diária para que atualização de página não incremente partidas ou vitórias novamente.
- Se os dados forem inválidos, ignorar apenas o registro que falhou, informar que o progresso local não pôde ser restaurado e oferecer início de nova partida. Não apagar automaticamente dados válidos.
- Não armazenar nome, email ou identificador pessoal; nenhum dado sai do navegador.

Estatísticas mínimas: desafios diários concluídos, vitórias, sequência atual, melhor sequência e distribuição de palpites até a vitória. Mostrar zero e estado vazio sem inventar resultados.

## 7. Compartilhamento sem spoiler

Gerar texto simples contendo nome do jogo, data/número do desafio, quantidade de palpites e um resumo de posições em texto/ícones neutros. Não incluir resposta, palpites digitados, URL com resposta ou metadados pessoais. Preferir `navigator.clipboard.writeText` em contexto seguro; se indisponível/recusado, abrir uma área de texto rotulada e selecionável com instrução explícita de cópia manual. A confirmação só aparece após cópia bem-sucedida.

## 8. Acessibilidade e comportamento de interface

- Usar landmarks HTML, hierarquia única de `h1`, rótulo visível associado ao campo, botões nativos e foco lógico.
- Campo e envio funcionam por teclado; Enter envia; foco visível deve atingir 3:1 de contraste contra cores adjacentes.
- Anunciar resultado e erro com região `aria-live="polite"`/status sem deslocar o foco após um palpite válido.
- Mensagens de erro são específicas e associadas ao campo, com `aria-invalid` somente enquanto houver erro.
- Proximidade sempre inclui posição numérica e rótulo textual; cor/barras são complementares.
- Atender WCAG 2.2 AA para contraste (4,5:1 em texto normal; 3:1 em texto grande), zoom e largura móvel sem rolagem horizontal.
- Remover transições decorativas para `prefers-reduced-motion: reduce`; controles permanecem identificáveis sem animação.
- Ajuda e estatísticas abrem como diálogos nativos ou padrões equivalentes de teclado; Escape fecha, foco retorna ao acionador, e conteúdo continua legível com zoom.

## 9. Servidor local e segurança operacional

`npm start` inicia o servidor Node em `127.0.0.1` (porta 4173, configurável). Deve:

- permitir somente `GET`/`HEAD`;
- resolver caminhos dentro de `public/`, rejeitando traversal e arquivos sem tipo permitido;
- retornar 404 de forma uniforme para caminho inexistente;
- registrar falhas inesperadas de leitura e responder HTTP 500 sem deixar rejeições assíncronas escaparem do ciclo da solicitação;
- usar `Content-Type`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin` e política CSP restritiva compatível com scripts e estilos locais. A rota isolada dos protótipos pode executar os estilos/scripts embutidos nesses mockups; a aplicação principal mantém CSP sem `unsafe-inline`;
- não registrar palpites, estatísticas ou dados pessoais.

O servidor existe apenas para servir a página localmente; regras e estado de partida são do cliente.

## 10. Verificação e critérios de aceitação técnica

Executar `npm test` (`node --test`) para cobrir:

1. normalização de maiúsculas, acentos combinados, espaços e valores inválidos;
2. validação de termo desconhecido e repetido sem mutação de jogo;
3. posições determinísticas, desempate estável e posição 1 para a resposta;
4. mesma resposta diária para a mesma data de São Paulo, inclusive em fusos de dispositivo distintos; sequência muda de forma determinística na nova data;
5. seleção de alvo livre com aleatoriedade injetável e sem afetar dados diários;
6. vitória e bloqueio de novo palpite após conclusão;
7. atualização idempotente de estatísticas e recuperação de dados locais inválidos/disponibilidade ausente;
8. conteúdo compartilhável sem resposta ou palpites pessoais;
9. servidor servindo a página e recusando método/path inválido sem expor arquivos fora do diretório público.

Verificação manual no navegador: completar o desafio diário, experimentar validações e modo livre, recarregar para confirmar persistência, inspecionar layout móvel, navegar por teclado, confirmar foco e mensagens de status, verificar `prefers-reduced-motion` e testar o caminho alternativo de cópia.

## 11. Riscos e decisões de evolução

- **Cobertura linguística:** uma lista limitada não consegue pontuar qualquer palavra em português. Expandir e revisar o catálogo como requisito de conteúdo; nunca simular ranking para palavra não cadastrada.
- **Fidelidade semântica:** tags editoriais são menos ricas que embeddings treinados. Reunir avaliação qualitativa de falas e relações antes de escalar o léxico; substituir a estratégia de similaridade sem alterar o contrato de ranking.
- **Privacidade versus persistência:** limpeza do navegador remove sequência e histórico; explicar isso na ajuda e não prometer sincronização.
- **Resposta inspecionável:** qualquer jogo offline com catálogo local pode ser analisado via DevTools. Anti-cheat e segredo contra inspeção requerem um backend e estão fora do MVP.
