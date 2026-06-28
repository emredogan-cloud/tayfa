import type React from 'react';
import type { Metadata } from 'next';
import {
  DATA_RIGHTS_SLA_DAYS,
  BREACH_NOTIFICATION_HOURS,
  MIN_AGE_YEARS,
} from '@tayfa/shared/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Tayfa collects, uses, and protects your personal data under the GDPR and KVKK.',
};

const EFFECTIVE = '28 June 2026';

export default function PrivacyPage(): React.JSX.Element {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        <strong>Last updated: {EFFECTIVE}.</strong> This Privacy Policy explains how Tayfa ("Tayfa",
        "we", "us") processes your personal data when you use the Tayfa application and website (the
        "Service"). We are committed to the EU General Data Protection Regulation (GDPR) and, for
        users in Türkiye, the Law on the Protection of Personal Data No. 6698 (KVKK). A
        Turkish-language KVKK clarification text (<a href="/kvkk">Aydınlatma Metni</a>) is also
        available.
      </p>
      <p>
        Tayfa is a social meeting app for making friends through shared interests. It is{' '}
        <strong>not</strong> a dating app. You must be at least {MIN_AGE_YEARS} years old to use the
        Service.
      </p>

      <h2>1. Data controller</h2>
      <p>
        The data controller responsible for your personal data is Tayfa. For any privacy questions,
        or to exercise your rights, contact our Data Protection Officer at{' '}
        <a href="mailto:dpo@tayfa.app">dpo@tayfa.app</a>.
      </p>

      <h2>2. Categories of personal data we process</h2>
      <ul>
        <li>
          <strong>Identity &amp; account data:</strong> phone number, display name, date of birth
          (to enforce the {MIN_AGE_YEARS}+ age gate; we store the date and derive your age — your
          exact birthdate is never shown to others).
        </li>
        <li>
          <strong>Profile data:</strong> bio, photos, languages, neighborhood, and the interests you
          select or import.
        </li>
        <li>
          <strong>Verification data, including biometric data:</strong> to verify that hosts and
          members are real and 18+, our identity provider may process a government ID and a live
          selfie (a "liveness" check). The facial-geometry comparison performed during liveness
          constitutes <strong>biometric data</strong> (a special category under GDPR Art. 9 /
          sensitive personal data under KVKK Art. 6). We process it only with your{' '}
          <strong>explicit consent</strong> and we receive only a pass/fail result and a provider
          reference — <strong>we never store your ID document or biometric template</strong>.
        </li>
        <li>
          <strong>Location data:</strong> coarse location (e.g. neighborhood / city) to power
          discovery, and precise location only when you create or attend an event. Your precise
          location is never shown to other users except as described in Section 4.
        </li>
        <li>
          <strong>Usage &amp; device data:</strong> interactions with the Service, device
          identifiers, and a hashed device fingerprint used to prevent abuse and ban-evasion.
        </li>
        <li>
          <strong>Content:</strong> messages, ratings, reports, and event details you create.
        </li>
        <li>
          <strong>Transaction data:</strong> subscription status and entitlements (processed by our
          app-store / billing partners; we do not store full card numbers).
        </li>
      </ul>

      <h2>3. Purposes and legal bases</h2>
      <table>
        <thead>
          <tr>
            <th>Purpose</th>
            <th>Legal basis (GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Providing the core service (accounts, discovery, events, chat)</td>
            <td>Performance of a contract (Art. 6(1)(b))</td>
          </tr>
          <tr>
            <td>Age verification and the 18+ gate</td>
            <td>Legal obligation &amp; legitimate interests (Art. 6(1)(c), (f))</td>
          </tr>
          <tr>
            <td>Identity &amp; liveness (biometric) verification</td>
            <td>Explicit consent (Art. 9(2)(a))</td>
          </tr>
          <tr>
            <td>Precise location for attending events</td>
            <td>Consent (Art. 6(1)(a))</td>
          </tr>
          <tr>
            <td>Trust &amp; safety, fraud and abuse prevention</td>
            <td>Legitimate interests / legal obligation (Art. 6(1)(f), (c))</td>
          </tr>
          <tr>
            <td>Product analytics and improvement</td>
            <td>Consent (Art. 6(1)(a)) — separately toggleable</td>
          </tr>
          <tr>
            <td>Marketing communications</td>
            <td>Consent (Art. 6(1)(a)) — never required to use the Service</td>
          </tr>
        </tbody>
      </table>
      <p>
        Each consent (location, marketing, connected accounts, biometric verification) is captured{' '}
        <strong>separately</strong> and can be withdrawn at any time without affecting the
        lawfulness of prior processing. Withdrawing marketing or analytics consent never blocks the
        core service.
      </p>

      <h2>4. How precise location is protected</h2>
      <p>
        Location privacy is a core safety commitment. To other users, your location is shown only as
        a fuzzed neighborhood-level area — never precise coordinates. An event's precise meeting
        point is released only to members the host has approved, and only within a short window
        before the event starts. If you block someone, all location sharing, presence and visibility
        between you ends immediately.
      </p>

      <h2>5. Sharing and recipients</h2>
      <p>
        We share personal data only with processors who help us run the Service, under
        data-processing agreements:
      </p>
      <ul>
        <li>Cloud hosting and database (EU / Frankfurt region).</li>
        <li>Identity &amp; liveness verification provider.</li>
        <li>Subscription / billing (app stores and our billing platform).</li>
        <li>Content-moderation, analytics, error-monitoring and push-notification providers.</li>
      </ul>
      <p>We do not sell your personal data.</p>

      <h2>6. International transfers and data residency</h2>
      <p>
        Your data is hosted in the European Union (Frankfurt, Germany). Where a processor transfers
        data outside the EU/EEA or Türkiye, we rely on appropriate safeguards such as the European
        Commission's Standard Contractual Clauses and, for Türkiye, the undertakings and conditions
        required by the KVKK.
      </p>

      <h2>7. Retention</h2>
      <p>
        We keep personal data only as long as necessary for the purposes above: account data for the
        life of your account; verification results for a short period as required for safety and
        legal compliance (your ID/biometric source material is not retained by us); safety records
        and audit logs for as long as needed to defend legal claims and protect users; and analytics
        for limited, defined windows. When you delete your account, we erase or irreversibly
        anonymize your data, subject to limited legal-retention exceptions.
      </p>

      <h2>8. Your rights</h2>
      <p>Subject to applicable law, you have the right to:</p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>rectify inaccurate data;</li>
        <li>erase your data ("right to be forgotten");</li>
        <li>restrict or object to certain processing;</li>
        <li>data portability (receive your data in a machine-readable format);</li>
        <li>withdraw consent at any time; and</li>
        <li>lodge a complaint with a supervisory authority.</li>
      </ul>
      <p>
        You can export your data or request deletion directly in the app (Settings → Privacy), or
        email <a href="mailto:dpo@tayfa.app">dpo@tayfa.app</a>. We respond to rights requests within{' '}
        {DATA_RIGHTS_SLA_DAYS} days. EU users may complain to their local data-protection authority;
        users in Türkiye may apply to the Personal Data Protection Authority (KVKK Kurumu).
      </p>

      <h2>9. Security and breach notification</h2>
      <p>
        We apply technical and organizational measures including encryption in transit and at rest,
        strict access controls, row-level security, and append-only audit logging. If a
        personal-data breach is likely to result in a risk to your rights, we will notify the
        competent authority within {BREACH_NOTIFICATION_HOURS} hours of becoming aware of it, and
        affected users without undue delay.
      </p>

      <h2>10. Children</h2>
      <p>
        The Service is strictly for adults aged {MIN_AGE_YEARS} and over. We do not knowingly
        process the data of anyone under {MIN_AGE_YEARS}; accounts that fail the age gate are
        refused.
      </p>

      <h2>11. Changes to this policy</h2>
      <p>
        We will notify you of material changes in the app and update the "last updated" date above.
        Continued use after changes take effect constitutes acceptance where permitted by law.
      </p>
    </>
  );
}
