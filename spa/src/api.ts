import axios from "axios";

// axios config
axios.interceptors.request.use(function (config) {
  config.headers.apiToken = localStorage.getItem("token");
  return config;
});

const api = {
  get: (endpoint: string, data?: any) => {
    return axios.get("/api" + endpoint, {
      params: data,
    });
  },
  post: (endpoint: string, data?: any) => {
    return axios.post("/api" + endpoint, data);
  }
};
export default api;
