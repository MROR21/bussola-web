import { useEffect, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Spinner } from '../components/Spinner'
import { useAuthStore } from '../features/auth/authStore'
import { Avatar } from '../features/perfil/Avatar'
import { lerImagemReduzida } from '../features/perfil/imagem'
import { trocarEmail, trocarFoto, trocarSenha } from '../features/perfil/perfilService'
import type { Cargo, Squad } from '../features/nivelamento/types'

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
  const usuario = useAuthStore((s) => s.usuario)
  const atualizarUsuario = useAuthStore((s) => s.atualizarUsuario)

  const [feedback, setFeedback] = useState<{ texto: string; ok: boolean } | null>(null)
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

  useEffect(() => {
    if (!feedback) return
    const t = setTimeout(() => setFeedback(null), 3000)
    return () => clearTimeout(t)
  }, [feedback])

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

  const emailMudou = email.trim() !== '' && email.trim() !== usuario.email
  const senhaValida =
    senhaAtual !== '' && novaSenha.length >= 6 && novaSenha === confirmar

  const inputCls =
    'rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-neutral-100 outline-none focus:border-gold-500 disabled:opacity-50'
  const salvarCls =
    'flex items-center gap-1.5 self-start rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40'
  const cardCls = 'flex flex-col gap-4 rounded-2xl border border-navy-700 bg-navy-800 p-6'

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-neutral-100">
          <Icon name="settings" className="text-2xl text-gold-400" /> Perfil
        </h1>
        <p className="text-sm text-neutral-400">Sua conta, foto e senha.</p>
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
              onClick={onRemoverFoto}
              disabled={salvandoFoto}
              className="self-start rounded-lg px-4 py-2 text-sm text-neutral-300 hover:bg-navy-700 disabled:opacity-40"
            >
              Remover
            </button>
          )}
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
          <span className="text-xs text-red-400">As senhas não conferem.</span>
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
