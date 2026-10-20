# Especificacao tecnica — jogo casual de adivinhacao semantica

> Este documento define a proposta tecnica inicial para um jogo web responsivo em que a pessoa tenta descobrir uma palavra secreta por meio de palpites e indicadores de proximidade semantica. Ele acompanha o PRD em `docs/plans/2026-10-20-jogo-adivinhacao-semantica.md`. Decisoes confirmadas: pt-BR, pratica ilimitada sem desafio diario, tentativas ilimitadas e feedback por ranking numerico, rotulo e indicador visual/textual.

## Estado do MVP implementado

- Aplicacao sem dependencias externas: Node.js 20+, servidor HTTP integrado em `server.js`, cliente HTML/CSS/JavaScript em `public/` e logica de jogo em `src/`.
- API: `POST /api/games` inicia uma partida; `GET /api/games/{gameId}` restaura estado publico; `POST /api/games/{gameId}/guesses` valida e classifica palpites. A resposta secreta so e devolvida depois do acerto.
- Vocabulario inicial pequeno e curado em `src/catalog.js`, com oito alvos de pratica e classificacoes ordinais deterministicas. A classificacao nao usa ainda um modelo de embeddings ou uma fonte linguistica externa.
- Faixas da interface: posicao 1 = resposta; posicoes 2–5 = muito perto; 6–15 = quente; 16–30 = morno; 31+ = distante. Essas faixas sao adequadas apenas ao vocabulario inicial e precisam ser recalibradas ao amplia-lo.
- O servidor mantem no maximo 1.000 partidas por ate 30 dias; sessoes mais antigas podem ser removidas. O navegador guarda id e historico em `localStorage`. Recarregar a pagina restaura a partida enquanto o processo do servidor estiver ativo. Persistencia apos reinicio do servidor ainda nao foi implementada.
- A interface usa como base o mockup UX escolhido em `prototypes/01-ux.html` e reaproveita requisitos de acessibilidade do mockup `prototypes/02-accessibility.html`.
- Testes: `node --test`; execucao local: `node server.js`.

As secoes seguintes descrevem criterios do produto e uma arquitetura recomendada para evolucao. Onde diferirem do estado acima, devem ser lidas como direcao futura, nao como funcionalidade ja entregue.

## 1. Objetivo e escopo

Implementar um jogo leve, utilizavel em desktop e celular, no qual cada palpite valido recebe uma posicao de proximidade em relacao a palavra secreta. O jogo deve explicar o resultado em texto, aceitar entrada por teclado e toque e permitir acompanhar o progresso sem exigir uma conta.

### Incluido no MVP proposto

- Partidas de pratica sem limite diario, iniciadas sob demanda.
- Entrada de palpites em portugues, com validacao e normalizacao consistentes.
- Indicador textual e numerico de proximidade semantica; nao depender apenas de cores.
- Historico de palpites, estado de vitoria e opcao de compartilhar o resultado sem revelar a resposta.
- Persistencia local do estado do jogador, sem cadastro.
- Catalogo de palavras e classificacoes semanticas versionados e revisados antes da publicacao.

### Fora do MVP proposto

- Partidas competitivas em tempo real, chat ou rankings globais.
- Personalizacao de perfil, sincronizacao entre dispositivos e recursos sociais que exijam conta.
- Geracao automatica de palavras secretas sem revisao editorial.
- Monetizacao ou anuncios; qualquer inclusao deve ser decidida no PRD e testada sem interromper a partida.

## 2. Proposta de experiencia e regras

1. Ao abrir o jogo, a interface apresenta as instrucoes curtas e permite iniciar uma partida de pratica.
2. A pessoa envia um palpite por teclado ou controle de envio.
3. O servidor normaliza e valida o termo. Entradas vazias ou invalidas recebem uma mensagem acionavel e nao consomem tentativa.
4. Para um palpite aceito, o servidor devolve sua posicao semantica em relacao ao alvo e uma descricao legivel. O resultado e acrescentado ao historico.
5. A pessoa continua ate acertar, sem limite de tentativas.
6. Ao concluir, a interface mostra a resposta e o total de palpites; uma nova partida comeca somente por acao explicita.

