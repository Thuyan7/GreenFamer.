import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // basicSsl(): chạy dev server bằng HTTPS (chứng chỉ tự ký) để trình duyệt cho phép dùng camera
  plugins: [react(), tailwindcss(), basicSsl()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Trang chạy HTTPS thì không được gọi API http:// trực tiếp (bị chặn "mixed content"),
    // nên mọi yêu cầu /api/... được Vite chuyển tiếp tới backend ở cổng 3000 của máy chủ.
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});