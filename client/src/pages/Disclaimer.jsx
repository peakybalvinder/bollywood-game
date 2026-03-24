import React, { useEffect } from 'react';
import { setPageMeta } from '../router';
import LegalPage, { Section, P, Ul, Highlight } from './LegalPage';

export default function Disclaimer({ onBack }) {
  useEffect(() => {
    setPageMeta({
      title: 'Disclaimer — FilmiPaheli',
      description: 'Disclaimer for FilmiPaheli.com. Entertainment purposes only. No guarantee of service availability.',
      canonical: 'https://www.filmipaheli.com/disclaimer',
    });
    window.scrollTo(0, 0);
  }, []);

  return (
    <LegalPage title="Disclaimer" onBack={onBack}>

      <Highlight>
        Please read this Disclaimer carefully before using FilmiPaheli.com. By using the Platform, you acknowledge and accept the limitations and conditions outlined below.
      </Highlight>

      <Section title="1. Entertainment Purpose Only">
        <P>FilmiPaheli.com is designed and operated solely as a free recreational entertainment platform. The game is intended to provide a fun, social experience for players who enjoy Bollywood cinema. FilmiPaheli does not carry any educational, professional, or commercial purpose beyond entertainment.</P>
        <P>No aspect of FilmiPaheli should be interpreted as providing professional advice, recommendations, or authoritative information of any kind.</P>
      </Section>

      <Section title="2. No Guarantee of Service Availability">
        <P>While we strive to keep FilmiPaheli available at all times, we make no guarantees regarding:</P>
        <Ul items={[
          'Uninterrupted or error-free access to the Platform',
          'Stability of game sessions under all network conditions',
          'Availability of the movie search feature at any given time',
          'Continuity of service — the Platform may be taken offline for maintenance, updates, or any other reason without prior notice',
          'Data integrity during unexpected server restarts or outages',
        ]} />
        <P>FilmiPaheli is hosted on cloud infrastructure that may experience downtime, latency, or regional unavailability outside our control. We are not liable for any inconvenience caused by service interruptions.</P>
      </Section>

      <Section title="3. User-Generated Content">
        <P>FilmiPaheli allows users to send chat messages and choose display names during game sessions. These are forms of user-generated content. We are not responsible for:</P>
        <Ul items={[
          'The accuracy, appropriateness, or legality of any message sent in the chat',
          'Offensive, abusive, or inappropriate content posted by other users',
          'Any disputes arising between players during or after a game session',
          'Emotional distress or harm caused by interactions with other users on the Platform',
        ]} />
        <P>FilmiPaheli is not a monitored platform. Chat messages are not reviewed in real time by any moderator or automated system. Users are solely responsible for the content they post. If you encounter harmful content, we recommend leaving the session immediately.</P>
      </Section>

      <Section title="4. Movie Information Accuracy">
        <P>Movie titles and related information used in FilmiPaheli are sourced from third-party APIs including The Movie Database (TMDb) and Apple iTunes Search. We do not independently verify the accuracy of this information. FilmiPaheli is not responsible for:</P>
        <Ul items={[
          'Incorrect, incomplete, or outdated movie titles in search results',
          'Mismatch between a searched title and the actual film',
          'Unavailability of the movie search feature due to third-party API downtime',
        ]} />
        <P>Hosts are always free to type movie names manually without using the search feature.</P>
      </Section>

      <Section title="5. Third-Party Content & Advertisements">
        <P>FilmiPaheli displays advertisements provided by Google AdSense on the home page. We do not control the content of these advertisements and are not responsible for:</P>
        <Ul items={[
          'The accuracy or reliability of any advertised product, service, or claim',
          'Any transaction you enter into with an advertiser',
          'Content of third-party websites linked to through advertisements',
          'Privacy practices of advertisers or their websites',
        ]} />
        <P>The presence of an advertisement on FilmiPaheli does not constitute an endorsement of the advertiser or their offerings.</P>
      </Section>

      <Section title="6. Bollywood Content & Copyright">
        <P>FilmiPaheli is an independent, fan-made project. All Bollywood movie titles referenced during gameplay remain the intellectual property of their respective studios, producers, and distributors. FilmiPaheli does not reproduce, distribute, or host any copyrighted film content including footage, music, scripts, or imagery.</P>
        <P>FilmiPaheli is not affiliated with, endorsed by, or connected to any Bollywood production house, studio, streaming platform, or industry body.</P>
      </Section>

      <Section title="7. No Liability for Misuse">
        <P>FilmiPaheli shall not be held liable for any harm, damage, or loss resulting from:</P>
        <Ul items={[
          'Misuse of the Platform in violation of our Terms and Conditions',
          'Cheating, exploitation, or circumvention of game rules by any user',
          'Use of the Platform in a manner not intended by its design',
          'Actions taken by one user against another within a game session',
          'Any use of the Platform\'s chat feature to share harmful, offensive, or illegal content',
        ]} />
      </Section>

      <Section title="8. Technical Limitations">
        <P>FilmiPaheli is a real-time multiplayer application that depends on stable internet connectivity, WebSocket support, and modern browser capabilities. We disclaim all liability for:</P>
        <Ul items={[
          'Game sessions lost due to network disconnection on your end',
          'Incompatibility with older browsers or operating systems',
          'Performance issues on low-powered devices',
          'Data loss arising from unexpected session termination',
        ]} />
      </Section>

      <Section title="9. Changes to the Platform">
        <P>FilmiPaheli is an evolving project. We reserve the right to change, suspend, or discontinue any feature, functionality, or the entire Platform at any time without notice or liability. This includes changes to gameplay rules, session limits, ad placements, or any other aspect of the service.</P>
      </Section>

      <Section title="10. Acceptance">
        <P>By using FilmiPaheli.com, you acknowledge that you have read, understood, and agreed to this Disclaimer in full. If you do not agree with any part of this Disclaimer, please discontinue use of the Platform immediately.</P>
        <P>This Disclaimer is governed by the laws of India and should be read in conjunction with our Terms and Conditions and Privacy Policy.</P>
      </Section>

    </LegalPage>
  );
}
