import axios from "axios";

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

const api = axios.create({
    // Mặc định gọi qua proxy của Vite (/api -> backend :3000), dùng được cho cả localhost lẫn địa chỉ IP trong mạng LAN.
    // Khi triển khai thật, đặt VITE_API_URL thành địa chỉ API (ví dụ https://api.example.com).
    baseURL: import.meta.env.VITE_API_URL ?? "/api",
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