const https = require("https");

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

  const url = new URL(`${baseUrl}/${phoneNumberId}/messages`);

  console.log("META WHATSAPP HTTPS START");

  const response = await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        family: 4,
        timeout: 20000,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
            text: async () => body,
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("WhatsApp Meta API request timed out"));
    });

    req.on("error", reject);

    req.write(JSON.stringify(payload));
    req.end();
  });

  console.log("META WHATSAPP RESPONSE:", {
    status: response.status,
    ok: response.ok,
  });

  return parseMetaResponse(response);
};
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

  console.log("Ã°Å¸â€œÂ¤ Sending WhatsApp text:", {
    to: normalizedTo,
  });

  const data = await sendMetaMessageRequest(payload);

  console.log("Ã¢Å“â€¦ WhatsApp text sent:", data);

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

  console.log(
  "WhatsApp Template Payload:",
  JSON.stringify(payload, null, 2)
);

  console.log("Sending WhatsApp template:", {
    to: normalizedTo,
    templateName,
    languageCode,
  });

  const data = await sendMetaMessageRequest(payload);

  console.log("WhatsApp template sent:", data);

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

  console.log("META WHATSAPP FETCH START");
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

  console.log("META WHATSAPP RESPONSE:", {
  status: response.status,
  ok: response.ok,
});
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

  console.log("Ã°Å¸â€œÂ¤ Sending WhatsApp document:", {
  to: normalizedTo,
  filename,
});



const data = await sendMetaMessageRequest(
  payload
);

console.log("Ã¢Å“â€¦ WhatsApp document sent:", data);

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
  `Ã°Å¸ÂÂ± *OM TIFFIN SERVICE* Ã°Å¸ÂÂ±\n\n` +
  `Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â\n\n` +
  `Ã°Å¸Â§Â¾ *NEW BILL GENERATED*\n\n` +
  `Ã°Å¸â€˜Â¤ *Customer:* ${customerName || "Customer"}\n\n` +
  `Ã°Å¸â€œâ€ž *Invoice No:* ${invoiceNo || "N/A"}\n\n` +
  `Ã°Å¸â€™Â° *Total Amount:* Ã¢â€šÂ¹${Number(totalAmount || 0)}\n\n` +
  `Ã°Å¸â€œâ€¦ *Date:* ${new Date().toLocaleDateString("en-GB")}\n\n` +
  `Ã¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€ÂÃ¢â€Â\n\n` +
  `Ã°Å¸â„¢Â Thank you for choosing\n` +
  `Ã°Å¸Å’Â¿ *OM TIFFIN SERVICE* Ã°Å¸Å’Â¿`;
  
  const result = await sendWhatsAppDocument({
  to,
  mediaId: media.id,
  filename:
    filename || "OM-Tiffin-Payment-Receipt.pdf",
  caption,
});



return result;
};

// =====================================================
// Send Bill Template With PDF
// =====================================================

const sendBillTemplateWithPdf = async ({
  phone,
  pdfBuffer,
  filename,
  customerName,
  invoiceNo,
  totalAmount,
}) => {
  const to = normalizeIndianPhone(phone);

  if (!to) {
    throw new Error(
      "Customer phone number is invalid."
    );
  }

  const media = await uploadPdf({
    pdfBuffer,
    filename,
  });

  console.log("Ã°Å¸â€œÂ¤ Uploading PDF:", filename);

console.log("Ã°Å¸â€œâ€ž Media ID:", media.id);

  console.log("Sending WhatsApp template:", {
  to,
  template: "om_tiffin_bill",
  customerName,
  invoiceNo,
  totalAmount,
});

  if (!media?.id) {
    throw new Error(
      "WhatsApp PDF media upload failed."
    );
  }

  return sendWhatsAppTemplate({
    to,

    templateName: "om_tiffin_bill",

    languageCode: "en_GB",

    components: [
      {
        type: "header",

        parameters: [
          {
            type: "document",

            document: {
              id: media.id,
              filename,
            },
          },
        ],
      },

      {
        type: "body",

        parameters: [
          {
            type: "text",
            text: customerName || "Customer",
          },

          {
            type: "text",
            text: invoiceNo || "N/A",
          },

          {
            type: "text",
            text: String(totalAmount || 0),
          },

          {
            type: "text",
            text: new Date().toLocaleDateString(
              "en-GB"
            ),
          },
        ],
      },
    ],
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
    throw new Error(
      "Customer phone number is invalid."
    );
  }

  const media = await uploadPdf({
    pdfBuffer,
    filename,
  });

  if (!media?.id) {
    throw new Error(
      "WhatsApp payment receipt PDF media upload failed."
    );
  }

  const formattedDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString(
        "en-GB"
      )
    : new Date().toLocaleDateString("en-GB");

  return sendWhatsAppTemplate({
    to,

    templateName:
      "om_tiffin_payment_receipt",

    languageCode: "en_GB",

    components: [
      {
        type: "header",

        parameters: [
          {
            type: "document",

            document: {
              id: media.id,
              filename,
            },
          },
        ],
      },

      {
        type: "body",

        parameters: [
          {
            type: "text",
            text:
              customerName || "Customer",
          },

          {
            type: "text",
            text: receiptNo || "N/A",
          },

          {
            type: "text",
            text: String(amount || 0),
          },

          {
            type: "text",
            text:
              paymentMethod || "Cash",
          },

          {
            type: "text",
            text: formattedDate,
          },
        ],
      },
    ],
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
  sendBillTemplateWithPdf,
  sendPdfPaymentReceiptWhatsApp,
};








