import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Carregando } from '../../components/Spinner'
import {
  apagarEmailAutorizado,
  criarEmailAutorizado,
  definirGestor,
  listarEmailsAutorizados,
  listarUsuariosAdmin,
} from './adminService'
import type { EmailAutorizado, UsuarioAdmin } from './types'

// Duas listas relacionadas: quem já é usuário do sistema (promove/demove direto) e quem ainda não
// se cadastrou mas já está autorizado a nascer como gestor quando o fizer (ver /auth/register).
export function UsuariosAdmin() {
  return (
    <div className="flex flex-col gap-8">
      <ListaUsuarios />
      <ListaEmailsAutorizados />
    </div>
  )
}

function ListaUsuarios() {
  const [itens, setItens] = useState<UsuarioAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alterando, setAlterando] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setItens(await listarUsuariosAdmin())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  async function alternar(usuario: UsuarioAdmin) {
    setAlterando(usuario.id)
    try {
      await definirGestor(usuario.id, !usuario.isGestor)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    } finally {
      setAlterando(null)
    }
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="anim-fade flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
        <Icon name="person" className="text-xl text-gold-400" /> Usuários
      </h2>

      <ul className="flex flex-col gap-2">
        {itens.map((usuario) => (
          <li
            key={usuario.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
          >
            <div className="flex flex-col">
              <span className="text-neutral-100">{usuario.nome}</span>
              <span className="text-xs text-neutral-500">{usuario.email}</span>
            </div>
            <div className="flex items-center gap-3">
              {usuario.isGestor && (
                <span className="anim-pop rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-medium text-gold-300">
                  Supervisor
                </span>
              )}
              <button
                type="button"
                onClick={() => alternar(usuario)}
                disabled={alterando === usuario.id}
                className="text-sm text-gold-400 transition-all hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {usuario.isGestor ? 'Remover supervisor' : 'Tornar supervisor'}
              </button>
            </div>
          </li>
        ))}
        {itens.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum usuário ainda.</p>}
      </ul>

      {feedback && (
        <div
          className={
            'anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg ' +
            (feedback.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300')
          }
        >
          <Icon name={feedback.ok ? 'check_circle' : 'warning'} className="text-base" />
          {feedback.texto}
        </div>
      )}
    </div>
  )
}

function ListaEmailsAutorizados() {
  const [itens, setItens] = useState<EmailAutorizado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [novoEmail, setNovoEmail] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [apagando, setApagando] = useState<EmailAutorizado | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)

  async function carregar() {
    setLoading(true)
    setError(null)
    try {
      setItens(await listarEmailsAutorizados())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  async function adicionar() {
    if (!novoEmail.trim()) return
    setSalvando(true)
    try {
      await criarEmailAutorizado(novoEmail.trim())
      setNovoEmail('')
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarApagar() {
    if (!apagando) return
    const alvo = apagando
    setApagando(null)
    try {
      await apagarEmailAutorizado(alvo.id)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao apagar', ok: false })
    }
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="anim-fade flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
          <Icon name="mail" className="text-xl text-gold-400" /> E-mails pré-autorizados
        </h2>
        <p className="text-sm text-neutral-500">
          Quem se cadastrar com um desses e-mails já nasce supervisor, sem precisar de promoção depois.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          value={novoEmail}
          onChange={(e) => setNovoEmail(e.target.value)}
          placeholder="novo.gestor@agilean.com.br"
          onKeyDown={(e) => e.key === 'Enter' && adicionar()}
          className="flex-1 rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500"
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={!novoEmail.trim() || salvando}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {itens.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
          >
            <span className="text-neutral-100">{item.email}</span>
            <button
              type="button"
              onClick={() => setApagando(item)}
              className="text-sm text-red-400 transition-colors hover:text-red-300"
            >
              Remover
            </button>
          </li>
        ))}
        {itens.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum e-mail na lista.</p>}
      </ul>

      {apagando && (
        <div
          className="anim-fade fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setApagando(null)}
        >
          <div
            className="anim-pop flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Remover e-mail?</h3>
            <p className="text-sm text-neutral-400">
              "{apagando.email}" deixa de nascer como supervisor ao se cadastrar.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setApagando(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarApagar}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={
            'anim-pop fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg ' +
            (feedback.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300')
          }
        >
          <Icon name={feedback.ok ? 'check_circle' : 'warning'} className="text-base" />
          {feedback.texto}
        </div>
      )}
    </div>
  )
}
