// frontend/i18n.ts
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'fr', 'ar'];

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const output = { ...target } as Record<string, unknown>;
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = output[key];
    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      output[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
    } else {
      output[key] = sourceVal;
    }
  }
  return output as T;
}

// `requestLocale` replaces the deprecated `locale` argument, which logged a
// warning on every single request.
export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale)) notFound();

  const en = (await import('./messages/en.json')).default;

  if (locale === 'en') {
    return { locale, messages: en };
  }

  const localeMessages = (await import(`./messages/${locale}.json`)).default;
  const messages = deepMerge(en, localeMessages);

  return { locale, messages };
});
