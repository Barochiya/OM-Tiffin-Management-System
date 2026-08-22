import api from "./api";

// Get Customers
export const getCustomersForEntry = async () => {
  const token = sessionStorage.getItem("token");

  const response = await api.get("/tiffins", {
  params: {
    page: 1,
    limit: 1000,
  },
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

  return response.data;
};

// Save Daily Entry
export const saveDailyEntry = async (entryData) => {
  const token = sessionStorage.getItem("token");

  const response = await api.post(
    "/daily-entry",
    entryData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get Entries By Date
export const getEntriesByDate = async (date) => {
  const token = sessionStorage.getItem("token");

  const response = await api.get(
    `/daily-entry/${date}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// =======================================
// Get Customer Entries By Billing Cycle
// =======================================
export const getCustomerEntries = async (
  customerId,
  month,
  year,
  cycle
) => {
  const token = sessionStorage.getItem("token");

  const response = await api.get(
    `/daily-entry/customer/${customerId}`,
    {
      params: {
        month,
        year,
        cycle,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};
