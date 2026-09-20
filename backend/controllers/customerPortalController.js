const Tiffin = require("../models/Tiffin");
const Bill = require("../models/Bill");
const Payment = require("../models/Payment");
const AnnouncementDelivery = require("../models/AnnouncementDelivery");
const generateBillPdf = require("../utils/billPdfGenerator");
const DailyEntry = require("../models/DailyEntry");
const CustomerModificationRequest = require("../models/CustomerModificationRequest");
const TiffinModificationSettings = require("../models/TiffinModificationSettings");
const { sendCustomerModificationApprovalNotification } = require("../utils/customerModificationWhatsApp");
const getCustomerProfile = async (req, res) => {
  try {
    const customer = await Tiffin.findById(req.customerId).select(
      "customerName phone address mealType status barcode pricing createdAt updatedAt"
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found",
      });
    }
    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error("getCustomerProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load customer profile",
    });
  }
};
const updateCustomerProfile = async (req, res) => {
  try {
    const {
      customerName,
      phone,
      address,
    } = req.body || {};
    const updates = {};
    if (customerName !== undefined) {
      const normalizedName = String(customerName).trim();
      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message: "Customer name is required.",
        });
      }
      if (normalizedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Customer name cannot exceed 100 characters.",
        });
      }
      updates.customerName = normalizedName;
    }
    if (phone !== undefined) {
      const normalizedPhone = String(phone).replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number.",
        });
      }
      updates.phone = normalizedPhone;
    }
    if (address !== undefined) {
      const normalizedAddress = String(address).trim();
      if (!normalizedAddress) {
        return res.status(400).json({
          success: false,
          message: "Address is required.",
        });
      }
      if (normalizedAddress.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Address cannot exceed 500 characters.",
        });
      }
      updates.address = normalizedAddress;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No profile changes were provided.",
      });
    }
    const customer = await Tiffin.findByIdAndUpdate(
      req.customerId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "customerName phone address mealType status barcode pricing createdAt updatedAt"
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Customer profile updated successfully.",
      customer,
    });
  } catch (error) {
    console.error("updateCustomerProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update customer profile.",
    });
  }
};const getCustomerBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      customer: req.customerId,
    })
      .select(
        "invoiceNo month year cycle breakfastQty lunchQty dinnerQty breakfastAmount lunchAmount dinnerAmount extraAmount totalAmount paidAmount pendingAmount previousPendingAmount status createdAt updatedAt"
      )
      .sort({
        year: -1,
        month: -1,
        cycle: -1,
        createdAt: -1,
      })
      .lean();
    return res.status(200).json({
      success: true,
      data: bills,
    });
  } catch (error) {
    console.error("getCustomerBills:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load bill history.",
    });
  }
};
const getCustomerBillById = async (req, res) => {
  try {
    const { billId } = req.params;
    if (!billId) {
      return res.status(400).json({
        success: false,
        message: "Bill ID is required.",
      });
    }
    const bill = await Bill.findOne({
      _id: billId,
      customer: req.customerId,
    })
      .populate(
        "customer",
        "customerName phone address barcode mealType"
      )
      .lean();
    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }
    return res.status(200).json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("getCustomerBillById:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load bill.",
    });
  }
};const downloadCustomerBillPdf = async (req, res) => {
try {
const { billId } = req.params;
if (!billId) {
return res.status(400).json({
success: false,
message: "Bill ID is required.",
});
}
const bill = await Bill.findOne({
_id: billId,
customer: req.customerId,
}).lean();
if (!bill) {
return res.status(404).json({
success: false,
message: "Bill not found.",
});
}
const customer = await Tiffin.findById(req.customerId)
.select("customerName phone address mealType barcode pricing")
.lean();
if (!customer) {
return res.status(404).json({
success: false,
message: "Customer profile not found.",
});
}
const pdfBuffer = await generateBillPdf(bill, customer);
const invoiceName = String(
bill.invoiceNo || bill._id
).replace(/[^a-zA-Z0-9_-]/g, "_");
res.setHeader(
"Content-Type",
"application/pdf"
);
res.setHeader(
"Content-Disposition",
`attachment; filename="OM-Tiffin-${invoiceName}.pdf"`
);
res.setHeader(
"Content-Length",
pdfBuffer.length
);
return res.status(200).send(pdfBuffer);
} catch (error) {
console.error("downloadCustomerBillPdf:", error);
return res.status(500).json({
success: false,
message: "Unable to generate bill PDF.",
});
}
};const getCustomerMealHistory = async (req, res) => {
  try {
    const { month, year, cycle } = req.query;
    if (!month || !year || !cycle) {
      return res.status(400).json({
        success: false,
        message: "Month, year and billing cycle are required.",
      });
    }
    if (!["1", "2"].includes(String(cycle))) {
      return res.status(400).json({
        success: false,
        message: "Invalid billing cycle. Use 1 or 2.",
      });
    }
    const numericMonth = Number(month);
    const numericYear = Number(year);
    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12 ||
      !Number.isInteger(numericYear) ||
      numericYear < 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year.",
      });
    }
    let startDate;
    let endDate;
    if (String(cycle) === "1") {
      startDate = new Date(
        Date.UTC(numericYear, numericMonth - 1, 1)
      );
      endDate = new Date(
        Date.UTC(numericYear, numericMonth - 1, 16)
      );
    } else {
      startDate = new Date(
        Date.UTC(numericYear, numericMonth - 1, 16)
      );
      endDate = new Date(
        Date.UTC(numericYear, numericMonth, 1)
      );
    }
    const entries = await DailyEntry.find({
      customer: req.customerId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
      .select(
        "date breakfastQty lunchQty dinnerQty extraItems remark createdAt updatedAt"
      )
      .sort({ date: 1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: entries,
      period: {
        month: numericMonth,
        year: numericYear,
        cycle: String(cycle),
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("getCustomerMealHistory:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load meal history.",
    });
  }
};const getISTNow = () => {
  const now = new Date();
  const istString = now.toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
  return new Date(istString);
};
const getMinutesFromTime = (time) => {
  const [hours, minutes] = String(time).split(":").map(Number);
  return hours * 60 + minutes;
};
const createCustomerModificationRequest = async (req, res) => {
  try {
    const {
      requestType,
      requestDate,
      meal = "ALL",
      description = "",
    } = req.body;
    const allowedTypes = [
      "SKIP_TIFFIN",
      "EXTRA_TIFFIN",
      "MEAL_MODIFICATION",
      "OTHER",
    ];
    const allowedMeals = [
      "BREAKFAST",
      "LUNCH",
      "DINNER",
      "BOTH",
      "ALL",
    ];
    if (!allowedTypes.includes(requestType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid modification request type.",
      });
    }
    if (!allowedMeals.includes(meal)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meal selection.",
      });
    }
    if (!requestDate) {
      return res.status(400).json({
        success: false,
        message: "Request date is required.",
      });
    }
    const customer = await Tiffin.findById(req.customerId).select(
      "customerName phone barcode status"
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer profile not found.",
      });
    }
    const settings =
      (await TiffinModificationSettings.findOne().lean()) ||
      {
        lunchCutoffTime: "10:30",
        dinnerCutoffTime: "17:00",
        skipTiffinEnabled: true,
        extraTiffinEnabled: true,
        mealModificationEnabled: true,
        otherRequestEnabled: true,
      };
    const typeEnabledMap = {
      SKIP_TIFFIN: settings.skipTiffinEnabled,
      EXTRA_TIFFIN: settings.extraTiffinEnabled,
      MEAL_MODIFICATION: settings.mealModificationEnabled,
      OTHER: settings.otherRequestEnabled,
    };
    if (!typeEnabledMap[requestType]) {
      return res.status(403).json({
        success: false,
        message: "This modification request type is currently disabled.",
      });
    }
    const parsedDate = new Date(`${requestDate}T00:00:00+05:30`);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid request date.",
      });
    }
    const istNow = getISTNow();
    const requestedDateKey = requestDate;
    const todayKey = [
      istNow.getFullYear(),
      String(istNow.getMonth() + 1).padStart(2, "0"),
      String(istNow.getDate()).padStart(2, "0"),
    ].join("-");
    if (requestedDateKey < todayKey) {
      return res.status(400).json({
        success: false,
        message: "Past date modification requests are not allowed.",
      });
    }
    const currentMinutes =
      istNow.getHours() * 60 + istNow.getMinutes();
    const checkCutoff = (cutoffTime, mealLabel) => {
      const cutoffMinutes = getMinutesFromTime(cutoffTime);
      if (requestedDateKey === todayKey && currentMinutes >= cutoffMinutes) {
        return res.status(400).json({
          success: false,
          code: "MODIFICATION_CUTOFF_PASSED",
          message: `${mealLabel} modification window is closed. Today's cutoff time was ${cutoffTime} IST.`,
        });
      }
      return null;
    };
    if (meal === "LUNCH" || meal === "BOTH" || meal === "ALL") {
      const cutoffResponse = checkCutoff(
        settings.lunchCutoffTime,
        "Lunch"
      );
      if (cutoffResponse) {
        return cutoffResponse;
      }
    }
    if (meal === "DINNER" || meal === "BOTH" || meal === "ALL") {
      const cutoffResponse = checkCutoff(
        settings.dinnerCutoffTime,
        "Dinner"
      );
      if (cutoffResponse) {
        return cutoffResponse;
      }
    }
    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 1000 characters.",
      });
    }
    const existingPending =
      await CustomerModificationRequest.findOne({
        customer: req.customerId,
        requestDate: parsedDate,
        status: "PENDING",
      });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message:
          "A pending modification request already exists for this date.",
      });
    }
    const modificationRequest =
      await CustomerModificationRequest.create({
        customer: req.customerId,
        requestType,
        requestDate: parsedDate,
        meal,
        description: String(description).trim(),
        status: "PENDING",
      });
    // Modification-specific WhatsApp notification.
    // WhatsApp failure must not cancel the saved customer request.
    try {
      const whatsappResult =
        await sendCustomerModificationApprovalNotification(
          modificationRequest._id
        );
      console.log(
        "Modification approval WhatsApp notification result:",
        whatsappResult
      );
    } catch (whatsappError) {
      console.error(
        "Modification approval WhatsApp notification failed:",
        whatsappError.message
      );
    }
    return res.status(201).json({
      success: true,
      message: "Modification request submitted successfully.",
      data: modificationRequest,
    });
  } catch (error) {
    console.error("createCustomerModificationRequest:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit modification request.",
    });
  }
};
const getCustomerModificationRequests = async (req, res) => {
  try {
    const requests = await CustomerModificationRequest.find({
      customer: req.customerId,
    })
      .select(
        "requestType requestDate meal description status adminRemark reviewedAt createdAt updatedAt"
      )
      .sort({ requestDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("getCustomerModificationRequests:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load modification requests.",
    });
  }
};
const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      customer: req.customerId,
    })
      .select(
        "bill amount paymentMethod transactionId gateway paymentDate status note createdAt updatedAt"
      )
      .populate("bill", "invoiceNo month year cycle totalAmount")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get customer payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
    });
  }
};const getCustomerAnnouncements = async (req, res) => {
  try {
    const announcements = await AnnouncementDelivery.find({
      customer: req.customerId,
      status: {
        $in: ["delivered", "read"],
      },
    })
      .select(
        "title message templateName status whatsappMessageId sentAt deliveredAt readAt createdAt updatedAt"
      )
      .sort({
        createdAt: -1,
      })
      .lean();
    return res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error(
      "Customer Announcements Error:",
      error
    );
    return res.status(500).json({
      success: false,
      message:
        "Failed to load customer announcements.",
    });
  }
};module.exports = {
  getCustomerAnnouncements,
  getCustomerPayments,
downloadCustomerBillPdf,
  getCustomerBills,
  getCustomerBillById,
  updateCustomerProfile,
  getCustomerMealHistory,
getCustomerModificationRequests,
  getCustomerProfile,
createCustomerModificationRequest,
};











