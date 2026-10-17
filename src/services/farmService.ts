import api from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios";
import type {
    AdminFarmListResponse,
    FarmDetail,
    FarmListItem,
    FarmImageItem,
    FarmPayload,
    MyFarmProfile,
} from "@/types/farm.ts";

export const farmService = {
    // Public farm list
    getAll: async (): Promise<FarmListItem[]> => {
        const response: any = await api.get("/farms");
        const list = Array.isArray(response) ? response : response?.data ?? [];

        return list.map((farm: any): FarmListItem => ({
            id: farm.id,
            farmName: farm.farmName ?? farm.farm_name,
            address: farm.address,
            description: farm.description,
            status: farm.status,
            coverImage: farm.coverImage ?? farm.image ?? null,
        }));
    },

    // Seller xem farm của mình
    getById: async (id: number) => {
        const response =
            await api.get(`/seller/farms/${id}`) as ApiResponse<FarmDetail>;

        return response.data;
    },

    // Seller: danh sách các farm của mình
    getMyFarms: async (): Promise<FarmListItem[]> => {
        const response: any = await api.get("/seller/farms", { params: { limit: 100 } });
        const list = Array.isArray(response) ? response : response?.data ?? [];

        return list.map((farm: any): FarmListItem => ({
            id: farm.id,
            farmName: farm.farm_name,
            address: farm.address,
            description: farm.description,
            status: farm.status,
            coverImage: farm.image ?? null,
        }));
    },

    // Seller: chi tiết một farm của mình (hồ sơ để chỉnh sửa)
    getMyFarm: async (id: number): Promise<MyFarmProfile> => {
        const res: any = await api.get(`/seller/farms/${id}`);
        const f = res.data;

        const images = [...(f.images ?? [])].sort((a: any, b: any) => a.id - b.id);
        const toItem = (img: any): FarmImageItem => ({
            id: img.id,
            url: img.image_url,
            type: img.image_type,
        });

        return {
            id: f.id,
            farm_name: f.farm_name ?? "",
            owner_name: f.owner_name ?? "",
            address: f.address ?? "",
            description: f.description ?? "",
            area_ha: f.area_ha != null ? Number(f.area_ha) : null,
            farming_method: f.farming_method ?? "",
            status: f.status,
            cover: images.filter((i: any) => i.image_type === "Farm").map(toItem)[0] ?? null,
            certificates: images.filter((i: any) => i.image_type === "Certifi").map(toItem),
        };
    },

    // Seller: tạo trang trại mới (chủ trang trại lấy từ tài khoản, trạng thái ban đầu là chờ duyệt)
    createFarm: async (payload: FarmPayload): Promise<{ id: number }> => {
        const response: any = await api.post("/seller/farms", payload);
        return response.data;
    },

    // Seller: cập nhật thông tin farm
    updateMyFarm: async (id: number, payload: Record<string, unknown>) => {
        const response =
            await api.patch(`/seller/farms/${id}`, payload) as ApiResponse<unknown>;

        return response.data;
    },

    // Seller: upload ảnh bìa (type "Farm") hoặc chứng nhận (type "Certifi")
    uploadImage: async (farmId: number, file: File, type: "Farm" | "Certifi") => {
        const formData = new FormData();
        formData.append("image", file); // tên field phải là "image" (FileInterceptor('image'))
        formData.append("image_type", type);

        return api.post(`/seller/farms/${farmId}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    // Seller: xóa ảnh
    deleteImage: async (imageId: number) => {
        return api.delete(`/seller/farms/images/${imageId}`);
    },

    // Admin - danh sách farm
    getAllAdmin: async () => {
        const response =
            await api.get("/admin/farms", {
                params: { limit: 100 },
            }) as ApiResponse<AdminFarmListResponse>;

        return response.data.data.map((farm): FarmListItem => ({
            id: farm.id,
            farmName: farm.farm_name,
            address: farm.address,
            description: farm.description,
            status: farm.status,
            coverImage: farm.image,
            sellerId: farm.seller_id,
            areaHa: farm.area_ha ?? undefined,
        }));
    },

    // Admin - chi tiết farm
    getByIdAdmin: async (id: number) => {
        const response =
            await api.get(`/admin/farms/${id}`) as ApiResponse<FarmDetail>;

        return response.data;
    },

    // Admin - duyệt farm
    approve: async (id: number) => {
        const response =
            await api.patch(
                `/admin/farms/${id}/approve`
            ) as ApiResponse<unknown>;

        return response.data;
    },

    // Admin - từ chối farm
    reject: async (
        id: number,
        note?: string
    ) => {
        const response =
            await api.patch(
                `/admin/farms/${id}/reject`,
                { note }
            ) as ApiResponse<unknown>;

        return response.data;
    },
};