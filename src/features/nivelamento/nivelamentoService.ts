import { apiPost } from '../../services/api'
import type { TrailStep } from '../onboarding/types'
import type { Perfil } from './types'

// Envia o Perfil e recebe os 16 passos com a profundidade recomendada (POST /onboarding/trail).
export function postTrail(perfil: Perfil): Promise<TrailStep[]> {
  return apiPost<TrailStep[]>('/onboarding/trail', perfil)
}
