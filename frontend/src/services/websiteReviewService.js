import api from "./api";
export const getReviews = async () => {
  const response = await api.get("/website-reviews");
  return response.data;
};
export const getPublicReviews = async () => {
  const response = await api.get("/website-reviews/public");
  return response.data;
};
export const createPublicReview = async (review) => {
  const response = await api.post("/website-reviews/public", review);
  return response.data;
};
export const updateReview = async (id, review) => {
  const response = await api.put(`/website-reviews/${id}`, review);
  return response.data;
};
export const deleteReview = async (id) => {
  const response = await api.delete(`/website-reviews/${id}`);
  return response.data;
};
export default {
  getReviews,
  getPublicReviews,
  createPublicReview,
  updateReview,
  deleteReview,
};