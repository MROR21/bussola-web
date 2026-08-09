import { useState } from 'react'
import { login } from './authService'
import { useAuthStore } from './authStore'

// "Quem é você" — nome + email → /auth/login (get-or-create) → guarda no authStore.
export function LoginForm() {
  const entrar = useAuthStore((state) => state.login)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!nome.trim() || !email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const resposta = await login(nome.trim(), email.trim())
      entrar(resposta.usuario, resposta.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
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
        <h2 className="text-lg font-semibold">Bem-vindo(a) 👋</h2>
        <p className="text-sm text-neutral-400">Entre pra começar sua jornada.</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-300">Nome</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-neutral-300">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@agilean.com.br"
          className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-purple-400"
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !nome.trim() || !email.trim()}
        className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )
}
