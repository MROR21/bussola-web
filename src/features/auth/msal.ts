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
    redirectUri: window.location.origin,
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