### Semantica do indicador

Usar uma classificacao ordinal (posicao `N`) calculada dentro do vocabulario aceito para aquela palavra. A resposta exata e a posicao 1. Exibir posicao, rotulo textual e indicador visual; nao expor um valor bruto de similaridade de embedding como se fosse uma medida intuitiva de significado. Palpites duplicados nao contam novamente; apos a vitoria, a partida termina e a pessoa pode iniciar outra.

## 3. Arquitetura recomendada para evolucao

Para este repositorio, que ainda nao define framework ou infraestrutura, a arquitetura abaixo e uma recomendacao de referencia, nao uma dependencia ja existente.

```text
Navegador (aplicacao web responsiva)
  ├── interface, estado da partida e armazenamento local
  └── HTTPS/JSON
        └── API de jogo
              ├── validacao e normalizacao de palpites
              ├── criacao e estado das partidas
              └── consulta de classificacao semantica
                    └── banco relacional

Pipeline editorial/offline
  ├── vocabulario e vetores semanticos versionados
  ├── calculo das classificacoes por palavra-alvo
  └── revisao humana e publicacao
```

### Cliente web

- A implementacao atual usa JavaScript nativo; uma migracao para TypeScript ou framework de interface so deve ocorrer quando reduzir custo de manutencao.
- Separar componentes visuais da regra de partida e do cliente HTTP.
- Manter no cliente apenas dados publicos da partida, palpites enviados e resultados retornados pela API. Nunca incluir a palavra-alvo nem a tabela completa de classificacoes no pacote entregue ao navegador.
- Usar armazenamento local versionado para restaurar partidas em andamento. A API permanece fonte da verdade para validar palpites e determinar a resposta.
- Implementar estados claros de carregamento, erro recuperavel, entrada invalida, palpite aceito e partida concluida.

### API

- API HTTP JSON sobre HTTPS, sem sessao autenticada no MVP.
- Endpoints versionados sob `/api/v1`.
- Respostas com esquemas validados no servidor; mensagens de erro estaveis e sem dados internos.
- Limitar a quantidade e frequencia de palpites por cliente/desafio. A chave de limitacao deve evitar identificadores pessoais desnecessarios; a politica concreta depende da infraestrutura escolhida.
- Nao enviar ao cliente dados que permitam enumerar ou baixar a classificacao completa do desafio.

### Servico de similaridade

- Calcular as classificacoes fora do caminho de requisicao, antes da publicacao do desafio. Assim, palpites nao dependem de uma chamada lenta a um modelo de linguagem ou a um fornecedor externo.
- Para um vocabulario aceito de tamanho `V`, gerar uma classificacao por alvo com custo aproximado `O(V * d)` por alvo, onde `d` e a dimensao do vetor. Armazenar apenas a classificacao e os metadados necessarios ao jogo.
- Durante a partida, validar o termo e consultar a posicao indexada em `O(1)` ou `O(log V)`, conforme o indice do armazenamento.
- Fixar e registrar versao do modelo, vocabulario, normalizador e algoritmo em cada lote de desafios. Recalcular desafios futuros quando a versao mudar; nao alterar resultados de partidas publicadas sem uma migracao explicita.
- Se a equipe optar por similaridade calculada em tempo real em vez de classificacao precomputada, medir latencia e consistencia antes de substituir esta proposta.

## 4. Contratos de dados e endpoints

Os exemplos sao contratos iniciais; esquemas finais devem ser definidos junto ao framework e persistencia escolhidos.

### `POST /api/v1/games`

Inicia uma partida de pratica e retorna somente identificadores e regras publicas.

```json
{
  "gameId": "opaque-game-id",
  "language": "pt-BR",
  "rulesVersion": 1
}
```

Nao retornar o alvo, seus vetores, a classificacao completa ou uma resposta que permita deduzi-los diretamente.

### `POST /api/v1/games/{gameId}/guesses`

Pedido:

```json
{
  "guess": "exemplo"
}
```

Resposta para um termo aceito:

```json
{
  "normalizedGuess": "exemplo",
  "rank": 1432,
  "proximityLabel": "frio",
  "isCorrect": false
}
```

