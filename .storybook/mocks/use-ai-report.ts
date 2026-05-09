export function useAiReport() {
  return {
    generating: false,
    generated: false,
    report: null,
    generate: async () => {},
    reset: () => {},
    error: null,
  };
}
