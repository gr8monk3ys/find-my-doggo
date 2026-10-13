import type { Metadata } from 'next';
import Link from 'next/link';
import MessageForm from '@/components/MessageForm';

export const metadata: Metadata = {
  title: 'Contact us',
  description: 'Questions, suggestions, or a problem with a listing? Send the Find My Doggo team a message.',
};

const FAQS = [
  {
    question: 'How quickly will my report appear?',
    answer: 'Immediately. Your listing is live as soon as you submit it, and shows up in search and on the map.',
  },
  {
    question: 'Is my email address public?',
    answer:
      'No. Messages about your dog are forwarded to you, and your address is never included in any page or API response.',
  },
  {
    question: 'How do I take a listing down?',
    answer:
      'Send us a message with the listing link and the email you reported it with, and we will remove it for you.',
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="label-mono">Contact</p>
          <h1 className="text-page-title mt-3">Get in touch</h1>
          <p className="mt-4 max-w-prose text-muted-foreground">
            Questions, suggestions, or a problem with a listing? Send us a message and we&apos;ll get back to you.
          </p>

          <p className="mt-6 max-w-prose border-l border-border pl-4 text-sm text-muted-foreground">
            Trying to reach the person who reported a specific dog? Open their listing from the{' '}
            <Link href="/dogs" className="ink-underline font-medium text-primary">
              listings page
            </Link>{' '}
            and message them there — it reaches them directly.
          </p>

          <section className="mt-12">
            <p className="label-mono">Common questions</p>
            <h2 className="text-section-title mt-3">Before you write</h2>
            <dl className="mt-6 max-w-prose border-t border-border">
              {FAQS.map((faq) => (
                <div key={faq.question} className="border-b border-border py-5">
                  <dt className="font-medium text-foreground">{faq.question}</dt>
                  <dd className="mt-2 text-muted-foreground">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 lg:self-start">
          <MessageForm
            heading="Send us a message"
            submitLabel="Send message"
            successTitle="Message sent"
            successBody="Thanks for reaching out. We'll reply to the address you gave us."
          />
        </div>
      </div>
    </div>
  );
}
