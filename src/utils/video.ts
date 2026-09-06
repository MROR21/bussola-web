// Converte links comuns de YouTube pro formato /embed; outros (Vimeo, SharePoint, interno) passam
// direto — usado tanto no vídeo de um Fluxo quanto no de um Passo.
export function paraEmbed(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com') && u.searchParams.get('v')) {
      return `https://www.youtube.com/embed/${u.searchParams.get('v')}`
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    return url
  } catch {
    return url
  }
}
