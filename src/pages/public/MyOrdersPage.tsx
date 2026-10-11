import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { PackageSearch } from "lucide-react";
import type { OrderStatus } from "@/types/order";

type OrderTab = "All" | "Pending" | "Preparing" | "Shipping" | "Completed" | "Cancelled";

const TABS: { key: OrderTab; label: string }[] = [
    { key: "All", label: "Tất cả" },
    { key: "Pending", label: "Chờ duyệt" },
    { key: "Preparing", label: "Đang chuẩn bị" },
    { key: "Shipping", label: "Chờ nhận hàng" },
    { key: "Completed", label: "Hoàn thành" },
    { key: "Cancelled", label: "Đã hủy" },
];

// Mỗi tab gồm những trạng thái nào (null = không lọc)
const TAB_STATUSES: Record<OrderTab, OrderStatus[] | null> = {
    All: null,
    Pending: ["Pending"],                   // chờ admin duyệt
    Preparing: ["Confirmed", "Preparing"],  // đã duyệt, người bán đang chuẩn bị hàng
    Shipping: ["Shipping", "Delivered"],    // đang giao / đã giao, chờ khách xác nhận nhận hàng
    Completed: ["Completed"],
    Cancelled: ["Cancelled"],
};

export default function MyOrdersPage() {
    const { data: orders, loading } = useFetch(() => orderService.getMyOrders(), []);
    const [tab, setTab] = useState<OrderTab>("All");

    const filtered = useMemo(() => {
        if (!orders) return [];
        const statuses = TAB_STATUSES[tab];
        return statuses ? orders.filter((o) => statuses.includes(o.status)) : orders;
    }, [orders, tab]);

    const counts = useMemo(() => {
        const result = {} as Record<OrderTab, number>;
        TABS.forEach(({ key }) => {
            const statuses = TAB_STATUSES[key];
            result[key] = !orders
                ? 0
                : statuses
                    ? orders.filter((o) => statuses.includes(o.status)).length
                    : orders.length;
        });
        return result;
    }, [orders]);

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <h1 className="text-3xl font-bold">Đơn hàng của tôi</h1>

            {loading ? (
                <p className="text-muted-foreground mt-6">Đang tải...</p>
            ) : !orders || orders.length === 0 ? (
                <div className="mt-16 text-center">
                    <PackageSearch className="w-16 h-16 mx-auto text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
                    <Link to="/products" className="mt-5 inline-block bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">Mua sắm ngay</Link>
                </div>
            ) : (
                <>
                    {/* Lọc theo trạng thái */}
                    <div className="mt-6 flex flex-wrap items-center gap-2">
                        {TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setTab(t.key)}
                                className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${
                                    tab === t.key ? "bg-primary text-primary-foreground" : "border"
                                }`}
                            >
                                {t.label}
                                <span className={`text-xs ${tab === t.key ? "opacity-90" : "text-muted-foreground"}`}>
                                    ({counts[t.key]})
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3">
                        {filtered.map((o) => (
                            <Link key={o.id} to={`/orders/${o.id}`} className="block bg-card border rounded-2xl p-5 hover:border-primary transition">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div>
                                        <div className="font-mono text-sm text-muted-foreground">#{o.id}</div>
                                        <div className="font-semibold">{o.receiver_name} · {o.shipping_address}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={o.status} />
                                        <span className="font-bold text-primary">{formatCurrency(o.total_price ?? 0)}</span>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">Đặt ngày {formatDate(o.created_at)} · {o.details?.length ?? 0} sản phẩm</div>
                            </Link>
                        ))}

                        {filtered.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-10">
                                Không có đơn hàng nào trong mục này.
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}