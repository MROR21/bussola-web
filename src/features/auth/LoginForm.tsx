import { useState } from 'react'
import { login, register } from './authService'
import { useAuthStore } from './authStore'

// "Quem é você" — dois modos: entrar (e-mail + senha) e criar conta (nome + e-mail + senha).
export function LoginForm() {
  const entrar = useAuthStore((state) => state.login)
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
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
      className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{ehCadastro ? 'Criar conta' : 'Bem-vindo(a) 👋'}</h2>
        <p className="text-sm text-neutral-400">
          {ehCadastro ? 'Crie sua conta pra começar.' : 'Entre pra continuar sua jornada.'}
        </p>
      </div>

      {ehCadastro && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-neutral-300">Nome</span>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-300">E-mail</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@agilean.com.br"
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-300">Senha</span>
        <input
          required
          type="password"
          minLength={ehCadastro ? 6 : undefined}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder={ehCadastro ? 'Ao menos 6 caracteres' : '••••••••'}
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Aguarde...' : ehCadastro ? 'Criar conta' : 'Entrar'}
      </button>

      <button
        type="button"
        onClick={trocarModo}
        className="text-sm text-purple-300 hover:text-purple-200"
      >
        {ehCadastro ? 'Já tem conta? Entrar' : 'Não tem conta? Criar conta'}
      </button>
    </form>
  )
}
