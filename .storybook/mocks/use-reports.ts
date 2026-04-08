import { mockReports } from "./fixtures";

export function useReports() {
  return {
    reports: mockReports,
    loading: false,
    error: null,
    refresh: async () => {},
  };
}
