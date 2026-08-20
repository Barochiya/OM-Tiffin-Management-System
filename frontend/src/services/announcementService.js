import api from "./api";
// Get Announcement Delivery Status
export const getAnnouncementDeliveryStatus = async () => {
  const token = localStorage.getItem("token");
  const response = await api.get(
    "/announcement-status",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};
