import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";
import { SellerLayout } from "@/layouts/SellerLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";

import HomePage from "@/pages/public/HomePage";
import ProductListPage from "@/pages/public/ProductListPage";
import ProductDetailPage from "@/pages/public/ProductDetailPage";
import TraceabilityPage from "@/pages/public/TraceabilityPage";
import CartPage from "@/pages/public/CartPage";
import CheckoutPage from "@/pages/public/CheckoutPage";
import MyOrdersPage from "@/pages/public/MyOrdersPage";
import OrderDetailPage from "@/pages/public/OrderDetailPage";
import ProfilePage from "@/pages/public/ProfilePage";
import LoginPage from "@/pages/public/LoginPage";
import RegisterPage from "@/pages/public/RegisterPage";

import SellerOverviewPage from "@/pages/seller/SellerOverviewPage";
import FarmProfilePage from "@/pages/seller/FarmProfilePage";
import BatchListPage from "@/pages/seller/BatchListPage";
import BatchDetailPage from "@/pages/seller/BatchDetailPage";
import BatchCreatePage from "@/pages/seller/BatchCreatePage";
import SellerOrdersPage from "@/pages/seller/SellerOrdersPage";

import AdminOverviewPage from "@/pages/admin/AdminOverviewPage";
import ApprovalsPage from "@/pages/admin/ApprovalsPage";
import ApprovalDetailPage from "@/pages/admin/ApprovalDetailPage";
import UsersPage from "@/pages/admin/UsersPage";
import FarmsPage from "@/pages/admin/FarmsPage";
import FarmApprovalDetailPage from "@/pages/admin/FarmApprovalDetailPage";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import PaymentResultPage from "@/pages/public/PaymentResultPage";
import SellerFarmsPage from "@/pages/seller/SellerFarmsPage.tsx";
import FarmCreatePage from "@/pages/seller/FarmCreatePage.tsx";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Auth (không có layout) */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* Trang khách hàng */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductListPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/trace" element={<TraceabilityPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/orders" element={<MyOrdersPage />} />
                    <Route path="/orders/:id" element={<OrderDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/payment/vnpay/return" element={<PaymentResultPage />} />
                </Route>

                <Route element={<ProtectedRoute allow={["seller"]} />}>
                    <Route element={<SellerLayout />}>
                        <Route path="/seller" element={<SellerOverviewPage />} />
                        <Route path="/seller/farms" element={<SellerFarmsPage />} />
                        <Route path="/seller/farms/new" element={<FarmCreatePage />} />
                        <Route path="/seller/farms/:id" element={<FarmProfilePage />} />
                        <Route path="/seller/batches" element={<BatchListPage />} />
                        <Route path="/seller/batches/new" element={<BatchCreatePage />} />
                        <Route path="/seller/batches/:id" element={<BatchDetailPage />} />
                        <Route path="/seller/orders" element={<SellerOrdersPage />} />
                    </Route>
                </Route>

                {/* Admin (chỉ role = Admin) */}
                <Route element={<ProtectedRoute allow={["admin"]} />}>
                    <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminOverviewPage />} />
                        <Route path="/admin/approvals" element={<ApprovalsPage />} />
                        <Route path="/admin/approvals/:id" element={<ApprovalDetailPage />} />
                        <Route path="/admin/users" element={<UsersPage />} />
                        <Route path="/admin/farms" element={<FarmsPage />} />
                        <Route path="/admin/farms/:id" element={<FarmApprovalDetailPage />} />
                        <Route path="/admin/orders" element={<AdminOrdersPage />} />
                        <Route path="/admin/reports" element={<ReportsPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}