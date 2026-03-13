import { useMemo } from 'react';

export function useScreenShareSupport() {
  return useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { isSupported: false, reason: 'Screen sharing is not available in this environment.', isIOS: false };
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

    // getDisplayMedia is NOT supported on iOS Safari or iOS Chrome (WebKit limitation)
    if (isIOS) {
      return {
        isSupported: false,
        reason: 'Screen sharing is not available on iPhone or iPad. You can use camera-based video support instead.',
        isIOS: true,
      };
    }

    const hasGetDisplayMedia =
      'mediaDevices' in navigator &&
      'getDisplayMedia' in (navigator.mediaDevices || {});

    if (!hasGetDisplayMedia) {
      return {
        isSupported: false,
        reason: 'Screen sharing is not supported in this browser. Try using Chrome, Firefox, or Edge.',
        isIOS: false,
      };
    }

    return { isSupported: true, reason: null, isIOS: false };
  }, []);
}
