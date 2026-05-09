/**
 * Mock Stripe client for Storybook.
 */
export const getStripe = () => {
  return Promise.resolve({
    redirectToCheckout: async () => ({ error: null }),
  });
};
