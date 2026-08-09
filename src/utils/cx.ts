// Junta classes condicionais, ignorando falsy. Ex.: cx('base', ativo && 'ativo').
export const cx = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(' ')
