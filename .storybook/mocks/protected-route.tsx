/**
 * Mock ProtectedRoute for Storybook.
 * Simply renders children without auth checks.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
