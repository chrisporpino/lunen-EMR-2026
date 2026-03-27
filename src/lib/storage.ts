/**
 * Camada de persistência local — localStorage.
 *
 * Regras:
 * - Se a chave existir e o JSON for válido, usa os dados armazenados.
 * - Se a chave não existir ou o JSON estiver corrompido, retorna uma cópia do seed.
 * - Falhas de escrita (quota excedida, modo privado restrito) são silenciosas.
 */

export function loadFromStorage<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T[]
    }
  } catch {
    // JSON inválido ou localStorage indisponível — ignora e usa seed
  }
  return [...seed]
}

export function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Quota excedida ou localStorage bloqueado — ignora silenciosamente
  }
}
