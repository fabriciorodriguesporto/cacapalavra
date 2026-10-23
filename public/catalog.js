function normalizeKey(word) {
  return word.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");
}

const terms = new Map();

function addTerms(feature, words) {
  for (const [word, weight = 1] of words) {
    const key = normalizeKey(word);
    const entry = terms.get(key) ?? { key, word, features: {} };
    entry.features[feature] = weight;
    terms.set(key, entry);
  }
}

addTerms("natureza", [
  ["natureza"], ["árvore", 0.8], ["flor", 0.9], ["jardim", 0.9], ["folha", 0.8],
  ["floresta", 1], ["planta", 0.9], ["grama", 0.8], ["semente", 0.7], ["raiz", 0.7],
  ["bosque", 0.9], ["terra", 0.6], ["montanha", 0.8], ["pedra", 0.6], ["campo", 0.7],
  ["paisagem", 0.7], ["parque", 0.6], ["sol", 0.5], ["sombra", 0.5], ["animal", 0.5]
]);
addTerms("plantas", [
  ["arvore"], ["flor"], ["jardim"], ["folha"], ["floresta"], ["planta"], ["grama"],
  ["semente"], ["raiz"], ["bosque"], ["fruta", 0.5], ["maçã", 0.6], ["rosa", 0.7],
  ["girassol", 0.8], ["horta", 0.7], ["vaso", 0.5], ["pétala", 0.8], ["madeira", 0.4]
]);
addTerms("agua", [
  ["agua"], ["rio"], ["mar"], ["oceano"], ["lago"], ["praia", 0.8], ["onda", 0.8],
  ["chuva", 0.7], ["piscina", 0.7], ["peixe", 0.5], ["barco", 0.5], ["cachoeira", 0.9],
  ["fonte", 0.6], ["nadar", 0.5], ["sede", 0.4], ["gelo", 0.5], ["nuvem", 0.4]
]);
addTerms("litoral", [
  ["mar"], ["oceano"], ["praia"], ["onda"], ["areia"], ["barco"], ["peixe", 0.4],
  ["concha", 0.7], ["ilha", 0.6], ["farol", 0.5], ["vela", 0.3], ["porto", 0.5],
  ["surf", 0.7], ["mergulho", 0.6], ["navio", 0.6]
]);
addTerms("clima", [
  ["chuva"], ["nuvem"], ["vento"], ["tempestade"], ["clima"], ["sol"], ["frio", 0.5],
  ["calor", 0.5], ["neve", 0.5], ["raio", 0.6], ["trovão", 0.6], ["arco-íris", 0.6],
  ["guarda-chuva", 0.5], ["previsão", 0.4], ["céu", 0.5]
]);
addTerms("comida", [
  ["comida"], ["pão"], ["café", 0.7], ["arroz"], ["feijão"], ["fruta", 0.8], ["maçã", 0.8],
  ["banana", 0.8], ["bolo", 0.7], ["chocolate", 0.7], ["queijo", 0.7], ["leite", 0.7],
  ["sopa", 0.7], ["salada", 0.7], ["pizza", 0.7], ["jantar", 0.5], ["almoço", 0.5],
  ["doce", 0.5], ["açúcar", 0.5], ["mel", 0.5]
]);
addTerms("cozinha", [
  ["cozinha"], ["prato"], ["mesa", 0.6], ["panela"], ["talher", 0.7], ["forno", 0.6],
  ["receita", 0.6], ["faca", 0.5], ["copo", 0.4], ["colher", 0.6], ["comida", 0.5],
  ["pão", 0.4], ["café", 0.4], ["geladeira", 0.6], ["fogão", 0.6]
]);
addTerms("casa", [
  ["casa"], ["quarto"], ["janela"], ["porta"], ["cama"], ["sofá"], ["cadeira"],
  ["mesa"], ["cozinha"], ["banheiro"], ["lar"], ["telhado"], ["parede"], ["quintal"],
  ["chave"], ["lâmpada"], ["tapete"], ["família", 0.5]
]);
addTerms("animais", [
  ["animal"], ["cachorro"], ["gato"], ["pássaro"], ["cavalo"], ["peixe"], ["abelha"],
  ["borboleta"], ["leão"], ["ninho"], ["pata"], ["pelo"], ["coelho"], ["vaca"],
  ["elefante"], ["macaco"], ["cobra"], ["tartaruga"], ["fazenda", 0.5], ["floresta", 0.4]
]);
addTerms("emocao", [
  ["amor"], ["alegria"], ["tristeza"], ["medo"], ["paz"], ["sonho"], ["carinho"],
  ["amizade"], ["saudade"], ["esperança"], ["felicidade"], ["raiva"], ["calma"],
  ["coração", 0.4], ["sorriso", 0.4], ["abraço", 0.5], ["família", 0.5], ["poesia", 0.3]
]);
addTerms("corpo", [
  ["cabeça"], ["mão"], ["pé"], ["coração"], ["olho"], ["ouvido"], ["corpo"],
  ["saúde"], ["sorriso"], ["voz"], ["pele"], ["braço"], ["perna"], ["rosto"],
  ["dedo"], ["nariz"], ["boca"], ["cabelo"], ["sono", 0.4], ["respiração", 0.5]
]);
addTerms("viagem", [
  ["viagem"], ["cidade", 0.5], ["estrada", 0.7], ["mapa", 0.5], ["mala", 0.6],
  ["hotel", 0.6], ["passagem", 0.5], ["avião", 0.7], ["trem", 0.6], ["ônibus", 0.5],
  ["carro", 0.5], ["praia", 0.4], ["montanha", 0.4], ["turismo", 0.7], ["aventura", 0.5]
]);
addTerms("transporte", [
  ["carro"], ["ônibus"], ["bicicleta"], ["viagem"], ["estrada"], ["trem"], ["avião"],
  ["barco"], ["navio"], ["metrô"], ["moto"], ["trânsito"], ["roda"], ["motor"],
  ["estação"], ["porto"], ["capacete", 0.4]
]);
addTerms("cidade", [
  ["cidade"], ["rua"], ["praça"], ["loja"], ["hospital"], ["escola"], ["trabalho"],
  ["parque"], ["prédio"], ["bairro"], ["trânsito"], ["calçada"], ["mercado"],
  ["biblioteca"], ["restaurante"], ["avenida"], ["ônibus", 0.4], ["casa", 0.4]
]);
addTerms("cultura", [
  ["música"], ["livro"], ["filme"], ["arte"], ["teatro"], ["poesia"], ["história"],
  ["cultura"], ["dança"], ["cinema"], ["pintura"], ["museu"], ["festa"], ["leitura"],
  ["fotografia"], ["desenho"], ["palavra"], ["jornal"]
]);
addTerms("musica", [
  ["música"], ["canção"], ["instrumento"], ["violão"], ["piano"], ["bateria"], ["voz"],
  ["som"], ["ritmo"], ["dança"], ["show"], ["rádio"], ["cantor"], ["festa"],
  ["guitarra"], ["melodia"], ["compositor"]
]);
addTerms("estudo", [
  ["escola"], ["livro"], ["caderno"], ["lápis"], ["caneta"], ["professor"], ["aluno"],
  ["prova"], ["estudo"], ["leitura"], ["história"], ["ciência"], ["matemática"],
  ["biblioteca"], ["aula"], ["conhecimento"], ["palavra"], ["mapa"]
]);
addTerms("trabalho", [
  ["trabalho"], ["escritório"], ["reunião"], ["computador"], ["colega"], ["profissão"],
  ["dinheiro"], ["projeto"], ["loja"], ["hospital"], ["escola"], ["ferramenta"],
  ["construção"], ["serviço"], ["empresa"], ["agenda"], ["cidade"]
]);
addTerms("esporte", [
  ["esporte"], ["futebol"], ["corrida"], ["bola"], ["natação"], ["bicicleta"], ["jogo"],
  ["time"], ["gol"], ["quadra"], ["campo"], ["treino"], ["atleta"], ["medalha"],
  ["basquete"], ["vôlei"], ["surf"], ["piscina"]
]);
addTerms("tecnologia", [
  ["computador"], ["celular"], ["internet"], ["telefone"], ["tela"], ["teclado"],
  ["aplicativo"], ["câmera"], ["jogo"], ["robô"], ["energia"], ["máquina"],
  ["rádio"], ["televisão"], ["rede"], ["dados"], ["programa"]
]);
addTerms("tempo", [
  ["dia"], ["noite"], ["manhã"], ["tarde"], ["semana"], ["mês"], ["ano"], ["hoje"],
  ["amanhã"], ["ontem"], ["relógio"], ["calendário"], ["estação"], ["futuro"],
  ["passado"], ["momento"], ["hora"], ["rotina"]
]);
addTerms("objetos", [
  ["chave"], ["relógio"], ["caderno"], ["lápis"], ["caneta"], ["copo"], ["prato"],
  ["cadeira"], ["mesa"], ["lâmpada"], ["espelho"], ["telefone"], ["mochila"],
  ["guarda-chuva"], ["tesoura"], ["óculos"], ["bola"], ["brinquedo"]
]);
addTerms("saude", [
  ["saúde"], ["hospital"], ["médico"], ["remédio"], ["sono"], ["exercício"],
  ["corpo"], ["coração"], ["cuidado"], ["água"], ["fruta"], ["respiração"],
  ["dor"], ["descanso"], ["sorriso"], ["vacina"], ["energia"]
]);
addTerms("cores", [
  ["azul"], ["verde"], ["amarelo"], ["vermelho"], ["branco"], ["preto"], ["roxo"],
  ["rosa"], ["laranja"], ["cinza"], ["cor"], ["pintura"], ["arco-íris"], ["luz"]
]);

