import { mockTicketBalances } from "./fixtures";

export function useTickets() {
  return {
    balances: mockTicketBalances,
    loading: false,
    error: null,
    refresh: async () => {},
  };
}
