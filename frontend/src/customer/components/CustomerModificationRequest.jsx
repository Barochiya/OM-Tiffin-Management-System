import "./CustomerModificationRequest.css";
import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaMinus,
  FaPaperPlane,
  FaPlus,
  FaSyncAlt,
  FaTimesCircle,
} from "react-icons/fa";
import {
  createModificationRequest,
  getCustomerModificationRequests,
} from "../../services/customerModificationService";
import { getPublicMenuItems } from "../../services/websiteMenuService";
const REQUEST_TYPES = [
  { value: "SKIP_TIFFIN", label: "Skip Tiffin" },
  { value: "EXTRA_TIFFIN", label: "Extra Tiffin / Extra Item" },
  { value: "MEAL_MODIFICATION", label: "Modify Meal" },
];
const SKIP_MEALS = [
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "BOTH", label: "Lunch + Dinner" },
];
const PRODUCT_MEALS = [
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
];
const MODIFY_MEALS = [
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "BOTH", label: "Lunch + Dinner" },
];
const STATUS_META = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800",
    icon: FaClock,
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800",
    icon: FaCheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
    icon: FaTimesCircle,
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-blue-100 text-blue-800",
    icon: FaCheckCircle,
  },
};
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const isProductRequest = (requestType) =>
  requestType === "EXTRA_TIFFIN" ||
  requestType === "MEAL_MODIFICATION";
