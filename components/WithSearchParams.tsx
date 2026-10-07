'use client';

import { Suspense, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';

type Render = (params: URLSearchParams) => ReactNode;

function Reader({ render }: { render: Render }) {
  return <>{render(new URLSearchParams(useSearchParams().toString()))}</>;
}

const EMPTY = new URLSearchParams();

/**
 * Statically rendered pages cannot read the query string on the server, and
 * Next requires `useSearchParams` to sit under a Suspense boundary. Rendering
 * the same UI with empty params as the fallback keeps it in the static HTML
 * (links stay crawlable, no layout shift); it updates once hydrated.
 */
export default function WithSearchParams({ render }: { render: Render }) {
  return (
    <Suspense fallback={render(EMPTY)}>
      <Reader render={render} />
    </Suspense>
  );
}

/** Same path in another locale, keeping the query string. */
export function localeHref(pathname: string, params: URLSearchParams, nextLocale: string) {
  const segments = pathname.split('/');
  segments[1] = nextLocale;
  const query = params.toString();
  return `${segments.join('/') || `/${nextLocale}`}${query ? `?${query}` : ''}`;
}
