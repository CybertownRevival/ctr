import axios from "axios";

// axios config
axios.interceptors.request.use(function (config) {
  config.headers.apiToken = localStorage.getItem("token");
  return config;
});

const api = {
  get: function (endpoint, data) {
    return axios.get("/api" + endpoint, {
      params: data,
    });
  },
  post: function (endpoint, data) {
    return axios.post("/api" + endpoint, data);
  }
};
export default api;
