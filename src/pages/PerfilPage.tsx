import { useEffect, useRef, useState } from 'react'
import { CompassRose } from '../components/CompassRose'
import { Icon } from '../components/Icon'
import { MapCorners } from '../components/MapCorners'
import { MapIllustration } from '../components/MapIllustration'
import { Spinner } from '../components/Spinner'
import { useSaida, useSaidaValor } from '../hooks/useSaida'
import { cx } from '../utils/cx'
import { useAuthStore } from '../features/auth/authStore'
import { useTitulo } from '../hooks/useTitulo'
import { Avatar } from '../features/perfil/Avatar'
import { lerImagemReduzida } from '../features/perfil/imagem'
import {
  criarApiToken,
  listarApiTokens,
  revogarApiToken,
  trocarEmail,
  trocarFoto,
  trocarSenha,
} from '../features/perfil/perfilService'
import type { ApiToken, ApiTokenCriado } from '../features/perfil/types'
import type { Cargo, Squad } from '../features/nivelamento/types'
import { useTemaStore, type Tema } from '../features/tema/temaStore'

const SQUAD_LABEL: Record<Squad, string> = {
  MaoDeObra: 'Mão de Obra',
  QuizQuality: 'Quiz Quality',
  Agilean: 'Agilean (desktop)',
}
const CARGO_LABEL: Record<Cargo, string> = {
  Estagiario: 'Estagiário',
  Junior: 'Júnior',
  Pleno: 'Pleno',
}

