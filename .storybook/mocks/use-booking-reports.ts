export function useBookingReports() {
  return {
    reports: [],
    pendingCount: 1,
    loading: false,
    error: null,
    refresh: async () => {},
  };
}
