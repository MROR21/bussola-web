import { useMemo, useState } from 'react'
import { dividirEmSlides } from '../utils/slides'
import { cx } from '../utils/cx'
import { Icon } from './Icon'
import { Markdown } from './Markdown'

// Mostra o Conteudo de um Passo/Fluxo/Documentação. Conteúdo com várias seções `##` (a convenção
// que a Ambientação já segue, uma por slide da apresentação original) PODE abrir em modo slide —
// apresentação de verdade, uma seção por vez — mas começa no modo artigo (leitura corrida) por
// padrão; quem quiser navegar seção a seção troca com "Visualizar em modo slide", e volta pra
// leitura corrida com "Visualizar em modo blog". Conteúdo sem múltiplas
// seções (a maioria dos Fluxos, e 2 dos 7 passos da Ambientação) não tem o que paginar — vira só
// um artigo solto, sem caixa nenhuma, sem opção de slide pra escolher.
export function ConteudoArtigo({ conteudo }: { conteudo: string }) {
  const slides = useMemo(() => dividirEmSlides(conteudo), [conteudo])
  const [modoSlide, setModoSlide] = useState(false)
  const [indice, setIndice] = useState(0)

  if (slides.length <= 1) {
    return (
      <article className="leading-relaxed">
        <Markdown>{conteudo}</Markdown>
      </article>
    )
  }

  if (!modoSlide) {
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setModoSlide(true)}
          className="flex items-center gap-1 self-start text-xs text-gold-400 transition-colors hover:text-gold-300"
        >
          <Icon name="view_carousel" className="text-sm" /> Visualizar em modo slide
        </button>
        <article className="leading-relaxed">
          <Markdown>{conteudo}</Markdown>
        </article>
      </div>
    )
  }

  const indiceSeguro = Math.min(indice, slides.length - 1)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setModoSlide(false)}
          className="flex items-center gap-1 text-xs text-gold-400 transition-colors hover:text-gold-300"
        >
          <Icon name="notes" className="text-sm" /> Visualizar em modo blog
        </button>
        <span className="text-xs text-neutral-500">
          {indiceSeguro + 1} de {slides.length}
        </span>
      </div>

      <div
        key={indiceSeguro}
        className="anim-fade min-h-[16rem] rounded-2xl border border-navy-700 bg-navy-800 p-6 leading-relaxed"
      >
        <Markdown>{slides[indiceSeguro]}</Markdown>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setIndice((i) => Math.max(0, i - 1))}
          disabled={indiceSeguro === 0}
          aria-label="Slide anterior"
          className="flex size-9 items-center justify-center rounded-lg border border-navy-600 text-neutral-400 transition-colors hover:border-gold-500/50 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="chevron_left" />
        </button>
        {slides.length <= 10 && (
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                className={cx(
                  'size-1.5 rounded-full transition-colors',
                  i === indiceSeguro ? 'bg-gold-400' : 'bg-navy-600 hover:bg-navy-500',
                )}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setIndice((i) => Math.min(slides.length - 1, i + 1))}
          disabled={indiceSeguro === slides.length - 1}
          aria-label="Próximo slide"
          className="flex size-9 items-center justify-center rounded-lg border border-navy-600 text-neutral-400 transition-colors hover:border-gold-500/50 hover:text-gold-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="chevron_right" />
        </button>
      </div>
    </div>
  )
}
