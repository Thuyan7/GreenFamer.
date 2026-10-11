import api from "@/lib/axios";
import type { ApiResponse } from "@/lib/axios";
import type {
    CheckoutPayload,
    CheckoutResponse,
    Order,
    OrderDetail,
} from "@/types/order";

export interface OrderWithDetails extends Order {
    details: OrderDetail[];
}

export interface CreateOrderPayload {
    receiver_name: string;
    receiver_phone: string;
    shipping_address: string;
    items: {
        batch_id: number;
        quantity: number;
    }[];
}

export const orderService = {
    create: async (payload: CreateOrderPayload): Promise<Order> => {
        const response = await api.post(
            "/orders",
            payload
        ) as ApiResponse<Order>;

        return response.data;
    },

    checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
        const response = await api.post(
            "/orders/checkout",
            payload
        ) as CheckoutResponse;

        return response;
    },

    getMyOrders: async (status?: string): Promise<OrderWithDetails[]> => {
        const response = await api.get("/orders", { params: { status } });
        return response as unknown as OrderWithDetails[];
    },

    getById: async (id: number): Promise<OrderWithDetails> => {
        const response = await api.get(`/orders/${id}`);
        return response as unknown as OrderWithDetails;
    },

    confirmReceived: async (id: number): Promise<Order> => {
        const response = await api.put(`/orders/${id}/confirm`);
        return response as unknown as Order;
    },

    cancel: async (id: number): Promise<Order> => {
        const response = await api.put(`/orders/${id}/cancel`);
        return response as unknown as Order;
    },

    getSellerOrders: async (status?: string): Promise<OrderWithDetails[]> => {
        const response = await api.get("/orders/seller", { params: { status } });
        return response as unknown as OrderWithDetails[];
    },

    getAll: async (status?: string): Promise<OrderWithDetails[]> => {
        const response = await api.get("/orders/admin/all", { params: { status } });
        return response as unknown as OrderWithDetails[];
    },

    updateStatus: async (id: number, status: string): Promise<Order> => {
        const response = await api.put(`/orders/${id}/status`, { status });
        return response as unknown as Order;
    },
};