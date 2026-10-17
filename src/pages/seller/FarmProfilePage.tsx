import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useFetch } from "@/hooks/useFetch";
import { farmService } from "@/services/farmService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MapPin, Save, Award, Upload, X, ArrowLeft } from "lucide-react";

export default function FarmProfilePage() {
    const { id } = useParams<{ id: string }>();
    const farmId = Number(id);
    const { data: farm, loading, refetch } = useFetch(
        () => (Number.isFinite(farmId) ? farmService.getMyFarm(farmId) : Promise.resolve(null)),
        [farmId],
    );

    const [form, setForm] = useState({
        farm_name: "", owner_name: "", address: "", description: "",
        area_ha: "", farming_method: "",
    });
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    // Trang tạo trang trại gửi kèm thông báo khi chuyển sang đây
    const location = useLocation();
    const [message, setMessage] = useState<string>(
        (location.state as { message?: string } | null)?.message ?? ""
    );

    useEffect(() => {
        if (farm) {
            setForm({
                farm_name: farm.farm_name ?? "",
                owner_name: farm.owner_name ?? "",
                address: farm.address ?? "",
                description: farm.description ?? "",
                area_ha: farm.area_ha != null ? String(farm.area_ha) : "",
                farming_method: farm.farming_method ?? "",
            });
        }
    }, [farm]);

    // Giải phóng URL tạm khi đổi/đóng
    useEffect(() => {
        return () => {
            if (coverPreview) URL.revokeObjectURL(coverPreview);
        };
    }, [coverPreview]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!farm) return;
        setSaving(true);
        setMessage("");
        try {
            // 1. Cập nhật thông tin (chỉ gửi các trường backend nhận)
            await farmService.updateMyFarm(farm.id, {
                farm_name: form.farm_name,
                owner_name: form.owner_name,
                address: form.address,
                description: form.description,
                area_ha: form.area_ha ? Number(form.area_ha) : undefined,
                farming_method: form.farming_method,
            });

            // 2. Đổi ảnh bìa: tải ảnh mới lên rồi mới xóa ảnh cũ
            if (coverFile) {
                await farmService.uploadImage(farm.id, coverFile, "Farm");
                if (farm.cover) await farmService.deleteImage(farm.cover.id);
                setCoverFile(null);
                setCoverPreview(null);
            }

            setMessage("Đã lưu hồ sơ trang trại.");
            refetch();
        } catch (err: any) {
            setMessage(err?.message ?? "Lưu thất bại");
        } finally {
            setSaving(false);
        }
    };

    const uploadCertificate = async (file: File) => {
        if (!farm) return;
        setUploading(true);
        setMessage("");
        try {
            await farmService.uploadImage(farm.id, file, "Certifi");
            setMessage("Đã tải chứng nhận lên.");
            refetch();
        } catch (err: any) {
            setMessage(err?.message ?? "Tải chứng nhận thất bại");
        } finally {
            setUploading(false);
        }
    };

    const removeCertificate = async (imageId: number) => {
        if (!window.confirm("Xóa chứng nhận này?")) return;
        try {
            await farmService.deleteImage(imageId);
            refetch();
        } catch (err: any) {
            setMessage(err?.message ?? "Xóa thất bại");
        }
    };

    if (loading) return <p className="text-muted-foreground">Đang tải...</p>;

    if (!farm) {
        return (
            <div className="space-y-3">
                <Link to="/seller/farms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                    <ArrowLeft className="w-4 h-4" /> Danh sách trang trại
                </Link>
                <p className="text-muted-foreground">Không tìm thấy trang trại.</p>
            </div>
        );
    }

    const coverSrc = coverPreview ?? farm.cover?.url ?? null;
    const statusLabel =
        farm.status === "approved" ? "Approved" : farm.status === "rejected" ? "Rejected" : "Pending";

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <Link to="/seller/farms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" /> Danh sách trang trại
            </Link>

            {message && (
                <div className="bg-primary/10 text-primary text-sm rounded-xl px-4 py-2.5">{message}</div>
            )}

            <div className="grid md:grid-cols-[1fr_320px] gap-5">
                {/* Cột trái: ảnh + thông tin trang trại */}
                <div className="space-y-5">
                    <div className="bg-card border rounded-2xl overflow-hidden">
                        <div className="aspect-[16/7] bg-muted relative">
                            {coverSrc ? (
                                <img src={coverSrc} alt={form.farm_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Chưa có ảnh bìa
                                </div>
                            )}
                            <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/70">
                                <Upload className="w-3.5 h-3.5" /> Đổi ảnh bìa
                                <input
                                    type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setCoverFile(file);
                                            setCoverPreview(URL.createObjectURL(file));
                                        }
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center justify-between gap-2">
                                <h2 className="text-xl font-bold">{form.farm_name || "Chưa đặt tên trang trại"}</h2>
                                <StatusBadge status={statusLabel} />
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4" /> {form.address || "Chưa cập nhật địa chỉ"}
                            </div>
                            <p className="text-sm mt-2 text-muted-foreground">{form.description}</p>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <Info label="Diện tích" value={form.area_ha ? `${form.area_ha} ha` : "—"} />
                                <Info label="Phương pháp" value={form.farming_method || "—"} />
                            </div>
                        </div>
                    </div>

                    {/* Form chỉnh sửa */}
                    <form onSubmit={submit} className="bg-card border rounded-2xl p-6 space-y-4">
                        <h3 className="font-semibold">Chỉnh sửa thông tin</h3>
                        <div className="grid md:grid-cols-2 gap-3">
                            <Field label="Tên trang trại" value={form.farm_name} onChange={(v) => setForm({ ...form, farm_name: v })} />
                            <Field label="Chủ trang trại" value={form.owner_name} onChange={(v) => setForm({ ...form, owner_name: v })} />
                        </div>
                        <Field label="Địa chỉ" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
                        <div className="grid md:grid-cols-2 gap-3">
                            <Field label="Diện tích (ha)" value={form.area_ha} onChange={(v) => setForm({ ...form, area_ha: v })} type="number" />
                            <Field label="Phương pháp canh tác" value={form.farming_method} onChange={(v) => setForm({ ...form, farming_method: v })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Mô tả</label>
                            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                      className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
                        </div>
                        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50">
                            <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </form>
                </div>

                {/* Cột phải: chứng nhận */}
                <div className="space-y-5">
                    <div className="bg-card border rounded-2xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-primary" /> Chứng nhận
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            {farm.certificates.map((c) => (
                                <div key={c.id} className="relative group rounded-lg overflow-hidden border aspect-[4/3] bg-muted">
                                    <img src={c.url} alt="Chứng nhận" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeCertificate(c.id)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {farm.certificates.length === 0 && (
                            <p className="text-xs text-muted-foreground">Chưa có chứng nhận nào.</p>
                        )}

                        <label className="w-full mt-3 border-2 border-dashed rounded-lg py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" /> {uploading ? "Đang tải lên..." : "Tải chứng nhận mới"}
                            <input
                                type="file" accept="image/*" className="hidden" disabled={uploading}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadCertificate(file);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="p-2.5 rounded-lg bg-muted/50 text-center">
            <div className="text-[11px] text-muted-foreground">{label}</div>
            <div className="font-medium text-sm mt-0.5">{value}</div>
        </div>
    );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div>
            <label className="text-sm font-medium">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border bg-background" />
        </div>
    );
}