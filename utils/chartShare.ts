/**
 * Chart Share Utility
 *
 * Platform-aware chart screenshot and sharing.
 * - Mobile (iOS & Android): react-native-view-shot + Share API
 * - Web: html-to-image + navigator.share() or download fallback
 */

import { isWeb, isMobile } from './platform';

/**
 * Captures a chart view and shares or downloads it as a PNG.
 *
 * @param captureRef - React ref attached to the View wrapping the chart
 * @param title - Chart title used as filename and share text
 */
export async function shareChart(
  captureRef: React.RefObject<unknown>,
  title: string
): Promise<void> {
  if (isMobile) {
    await shareChartMobile(captureRef, title);
  } else if (isWeb) {
    await shareChartWeb(captureRef, title);
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

async function shareChartWeb(captureRef: React.RefObject<unknown>, title: string): Promise<void> {
  const { toPng } = await import('html-to-image');

  // On web, captureRef.current is the underlying DOM node
  const node = captureRef.current as HTMLElement | null;
  if (!node) {
    throw new Error('Chart container not found');
  }

  const dataUrl = await toPng(node, { quality: 0.95 });
  // Sanitize filename: remove invalid characters, replace spaces with underscores
  const filename = `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.png`;

  const triggerDownload = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title, files: [file] });
        return;
      } catch {
        // Share cancelled or failed – fall through to download
      }
    }
  }

  triggerDownload();
}
