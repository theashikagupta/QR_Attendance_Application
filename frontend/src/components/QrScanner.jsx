import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

function QrScanner({ onScan, onError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    };

    scannerRef.current = new Html5QrcodeScanner('qr-reader', config, false);

    scannerRef.current.render(
      (decodedText) => {
        if (onScan) onScan(decodedText);
      },
      (errorMessage) => {
        if (onError) onError(errorMessage);
      },
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onScan, onError]);

  return <div id="qr-reader" className="w-full max-w-sm mx-auto" />;
}

export default QrScanner;