export const vocabulary = terms;

const displayCorrections = new Map([
  ["arvore", "árvore"],
  ["maca", "maçã"]
]);
for (const [key, display] of displayCorrections) {
  const entry = vocabulary.get(key);
  if (entry) entry.word = display;
}

const featuredTargets = [
  "flor", "arvore", "jardim", "floresta", "montanha", "mar", "oceano", "praia",
  "chuva", "vento", "comida", "cafe", "casa", "familia", "cachorro", "gato",
  "amor", "alegria", "viagem", "cidade", "musica", "escola", "bicicleta", "corpo"
].filter((key) => vocabulary.has(key));
export const targetWords = [
  ...featuredTargets,
  ...[...vocabulary.keys()].filter((key) => !featuredTargets.includes(key))
];

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (const [feature, value] of Object.entries(left.features)) {
    leftMagnitude += value * value;
    dot += value * (right.features[feature] ?? 0);
  }
  for (const value of Object.values(right.features)) {
    rightMagnitude += value * value;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    throw new Error("Cada palavra do catálogo precisa ter ao menos uma associação.");
  }
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function findVocabularyEntry(key) {
  return vocabulary.get(key) ?? null;
}

export function rankWords(answerKey) {
  const answer = findVocabularyEntry(answerKey);
  if (!answer) throw new RangeError("A palavra-alvo não existe no vocabulário.");

  return [...vocabulary.values()]
    .map((entry) => ({ key: entry.key, word: entry.word, similarity: cosineSimilarity(answer, entry) }))
    .sort((left, right) => {
      if (left.key === answerKey) return -1;
      if (right.key === answerKey) return 1;
      return right.similarity - left.similarity || (left.key < right.key ? -1 : left.key > right.key ? 1 : 0);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function getRank(answerKey, guessKey) {
  const guess = findVocabularyEntry(guessKey);
  if (!guess) return null;
  return rankWords(answerKey).find((entry) => entry.key === guess.key)?.rank ?? null;
}
