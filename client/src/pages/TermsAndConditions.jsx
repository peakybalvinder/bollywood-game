import React, { useEffect } from 'react';
import { setPageMeta } from '../router';
import LegalPage, { Section, P, Ul, Highlight } from './LegalPage';

export default function TermsAndConditions({ onBack }) {
  useEffect(() => {
    setPageMeta({
      title: 'Terms & Conditions — FilmiPaheli',
      description: 'Terms and conditions for using FilmiPaheli.com, the free Bollywood movie guessing game.',
      canonical: 'https://www.filmipaheli.com/terms',
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="Terms & Conditions" onBack={onBack}>

      <Highlight>
        By accessing or using FilmiPaheli.com, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use the platform.
      </Highlight>

      <Section title="1. About FilmiPaheli">
        <P>FilmiPaheli.com ("the Platform", "we", "us", "our") is a free, browser-based multiplayer entertainment platform that allows users to participate in Bollywood movie guessing games in real time. The Platform is operated by Piyush Jindal and is accessible globally at www.filmipaheli.com.</P>
        <P>FilmiPaheli is intended purely for entertainment and recreational purposes. It is not a gambling platform, does not involve any monetary transactions, and does not offer any form of prize, reward, or financial incentive.</P>
      </Section>

      <Section title="2. Eligibility & Guest Access">
        <P>FilmiPaheli operates on a guest-access model. No registration or account creation is required to use the Platform. By entering a display name and joining a game session, you:</P>
        <Ul items={[
          'Confirm that you are at least 13 years of age, or that you have parental or guardian consent if you are under 13',
          'Agree to use the Platform only for lawful, non-commercial purposes',
          'Accept full responsibility for the display name you choose and all interactions you make on the Platform',
          'Acknowledge that guest sessions are temporary and carry no persistent identity or data',
        ]} />
      </Section>

      <Section title="3. Acceptable Use Policy">
        <P>You agree to use FilmiPaheli responsibly and in a manner that does not harm others or disrupt the Platform. The following activities are strictly prohibited:</P>
        <Ul items={[
          'Sharing movie answers in the chat to help other players cheat',
          'Opening multiple browser tabs or windows to gain an unfair game advantage',
          'Using browser developer tools, scripts, or bots to manipulate game data',
          'Posting abusive, offensive, threatening, sexually explicit, or discriminatory content in the chat',
          'Impersonating other players, public figures, or FilmiPaheli staff',
          'Attempting to disrupt, overload, or interfere with the Platform\'s infrastructure',
          'Using the Platform to distribute spam, malware, or unsolicited communications',
          'Attempting to access game server data, player information, or internal APIs beyond their intended use',
        ]} />
        <P>We reserve the right to terminate or restrict access to any session, IP address, or user who violates these terms, without prior notice.</P>
      </Section>

      <Section title="4. User-Generated Content">
        <P>FilmiPaheli allows users to submit display names and chat messages ("User Content") during game sessions. By submitting User Content, you agree that:</P>
        <Ul items={[
          'You are solely responsible for all content you post or submit',
          'Your content will not violate any applicable law, third-party rights, or these Terms',
          'FilmiPaheli does not endorse, review, or verify User Content',
          'Chat messages are temporary and are permanently deleted when the game session ends',
          'We reserve the right to discard, limit, or block any content that violates these Terms',
        ]} />
        <P>FilmiPaheli is not a publisher of User Content and is not liable for any content submitted by users. If you encounter abusive or harmful content from another user, please stop using the session and create a new room.</P>
      </Section>

      <Section title="5. Session Rules & Enforcement">
        <P>To maintain fair play and platform integrity, the following session rules are automatically enforced:</P>
        <Ul items={[
          'Inactivity Timeout: Players inactive for more than 5 consecutive minutes are automatically removed from their room',
          'Single Session Rule: Only one active game session per display name and room combination is permitted at a time. If a second session is detected, the earlier session is terminated',
          'Host Authority: The host controls the game room. If the host disconnects, the room is automatically closed for all players',
          'Anti-Cheat Monitoring: The Platform monitors tab-switching and window focus events. This data is shared with the host of the room for fairness purposes only',
        ]} />
      </Section>

      <Section title="6. Intellectual Property">
        <P>All design elements, source code, branding, graphics, and content on FilmiPaheli.com are the intellectual property of Piyush Jindal unless otherwise stated. You may not copy, reproduce, distribute, or create derivative works from any part of the Platform without explicit written permission.</P>
        <P>Bollywood movie titles referenced during gameplay belong to their respective studios and creators. FilmiPaheli does not claim ownership of any movie title. The Platform is an independent fan-made project and is not affiliated with any Bollywood studio, production house, or streaming service.</P>
      </Section>

      <Section title="7. Third-Party Services">
        <P>FilmiPaheli uses the following third-party services that have their own terms and privacy policies:</P>
        <Ul items={[
          'Google AdSense — for displaying non-intrusive advertisements on the home page',
          'The Movie Database (TMDb) — for movie search functionality (optional, requires API key)',
          'Apple iTunes Search API — as a fallback movie search source',
          'Railway / Cloud Hosting — for backend server infrastructure',
        ]} />
        <P>We are not responsible for the practices, content, or availability of third-party services. Your use of those services is governed by their respective terms.</P>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <P>FilmiPaheli is provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that:</P>
        <Ul items={[
          'The Platform will be available at all times or free from errors, bugs, or interruptions',
          'Game sessions will be stable under all network conditions',
          'The movie database will always return accurate or complete results',
          'The Platform will be compatible with all browsers, devices, or network configurations',
        ]} />
      </Section>

      <Section title="9. Limitation of Liability">
        <P>To the fullest extent permitted by applicable law, Piyush Jindal and FilmiPaheli.com shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from:</P>
        <Ul items={[
          'Your use of or inability to use the Platform',
          'Loss of game data, session data, or progress',
          'Conduct of other users within a game session',
          'Temporary or permanent unavailability of the Platform',
          'Any errors or inaccuracies in movie search results',
        ]} />
        <P>Your sole remedy for dissatisfaction with the Platform is to discontinue use.</P>
      </Section>

      <Section title="10. Governing Law">
        <P>These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising from use of this Platform shall be subject to the exclusive jurisdiction of the courts located in India. If you are accessing FilmiPaheli from outside India, you do so at your own risk and are responsible for compliance with your local laws.</P>
      </Section>

      <Section title="11. Changes to These Terms">
        <P>We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to this page with an updated "Last updated" date. Continued use of the Platform after any changes constitutes acceptance of the revised terms. We encourage you to review this page periodically.</P>
      </Section>

      <Section title="12. Contact">
        <P>If you have any questions about these Terms and Conditions, you may contact us by visiting FilmiPaheli.com and using the feedback option available on the platform. As this is an independent project, responses may take several business days.</P>
      </Section>

    </LegalPage>
  );
}
