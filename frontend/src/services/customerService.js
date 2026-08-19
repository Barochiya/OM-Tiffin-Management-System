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
  const params = { page, limit };

  if (search) params.search = search;

  if (status !== "All") {
    params.status = status;
  }

  const response = await api.get(
    "/tiffins",
    {
      params,
    }
  );

  return response.data;
};

/* ===========================
Get Single Customer
=========================== */
export const getCustomerById =
  async (id) => {
    const response = await api.get(
      `/tiffins/${id}`
    );

    return response.data;
  };

/* ===========================
Update Customer
=========================== */
export const updateCustomer =
  async (id, customerData) => {
    const response = await api.put(
      `/tiffins/${id}`,
      customerData
    );

    return response.data;
  };

/* ===========================
Delete Customer
=========================== */
export const deleteCustomer =
  async (id) => {
    const response = await api.delete(
      `/tiffins/${id}`
    );

    return response.data;
  };

/* ===========================
Create Customer
=========================== */
export const createCustomer =
  async (customerData) => {
    const response = await api.post(
      "/tiffins",
      customerData
    );

    return response.data;
  };

/* ===========================
Dashboard Stats
=========================== */
export const getDashboardStats =
  async () => {
    const response = await api.get(
      "/tiffins/stats"
    );

    return response.data;
  };

/* ===========================
Mark Payment Paid
=========================== */
export const markPaymentPaid =
  async (id) => {
    const response = await api.put(
      `/tiffins/${id}/pay`,
      {}
    );

    return response.data;
  };

/* ===========================
Get Meal Prices
=========================== */
export const getPrices = async () => {
  const response = await api.get(
    "/prices"
  );

  return response.data;
};

/* ===========================
Update Meal Prices
=========================== */
export const updatePrices =
  async (priceData) => {
    const response = await api.put(
      "/prices",
      priceData
    );

    return response.data;
  };