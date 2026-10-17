import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { farmService } from "@/services/farmService";
import { MapPin, Plus, Award, Upload, X, ArrowLeft } from "lucide-react";

interface StagedFile {
    file: File;
    url: string; // URL tạm để xem trước
}

export default function FarmCreatePage() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        farm_name: "", address: "", description: "",
        area_ha: "", farming_method: "",
    });
    const [cover, setCover] = useState<StagedFile | null>(null);
    const [certs, setCerts] = useState<StagedFile[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Giải phóng các URL tạm khi rời trang
    const stagedRef = useRef<StagedFile[]>([]);
    stagedRef.current = [...(cover ? [cover] : []), ...certs];
    useEffect(() => {
        return () => stagedRef.current.forEach((s) => URL.revokeObjectURL(s.url));
    }, []);

    const pickCover = (file: File) => {
        if (cover) URL.revokeObjectURL(cover.url);
        setCover({ file, url: URL.createObjectURL(file) });
    };

    const addCertificates = (files: FileList) => {
        const added = Array.from(files).map((file) => ({ file, url: URL.createObjectURL(file) }));
        setCerts((prev) => [...prev, ...added]);
    };

    const removeCertificate = (index: number) => {
        const target = certs[index];
        if (target) URL.revokeObjectURL(target.url);
        setCerts((prev) => prev.filter((_, i) => i !== index));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        const name = form.farm_name.trim();
        if (!name) {
            setError("Vui lòng nhập tên trang trại.");
            return;
        }
        const area = form.area_ha.trim() ? Number(form.area_ha) : undefined;
        if (area !== undefined && (!Number.isFinite(area) || area < 0)) {
            setError("Diện tích không hợp lệ.");
            return;
        }

        setSaving(true);
        setError("");

        // 1. Tạo trang trại
        let farmId: number;
        try {
            const farm = await farmService.createFarm({
                farm_name: name,
                address: form.address.trim() || undefined,
                description: form.description.trim() || undefined,
                area_ha: area,
                farming_method: form.farming_method.trim() || undefined,
            });
            farmId = farm.id;
        } catch (err: any) {
            const m = err?.message;
            setError(Array.isArray(m) ? m.join(", ") : m ?? "Tạo trang trại thất bại");
            setSaving(false);
            return;
        }

        // 2. Trang trại đã có id: tải ảnh bìa và chứng nhận lên (lỗi ảnh không làm mất trang trại)
        const failed: string[] = [];
        const reason = (err: any) => {
            const m = err?.message;
            return Array.isArray(m) ? m.join(", ") : m ?? "lỗi không rõ";
        };
        if (cover) {
            try {
                await farmService.uploadImage(farmId, cover.file, "Farm");
            } catch (err) {
                failed.push(`ảnh bìa (${reason(err)})`);
            }
        }
        for (const c of certs) {
            try {
                await farmService.uploadImage(farmId, c.file, "Certifi");
            } catch (err) {
                failed.push(`chứng nhận "${c.file.name}" (${reason(err)})`);
            }
        }

        navigate(`/seller/farms/${farmId}`, {
            state: {
                message: failed.length
                    ? `Đã tạo trang trại nhưng chưa tải được: ${failed.join(", ")}. Bạn có thể thêm lại ở trang này.`
                    : "Đã tạo trang trại. Trang trại đang chờ quản trị viên duyệt.",
            },
        });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <Link to="/seller/farms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4" /> Danh sách trang trại
            </Link>

            <h1 className="text-xl font-bold">Thêm trang trại mới</h1>

            {error && (
                <div className="bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}

            <form onSubmit={submit} className="grid md:grid-cols-[1fr_320px] gap-5">
                {/* Cột trái: ảnh + xem trước + form */}
                <div className="space-y-5">
                    <div className="bg-card border rounded-2xl overflow-hidden">
                        <div className="aspect-[16/7] bg-muted relative">
                            {cover ? (
                                <img src={cover.url} alt={form.farm_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                    Chưa có ảnh bìa
                                </div>
                            )}
                            <label className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:bg-black/70">
                                <Upload className="w-3.5 h-3.5" /> {cover ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
                                <input
                                    type="file" accept="image/*" className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) pickCover(file);
                                        e.target.value = "";
                                    }}
                                />
                            </label>
                        </div>
                        <div className="p-5">
                            <h2 className="text-xl font-bold">{form.farm_name || "Chưa đặt tên trang trại"}</h2>
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

                    {/* Form nhập thông tin */}
                    <div className="bg-card border rounded-2xl p-6 space-y-4">
                        <h3 className="font-semibold">Thông tin trang trại</h3>
                        <Field label="Tên trang trại *" value={form.farm_name} onChange={(v) => setForm({ ...form, farm_name: v })} />
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
                        <p className="text-xs text-muted-foreground">
                            Chủ trang trại được lấy từ tên tài khoản của bạn. Trang trại mới ở trạng thái chờ duyệt cho đến khi quản trị viên xác nhận.
                        </p>
                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50">
                                <Plus className="w-4 h-4" /> {saving ? "Đang tạo..." : "Tạo trang trại"}
                            </button>
                            <Link to="/seller/farms" className="px-4 py-2.5 rounded-lg border text-sm">Hủy</Link>
                        </div>
                    </div>
                </div>

                {/* Cột phải: chứng nhận */}
                <div className="space-y-5">
                    <div className="bg-card border rounded-2xl p-5">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <Award className="w-4 h-4 text-primary" /> Chứng nhận
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            {certs.map((c, i) => (
                                <div key={c.url} className="relative group rounded-lg overflow-hidden border aspect-[4/3] bg-muted">
                                    <img src={c.url} alt="Chứng nhận" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeCertificate(i)}
                                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {certs.length === 0 && (
                            <p className="text-xs text-muted-foreground">Chưa chọn chứng nhận nào.</p>
                        )}

                        <label className="w-full mt-3 border-2 border-dashed rounded-lg py-2.5 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" /> Chọn chứng nhận
                            <input
                                type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) addCertificates(e.target.files);
                                    e.target.value = "";
                                }}
                            />
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                            Ảnh sẽ được tải lên sau khi trang trại được tạo.
                        </p>
                    </div>
                </div>
            </form>
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