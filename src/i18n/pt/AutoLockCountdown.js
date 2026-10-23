// Textos de src/components/AutoLockCountdown.svelte.
export default {
  changeAutoLock: 'Bloqueio automático: altere nas Definições',
  locksIn: (time) => `Bloqueia automaticamente daqui a ${time}. Clique para alterar nas Definições.`,
  lockedReason: (minutes) => `Bloqueado após ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} sem atividade.`,
};
