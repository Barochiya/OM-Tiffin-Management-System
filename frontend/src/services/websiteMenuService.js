import api from "./api";
export const getMenuItems = async () => {
  const response = await api.get("/website-menu");
  return response.data;
};
export const getPublicMenuItems = async (mealType) => {
  const response = await api.get("/website-menu/public", {
    params: mealType ? { mealType } : {},
  });
  return response.data;
};
export const createMenuItem = async (item) => {
  const response = await api.post("/website-menu", item);
  return response.data;
};
export const updateMenuItem = async (id, item) => {
  const response = await api.put(`/website-menu/${id}`, item);
  return response.data;
};
export const deleteMenuItem = async (id) => {
  const response = await api.delete(`/website-menu/${id}`);
  return response.data;
};
export default {
  getMenuItems,
  getPublicMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
