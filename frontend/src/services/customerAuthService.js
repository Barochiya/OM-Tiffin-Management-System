import axios from "axios";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
const customerApi = axios.create({
  baseURL: `${API_URL.replace(/\/+$/, "")}/api`,
});
customerApi.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("customerToken");
    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export const loginCustomer = async (
  userId,
  password
) => {
  const response = await customerApi.post(
    "/customer-auth/login",
    {
      userId,
      password,
    }
  );
  return response.data;
};
export const changeCustomerPassword = async (
  currentPassword,
  newPassword,
  confirmPassword
) => {
  const response = await customerApi.post(
    "/customer-auth/change-password",
    {
      currentPassword,
      newPassword,
      confirmPassword,
    }
  );
  return response.data;
};
export const updateCustomerProfile = async ({
  customerName,
  phone,
  address,
}) => {
  const response = await customerApi.put(
    "/customer-portal/profile",
    {
      customerName,
      phone,
      address,
    }
  );
  return response.data;
};export const getCustomerProfile = async () => {
  const response = await customerApi.get(
    "/customer-portal/profile"
  );
  return response.data;
};
export const sendCustomerPasswordResetOtp = async (userId) => {
  const response = await customerApi.post(
    "/customer-auth/forgot-password/send-otp",
    {
      userId,
    }
  );
  return response.data;
};
export const verifyCustomerPasswordResetOtp = async (
  userId,
  otp
) => {
  const response = await customerApi.post(
    "/customer-auth/forgot-password/verify-otp",
    {
      userId,
      otp,
    }
  );
  return response.data;
};
export const resetCustomerPassword = async (
  userId,
  resetToken,
  newPassword,
  confirmPassword
) => {
  const response = await customerApi.post(
    "/customer-auth/forgot-password/reset-password",
    {
      userId,
      resetToken,
      newPassword,
      confirmPassword,
    }
  );
  return response.data;
};export const sendCustomerUserIdRecoveryOtp = async (phone) => {
  const response = await customerApi.post(
    "/customer-auth/forgot-user-id/send-otp",
    {
      phone,
    }
  );
  return response.data;
};
export const verifyCustomerUserIdRecoveryOtp = async (
  phone,
  otp
) => {
  const response = await customerApi.post(
    "/customer-auth/forgot-user-id/verify-otp",
    {
      phone,
      otp,
    }
  );
  return response.data;
};export const sendCustomerAccountSetupOtp = async (userId) => {
  const response = await customerApi.post(
    "/customer-auth/account-setup/send-otp",
    {
      userId,
    }
  );
  return response.data;
};
export const verifyCustomerAccountSetupOtp = async (
  userId,
  otp
) => {
  const response = await customerApi.post(
    "/customer-auth/account-setup/verify-otp",
    {
      userId,
      otp,
    }
  );
  return response.data;
};
export const setCustomerAccountSetupPassword = async (
  userId,
  setupToken,
  newPassword,
  confirmPassword
) => {
  const response = await customerApi.post(
    "/customer-auth/account-setup/set-password",
    {
      userId,
      setupToken,
      newPassword,
      confirmPassword,
    }
  );
  return response.data;
};
export const getCustomerBills = async () => {
  const response = await customerApi.get(
    "/customer-portal/bills"
  );
  return response.data;
};
export const getCustomerBillById = async (billId) => {
  const response = await customerApi.get(
    `/customer-portal/bills/${billId}`
  );
  return response.data;
};export const getCustomerMealHistory = async (month, year, cycle) => {
  const response = await customerApi.get(
    "/customer-portal/meal-history",
    {
      params: {
        month,
        year,
        cycle,
      },
    }
  );
  return response.data;
};export const logoutCustomer = () => {
  sessionStorage.removeItem("customerToken");
  sessionStorage.removeItem("customerUser");
};
export default customerApi;


export const downloadCustomerBillPdf = async (billId) => {
  const response = await customerApi.get(
    `/customer-portal/bills/${billId}/pdf`,
    {
      responseType: "blob",
    }
  );
  return response;
};
export const getCustomerPayments = async () => {
  const response = await customerApi.get(
    "/customer-portal/payments"
  );
  return response.data;
};
export const getCustomerAnnouncements = async () => {
  const response = await customerApi.get(
    "/customer-portal/announcements"
  );
  return response.data;
};
