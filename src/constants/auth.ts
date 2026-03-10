import { match } from "ts-pattern";

const PUBLIC_PATHS = ["/"] as const;
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images"] as const;

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);
