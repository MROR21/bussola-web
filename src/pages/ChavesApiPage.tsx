import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Spinner } from '../components/Spinner'
import { useSaidaValor } from '../hooks/useSaida'
import { useTitulo } from '../hooks/useTitulo'
import { cx } from '../utils/cx'
import { criarApiToken, listarApiTokens, revogarApiToken } from '../features/perfil/perfilService'
import type { ApiToken, ApiTokenCriado } from '../features/perfil/types'

// Gestão de tokens pessoais (Personal Access Token) — chamar o Bússola de fora (curl/scripts) com
// o mesmo acesso do usuário, sem precisar logar. Só gestor chega aqui (gate no back E aqui, ver
// AppLayout.tsx/SessaoAutenticada.tsx) — decisão do Miguel 2026-09-10.
export function ChavesApiPage() {
  useTitulo('Chaves de API')

  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [carregando, setCarregando] = useState(true)
  const [nomeNovoToken, setNomeNovoToken] = useState('')
  const [gerando, setGerando] = useState(false)
  // Só existe entre gerar e a pessoa sair da tela/fechar — o back nunca devolve o valor de novo.
  const [tokenGerado, setTokenGerado] = useState<ApiTokenCriado | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [confirmandoRevogar, setConfirmandoRevogar] = useState<ApiToken | null>(null)
  const [revogandoId, setRevogandoId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const modalRevogar = useSaidaValor(confirmandoRevogar)
  const modalTokenGerado = useSaidaValor(tokenGerado)
  const toastFeedback = useSaidaValor(feedback)

  useEffect(() => {
    listarApiTokens()
      .then(setTokens)
      .catch(() => {
        // silencioso — a lista só não aparece dessa vez, o resto da tela continua usável
      })
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  async function onGerarToken(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeNovoToken.trim()) return
    setGerando(true)
    try {
      const criado = await criarApiToken(nomeNovoToken.trim())
      setTokenGerado(criado)
      setNomeNovoToken('')
      setTokens((t) => [{ id: criado.id, nome: criado.nome, criadoEm: criado.criadoEm, ultimoUsoEm: null }, ...t])
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao gerar o token.', ok: false })
    } finally {
      setGerando(false)
    }
  }

  async function onCopiarToken() {
    if (!tokenGerado) return
    try {
      await navigator.clipboard.writeText(tokenGerado.token)
      setCopiado(true)
    } catch {
      // sem permissão de clipboard — a pessoa ainda pode selecionar o texto na mão
    }
  }

  async function onConfirmarRevogar() {
    if (!confirmandoRevogar) return
    const alvo = confirmandoRevogar
    setConfirmandoRevogar(null)
    setRevogandoId(alvo.id)
    try {
      await revogarApiToken(alvo.id)
      setTokens((t) => t.filter((tok) => tok.id !== alvo.id))
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao revogar o token.', ok: false })
    } finally {
      setRevogandoId(null)
    }
  }

  const inputCls =
    'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500 disabled:opacity-50'
  const cardCls = 'flex flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6'

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-6">
      <CompassRose className="pointer-events-none absolute -bottom-16 -right-12 size-72 text-gold-500 opacity-[0.15]" />
      <MapIllustration className="pointer-events-none absolute -top-6 -left-10 w-56 text-gold-500 opacity-[0.06]" />
      <Link
        to="/configuracoes"
        className="relative flex items-center gap-1 self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
      >
        <Icon name="arrow_back" className="text-base" /> Voltar para Configurações
      </Link>
      <header className="relative flex flex-col gap-1 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="key" className="text-2xl text-gold-400" /> Chaves de API
        </h1>
        <p className="text-sm text-neutral-400">
          Gere tokens de acesso pessoal para autenticar na API do Bússola — em scripts,
          automações ou integrações externas — com o mesmo nível de acesso da sua conta.
        </p>
      </header>

      <section className={cardCls}>
        <form className="flex flex-wrap items-end gap-2" onSubmit={onGerarToken}>
          <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
            <span className="text-neutral-300">Nome</span>
            <input
              value={nomeNovoToken}
              onChange={(e) => setNomeNovoToken(e.target.value)}
              placeholder="Ex.: Integração com o Claude Code"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={!nomeNovoToken.trim() || gerando}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {gerando ? (
              <>
                <Spinner /> Gerando...
              </>
            ) : (
              'Gerar token'
            )}
          </button>
        </form>

        {carregando ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-neutral-500">Nenhum token gerado ainda.</p>
        ) : (
          <ul className="flex max-h-[19rem] flex-col gap-2 overflow-y-auto pr-1">
            {tokens.map((t) => (
              <li
                key={t.id}
                className={cx(
                  'flex items-center justify-between gap-3 rounded-xl border border-navy-700 bg-navy-800 p-3',
                  revogandoId === t.id ? 'anim-pop-out' : 'anim-pop',
                )}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-neutral-100">{t.nome}</span>
                  <span className="text-xs text-neutral-500">
                    Criado em {new Date(t.criadoEm).toLocaleDateString('pt-BR')}
                    {t.ultimoUsoEm
                      ? ` · último uso em ${new Date(t.ultimoUsoEm).toLocaleDateString('pt-BR')}`
                      : ' · nunca usado'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmandoRevogar(t)}
                  className="shrink-0 text-sm text-neutral-500 transition-colors hover:text-red-400"
                >
                  Revogar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modalTokenGerado.montado && modalTokenGerado.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalTokenGerado.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setTokenGerado(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-2 rounded-2xl border border-gold-500/40 bg-navy-800 p-6',
              modalTokenGerado.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="flex items-center gap-1.5 text-sm text-gold-300">
              <Icon name="warning" className="text-base" /> Copie agora — esse valor não aparece
              de novo.
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-xs text-neutral-100">
                {modalTokenGerado.valor.token}
              </code>
              <button
                type="button"
                onClick={onCopiarToken}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-navy-700"
              >
                <Icon name={copiado ? 'check' : 'content_copy'} className="text-base" />
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setTokenGerado(null)}
              className="self-start text-sm text-neutral-400 transition-colors hover:text-neutral-200"
            >
              Já copiei, fechar
            </button>
          </div>
        </div>
      )}

      {modalRevogar.montado && modalRevogar.valor && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalRevogar.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoRevogar(null)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalRevogar.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Revogar token?</h3>
            <p className="text-sm text-neutral-400">
              "{modalRevogar.valor.nome}" para de funcionar imediatamente — quem usava esse token
              perde o acesso.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoRevogar(null)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmarRevogar}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Revogar
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
