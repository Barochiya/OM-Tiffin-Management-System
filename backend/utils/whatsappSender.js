const getWhatsAppConfig = () => {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v26.0";

  if (!accessToken || !phoneNumberId) {
    const error = new Error(
      "WhatsApp sending is not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in the backend environment."
    );
    error.code = "WHATSAPP_NOT_CONFIGURED";
    throw error;
  }

  return {
    accessToken,
    phoneNumberId,
    apiVersion,
    baseUrl: `https://graph.facebook.com/${apiVersion}`,
  };
};

const normalizeIndianPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length >= 11) return digits;

  return null;
};

const parseMetaResponse = async (response) => {
  const text = await response.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ||
        `WhatsApp API request failed with status ${response.status}.`
    );

    error.status = response.status;
    error.meta = data?.error || data;
    throw error;
  }

  return data;
};

const uploadPdf = async ({ pdfBuffer, filename }) => {
  const { accessToken, phoneNumberId, baseUrl } =
    getWhatsAppConfig();

  const form = new FormData();

  form.append("messaging_product", "whatsapp");
  form.append(
    "file",
    new Blob([pdfBuffer], { type: "application/pdf" }),
    filename || "om-tiffin-bill.pdf"
  );

  const response = await fetch(
    `${baseUrl}/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  return parseMetaResponse(response);
};

const sendDocumentMessage = async ({
  to,
  mediaId,
  filename,
  customerName,
  invoiceNo,
  totalAmount,
}) => {
  const { accessToken, phoneNumberId, baseUrl } =
    getWhatsAppConfig();

  const response = await fetch(
    `${baseUrl}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          id: mediaId,
          filename: filename || "OM-Tiffin-Bill.pdf",
          caption:
            `OM TIFFIN SERVICE\n\n` +
            `Hello ${customerName || "Customer"},\n\n` +
            `Your bill ${invoiceNo ? `(${invoiceNo}) ` : ""}is attached as a PDF.\n` +
            `Total Amount: ₹${Number(totalAmount || 0)}\n\n` +
            `Thank you for choosing OM TIFFIN SERVICE. 🙏`,
        },
      }),
    }
  );

  return parseMetaResponse(response);
};

const sendPdfBillWhatsApp = async ({
  phone,
  pdfBuffer,
  filename,
  customerName,
  invoiceNo,
  totalAmount,
}) => {
  const to = normalizeIndianPhone(phone);

  if (!to) {
    const error = new Error("Customer phone number is invalid.");
    error.code = "INVALID_PHONE";
    throw error;
  }

  const media = await uploadPdf({ pdfBuffer, filename });

  return sendDocumentMessage({
    to,
    mediaId: media.id,
    filename,
    customerName,
    invoiceNo,
    totalAmount,
  });
};

module.exports = {
  sendPdfBillWhatsApp,
  normalizeIndianPhone,
};
