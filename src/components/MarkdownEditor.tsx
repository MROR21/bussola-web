import { Markdown } from './Markdown'

// Editor de texto + preview lado a lado — a pegada "editor de documentação" pedida pelo gestor,
// sem virar um WYSIWYG pesado. Reusado pelo admin pra editar Conteudo de passos e fluxos.
export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={16}
        placeholder={'## Título\n\nConteúdo em markdown...'}
        className="rounded-lg border border-navy-600 bg-navy-900 p-3 font-mono text-sm text-neutral-100 outline-none focus:border-gold-500"
      />
      <div className="max-h-[26rem] overflow-y-auto rounded-lg border border-navy-700 bg-navy-800 p-4 leading-relaxed">
        {value.trim() ? (
          <Markdown>{value}</Markdown>
        ) : (
          <p className="text-sm text-neutral-600">Pré-visualização vazia.</p>
        )}
      </div>
    </div>
  )
}
