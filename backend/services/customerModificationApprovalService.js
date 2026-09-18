const CustomerModificationRequest = require("../models/CustomerModificationRequest");
const {
  sendCustomerModificationApprovedNotification,
} = require("../utils/customerModificationWhatsApp");
const approveCustomerModificationRequest = async ({
  requestId,
  reviewedBy = null,
  source = "ADMIN_PANEL",
}) => {
  const request =
    await CustomerModificationRequest.findById(requestId);
  if (!request) {
    const error = new Error(
      "Modification request not found."
    );
    error.code = "MODIFICATION_REQUEST_NOT_FOUND";
    throw error;
  }
  // Already approved/completed:
  // do not send another customer WhatsApp notification.
  if (
    request.status === "APPROVED" ||
    request.status === "COMPLETED"
  ) {
    return {
      approved: false,
      alreadyApproved: true,
      source,
      requestId: String(request._id),
      status: request.status,
      whatsapp: {
        sent: false,
        reason: "ALREADY_APPROVED",
      },
    };
  }
  if (request.status !== "PENDING") {
    const error = new Error(
      `Only pending requests can be approved. Current status: ${request.status}.`
    );
    error.code = "MODIFICATION_REQUEST_NOT_PENDING";
    throw error;
  }
  request.status = "APPROVED";
  request.reviewedAt = new Date();
  request.reviewedBy = reviewedBy || null;
  await request.save();
  let whatsapp = {
    sent: false,
    reason: "NOT_SENT",
  };
  try {
    whatsapp =
      await sendCustomerModificationApprovedNotification(
        request._id
      );
  } catch (whatsappError) {
    console.error(
      "Customer modification approved WhatsApp failed:",
      {
        requestId: request._id,
        source,
        error: whatsappError.message,
      }
    );
    whatsapp = {
      sent: false,
      reason: "WHATSAPP_SEND_FAILED",
      error: whatsappError.message,
    };
  }
  return {
    approved: true,
    alreadyApproved: false,
    source,
    requestId: String(request._id),
    status: request.status,
    whatsapp,
  };
};
module.exports = {
  approveCustomerModificationRequest,
};
