import axios from "axios";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? `http://${window.location.hostname}:3000`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("gf_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res.data,
    (err) => Promise.reject(err.response?.data ?? err)
);

export default api;
