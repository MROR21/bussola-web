// Lê um arquivo de imagem e devolve um data URI JPEG reduzido (lado máximo `max`px).
// Reduzir no cliente mantém o base64 pequeno pro banco e pro tráfego.
export async function lerImagemReduzida(file: File, max = 256): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Escolha um arquivo de imagem.')
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Não consegui ler o arquivo.'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Arquivo de imagem inválido.'))
    el.src = dataUrl
  })

  const escala = Math.min(1, max / Math.max(img.width, img.height))
  const largura = Math.max(1, Math.round(img.width * escala))
  const altura = Math.max(1, Math.round(img.height * escala))

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não consegui processar a imagem.')
  ctx.drawImage(img, 0, 0, largura, altura)

  return canvas.toDataURL('image/jpeg', 0.85)
}
