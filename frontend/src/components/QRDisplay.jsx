import React, { useEffect, useState } from 'react';

function QRDisplay({ qrImage, title = 'QR Code', subtitle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (qrImage) {
      // Create a temporary image element to copy to clipboard
      const link = document.createElement('a');
      link.href = qrImage;
      link.download = 'qr-code.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur p-6">
      <h3 className="text-sm font-medium text-slate-100 mb-2">{title}</h3>
      
      {subtitle && (
        <p className="text-xs text-slate-400 mb-4">{subtitle}</p>
      )}

      {qrImage ? (
        <div className="rounded-lg border border-white/10 bg-white p-4 mb-4">
          <img 
            src={qrImage} 
            alt="QR Code" 
            className="w-48 h-48 object-contain"
          />
        </div>
      ) : (
        <div className="w-48 h-48 rounded-lg border border-white/10 bg-slate-800 flex items-center justify-center mb-4">
          <span className="text-xs text-slate-400">No QR Code</span>
        </div>
      )}

      {qrImage && (
        <button
          onClick={handleCopy}
          className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-xs font-medium text-white transition"
        >
          {copied ? '✓ Copied' : 'Download QR Code'}
        </button>
      )}
    </div>
  );
}

export default QRDisplay;
