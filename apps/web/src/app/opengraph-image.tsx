import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'HomeFi: find out how much mortgage you can get, in under 5 minutes';

/** Brand card for WhatsApp, X and Instagram link previews */
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', background: '#0D2240', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, color: '#F7F4EE' }}>
        <div style={{ fontSize: 44, fontWeight: 700, display: 'flex' }}>
          Home<span style={{ color: '#E8A020' }}>Fi</span>
        </div>
        <div style={{ fontSize: 68, fontWeight: 700, marginTop: 30, lineHeight: 1.1 }}>
          Find out how much mortgage you can get, in under 5 minutes.
        </div>
        <div style={{ fontSize: 30, marginTop: 30, color: '#E8A020' }}>Free · NHF, MREIF and commercial options side by side</div>
      </div>
    ),
    size,
  );
}
