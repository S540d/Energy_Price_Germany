/**
 * Chart Share Utility
 *
 * Platform-aware chart screenshot and sharing.
 * - Mobile (iOS & Android): react-native-view-shot + Share API
 * - Web: html-to-image + navigator.share() or download fallback
 */

import type { RefObject } from 'react';
import { isWeb, isMobile } from './platform';

/**
 * Captures a chart view and shares or downloads it as a PNG.
 *
 * @param captureRef - React ref attached to the View wrapping the chart
 * @param title - Chart title used as filename and share text
 */
export async function shareChart(captureRef: RefObject<unknown>, title: string): Promise<void> {
  if (isMobile) {
    await shareChartMobile(captureRef, title);
  } else if (isWeb) {
    await shareChartWeb(captureRef, title);
  }
}

async function shareChartMobile(captureRef: RefObject<unknown>, title: string): Promise<void> {
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

async function captureNodeAsPng(node: HTMLElement): Promise<string> {
  const htmlToImage = await import('html-to-image');

  const options = {
    quality: 0.95,
    cacheBust: true,
    // Skip foreign-object rendering which breaks in Safari/iOS
    skipFonts: true,
  };

  try {
    // Attempt toPng first (works well on Chrome/Firefox)
    return await htmlToImage.toPng(node, options);
  } catch {
    // Fallback: toCanvas is more reliable on Safari/iOS WebKit
    const canvas = await htmlToImage.toCanvas(node, options);
    return canvas.toDataURL('image/png', 0.95);
  }
}

async function shareChartWeb(captureRef: RefObject<unknown>, title: string): Promise<void> {
  // On web, captureRef.current is the underlying DOM node
  const node = captureRef.current as HTMLElement | null;
  if (!node) {
    throw new Error('Chart container not found');
  }

  const dataUrl = await captureNodeAsPng(node);

  // Validate that we got a real image (Safari can return blank/tiny data URLs)
  if (!dataUrl || dataUrl.length < 100) {
    throw new Error('Chart capture produced empty image');
  }

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
