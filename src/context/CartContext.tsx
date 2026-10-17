import {
    createContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

import { cartService } from "@/services/cartService";
import { useAuth } from "@/hooks/useAuth";

export interface CartLine {
    cart_id: number;
    batch_id: number;
    product_name: string;
    image: string | null;
    price: number;
    quantity: number;
    stock: number;
    farm_name?: string;
    batch_code?: string;
}

interface CartContextType {
    items: CartLine[];
    loading: boolean;

    addItem: (
        batchId: number,
        quantity: number
    ) => Promise<void>;

    updateQuantity: (
        cartId: number,
        quantity: number
    ) => Promise<void>;

    removeItem: (
        cartId: number
    ) => Promise<void>;

    clearCart: () => void;

    refreshCart: () => Promise<void>;

    totalItems: number;
    totalPrice: number;
}

export const CartContext =
    createContext<CartContextType | null>(null);

export function CartProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {
    const { user } = useAuth();
    // Backend chỉ cho role "buyer" dùng giỏ hàng (CartController có @Roles('buyer'))
    const isBuyer = user?.role === "buyer";

    const [items, setItems] = useState<CartLine[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshCart = async () => {
        // Chưa đăng nhập, hoặc là seller/admin: không gọi API (tránh lỗi 403)
        if (!isBuyer) {
            setItems([]);
            return;
        }

        try {
            setLoading(true);

            const response = await cartService.getMyCart();

            const mappedItems: CartLine[] =
                response.items.map((item) => ({
                    cart_id: item.id,

                    batch_id: item.batch.id,

                    product_name:
                        item.product?.name ?? "Sản phẩm",

                    image:
                        item.image ?? null,

                    price:
                        Number(item.product?.price ?? 0),

                    quantity:
                        Number(item.quantity),

                    stock:
                        Number(item.batch.quantityAvailable),

                    farm_name:
                    item.farmName,

                    batch_code:
                    item.batch.batchCode,
                }));

            setItems(mappedItems);
        } catch (error) {
            console.error("Get cart error:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // Tải giỏ khi đăng nhập bằng tài khoản khách; xóa giỏ cũ khi đăng xuất / đổi sang role khác
    useEffect(() => {
        refreshCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBuyer]);

    const addItem = async (
        batchId: number,
        quantity: number
    ) => {
        await cartService.addToCart(
            batchId,
            quantity
        );

        await refreshCart();
    };

    const updateQuantity = async (
        cartId: number,
        quantity: number
    ) => {
        if (quantity < 1) {
            return;
        }

        await cartService.updateItem(
            cartId,
            quantity
        );

        await refreshCart();
    };

    const removeItem = async (
        cartId: number
    ) => {
        await cartService.removeItem(cartId);
        await refreshCart();
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce(
        (sum, item) =>
            sum + Number(item.quantity),
        0
    );

    const totalPrice = items.reduce(
        (sum, item) =>
            sum +
            Number(item.quantity) *
            Number(item.price),
        0
    );

    return (
        <CartContext.Provider
            value={{
                items,
                loading,

                addItem,
                updateQuantity,
                removeItem,

                clearCart,
                refreshCart,

                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}