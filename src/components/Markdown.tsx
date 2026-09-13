import ReactMarkdown from 'react-markdown'
import { cx } from '../utils/cx'

// Render de Markdown com o estilo do app (tema escuro) — tipografia de "artigo": escala de
// títulos completa (h1-h6), separador e bloco de código com moldura própria. Reutilizado por
// passos, fluxos e documentação (ver ConteudoArtigo.tsx).
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="mb-2 mt-3 text-2xl font-bold text-neutral-100 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-1 mt-2 text-lg font-semibold text-neutral-100 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-2 text-base font-semibold text-neutral-100">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-1 mt-2 text-sm font-semibold text-neutral-200">{children}</h4>
        ),
        h5: ({ children }) => (
          <h5 className="mb-1 mt-2 text-sm font-semibold text-neutral-300">{children}</h5>
        ),
        h6: ({ children }) => (
          <h6 className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            {children}
          </h6>
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
        // Fenced code (```...```) chega com `className` tipo "language-xxx"; inline `code` não
        // tem className nenhuma — usa isso pra diferenciar o estilo (pílula vs bloco).
        code: ({ className, children }) =>
          className ? (
            <code className={cx('font-mono text-sm text-neutral-200', className)}>{children}</code>
          ) : (
            <code className="rounded bg-navy-700 px-1.5 py-0.5 text-sm text-gold-300">{children}</code>
          ),
        pre: ({ children }) => (
          <pre className="my-2 overflow-x-auto rounded-xl border border-navy-700 bg-navy-900 p-4">
            {children}
          </pre>
        ),
        hr: () => <hr className="my-4 border-navy-700" />,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-navy-600 pl-3 text-neutral-400">
            {children}
          </blockquote>
        ),
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="my-2 w-full rounded-xl border border-navy-700 shadow-lg shadow-black/20"
          />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
