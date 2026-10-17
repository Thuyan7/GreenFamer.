import { Link } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { farmService } from "@/services/farmService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MapPin, Plus } from "lucide-react";

export default function SellerFarmsPage() {
    const { data: farms, loading } = useFetch(() => farmService.getMyFarms(), []);

    if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                    {farms && farms.length > 0 ? `Bạn có ${farms.length} trang trại` : "Quản lý các trang trại của bạn"}
                </p>
                <Link
                    to="/seller/farms/new"
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90"
                >
                    <Plus className="w-4 h-4" /> Thêm trang trại
                </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                {farms?.map((f) => (
                    <Link
                        key={f.id}
                        to={`/seller/farms/${f.id}`}
                        className="bg-card border rounded-2xl overflow-hidden hover:border-primary transition"
                    >
                        {f.coverImage ? (
                            <img
                                src={f.coverImage}
                                className="aspect-video w-full object-cover bg-muted"
                                alt={f.farmName}
                            />
                        ) : (
                            <div className="aspect-video w-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                Chưa có ảnh
                            </div>
                        )}

                        <div className="p-5">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-semibold">{f.farmName}</h3>
                                <StatusBadge
                                    status={
                                        f.status === "approved"
                                            ? "Approved"
                                            : f.status === "rejected"
                                                ? "Rejected"
                                                : "Pending"
                                    }
                                />
                            </div>

                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {f.address || "Chưa cập nhật địa chỉ"}
                            </div>

                            <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                                {f.description}
                            </p>
                        </div>
                    </Link>
                ))}

                {(!farms || farms.length === 0) && (
                    <p className="text-sm text-muted-foreground col-span-3 text-center py-10">
                        Bạn chưa có trang trại nào. Bấm "Thêm trang trại" để tạo trang trại đầu tiên.
                    </p>
                )}
            </div>
        </div>
    );
}