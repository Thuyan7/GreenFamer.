import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Query, Put } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('buyer')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutDto) {
    return this.orderService.checkout(user.sub, dto);
  }

  @Get()
  getMyOrders(@CurrentUser() user: any) {
    return this.orderService.getMyOrders(user.sub);
  }

  @Put(':id/confirm')
  confirmReceived(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.confirmReceived(Number(user.sub), id);
  }
  @Put(':id/cancel')
  cancelMyOrder(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.cancelByBuyer(Number(user.sub), id);
  }

  @Get('seller')
  @Roles('seller')
  getSellerOrders(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.orderService.findBySeller(Number(user.sub), status);
  }

  @Put(':id/status')
  @Roles('seller', 'admin')
  updateStatus(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
  ) {
    return this.orderService.updateStatus(user, id, status);
  }
  @Get('admin/all')
  @Roles('admin')
  getAllForAdmin(@Query('status') status?: string) {
    return this.orderService.findAllAdmin(status);
  }
  @Get(':id')
  getOrderDetail(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.orderService.getOrderDetail(user.sub, id);
  }

}