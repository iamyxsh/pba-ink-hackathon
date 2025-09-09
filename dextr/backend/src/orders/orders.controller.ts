import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'List of all orders with their current status' })
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get specific order by ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID', example: '0x123...' })
  @ApiResponse({ status: 200, description: 'Order details including status and remaining amount' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getOrder(orderId);
  }

  @Get('orderbook/:tokenPair')
  @ApiOperation({ summary: 'Get orderbook for specific token pair' })
  @ApiParam({ name: 'tokenPair', description: 'Token pair (e.g., DOT/USDC)', example: 'DOT/USDC' })
  @ApiResponse({ status: 200, description: 'Orderbook with bids and asks sorted by price' })
  getOrderbook(@Param('tokenPair') tokenPair: string) {
    return this.ordersService.getOrderbook(tokenPair);
  }

  @Get('orderbooks/all')
  @ApiOperation({ summary: 'Get all orderbooks' })
  @ApiResponse({ status: 200, description: 'List of all token pair orderbooks with current bids and asks' })
  getAllOrderbooks() {
    const orderbooks = this.ordersService.getAllOrderbooks();
    return Array.from(orderbooks.entries()).map(([pair, orderbook]) => ({
      ...orderbook,
      pair,
    }));
  }
}