export default function CustomerModificationRequest() {
  const [requestDate, setRequestDate] = useState(getToday());
  const [requestType, setRequestType] = useState("SKIP_TIFFIN");
  const [meal, setMeal] = useState("LUNCH");
  const [description, setDescription] = useState("");
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const loadRequests = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoadingRequests(true);
      }
      setError("");
      const response = await getCustomerModificationRequests();
      setRequests(
        Array.isArray(response?.data) ? response.data : []
      );
    } catch (err) {
      console.error(
        "Customer modification requests error:",
        err
      );
      setError(
        err?.response?.data?.message ||
          "Unable to load your modification requests."
      );
    } finally {
      setLoadingRequests(false);
      setRefreshing(false);
    }
  };
  const loadMenuItems = async () => {
    if (!isProductRequest(requestType)) {
      setMenuItems([]);
      return;
    }
    try {
      setLoadingMenu(true);
      setError("");
      let response;
      if (meal === "LUNCH") {
        response = await getPublicMenuItems("Lunch");
      } else if (meal === "DINNER") {
        response = await getPublicMenuItems("Dinner");
      } else {
        response = await getPublicMenuItems();
      }
      const items = Array.isArray(response?.data)
        ? response.data
        : [];
      const filteredItems = items.filter((item) => {
        if (!item?.isAvailable) return false;
        // Extra Tiffin / Extra Item:
        // BOTH products must never appear.
        if (
          requestType === "EXTRA_TIFFIN" &&
          item.mealType === "Both"
        ) {
          return false;
        }
        // Lunch + Dinner is available only for Modify Meal.
        if (
          meal === "BOTH" &&
          requestType === "EXTRA_TIFFIN"
        ) {
          return false;
        }
        return true;
      });
      setMenuItems(filteredItems);
    } catch (err) {
      console.error("Customer modification menu error:", err);
      setMenuItems([]);
      setError(
        err?.response?.data?.message ||
          "Unable to load available menu items."
      );
    } finally {
      setLoadingMenu(false);
    }
  };
  useEffect(() => {
    loadRequests();
  }, []);
  useEffect(() => {
    if (requestType === "EXTRA_TIFFIN") {
      setMeal((currentMeal) =>
        currentMeal === "BOTH" ? "LUNCH" : currentMeal
      );
    }
    setSelectedItems([]);
    setMenuItems([]);
  }, [requestType]);
  useEffect(() => {
    if (isProductRequest(requestType)) {
      setSelectedItems([]);
      loadMenuItems();
    } else {
      setMenuItems([]);
      setSelectedItems([]);
    }
  }, [requestType, meal]);
  const requestTypeLabel = useMemo(() => {
    return (
      REQUEST_TYPES.find(
        (item) => item.value === requestType
      )?.label || requestType
    );
  }, [requestType]);
  const selectedTotal = useMemo(
    () =>
      selectedItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [selectedItems]
  );
  const addProduct = (menuItem) => {
    setSelectedItems((current) => {
      const existing = current.find(
        (item) => item.menuItem === menuItem._id
      );
      if (existing) {
        return current.map((item) =>
          item.menuItem === menuItem._id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }
      return [
        ...current,
        {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: Number(menuItem.price || 0),
          quantity: 1,
        },
      ];
    });
  };
  const updateQuantity = (menuItemId, delta) => {
    setSelectedItems((current) =>
      current
        .map((item) =>
          item.menuItem === menuItemId
            ? {
                ...item,
                quantity: item.quantity + delta,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };
  const getSelectedQuantity = (menuItemId) =>
    selectedItems.find(
      (item) => item.menuItem === menuItemId
    )?.quantity || 0;
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      setMessage("");
      setError("");
      if (
        isProductRequest(requestType) &&
        selectedItems.length === 0
      ) {
        setError(
          "Please select at least one product before submitting."
        );
        return;
      }
      await createModificationRequest({
        requestType,
        requestDate,
        meal,
        description: description.trim(),
        items: selectedItems.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
        })),
      });
      setMessage(
        `${requestTypeLabel} request submitted successfully.`
      );
      setDescription("");
      setSelectedItems([]);
      await loadRequests(true);
    } catch (err) {
      console.error(
        "Create modification request error:",
        err
      );
      setError(
        err?.response?.data?.message ||
          "Unable to submit your modification request."
      );
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <section className="customer-modification-page space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
            Service Requests
          </p>
          <h3 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
            Tiffin Modification Request
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Request a skip, extra tiffin, or meal modification.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadRequests(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSyncAlt
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="modification-request-date"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Request Date
              </label>
              <div className="relative">
                <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="modification-request-date"
                  type="date"
                  value={requestDate}
                  min={getToday()}
                  onChange={(event) =>
                    setRequestDate(event.target.value)
                  }
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="modification-request-type"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Request Type
              </label>
              <select
                id="modification-request-type"
                value={requestType}
                onChange={(event) =>
                  setRequestType(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                {REQUEST_TYPES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="modification-meal"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Meal
              </label>
              <select
                id="modification-meal"
                value={meal}
                onChange={(event) =>
                  setMeal(event.target.value)
                }
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              >
                {(requestType === "EXTRA_TIFFIN"
                  ? PRODUCT_MEALS
                  : requestType === "MEAL_MODIFICATION"
                    ? MODIFY_MEALS
                    : SKIP_MEALS
                ).map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-400">
                Lunch cutoff and dinner cutoff are controlled
                by the administrator.
              </p>
            </div>
          </div>
          {isProductRequest(requestType) && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Select Products
                  </p>
                  <p className="text-xs text-slate-500">
                    Choose the items and adjust quantity.
                  </p>
                </div>
                {selectedItems.length > 0 && (
                  <div className="text-sm font-bold text-blue-700">
                    Selected Total: &#8377;
                    {selectedTotal.toFixed(2)}
                  </div>
                )}
              </div>
              {loadingMenu ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Loading available menu items...
                </div>
              ) : menuItems.length === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-700">
                  No available products found for the selected
                  meal.
                </div>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {menuItems.map((item) => {
                    const quantity = getSelectedQuantity(
                      item._id
                    );
                    return (
                      <div
                        key={item._id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-800">
                              {item.name}
                            </h5>
                            {item.description && (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.description}
                              </p>
                            )}
                            <p className="mt-2 text-sm font-bold text-blue-700">
                              &#8377;
                              {Number(
                                item.price || 0
                              ).toFixed(2)}
                            </p>
                          </div>
                          {quantity === 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                addProduct(item)
                              }
                              disabled={submitting}
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                            >
                              <FaPlus />
                              Add
                            </button>
                          ) : (
                            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item._id,
                                    -1
                                  )
                                }
                                disabled={submitting}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm hover:bg-blue-100"
                              >
                                <FaMinus />
                              </button>
                              <span className="min-w-6 text-center text-sm font-bold text-slate-800">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item._id,
                                    1
                                  )
                                }
                                disabled={submitting}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                              >
                                <FaPlus />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedItems.length > 0 && (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">
                      Selected Products
                    </p>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedItems.length} item
                      {selectedItems.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedItems.map((item) => (
                      <div
                        key={item.menuItem}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                      >
                        <span className="text-sm font-semibold text-slate-700">
                          {item.name} &#215; {item.quantity}
                        </span>
                        <span className="text-sm font-bold text-slate-800">
                          &#8377;
                          {(
                            Number(item.price || 0) *
                            Number(item.quantity || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  const firstAvailable = menuItems.find(
                    (item) =>
                      !selectedItems.some(
                        (selected) =>
                          selected.menuItem === item._id
                      )
                  );
                  if (firstAvailable) {
                    addProduct(firstAvailable);
                  }
                }}
                disabled={
                  submitting ||
                  loadingMenu ||
                  menuItems.every((item) =>
                    selectedItems.some(
                      (selected) =>
                        selected.menuItem === item._id
                    )
                  )
                }
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FaPlus />
                Add More Product
              </button>
            </div>
          )}
          <div>
            <label
              htmlFor="modification-description"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Reason / Description
            </label>
            <textarea
              id="modification-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              maxLength={1000}
              rows={4}
              placeholder="Enter your reason or additional details..."
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {description.length}/1000
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Before submitting
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Requests are reviewed by OM Tiffin Service.
                Cutoff rules are checked automatically.
              </p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaPaperPlane />
              {submitting
                ? "Submitting..."
                : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">
            History
          </p>
          <h4 className="mt-1 text-lg sm:text-xl font-bold text-slate-900">
            My Modification Requests
          </h4>
        </div>
        {loadingRequests ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading your requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-semibold text-slate-700">
              No requests yet
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Your submitted modification requests will
              appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((request) => {
              const status =
                STATUS_META[request.status] ||
                STATUS_META.PENDING;
              const StatusIcon = status.icon;
              return (
                <div
                  key={request._id}
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {REQUEST_TYPES.find(
                            (item) =>
                              item.value ===
                              request.requestType
                          )?.label ||
                            request.requestType}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.className}`}
                        >
                          <StatusIcon />
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>
                          Date:{" "}
                          <strong className="text-slate-700">
                            {formatDate(
                              request.requestDate
                            )}
                          </strong>
                        </span>
                        <span>
                          Meal:{" "}
                          <strong className="text-slate-700">
                            {[
                              ...SKIP_MEALS,
                              ...MODIFY_MEALS,
                            ].find(
                              (item) =>
                                item.value ===
                                request.meal
                            )?.label ||
                              request.meal ||
                              "—"}
                          </strong>
                        </span>
                      </div>
                      {Array.isArray(request.items) &&
                        request.items.length > 0 && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Products
                            </p>
                            <div className="mt-2 space-y-1.5">
                              {request.items.map(
                                (item, index) => (
                                  <div
                                    key={
                                      item.menuItem ||
                                      index
                                    }
                                    className="flex justify-between gap-3 text-sm"
                                  >
                                    <span className="font-medium text-slate-700">
                                      {item.name} &#215;{" "}
                                      {item.quantity}
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      &#8377;
                                      {(
                                        Number(
                                          item.price || 0
                                        ) *
                                        Number(
                                          item.quantity ||
                                            0
                                        )
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      {request.description && (
                        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                          {request.description}
                        </div>
                      )}
                      {request.adminRemark && (
                        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                          <span className="font-bold">
                            Admin Remark:
                          </span>{" "}
                          {request.adminRemark}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
