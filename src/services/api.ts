// Cliente base da API. Centraliza o fetch pra não repetir em cada lugar.
// O caminho começa com /api → o proxy do Vite manda pro back (http://localhost:5093).
const API_BASE = '/api'

// Extrai a mensagem de erro do back. Padrão do back: corpo { erro: "..." }.
// Se não vier JSON (ex.: 204 ou 500 cru), cai numa mensagem genérica com o status.
async function extrairErro(response: Response, path: string): Promise<string> {
  try {
    const body = await response.json()
    if (body && typeof body.erro === 'string') {
      return body.erro
    }
  } catch {
    // resposta sem corpo JSON — usa o fallback abaixo
  }
  return `Erro ${response.status} ao chamar ${path}`
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(await extrairErro(response, path))
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
    throw new Error(await extrairErro(response, path))
  }
  return response.json() as Promise<T>
}

// Ações que respondem 204 (sem corpo): salvar perfil, marcar/desmarcar passo.
// Valida o ok e não faz parse de JSON (204 não tem corpo).
export async function apiSend(
  method: 'PUT' | 'POST' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(await extrairErro(response, path))
  }
}
