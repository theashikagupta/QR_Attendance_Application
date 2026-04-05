const QRCode = require('qrcode');

/**
 * Generate QR code for a student
 * @param {string} studentId - MongoDB student ID
 * @param {string} qrSecret - Unique QR secret for the student
 * @returns {Promise<{payload: string, imageDataUrl: string}>}
 */
async function generateStudentQRCode(studentId, qrSecret) {
  try {
    // Create the payload (encrypted-like format)
    const payload = `ENC::${studentId}::${qrSecret}`;

    // Generate QR code as data URL (can be displayed directly in browser)
    const imageDataUrl = await QRCode.toDataURL(payload, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      payload,
      imageDataUrl, // Base64 encoded PNG image
    };
  } catch (err) {
    console.error('QR code generation failed:', err);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as PNG buffer (for file downloads)
 * @param {string} data - Data to encode in QR
 * @returns {Promise<Buffer>}
 */
async function generateQRCodeBuffer(data) {
  try {
    return await QRCode.toBuffer(data, {
      width: 300,
      margin: 2,
    });
  } catch (err) {
    console.error('QR code buffer generation failed:', err);
    throw new Error('Failed to generate QR code buffer');
  }
}

module.exports = {
  generateStudentQRCode,
  generateQRCodeBuffer,
};
