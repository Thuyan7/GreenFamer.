import { useParams, Link } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

export default function OrderDetailPage() {
    const { id } = useParams();
    const { data: order, loading, refetch } = useFetch(() => orderService.getById(Number(id)), [id]);
    const [confirming, setConfirming] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState("");

    const confirmReceived = async () => {
        if (!order) return;
        setConfirming(true);
        try {
            await orderService.confirmReceived(order.id);
            refetch();
        } finally {
            setConfirming(false);
        }
    };

    const cancelOrder = async () => {
        if (!order) return;
        if (!window.confirm(`Bạn chắc chắn muốn hủy đơn hàng #${order.id}?`)) return;
        setCancelling(true);
        setError("");
        try {
            await orderService.cancel(order.id);
            refetch();
        } catch (err: any) {
            const m = err?.message;
            setError(Array.isArray(m) ? m.join(", ") : m ?? "Hủy đơn thất bại");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-muted-foreground">Đang tải...</div>;
    if (!order) return <div className="max-w-3xl mx-auto px-4 py-16 text-muted-foreground">Không tìm thấy đơn hàng.</div>;

    // Chỉ cho khách tự hủy khi đơn còn chờ duyệt và chưa thanh toán online
    const isPending = order.status === "Pending";
    const canCancel = isPending && order.payment_status !== "Paid";
    const paidPending = isPending && order.payment_status === "Paid";

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary">← Đơn hàng của tôi</Link>
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <h1 className="text-2xl font-bold">Đơn hàng #{order.id}</h1>
                <StatusBadge status={order.status} />
            </div>

            <div className="mt-6 bg-card border rounded-2xl p-6">
                <h3 className="font-semibold mb-3">Thông tin nhận hàng</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                    <div>{order.receiver_name} · {order.receiver_phone}</div>
                    <div>{order.shipping_address}</div>
                    <div>Đặt ngày {formatDate(order.created_at)}</div>
                    {order.tracking_note && <div className="mt-2 p-3 rounded-lg bg-muted/50">{order.tracking_note}</div>}
                </div>
            </div>

            <div className="mt-4 bg-card border rounded-2xl p-6">
                <h3 className="font-semibold mb-3">Sản phẩm</h3>
                <div className="space-y-2">
                    {order.details?.map((d) => (
                        <div key={d.id} className="flex justify-between text-sm border-b last:border-0 pb-2">
                            <span>{d.product_name ?? `Lô hàng #${d.batch_id}`} × {d.quantity}</span>
                            <span className="font-medium">{formatCurrency(d.price * d.quantity)}</span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 mt-3 border-t">
                    <span>Tổng cộng</span><span className="text-primary">{formatCurrency(order.total_price)}</span>
                </div>
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
                {(order.status === "Shipping" || order.status === "Delivered") && (
                    <button onClick={confirmReceived} disabled={confirming}
                            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold">
                        <CheckCircle2 className="w-4 h-4" /> {confirming ? "Đang xác nhận..." : "Xác nhận đã nhận hàng"}
                    </button>
                )}

                {canCancel && (
                    <button onClick={cancelOrder} disabled={cancelling}
                            className="inline-flex items-center gap-2 border-2 border-destructive text-destructive px-6 py-3 rounded-xl font-semibold hover:bg-destructive/10 disabled:opacity-50">
                        <XCircle className="w-4 h-4" /> {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                    </button>
                )}
            </div>

            {paidPending && (
                <p className="mt-3 text-xs text-muted-foreground">
                    Đơn này đã thanh toán online nên không thể tự hủy. Vui lòng liên hệ cửa hàng để được hoàn tiền.
                </p>
            )}
        </div>
    );
}