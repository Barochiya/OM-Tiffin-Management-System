import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import {
  getCustomersForEntry,
  getEntriesByDate,
  saveDailyEntry,
} from "../services/dailyEntryService";


export default function DailyEntry() {
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]

  );

  const [customers, setCustomers] = useState([]);
const [entries, setEntries] = useState({});
const [loading, setLoading] = useState(true);

const [savingId, setSavingId] = useState(null);
const [savedId, setSavedId] = useState(null);
const [dirtyRows, setDirtyRows] = useState({});


useEffect(() => {
  loadData();
}, [date]);

// ================================
// Handle Change
// ================================
const handleChange = (customerId, field, value) => {
  setEntries((prev) => ({

    ...prev,

    [customerId]: {

      breakfastQty: prev[customerId]?.breakfastQty || 0,

      lunchQty: prev[customerId]?.lunchQty || 0,

      dinnerQty: prev[customerId]?.dinnerQty || 0,

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


// ================================
// Add Extra Item
// ================================
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

// ================================
// Extra Item Change
// ================================
const handleExtraItemChange = (
  customerId,
  index,
  field,
  value
) => {

  setEntries((prev) => {

    const items = [...(prev[customerId]?.extraItems || [])];

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

  // ⭐ Row Changed
  setDirtyRows((prev) => ({
    ...prev,
    [customerId]: true,
  }));

};

// ================================
// Remove Extra Item
// ================================
const removeExtraItem = (customerId, index) => {

  setEntries((prev) => {

    const items = [...(prev[customerId]?.extraItems || [])];

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
// ================================
// Save Daily Entry
// ================================
const handleSave = async (customerId) => {

  try {

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
      "Failed to save entry"
    );

  }

};
const loadData = async () => {
  try {
    setLoading(true);

    // ===========================
    // Load Customers
    // ===========================
    const customerRes = await getCustomersForEntry();

    console.log("Customers API Response:", customerRes);
    console.log("Customers Data:", customerRes.data);

    setCustomers(customerRes.data || []);

    // ===========================
    // Load Today's Entries
    // ===========================
    const entryRes = await getEntriesByDate(date);

    console.log("Entries API Response:", entryRes);
    console.log("Entries Data:", entryRes.data);

    const temp = {};

    (entryRes.data || []).forEach((item) => {
  temp[item.customer._id] = {
  breakfastQty: item.breakfastQty,
  lunchQty: item.lunchQty,
  dinnerQty: item.dinnerQty,

  extraItems:
  item.extraItems?.length > 0
    ? item.extraItems
    : [],

  remark: item.remark || "",
};
    });

    setEntries(temp);

  } catch (error) {
    console.log("Load Data Error:", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-100">
        

        <div className="p-8">

          <h1 className="text-3xl font-bold text-slate-800">
            Daily Tiffin Entry
          </h1>

          <p className="text-gray-500 mt-2">
            Enter today's breakfast, lunch and dinner quantity
          </p>

          <div className="bg-white rounded-xl shadow-md mt-8 p-6">

            <label className="block font-semibold mb-2">
              Select Date
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded-lg px-4 py-3"
            />

          </div>
            {loading ? (
  <div className="text-center mt-8 text-lg">
    Loading Customers...
  </div>
) : (
  <div className="bg-white rounded-xl shadow-md mt-8 overflow-hidden">
    <table className="w-full">
      <thead className="bg-blue-600 text-white">
        <tr>
          <th className="p-4 text-left w-52">
  Customer
</th>
<th className="p-4 text-center">🍳 Breakfast</th>
<th className="p-4 text-center">🍛 Lunch</th>
<th className="p-4 text-center">🍽 Dinner</th>



<th className="p-4 text-center w-80">
  🍽 Extra Items
</th>

<th className="p-4 text-center">
  📝 Remark
</th>

<th className="p-4 text-center">
  Action
</th>
        </tr>
      </thead>

      

     <tbody>
  {customers.map((customer) => (
    <tr key={customer._id} className="border-b">

      {/* Customer */}
      <td className="p-4 w-52 font-medium">
        {customer.customerName}
      </td>

      {/* Breakfast */}
      <td className="p-4 text-center">
        <input
          type="number"
          min="0"
          value={entries[customer._id]?.breakfastQty || 0}
          onChange={(e) =>
            handleChange(customer._id, "breakfastQty", e.target.value)
          }
          className="w-20 border rounded p-2 text-center"
        />
      </td>

      {/* Lunch */}
      <td className="p-4 text-center">
        <input
          type="number"
          min="0"
          value={entries[customer._id]?.lunchQty || 0}
          onChange={(e) =>
            handleChange(customer._id, "lunchQty", e.target.value)
          }
          className="w-20 border rounded p-2 text-center"
        />
      </td>

      {/* Dinner */}
      <td className="p-4 text-center">
        <input
          type="number"
          min="0"
          value={entries[customer._id]?.dinnerQty || 0}
          onChange={(e) =>
            handleChange(customer._id, "dinnerQty", e.target.value)
          }
          className="w-20 border rounded p-2 text-center"
        />
      </td>

     {/* Extra Items */}
<td className="p-4">

  <div className="space-y-2">

    {(entries[customer._id]?.extraItems || []).map((item, index) => (

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
          className="border rounded px-2 py-1 w-36"
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
          className="border rounded px-2 py-1 w-20"
        />

        <button
  type="button"
  onClick={() => removeExtraItem(customer._id, index)}
  className="text-red-600 hover:text-red-800 font-bold"
>
  ✖
</button>

      </div>

    ))}

    <button
      type="button"
      onClick={() => addExtraItem(customer._id)}
      className="text-blue-600 text-sm font-semibold"
    >
      + Add Extra Item
    </button>

  </div>

</td>

      {/* Remark */}
      <td className="p-4">
        <input
          type="text"
          placeholder="Remark"
          value={entries[customer._id]?.remark || ""}
          onChange={(e) =>
            handleChange(customer._id, "remark", e.target.value)
          }
          className="w-32 border rounded p-2"
        />
      </td>

      {/* Save Button */}
      <td className="p-4 text-center">
        <button
  onClick={() => handleSave(customer._id)}
  disabled={
    savingId === customer._id ||
    !dirtyRows[customer._id]
  }
  className={`px-4 py-2 rounded text-white font-semibold transition ${
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
)}
        </div>
      </div>
    </div>
  );
}