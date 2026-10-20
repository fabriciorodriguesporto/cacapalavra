"use strict";

function normalizeWord(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (!trimmed || trimmed.length > 48) return null;
  if (!/^[\p{L}\p{M}]+(?:[ '-][\p{L}\p{M}]+)*$/u.test(trimmed)) return null;

  return trimmed
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC");
}

module.exports = { normalizeWord };
