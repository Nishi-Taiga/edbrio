/**
 * Mock next-intl navigation for Storybook.
 */
import NextLink from "next/link";

export const Link = NextLink;

export function useRouter() {
  return {
    push: () => {},
    replace: () => {},
    back: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  return "/teacher/dashboard";
}

export function redirect(path: string) {
  return path;
}
