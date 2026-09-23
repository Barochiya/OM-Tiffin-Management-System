import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Clock3,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import {
  getLoginIdRecipients,
  sendLoginIdsWhatsApp,
} from "../services/customerLoginIdService";
const MESSAGE_PREVIEW =
  "Your OM Tiffin Customer User ID: {USER_ID}. Tap the button below to set up your account and create your password.";
const CustomerLoginIdSender = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sendResults, setSendResults] = useState(null);
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");
      const response = await getLoginIdRecipients();
      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to load customer login IDs"
        );
      }
      setCustomers(Array.isArray(response.data) ? response.data : []);
      setSelectedIds([]);
      setSendResults(null);
    } catch (loadError) {
      console.error("CustomerLoginIdSender load:", loadError);
      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Unable to load customer login IDs"
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);
  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesStatus =
        statusFilter === "All" ||
        String(customer.status || "").toLowerCase() ===
          statusFilter.toLowerCase();
      if (!matchesStatus) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      return [
        customer.customerName,
        customer.phone,
        customer.userId,
        customer.barcode,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch)
        );
    });
  }, [customers, search, statusFilter]);
  const selectedCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        selectedIds.includes(String(customer.customerId))
      ),
    [customers, selectedIds]
  );
  const readyCount = customers.filter(
    (customer) => customer.ready
  ).length;
  const activeCount = customers.filter(
    (customer) => customer.status === "Active"
  ).length;
  const inactiveCount = customers.filter(
    (customer) => customer.status === "Inactive"
  ).length;
  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((customer) =>
      selectedIds.includes(String(customer.customerId))
    );
  const toggleCustomer = (customerId) => {
    const id = String(customerId);
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
    setSendResults(null);
    setSuccessMessage("");
  };
  const toggleSelectAll = () => {
    const filteredIds = filteredCustomers
      .filter((customer) => customer.ready)
      .map((customer) => String(customer.customerId));
    if (filteredIds.length === 0) {
      return;
    }
    setSelectedIds((current) => {
      const currentSet = new Set(current);
      if (
        filteredIds.every((id) => currentSet.has(id))
      ) {
        return current.filter(
          (id) => !filteredIds.includes(id)
        );
      }
      return [
        ...current,
        ...filteredIds.filter(
          (id) => !currentSet.has(id)
        ),
      ];
    });
    setSendResults(null);
    setSuccessMessage("");
  };
  const clearSelection = () => {
    setSelectedIds([]);
    setSendResults(null);
    setSuccessMessage("");
  };
  const handleSend = async () => {
    if (selectedIds.length === 0 || sending) {
      return;
    }
    const selectedReadyCustomers = selectedCustomers.filter(
      (customer) => customer.ready
    );
    if (selectedReadyCustomers.length === 0) {
      setError(
        "Please select at least one ready customer with a valid account and phone number."
      );
      return;
    }
    const confirmed = window.confirm(
      `Send Customer Login ID WhatsApp message to ${selectedReadyCustomers.length} selected customer(s)?`
    );
    if (!confirmed) {
      return;
    }
    try {
      setSending(true);
      setError("");
      setSuccessMessage("");
      setSendResults(null);
      const response = await sendLoginIdsWhatsApp(
        selectedReadyCustomers.map((customer) =>
          String(customer.customerId)
        )
      );
      if (!response?.success) {
        throw new Error(
          response?.message || "Unable to send login IDs"
        );
      }
      setSendResults(response.summary || null);
      setSuccessMessage(
        `WhatsApp sending completed. Sent: ${
          response.summary?.sent || 0
        }, Failed: ${response.summary?.failed || 0}.`
      );
    } catch (sendError) {
      console.error("CustomerLoginIdSender send:", sendError);
      setError(
        sendError.response?.data?.message ||
          sendError.message ||
          "Unable to send customer login IDs"
      );
    } finally {
      setSending(false);
    }
  };
  const getPreviewMessage = (customer) =>
    MESSAGE_PREVIEW.replace(
      "{USER_ID}",
      customer?.userId || "OMT-000000"
    );
  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-5 text-white shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  Customer Login ID Sender
                </h1>
              </div>
              <p className="max-w-3xl text-sm text-blue-100 sm:text-base">
                Send each customer their own OM Tiffin Customer User ID
                through WhatsApp. Passwords are never shown or sent from
                this screen.
              </p>
            </div>
            <button
              type="button"
              onClick={loadCustomers}
              disabled={loading || sending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-blue-700 shadow transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </div>
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              {error}
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-600 hover:text-red-800"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">
              {successMessage}
            </div>
          </div>
        )}
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {customers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Ready
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {readyCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Active
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock3 className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {inactiveCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-5 w-5 text-blue-700" />
              <div>
                <p className="text-xs font-medium text-blue-700">
                  Selected
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {selectedIds.length}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Controls */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search customer, phone or User ID..."
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleSelectAll}
                disabled={loading || filteredCustomers.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckSquare className="h-4 w-4" />
                {allFilteredSelected
                  ? "Unselect All"
                  : "Select All"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedIds.length === 0 || sending}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Customer table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Customer Recipients
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredCustomers.length} of{" "}
                  {customers.length} customers
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {selectedIds.length} selected
              </span>
            </div>
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                  Loading customers...
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
                <Users className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold text-slate-700">
                  No customers found
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try changing your search or status filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          aria-label="Select all visible customers"
                        />
                      </th>
                      <th className="px-4 py-3">
                        Customer
                      </th>
                      <th className="px-4 py-3">
                        Phone
                      </th>
                      <th className="px-4 py-3">
                        User ID
                      </th>
                      <th className="px-4 py-3">
                        Status
                      </th>
                      <th className="px-4 py-3">
                        Ready
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((customer) => {
                      const customerId = String(
                        customer.customerId
                      );
                      const selected =
                        selectedIds.includes(customerId);
                      return (
                        <tr
                          key={customerId}
                          className={`transition ${
                            selected
                              ? "bg-blue-50/60"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={!customer.ready || sending}
                              onChange={() =>
                                toggleCustomer(customerId)
                              }
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label={`Select ${customer.customerName}`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {customer.customerName || "Customer"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {customer.barcode || customerId}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {customer.phone || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-800">
                              {customer.userId || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                customer.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {customer.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {customer.ready ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                                <XCircle className="h-4 w-4" />
                                Not Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Preview + send */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-green-100 p-2.5">
                  <MessageCircle className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">
                    WhatsApp Preview
                  </h2>
                  <p className="text-xs text-slate-500">
                    Uses the existing OM Tiffin template
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Message
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {getPreviewMessage(
                    selectedCustomers[0] ||
                      customers.find((customer) => customer.ready)
                  )}
                </p>
              </div>
              {selectedCustomers.length > 0 && (
                <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-700">
                    First selected recipient
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {selectedCustomers[0]?.customerName}
                  </p>
                  <p className="font-mono text-xs text-slate-600">
                    {selectedCustomers[0]?.userId}
                  </p>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">
                    Ready to send
                  </p>
                  <p className="mt-1 text-3xl font-bold text-blue-950">
                    {selectedCustomers.filter(
                      (customer) => customer.ready
                    ).length}
                  </p>
                </div>
                <Send className="h-9 w-9 text-blue-600" />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={
                  sending ||
                  selectedCustomers.filter(
                    (customer) => customer.ready
                  ).length === 0
                }
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Login ID on WhatsApp
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-blue-700">
                Only the selected customers will receive a WhatsApp
                message. Their current User ID is taken from the server.
              </p>
            </div>
            {sendResults && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">
                  Last Send Result
                </h2>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">
                      Total
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {sendResults.total || 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3">
                    <p className="text-xs text-green-600">
                      Sent
                    </p>
                    <p className="text-xl font-bold text-green-700">
                      {sendResults.sent || 0}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-600">
                      Failed
                    </p>
                    <p className="text-xl font-bold text-red-700">
                      {sendResults.failed || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerLoginIdSender;
