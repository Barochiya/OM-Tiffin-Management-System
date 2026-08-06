import api from "./api";

export const loginAdmin = async (email, password) => {
  const response = await api.post("/admin/login", {
    email,
    password,
  });

  return response.data;
};