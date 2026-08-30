import ReactMarkdown from 'react-markdown'

// Render de Markdown com o estilo do app (tema escuro). Reutilizado por passos e fluxos.
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="mb-1 mt-2 text-lg font-semibold text-neutral-100">{children}</h2>
        ),
        p: ({ children }) => <p className="text-neutral-300">{children}</p>,
        ul: ({ children }) => (
          <ul className="ml-5 list-disc space-y-1 text-neutral-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="ml-5 list-decimal space-y-1 text-neutral-300">{children}</ol>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-gold-400 transition-colors hover:text-gold-300">
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-navy-700 px-1.5 py-0.5 text-sm text-gold-300">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-navy-600 pl-3 text-neutral-400">
            {children}
          </blockquote>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
