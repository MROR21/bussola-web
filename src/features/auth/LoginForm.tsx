import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Spinner } from '../../components/Spinner'
import { login, loginComMicrosoft, register } from './authService'
import { useAuthStore } from './authStore'
import { entrarComMicrosoft, msalHabilitado } from './msal'

// As 4 cores oficiais da marca Microsoft — é literalmente a marca exigida nas guidelines de
// "Entrar com a Microsoft", não um ícone genérico.
function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" className="size-4 shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

// "Quem é você" — dois modos: entrar (e-mail + senha) e criar conta (nome + e-mail + senha) — mais
// "Entrar com Microsoft" (workspace da própria Agilean), que serve pros dois: get-or-create sem senha.
export function LoginForm() {
  const entrar = useAuthStore((state) => state.login)
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [carregandoMicrosoft, setCarregandoMicrosoft] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ehCadastro = modo === 'cadastro'

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const resposta = ehCadastro
        ? await register(nome.trim(), email.trim(), senha)
        : await login(email.trim(), senha)
      entrar(resposta.usuario, resposta.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  async function handleMicrosoft() {
    setError(null)
    setCarregandoMicrosoft(true)
    try {
      const accessToken = await entrarComMicrosoft()
      const resposta = await loginComMicrosoft(accessToken)
      entrar(resposta.usuario, resposta.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar com a Microsoft')
    } finally {
      setCarregandoMicrosoft(false)
    }
  }

  function trocarModo() {
    setModo(ehCadastro ? 'login' : 'cadastro')
    setError(null)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-xl font-semibold">
          {ehCadastro ? (
            'Criar conta'
          ) : (
            <>
              Bem-vindo(a) <Icon name="waving_hand" className="text-xl text-[#d4af37]" />
            </>
          )}
        </h2>
        <p className="text-sm text-neutral-400">
          {ehCadastro ? 'Crie sua conta pra começar.' : 'Entre pra continuar sua jornada.'}
        </p>
      </div>

      {ehCadastro && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-300">Nome</span>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="rounded-lg border border-[#28314a] bg-[#0a0f1a] px-3.5 py-2.5 text-neutral-100 outline-none focus:border-[#c9a227]"
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-neutral-300">E-mail</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@agilean.com.br"
          className="rounded-lg border border-[#28314a] bg-[#0a0f1a] px-3.5 py-2.5 text-neutral-100 outline-none focus:border-[#c9a227]"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-neutral-300">Senha</span>
        <input
          required
          type="password"
          minLength={ehCadastro ? 6 : undefined}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={ehCadastro ? 'Ao menos 6 caracteres' : '••••••••'}
          className="rounded-lg border border-[#28314a] bg-[#0a0f1a] px-3.5 py-2.5 text-neutral-100 outline-none focus:border-[#c9a227]"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-[#c9a227] px-4 py-2.5 text-sm font-medium text-[#0a0f1a] hover:bg-[#d4af37] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Spinner /> Aguarde...
          </>
        ) : ehCadastro ? (
          'Criar conta'
        ) : (
          'Entrar'
        )}
      </button>

      {msalHabilitado && (
        <>
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <div className="h-px flex-1 bg-[#1f2b47]" aria-hidden="true" />
            ou
            <div className="h-px flex-1 bg-[#1f2b47]" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={handleMicrosoft}
            disabled={carregandoMicrosoft}
            className="flex items-center justify-center gap-2 rounded-lg border border-[#28314a] bg-[#0a0f1a] px-4 py-2.5 text-sm font-medium text-neutral-100 hover:border-[#39456b] hover:bg-[#111a2e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {carregandoMicrosoft ? (
              <>
                <Spinner /> Aguarde...
              </>
            ) : (
              <>
                <MicrosoftLogo /> Entrar com Microsoft
              </>
            )}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={trocarModo}
        className="text-sm text-[#d4af37] hover:text-[#e8c968]"
      >
        {ehCadastro ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
      </button>
    </form>
  )
}
