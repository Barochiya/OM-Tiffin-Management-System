import { useEffect, useState } from "react";

import {
  getWhatsAppPaymentReviews,
  getWhatsAppMedia,
} from "../services/whatsappInboxService";

import {
  approveWhatsAppPayment,
} from "../services/paymentService";

export default function WhatsAppPaymentApproval() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await getWhatsAppPaymentReviews();

      setReviews(
        Array.isArray(response?.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Payment Review Load Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load payment reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-600">
            Loading payment reviews...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            💰 WhatsApp Payment Approval
          </h1>

          <p className="mt-2 text-slate-500">
            Review customer payment screenshots
            before adding payments to the account.
          </p>
        </div>

        {/* Count */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Pending Reviews
              </p>

              <h2 className="mt-1 text-3xl font-bold text-yellow-600">
                {reviews.length}
              </h2>
            </div>

            <div className="rounded-full bg-yellow-100 px-4 py-2 font-semibold text-yellow-700">
              Pending Approval
            </div>
          </div>
        </div>

        {/* Empty State */}
        {reviews.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">
            <div className="mb-3 text-5xl">
              ✅
            </div>

            <h2 className="text-xl font-bold text-slate-700">
              No Pending Payments
            </h2>

            <p className="mt-2 text-slate-500">
              There are currently no WhatsApp
              payment screenshots waiting for approval.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
  <PaymentReviewCard
    key={review._id}
    review={review}
    onApproved={loadReviews}
  />
))}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Payment Review Card
// =====================================================

function PaymentReviewCard({
  review,
  onApproved,
}) {
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] =
    useState(false);
  const [imageError, setImageError] =
    useState("");

      const [selectedBill, setSelectedBill] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [approving, setApproving] =
    useState(false);

  const handleBillChange = (billId) => {
  setSelectedBill(billId);

  const bill =
    review.pendingBills?.find(
      (item) => item._id === billId
    );

  if (bill) {
    setAmount(
      String(bill.pendingAmount || "")
    );
  } else {
    setAmount("");
  }
};

const handleApprove = async () => {
  if (!selectedBill) {
    alert("Please select a bill.");
    return;
  }

  if (!amount || Number(amount) <= 0) {
    alert("Please enter a valid payment amount.");
    return;
  }

  const selectedBillData =
    review.pendingBills?.find(
      (bill) => bill._id === selectedBill
    );

  if (!selectedBillData) {
    alert("Selected bill not found.");
    return;
  }

  if (
    Number(amount) >
    Number(selectedBillData.pendingAmount)
  ) {
    alert(
      `Amount cannot be greater than pending amount ₹${selectedBillData.pendingAmount}.`
    );
    return;
  }

  try {
    setApproving(true);

    const response =
      await approveWhatsAppPayment({
        whatsappMessageId: review._id,

        customerId:
          review.customer?._id,

        billId:
          selectedBillData._id,

        amount: Number(amount),

        paymentMethod: "UPI",
      });

    if (!response?.success) {
      throw new Error(
        response?.message ||
          "Failed to approve payment."
      );
    }

    alert(
      "Payment approved and added successfully."
    );

    await onApproved();

  } catch (error) {
    console.error(
      "Approve WhatsApp Payment Error:",
      error
    );

    alert(
      error.response?.data?.message ||
        error.message ||
        "Failed to approve payment."
    );
  } finally {
    setApproving(false);
  }
};

  const loadImage = async () => {
    if (!review?.mediaId) return;

    try {
      setImageLoading(true);
      setImageError("");

      const blob =
        await getWhatsAppMedia(review._id);

      const url =
        URL.createObjectURL(blob);

      setImageUrl(url);
    } catch (error) {
      console.error(
        "Payment Screenshot Error:",
        error
      );

      setImageError(
        "Unable to load payment screenshot."
      );
    } finally {
      setImageLoading(false);
    }
  };

  useEffect(() => {
    loadImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [review?._id]);

  const customerName =
    review.customer?.customerName ||
    "Unknown Customer";

  const phone =
    review.customer?.phone || "-";

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">

      {/* Card Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {customerName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            📱 {phone}
          </p>
        </div>

        <span className="w-fit rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
          🟡 Pending Review
        </span>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">

        {/* Screenshot */}
        <div>
          <h3 className="mb-3 font-semibold text-slate-700">
            📸 Payment Screenshot
          </h3>

          <div className="min-h-[250px] rounded-xl border border-slate-200 bg-slate-50 p-4">

            {imageLoading && (
              <div className="flex min-h-[220px] items-center justify-center text-slate-500">
                Loading screenshot...
              </div>
            )}

            {imageError && (
              <div className="flex min-h-[220px] items-center justify-center text-red-600">
                {imageError}
              </div>
            )}

            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={imageUrl}
                  alt="Payment screenshot"
                  className="max-h-[500px] w-full rounded-lg object-contain"
                />
              </a>
            )}

            {!review.mediaId && (
              <div className="flex min-h-[220px] items-center justify-center text-slate-500">
                No screenshot attached.
              </div>
            )}
          </div>

          {review.mediaCaption && (
            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <strong>Caption:</strong>{" "}
              {review.mediaCaption}
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div>
          <h3 className="mb-4 font-semibold text-slate-700">
            💳 Payment Details
          </h3>

          <div className="space-y-3">

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Customer
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {customerName}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                WhatsApp Number
              </p>

              <p className="mt-1 font-semibold text-slate-800">
                {phone}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Payment Message
              </p>

              <p className="mt-1 whitespace-pre-wrap text-slate-700">
                {review.message || "No message"}
              </p>
            </div>

            {/* Pending Bills */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-3 font-semibold text-blue-800">
                🧾 Pending Bills
              </p>

                {review.pendingBills?.length > 0 && (
  <div className="mb-4">
    <label className="mb-2 block text-sm font-semibold text-blue-800">
      Select Bill
    </label>

    <select
      value={selectedBill}
      onChange={(event) =>
        handleBillChange(event.target.value)
      }
      className="w-full rounded-lg border border-blue-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
    >
      <option value="">
        Select pending bill
      </option>

      {review.pendingBills.map((bill) => (
        <option
          key={bill._id}
          value={bill._id}
        >
          {bill.invoiceNo || "Invoice"} -
          ₹{bill.pendingAmount}
        </option>
      ))}
    </select>

    {/* Approved Amount */}
<div className="mt-4">
  <label className="mb-2 block text-sm font-semibold text-blue-800">
    Approved Amount
  </label>

  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
      ₹
    </span>

    <input
      type="number"
      min="1"
      value={amount}
      onChange={(event) =>
        setAmount(event.target.value)
      }
      placeholder="Enter payment amount"
      className="w-full rounded-lg border border-blue-300 bg-white py-3 pl-8 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
    />
  </div>

  <p className="mt-1 text-xs text-blue-700">
    You can adjust the amount before approval.
  </p>
</div>

  </div>
)}

              {review.pendingBills?.length === 0 ? (
                <p className="text-sm text-blue-700">
                  No pending bills found.
                </p>
              ) : (
                <div className="space-y-2">
                  {review.pendingBills.map(
                    (bill) => (
                      <div
                        key={bill._id}
                        className="rounded-lg bg-white p-3"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {bill.invoiceNo ||
                                "Invoice"}
                            </p>

                            <p className="text-xs text-slate-500">
                              {bill.month}/
                              {bill.year} • Cycle{" "}
                              {bill.cycle}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              ₹
                              {
                                bill.pendingAmount
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              Pending
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row sm:justify-end">

        <button
          type="button"
          className="rounded-xl bg-red-100 px-6 py-3 font-semibold text-red-700 hover:bg-red-200"
        >
          ❌ Reject
        </button>

        <button
  type="button"
  onClick={handleApprove}
  disabled={
    approving ||
    !selectedBill ||
    !amount
  }
  className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
>
  {approving
    ? "Approving..."
    : "✅ Approve Payment"}
</button>

      </div>
    </div>
  );
}