export function PerfilPage() {
  useTitulo('Configurações')
  const usuario = useAuthStore((s) => s.usuario)
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario)
  const tema = useTemaStore((s) => s.tema)
  const definirTema = useTemaStore((s) => s.definir)

  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
  const toastFeedback = useSaidaValor(feedback)
  const fileRef = useRef<HTMLInputElement>(null)

  // Formulário de e-mail.
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [salvandoEmail, setSalvandoEmail] = useState(false)

  // Formulário de senha.
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  const [salvandoFoto, setSalvandoFoto] = useState(false)
  const [confirmandoRemover, setConfirmandoRemover] = useState(false)
  const modalRemover = useSaida(confirmandoRemover)

  // Tokens de API (chamar o Bússola de fora, sem logar — mesmo acesso do usuário).
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [carregandoTokens, setCarregandoTokens] = useState(true)
  const [nomeNovoToken, setNomeNovoToken] = useState('')
  const [gerandoToken, setGerandoToken] = useState(false)
  // Só existe entre gerar e a pessoa sair da tela/fechar — o back nunca devolve o valor de novo.
  const [tokenGerado, setTokenGerado] = useState<ApiTokenCriado | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [confirmandoRevogar, setConfirmandoRevogar] = useState<ApiToken | null>(null)
  const [revogandoId, setRevogandoId] = useState<string | null>(null)
  const modalRevogar = useSaidaValor(confirmandoRevogar)

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

  useEffect(() => {
    listarApiTokens()
      .then(setTokens)
      .catch(() => {
        // silencioso — a lista só não aparece dessa vez, o resto da tela continua usável
      })
      .finally(() => setCarregandoTokens(false))
  }, [])

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  if (!usuario) return null

  async function onEscolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // permite reescolher o mesmo arquivo depois
    if (!file) return
    setSalvandoFoto(true)
    try {
      const foto = await lerImagemReduzida(file)
      await trocarFoto(foto)
      atualizarUsuario({ foto })
      setFeedback({ texto: 'Foto atualizada.', ok: true })
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao trocar a foto.', ok: false })
    } finally {
      setSalvandoFoto(false)
    }
  }

  async function onRemoverFoto() {
    setConfirmandoRemover(false)
    setSalvandoFoto(true)
    try {
      await trocarFoto('')
      atualizarUsuario({ foto: '' })
      setFeedback({ texto: 'Foto removida.', ok: true })
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao remover a foto.', ok: false })
    } finally {
      setSalvandoFoto(false)
    }
  }

  async function onSalvarEmail(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoEmail(true)
    try {
      const novo = email.trim()
      await trocarEmail(novo)
      atualizarUsuario({ email: novo })
      setFeedback({ texto: 'E-mail atualizado.', ok: true })
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao trocar o e-mail.', ok: false })
    } finally {
      setSalvandoEmail(false)
    }
  }

  async function onSalvarSenha(e: React.FormEvent) {
    e.preventDefault()
    setSalvandoSenha(true)
    try {
      await trocarSenha(senhaAtual, novaSenha)
      setSenhaAtual('')
      setNovaSenha('')
      setConfirmar('')
      setFeedback({ texto: 'Senha atualizada.', ok: true })
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao trocar a senha.', ok: false })
    } finally {
      setSalvandoSenha(false)
    }
  }

  async function onGerarToken(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeNovoToken.trim()) return
    setGerandoToken(true)
    try {
      const criado = await criarApiToken(nomeNovoToken.trim())
      setTokenGerado(criado)
      setNomeNovoToken('')
      setTokens((t) => [{ id: criado.id, nome: criado.nome, criadoEm: criado.criadoEm, ultimoUsoEm: null }, ...t])
    } catch (err) {
      setFeedback({ texto: err instanceof Error ? err.message : 'Erro ao gerar o token.', ok: false })
    } finally {
      setGerandoToken(false)
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

  const emailMudou = email.trim() !== '' && email.trim() !== usuario.email
  const senhaValida =
    senhaAtual !== '' && novaSenha.length >= 6 && novaSenha === confirmar

  const inputCls =
    'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none transition-colors focus:border-gold-500 disabled:opacity-50'
  const salvarCls =
    'flex items-center gap-1.5 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40'
  const cardCls = 'flex flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6'

  return (
    <div className="relative flex w-full max-w-2xl flex-col gap-6">
      <CompassRose className="pointer-events-none absolute -bottom-16 -right-12 size-72 text-gold-500 opacity-[0.06]" />
      <MapIllustration className="pointer-events-none absolute -top-6 -left-10 w-56 text-gold-500 opacity-[0.06]" />
      <header className="relative flex flex-col gap-1 self-start p-5">
        <MapCorners tamanho={5} opacidade={25} />
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="settings" className="text-2xl text-gold-400" /> Configurações
        </h1>
        <p className="text-sm text-neutral-400">Sua conta, foto, senha e tokens de API.</p>
      </header>

      {/* Cartão de identidade + foto */}
      <section className={cardCls}>
        <div className="flex items-center gap-4">
          <Avatar nome={usuario.nome} foto={usuario.foto} className="size-20 text-2xl" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-lg font-semibold text-neutral-100">{usuario.nome}</span>
            <span className="truncate text-sm text-neutral-400">{usuario.email}</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-300">
                {SQUAD_LABEL[usuario.squad] ?? usuario.squad}
              </span>
              <span className="rounded-full bg-navy-700 px-2 py-0.5 text-xs text-neutral-300">
                {CARGO_LABEL[usuario.cargo] ?? usuario.cargo}
              </span>
              {usuario.isGestor && (
                <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs text-gold-300">
                  Gestor
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onEscolherFoto}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={salvandoFoto}
            className={salvarCls}
          >
            {usuario.foto ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {usuario.foto && (
            <button
              type="button"
              onClick={() => setConfirmandoRemover(true)}
              disabled={salvandoFoto}
              className="anim-fade self-start rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700 disabled:opacity-40"
            >
              Remover
            </button>
          )}
        </div>
      </section>

      {modalRemover.montado && (
        <div
          className={cx(
            'fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4',
            modalRemover.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
          onClick={() => setConfirmandoRemover(false)}
        >
          <div
            className={cx(
              'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6',
              modalRemover.saindo ? 'anim-pop-out' : 'anim-pop',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-100">Remover foto?</h3>
            <p className="text-sm text-neutral-400">
              Tem certeza que deseja remover sua foto de perfil?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoRemover(false)}
                className="rounded-lg px-4 py-2 text-sm text-neutral-300 transition-colors hover:bg-navy-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onRemoverFoto}
                className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aparência */}
      <section className={cardCls}>
        <h2 className="text-base font-semibold text-neutral-100">Aparência</h2>
        <div className="flex gap-2">
          {(['dark', 'light'] as Tema[]).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => definirTema(opcao)}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
                tema === opcao
                  ? 'bg-gold-500/20 text-gold-300'
                  : 'text-neutral-400 hover:text-neutral-200',
              )}
            >
              <Icon name={opcao === 'dark' ? 'dark_mode' : 'light_mode'} className="text-base" />
              {opcao === 'dark' ? 'Escuro' : 'Claro'}
            </button>
          ))}
        </div>
      </section>

      {/* Trocar e-mail */}
      <form className={cardCls} onSubmit={onSalvarEmail}>
        <h2 className="text-base font-semibold text-neutral-100">E-mail</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu.email@agilean.com.br"
          className={inputCls}
        />
        <button type="submit" disabled={!emailMudou || salvandoEmail} className={salvarCls}>
          {salvandoEmail ? (
            <>
              <Spinner /> Salvando...
            </>
          ) : (
            'Salvar e-mail'
          )}
        </button>
      </form>

      {/* Trocar senha */}
      <form className={cardCls} onSubmit={onSalvarSenha}>
        <h2 className="text-base font-semibold text-neutral-100">Senha</h2>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="Senha atual"
          autoComplete="current-password"
          className={inputCls}
        />
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Nova senha (mín. 6 caracteres)"
          autoComplete="new-password"
          className={inputCls}
        />
        <input
          type="password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          placeholder="Confirmar nova senha"
          autoComplete="new-password"
          className={inputCls}
        />
        {confirmar !== '' && novaSenha !== confirmar && (
          <span className="anim-fade text-xs text-red-400">As senhas não conferem.</span>
        )}
        <button type="submit" disabled={!senhaValida || salvandoSenha} className={salvarCls}>
          {salvandoSenha ? (
            <>
              <Spinner /> Salvando...
            </>
          ) : (
            'Trocar senha'
          )}
        </button>
      </form>

      {/* Tokens de API */}
      <section className={cardCls}>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-neutral-100">Tokens de API</h2>
          <p className="text-sm text-neutral-400">
            Chame o Bússola de fora (scripts, automações) com um token no lugar da sua senha —
            mesmo acesso que você já tem logado.
          </p>
        </div>

        {tokenGerado && (
          <div className="anim-pop flex flex-col gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4">
            <p className="flex items-center gap-1.5 text-sm text-gold-300">
              <Icon name="warning" className="text-base" /> Copie agora — esse valor não aparece
              de novo.
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-xs text-neutral-100">
                {tokenGerado.token}
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
        )}

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={onGerarToken}
        >
          <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
            <span className="text-neutral-300">Nome</span>
            <input
              value={nomeNovoToken}
              onChange={(e) => setNomeNovoToken(e.target.value)}
              placeholder="Ex.: Claude Code"
              className={inputCls}
            />
          </label>
          <button
            type="submit"
            disabled={!nomeNovoToken.trim() || gerandoToken}
            className={cx(salvarCls, 'mb-0')}
          >
            {gerandoToken ? (
              <>
                <Spinner /> Gerando...
              </>
            ) : (
              'Gerar token'
            )}
          </button>
        </form>

        {carregandoTokens ? (
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
