import { mockBookings } from "./fixtures";

export function useBookings() {
  return {
    bookings: mockBookings,
    loading: false,
    error: null,
    createBooking: async () => {},
    updateBookingStatus: async () => {},
    refresh: async () => {},
  };
}
