import { Fragment, useMemo, useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { orderService } from "@/services/orderService";
import { batchService } from "@/services/batchService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PackageCheck, Truck, ChevronDown, Phone, MapPin, StickyNote } from "lucide-react";
import type { OrderStatus } from "@/types/order";

type Tab = "Active" | "Pending" | "Shipping" | "Done" | "Cancelled" | "All";

const TABS: { key: Tab; label: string }[] = [
    { key: "Active", label: "Cần xử lý" },
    { key: "Pending", label: "Chờ duyệt" },
    { key: "Shipping", label: "Đang giao" },
    { key: "Done", label: "Hoàn tất" },
    { key: "Cancelled", label: "Đã hủy" },
    { key: "All", label: "Tất cả" },
];

const TAB_STATUSES: Record<Tab, OrderStatus[] | null> = {
    Active: ["Confirmed", "Preparing"],
    Pending: ["Pending"],
    Shipping: ["Shipping"],
    Done: ["Delivered", "Completed"],
    Cancelled: ["Cancelled"],
    All: null,
};

export default function SellerOrdersPage() {
    const [tab, setTab] = useState<Tab>("Active");
    const { data: orders, loading, refetch } = useFetch(() => orderService.getSellerOrders(), []);
    const { data: myBatches } = useFetch(() => batchService.getMyBatches(), []);
    const [actingId, setActingId] = useState<number | null>(null);
    const [expanded, setExpanded] = useState<number | null>(null);

    const batchById = useMemo(() => {
        const map = new Map<number, NonNullable<typeof myBatches>[number]>();
        myBatches?.forEach((b) => map.set(b.id, b));
        return map;
    }, [myBatches]);

    const filtered = useMemo(() => {
        if (!orders) return [];
        const statuses = TAB_STATUSES[tab];
        return statuses ? orders.filter((o) => statuses.includes(o.status)) : orders;
    }, [orders, tab]);

    const counts = useMemo(() => {
        const result = {} as Record<Tab, number>;
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

    const act = async (id: number, status: OrderStatus) => {
        setActingId(id);
        try {
            await orderService.updateStatus(id, status);
            refetch();
        } finally {
            setActingId(null);
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-5">
                {TABS.map((t) => (
                    <button
                        key={t.key}
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

            <div className="bg-card border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                        <th className="text-left p-3">Mã đơn</th>
                        <th className="text-left p-3">Khách</th>
                        <th className="text-left p-3">Địa chỉ</th>
                        <th className="text-left p-3">Ngày</th>
                        <th className="text-left p-3">Trạng thái</th>
                        <th className="text-right p-3">Tổng</th>
                        <th className="text-right p-3">Thao tác</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map((o) => {
                        const isOpen = expanded === o.id;
                        const myItems = o.details?.filter((d) => batchById.has(d.batch_id)) ?? [];
                        return (
                            <Fragment key={o.id}>
                                <tr onClick={() => setExpanded(isOpen ? null : o.id)} className="border-t cursor-pointer hover:bg-muted/30">
                                    <td className="p-3 font-mono">
                                        <div className="flex items-center gap-1.5">
                                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                            #{o.id}
                                        </div>
                                    </td>
                                    <td className="p-3">{o.receiver_name}</td>
                                    <td className="p-3 text-muted-foreground">{o.shipping_address}</td>
                                    <td className="p-3">{formatDate(o.created_at)}</td>
                                    <td className="p-3"><StatusBadge status={o.status} /></td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(o.total_price ?? 0)}</td>
                                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end">
                                            {o.status === "Confirmed" && (
                                                <button
                                                    disabled={actingId === o.id}
                                                    onClick={() => act(o.id, "Preparing")}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50"
                                                >
                                                    <PackageCheck className="w-3.5 h-3.5" /> Đã chuẩn bị hàng
                                                </button>
                                            )}
                                            {o.status === "Preparing" && (
                                                <button
                                                    disabled={actingId === o.id}
                                                    onClick={() => act(o.id, "Shipping")}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50"
                                                >
                                                    <Truck className="w-3.5 h-3.5" /> Đã gửi hàng
                                                </button>
                                            )}
                                            {o.status === "Pending" && (
                                                <span className="text-xs text-muted-foreground">Chờ admin duyệt đơn</span>
                                            )}
                                            {["Shipping", "Delivered", "Completed", "Cancelled"].includes(o.status) && (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {isOpen && (
                                    <tr className="border-t bg-muted/20">
                                        <td colSpan={7} className="p-4">
                                            <div className="grid md:grid-cols-[1fr_260px] gap-5">
                                                <div className="space-y-2">
                                                    {myItems.map((d) => {
                                                        const b = batchById.get(d.batch_id);
                                                        return (
                                                            <div key={d.id} className="flex items-center gap-3 bg-card border rounded-xl p-2.5">
                                                                {b?.image && <img src={b.image} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm truncate">{b?.product_name ?? `Lô hàng #${d.batch_id}`}</div>
                                                                    <div className="text-xs text-muted-foreground truncate">Mã lô {b?.batch_code} · SL: {d.quantity}</div>
                                                                </div>
                                                                <div className="font-semibold text-sm">{formatCurrency(d.price * d.quantity)}</div>
                                                            </div>
                                                        );
                                                    })}
                                                    {myItems.length === 0 && (
                                                        <p className="text-xs text-muted-foreground">Không có sản phẩm nào của bạn trong đơn này.</p>
                                                    )}
                                                </div>

                                                <div className="bg-card border rounded-xl p-3 space-y-2 text-sm h-fit">
                                                    <div className="flex items-start gap-2">
                                                        <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                                                        <span>{o.receiver_phone}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
                                                        <span>{o.shipping_address}</span>
                                                    </div>
                                                    {o.tracking_note && (
                                                        <div className="flex items-start gap-2 text-muted-foreground">
                                                            <StickyNote className="w-3.5 h-3.5 mt-0.5" />
                                                            <span>{o.tracking_note}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        );
                    })}
                    </tbody>
                </table>
                {!loading && filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground p-6 text-center">
                        {orders && orders.length > 0
                            ? "Không có đơn hàng nào trong mục này."
                            : "Chưa có đơn hàng nào liên quan tới lô hàng của bạn."}
                    </p>
                )}
            </div>
        </div>
    );
}