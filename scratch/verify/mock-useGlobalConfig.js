// Mock SOLO para verificación local (no toca Firebase)
export function useGlobalConfig() {
  return {
    config: {
      cicloEscolarActual: '2026-2027',
      leyendaOficial: '"2026, Año de Margarita Maza"',
      inscripcionesAbiertas: true,
    },
    loading: false,
    updateConfig: async () => true,
  };
}
