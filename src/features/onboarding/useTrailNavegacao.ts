import { useEffect, useState } from 'react'
import { postTrail } from '../nivelamento/nivelamentoService'
import type { Perfil } from '../nivelamento/types'
import type { TrailStep } from './types'

export function hrefDoTrailItem(item: TrailStep): string {
  return item.tipo === 'fluxo'
    ? `/fluxo/${encodeURIComponent(item.title)}`
    : `/passo/${encodeURIComponent(item.title)}`
}

// Anterior/próximo dentro da trilha (Passos + Fluxos do squad, na ordem da Jornada) — pra navegar
// de um passo/fluxo pro seguinte sem precisar voltar pra tela da Fase toda vez. Só existe pra quem
// tem Perfil (colaborador nivelado); gestor abrindo um Fluxo pelo Guia geral não tem trilha
// própria, então fica sem seta (não é erro, só não se aplica).
export function useTrailNavegacao(perfil: Perfil | null, tituloAtual: string) {
  const [trail, setTrail] = useState<TrailStep[]>([])

  useEffect(() => {
    if (!perfil) return
    let cancelado = false
    postTrail(perfil)
      .then((t) => {
        if (!cancelado) setTrail(t)
      })
      .catch(() => {
        // sem trilha (perfil ainda não pronto, ou erro de rede) — as setas só somem, sem tela de erro.
      })
    return () => {
      cancelado = true
    }
  }, [perfil])

  const indice = trail.findIndex((item) => item.title === tituloAtual)
  return {
    anterior: indice > 0 ? trail[indice - 1] : undefined,
    proximo: indice >= 0 && indice < trail.length - 1 ? trail[indice + 1] : undefined,
  }
}
