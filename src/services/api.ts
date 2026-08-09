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

// POST com corpo JSON. Usado no nivelamento (envia o Perfil, recebe a trilha).
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao chamar ${path}`)
  }
  return response.json() as Promise<T>
}