Resposta para um termo nao aceito deve usar um codigo de erro documentado, por exemplo `422 UNKNOWN_WORD`, com uma mensagem apropriada a pessoa usuaria. Palpites duplicados retornam o resultado ja conhecido e nao criam novo registro. Como nao ha limite de tentativas, apenas o acerto encerra a partida.

### Persistencia sugerida

- `Word`: identificador, forma canonica, idioma, lema opcional, estado editorial e origem/licenca do conteudo.
- `WordSetEntry`: identificador, forma canonica, idioma, lema opcional, estado editorial e origem/licenca do conteudo.
- `Game`: identificador opaco, identificador da palavra-alvo (somente servidor), idioma, estado e versoes do vocabulario/modelo.
- `WordRank`: identificador da palavra-alvo, identificador do termo aceito e posicao ordinal. Restrita ao servidor.
- `GuessAudit` (opcional): registros minimizados para diagnostico e metricas, com politica de retencao definida. Nao armazenar IP bruto ou texto livre alem do necessario.

## 5. Normalizacao, vocabulario e qualidade linguistica

- Definir idioma e locale do desafio explicitamente, inicialmente `pt-BR`.
- Normalizar Unicode em NFC, remover espacos externos e aplicar normalizacao de caixa de forma consistente.
- Definir regras de acentos, hifen, apostrofo, flexoes, locucoes, plurais e variantes antes de construir a lista aceita. Nao remover acentos indiscriminadamente se isso criar ambiguidades.
- Manter uma forma canonica para comparacao e uma forma de exibicao revisada editorialmente.
- Validar o vocabulario quanto a duplicatas apos normalizacao, termos ofensivos, nomes proprios, homonimos, regionalismos e respostas ambiguas.
- Registrar proveniencia e licenca de dicionarios, corpus e modelos de embeddings antes de qualquer distribuicao.
- Revisar manualmente os desafios e as palavras mais proximas para reduzir pistas enganosas causadas por polissemia ou dados de treinamento.
- Preparar uma suite de casos de regressao linguistica para cada versao de normalizacao/vocabulario.

## 6. Modelo de estado no cliente

Uma partida local pode ser representada por:

```ts
type GameState = {
  gameId: string;
  guesses: Array<{
    normalizedGuess: string;
    rank: number;
    proximityLabel: string;
    isCorrect: boolean;
  }>;
  status: "in_progress" | "won" | "lost";
  rulesVersion: number;
};
```

- Persistir por partida, chaveado por `gameId` e versao das regras.
- Tratar dados locais invalidos ou de versao antiga com migracao explicita ou reinicializacao anunciada; nao apresentar estado corrompido como uma partida valida.
- Ao recarregar, reconstruir a interface a partir do historico local e reconciliar com o servidor quando o contrato oferecer essa operacao.
- Limpar ou anonimizar historicos antigos segundo uma politica de retencao definida pelo produto.

## 7. Acessibilidade e adaptabilidade

- Operacao completa por teclado, ordem de foco previsivel e foco visivel.
- Rotulos acessiveis para campo, botao de envio, palpites e acoes de compartilhar.
- Anunciar novos resultados e erros com uma regiao `aria-live` apropriada, sem reler todo o tabuleiro a cada atualizacao.
- Comunicar proximidade por texto e numero; cor e animacao sao reforcos opcionais, nunca o unico canal.
- Respeitar ampliacao/reflow, contraste, reducao de movimento e areas de toque adequadas.
- Nao impor temporizador para resolver o desafio.
- Avaliar conformidade com WCAG 2.2 nivel AA e validar com leitor de tela e testes manuais, alem de verificacoes automatizadas.

## 8. Seguranca, privacidade e confiabilidade

- Servir exclusivamente por HTTPS em producao e aplicar protecoes web padrao no framework/servidor selecionado.
- Validar tamanho, caracteres e formato de cada entrada; restringir volume de requisicoes para reduzir abuso automatizado.
- Manter segredo e palavra-alvo no servidor. Nao confiar em estado de vitoria ou pontuacao calculados apenas no navegador.
- Coletar somente metricas necessarias ao produto, agregadas sempre que possivel. Consentimento, retencao e analitica devem seguir as decisoes de privacidade e legislacao aplicavel.
- Nao incluir texto de palpites em ferramentas de terceiros por padrao.
- Retornar erros observaveis em logs do servidor com identificador de requisicao, sem registrar dados sensiveis.
- Definir cache por identificador de partida e idioma; nunca compartilhar dados secretos.

