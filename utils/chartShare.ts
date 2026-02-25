/**
 * Chart Share Utility
 *
 * Platform-aware chart screenshot and sharing.
 * - Mobile (Android): react-native-view-shot + Share API
 * - Web: html-to-image (SVG-friendly) + navigator.share() or download
 */

import { isWeb, isMobile } from './platform';

/**
 * Captures a chart view (by ref) and shares or downloads it as a PNG.
 *
 * @param captureRef - React ref attached to the View wrapping the chart (mobile only)
 * @param title - Chart title used as filename and share text
 */
export async function shareChart(
  captureRef: React.RefObject<unknown>,
  title: string
): Promise<void> {
  if (isMobile) {
    await shareChartMobile(captureRef, title);
  } else if (isWeb) {
    await shareChartWeb(title);
  }
}

async function shareChartMobile(
  captureRef: React.RefObject<unknown>,
  title: string
): Promise<void> {
  const { captureRef: captureViewRef } = await import('react-native-view-shot');
  const { Share } = await import('react-native');

  const uri = await captureViewRef(captureRef, {
    format: 'png',
    quality: 0.95,
    result: 'tmpfile',
  });

  await Share.share({
    title,
    url: uri,
    message: title,
  });
}

async function shareChartWeb(title: string): Promise<void> {
  // On web the chart is an SVG rendered in DOM — capture via html-to-image
  // For simplicity we use the active focused chart container via querySelector
  // This is a best-effort approach; the capture target is the first .chart-capture element
  const { toPng } = await import('html-to-image');

  const node = document.querySelector('.chart-capture') as HTMLElement | null; // platform-safe
  if (!node) return;

  const dataUrl = await toPng(node, { quality: 0.95 });
  const filename = `${title.replace(/\s+/g, '_')}.png`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    // platform-safe
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: 'image/png' });
    await navigator.share({
      // platform-safe
      title,
      files: [file],
    });
  } else {
    // Fallback: trigger download
    const a = document.createElement('a'); // platform-safe
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }
}
