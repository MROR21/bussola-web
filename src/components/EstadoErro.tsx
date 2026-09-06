import { PegadasTesouro } from './PegadasTesouro'

// Estado de erro amigável (sem vazar mensagem técnica tipo "502 ao chamar /fluxos/meus").
// O porquê já aparece no banner de offline; aqui a gente só oferece o retry. Mesma animação de
// pegadas até o X do ErrorBoundary (reaproveitada em todo estado de erro de carregamento do app) —
// só o ícone/animação é compartilhado, a mensagem continua própria de cada tela via prop.
export function EstadoErro({
  mensagem = 'Não consegui carregar agora. Verifique a conexão e tente de novo.',
  onRetry,
}: {
  mensagem?: string
  onRetry?: () => void
}) {
  return (
    <div className="anim-fade flex w-full flex-col items-center gap-3 py-16 text-center">
      <PegadasTesouro />
      <p className="max-w-xs text-sm text-neutral-400">{mensagem}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold-400"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
