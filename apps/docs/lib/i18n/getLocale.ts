export const validLocales = ["ko", "en"] as const;
export type Locale = (typeof validLocales)[number];

export const defaultLocale: Locale = "ko";

export function isValidLocale(locale: string): locale is Locale {
  return validLocales.includes(locale as Locale);
}

export function getLocaleFromPath(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }
  
  return defaultLocale;
}

