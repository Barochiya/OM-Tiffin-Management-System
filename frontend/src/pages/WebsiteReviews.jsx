import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock3,
  RefreshCw,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  getReviews,
  updateReview,
  deleteReview,
} from "../services/websiteReviewService";
const STATUS_STYLES = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-green-50 text-green-700 ring-green-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
};
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={17}
          className={
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300"
          }
        />
      ))}
    </div>
  );
}
function StatusBadge({ status }) {
  const style =
    STATUS_STYLES[status] ||
    "bg-slate-50 text-slate-600 ring-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${style}`}
    >
      {status || "Unknown"}
    </span>
  );
}
export default function WebsiteReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const loadReviews = async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await getReviews();
      if (response?.success) {
        setReviews(response.data || []);
      } else {
        setReviews([]);
        setError("Failed to load website reviews.");
      }
    } catch (err) {
      console.error("Website Reviews Load Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load website reviews."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    loadReviews();
  }, []);
  // ADMIN_REVIEW_AUTO_REFRESH_30S
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadReviews({ silent: true });
    }, 30000);
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  const counts = useMemo(() => {
    return {
      total: reviews.length,
      pending: reviews.filter((review) => review.status === "Pending").length,
      approved: reviews.filter((review) => review.status === "Approved").length,
      rejected: reviews.filter((review) => review.status === "Rejected").length,
    };
  }, [reviews]);
  const handleStatusChange = async (id, status) => {
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      await updateReview(id, { status });
      setSuccess(
        status === "Approved"
          ? "Review approved successfully."
          : "Review rejected successfully."
      );
      await loadReviews({ silent: true });
    } catch (err) {
      console.error("Website Review Status Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to update review status."
      );
    } finally {
      setActionId(null);
    }
  };
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this review?"
    );
    if (!confirmed) return;
    try {
      setActionId(id);
      setError("");
      setSuccess("");
      await deleteReview(id);
      setSuccess("Review deleted successfully.");
      await loadReviews({ silent: true });
    } catch (err) {
      console.error("Website Review Delete Error:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to delete review."
      );
    } finally {
      setActionId(null);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                <Star size={24} className="fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                  Website Reviews
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Review and moderate customer testimonials shown on the public website.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadReviews({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}
        {/* Summary */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-500">
              Total Reviews
            </p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {counts.total}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-200">
            <div className="flex items-center gap-2">
              <Clock3 size={17} className="text-amber-600" />
              <p className="text-sm font-semibold text-slate-500">
                Pending
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {counts.pending}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-green-200">
            <div className="flex items-center gap-2">
              <Check size={17} className="text-green-600" />
              <p className="text-sm font-semibold text-slate-500">
                Approved
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-green-600">
              {counts.approved}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-red-200">
            <div className="flex items-center gap-2">
              <X size={17} className="text-red-600" />
              <p className="text-sm font-semibold text-slate-500">
                Rejected
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-red-600">
              {counts.rejected}
            </p>
          </div>
        </div>
        {/* Reviews */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-black text-slate-900">
              Customer Reviews
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Only approved reviews are displayed publicly.
            </p>
          </div>
          {loading ? (
            <div className="px-6 py-12 text-center text-sm font-medium text-slate-500">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Star
                size={40}
                className="mx-auto text-slate-300"
              />
              <p className="mt-4 text-base font-bold text-slate-700">
                No reviews yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Customer reviews will appear here when submitted.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reviews.map((review) => {
                const busy = actionId === review._id;
                return (
                  <div
                    key={review._id}
                    className="p-5 transition hover:bg-slate-50 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-base font-black text-slate-900">
                              {review.customerName}
                            </h3>
                            <p className="mt-1 text-xs text-slate-400">
                              Submitted {formatDate(review.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <RatingStars rating={review.rating} />
                            <span className="text-sm font-bold text-slate-600">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {review.reviewText}
                        </p>
                        <div className="mt-4">
                          <StatusBadge status={review.status} />
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:w-64 lg:justify-end">
                        {review.status !== "Approved" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleStatusChange(
                                review._id,
                                "Approved"
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Check size={16} />
                            Approve
                          </button>
                        )}
                        {review.status !== "Rejected" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              handleStatusChange(
                                review._id,
                                "Rejected"
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <X size={16} />
                            Reject
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleDelete(review._id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}