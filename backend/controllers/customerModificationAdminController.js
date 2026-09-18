const CustomerModificationRequest = require("../models/CustomerModificationRequest");
const { approveCustomerModificationRequest } = require("../services/customerModificationApprovalService");
const getAllModificationRequests = async (req, res) => {
  try {
    const requests = await CustomerModificationRequest.find()
      .populate(
        "customer",
        "customerName phone barcode mealType status"
      )
      .sort({ requestDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("getAllModificationRequests:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load modification requests.",
    });
  }
};
const getModificationRequestById = async (req, res) => {
  try {
    const request = await CustomerModificationRequest.findById(
      req.params.id
    )
      .populate(
        "customer",
        "customerName phone barcode mealType status address"
      )
      .lean();
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Modification request not found.",
      });
    }
    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error("getModificationRequestById:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load modification request.",
    });
  }
};
const updateModificationRequestStatus = async (req, res) => {
  try {
    const { status, adminRemark = "" } = req.body;
    const allowedStatuses = [
      "APPROVED",
      "REJECTED",
      "COMPLETED",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }
    const request =
      await CustomerModificationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Modification request not found.",
      });
    }
    if (request.status === "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed requests cannot be modified.",
      });
    }
    if (
      status === "APPROVED"
    ) {
      try {
        const approvalResult =
          await approveCustomerModificationRequest({
            requestId: request._id,
            reviewedBy: req.admin?._id || null,
            source: "ADMIN_PANEL",
          });
        const updatedRequest =
          await CustomerModificationRequest.findById(request._id)
            .populate(
              "customer",
              "customerName phone barcode mealType status"
            )
            .lean();
        return res.status(200).json({
          success: true,
          message: approvalResult.alreadyApproved
            ? "Modification request was already approved."
            : "Modification request approved successfully.",
          data: updatedRequest,
          whatsapp: approvalResult.whatsapp,
        });
      } catch (approvalError) {
        console.error(
          "approveCustomerModificationRequest:",
          approvalError
        );
        if (
          approvalError.code ===
          "MODIFICATION_REQUEST_NOT_FOUND"
        ) {
          return res.status(404).json({
            success: false,
            message: "Modification request not found.",
          });
        }
        return res.status(400).json({
          success: false,
          message: approvalError.message,
        });
      }
    }
    if (
      status === "COMPLETED" &&
      request.status !== "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved requests can be marked as completed.",
      });
    }
    if (
      request.status !== "PENDING" &&
      status !== "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only pending requests can be approved or rejected.",
      });
    }
    request.status = status;
    request.adminRemark = String(adminRemark).trim();
    if (status === "APPROVED" || status === "REJECTED") {
      request.reviewedAt = new Date();
      request.reviewedBy = req.admin?._id || null;
    }
    if (status === "COMPLETED") {
      request.completedAt = new Date();
    }
    await request.save();
    const updatedRequest =
      await CustomerModificationRequest.findById(request._id)
        .populate(
          "customer",
          "customerName phone barcode mealType status"
        )
        .lean();
    return res.status(200).json({
      success: true,
      message: `Modification request marked as ${status.toLowerCase()}.`,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("updateModificationRequestStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update modification request.",
    });
  }
};
module.exports = {
  getAllModificationRequests,
  getModificationRequestById,
updateModificationRequestStatus,
};
