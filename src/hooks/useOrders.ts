// 訂單相關 Hooks
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { orderService, type CheckoutRequest, type ApplyCouponRequest, type OrderSearchParams } from '../api/services'
import type { Order, Address } from '../api/types'

// 查詢鍵
export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (params?: OrderSearchParams) => [...orderQueryKeys.lists(), params] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderQueryKeys.details(), id] as const,
  tracking: (id: string) => [...orderQueryKeys.all, 'tracking', id] as const,
  coupons: ['coupons'] as const,
  availableCoupons: [...orderQueryKeys.coupons, 'available'] as const
}

/**
 * 使用訂單列表
 */
export const useOrders = (params?: OrderSearchParams) => {
  return useQuery({
    queryKey: orderQueryKeys.list(params),
    queryFn: () => orderService.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2分鐘
    placeholderData: (previousData) => previousData
  })
}

/**
 * 使用無限滾動訂單列表
 */
export const useInfiniteOrders = (params?: Omit<OrderSearchParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: orderQueryKeys.list(params),
    queryFn: ({ pageParam = 1 }) => 
      orderService.getOrders({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage
      return pagination.hasNext ? pagination.page + 1 : undefined
    },
    staleTime: 2 * 60 * 1000
  })
}

/**
 * 使用訂單詳情
 */
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: orderQueryKeys.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000
  })
}

/**
 * 根據訂單號使用訂單
 */
export const useOrderByNumber = (orderNumber: string) => {
  return useQuery({
    queryKey: [...orderQueryKeys.all, 'number', orderNumber],
    queryFn: () => orderService.getOrderByNumber(orderNumber),
    enabled: !!orderNumber,
    staleTime: 1 * 60 * 1000
  })
}

/**
 * 使用訂單追蹤
 */
export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: orderQueryKeys.tracking(orderId),
    queryFn: () => orderService.trackOrder(orderId),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5分鐘
    refetchInterval: 30 * 60 * 1000 // 每30分鐘自動重新獲取
  })
}

/**
 * 使用可用優惠券
 */
export const useAvailableCoupons = () => {
  return useQuery({
    queryKey: orderQueryKeys.availableCoupons,
    queryFn: orderService.getAvailableCoupons,
    staleTime: 10 * 60 * 1000 // 10分鐘
  })
}

/**
 * 使用優惠券驗證
 */
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: (data: ApplyCouponRequest) => orderService.validateCoupon(data),
    onError: (error: any) => {
      message.error(error.message || '優惠券驗證失敗')
    }
  })
}

/**
 * 使用應用優惠券
 */
export const useApplyCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ApplyCouponRequest) => orderService.applyCoupon(data),
    onSuccess: () => {
      message.success('優惠券應用成功')
      // 刷新購物車
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: any) => {
      message.error(error.message || '優惠券應用失敗')
    }
  })
}

/**
 * 使用移除優惠券
 */
export const useRemoveCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: orderService.removeCoupon,
    onSuccess: () => {
      message.success('已移除優惠券')
      // 刷新購物車
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: any) => {
      message.error(error.message || '移除優惠券失敗')
    }
  })
}

/**
 * 使用計算運費
 */
export const useCalculateShipping = () => {
  return useMutation({
    mutationFn: (address: Address) => orderService.calculateShipping(address),
    onError: (error: any) => {
      message.error(error.message || '運費計算失敗')
    }
  })
}

/**
 * 使用創建結帳會話
 */
export const useCreateCheckout = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: CheckoutRequest) => orderService.createCheckoutSession(data),
    onSuccess: (session) => {
      message.success('結帳會話創建成功')
      // 導航到支付頁面
      if (session.paymentUrl) {
        window.location.href = session.paymentUrl
      } else {
        navigate(`/checkout/${session.sessionId}`)
      }
    },
    onError: (error: any) => {
      message.error(error.message || '創建結帳會話失敗')
    }
  })
}

/**
 * 使用確認訂單
 */
export const useConfirmOrder = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => orderService.confirmOrder(sessionId),
    onSuccess: (order) => {
      message.success('訂單確認成功！')
      
      // 清除購物車緩存
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      
      // 刷新訂單列表
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
      
      // 導航到訂單完成頁面
      navigate(`/order-complete/${order.id}`)
    },
    onError: (error: any) => {
      message.error(error.message || '訂單確認失敗')
    }
  })
}

/**
 * 使用取消訂單
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) => 
      orderService.cancelOrder(orderId, reason),
    onSuccess: (order) => {
      message.success('訂單已取消')
      
      // 更新訂單詳情
      queryClient.setQueryData(orderQueryKeys.detail(order.id), order)
      
      // 刷新訂單列表
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
    },
    onError: (error: any) => {
      message.error(error.message || '取消訂單失敗')
    }
  })
}

/**
 * 使用確認收貨
 */
export const useConfirmDelivery = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => orderService.confirmDelivery(orderId),
    onSuccess: (order) => {
      message.success('已確認收貨，感謝您的購買！')
      
      // 更新訂單詳情
      queryClient.setQueryData(orderQueryKeys.detail(order.id), order)
      
      // 刷新訂單列表
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
    },
    onError: (error: any) => {
      message.error(error.message || '確認收貨失敗')
    }
  })
}

/**
 * 使用申請退款
 */
export const useRequestRefund = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: string
      data: { reason: string; amount?: number; items?: string[] }
    }) => orderService.requestRefund(orderId, data),
    onSuccess: () => {
      message.success('退款申請提交成功，我們將盡快處理')
      
      // 刷新訂單列表
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() })
    },
    onError: (error: any) => {
      message.error(error.message || '退款申請失敗')
    }
  })
}

/**
 * 使用重新下單
 */
export const useReorder = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => orderService.reorder(orderId),
    onSuccess: () => {
      message.success('商品已添加到購物車')
      
      // 刷新購物車
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      
      // 導航到購物車頁面
      navigate('/cart')
    },
    onError: (error: any) => {
      message.error(error.message || '重新下單失敗')
    }
  })
}

/**
 * 使用下載發票
 */
export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: (orderId: string) => orderService.downloadInvoice(orderId),
    onSuccess: (blob, orderId) => {
      // 創建下載連結
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `invoice-${orderId}.pdf`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
      
      message.success('發票下載成功')
    },
    onError: (error: any) => {
      message.error(error.message || '發票下載失敗')
    }
  })
}

/**
 * 使用訂單統計
 */
export const useOrderStats = (orders?: Order[]) => {
  if (!orders) return null

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return {
    totalSpent,
    totalOrders,
    avgOrderValue,
    statusCounts,
    recentOrders
  }
}

/**
 * 訂單數據預加載工具
 */
export const useOrderPrefetch = () => {
  const queryClient = useQueryClient()

  const prefetchOrder = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: orderQueryKeys.detail(id),
      queryFn: () => orderService.getOrder(id),
      staleTime: 1 * 60 * 1000
    })
  }

  const prefetchOrderTracking = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: orderQueryKeys.tracking(id),
      queryFn: () => orderService.trackOrder(id),
      staleTime: 5 * 60 * 1000
    })
  }

  return {
    prefetchOrder,
    prefetchOrderTracking
  }
}