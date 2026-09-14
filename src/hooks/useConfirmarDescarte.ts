import { useState } from 'react'

// Clique fora de um modal de edição fechava direto, mesmo com campos já alterados — perdia o que
// a pessoa tinha digitado sem avisar nada. Esse hook decide: se `sujo` (algo mudou desde que o
// modal abriu), pede confirmação antes de fechar de verdade; se não, fecha direto (comportamento
// de sempre). Quem usa passa `sujo` (um estado local que vira `true` no onChange de qualquer
// campo, resetado pra `false` ao abrir o modal) e a função que fecha o modal de fato.
export function useConfirmarDescarte(sujo: boolean, fechar: () => void) {
  const [confirmando, setConfirmando] = useState(false)

  function aoTentarFechar() {
    if (sujo) setConfirmando(true)
    else fechar()
  }
  function confirmarDescarte() {
    setConfirmando(false)
    fechar()
  }
  function cancelarDescarte() {
    setConfirmando(false)
  }

  return { confirmando, aoTentarFechar, confirmarDescarte, cancelarDescarte }
}
