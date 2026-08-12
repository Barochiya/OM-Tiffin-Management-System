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

// =====================================================
// Normalize Indian Phone Number
// =====================================================

const normalizeIndianPhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");

  if (!digits) return null;

  // 10 digit Indian number
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // Already 91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // International number
  if (digits.length >= 11) {
    return digits;
  }

  return null;
};

// =====================================================
// Parse Meta API Response
// =====================================================

const parseMetaResponse = async (response) => {
  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      raw: text,
    };
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

// =====================================================
// Internal Meta API Request
// =====================================================

const sendMetaMessageRequest = async (payload) => {
  const {
    accessToken,
    phoneNumberId,
    baseUrl,
  } = getWhatsAppConfig();

  const response = await fetch(
    `${baseUrl}/${phoneNumberId}/messages`,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(payload),
    }
  );

  return parseMetaResponse(response);
};

// =====================================================
// Send Normal Text WhatsApp Message
// =====================================================

const sendWhatsAppMessage = async ({
  to,
  message,
  previewUrl = false,
}) => {
  const normalizedTo = normalizeIndianPhone(to);

  if (!normalizedTo) {
    const error = new Error(
      "Customer phone number is invalid."
    );

    error.code = "INVALID_PHONE";

    throw error;
  }

  if (!message || !String(message).trim()) {
    const error = new Error(
      "WhatsApp message is required."
    );

    error.code = "MESSAGE_REQUIRED";

    throw error;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizedTo,
    type: "text",

    text: {
      preview_url: Boolean(previewUrl),
      body: String(message),
    },
  };

  console.log("📤 Sending WhatsApp text:", {
    to: normalizedTo,
  });

  const data = await sendMetaMessageRequest(payload);

  console.log("✅ WhatsApp text sent:", data);

  return data;
};

// =====================================================
// Send WhatsApp Template Message
// =====================================================

const sendWhatsAppTemplate = async ({
  to,
  templateName,
  languageCode = "en_US",
  components,
}) => {
  const normalizedTo = normalizeIndianPhone(to);

  if (!normalizedTo) {
    const error = new Error(
      "Customer phone number is invalid."
    );

    error.code = "INVALID_PHONE";

    throw error;
  }

  if (!templateName || !String(templateName).trim()) {
    const error = new Error(
      "WhatsApp template name is required."
    );

    error.code = "TEMPLATE_NAME_REQUIRED";

    throw error;
  }

  const template = {
    name: String(templateName),
    language: {
      code: languageCode || "en_US",
    },
  };

  // Add template components only when provided
  if (
    Array.isArray(components) &&
    components.length > 0
  ) {
    template.components = components;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizedTo,
    type: "template",
    template,
  };

  console.log("📤 Sending WhatsApp template:", {
    to: normalizedTo,
    templateName,
    languageCode,
  });

  const data = await sendMetaMessageRequest(payload);

  console.log("✅ WhatsApp template sent:", data);

  return data;
};

// =====================================================
// Upload PDF to WhatsApp Media
// =====================================================

const uploadPdf = async ({
  pdfBuffer,
  filename,
}) => {
  const {
    accessToken,
    phoneNumberId,
    baseUrl,
  } = getWhatsAppConfig();

  if (!pdfBuffer) {
    const error = new Error(
      "PDF buffer is required."
    );

    error.code = "PDF_BUFFER_REQUIRED";

    throw error;
  }

  const form = new FormData();

  form.append(
    "messaging_product",
    "whatsapp"
  );

  form.append(
    "file",
    new Blob(
      [pdfBuffer],
      {
        type: "application/pdf",
      }
    ),
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

// =====================================================
// Send WhatsApp Document
// =====================================================

const sendWhatsAppDocument = async ({
  to,
  mediaId,
  filename,
  caption,
}) => {
  const normalizedTo = normalizeIndianPhone(to);

  if (!normalizedTo) {
    const error = new Error(
      "Customer phone number is invalid."
    );

    error.code = "INVALID_PHONE";

    throw error;
  }

  if (!mediaId) {
    const error = new Error(
      "WhatsApp media ID is required."
    );

    error.code = "MEDIA_ID_REQUIRED";

    throw error;
  }

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: normalizedTo,
    type: "document",

    document: {
      id: mediaId,
      filename:
        filename || "OM-Tiffin-Bill.pdf",
    },
  };

  if (caption) {
    payload.document.caption = caption;
  }

  console.log("📤 Sending WhatsApp document:", {
    to: normalizedTo,
    filename,
  });

  const data = await sendMetaMessageRequest(
    payload
  );

  console.log("✅ WhatsApp document sent:", data);

  return data;
};

// =====================================================
// Send PDF Bill
// =====================================================

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
    const error = new Error(
      "Customer phone number is invalid."
    );

    error.code = "INVALID_PHONE";

    throw error;
  }

  const media = await uploadPdf({
    pdfBuffer,
    filename,
  });

  if (!media?.id) {
    const error = new Error(
      "WhatsApp PDF media upload failed."
    );

    error.code = "MEDIA_UPLOAD_FAILED";

    throw error;
  }

  const caption =
    `OM TIFFIN SERVICE\n\n` +
    `Hello ${customerName || "Customer"},\n\n` +
    `Your bill ${
      invoiceNo ? `(${invoiceNo}) ` : ""
    }is attached as a PDF.\n` +
    `Total Amount: ₹${Number(
      totalAmount || 0
    )}\n\n` +
    `Thank you for choosing OM TIFFIN SERVICE. 🙏`;

  return sendWhatsAppDocument({
    to,
    mediaId: media.id,
    filename:
      filename || "OM-Tiffin-Bill.pdf",
    caption,
  });
};

// =====================================================
// Send PDF Payment Receipt
// =====================================================

const sendPdfPaymentReceiptWhatsApp = async ({
  phone,
  pdfBuffer,
  filename,
  customerName,
  receiptNo,
  amount,
  paymentMethod,
  paymentDate,
}) => {
  const to = normalizeIndianPhone(phone);

  if (!to) {
    const error = new Error(
      "Customer phone number is invalid."
    );

    error.code = "INVALID_PHONE";

    throw error;
  }

  const media = await uploadPdf({
    pdfBuffer,
    filename,
  });

  if (!media?.id) {
    const error = new Error(
      "WhatsApp payment receipt PDF media upload failed."
    );

    error.code = "MEDIA_UPLOAD_FAILED";

    throw error;
  }

  const formattedDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-GB")
    : new Date().toLocaleDateString("en-GB");

  const caption =
    `OM TIFFIN SERVICE\n\n` +
    `Payment Received Successfully\n\n` +
    `Customer : ${
      customerName || "Customer"
    }\n\n` +
    `Receipt No : ${
      receiptNo || "N/A"
    }\n\n` +
    `Amount : ₹${Number(
      amount || 0
    )}\n\n` +
    `Payment Method : ${
      paymentMethod || "Cash"
    }\n\n` +
    `Date : ${formattedDate}\n\n` +
    `Thank you for choosing OM TIFFIN SERVICE.`;

  return sendWhatsAppDocument({
    to,
    mediaId: media.id,
    filename:
      filename || "OM-Tiffin-Payment-Receipt.pdf",
    caption,
  });
};

// =====================================================
// Export
// =====================================================

module.exports = {
  getWhatsAppConfig,
  normalizeIndianPhone,
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendWhatsAppDocument,
  sendPdfBillWhatsApp,
  sendPdfPaymentReceiptWhatsApp,
};