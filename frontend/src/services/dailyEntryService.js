import api from "./api";

// Get Customers
export const getCustomersForEntry = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get("/tiffins", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// Save Daily Entry
export const saveDailyEntry = async (entryData) => {
  const token = localStorage.getItem("token");

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
  const token = localStorage.getItem("token");

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