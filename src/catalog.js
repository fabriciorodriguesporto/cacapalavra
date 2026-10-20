"use strict";

const { normalizeWord } = require("./words");

const definitions = [
  {
    answer: "mar",
    related: ["oceano", "água", "onda", "praia", "areia", "barco", "peixe", "sal", "ilha", "rio", "lago", "chuva", "vento", "sol", "azul"]
  },
  {
    answer: "árvore",
    related: ["floresta", "bosque", "folha", "raiz", "tronco", "galho", "madeira", "planta", "semente", "jardim", "natureza", "sombra", "fruto", "flor", "campo"]
  },
  {
    answer: "amizade",
    related: ["amigo", "afeto", "carinho", "confiança", "parceria", "amor", "família", "conversa", "apoio", "cuidado", "encontro", "respeito", "saudade", "alegria", "abraço"]
  },
  {
    answer: "música",
    related: ["canção", "melodia", "som", "ritmo", "instrumento", "violão", "piano", "dança", "banda", "cantor", "letra", "concerto", "festa", "rádio", "harmonia"]
  },
  {
    answer: "cachorro",
    related: ["cão", "animal", "gato", "pet", "pata", "latido", "osso", "coleira", "ração", "filhote", "casa", "passeio", "veterinário", "brincadeira", "amigo"]
  },
  {
    answer: "montanha",
    related: ["serra", "pico", "altitude", "pedra", "trilha", "neve", "rocha", "vale", "escalada", "paisagem", "natureza", "floresta", "cume", "nuvem", "campo"]
  },
  {
    answer: "fogo",
    related: ["chama", "calor", "fumaça", "brasa", "incêndio", "lenha", "fogueira", "cinza", "queimar", "luz", "água", "frio", "vela", "cozinha", "energia"]
  },
  {
    answer: "livro",
    related: ["leitura", "página", "história", "autor", "biblioteca", "romance", "papel", "palavra", "capítulo", "conto", "poesia", "escola", "capa", "leitor", "conhecimento"]
  }
];

const vocabulary = [...new Set(definitions.flatMap(({ answer, related }) => [answer, ...related]))];
const entriesByKey = new Map();

for (const word of vocabulary) {
  const key = normalizeWord(word);
  if (entriesByKey.has(key)) {
    throw new Error(`Palavra duplicada após normalização: ${word}`);
  }
  entriesByKey.set(key, word);
}

const targetRanks = new Map();

for (const { answer, related } of definitions) {
  const orderedWords = [answer, ...related, ...vocabulary];
  const rankedWords = [];
  const seen = new Set();

  for (const word of orderedWords) {
    const key = normalizeWord(word);
    if (!seen.has(key)) {
      seen.add(key);
      rankedWords.push(key);
    }
  }

  targetRanks.set(
    normalizeWord(answer),
    new Map(rankedWords.map((key, index) => [key, index + 1]))
  );
}

const targetWords = definitions.map(({ answer }) => answer);

function findVocabularyEntry(value) {
  const key = normalizeWord(value);
  if (!key) return null;
  const canonicalWord = entriesByKey.get(key);
  return canonicalWord ? { key, canonicalWord } : null;
}

function getRank(answer, wordKey) {
  const ranks = targetRanks.get(normalizeWord(answer));
  return ranks?.get(wordKey) ?? null;
}

module.exports = {
  findVocabularyEntry,
  getRank,
  targetWords
};