## 9. Observabilidade e metricas

Instrumentar, de forma minimizada e agregada:

- desafios carregados e partidas iniciadas/concluidas;
- taxa de vitoria e distribuicao de numero de tentativas;
- abandono por etapa e erros de validacao;
- latencia e disponibilidade dos endpoints;
- termos ausentes ou controversos sinalizados para revisao editorial.

Nao usar volume bruto de palpites como sinonimo de diversao. Avaliar retencao e satisfacao junto a testes qualitativos; definir metas e janela de medicao no PRD.

## 10. Testes e criterios de aceite tecnicos

### Testes automatizados

- Unitarios: normalizacao Unicode, validacao do vocabulario, calculo/mapeamento de rotulos e transicoes de estado.
- Integracao: endpoints para iniciar partida, palpite correto, palpite valido incorreto, termo desconhecido, duplicata, partida inexistente e partida concluida.
- Contrato: formatos de sucesso e erro da API e ausencia do alvo/classificacao na resposta publica.
- Interface: envio por teclado e toque, restauracao local, estados de erro e conclusao.
- Acessibilidade: verificacao automatizada de estrutura/rotulos e roteiro manual de teclado/leitor de tela.
- Dados: invariantes de classificacao (alvo em posicao 1, ranks unicos e contiguos quando aplicavel, apenas termos aceitos).

### Criterios de aceite para o MVP

1. Uma partida de pratica pode ser iniciada em navegadores desktop e mobile sem expor a palavra-alvo.
2. Um palpite valido recebe a mesma posicao para a mesma palavra e versao de dados.
3. Entradas invalidas produzem erro compreensivel e nao consomem tentativa.
4. A partida sobrevive a recarregamento no mesmo dispositivo sem perder o historico.
5. Todas as informacoes de proximidade estao disponiveis em texto, sem dependencia de cor.
6. O pipeline impede publicar palavra sem classificacao completa e revisao registrada.
7. O sistema registra versoes suficientes para reproduzir uma resposta e investigar discrepancias.

## 11. Implantacao e pipeline editorial

1. Importar fontes linguisticas e vetores com licencas verificadas.
2. Executar normalizacao e validacoes de qualidade sobre o vocabulario.
3. Gerar classificacoes para os alvos candidatos.
4. Produzir relatorio de vizinhos semanticos para revisao editorial.
5. Aprovar palavra-alvo, idioma e versoes; publicar o conjunto de dados de forma atomica.
6. Executar verificacao de saude e testes de contrato antes de liberar o desafio.
7. Monitorar erros/latencia; permitir desativar um desafio com procedimento explicito e mensagem ao jogador.

Recomendacao para o MVP: publicar desafios previamente preparados, evitando depender de geracao ou inferencia em tempo real no horario de jogo.

## 12. Riscos e decisoes pendentes do PRD

- Variante linguistica, flexoes aceitas e tratamento de acentos.
- Perfil do publico, tom, temas e politica para palavras sensiveis.
- Hospedagem de producao e persistencia duravel.
- Fonte/licenca de um vocabulario maior e de um modelo semantico; qualidade em portugues brasileiro.
- Limites das faixas textuais e exemplos de proximidade para o tutorial.
- Necessidade de compartilhamento e estatisticas locais.
- Analitica, retencao de dados e politicas de monetizacao.

## 13. Plano de implementacao sugerido

1. Validar a compreensao do ranking e dos rotulos com pessoas usuarias.
2. Ampliar o vocabulario com fontes/licencas verificadas e revisao linguistica.
3. Persistir partidas de forma duravel antes de hospedar para uso multiusuario.
4. Implementar pipeline editorial, observabilidade e deploy.
5. Executar testes de usabilidade, acessibilidade, qualidade linguistica e desempenho antes de ampliar o vocabulario.
