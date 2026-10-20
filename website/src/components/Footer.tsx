import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { FeedbackTrigger } from '@/components/FeedbackDialog';
import { betaLabel, supportEmail } from '@/lib/features';

const SITE_LINKS = [
  { href: '/dogs', label: 'Lost & found dogs' },
  { href: '/report', label: 'Report a dog' },
  { href: '/map', label: 'Map' },
  { href: '/contact', label: 'Contact' },
];

const RESOURCES = [
  { href: 'https://www.aspca.org/pet-care/general-pet-care/lost-pet', label: 'ASPCA: lost pet advice' },
  {
    href: 'https://www.akc.org/expert-advice/lifestyle/what-to-do-if-your-dog-is-lost/',
    label: 'AKC: what to do if your dog is lost',
  },
  { href: 'https://www.petfinder.com/animal-shelters-and-rescues/search/', label: 'Find a local shelter' },
];

const LINK = 'ink-underline label-link text-sm text-foreground transition-colors duration-150 hover:text-primary';

/**
 * The footer: a hairline above, a `1.1fr / 2fr` editorial split, column
 * heads in mono, links in sans with the ink underline, a hairline before the
 * legal line. No fill change — it is the same paper as the page.
 *
 * It also carries the two honest facts about this deployment: the support
 * inbox (an address the owner reads) and the private-beta notice, one quiet
 * mono line with the feedback trigger. Nothing else on the site says "beta".
 */
export default function Footer() {
  const support = supportEmail();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.1fr_2fr] md:gap-16">
          <div>
            <Logo size={20} />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              A community noticeboard for lost and found dogs. Free to use, no account needed.
            </p>
            <h2 className="label-mono mt-8">Support</h2>
            <a href={`mailto:${support}`} className={`${LINK} mt-2`}>
              {support}
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="label-mono">Site</h2>
              <ul className="mt-4 space-y-2">
                {SITE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="label-mono">Resources</h2>
              <ul className="mt-4 space-y-2">
                {RESOURCES.map((resource) => (
                  <li key={resource.href}>
                    <a href={resource.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {resource.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Find My Doggo is open source under the GPL-3.0 licence.{' '}
            <a
              href="https://github.com/gr8monk3ys/find-my-doggo"
              target="_blank"
              rel="noopener noreferrer"
              className="ink-underline text-foreground transition-colors duration-150 hover:text-primary"
            >
              View the source on GitHub
            </a>
            .
          </p>
          <p className="label-mono">
            {betaLabel} · things may break ·{' '}
            {/* `uppercase` is repeated here because the UA stylesheet resets text-transform on buttons. */}
            <FeedbackTrigger className="ink-underline label-link text-foreground uppercase transition-colors duration-150 hover:text-primary">
              tell us
            </FeedbackTrigger>
          </p>
        </div>
      </div>
    </footer>
  );
}
