/**
 * chartShare Tests
 * Web fallback logic (toPng → toCanvas) and data-URL validation (PR #257/#259)
 */

import type { RefObject } from 'react';

jest.mock('../platform', () => ({
  isWeb: true,
  isMobile: false,
}));

const mockToPng = jest.fn();
const mockToCanvas = jest.fn();

jest.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => mockToPng(...args),
  toCanvas: (...args: unknown[]) => mockToCanvas(...args),
}));

import { shareChart } from '../chartShare';

const VALID_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function makeRef(): RefObject<unknown> {
  const node = document.createElement('div');
  return { current: node } as RefObject<unknown>;
}

describe('chartShare (web)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // jsdom has no navigator.share by default; keep it that way unless a test opts in
    delete (navigator as { share?: unknown }).share;
    delete (navigator as { canShare?: unknown }).canShare;
  });

  describe('captureNodeAsPng fallback', () => {
    it('uses toPng when it succeeds', async () => {
      mockToPng.mockResolvedValue(VALID_DATA_URL);
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      await shareChart(makeRef(), 'My Chart');

      expect(mockToPng).toHaveBeenCalledTimes(1);
      expect(mockToCanvas).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('falls back to toCanvas when toPng fails', async () => {
      mockToPng.mockRejectedValue(new Error('mockToPng failed (Safari/WebKit)'));
      const canvas = document.createElement('canvas');
      canvas.toDataURL = jest.fn(() => VALID_DATA_URL);
      mockToCanvas.mockResolvedValue(canvas);
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      await shareChart(makeRef(), 'My Chart');

      expect(mockToPng).toHaveBeenCalledTimes(1);
      expect(mockToCanvas).toHaveBeenCalledTimes(1);
      expect(canvas.toDataURL).toHaveBeenCalledWith('image/png', 0.95);
      clickSpy.mockRestore();
    });

    it('propagates the error when both toPng and toCanvas fail', async () => {
      mockToPng.mockRejectedValue(new Error('mockToPng failed'));
      mockToCanvas.mockRejectedValue(new Error('mockToCanvas failed'));

      await expect(shareChart(makeRef(), 'My Chart')).rejects.toThrow('mockToCanvas failed');
    });
  });

  describe('data-URL validation', () => {
    it('throws when the capture produces an empty string', async () => {
      mockToPng.mockResolvedValue('');

      await expect(shareChart(makeRef(), 'My Chart')).rejects.toThrow(
        'Chart capture produced empty image'
      );
    });

    it('throws when the capture produces a non-PNG-prefixed value', async () => {
      mockToPng.mockResolvedValue('data:text/plain;base64,not-a-png');

      await expect(shareChart(makeRef(), 'My Chart')).rejects.toThrow(
        'Chart capture produced empty image'
      );
    });

    it('throws when the capture produces only the PNG prefix with no payload', async () => {
      mockToPng.mockResolvedValue('data:image/png;base64,');

      await expect(shareChart(makeRef(), 'My Chart')).rejects.toThrow(
        'Chart capture produced empty image'
      );
    });

    it('throws when the chart container ref is not attached', async () => {
      const emptyRef = { current: null } as RefObject<unknown>;

      await expect(shareChart(emptyRef, 'My Chart')).rejects.toThrow('Chart container not found');
    });
  });

  describe('valid data URL – share/download flow', () => {
    it('downloads via an anchor click when navigator.share is unavailable', async () => {
      mockToPng.mockResolvedValue(VALID_DATA_URL);
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      await shareChart(makeRef(), 'My Chart');

      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });

    it('sanitizes the title into a safe filename for the download', async () => {
      mockToPng.mockResolvedValue(VALID_DATA_URL);
      let capturedDownload = '';
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(function (this: HTMLAnchorElement) {
          capturedDownload = this.download;
        });

      await shareChart(makeRef(), 'Preis: 12h Übersicht!');

      // \w in the sanitizer is ASCII-only, so non-ASCII letters (e.g. Ü) are stripped too
      expect(capturedDownload).toBe('Preis_12h_bersicht.png');
      clickSpy.mockRestore();
    });

    it('uses navigator.share when files can be shared', async () => {
      mockToPng.mockResolvedValue(VALID_DATA_URL);
      global.fetch = jest.fn().mockResolvedValue({
        blob: async () => new Blob(['fake'], { type: 'image/png' }),
      }) as unknown as typeof fetch;

      const shareMock = jest.fn().mockResolvedValue(undefined);
      const canShareMock = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: canShareMock, configurable: true });
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      await shareChart(makeRef(), 'My Chart');

      expect(shareMock).toHaveBeenCalledTimes(1);
      expect(clickSpy).not.toHaveBeenCalled();
      clickSpy.mockRestore();
    });

    it('falls back to download when navigator.share rejects (e.g. cancelled)', async () => {
      mockToPng.mockResolvedValue(VALID_DATA_URL);
      global.fetch = jest.fn().mockResolvedValue({
        blob: async () => new Blob(['fake'], { type: 'image/png' }),
      }) as unknown as typeof fetch;

      const shareMock = jest.fn().mockRejectedValue(new Error('cancelled'));
      const canShareMock = jest.fn().mockReturnValue(true);
      Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: canShareMock, configurable: true });
      const clickSpy = jest
        .spyOn(HTMLAnchorElement.prototype, 'click')
        .mockImplementation(() => {});

      await shareChart(makeRef(), 'My Chart');

      expect(shareMock).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });
  });
});
