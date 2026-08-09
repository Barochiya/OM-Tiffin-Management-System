import api from "./api";

/* ===========================
   Get All Customers
=========================== */

export const getCustomers = async (
  page = 1,
  limit = 10,
  search = "",
  status = "All"
) => {
  const token = localStorage.getItem("token");

  const params = { page, limit };

  if (search) params.search = search;
  if (status !== "All") params.status = status;

  const response = await api.get("/tiffins", {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

/* ===========================
   Get Single Customer
=========================== */

export const getCustomerById = async (id) => {
  const token = localStorage.getItem("token");

  const response = await api.get(`/tiffins/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

/* ===========================
   Update Customer
=========================== */

export const updateCustomer = async (id, customerData) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    `/tiffins/${id}`,
    customerData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Delete Customer
=========================== */

export const deleteCustomer = async (id) => {
  const token = localStorage.getItem("token");

  const response = await api.delete(
    `/tiffins/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Create Customer
=========================== */

export const createCustomer = async (customerData) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/tiffins",
    customerData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Dashboard Stats
=========================== */

export const getDashboardStats = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/tiffins/stats",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Mark Payment Paid
=========================== */

export const markPaymentPaid = async (id) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    `/tiffins/${id}/pay`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Get Meal Prices
=========================== */

export const getPrices = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/prices",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

/* ===========================
   Update Meal Prices
=========================== */

export const updatePrices = async (priceData) => {
  const token = localStorage.getItem("token");

  const response = await api.put(
    "/prices",
    priceData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};