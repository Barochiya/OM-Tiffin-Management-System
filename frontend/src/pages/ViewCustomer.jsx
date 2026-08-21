import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaUser,
  FaUtensils,
  FaRupeeSign,
  FaCheckCircle,
  FaSave,
  FaTimes,
  FaSpinner,
  FaPlus,
  FaTrash,
} from "react-icons/fa";

import { getCustomerById } from "../services/customerService";
import {
  getCustomerEntries,
  saveDailyEntry,
} from "../services/dailyEntryService";

export default function ViewCustomer() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // =======================================
// Daily Meal Entries
// =======================================

const [dailyEntries, setDailyEntries] = useState([]);
const [dailyEntriesLoading, setDailyEntriesLoading] = useState(false);

const [selectedMonth, setSelectedMonth] = useState(
  new Date().getMonth() + 1
);

const [selectedYear, setSelectedYear] = useState(
  new Date().getFullYear()
);

const [selectedCycle, setSelectedCycle] = useState("2");

const [editingEntryId, setEditingEntryId] = useState(null);
const [savingEntryId, setSavingEntryId] = useState(null);

  useEffect(() => {
    loadCustomer();
  }, [id]);

  // =======================================
// Load Customer Daily Entries
// =======================================

useEffect(() => {
  if (!id) return;

  loadDailyEntries();
}, [id, selectedMonth, selectedYear, selectedCycle]);

