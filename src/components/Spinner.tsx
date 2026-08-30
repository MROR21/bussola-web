// Anel giratório (CSS puro) — usado em toda tela/botão que hoje só mostrava "Carregando..." parado.
export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-hidden="true"
    />
  )
}

// Estado de carregamento de página inteira: spinner + texto, no lugar do `<p>` estático de antes.
export function Carregando({ texto }: { texto: string }) {
  return (
    <p className="flex items-center gap-2 text-neutral-400">
      <Spinner />
      {texto}
    </p>
  )
}
