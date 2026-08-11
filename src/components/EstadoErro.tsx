// Estado de erro amigável (sem vazar mensagem técnica tipo "502 ao chamar /fluxos/meus").
// O porquê já aparece no banner de offline; aqui a gente só oferece o retry.
export function EstadoErro({
  mensagem = 'Não consegui carregar agora. Verifique a conexão e tente de novo.',
  onRetry,
}: {
  mensagem?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3 py-16 text-center">
      <span className="text-4xl">🧭</span>
      <p className="max-w-xs text-sm text-neutral-400">{mensagem}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-400"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}
