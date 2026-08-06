import api from "./api";

// Generate Monthly Bill
export const generateBill = async (billData) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/generate",
    billData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};