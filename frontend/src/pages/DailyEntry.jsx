import { useEffect, useState } from "react";

import {
  FaCalendarAlt,
  FaUsers,
  FaCoffee,
  FaUtensils,
  FaMoon,
  FaSave,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getCustomersForEntry,
  getEntriesByDate,
  saveDailyEntry,
} from "../services/dailyEntryService";

export default function DailyEntry() {

  // ===============================
  // STATES
  // ===============================

  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customers, setCustomers] = useState([]);

  const [entries, setEntries] = useState({});

  const [loading, setLoading] = useState(false);

  const [savingId, setSavingId] = useState(null);

  const [savedId, setSavedId] = useState(null);

  const [dirtyRows, setDirtyRows] = useState({});

  // ===============================
  // LOAD
  // ===============================

  useEffect(() => {

    loadData();

  }, [date]);

  const loadData = async () => {

    try {

      setLoading(true);

      const customerRes =
        await getCustomersForEntry();

      const entryRes =
        await getEntriesByDate(date);

      setCustomers(customerRes.data || []);

      const temp = {};

      (entryRes.data || []).forEach((item) => {

        temp[item.customer._id] = {

          breakfastQty:
            item.breakfastQty || 0,

          lunchQty:
            item.lunchQty || 0,

          dinnerQty:
            item.dinnerQty || 0,

          extraItems:
            item.extraItems || [],

          remark:
            item.remark || "",

        };

      });

      setEntries(temp);

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };
    // ===============================
  // HANDLE CHANGE
  // ===============================

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
            : Number(value),

      },

    }));

    setDirtyRows((prev) => ({

      ...prev,

      [customerId]: true,

    }));

  };

  // ===============================
  // ADD EXTRA ITEM
  // ===============================

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

  // ===============================
  // REMOVE EXTRA ITEM
  // ===============================

  const removeExtraItem = (

    customerId,

    index

  ) => {

    setEntries((prev) => {

      const items = [

        ...(prev[customerId]?.extraItems || [])

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

  // ===============================
  // EXTRA ITEM CHANGE
  // ===============================

  const handleExtraItemChange = (

    customerId,

    index,

    field,

    value

  ) => {

    setEntries((prev) => {

      const items = [

        ...(prev[customerId]?.extraItems || [])

      ];

      items[index][field] =

        field === "amount"

          ? Number(value)

          : value;

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
    // ===================================
  // SAVE ENTRY
  // ===================================

  const handleSave = async (customerId) => {

    try {

      setSavingId(customerId);

      const data = entries[customerId] || {};

      await saveDailyEntry({

        customer: customerId,

        date,

        breakfastQty: data.breakfastQty || 0,

        lunchQty: data.lunchQty || 0,

        dinnerQty: data.dinnerQty || 0,

        extraItems: data.extraItems || [],

        remark: data.remark || "",

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

      console.log(error);

      alert(

        error.response?.data?.message ||

        "Failed To Save Entry"

      );

    }

  };

  // ===================================
  // SUMMARY
  // ===================================

  const totalCustomers = customers.length;

  const totalBreakfast = customers.reduce(

    (sum, c) =>

      sum +

      (entries[c._id]?.breakfastQty || 0),

    0

  );

  const totalLunch = customers.reduce(

    (sum, c) =>

      sum +

      (entries[c._id]?.lunchQty || 0),

    0

  );

  const totalDinner = customers.reduce(

    (sum, c) =>

      sum +

      (entries[c._id]?.dinnerQty || 0),

    0

  );

  // ===================================
  // UI
  // ===================================

  return (

    <div className="min-h-screen bg-slate-100">

      <Sidebar />

      <div className="lg:ml-64">

        <Topbar />

        <div className="p-4 lg:p-8">

          {/* Header */}

          <div className="mb-8">

            <h1 className="text-3xl font-bold text-slate-800">

              🍱 Daily Meal Entry

            </h1>

            <p className="text-gray-500 mt-2">

              Manage customer meal entries quickly.

            </p>

          </div>

          {/* Summary Cards */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-500">

                    Customers

                  </p>

                  <h2 className="text-3xl font-bold">

                    {totalCustomers}

                  </h2>

                </div>

                <FaUsers className="text-blue-600 text-4xl"/>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-500">

                    Breakfast

                  </p>

                  <h2 className="text-3xl font-bold text-orange-600">

                    {totalBreakfast}

                  </h2>

                </div>

                <FaCoffee className="text-orange-500 text-4xl"/>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-500">

                    Lunch

                  </p>

                  <h2 className="text-3xl font-bold text-green-600">

                    {totalLunch}

                  </h2>

                </div>

                <FaUtensils className="text-green-600 text-4xl"/>

              </div>

            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">

              <div className="flex justify-between">

                <div>

                  <p className="text-gray-500">

                    Dinner

                  </p>

                  <h2 className="text-3xl font-bold text-indigo-600">

                    {totalDinner}

                  </h2>

                </div>

                <FaMoon className="text-indigo-600 text-4xl"/>

              </div>

            </div>

          </div>

          {/* Date */}

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

            <label className="font-semibold block mb-2">

              <FaCalendarAlt className="inline mr-2"/>

              Select Date

            </label>

            <input

              type="date"

              value={date}

              onChange={(e)=>setDate(e.target.value)}

              className="border rounded-xl px-4 py-3"

            />

          </div>

          {/* Table Starts */}
                    {loading ? (

            <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

              <h2 className="text-xl font-semibold text-gray-600">

                Loading Customers...

              </h2>

            </div>

          ) : (

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-blue-700 text-white">

                    <tr>

                      <th className="px-4 py-4 text-left">

                        Customer

                      </th>

                      <th className="px-4 py-4 text-center">

                        ☕ Breakfast

                      </th>

                      <th className="px-4 py-4 text-center">

                        🍛 Lunch

                      </th>

                      <th className="px-4 py-4 text-center">

                        🌙 Dinner

                      </th>

                      <th className="px-4 py-4 text-left">

                        Extra Items

                      </th>

                      <th className="px-4 py-4 text-left">

                        Remark

                      </th>

                      <th className="px-4 py-4 text-center">

                        Save

                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {customers.map((customer) => (

                      <tr
                        key={customer._id}
                        className="border-b hover:bg-slate-50"
                      >

                        {/* Customer */}

                        <td className="px-4 py-4 font-semibold">

                          {customer.customerName}

                        </td>

                        {/* Breakfast */}

                        <td className="px-4 py-4 text-center">

                          <input
                            type="number"
                            min="0"
                            value={
                              entries[customer._id]?.breakfastQty || 0
                            }
                            onChange={(e) =>
                              handleChange(
                                customer._id,
                                "breakfastQty",
                                e.target.value
                              )
                            }
                            className="w-20 border rounded-xl text-center py-2"
                          />

                        </td>

                        {/* Lunch */}

                        <td className="px-4 py-4 text-center">

                          <input
                            type="number"
                            min="0"
                            value={
                              entries[customer._id]?.lunchQty || 0
                            }
                            onChange={(e) =>
                              handleChange(
                                customer._id,
                                "lunchQty",
                                e.target.value
                              )
                            }
                            className="w-20 border rounded-xl text-center py-2"
                          />

                        </td>

                        {/* Dinner */}

                        <td className="px-4 py-4 text-center">

                          <input
                            type="number"
                            min="0"
                            value={
                              entries[customer._id]?.dinnerQty || 0
                            }
                            onChange={(e) =>
                              handleChange(
                                customer._id,
                                "dinnerQty",
                                e.target.value
                              )
                            }
                            className="w-20 border rounded-xl text-center py-2"
                          />

                        </td>

                        {/* Extra Items */}

                        <td className="px-4 py-4">
                                                    <div className="space-y-2">

                            {(entries[customer._id]?.extraItems || []).map(

                              (item, index) => (

                                <div
                                  key={index}
                                  className="flex gap-2"
                                >

                                  <input
                                    type="text"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleExtraItemChange(
                                        customer._id,
                                        index,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    className="border rounded-lg px-3 py-2 flex-1"
                                  />

                                  <input
                                    type="number"
                                    placeholder="₹"
                                    value={item.amount}
                                    onChange={(e) =>
                                      handleExtraItemChange(
                                        customer._id,
                                        index,
                                        "amount",
                                        e.target.value
                                      )
                                    }
                                    className="border rounded-lg px-3 py-2 w-24"
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeExtraItem(
                                        customer._id,
                                        index
                                      )
                                    }
                                    className="text-red-600 font-bold hover:text-red-800"
                                  >

                                    ✖

                                  </button>

                                </div>

                              )

                            )}

                            <button
                              type="button"
                              onClick={() =>
                                addExtraItem(customer._id)
                              }
                              className="text-blue-600 font-semibold hover:text-blue-800"
                            >

                              ➕ Add Extra Item

                            </button>

                          </div>

                        </td>

                        {/* Remark */}

                        <td className="px-4 py-4">

                          <input
                            type="text"
                            placeholder="Remark"
                            value={
                              entries[customer._id]?.remark || ""
                            }
                            onChange={(e) =>
                              handleChange(
                                customer._id,
                                "remark",
                                e.target.value
                              )
                            }
                            className="border rounded-xl px-3 py-2 w-48"
                          />

                        </td>

                        {/* Save */}

                        <td className="px-4 py-4 text-center">

                          <button
                            onClick={() =>
                              handleSave(customer._id)
                            }
                            disabled={
                              savingId === customer._id ||
                              !dirtyRows[customer._id]
                            }
                            className={`px-5 py-2 rounded-xl text-white font-semibold transition ${
                              savingId === customer._id
                                ? "bg-gray-500"
                                : !dirtyRows[customer._id]
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            }`}
                          >

                            {savingId === customer._id
                              ? "Saving..."
                              : savedId === customer._id
                              ? "✔ Saved"
                              : "💾 Save"}

                          </button>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}