import { useEffect } from 'react';

export default function AdBanner({ slot, format = 'auto' }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); }
    catch(e) {}
  }, []);

  return (
    <div className="flex justify-center my-4">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}