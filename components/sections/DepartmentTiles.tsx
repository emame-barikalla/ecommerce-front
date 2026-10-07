import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { DEPARTMENTS, DEPARTMENT_IMAGES } from '@/lib/store/departments';
import { cn } from '@/lib/utils/cn';

/**
 * The two main departments, Women and Men, as large editorial tiles. A
 * department without a photo gets a typographic panel instead of a mismatched
 * stock image.
 */
export default async function DepartmentTiles({ locale, className }: { locale: string; className?: string }) {
  const t = await getTranslations('departments');

  return (
    <div className={cn('grid grid-cols-2 gap-3 md:gap-6', className)}>
      {DEPARTMENTS.map((d) => {
        const image = DEPARTMENT_IMAGES[d];
        return (
          <Link
            key={d}
            href={`/${locale}/catalog?gender=${d}`}
            className={cn(
              'group relative block overflow-hidden rounded-xl aspect-[4/5] md:aspect-[5/4]',
              image ? 'bg-surface-sunken' : 'bg-surface-inverse'
            )}
          >
            {image ? (
              <>
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 45vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-scrim/75 via-scrim/15 to-transparent" />
              </>
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,rgb(var(--brand-rgb)/0.35),transparent_60%),radial-gradient(90%_70%_at_0%_100%,rgb(156_122_69/0.28),transparent_60%)]"
              />
            )}
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-8">
              <p className="text-caption md:text-small text-white/75 mb-1">{t(`${d}.kicker`)}</p>
              <h3 className="t-h2 text-white">{t(`${d}.title`)}</h3>
              <span className="inline-flex items-center gap-1.5 mt-2 md:mt-3 text-small text-white/90">
                {t('shop')}
                <ArrowRight
                  size={14}
                  aria-hidden="true"
                  className="rtl:-scale-x-100 transition-transform duration-200 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
