import type React from 'react';
import type { Metadata } from 'next';
import { MIN_AGE_YEARS, GROUP_DEFAULTS } from '@tayfa/shared/constants';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Tayfa.',
};

const EFFECTIVE = '28 June 2026';

export default function TermsPage(): React.JSX.Element {
  return (
    <>
      <h1>Terms of Service</h1>
      <p>
        <strong>Last updated: {EFFECTIVE}.</strong> These Terms of Service ("Terms") form a binding
        agreement between you and Tayfa ("Tayfa", "we", "us") governing your use of the Tayfa
        application and website (the "Service"). By creating an account or using the Service, you
        agree to these Terms and to our <a href="/privacy">Privacy Policy</a>. If you do not agree,
        do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least {MIN_AGE_YEARS} years old to use Tayfa and you must complete our age
        and identity checks where required. The Service is for building friendships and joining
        real-life, small-group activities. Tayfa is <strong>not a dating service</strong>, and using
        it to solicit romantic or sexual encounters is prohibited.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for the accuracy of your profile and for activity on your account. Do
        not impersonate others, create accounts to evade a ban, or share your account. We may
        require phone verification, and identity + liveness verification to host events or send
        direct messages. Verification is provided free of charge.
      </p>

      <h2>3. Community rules</h2>
      <p>To keep Tayfa safe and welcoming, you agree not to:</p>
      <ul>
        <li>harass, threaten, stalk, or endanger anyone;</li>
        <li>
          post content that is unlawful, hateful, sexually explicit, or that sexualizes minors;
        </li>
        <li>solicit money, run scams, or share payment details such as IBANs to defraud others;</li>
        <li>share another person's private information ("doxxing");</li>
        <li>use the Service for dating, sex work, or commercial promotion without permission;</li>
        <li>
          create 1:1-only meetups designed to circumvent our group format (events require a minimum
          group size of {GROUP_DEFAULTS.minCapacity}); or
        </li>
        <li>
          attempt to spoof your location, game attendance, or otherwise manipulate the platform.
        </li>
      </ul>

      <h2>4. Events and meeting in person</h2>
      <p>
        Tayfa helps you find groups, but you decide whether to attend and you do so at your own
        discretion and risk. We provide safety tooling — verification, neighborhood-only location
        until just before an event, check-ins, ratings, blocking, reporting, and a safety center —
        but we do not screen or supervise any meetup, and we are not responsible for the conduct of
        other users. Meet in public, tell someone your plans, and use the in-app safety features.
      </p>

      <h2>5. Hosting</h2>
      <p>
        Hosts must comply with these Terms and all applicable laws, must keep group sizes within the
        platform limits, and may not charge attendees through the Service except where we expressly
        enable it. Hosts are responsible for the accuracy of their event details.
      </p>

      <h2>6. Trust &amp; safety enforcement</h2>
      <p>
        We operate a 24/7 trust &amp; safety process and respond to reports according to
        severity-based service levels. We may warn, remove content, suspend, or ban accounts that
        violate these Terms, and we may preserve records as evidence. You can appeal an enforcement
        decision. Safety features — blocking, reporting, verification, and the safety center — are
        always free.
      </p>

      <h2>7. Subscriptions (Tayfa+)</h2>
      <p>
        Tayfa's core experience is free. Optional Tayfa+ subscriptions unlock convenience features
        and are billed through your app store or our billing partner. Subscriptions renew
        automatically until cancelled; manage or cancel in your app-store account. Safety features
        are never placed behind a paywall. Prices are shown in the app and may vary by region;
        statutory withdrawal and refund rights apply where required by law.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        Tayfa and its content are protected by intellectual-property laws. You retain rights to the
        content you create, and you grant us a limited licence to host and display it to operate the
        Service. Do not copy, scrape, or reverse-engineer the Service.
      </p>

      <h2>9. Disclaimers and limitation of liability</h2>
      <p>
        The Service is provided "as is". To the maximum extent permitted by law, we disclaim implied
        warranties and are not liable for indirect or consequential damages, or for the acts of
        other users. Nothing in these Terms limits liability that cannot be limited by law
        (including for death or personal injury caused by negligence, or for consumer rights that
        cannot be waived).
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and delete your account at any time. We may suspend or
        terminate your access for breach of these Terms or to protect users. Provisions that by
        their nature should survive termination will do so.
      </p>

      <h2>11. Governing law and changes</h2>
      <p>
        We may update these Terms; we will notify you of material changes in the app. Mandatory
        consumer-protection laws of your country of residence continue to apply. Questions? Contact{' '}
        <a href="mailto:hello@tayfa.app">hello@tayfa.app</a>.
      </p>
    </>
  );
}
