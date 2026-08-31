import { useEffect, useState } from 'react'

// Mantém um modal/toast montado por mais `duracaoMs` depois que `visivel` vira false, pra dar
// tempo de uma animação de saída (`anim-fade-out`/`anim-pop-out`) rodar antes do unmount de
// verdade — sem isso, todo modal/toast do app só sabia entrar animado (some na hora ao fechar).
// Uso: `const { montado, saindo } = useSaida(aberto)`, renderiza enquanto `montado`, escolhe a
// classe de entrada ou saída por `saindo`.
export function useSaida(visivel: boolean, duracaoMs = 150) {
  const [montado, setMontado] = useState(visivel)

  useEffect(() => {
    if (visivel) {
      setMontado(true)
      return
    }
    const t = setTimeout(() => setMontado(false), duracaoMs)
    return () => clearTimeout(t)
  }, [visivel, duracaoMs])

  return { montado, saindo: montado && !visivel }
}

// Variante pra quando a própria condição carrega o dado que o modal/toast mostra (o item sendo
// editado/apagado, o texto do toast) — sem isso, no instante em que a saída começa a animar o
// dado já virou null e o conteúdo sumiria/quebraria antes da animação terminar. Guarda o último
// valor não-nulo e só troca quando um novo valor chega.
export function useSaidaValor<T>(valor: T | null, duracaoMs = 150) {
  const [ultimo, setUltimo] = useState<T | null>(valor)
  useEffect(() => {
    if (valor !== null) setUltimo(valor)
  }, [valor])
  const { montado, saindo } = useSaida(valor !== null, duracaoMs)
  return { valor: ultimo, montado, saindo }
}
