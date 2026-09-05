import { useAuthStore } from '../features/auth/authStore'

// Cliente base da API. Centraliza o fetch pra não repetir em cada lugar.
// O caminho começa com /api → o proxy do Vite manda pro back (http://localhost:5093).
const API_BASE = '/api'

// Junta o header de Authorization (Bearer) quando há token na sessão. Endpoints abertos ignoram.
function comAuth(headers: Record<string, string> = {}): Record<string, string> {
  const token = useAuthStore.getState().token
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers
}

// Mensagem genérica pra quando o fetch nem chega a receber resposta (servidor fora do ar, sem
// rede etc.) — o navegador rejeita a Promise nesses casos, sem status/corpo pra ler.
const ERRO_SEM_CONEXAO = 'Não foi possível falar com o servidor. Verifique sua conexão ou tente novamente em instantes.'

// Extrai a mensagem de erro do back. Padrão do back: corpo { erro: "..." }.
// Se não vier JSON (ex.: 500 cru, ou o proxy do Vite respondendo no lugar do back que caiu), cai
// numa mensagem genérica com só o status — nunca expõe o path interno da API pro usuário.
async function extrairErro(response: Response, path: string): Promise<string> {
  // 401 fora do login = token expirado/inválido → desloga e volta pro login (sem erro cru).
  if (response.status === 401 && !path.startsWith('/auth/')) {
    useAuthStore.getState().logout()
    return 'Sua sessão expirou. Entre novamente.'
  }
  try {
    const body = await response.json()
    if (body && typeof body.erro === 'string') {
      return body.erro
    }
  } catch {
    // resposta sem corpo JSON — usa o fallback abaixo
  }
  return `Ocorreu um erro no servidor (${response.status}). Tente novamente em instantes.`
}

// Envolve o fetch de verdade — se ele nem chegar a responder (servidor fora do ar), troca o erro
// cru do navegador (ex.: "Failed to fetch") por uma mensagem amigável.
async function fetchOuFalhaAmigavel(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_BASE}${path}`, init)
  } catch {
    throw new Error(ERRO_SEM_CONEXAO)
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetchOuFalhaAmigavel(path, { headers: comAuth() })
  if (!response.ok) {
    throw new Error(await extrairErro(response, path))
  }
  return response.json() as Promise<T>
}

// POST com corpo JSON. Usado no nivelamento (envia o Perfil, recebe a trilha).
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetchOuFalhaAmigavel(path, {
    method: 'POST',
    headers: comAuth({ 'Content-Type': 'application/json' }),
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
  const response = await fetchOuFalhaAmigavel(path, {
    method,
    headers: comAuth(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    throw new Error(await extrairErro(response, path))
  }
}
