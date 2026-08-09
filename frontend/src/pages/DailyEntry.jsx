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

  const [savingId, setSavingId] = useState(null);

  const [savedId, setSavedId] = useState(null);

  const [dirtyRows, setDirtyRows] = useState({});

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

      setCustomers(customerRes.data || []);

      const temp = {};

      (entryRes.data || []).forEach((item) => {
        if (!item.customer?._id) return;

        temp[item.customer._id] = {
          breakfastQty: item.breakfastQty || 0,
          lunchQty: item.lunchQty || 0,
          dinnerQty: item.dinnerQty || 0,
          extraItems: item.extraItems || [],
          remark: item.remark || "",
        };
      });

      setEntries(temp);

      // Existing data is already saved
      setDirtyRows({});
    } catch (err) {
      console.error("Daily Entry Load Error:", err);
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
  };

  // =========================================
  // ADD EXTRA ITEM
  // =========================================

  const addExtraItem = (customerId) => {
    setEntries((prev) => ({
      ...prev,

      [customerId]: {
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
  };
    // =========================================
  // SAVE ENTRY
  // =========================================

  const handleSave = async (customerId) => {
    try {
      setSavingId(customerId);

      const data = entries[customerId] || {};

      await saveDailyEntry({
        customer: customerId,
        date,

        breakfastQty:
          data.breakfastQty || 0,

        lunchQty:
          data.lunchQty || 0,

        dinnerQty:
          data.dinnerQty || 0,

        extraItems:
          data.extraItems || [],

        remark:
          data.remark || "",
      });

      await loadData();

      setSavingId(null);

      setSavedId(customerId);

      setDirtyRows((prev) => ({
        ...prev,
        [customerId]: false,
      }));

      setTimeout(() => {
        setSavedId(null);
      }, 2000);
    } catch (error) {
      setSavingId(null);

      console.error("Save Daily Entry Error:", error);

      alert(
        error.response?.data?.message ||
          "Failed To Save Entry"
      );
    }
  };

  // =========================================
  // SUMMARY
  // =========================================

  const totalCustomers = customers.length;

  const totalBreakfast = customers.reduce(
    (sum, customer) =>
      sum +
      (entries[customer._id]?.breakfastQty || 0),
    0
  );

  const totalLunch = customers.reduce(
    (sum, customer) =>
      sum +
      (entries[customer._id]?.lunchQty || 0),
    0
  );

  const totalDinner = customers.reduce(
    (sum, customer) =>
      sum +
      (entries[customer._id]?.dinnerQty || 0),
    0
  );

  // =========================================
  // PAGE UI
  // =========================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Main Content
          Sidebar + Navbar are provided by AdminLayout.
      */}
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
                onChange={(e) =>
                  setDate(e.target.value)
                }
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

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      Customer Meal Entries
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                      Update meals, extra items and remarks for each customer.
                    </p>
                  </div>

                  <div className="text-sm font-medium text-slate-500">
                    {totalCustomers} Customer
                    {totalCustomers !== 1 ? "s" : ""}
                  </div>

                </div>

              </div>

             {/* Responsive Table Area */}
<div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain">

  <table className="w-full min-w-[760px] table-fixed">

    <colgroup>

      <col className="w-[21%]" />

      <col className="w-[9%]" />

      <col className="w-[9%]" />

      <col className="w-[9%]" />

      <col className="w-[24%]" />

      <col className="w-[19%]" />

      <col className="w-[9%]" />

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

                      <th className="px-2 py-4 text-center text-sm font-semibold whitespace-normal">
                        Save
                      </th>

                    </tr>

                  </thead>

                  <tbody>
                                        {customers.length === 0 ? (

                      <tr>

                        <td
                          colSpan="7"
                          className="px-6 py-12 text-center"
                        >

                          <div className="text-slate-400">

                            <FaUsers className="mx-auto text-4xl mb-3" />

                            <h3 className="text-lg font-semibold text-slate-600">
                              No Customers Found
                            </h3>

                            <p className="text-sm mt-1">
                              No active customers are available for meal entry.
                            </p>

                          </div>

                        </td>

                      </tr>

                    ) : (

                      customers.map((customer) => {

                        const customerEntry =
                          entries[customer._id] || {};

                        const isSaving =
                          savingId === customer._id;

                        const isSaved =
                          savedId === customer._id;

                        const isDirty =
                          dirtyRows[customer._id];

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
                            <td className="px-3 lg:px-4 py-5 align-top">

                              <div className="font-semibold text-slate-800 break-words leading-5">

                                {customer.customerName}

                              </div>

                              {customer.phone && (

                                <div className="text-xs text-slate-400 mt-1">

                                  {customer.phone}

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
                            <td className="px-3 py-5 align-top">

                              <div className="space-y-2">

                                {(customerEntry.extraItems || []).map(
                                  (item, index) => (

                                    <div
                                      key={index}
                                      className="
                                        flex
                                        flex-wrap
                                        gap-2
                                        items-center
                                      "
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
                                          flex-1
                                          min-w-0
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

                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="₹"
                                        value={
                                          item.amount ?? 0
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
                                          w-16
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
                                          removeExtraItem(
                                            customer._id,
                                            index
                                          )
                                        }
                                        className="
                                          w-8
                                          h-8
                                          rounded-lg
                                          flex
                                          items-center
                                          justify-center
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
                            <td className="px-3 py-5 align-top">

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
                            <td className="px-2 py-5 align-top text-center">

                              <button
                                type="button"
                                onClick={() =>
                                  handleSave(
                                    customer._id
                                  )
                                }
                                disabled={
                                  isSaving ||
                                  !isDirty
                                }
                                className={`
                                  inline-flex
                                  items-center
                                  justify-center
                                  gap-2
                                  min-w-[72px]
                                  px-3
                                  py-2.5
                                  rounded-xl
                                  text-sm
                                  font-semibold
                                  text-white
                                  transition
                                  shadow-sm

                                  ${
                                    isSaving
                                      ? "bg-slate-400 cursor-wait"
                                      : isSaved
                                      ? "bg-green-600"
                                      : !isDirty
                                      ? "bg-slate-300 cursor-not-allowed"
                                      : "bg-blue-600 hover:bg-blue-700"
                                  }
                                `}
                              >

                                {isSaving ? (

                                  <>
                                    <FaSpinner className="animate-spin" />
                                    Saving
                                  </>

                                ) : isSaved ? (

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

            </div>

          )}

      </div>
    </div>
  );
}
