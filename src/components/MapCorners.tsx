// Cantos de moldura tipo mapa antigo — mesmo ornamento do cartão de login, reaproveitado em
// qualquer container `relative`. `tamanho` e `opacidade` deixam ajustar a presença por tela (uma
// tela de trabalho densa pede mais discrição que a home/hero).
export function MapCorners({
  tamanho = 7,
  opacidade = 40,
}: {
  tamanho?: number
  opacidade?: number
}) {
  const base = 'pointer-events-none absolute border-gold-500'
  const estilo = { width: `${tamanho * 4}px`, height: `${tamanho * 4}px`, opacity: opacidade / 100 }

  return (
    <>
      <span className={`${base} left-3 top-3 rounded-tl-lg border-l-2 border-t-2`} style={estilo} />
      <span className={`${base} right-3 top-3 rounded-tr-lg border-r-2 border-t-2`} style={estilo} />
      <span className={`${base} bottom-3 left-3 rounded-bl-lg border-b-2 border-l-2`} style={estilo} />
      <span className={`${base} bottom-3 right-3 rounded-br-lg border-b-2 border-r-2`} style={estilo} />
    </>
  )
}
