import React, { useEffect } from 'react';
import { setPageMeta } from '../router';
import LegalPage, { Section, P, Ul, Highlight } from './LegalPage';

export default function PrivacyPolicy({ onBack }) {
  useEffect(() => {
    setPageMeta({
      title: 'Privacy Policy — FilmiPaheli',
      description: 'Privacy policy for FilmiPaheli.com. We collect no personal data. Learn how session data and Google AdSense cookies are handled.',
      canonical: 'https://www.filmipaheli.com/privacy',
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="Privacy Policy" onBack={onBack}>

      <Highlight>
        FilmiPaheli is designed with privacy as a default. We do not collect, store, or sell any personally identifiable information. This policy explains what minimal data is used and how it is handled.
      </Highlight>

      <Section title="1. Who We Are">
        <P>FilmiPaheli.com ("we", "us", "our") is a free online multiplayer game operated by Piyush Jindal. We are committed to protecting your privacy and being transparent about our practices. This Privacy Policy applies to all users accessing FilmiPaheli.com from anywhere in the world.</P>
      </Section>

      <Section title="2. Data We Do NOT Collect">
        <P>We want to be clear about what we do not collect:</P>
        <Ul items={[
          'Full name, email address, phone number, or any contact information',
          'Government-issued identification or financial data',
          'Precise or approximate location data',
          'Device identifiers such as IMEI, advertising IDs, or persistent device fingerprints',
          'Biometric data of any kind',
          'Browsing history or behaviour outside of FilmiPaheli.com',
          'User accounts, passwords, or authentication credentials',
        ]} />
        <P>FilmiPaheli has no user database. There is no registration system. When you leave the game, your identity on the platform ceases to exist.</P>
      </Section>

      <Section title="3. Session Data (Temporary)">
        <P>When you join a game session, the following minimal data is held temporarily in our server's memory for the duration of the session only:</P>
        <Ul items={[
          'Your chosen display name (e.g., "Amitabh")',
          'Your socket connection ID (a temporary technical identifier assigned by the server)',
          'Your game progress within the current round (guessed letters, lives remaining)',
          'Chat messages you send within the room',
          'Tab-visibility events (whether you switched tabs during a game) — shared only with the host',
          'Your IP address (used temporarily to enforce per-IP connection limits)',
        ]} />
        <Highlight>
          All of this data exists only in server memory during an active session. When the game room closes, all data is permanently and irreversibly deleted. We do not write any of this data to a database or persistent storage.
        </Highlight>
      </Section>

      <Section title="4. Cookies & Local Storage">
        <P>FilmiPaheli itself does not set any first-party cookies or use local storage to track users across sessions.</P>
        <P>However, third-party services integrated into the Platform (primarily Google AdSense) may set their own cookies on your browser for the purpose of serving relevant advertisements. These cookies are governed by Google's Privacy Policy, not ours.</P>
        <P>You can manage or disable cookies through your browser settings. Disabling cookies will not affect FilmiPaheli's core gameplay functionality, but may affect the personalisation of ads shown on the home page.</P>
      </Section>

      <Section title="5. Google AdSense & Advertising">
        <P>FilmiPaheli displays non-intrusive advertisements on the home page via Google AdSense. These ads are served by Google LLC and are subject to Google's Privacy Policy (policies.google.com/privacy).</P>
        <P>By displaying AdSense ads, Google may:</P>
        <Ul items={[
          'Use cookies to serve ads based on your prior visits to FilmiPaheli.com or other websites',
          'Use the DoubleClick cookie to measure ad effectiveness',
          'Collect data about your browser, device type, and general geographic region for ad targeting',
        ]} />
        <P>FilmiPaheli does not have access to the data Google collects through AdSense, and we do not share any user data with Google beyond what is inherent in loading the AdSense script on our page.</P>
        <P>You can opt out of personalised advertising by visiting <strong className="text-gold-500">adssettings.google.com</strong> or by installing the Google Analytics Opt-out Browser Add-on. You can also use tools like the NAI opt-out page at optout.networkadvertising.org.</P>
        <Highlight>
          Ads are shown only on the FilmiPaheli home page. No ads appear during active gameplay, in the game room, or in the chat panel.
        </Highlight>
      </Section>

      <Section title="6. Movie Search (TMDb / iTunes)">
        <P>When the host searches for a movie title, a query is sent to our backend server which then forwards it to either The Movie Database (TMDb) API or the Apple iTunes Search API. The search query (the text you type) is transmitted to these services to retrieve results.</P>
        <P>We do not store search queries. TMDb and Apple have their own privacy policies governing how they handle API requests. The search feature is optional — the host can also type any movie title directly without using the search.</P>
      </Section>

      <Section title="7. Server Logs">
        <P>Our hosting provider (Railway) may automatically collect standard server access logs including:</P>
        <Ul items={[
          'IP address of incoming connections',
          'Timestamp of requests',
          'HTTP request type and path',
          'Response status codes',
        ]} />
        <P>These logs are maintained by Railway for operational and security purposes in accordance with their own privacy policy. FilmiPaheli does not have direct control over Railway's log retention policies. These logs are used solely for diagnosing server issues and detecting abuse (such as DDoS attacks or API abuse).</P>
      </Section>

      <Section title="8. Children's Privacy">
        <P>FilmiPaheli is a family-friendly game platform. We do not knowingly collect any data from children under the age of 13. Because we collect no personal data from any user, the risk to children's privacy is minimal. If you are a parent or guardian and believe your child has shared inappropriate information through the chat feature, please stop using the session — the data will be automatically deleted when the session ends.</P>
      </Section>

      <Section title="9. Data Security">
        <P>Since FilmiPaheli stores no personal data persistently, there is no personal data at risk of a breach. Communications between your browser and our server use HTTPS/WSS (encrypted connections). We implement rate limiting and connection limits to protect against abuse of our APIs.</P>
        <P>No security system is perfect. We recommend you avoid sharing sensitive personal information in the chat, as chat messages are visible to all players in the room.</P>
      </Section>

      <Section title="10. Your Rights">
        <P>Because FilmiPaheli does not collect or store identifiable personal data, most traditional data rights (such as right to access, rectification, or deletion) do not practically apply. There is no stored profile to request, correct, or delete.</P>
        <P>If you have a concern about data processed by Google AdSense, you should contact Google directly or use their opt-out mechanisms described in Section 5 above.</P>
        <P>Users in the European Union may have additional rights under GDPR. Users in California may have rights under CCPA. Since we collect no PII, these rights are inherently satisfied, but you are welcome to contact us if you have concerns.</P>
      </Section>

      <Section title="11. Changes to This Policy">
        <P>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. Updated versions will be posted on this page with a revised "Last updated" date. We encourage you to review this policy periodically. Continued use of the Platform after any changes constitutes your acceptance of the updated policy.</P>
      </Section>

      <Section title="12. Contact">
        <P>For any privacy-related questions or concerns, please visit FilmiPaheli.com. As this is an independent project maintained by a single developer, we appreciate your patience with response times.</P>
      </Section>

    </LegalPage>
  );
}
