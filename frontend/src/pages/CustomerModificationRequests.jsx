import { useCallback, useEffect, useState } from "react";
import {
  FaCheck,
  FaClock,
  FaEye,
  FaRedo,
  FaTimes,
  FaUtensils,
} from "react-icons/fa";
import {
  getModificationRequests,
  updateModificationRequestStatus,
} from "../services/customerModificationAdminService";
const STATUS_META = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-blue-100 text-blue-800",
  },
};
const REQUEST_TYPE_LABELS = {
  SKIP_TIFFIN: "Skip Tiffin",
  EXTRA_TIFFIN: "Extra Tiffin / Extra Item",
  MEAL_MODIFICATION: "Modify Meal",
  OTHER: "Other",
};
const MEAL_LABELS = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  BOTH: "Lunch + Dinner",
  ALL: "All Meals",
};
const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
export default function CustomerModificationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remark, setRemark] = useState("");
  const [updating, setUpdating] = useState(false);
  const loadRequests = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");
      const response = await getModificationRequests();
      setRequests(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load modification requests:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to load tiffin modification requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  const handleStatusUpdate = async (status) => {
    if (!selectedRequest?._id) return;
    try {
      setUpdating(true);
      setError("");
      await updateModificationRequestStatus(
        selectedRequest._id,
        status,
        remark.trim()
      );
      setSelectedRequest(null);
      setRemark("");
      await loadRequests(true);
    } catch (err) {
      console.error("Failed to update modification request:", err);
      setError(
        err?.response?.data?.message ||
          "Unable to update the modification request."
      );
    } finally {
      setUpdating(false);
    }
  };
  const filteredRequests =
    statusFilter === "ALL"
      ? requests
      : requests.filter((request) => request.status === statusFilter);
  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((request) => request.status === "PENDING").length,
    APPROVED: requests.filter((request) => request.status === "APPROVED")
      .length,
    REJECTED: requests.filter((request) => request.status === "REJECTED")
      .length,
    COMPLETED: requests.filter((request) => request.status === "COMPLETED")
      .length,
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <FaUtensils />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Tiffin Modifications
              </h1>
              <p className="text-sm text-slate-500">
                Manage customer tiffin modification requests
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => loadRequests(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaRedo className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["ALL", "All Requests"],
          ["PENDING", "Pending"],
          ["APPROVED", "Approved"],
          ["REJECTED", "Rejected"],
          ["COMPLETED", "Completed"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`rounded-xl border p-4 text-left transition ${
              statusFilter === key
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">
              {counts[key]}
            </p>
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-slate-500">
            <FaClock className="mr-2 animate-pulse" />
            Loading requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <FaUtensils className="mb-3 text-3xl text-slate-300" />
            <h2 className="font-semibold text-slate-700">
              No modification requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              There are no requests matching the selected status.
            </p>
          </div>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[950px] w-full text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Request</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((request) => {
                  const status =
                    STATUS_META[request.status] || STATUS_META.PENDING;
                  return (
                    <tr
                      key={request._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {request.customer?.customerName || "Unknown Customer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {request.customer?.barcode || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {REQUEST_TYPE_LABELS[request.requestType] ||
                          request.requestType ||
                          "-"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {formatDate(request.requestDate)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {MEAL_LABELS[request.meal] || request.meal || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setRemark(request.adminRemark || "");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <FaEye />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>      {/* Mobile: 1 request = 1 card */}
      <div className="space-y-3 md:hidden">
        {filteredRequests.map((request) => {
          const status =
            STATUS_META[request.status] || STATUS_META.PENDING;
          return (
            <div
              key={request._id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-800">
                    {request.customer?.customerName || "Unknown Customer"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.customer?.barcode || "-"}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    Request
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {REQUEST_TYPE_LABELS[request.requestType] ||
                      request.requestType ||
                      "-"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    Date
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {formatDate(request.requestDate)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">
                    Meal
                  </span>
                  <span className="text-right text-sm font-semibold text-slate-800">
                    {MEAL_LABELS[request.meal] || request.meal || "-"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(request);
                  setRemark(request.adminRemark || "");
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <FaEye />
                View Request
              </button>
            </div>
          );
        })}
      </div>
      </>
        )}
      </div>
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Modification Request
                </h2>
                <p className="text-sm text-slate-500">
                  {selectedRequest.customer?.customerName || "Customer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedRequest(null);
                  setRemark("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Customer</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedRequest.customer?.customerName || "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Barcode</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {selectedRequest.customer?.barcode || "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Request Type</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {REQUEST_TYPE_LABELS[selectedRequest.requestType] ||
                      selectedRequest.requestType ||
                      "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Request Date</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {formatDate(selectedRequest.requestDate)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Meal</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {MEAL_LABELS[selectedRequest.meal] ||
                      selectedRequest.meal ||
                      "-"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Current Status</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {STATUS_META[selectedRequest.status]?.label ||
                      selectedRequest.status ||
                      "-"}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-slate-700">
                  Customer Description / Reason
                </p>
                <div className="min-h-24 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  {selectedRequest.description || "No description provided."}
                </div>
              </div>
              <div>
                <label
                  htmlFor="adminRemark"
                  className="mb-1 block text-sm font-semibold text-slate-700"
                >
                  Admin Remark
                </label>
                <textarea
                  id="adminRemark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Optional remark for this request..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={updating || selectedRequest.status === "COMPLETED"}
                />
              </div>
              {selectedRequest.status === "PENDING" && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("REJECTED")}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <FaTimes />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  >
                    <FaCheck />
                    Approve
                  </button>
                </div>
              )}
              {selectedRequest.status === "APPROVED" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <FaCheck />
                    Mark Completed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






