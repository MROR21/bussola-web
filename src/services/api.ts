// Cliente base da API. Centraliza o fetch pra não repetir em cada lugar.
// O caminho começa com /api → o proxy do Vite manda pro back (http://localhost:5093).
const API_BASE = '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao chamar ${path}`)
  }
  return response.json() as Promise<T>
}
