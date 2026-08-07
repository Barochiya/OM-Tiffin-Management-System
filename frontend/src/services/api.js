import axios from "axios";

const api = axios.create({
  baseURL: "https://om-tiffin-management-system.onrender.com/api",
});

export default api;