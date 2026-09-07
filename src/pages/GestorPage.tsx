import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { EstadoErro } from '../components/EstadoErro'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Carregando } from '../components/Spinner'
import { usePolling } from '../hooks/useAtualizarEmSegundoPlano'
import { useSaidaValor } from '../hooks/useSaida'
import { useTitulo } from '../hooks/useTitulo'
import { cx } from '../utils/cx'
import {
  adicionarSupervisionado,
  getDisponiveis,
  getUsuariosProgresso,
  removerSupervisionado,
} from '../features/gestor/gestorService'
import type { UsuarioDisponivel, UsuarioProgresso } from '../features/gestor/types'

// Painel do gestor: progresso dos supervisionados + adicionar/remover supervisionados.
export function GestorPage() {
  useTitulo('Supervisionados')
  const [usuarios, setUsuarios] = useState<UsuarioProgresso[]>([])
  const [disponiveis, setDisponiveis] = useState<UsuarioDisponivel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [buscaDisponivel, setBuscaDisponivel] = useState('')
  const [confirmandoRemover, setConfirmandoRemover] = useState<UsuarioProgresso | null>(null)
  const [removendoId, setRemovendoId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const modalRemover = useSaidaValor(confirmandoRemover)
  const toastFeedback = useSaidaValor(feedback)
  const navegar = useNavigate()

  const disponiveisFiltrados = disponiveis.filter((u) => {
    const q = buscaDisponivel.trim().toLowerCase()
    if (!q) return true
    return `${u.nome} ${u.email}`.toLowerCase().includes(q)
  })

  async function carregar() {
    setError(null)
    try {
      const [supervisionados, livres] = await Promise.all([
        getUsuariosProgresso(),
        getDisponiveis(),
      ])
      setUsuarios(supervisionados)
      setDisponiveis(livres)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar o painel')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // O supervisionado avança (marca passo/fluxo, o gestor edita o cargo dele etc.) numa sessão
  // separada, no navegador dele — sem isso, o gestor ficava olhando pra uma barra de progresso
  // parada até sair e voltar pra essa tela. Atualização silenciosa: não mexe em loading/error de
  // tela cheia, só troca os dados por trás se der certo (falha aqui não deve incomodar quem tá
  // usando — tenta de novo sozinho no próximo poll).
  usePolling(async () => {
    try {
      const [supervisionados, livres] = await Promise.all([getUsuariosProgresso(), getDisponiveis()])
      setUsuarios(supervisionados)
      setDisponiveis(livres)
    } catch {
      // silencioso
    }
  }, 15_000)

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  async function adicionar(id: string, nome: string) {
    try {
      await adicionarSupervisionado(id)
      await carregar()
      setFeedback({ texto: `${nome} adicionado(a) aos seus supervisionados.`, ok: true })
    } catch (e) {
      setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao adicionar', ok: false })
    }
  }

  // Espera a animação de saída (`anim-pop-out`, 150ms) tocar antes de tirar de verdade da lista —
  // senão o item some na hora, sem chance de animar.
  async function confirmarRemocao() {
    if (!confirmandoRemover) return
    const alvo = confirmandoRemover
    setConfirmandoRemover(null)
    setRemovendoId(alvo.id)
    setTimeout(async () => {
      try {
        await removerSupervisionado(alvo.id)
        await carregar()
        setFeedback({ texto: `${alvo.nome} removido(a) dos seus supervisionados.`, ok: true })
      } catch (e) {
        setFeedback({ texto: e instanceof Error ? e.message : 'Erro ao remover', ok: false })
      } finally {
        setRemovendoId(null)
      }
    }, 150)
  }

  if (loading) return <Carregando texto="Carregando o painel..." />
  if (error) return <EstadoErro onRetry={carregar} />

  return (
    <div className="anim-fade relative flex w-full max-w-2xl flex-col gap-6">
      <CompassRose className="pointer-events-none absolute -right-10 -top-4 size-64 text-gold-500 opacity-[0.06]" />
      <MapIllustration className="pointer-events-none absolute -bottom-6 -left-8 w-56 text-gold-500 opacity-[0.06]" />
      <header className="relative flex flex-col gap-1 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="dashboard" className="text-2xl text-gold-400" /> Painel do gestor
        </h1>
        <p className="text-sm text-neutral-400">
          Progresso dos seus supervisionados ({usuarios.length}{' '}
          {usuarios.length === 1 ? 'pessoa' : 'pessoas'}).
        </p>
      </header>

      {usuarios.length === 0 && (
        <p className="anim-fade text-neutral-500">
          Você ainda não tem supervisionados. Adicione alguém abaixo.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {usuarios.map((u) => {
          const percent =
            u.totalPassos > 0 ? Math.round((u.passosConcluidos / u.totalPassos) * 100) : 0
          return (
            <li
              key={u.id}
              onClick={() => navegar(`/supervisionado/${u.id}`)}
              className={cx(
                'flex cursor-pointer flex-col gap-2 rounded-xl border border-navy-700 bg-navy-800 p-4 transition-colors hover:border-gold-500/50',
                removendoId === u.id ? 'anim-pop-out' : 'anim-pop',
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-neutral-100">{u.nome}</span>
                  <span className="truncate text-sm text-neutral-500">{u.email}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-neutral-400">
                    {u.passosConcluidos}/{u.totalPassos}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmandoRemover(u)
                    }}
                    className="text-sm text-neutral-500 transition-colors hover:text-red-400"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-navy-700">
                <div
                  className="h-full rounded-full bg-gold-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-navy-700 px-2 py-0.5 text-neutral-400">
                  {u.cargo}
                </span>
                {!u.nivelamentoConcluido && (
                  <span className="rounded-full bg-navy-700 px-2 py-0.5 text-neutral-500">
                    Não nivelou
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t border-navy-700 pt-4">
        <button
          type="button"
          onClick={() => setAdicionando((v) => !v)}
          className="flex items-center gap-1.5 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          <Icon name="add" className="text-base" /> Adicionar supervisionado
          <Icon
            name="expand_more"
            className={cx('text-base transition-transform duration-200', adicionando && 'rotate-180')}
          />
        </button>

        {/* Grid-rows em vez de montar/desmontar na hora (mesma técnica do menu lateral e dos
            accordions) — abrir já animava (`anim-fade`), mas fechar só sumia na hora, sem
            transição nenhuma. O wrapper de fora fica SEMPRE montado, só o conteúdo interno
            colapsa a altura até 0. */}
        <div
          className={cx(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            adicionando ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-2 pt-0.5">
              <input
                value={buscaDisponivel}
                onChange={(e) => setBuscaDisponivel(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-gold-500"
              />
              <ul className="flex flex-col gap-2">
              {disponiveis.length === 0 && (
                <li className="text-sm text-neutral-500">Nenhum colaborador disponível.</li>
              )}
              {disponiveis.length > 0 && disponiveisFiltrados.length === 0 && (
                <li className="text-sm text-neutral-500">Nenhum colaborador encontrado.</li>
              )}
              {disponiveisFiltrados.map((u) => (
                <li
                  key={u.id}
                  className="anim-pop flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-neutral-100">{u.nome}</span>
                    <span className="truncate text-sm text-neutral-500">{u.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adicionar(u.id, u.nome)}
                    className="shrink-0 text-sm text-gold-400 transition-colors hover:text-gold-300"
                  >
                    Adicionar
                  </button>
                </li>
              ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {modalRemover.montado && modalRemover.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalRemover.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoRemover(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalRemover.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Remover supervisionado?</h3>
            <p className="text-sm text-neutral-400">
              "{modalRemover.valor.nome}" deixa de ser supervisionado por você — o progresso dele
              não é apagado, só o vínculo.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoRemover(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRemocao}
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
