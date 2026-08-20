import { useEffect, useState } from "react";

import {
  FaCalendarAlt,
  FaUsers,
  FaCoffee,
  FaUtensils,
  FaMoon,
  FaSave,
  FaPlus,
  FaTrash,
  FaCheck,
  FaSpinner,
} from "react-icons/fa";

import {
  getCustomersForEntry,
  getEntriesByDate,
  saveDailyEntry,
} from "../services/dailyEntryService";

export default function DailyEntry() {
  // =========================================
  // STATES
  // =========================================

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customers, setCustomers] = useState([]);
  const [entries, setEntries] = useState({});
  const [loading, setLoading] = useState(false);

  // Bulk-save states
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);

  // Tracks which customer rows have been edited
  const [dirtyRows, setDirtyRows] = useState({});

  // Individual customer save states
const [savingCustomerId, setSavingCustomerId] = useState(null);
const [savedCustomerId, setSavedCustomerId] = useState(null);

// Customer search
const [search, setSearch] = useState("");

  // =========================================
  // LOAD DATA
  // =========================================

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    try {
      setLoading(true);

      const customerRes = await getCustomersForEntry();
      const entryRes = await getEntriesByDate(date);

      const customerList = customerRes?.data || [];
      setCustomers(customerList);

      const temp = {};

      (entryRes?.data || []).forEach((item) => {
        if (!item.customer?._id) return;

        temp[item.customer._id] = {
          breakfastQty: Number(item.breakfastQty || 0),
          lunchQty: Number(item.lunchQty || 0),
          dinnerQty: Number(item.dinnerQty || 0),
          extraItems: Array.isArray(item.extraItems)
            ? item.extraItems
            : [],
          remark: item.remark || "",
        };
      });

      setEntries(temp);
      setDirtyRows({});
      setSavedAll(false);
    } catch (err) {
      console.error("Daily Entry Load Error:", err);

      alert(
        err?.response?.data?.message ||
          "Failed to load daily entries."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // HANDLE MEAL / REMARK CHANGE
  // =========================================

  const handleChange = (customerId, field, value) => {
    setEntries((prev) => ({
      ...prev,
      [customerId]: {
        breakfastQty:
          prev[customerId]?.breakfastQty || 0,

        lunchQty:
          prev[customerId]?.lunchQty || 0,

        dinnerQty:
          prev[customerId]?.dinnerQty || 0,

        extraItems:
          prev[customerId]?.extraItems || [],

        remark:
          prev[customerId]?.remark || "",

        ...prev[customerId],

        [field]:
          field === "remark"
            ? value
            : Math.max(0, Number(value)),
      },
    }));

    setDirtyRows((prev) => ({
      ...prev,
      [customerId]: true,
    }));

    setSavedAll(false);
  };

  // =========================================
  // ADD EXTRA ITEM
  // =========================================

  const addExtraItem = (customerId) => {
    setEntries((prev) => ({
      ...prev,

      [customerId]: {
        breakfastQty:
          prev[customerId]?.breakfastQty || 0,

        lunchQty:
          prev[customerId]?.lunchQty || 0,

        dinnerQty:
          prev[customerId]?.dinnerQty || 0,

        remark:
          prev[customerId]?.remark || "",

        ...prev[customerId],

        extraItems: [
          ...(prev[customerId]?.extraItems || []),
          {
            description: "",
            amount: 0,
          },
        ],
      },
    }));

    setDirtyRows((prev) => ({
      ...prev,
      [customerId]: true,
    }));

    setSavedAll(false);
  };

  // =========================================
  // REMOVE EXTRA ITEM
  // =========================================

  const removeExtraItem = (customerId, index) => {
    setEntries((prev) => {
      const items = [
        ...(prev[customerId]?.extraItems || []),
      ];

      items.splice(index, 1);

      return {
        ...prev,
        [customerId]: {
          ...prev[customerId],
          extraItems: items,
        },
      };
    });

    setDirtyRows((prev) => ({
      ...prev,
      [customerId]: true,
    }));

    setSavedAll(false);
  };

  // =========================================
  // EXTRA ITEM CHANGE
  // =========================================

  const handleExtraItemChange = (
    customerId,
    index,
    field,
    value
  ) => {
    setEntries((prev) => {
      const items = [
        ...(prev[customerId]?.extraItems || []),
      ];

      items[index] = {
        ...items[index],
        [field]:
          field === "amount"
            ? Math.max(0, Number(value))
            : value,
      };

      return {
        ...prev,
        [customerId]: {
          ...prev[customerId],
          extraItems: items,
        },
      };
    });

    setDirtyRows((prev) => ({
      ...prev,
      [customerId]: true,
    }));

    setSavedAll(false);
  };

// =========================================
// SAVE SINGLE CUSTOMER ENTRY
// =========================================

const handleSaveCustomer = async (customerId) => {
  if (!customerId) return;

  const data = entries[customerId] || {};

  try {
    setSavingCustomerId(customerId);
    setSavedCustomerId(null);

    await saveDailyEntry({
      customer: customerId,
      date,

      breakfastQty:
        Number(data.breakfastQty || 0),

      lunchQty:
        Number(data.lunchQty || 0),

      dinnerQty:
        Number(data.dinnerQty || 0),

      extraItems:
        Array.isArray(data.extraItems)
          ? data.extraItems
          : [],

      remark:
        data.remark || "",
    });

    // Mark only this customer as saved
    setDirtyRows((prev) => ({
      ...prev,
      [customerId]: false,
    }));

    setSavedCustomerId(customerId);

    setTimeout(() => {
      setSavedCustomerId((current) =>
        current === customerId
          ? null
          : current
      );
    }, 2500);

  } catch (error) {
    console.error(
      "Save Customer Daily Entry Error:",
      error
    );

    alert(
      error?.response?.data?.message ||
        "Failed to save customer entry. Please try again."
    );
  } finally {
    setSavingCustomerId(null);
  }
};

  // =========================================
  // SAVE ALL ENTRIES
  // =========================================

  const handleSaveAll = async () => {
    const dirtyCustomerIds = customers
      .map((customer) => customer._id)
      .filter((customerId) => dirtyRows[customerId]);

    if (dirtyCustomerIds.length === 0) {
      alert("No changes to save.");
      return;
    }

    try {
      setSavingAll(true);
      setSavedAll(false);

      // Save all changed customers together.
      await Promise.all(
        dirtyCustomerIds.map(async (customerId) => {
          const data = entries[customerId] || {};

          return saveDailyEntry({
            customer: customerId,
            date,

            breakfastQty:
              Number(data.breakfastQty || 0),

            lunchQty:
              Number(data.lunchQty || 0),

            dinnerQty:
              Number(data.dinnerQty || 0),

            extraItems:
              Array.isArray(data.extraItems)
                ? data.extraItems
                : [],

            remark:
              data.remark || "",
          });
        })
      );

      // Reload saved values from backend.
      await loadData();

      setSavedAll(true);

      setTimeout(() => {
        setSavedAll(false);
      }, 2500);
    } catch (error) {
      console.error(
        "Save All Daily Entries Error:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to save all entries. Please try again."
      );
    } finally {
      setSavingAll(false);
    }
  };

  // =========================================
  // SUMMARY
  // =========================================

  const totalCustomers = customers.length;

  const totalBreakfast = customers.reduce(
    (sum, customer) =>
      sum +
      Number(
        entries[customer._id]?.breakfastQty || 0
      ),
    0
  );

  const totalLunch = customers.reduce(
    (sum, customer) =>
      sum +
      Number(
        entries[customer._id]?.lunchQty || 0
      ),
    0
  );

  const totalDinner = customers.reduce(
    (sum, customer) =>
      sum +
      Number(
        entries[customer._id]?.dinnerQty || 0
      ),
    0
  );

  const hasUnsavedChanges =
    Object.values(dirtyRows).some(Boolean);

    // =========================================
// SEARCHED CUSTOMERS
// =========================================

const filteredCustomers = customers.filter(
  (customer) => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return true;

    const name = String(
      customer.customerName || ""
    ).toLowerCase();

    const phone = String(
      customer.phone || ""
    ).toLowerCase();

    return (
      name.includes(query) ||
      phone.includes(query)
    );
  }
);

  // =========================================
  // PAGE UI
  // =========================================

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="w-full min-w-0 max-w-[1600px] mx-auto box-border px-0 sm:px-2 lg:px-4 py-2 sm:py-4 lg:py-6 overflow-x-hidden">

        {/* =====================================
            PAGE HEADER
        ===================================== */}

        <div className="mb-7">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 flex items-center gap-3">
                <span>🍱</span>
                Daily Meal Entry
              </h1>

              <p className="text-slate-500 mt-2">
                Manage customer meal entries quickly and easily.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 font-medium">
                Selected Date
              </p>

              <p className="text-sm font-bold text-slate-800 mt-1">
                {date}
              </p>
            </div>

          </div>
        </div>

        {/* =====================================
            SUMMARY CARDS
        ===================================== */}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-7">

          {/* Customers */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Customers
                </p>

                <h2 className="text-3xl font-bold text-slate-800 mt-1">
                  {totalCustomers}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <FaUsers className="text-blue-600 text-xl" />
              </div>

            </div>
          </div>

          {/* Breakfast */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Breakfast
                </p>

                <h2 className="text-3xl font-bold text-orange-600 mt-1">
                  {totalBreakfast}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <FaCoffee className="text-orange-500 text-xl" />
              </div>

            </div>
          </div>

          {/* Lunch */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Lunch
                </p>

                <h2 className="text-3xl font-bold text-green-600 mt-1">
                  {totalLunch}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <FaUtensils className="text-green-600 text-xl" />
              </div>

            </div>
          </div>

          {/* Dinner */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Dinner
                </p>

                <h2 className="text-3xl font-bold text-indigo-600 mt-1">
                  {totalDinner}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <FaMoon className="text-indigo-600 text-xl" />
              </div>

            </div>
          </div>

        </div>

        {/* =====================================
            DATE SELECTOR
        ===================================== */}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:p-6 mb-7">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

            <div>
              <label className="flex items-center gap-2 font-semibold text-slate-800 mb-2">
                <FaCalendarAlt className="text-blue-600" />
                Select Date
              </label>

              <p className="text-sm text-slate-500">
                Select the date for which you want to manage meals.
              </p>
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={savingAll}
              className="
                w-full sm:w-auto
                border border-slate-300
                rounded-xl
                px-4 py-3
                bg-white
                text-slate-800
                font-medium
                outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:border-blue-500
                transition
              "
            />

          </div>
        </div>

        {/* =====================================
            DAILY ENTRY TABLE
        ===================================== */}

        {loading ? (

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">

            <div className="flex flex-col items-center justify-center gap-4">

              <FaSpinner className="animate-spin text-blue-600 text-3xl" />

              <div>
                <h2 className="text-lg font-semibold text-slate-700">
                  Loading Customers...
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Please wait while we load today's entries.
                </p>
              </div>

            </div>
          </div>

        ) : (

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Table Title */}
<div className="px-5 lg:px-6 py-5 border-b border-slate-200">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

    <div>
      <h2 className="text-xl font-bold text-slate-800">
        Customer Meal Entries
      </h2>

      <p className="text-sm text-slate-500 mt-1">
        Update meals, extra items and remarks for each customer.
      </p>
    </div>

    <div className="flex flex-col sm:flex-row gap-3">

      {/* Search */}
      <div className="relative">

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search customer..."
          className="
            w-full
            sm:w-[280px]
            border
            border-slate-300
            rounded-xl
            px-4
            py-2.5
            text-sm
            text-slate-800
            outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-blue-500
          "
        />

      </div>

      {/* Customer Count */}
      <div className="flex items-center justify-center text-sm font-medium text-slate-500 whitespace-nowrap">

        {filteredCustomers.length} of{" "}
        {totalCustomers} Customer
        {totalCustomers !== 1 ? "s" : ""}

      </div>

    </div>

  </div>

</div>

            {/* Responsive Table Area */}
            <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain">

              <table className="w-full min-w-[900px] table-fixed">

                <colgroup>
  <col className="w-[20%]" />
  <col className="w-[9%]" />
  <col className="w-[9%]" />
  <col className="w-[9%]" />
  <col className="w-[25%]" />
  <col className="w-[17%]" />
  <col className="w-[11%]" />
</colgroup>

                <thead className="bg-gradient-to-r from-blue-700 to-blue-600 text-white">

                  <tr>

                    <th className="px-3 lg:px-4 py-4 text-left text-sm font-semibold">
                      Customer
                    </th>

                    <th className="px-2 py-4 text-center text-sm font-semibold whitespace-normal">
                      <span className="block">☕</span>
                      <span>Breakfast</span>
                    </th>

                    <th className="px-2 py-4 text-center text-sm font-semibold whitespace-normal">
                      <span className="block">🍛</span>
                      <span>Lunch</span>
                    </th>

                    <th className="px-2 py-4 text-center text-sm font-semibold whitespace-normal">
                      <span className="block">🌙</span>
                      <span>Dinner</span>
                    </th>

                    <th className="px-3 py-4 text-left text-sm font-semibold whitespace-normal">
                      Extra Items
                    </th>

                    <th className="px-3 py-4 text-left text-sm font-semibold whitespace-normal">
                      Remark
                    </th>

                    <th className="px-3 py-4 text-center text-sm font-semibold">
                      Save
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredCustomers.length === 0 ? (

                    <tr>
                      <td
                         colSpan="7"
                        className="px-6 py-12 text-center"
                      >

                        <div className="text-slate-400">

                          <FaUsers className="mx-auto text-4xl mb-3" />

                          <h3 className="text-lg font-semibold text-slate-600">
  {search.trim()
    ? "No Matching Customer"
    : "No Customers Found"}
</h3>

<p className="text-sm mt-1">
  {search.trim()
    ? "Try another customer name or mobile number."
    : "No active customers are available for meal entry."}
</p>

                        </div>

                      </td>
                    </tr>

                  ) : (

                    filteredCustomers.map((customer) => {

                      const customerEntry =
                        entries[customer._id] || {};

                      const isDirty =
                        !!dirtyRows[customer._id];

                      return (
                        <tr
                          key={customer._id}
                          className="
                            border-b
                            border-slate-200
                            last:border-b-0
                            hover:bg-slate-50
                            transition
                          "
                        >

                          {/* CUSTOMER */}
                          <td className="px-3 lg:px-4 py-5 align-top min-w-0">

                            <div className="font-semibold text-slate-800 break-words leading-5 whitespace-normal">
                              {customer.customerName}
                            </div>

                            {customer.phone && (
                              <div className="text-xs text-slate-400 mt-1">
                                {customer.phone}
                              </div>
                            )}

                            {isDirty && (
                              <div className="text-xs text-blue-600 font-medium mt-2">
                                Unsaved changes
                              </div>
                            )}

                          </td>

                          {/* BREAKFAST */}
                          <td className="px-2 py-5 align-top">

                            <input
                              type="number"
                              min="0"
                              value={
                                customerEntry.breakfastQty || 0
                              }
                              onChange={(e) =>
                                handleChange(
                                  customer._id,
                                  "breakfastQty",
                                  e.target.value
                                )
                              }
                              className="
                                w-full
                                max-w-[72px]
                                mx-auto
                                block
                                border
                                border-slate-300
                                rounded-xl
                                text-center
                                py-2.5
                                px-2
                                font-semibold
                                text-slate-700
                                outline-none
                                focus:ring-2
                                focus:ring-orange-400
                                focus:border-orange-400
                              "
                            />

                          </td>

                          {/* LUNCH */}
                          <td className="px-2 py-5 align-top">

                            <input
                              type="number"
                              min="0"
                              value={
                                customerEntry.lunchQty || 0
                              }
                              onChange={(e) =>
                                handleChange(
                                  customer._id,
                                  "lunchQty",
                                  e.target.value
                                )
                              }
                              className="
                                w-full
                                max-w-[72px]
                                mx-auto
                                block
                                border
                                border-slate-300
                                rounded-xl
                                text-center
                                py-2.5
                                px-2
                                font-semibold
                                text-slate-700
                                outline-none
                                focus:ring-2
                                focus:ring-green-400
                                focus:border-green-400
                              "
                            />

                          </td>

                          {/* DINNER */}
                          <td className="px-2 py-5 align-top">

                            <input
                              type="number"
                              min="0"
                              value={
                                customerEntry.dinnerQty || 0
                              }
                              onChange={(e) =>
                                handleChange(
                                  customer._id,
                                  "dinnerQty",
                                  e.target.value
                                )
                              }
                              className="
                                w-full
                                max-w-[72px]
                                mx-auto
                                block
                                border
                                border-slate-300
                                rounded-xl
                                text-center
                                py-2.5
                                px-2
                                font-semibold
                                text-slate-700
                                outline-none
                                focus:ring-2
                                focus:ring-indigo-400
                                focus:border-indigo-400
                              "
                            />

                          </td>

                          {/* EXTRA ITEMS */}
                          <td className="px-3 py-5 align-top min-w-0">

                            <div className="space-y-3">

                              {(customerEntry.extraItems || []).map(
                                (item, index) => (

                                  <div
                                    key={index}
                                    className="flex flex-col sm:flex-row gap-2"
                                  >

                                    <input
                                      type="text"
                                      placeholder="Description"
                                      value={
                                        item.description || ""
                                      }
                                      onChange={(e) =>
                                        handleExtraItemChange(
                                          customer._id,
                                          index,
                                          "description",
                                          e.target.value
                                        )
                                      }
                                      className="
                                        border
                                        border-slate-300
                                        rounded-lg
                                        px-3
                                        py-2
                                        flex-1
                                        min-w-0
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
                                        handleExtraItemChange(
                                          customer._id,
                                          index,
                                          "amount",
                                          e.target.value
                                        )
                                      }
                                      className="
                                        border
                                        border-slate-300
                                        rounded-lg
                                        px-3
                                        py-2
                                        w-full
                                        sm:w-24
                                        outline-none
                                        focus:ring-2
                                        focus:ring-blue-400
                                      "
                                    />

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeExtraItem(
                                          customer._id,
                                          index
                                        )
                                      }
                                      className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        w-10
                                        h-10
                                        rounded-lg
                                        text-red-500
                                        hover:bg-red-50
                                        hover:text-red-700
                                        transition
                                      "
                                      title="Remove extra item"
                                    >
                                      <FaTrash className="text-xs" />
                                    </button>

                                  </div>
                                )
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  addExtraItem(
                                    customer._id
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
                                  transition
                                "
                              >
                                <FaPlus className="text-xs" />
                                Add Extra Item
                              </button>

                            </div>
                          </td>

                          {/* REMARK */}
                          <td className="px-3 py-5 align-top min-w-0">

                            <input
                              type="text"
                              placeholder="Remark"
                              value={
                                customerEntry.remark || ""
                              }
                              onChange={(e) =>
                                handleChange(
                                  customer._id,
                                  "remark",
                                  e.target.value
                                )
                              }
                              className="
                                w-full
                                border
                                border-slate-300
                                rounded-xl
                                px-3
                                py-2.5
                                text-sm
                                outline-none
                                focus:ring-2
                                focus:ring-blue-400
                                focus:border-blue-400
                              "
                            />

                          </td>

                          {/* SAVE */}
<td className="px-3 py-5 align-top text-center">

  <button
    type="button"
    onClick={() =>
      handleSaveCustomer(customer._id)
    }
    disabled={
      savingCustomerId === customer._id ||
      savingAll ||
      !isDirty
    }
    className={`
      inline-flex
      items-center
      justify-center
      gap-2
      min-w-[90px]
      px-3
      py-2.5
      rounded-xl
      text-sm
      font-bold
      text-white
      shadow-sm
      transition

      ${
        savingCustomerId === customer._id
          ? "bg-slate-400 cursor-wait"
          : savedCustomerId === customer._id
          ? "bg-green-600"
          : !isDirty
          ? "bg-slate-300 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }
    `}
  >

    {savingCustomerId === customer._id ? (
      <>
        <FaSpinner className="animate-spin" />
        Saving
      </>
    ) : savedCustomerId === customer._id ? (
      <>
        <FaCheck />
        Saved
      </>
    ) : (
      <>
        <FaSave />
        Save
      </>
    )}

  </button>

</td>

                        </tr>
                      );
                    })
                  )}

                </tbody>

              </table>
            </div>

            {/* =====================================
                SAVE ALL FOOTER
            ===================================== */}

            <div className="border-t border-slate-200 bg-slate-50 px-5 lg:px-6 py-5">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                <div>
                  <p className="font-semibold text-slate-800">
                    {hasUnsavedChanges
                      ? "You have unsaved changes."
                      : savedAll
                      ? "All entries saved successfully."
                      : "All entries are up to date."}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Enter all customer meals and save them together.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={
                    savingAll ||
                    !hasUnsavedChanges ||
                    customers.length === 0
                  }
                  className={`
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    min-w-[200px]
                    px-6
                    py-3
                    rounded-xl
                    text-sm
                    font-bold
                    text-white
                    shadow-sm
                    transition

                    ${
                      savingAll
                        ? "bg-slate-400 cursor-wait"
                        : savedAll
                        ? "bg-green-600"
                        : !hasUnsavedChanges
                        ? "bg-slate-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }
                  `}
                >

                  {savingAll ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Saving All...
                    </>
                  ) : savedAll ? (
                    <>
                      <FaCheck />
                      All Entries Saved
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save All Entries
                    </>
                  )}

                </button>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
