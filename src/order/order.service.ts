// src/order/order.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Batch } from '../batch/entities/batch.entity';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(Batch) private readonly batchRepo: Repository<Batch>,
    private readonly dataSource: DataSource,
  ) { }

  async checkout(buyerId: number, dto: CheckoutDto) {
    const cartItems = await this.cartRepo
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.batch', 'batch')
      .leftJoinAndSelect('batch.product', 'product')
      .where('cart.id IN (:...ids)', { ids: dto.cartItemIds })
      .andWhere('cart.buyer_id = :buyerId', { buyerId })
      .getMany();

    if (cartItems.length !== dto.cartItemIds.length) {
      throw new BadRequestException('Một số sản phẩm trong giỏ không hợp lệ hoặc không thuộc về bạn');
    }

    for (const item of cartItems) {
      if (item.quantity > item.batch.quantity) {
        throw new BadRequestException(
          `Sản phẩm "${item.batch.product?.name}" chỉ còn ${item.batch.quantity}, không đủ số lượng bạn chọn`,
        );
      }
    }

    const totalPrice = cartItems.reduce(
      (sum, item) => sum + Number(item.batch.product.price) * item.quantity,
      0,
    );

    return this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        buyer_id: buyerId,
        receiver_name: dto.receiverName,
        receiver_phone: dto.receiverPhone,
        shipping_address: dto.shippingAddress,
        total_price: totalPrice,
        status: OrderStatus.PENDING,
        payment_method: dto.paymentMethod as any,
        payment_status: PaymentStatus.UNPAID,
      });
      const savedOrder = await manager.save(order);

      for (const item of cartItems) {
        const detail = manager.create(OrderDetail, {
          order: { id: savedOrder.id } as any,
          batch: { id: item.batch.id } as any,
          quantity: item.quantity,
          price: item.batch.product.price,
        });
        await manager.save(detail);

        await manager.decrement(Batch, { id: item.batch.id }, 'quantity', item.quantity);
      }

      await manager.delete(Cart, dto.cartItemIds);

      return { orderId: savedOrder.id, totalPrice, message: 'Đặt hàng thành công' };
    });
  }

  async getMyOrders(buyerId: number) {
    return this.orderRepo.find({
      where: { buyer_id: buyerId },
      relations: { details: true },
      order: { created_at: 'DESC' },
    });
  }

  async getOrderDetail(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, buyer_id: buyerId },
      relations: { details: { batch: { product: true } } },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    return {
      ...order,
      total_price: Number(order.total_price),
      details: (order.details ?? []).map((d) => ({
        id: d.id,
        order_id: order.id,
        batch_id: d.batch.id,
        quantity: d.quantity,
        price: Number(d.price),
        product_name: d.batch.product?.name,
        batch_code: d.batch.batch_code,
      })),
    };
  }

  async confirmReceived(buyerId: number, orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId, buyer_id: buyerId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (![OrderStatus.SHIPPING, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException('Đơn hàng chưa ở trạng thái giao hàng');
    }

    order.status = OrderStatus.COMPLETED;
    if (order.payment_method === PaymentMethod.COD) {
      order.payment_status = PaymentStatus.PAID;
    }
    return this.orderRepo.save(order);
  }

  async cancelByBuyer(buyerId: number, orderId: number) {
  return this.dataSource.transaction(async (manager) => {
    // Khóa dòng đơn để hai lần bấm hủy cùng lúc không hoàn kho 2 lần
    const order = await manager.findOne(Order, {
      where: { id: orderId, buyer_id: buyerId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy đơn đang chờ duyệt');
    }
    if (order.payment_status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Đơn đã thanh toán online, vui lòng liên hệ cửa hàng để được hoàn tiền',
      );
    }

    const details = await manager.find(OrderDetail, {
      where: { order: { id: orderId } },
      relations: { batch: true },
    });
    for (const d of details) {
      await manager.increment(Batch, { id: d.batch.id }, 'quantity', d.quantity);
    }

    order.status = OrderStatus.CANCELLED;
    return manager.save(order);
  });
}
//Admin
  async findAllAdmin(status?: string) {
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const orders = await this.orderRepo.find({
      where: status ? { status: status as OrderStatus } : {},
      relations: {
        details: {
          batch: {
            images: true,
            product: { farm: true },
          },
        },
      },
      order: { created_at: 'DESC' },
    });

    return orders.map((o) => ({
      ...o,
      total_price: o.total_price == null ? 0 : Number(o.total_price),
      details: (o.details ?? []).map((d) => ({
        id: d.id,
        order_id: o.id,
        batch_id: d.batch.id,
        quantity: d.quantity,
        price: Number(d.price),
        product_name: d.batch.product?.name,
        farm_name: d.batch.product?.farm?.farm_name,
        batch_code: d.batch.batch_code,
        image: d.batch.images?.[0]?.image_url,
      })),
    }));
  }
  //Seller
  async getSellerOrders(sellerId: number, status?: OrderStatus) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.details', 'd')
      .innerJoinAndSelect('d.batch', 'b')
      .innerJoinAndSelect('b.product', 'p')
      .innerJoin('p.farm', 'f')
      .innerJoin('f.seller', 's')
      .where('s.id = :sellerId', { sellerId })
      .orderBy('o.created_at', 'DESC');

    if (status) qb.andWhere('o.status = :status', { status });

    const orders = await qb.getMany();

    return orders.map((o) => ({
      ...o,
      seller_total: o.details.reduce(
        (sum, d) => sum + Number(d.price) * d.quantity,
        0,
      ),
    }));
  }

  async findBySeller(sellerId: number, status?: string) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .innerJoinAndSelect('o.details', 'd')
      .innerJoinAndSelect('d.batch', 'b')
      .innerJoin('b.product', 'p')
      .innerJoin('p.farm', 'f')
      .where('f.seller_id = :sellerId', { sellerId })
      .orderBy('o.created_at', 'DESC');

    if (status) qb.andWhere('o.status = :status', { status });

    const orders = await qb.getMany();

    return orders.map((o) => {
      const details = o.details.map((d) => ({
        id: d.id,
        order_id: o.id,
        batch_id: d.batch.id, 
        quantity: d.quantity,
        price: Number(d.price),
      }));

      return {
        ...o,
        total_price: o.total_price == null ? 0 : Number(o.total_price),
        seller_total: details.reduce((sum, d) => sum + d.price * d.quantity, 0),
        details,
      };
    });
  }

  async updateStatus(
    user: { sub: number | string; role: string },
    orderId: number,
    status: OrderStatus,
  ) {
    if (!Object.values(OrderStatus).includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (user.role === 'admin') {
      // Admin chỉ duyệt/từ chối đơn đang chờ
      const allowed = [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
      if (order.status !== OrderStatus.PENDING || !allowed.includes(status)) {
        throw new BadRequestException(
          `Không thể chuyển từ ${order.status} sang ${status}`,
        );
      }
    }

    if (user.role === 'seller') {
      // Seller chỉ được đi tiếp: Confirmed → Preparing → Shipping
      const next: Partial<Record<OrderStatus, OrderStatus>> = {
        [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
        [OrderStatus.PREPARING]: OrderStatus.SHIPPING,
      };
      if (next[order.status] !== status) {
        throw new BadRequestException(
          `Không thể chuyển từ ${order.status} sang ${status}`,
        );
      }

      // Đơn phải có ít nhất 1 sản phẩm thuộc seller
      const owns = await this.orderRepo
        .createQueryBuilder('o')
        .innerJoin('o.details', 'd')
        .innerJoin('d.batch', 'b')
        .innerJoin('b.product', 'p')
        .innerJoin('p.farm', 'f')
        .where('o.id = :orderId', { orderId })
        .andWhere('f.seller_id = :sellerId', { sellerId: Number(user.sub) })
        .getCount();
      if (!owns) throw new ForbiddenException('Đơn hàng này không có sản phẩm của bạn');
    }
    if (status === OrderStatus.CANCELLED) {
      return this.dataSource.transaction(async (manager) => {
        const details = await manager.find(OrderDetail, {
          where: { order: { id: orderId } },
          relations: { batch: true },
        });
        for (const d of details) {
          await manager.increment(Batch, { id: d.batch.id }, 'quantity', d.quantity);
        }
        order.status = OrderStatus.CANCELLED;
        return manager.save(order);
      });
    }
    order.status = status;
    return this.orderRepo.save(order);
  }
}