'use client';

import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { GlobeIcon } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '../../theme/theme-toggle';

const socialLinks = [
  {
    href: 'https://twitter.com/monsoft',
    icon: <TwitterIcon className="h-5 w-5" />,
  },
  {
    href: 'https://www.linkedin.com/company/monsoft',
    icon: <LinkedinIcon className="h-5 w-5" />,
  },
  {
    href: 'https://www.facebook.com/monsoft',
    icon: <FacebookIcon className="h-5 w-5" />,
  },
  {
    href: 'https://www.instagram.com/monsoft',
    icon: <InstagramIcon className="h-5 w-5" />,
  },
  {
    href: 'https://github.com/Monsoft-Solutions/saas-starter',
    icon: <GithubIcon className="h-5 w-5" />,
  },
];

const footerLinks = {
  company: [
    { href: '/about', label: 'About us' },
    { href: '/careers', label: 'Careers' },
    { href: '/security', label: 'Security' },
    { href: '/status', label: 'Status' },
    { href: '/terms', label: 'Terms & privacy' },
    { href: '/rights', label: 'Your privacy rights' },
  ],
  download: [
    { href: '/ios-android', label: 'iOS & Android' },
    { href: '/mac-windows', label: 'Mac & Windows' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/web-clipper', label: 'Web Clipper' },
  ],
  resources: [
    { href: '/help-center', label: 'Help center' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/community', label: 'Community' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/templates', label: 'Templates' },
    { href: '/affiliates', label: 'Affiliates' },
  ],
  notionFor: [
    { href: '/enterprise', label: 'Enterprise' },
    { href: '/small-business', label: 'Small business' },
    { href: '/personal', label: 'Personal' },
  ],
};

export function PublicFooter() {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                ACME
              </span>
            </Link>
            <div className="flex space-x-4">
              {socialLinks.map(({ href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-gray-400 hover:text-gray-500"
                >
                  {icon}
                </Link>
              ))}
            </div>
            <div className="pt-4">
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full justify-start text-left"
            >
              <GlobeIcon className="mr-2 h-4 w-4" />
              English (US)
            </Button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-base hover:text-gray-900 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Download
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.download.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-base hover:text-gray-900 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Resources
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.resources.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-base hover:text-gray-900 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wider uppercase">
              Notion for
            </h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.notionFor.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-base hover:text-gray-900 dark:hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-8">
              <Link
                href="/explore-more"
                className="text-base font-semibold text-gray-900 dark:text-white hover:underline"
              >
                Explore more →
              </Link>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>&copy; {new Date().getFullYear()} Monsoft Labs, Inc.</p>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <Link href="/cookie-settings" className="hover:underline">
              Cookie settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
