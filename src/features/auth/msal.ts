import { PublicClientApplication } from '@azure/msal-browser'

// App registrado DENTRO do próprio locatário (tenant) da Agilean no Entra ID — não multi-tenant,
// então a authority aponta pro domínio da empresa em vez do endpoint genérico "common". O Client ID
// é por ambiente (variável VITE_MSAL_CLIENT_ID, em .env.local — nunca commitado). Sem ela, o botão
// "Entrar com Microsoft" fica escondido em vez de quebrar.
const clientId = import.meta.env.VITE_MSAL_CLIENT_ID

export const msalHabilitado = Boolean(clientId)

const msalInstance = new PublicClientApplication({
  auth: {
    clientId: clientId ?? '',
    authority: 'https://login.microsoftonline.com/agilean.com.br',
    // Página-ponte dedicada (`redirect.html` na raiz do projeto, ver vite.config.ts) — se o
    // redirect voltar pro app de verdade, o React/router monta e "come" o hash da resposta antes
    // do MSAL conseguir lê-lo, e o popup nunca fecha sozinho (fica mostrando o app dentro dele
    // mesmo — era o "timed_out"/hash_empty_error que o Miguel bateu). No MSAL v5 essa página
    // precisa rodar o script de `@azure/msal-browser/redirect-bridge` — não basta ser uma página
    // em branco (mudou de v4 pra v5, ver docs/redirect-bridge.md do msal-browser).
    redirectUri: `${window.location.origin}/redirect.html`,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
})

let inicializacao: Promise<void> | null = null
function garantirInicializado(): Promise<void> {
  inicializacao ??= msalInstance.initialize()
  return inicializacao
}

// Abre o popup de login da Microsoft e devolve um access token do Graph (escopo "User.Read") —
// o back valida esse token chamando o próprio Graph, então aqui só precisamos do token em si.
export async function entrarComMicrosoft(): Promise<string> {
  await garantirInicializado()
  const resultado = await msalInstance.loginPopup({ scopes: ['User.Read'] })
  return resultado.accessToken
}
