import axios from "axios";

import appStore from "./appStore";

// axios config
axios.interceptors.request.use(function(config) {
    config.headers.apiToken = appStore.data.user.token;
    return config;
});

const api = {
    get: <T>(endpoint: string, data?: any) => {
        return axios.get<T>("/api" + endpoint, {
            params: data,
        });
    },
    post: <T>(endpoint: string, data?: any, formData?: boolean) => {
        if (formData) {
            var postData = new FormData();
            Object.keys(data).forEach((key) => postData.append(key, data[key]));
            return axios.post<T>("/api" + endpoint, postData);
        } else {
            return axios.post<T>("/api" + endpoint, data);
        }
    },
};
export default api;
