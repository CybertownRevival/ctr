import axios from "axios";

// axios config
axios.interceptors.request.use(function (config) {
    config.headers.apiToken =  localStorage.getItem('token');
    return config;
});

const api = {
    get: function(endpoint, data) {
        return axios.get('/api' + endpoint, {
            params: data
        });
    },
    post: function(endpoint, data) {
        //var postData = new FormData;
        //Object.keys(data).forEach(key => postData.append(key, data[key]));
        //return axios.post(process.env.VUE_APP_API_URL + endpoint, postData);
        return axios.post('/api' + endpoint, data);
    }

};
export default api;
