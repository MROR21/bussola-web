// "há 2 horas", "há 3 dias" etc. — sem lib de data, é só aritmética simples em cima de Date.
export function tempoRelativo(dataIso: string): string {
  const diffSeg = Math.round((Date.now() - new Date(dataIso).getTime()) / 1000)
  if (diffSeg < 60) return 'agora mesmo'

  const diffMin = Math.round(diffSeg / 60)
  if (diffMin < 60) return `há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`

  const diffHoras = Math.round(diffMin / 60)
  if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`

  const diffDias = Math.round(diffHoras / 24)
  if (diffDias < 30) return `há ${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`

  const diffMeses = Math.round(diffDias / 30)
  if (diffMeses < 12) return `há ${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`

  const diffAnos = Math.round(diffMeses / 12)
  return `há ${diffAnos} ${diffAnos === 1 ? 'ano' : 'anos'}`
}
