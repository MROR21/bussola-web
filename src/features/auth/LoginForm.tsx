import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Spinner } from '../../components/Spinner'
import { useSaidaValor } from '../../hooks/useSaida'
import { useTitulo } from '../../hooks/useTitulo'
import { ApiError } from '../../services/api'
import { cx } from '../../utils/cx'
import { confirmarEmail, login, loginComMicrosoft, register, reenviarCodigo } from './authService'
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
// "Entrar com Microsoft" (workspace da própria Agilean), que serve pros dois: get-or-create sem
// senha. O modo mora na URL (/login ou /cadastro), não em state — dá pra voltar/compartilhar o
// link de cadastro direto, igual o resto do app já faz com fase/módulo/passo/fluxo por nome.
export function LoginForm() {
  const entrar = useAuthStore((state) => state.login)
  const location = useLocation()
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [senhaComFoco, setSenhaComFoco] = useState(false)
  const [loading, setLoading] = useState(false)
  const [carregandoMicrosoft, setCarregandoMicrosoft] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Não-nulo = trocou a tela de login/cadastro pela de "digite o código" (ver bloco de confirmação
  // mais abaixo). Guarda o e-mail já validado (veio do cadastro, ou do próprio campo no login) pra
  // não precisar pedir de novo.
  const [emailPendente, setEmailPendente] = useState<string | null>(null)
  const [codigo, setCodigo] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [codigoReenviado, setCodigoReenviado] = useState(false)

  // Mensagem de um logout FORÇADO (sessão expirada, acesso revogado) — captura o valor uma vez na
  // montagem (o `persist` do authStore já reidratou síncrono do localStorage antes disso) e limpa
  // no mesmo instante, senão ficaria persistido e reapareceria numa visita futura sem relação
  // nenhuma com o motivo original.
  const [mensagemSaida, setMensagemSaida] = useState(() => useAuthStore.getState().motivoSaida)
  useEffect(() => {
    useAuthStore.getState().limparMotivoSaida()
  }, [])
  // Some sozinho depois de um tempo — um aviso de sessão expirada ficando preso na tela pra
  // sempre (até a pessoa entrar de novo) incomoda mais do que ajuda depois dos primeiros segundos.
  useEffect(() => {
    if (!mensagemSaida) return
    const t = setTimeout(() => setMensagemSaida(null), 8000)
    return () => clearTimeout(t)
  }, [mensagemSaida])
  const toastSaida = useSaidaValor(mensagemSaida)

  useEffect(() => {
    if (!codigoReenviado) return
    const t = setTimeout(() => setCodigoReenviado(false), 4000)
    return () => clearTimeout(t)
  }, [codigoReenviado])

  const ehCadastro = location.pathname === '/cadastro'
  useTitulo(ehCadastro ? 'Criar conta' : 'Entrar')
  const senhaTemMinimo = senha.length >= 6

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      if (ehCadastro) {
        const resposta = await register(nome.trim(), email.trim(), senha)
        setEmailPendente(resposta.email)
      } else {
        const resposta = await login(email.trim(), senha)
        entrar(resposta.usuario, resposta.token)
      }
    } catch (e) {
      // Senha certa mas e-mail sem confirmar (só acontece no login — cadastro sempre cai aqui em
      // cima) — manda direto pra tela de código em vez de só mostrar o erro.
      if (e instanceof ApiError && e.corpo?.precisaConfirmarEmail) {
        setEmailPendente(email.trim())
        return
      }
      setError(e instanceof Error ? e.message : 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarCodigo() {
    if (!emailPendente) return
    setConfirmando(true)
    setError(null)
    try {
      const resposta = await confirmarEmail(emailPendente, codigo)
      entrar(resposta.usuario, resposta.token)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao confirmar')
    } finally {
      setConfirmando(false)
    }
  }

  async function handleReenviarCodigo() {
    if (!emailPendente) return
    setReenviando(true)
    setError(null)
    setCodigoReenviado(false)
    try {
      await reenviarCodigo(emailPendente)
      setCodigoReenviado(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao reenviar')
    } finally {
      setReenviando(false)
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
    navigate(ehCadastro ? '/login' : '/cadastro')
    setError(null)
    setEmailPendente(null)
  }

  if (emailPendente) {
    return (
      <div key="confirmar-email" className="anim-page flex flex-col gap-6">
        <div className="anim-fade flex flex-col gap-1">
          <h2 className="flex items-center gap-1.5 text-xl font-semibold">
            Confirme seu e-mail <Icon name="mark_email_read" className="text-xl text-gold-400" />
          </h2>
          <p className="text-sm text-neutral-400">
            Mandamos um código de 6 dígitos para{' '}
            <span className="text-neutral-200">{emailPendente}</span>.
          </p>
        </div>

        {error && <p className="anim-fade text-sm text-red-400">{error}</p>}
        {codigoReenviado && <p className="anim-fade text-sm text-green-400">Código reenviado.</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleConfirmarCodigo()
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-neutral-300">Código</span>
            <input
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-center text-lg tracking-[0.5em] text-neutral-100 outline-none transition-colors focus:border-gold-500"
            />
          </label>

          <button
            type="submit"
            disabled={confirmando || codigo.length !== 6}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmando ? (
              <>
                <Spinner /> Confirmando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={handleReenviarCodigo}
          disabled={reenviando}
          className="text-sm text-gold-400 transition-colors hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reenviando ? 'Enviando...' : 'Reenviar código'}
        </button>

        <button
          type="button"
          onClick={() => {
            setEmailPendente(null)
            setError(null)
            setCodigo('')
          }}
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <form
      key={ehCadastro ? 'cadastro' : 'login'}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit()
      }}
      className="anim-page flex flex-col gap-6"
    >
      <div key={ehCadastro ? 'cadastro' : 'login'} className="anim-fade flex flex-col gap-1">
        <h2 className="flex items-center gap-1.5 text-xl font-semibold">
          {ehCadastro ? (
            'Criar conta'
          ) : (
            <>
              Bem-vindo(a) <Icon name="waving_hand" className="text-xl text-gold-400" />
            </>
          )}
        </h2>
        <p className="text-sm text-neutral-400">
          {ehCadastro ? 'Crie sua conta para começar.' : 'Entre para continuar sua jornada.'}
        </p>
      </div>

      {toastSaida.montado && toastSaida.valor && (
        <p
          className={cx(
            'flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300',
            toastSaida.saindo ? 'anim-fade-out' : 'anim-fade',
          )}
        >
          <Icon name="warning" className="shrink-0 text-base" /> {toastSaida.valor}
        </p>
      )}

      {ehCadastro && (
        <label className="anim-fade flex flex-col gap-1.5 text-sm">
          <span className="text-neutral-300">Nome</span>
          <input
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors focus:border-gold-500"
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
          className="rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors focus:border-gold-500"
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
          onFocus={() => setSenhaComFoco(true)}
          onBlur={() => setSenhaComFoco(false)}
          placeholder={ehCadastro ? 'Crie uma senha' : '••••••••'}
          className="bussola-senha-input w-full rounded-lg border border-navy-600 bg-navy-900 px-3.5 py-2.5 text-neutral-100 outline-none transition-colors focus:border-gold-500"
        />
        {ehCadastro && senhaComFoco && (
          <span
            className={cx(
              'anim-fade flex items-center gap-1.5 text-xs transition-colors',
              senhaTemMinimo ? 'text-green-400' : 'text-red-400',
            )}
          >
            <Icon name={senhaTemMinimo ? 'check_circle' : 'cancel'} size={16} fill />
            Ao menos 6 caracteres
          </span>
        )}
      </label>

      {error && <p className="anim-fade text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="h-px flex-1 bg-navy-700" aria-hidden="true" />
            ou
            <div className="h-px flex-1 bg-navy-700" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={handleMicrosoft}
            disabled={carregandoMicrosoft}
            className="flex items-center justify-center gap-2 rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-sm font-medium text-neutral-100 transition-all hover:border-navy-500 hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
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

      <button type="button" onClick={trocarModo} className="text-sm text-gold-400">
        {ehCadastro ? (
          <>
            Já tem conta?{' '}
            <span className="text-gold-500 transition-colors hover:text-gold-300">Entrar</span>
          </>
        ) : (
          <>
            Não tem conta?{' '}
            <span className="text-gold-500 transition-colors hover:text-gold-300">Criar conta</span>
          </>
        )}
      </button>
    </form>
  )
}
