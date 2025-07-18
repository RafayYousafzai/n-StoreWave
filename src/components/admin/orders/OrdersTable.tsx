
"use client";

import { useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileText, Undo2, Loader2 } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import OrderStatusSelector from './OrderStatusSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatus } from '@/services/orderService';
import ClientFormattedDate from './ClientFormattedDate';

interface OrdersTableProps {
  initialOrders: Order[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ initialOrders }) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isRefunding, setIsRefunding] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? { ...order, orderStatus: newStatus } : order
      )
    );
  };

  const handleRefundOrder = async (orderId: string) => {
    setIsRefunding(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateOrderStatus(orderId, 'cancelled');
      toast({
        title: "Order Refunded (Status Updated)",
        description: `Order ${orderId} status has been changed to 'cancelled'.`,
      });
      handleStatusUpdate(orderId, 'cancelled'); // Update local state
    } catch (error) {
      console.error("Failed to refund order (update status):", error);
      toast({
        title: "Refund Failed",
        description: "Could not update order status to cancelled. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefunding(prev => ({ ...prev, [orderId]: false }));
    }
  };


  if (orders.length === 0) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>No Orders Found</CardTitle>
                <CardDescription>There are currently no orders to display.</CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <Card className="mt-6 shadow-md">
      <CardHeader>
        <CardTitle>Manage Orders</CardTitle>
        <CardDescription>View and update customer orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Update Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline" title={`View details for order ${order.id}`}>
                    #{order.id.substring(0, 8)}...
                  </Link>
                </TableCell>
                <TableCell>
                    <div>{order.billingFirstName} {order.billingLastName}</div>
                    <div className="text-xs text-muted-foreground">{order.billingEmail}</div>
                </TableCell>
                <TableCell>
                  <ClientFormattedDate date={order.createdAt} />
                </TableCell>
                <TableCell className="text-right">₨{order.orderTotal.toFixed(2)}</TableCell>
                <TableCell className="text-center">
                  <OrderStatusBadge status={order.orderStatus} />
                </TableCell>
                <TableCell>
                  <OrderStatusSelector 
                    orderId={order.id} 
                    currentStatus={order.orderStatus}
                    onStatusChange={(newStatus) => handleStatusUpdate(order.id, newStatus)} 
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isRefunding[order.id]}>
                        <span className="sr-only">Open menu</span>
                        {isRefunding[order.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                           <FileText className="mr-2 h-4 w-4" /> View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleRefundOrder(order.id)}
                        disabled={order.orderStatus === 'cancelled' || order.orderStatus === 'delivered' || isRefunding[order.id]}
                        className="text-orange-600 focus:text-orange-700 focus:bg-orange-50"
                      >
                        {isRefunding[order.id] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Undo2 className="mr-2 h-4 w-4" />}
                        {isRefunding[order.id] ? 'Refunding...' : 'Refund Order'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrdersTable;
