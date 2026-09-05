import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { Carregando } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { cx } from '../../utils/cx'
import {
  apagarEmailAutorizado,
  criarEmailAutorizado,
  definirAtivo,
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
  const [busca, setBusca] = useState('')
  const [confirmando, setConfirmando] = useState<{ usuario: UsuarioAdmin; acao: 'gestor' | 'ativo' } | null>(null)
  const toastFeedback = useSaidaValor(feedback)
  const modalConfirmar = useSaidaValor(confirmando)

  const itensFiltrados = itens.filter((u) => {
    const q = busca.trim().toLowerCase()
    if (!q) return true
    return `${u.nome} ${u.email}`.toLowerCase().includes(q)
  })

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

  async function alternarAcesso(usuario: UsuarioAdmin) {
    setAlterando(usuario.id)
    try {
      await definirAtivo(usuario.id, !usuario.ativo)
      await carregar()
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao salvar', ok: false })
    } finally {
      setAlterando(null)
    }
  }

  async function confirmarAlteracao() {
    if (!confirmando) return
    const { usuario, acao } = confirmando
    setConfirmando(null)
    if (acao === 'gestor') await alternar(usuario)
    else await alternarAcesso(usuario)
  }

  if (loading) return <Carregando texto="Carregando..." />
  if (error) return <p className="text-red-400">Erro: {error}</p>

  return (
    <div className="anim-fade flex flex-col gap-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-neutral-100">
        <Icon name="person" className="text-xl text-gold-400" /> Usuários
      </h2>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome ou e-mail..."
        className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-gold-500"
      />

      <ul className="flex flex-col gap-2">
        {itens.length > 0 && itensFiltrados.length === 0 && (
          <p className="anim-fade text-sm text-neutral-500">Nenhum usuário encontrado.</p>
        )}
        {itensFiltrados.map((usuario) => (
          <li
            key={usuario.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
          >
            <div className="flex flex-col">
              <span className={cx(usuario.ativo ? 'text-neutral-100' : 'text-neutral-500 line-through')}>
                {usuario.nome}
              </span>
              <span className="text-xs text-neutral-500">{usuario.email}</span>
            </div>
            <div className="flex items-center gap-3">
              {!usuario.ativo && (
                <span className="anim-pop rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                  Acesso revogado
                </span>
              )}
              {usuario.isGestor && (
                <span className="anim-pop rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-medium text-gold-300">
                  Supervisor
                </span>
              )}
              <button
                type="button"
                onClick={() => setConfirmando({ usuario, acao: 'gestor' })}
                disabled={alterando === usuario.id}
                className="text-sm text-gold-400 transition-all hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {usuario.isGestor ? 'Remover supervisor' : 'Tornar supervisor'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmando({ usuario, acao: 'ativo' })}
                disabled={alterando === usuario.id}
                className={cx(
                  'text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40',
                  usuario.ativo ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300',
                )}
              >
                {usuario.ativo ? 'Revogar acesso' : 'Reativar acesso'}
              </button>
            </div>
          </li>
        ))}
        {itens.length === 0 && <p className="anim-fade text-sm text-neutral-500">Nenhum usuário ainda.</p>}
      </ul>

      {modalConfirmar.montado && modalConfirmar.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalConfirmar.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmando(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalConfirmar.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const { usuario, acao } = modalConfirmar.valor
              const titulo =
                acao === 'gestor'
                  ? usuario.isGestor
                    ? 'Remover supervisor?'
                    : 'Tornar supervisor?'
                  : usuario.ativo
                    ? 'Revogar acesso?'
                    : 'Reativar acesso?'
              const descricao =
                acao === 'gestor'
                  ? usuario.isGestor
                    ? `"${usuario.nome}" deixa de ver o painel do gestor.`
                    : `"${usuario.nome}" passa a ver o painel do gestor e pode ter supervisionados.`
                  : usuario.ativo
                    ? `"${usuario.nome}" não vai mais conseguir entrar no Bússola.`
                    : `"${usuario.nome}" volta a conseguir entrar no Bússola.`
              const perigoso = acao === 'ativo' && usuario.ativo
              return (
                <>
                  <h3 className="text-lg font-semibold text-neutral-100">{titulo}</h3>
                  <p className="text-sm text-neutral-400">{descricao}</p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarAlteracao}
                      className={cx(
                        'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                        perigoso ? 'bg-red-500/90 hover:bg-red-500' : 'bg-gold-500 hover:bg-gold-400',
                      )}
                    >
                      Confirmar
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {toastFeedback.montado && toastFeedback.valor && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg',
            toastFeedback.saindo ? 'anim-pop-out' : 'anim-pop',
            toastFeedback.valor.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300',
          )}
        >
          <Icon name={toastFeedback.valor.ok ? 'check_circle' : 'warning'} className="text-base" />
          {toastFeedback.valor.texto}
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
  const [busca, setBusca] = useState('')
  const modalApagar = useSaidaValor(apagando)
  const toastFeedback = useSaidaValor(feedback)

  const itensFiltrados = itens.filter((item) => {
    const q = busca.trim().toLowerCase()
    return !q || item.email.toLowerCase().includes(q)
  })

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

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por e-mail..."
        className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-gold-500"
      />

      <ul className="flex flex-col gap-2">
        {itens.length > 0 && itensFiltrados.length === 0 && (
          <p className="anim-fade text-sm text-neutral-500">Nenhum e-mail encontrado.</p>
        )}
        {itensFiltrados.map((item) => (
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

      {modalApagar.montado && modalApagar.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalApagar.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setApagando(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalApagar.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Remover e-mail?</h3>
            <p className="text-sm text-neutral-400">
              "{modalApagar.valor.email}" deixa de nascer como supervisor ao se cadastrar.
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

      {toastFeedback.montado && toastFeedback.valor && (
        <div
          className={cx(
            'fixed bottom-4 right-4 z-30 flex items-center gap-1.5 rounded-xl border bg-navy-800 px-4 py-3 text-sm shadow-lg',
            toastFeedback.saindo ? 'anim-pop-out' : 'anim-pop',
            toastFeedback.valor.ok ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300',
          )}
        >
          <Icon name={toastFeedback.valor.ok ? 'check_circle' : 'warning'} className="text-base" />
          {toastFeedback.valor.texto}
        </div>
      )}
    </div>
  )
}
