import { apiGet } from '../../services/api'
import type { Squad } from './types'

// Lista pública (qualquer usuário logado) — usada pelo picker de squad no nivelamento, que roda
// antes da pessoa ter qualquer papel de admin.
export const listarSquads = () => apiGet<Squad[]>('/squads')
