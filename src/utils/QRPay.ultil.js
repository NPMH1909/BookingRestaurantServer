// utils/vietqr.js

export const generateVietQR = async ({ accountNo, accountName, acqId, amount, addInfo }) => {
  const response = await fetch('https://api.vietqr.io/v2/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      accountNo,
      accountName,
      acqId,
      amount,
      addInfo,
      format: 'text',
    }),
  });

  if (!response.ok) throw new Error('Không thể tạo mã QR');

  const data = await response.json();
  return data.data.qrDataURL; // ảnh QR base64
};
