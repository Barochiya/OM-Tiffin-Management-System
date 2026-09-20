import api from "./api";
export const getCustomerUsers = async () => {
  const response = await api.get("/customer-accounts/users");
  return response.data;
};
export default {
  getCustomerUsers,
};
