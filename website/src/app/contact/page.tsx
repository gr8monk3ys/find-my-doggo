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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h1 className="text-3xl font-bold mb-4">Get in touch</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Questions, suggestions, or a problem with a listing? Send us a message and we&apos;ll get back to you.
          </p>

          <p className="mb-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 p-4 text-sm text-gray-700 dark:text-gray-300">
            Trying to reach the person who reported a specific dog? Open their listing from the{' '}
            <Link href="/dogs" className="font-medium text-orange-600 hover:text-orange-700 underline">
              listings page
            </Link>{' '}
            and message them there — it reaches them directly.
          </p>

          <h2 className="text-xl font-bold mb-4">Common questions</h2>
          <dl className="space-y-5">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <dt className="font-semibold mb-1">{faq.question}</dt>
                <dd className="text-gray-600 dark:text-gray-400">{faq.answer}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white dark:bg-[#1a1a2e] rounded-xl shadow-lg p-6">
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