const loadDailyEntries = async () => {
  try {
    setDailyEntriesLoading(true);

    const response = await getCustomerEntries(
      id,
      selectedMonth,
      selectedYear,
      selectedCycle
    );

    const savedEntries = response?.data || [];

    // =======================================
    // CURRENT DATE LIMIT
    // =======================================

    const today = new Date();

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    // =======================================
    // CYCLE START / END
    // =======================================

    let cycleStartDay;
    let cycleEndDay;

    if (String(selectedCycle) === "1") {
      // Cycle 1 = 1 to 15
      cycleStartDay = 1;
      cycleEndDay = 15;
    } else {
      // Cycle 2 = 16 to month end
      cycleStartDay = 16;

      cycleEndDay = new Date(
        selectedYear,
        selectedMonth,
        0
      ).getDate();
    }

    // =======================================
    // IF SELECTED MONTH IS CURRENT MONTH
    // DON'T SHOW FUTURE DATES
    // =======================================

    if (
      Number(selectedYear) === currentYear &&
      Number(selectedMonth) === currentMonth
    ) {
      cycleEndDay = Math.min(
        cycleEndDay,
        currentDay
      );
    }

    // =======================================
    // IF SELECTED MONTH IS FUTURE
    // SHOW NOTHING
    // =======================================

    const selectedMonthDate = new Date(
      Number(selectedYear),
      Number(selectedMonth) - 1,
      1
    );

    const currentMonthDate = new Date(
      currentYear,
      currentMonth - 1,
      1
    );

    if (selectedMonthDate > currentMonthDate) {
      setDailyEntries([]);
      setEditingEntryId(null);
      return;
    }

    // =======================================
// CREATE DATE-WISE ENTRIES
// INCLUDING MISSING DATES
// =======================================

const entryMap = new Map();

// Backend stored dates को calendar date के हिसाब से map करें
savedEntries.forEach((entry) => {
  const entryDate = new Date(entry.date);

  const key = `${entryDate.getUTCFullYear()}-${String(
    entryDate.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(
    entryDate.getUTCDate()
  ).padStart(2, "0")}`;

  entryMap.set(key, entry);
});

const generatedEntries = [];

for (
  let day = cycleStartDay;
  day <= cycleEndDay;
  day++
) {
  const key = `${Number(selectedYear)}-${String(
    Number(selectedMonth)
  ).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;

  const existingEntry = entryMap.get(key);

  if (existingEntry) {
    generatedEntries.push(existingEntry);
  } else {
    // Calendar date को directly UTC midnight पर बनाएं.
    // Local Date + toISOString() use नहीं करना है.
    const dateString = `${Number(selectedYear)}-${String(
      Number(selectedMonth)
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

    generatedEntries.push({
      _id: `new-${key}`,

      customer: id,

      date: `${dateString}T00:00:00.000Z`,

      breakfastQty: 0,
      lunchQty: 0,
      dinnerQty: 0,

      extraItems: [],

      remark: "",

      isNewEntry: true,
    });
  }
}

setDailyEntries(generatedEntries);
setEditingEntryId(null);
  } catch (error) {
    console.error(
      "Load customer daily entries error:",
      error
    );

    alert(
      error?.response?.data?.message ||
        "Failed to load daily meal entries."
    );
  } finally {
    setDailyEntriesLoading(false);
  }
};

// =======================================
// Edit Daily Entry
// =======================================

const handleEditEntry = (entryId) => {
  setEditingEntryId(entryId);
};

// =======================================
// Cancel Daily Entry Edit
// =======================================

const handleCancelEdit = () => {
  setEditingEntryId(null);
};

// =======================================
// Change Daily Entry Field
// =======================================

const handleDailyEntryChange = (
  entryId,
  field,
  value
) => {
  setDailyEntries((prev) =>
    prev.map((entry) =>
      entry._id === entryId
        ? {
            ...entry,
            [field]:
              field === "remark"
                ? value
                : Math.max(0, Number(value)),
          }
        : entry
    )
  );
};

// =======================================
// Change Extra Item
// =======================================

const handleDailyExtraItemChange = (
  entryId,
  index,
  field,
  value
) => {
  setDailyEntries((prev) =>
    prev.map((entry) => {
      if (entry._id !== entryId) {
        return entry;
      }

      const extraItems = Array.isArray(
        entry.extraItems
      )
        ? [...entry.extraItems]
        : [];

      extraItems[index] = {
        ...extraItems[index],
        [field]:
          field === "amount"
            ? Math.max(0, Number(value))
            : value,
      };

      return {
        ...entry,
        extraItems,
      };
    })
  );
};

// =======================================
// Add Extra Item
// =======================================

const handleAddDailyExtraItem = (entryId) => {
  setDailyEntries((prev) =>
    prev.map((entry) =>
      entry._id === entryId
        ? {
            ...entry,
            extraItems: [
              ...(Array.isArray(entry.extraItems)
                ? entry.extraItems
                : []),
              {
                description: "",
                amount: 0,
              },
            ],
          }
        : entry
    )
  );
};

// =======================================
// Remove Extra Item
// =======================================

const handleRemoveDailyExtraItem = (
  entryId,
  index
) => {
  setDailyEntries((prev) =>
    prev.map((entry) => {
      if (entry._id !== entryId) {
        return entry;
      }

      const extraItems = Array.isArray(
        entry.extraItems
      )
        ? [...entry.extraItems]
        : [];

      extraItems.splice(index, 1);

      return {
        ...entry,
        extraItems,
      };
    })
  );
};

// =======================================
// Save Edited Daily Entry
// =======================================

const handleSaveDailyEntry = async (entryId) => {
  const entry = dailyEntries.find(
    (item) => item._id === entryId
  );

  if (!entry) return;

  try {
    setSavingEntryId(entryId);

    await saveDailyEntry({
      customer: id,
      date: entry.date,

      breakfastQty: Number(
        entry.breakfastQty || 0
      ),

      lunchQty: Number(
        entry.lunchQty || 0
      ),

      dinnerQty: Number(
        entry.dinnerQty || 0
      ),

      extraItems: Array.isArray(
        entry.extraItems
      )
        ? entry.extraItems.map((item) => ({
            description:
              item.description || "",
            amount: Number(
              item.amount || 0
            ),
          }))
        : [],

      remark: entry.remark || "",
    });

    setEditingEntryId(null);

    // Reload from backend so UI shows
    // the actual saved data.
    await loadDailyEntries();

    alert("Daily entry saved successfully.");
  } catch (error) {
    console.error(
      "Save Daily Entry Error:",
      error
    );

    alert(
      error?.response?.data?.message ||
        "Failed to save daily entry."
    );
  } finally {
    setSavingEntryId(null);
  }
};

  const loadCustomer = async () => {
    try {
      setLoading(true);

      const response = await getCustomerById(id);
      setCustomer(response?.data || response);
    } catch (error) {
      console.error("Load customer error:", error);

      alert(
        error.response?.data?.message ||
          "❌ Failed to load customer"
      );

      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500">
          Loading customer details...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Customer not found.</p>

        <button
          type="button"
          onClick={() => navigate("/customers")}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <div className="w-full max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Customer Details
            </h1>

            <p className="text-gray-500 mt-2">
              View customer information and pricing
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/customers"
              className="inline-flex items-center gap-2 border border-slate-300 hover:bg-white px-4 py-3 rounded-xl font-semibold text-slate-700"
            >
              <FaArrowLeft />
              Back
            </Link>

            <Link
              to={`/edit-customer/${customer._id}`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold"
            >
              <FaEdit />
              Edit
            </Link>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-7 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center">
                <FaUser className="text-3xl" />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl sm:text-3xl font-bold break-words">
                  {customer.customerName}
                </h2>

                <p className="mt-1 opacity-90">
                  {customer.phone}
                </p>
              </div>

              <span
                className={`sm:ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                  customer.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <FaCheckCircle />
                {customer.status || "Active"}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaUser className="text-xl text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-800">
                    Customer Information
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Customer Name
                    </p>
                    <p className="text-lg font-semibold text-slate-800 mt-1">
                      {customer.customerName}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaPhone className="text-green-600 mt-1" />

                    <div>
                      <p className="text-sm text-gray-500">
                        Phone
                      </p>
                      <p className="font-semibold mt-1">
                        {customer.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-red-500 mt-1" />

                    <div>
                      <p className="text-sm text-gray-500">
                        Address
                      </p>
                      <p className="font-semibold mt-1 leading-6">
                        {customer.address || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <FaUtensils className="text-xl text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-800">
                    Meal & Payment
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Meal Type
                    </p>
                    <p className="font-semibold mt-1">
                      {customer.mealType || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Monthly Price
                    </p>
                    <p className="font-semibold text-green-600 mt-1">
                      ₹{customer.price || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Payment Status
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold ${
                        customer.paymentStatus === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.paymentStatus || "Pending"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Pending Amount
                    </p>
                    <p className="font-semibold text-red-600 mt-1">
                      ₹{customer.pendingAmount || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

                    {/* =======================================
            CUSTOMER DAILY MEAL ENTRIES
        ======================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-6 text-white">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Daily Meal Entries
                </h3>

                <p className="text-sm text-white/80 mt-1">
                  View and manage customer-wise daily meal records.
                </p>
              </div>

              {/* Month / Cycle Controls */}
              <div className="flex flex-col sm:flex-row gap-3">

                {/* Month */}
                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    setSelectedMonth(Number(e.target.value))
                  }
                  className="
                    bg-white
                    text-slate-800
                    border
                    border-white/30
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    outline-none
                    min-w-[150px]
                  "
                >
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((monthName, index) => (
                    <option
                      key={index + 1}
                      value={index + 1}
                    >
                      {monthName}
                    </option>
                  ))}
                </select>

                {/* Year */}
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    setSelectedYear(Number(e.target.value))
                  }
                  className="
                    bg-white
                    text-slate-800
                    border
                    border-white/30
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    outline-none
                    min-w-[110px]
                  "
                >
                  {[selectedYear - 1, selectedYear, selectedYear + 1].map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>

                {/* Cycle */}
                <select
                  value={selectedCycle}
                  onChange={(e) =>
                    setSelectedCycle(e.target.value)
                  }
                  className="
                    bg-white
                    text-slate-800
                    border
                    border-white/30
                    rounded-xl
                    px-4
                    py-3
                    font-semibold
                    outline-none
                    min-w-[140px]
                  "
                >
                  <option value="1">
                    Cycle 1 (1–15)
                  </option>

                  <option value="2">
                    Cycle 2 (16–End)
                  </option>
                </select>

              </div>

            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-6">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
                <p className="text-sm text-slate-500">
                  Breakfast
                </p>

                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {dailyEntries.reduce(
                    (sum, entry) =>
                      sum + Number(entry.breakfastQty || 0),
                    0
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-slate-500">
                  Lunch
                </p>

                <p className="text-2xl font-bold text-green-600 mt-1">
                  {dailyEntries.reduce(
                    (sum, entry) =>
                      sum + Number(entry.lunchQty || 0),
                    0
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
                <p className="text-sm text-slate-500">
                  Dinner
                </p>

                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {dailyEntries.reduce(
                    (sum, entry) =>
                      sum + Number(entry.dinnerQty || 0),
                    0
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm text-slate-500">
                  Days Recorded
                </p>

                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {dailyEntries.length}
                </p>
              </div>

            </div>

          </div>

        </div>

            {/* Pricing */}
                    {/* =======================================
            DATE-WISE DAILY ENTRIES
        ======================================= */}

        <div className="mt-6 rounded-2xl border border-slate-200 overflow-hidden">

          <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-800">
              Date-wise Meal Records
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Daily meals recorded for the selected billing cycle.
            </p>
          </div>

          {dailyEntriesLoading ? (

            <div className="p-10 text-center">
              <p className="text-slate-500">
                Loading daily meal entries...
              </p>
            </div>

          ) : dailyEntries.length === 0 ? (

            <div className="p-10 text-center">
              <p className="text-slate-500 font-medium">
                No meal entries found.
              </p>

              <p className="text-sm text-slate-400 mt-1">
                Try another month or billing cycle.
              </p>
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px]">

                <thead className="bg-slate-100">

                  <tr>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Date
                    </th>

                    <th className="px-4 py-4 text-center text-sm font-semibold text-orange-600">
                      Breakfast
                    </th>

                    <th className="px-4 py-4 text-center text-sm font-semibold text-green-600">
                      Lunch
                    </th>

                    <th className="px-4 py-4 text-center text-sm font-semibold text-indigo-600">
                      Dinner
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Extra Items
                    </th>

                    <th className="px-5 py-4 text-left text-sm font-semibold text-slate-600">
                      Remark
                    </th>

                    <th className="px-5 py-4 text-right text-sm font-semibold text-slate-600">
                      Total
                    </th>

                    <th className="px-5 py-4 text-center text-sm font-semibold text-slate-600">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

  {dailyEntries.map((entry) => {

    const isEditing =
      editingEntryId === entry._id;

    const isSaving =
      savingEntryId === entry._id;

    const entryDate = new Date(entry.date);

const formattedDate = entryDate.toLocaleDateString(
  "en-IN",
  {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
);

    // =======================================
// DAY-WISE TOTAL
// =======================================

const breakfastQty = Number(entry.breakfastQty || 0);
const lunchQty = Number(entry.lunchQty || 0);
const dinnerQty = Number(entry.dinnerQty || 0);

const breakfastPrice = Number(
  customer.pricing?.breakfastPrice || 0
);

const lunchPrice = Number(
  customer.pricing?.lunchPrice || 0
);

const dinnerPrice = Number(
  customer.pricing?.dinnerPrice || 0
);

const extraAmount = Array.isArray(entry.extraItems)
  ? entry.extraItems.reduce(
      (sum, item) =>
        sum + Number(item?.amount || 0),
      0
    )
  : 0;

const dailyTotal =
  breakfastQty * breakfastPrice +
  lunchQty * lunchPrice +
  dinnerQty * dinnerPrice +
  extraAmount;

    return (
      <tr
        key={entry._id}
        className="
          border-b
          border-slate-200
          last:border-b-0
          hover:bg-slate-50
          transition
        "
      >

        {/* DATE */}
        <td className="px-5 py-4 align-top">
          <span className="font-semibold text-slate-800">
            {formattedDate}
          </span>
        </td>

        {/* BREAKFAST */}
        <td className="px-4 py-4 text-center align-top">

          {isEditing ? (

            <input
              type="number"
              min="0"
              value={entry.breakfastQty || 0}
              onChange={(e) =>
                handleDailyEntryChange(
                  entry._id,
                  "breakfastQty",
                  e.target.value
                )
              }
              className="
                w-[70px]
                mx-auto
                border
                border-slate-300
                rounded-lg
                px-2
                py-2
                text-center
                font-semibold
                outline-none
                focus:ring-2
                focus:ring-orange-400
              "
            />

          ) : (

            <span className="
              inline-flex
              min-w-[45px]
              justify-center
              px-3
              py-1.5
              rounded-lg
              bg-orange-50
              text-orange-700
              font-bold
            ">
              {Number(entry.breakfastQty || 0)}
            </span>

          )}

        </td>

        {/* LUNCH */}
        <td className="px-4 py-4 text-center align-top">

          {isEditing ? (

            <input
              type="number"
              min="0"
              value={entry.lunchQty || 0}
              onChange={(e) =>
                handleDailyEntryChange(
                  entry._id,
                  "lunchQty",
                  e.target.value
                )
              }
              className="
                w-[70px]
                mx-auto
                border
                border-slate-300
                rounded-lg
                px-2
                py-2
                text-center
                font-semibold
                outline-none
                focus:ring-2
                focus:ring-green-400
              "
            />

          ) : (

            <span className="
              inline-flex
              min-w-[45px]
              justify-center
              px-3
              py-1.5
              rounded-lg
              bg-green-50
              text-green-700
              font-bold
            ">
              {Number(entry.lunchQty || 0)}
            </span>

          )}

        </td>

        {/* DINNER */}
        <td className="px-4 py-4 text-center align-top">

          {isEditing ? (

            <input
              type="number"
              min="0"
              value={entry.dinnerQty || 0}
              onChange={(e) =>
                handleDailyEntryChange(
                  entry._id,
                  "dinnerQty",
                  e.target.value
                )
              }
              className="
                w-[70px]
                mx-auto
                border
                border-slate-300
                rounded-lg
                px-2
                py-2
                text-center
                font-semibold
                outline-none
                focus:ring-2
                focus:ring-indigo-400
              "
            />

          ) : (

            <span className="
              inline-flex
              min-w-[45px]
              justify-center
              px-3
              py-1.5
              rounded-lg
              bg-indigo-50
              text-indigo-700
              font-bold
            ">
              {Number(entry.dinnerQty || 0)}
            </span>

          )}

        </td>

        {/* EXTRA ITEMS */}
        <td className="px-5 py-4 align-top">

          {isEditing ? (

            <div className="space-y-2 min-w-[220px]">

              {(Array.isArray(entry.extraItems)
                ? entry.extraItems
                : []
              ).map((item, index) => (

                <div
                  key={index}
                  className="flex items-center gap-2"
                >

                  <input
                    type="text"
                    placeholder="Description"
                    value={
                      item.description || ""
                    }
                    onChange={(e) =>
                      handleDailyExtraItemChange(
                        entry._id,
                        index,
                        "description",
                        e.target.value
                      )
                    }
                    className="
                      flex-1
                      min-w-0
                      border
                      border-slate-300
                      rounded-lg
                      px-2
                      py-2
                      text-sm
                      outline-none
                      focus:ring-2
                      focus:ring-blue-400
                    "
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="₹"
                    value={
                      item.amount || 0
                    }
                    onChange={(e) =>
                      handleDailyExtraItemChange(
                        entry._id,
                        index,
                        "amount",
                        e.target.value
                      )
                    }
                    className="
                      w-[75px]
                      border
                      border-slate-300
                      rounded-lg
                      px-2
                      py-2
                      text-sm
                      text-center
                      outline-none
                      focus:ring-2
                      focus:ring-blue-400
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveDailyExtraItem(
                        entry._id,
                        index
                      )
                    }
                    className="
                      w-8
                      h-8
                      flex
                      items-center
                      justify-center
                      rounded-lg
                      text-red-500
                      hover:bg-red-50
                      transition
                    "
                    title="Remove extra item"
                  >
                    <FaTrash className="text-xs" />
                  </button>

                </div>

              ))}

              <button
                type="button"
                onClick={() =>
                  handleAddDailyExtraItem(
                    entry._id
                  )
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-blue-600
                  hover:text-blue-800
                "
              >
                <FaPlus className="text-xs" />
                Add Extra Item
              </button>

            </div>

          ) : (

            Array.isArray(entry.extraItems) &&
            entry.extraItems.length > 0 ? (

              <div className="space-y-1.5">

                {entry.extraItems.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="text-sm"
                    >

                      <span className="font-medium text-slate-700">
                        {item.description || "-"}
                      </span>

                      <span className="text-slate-500 ml-2">
                        ₹{Number(item.amount || 0)}
                      </span>

                    </div>

                  )
                )}

              </div>

            ) : (

              <span className="text-sm text-slate-400">
                —
              </span>

            )

          )}

        </td>

        {/* REMARK */}
        <td className="px-5 py-4 align-top">

          {isEditing ? (

            <input
              type="text"
              placeholder="Remark"
              value={entry.remark || ""}
              onChange={(e) =>
                handleDailyEntryChange(
                  entry._id,
                  "remark",
                  e.target.value
                )
              }
              className="
                w-full
                min-w-[150px]
                border
                border-slate-300
                rounded-lg
                px-3
                py-2
                text-sm
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
            />

          ) : (

            <span className="text-sm text-slate-600">
              {entry.remark || "—"}
            </span>

          )}

        </td>

        {/* TOTAL */}
<td className="px-5 py-4 text-right align-top">

  <span className="
    inline-flex
    items-center
    justify-end
    min-w-[100px]
    px-3
    py-2
    rounded-lg
    bg-blue-50
    text-blue-700
    font-bold
  ">
    ₹{dailyTotal.toLocaleString("en-IN")}
  </span>

</td>

        {/* ACTION */}
        <td className="px-5 py-4 text-center align-top">

          {isEditing ? (

            <div className="
              flex
              flex-col
              sm:flex-row
              items-center
              justify-center
              gap-2
            ">

              <button
                type="button"
                onClick={() =>
                  handleSaveDailyEntry(
                    entry._id
                  )
                }
                disabled={isSaving}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  min-w-[90px]
                  px-3
                  py-2
                  rounded-lg
                  bg-green-600
                  hover:bg-green-700
                  disabled:bg-slate-400
                  text-white
                  text-sm
                  font-bold
                  transition
                "
              >

                {isSaving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <FaSave />
                    Save
                  </>
                )}

              </button>

              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  min-w-[90px]
                  px-3
                  py-2
                  rounded-lg
                  bg-slate-200
                  hover:bg-slate-300
                  disabled:opacity-50
                  text-slate-700
                  text-sm
                  font-bold
                  transition
                "
              >
                <FaTimes />
                Cancel
              </button>

            </div>

          ) : (

            <button
              type="button"
              onClick={() =>
                handleEditEntry(entry._id)
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                min-w-[90px]
                px-3
                py-2
                rounded-lg
                bg-blue-600
                hover:bg-blue-700
                text-white
                text-sm
                font-bold
                transition
              "
            >
              <FaEdit />
              Edit
            </button>

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
            <div className="mt-6 rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaRupeeSign className="text-xl text-indigo-600" />

                <h3 className="text-xl font-bold text-slate-800">
                  Customer Pricing
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Breakfast
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    ₹
                    {customer.pricing?.breakfastPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Lunch
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    ₹
                    {customer.pricing?.lunchPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Dinner
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    ₹
                    {customer.pricing?.dinnerPrice ??
                      0}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">
                    Pricing Type
                  </p>
                  <p className="text-lg font-bold text-slate-800 mt-2 capitalize">
                    {customer.pricing?.pricingType ||
                      "default"}
                  </p>
                </div>
              </div>

              {(customer.pricing?.extraCharge ||
                customer.pricing?.discount) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Extra Charge
                    </p>
                    <p className="font-semibold mt-1">
                      ₹{customer.pricing?.extraCharge || 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">
                      Discount
                    </p>
                    <p className="font-semibold mt-1">
                      {customer.pricing?.discount || 0}
                      {customer.pricing?.discountType ===
                      "percentage"
                        ? "%"
                        : " ₹"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
