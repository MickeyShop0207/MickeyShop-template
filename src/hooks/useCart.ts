// 購物車相關 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { orderService, type AddToCartRequest, type UpdateCartItemRequest, type CartSummary } from '../api/services'
import { authService } from '../api/services'
import { useLocalStorage } from './useLocalStorage'

// 查詢鍵
export const cartQueryKeys = {
  cart: ['cart'] as const,
  summary: ['cart', 'summary'] as const
}

// 本地購物車項目類型
interface LocalCartItem {
  productId: string
  variantId?: string
  quantity: number
  addedAt: string
}

/**
 * 使用購物車
 */
export const useCart = () => {
  const queryClient = useQueryClient()
  const [localCart, setLocalCart] = useLocalStorage<LocalCartItem[]>('cart', [])

  // 獲取購物車內容
  const { data: cart, isLoading } = useQuery({
    queryKey: cartQueryKeys.cart,
    queryFn: orderService.getCart,
    enabled: authService.isAuthenticated(),
    staleTime: 1 * 60 * 1000, // 1分鐘
    placeholderData: {
      items: [],
      subtotal: 0,
      tax: 0,
      shippingFee: 0,
      discountAmount: 0,
      total: 0,
      itemCount: 0
    }
  })

  // 同步本地購物車到服務器
  const syncCartMutation = useMutation({
    mutationFn: () => {
      const items: AddToCartRequest[] = localCart.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }))
      return orderService.syncCart(items)
    },
    onSuccess: (serverCart) => {
      // 清空本地購物車
      setLocalCart([])
      // 更新查詢緩存
      queryClient.setQueryData(cartQueryKeys.cart, serverCart)
      message.success('購物車同步成功')
    },
    onError: (error: any) => {
      message.error(error.message || '購物車同步失敗')
    }
  })

  // 添加到購物車
  const addToCartMutation = useMutation({
    mutationFn: (data: AddToCartRequest) => {
      if (authService.isAuthenticated()) {
        return orderService.addToCart(data)
      } else {
        // 未登錄用戶添加到本地存儲
        const existingItem = localCart.find(
          item => item.productId === data.productId && item.variantId === data.variantId
        )
        
        if (existingItem) {
          const updatedCart = localCart.map(item =>
            item.productId === data.productId && item.variantId === data.variantId
              ? { ...item, quantity: item.quantity + data.quantity }
              : item
          )
          setLocalCart(updatedCart)
        } else {
          setLocalCart([...localCart, {
            ...data,
            addedAt: new Date().toISOString()
          }])
        }
        
        return Promise.resolve(null)
      }
    },
    onSuccess: (newItem, variables) => {
      if (authService.isAuthenticated()) {
        // 刷新購物車
        queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
        message.success('商品已添加到購物車')
      } else {
        message.success('商品已添加到購物車，登錄後將同步到雲端')
      }
    },
    onError: (error: any) => {
      message.error(error.message || '添加到購物車失敗')
    }
  })

  // 更新購物車項目
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateCartItemRequest }) => {
      if (authService.isAuthenticated()) {
        return orderService.updateCartItem(itemId, data)
      } else {
        // 本地更新
        const updatedCart = localCart.map(item =>
          item.productId === itemId
            ? { ...item, quantity: data.quantity }
            : item
        ).filter(item => item.quantity > 0) // 移除數量為0的項目
        
        setLocalCart(updatedCart)
        return Promise.resolve(null)
      }
    },
    onSuccess: () => {
      if (authService.isAuthenticated()) {
        queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      }
    },
    onError: (error: any) => {
      message.error(error.message || '更新失敗')
    }
  })

  // 從購物車移除項目
  const removeCartItemMutation = useMutation({
    mutationFn: (itemId: string) => {
      if (authService.isAuthenticated()) {
        return orderService.removeCartItem(itemId)
      } else {
        // 本地移除
        const updatedCart = localCart.filter(item => item.productId !== itemId)
        setLocalCart(updatedCart)
        return Promise.resolve({ message: '已移除' })
      }
    },
    onSuccess: () => {
      if (authService.isAuthenticated()) {
        queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      }
      message.success('已從購物車移除')
    },
    onError: (error: any) => {
      message.error(error.message || '移除失敗')
    }
  })

  // 清空購物車
  const clearCartMutation = useMutation({
    mutationFn: () => {
      if (authService.isAuthenticated()) {
        return orderService.clearCart()
      } else {
        setLocalCart([])
        return Promise.resolve({ message: '購物車已清空' })
      }
    },
    onSuccess: () => {
      if (authService.isAuthenticated()) {
        queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      }
      message.success('購物車已清空')
    },
    onError: (error: any) => {
      message.error(error.message || '清空購物車失敗')
    }
  })

  // 計算本地購物車統計
  const getLocalCartSummary = (): CartSummary => {
    return {
      items: [],
      subtotal: 0,
      tax: 0,
      shippingFee: 0,
      discountAmount: 0,
      total: 0,
      itemCount: localCart.reduce((sum, item) => sum + item.quantity, 0)
    }
  }

  // 獲取當前購物車數據
  const getCurrentCart = () => {
    if (authService.isAuthenticated()) {
      return cart || {
        items: [],
        subtotal: 0,
        tax: 0,
        shippingFee: 0,
        discountAmount: 0,
        total: 0,
        itemCount: 0
      }
    } else {
      return getLocalCartSummary()
    }
  }

  // 檢查商品是否在購物車中
  const isInCart = (productId: string, variantId?: string): boolean => {
    if (authService.isAuthenticated() && cart) {
      return cart.items.some(item => 
        item.productId === productId && item.variantId === variantId
      )
    } else {
      return localCart.some(item => 
        item.productId === productId && item.variantId === variantId
      )
    }
  }

  // 獲取商品在購物車中的數量
  const getCartItemQuantity = (productId: string, variantId?: string): number => {
    if (authService.isAuthenticated() && cart) {
      const item = cart.items.find(item => 
        item.productId === productId && item.variantId === variantId
      )
      return item?.quantity || 0
    } else {
      const item = localCart.find(item => 
        item.productId === productId && item.variantId === variantId
      )
      return item?.quantity || 0
    }
  }

  return {
    // 數據
    cart: getCurrentCart(),
    localCart,
    isLoading,
    isEmpty: getCurrentCart().itemCount === 0,
    itemCount: getCurrentCart().itemCount,

    // 操作
    addToCart: addToCartMutation.mutate,
    updateCartItem: updateCartItemMutation.mutate,
    removeCartItem: removeCartItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    syncCart: syncCartMutation.mutate,

    // 工具方法
    isInCart,
    getCartItemQuantity,

    // 加載狀態
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingCartItem: updateCartItemMutation.isPending,
    isRemovingCartItem: removeCartItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    isSyncing: syncCartMutation.isPending
  }
}

/**
 * 使用購物車項目操作
 */
export const useCartItem = (itemId: string) => {
  const queryClient = useQueryClient()

  const updateQuantity = useMutation({
    mutationFn: (quantity: number) => 
      orderService.updateCartItem(itemId, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
    },
    onError: (error: any) => {
      message.error(error.message || '更新數量失敗')
    }
  })

  const remove = useMutation({
    mutationFn: () => orderService.removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.cart })
      message.success('已從購物車移除')
    },
    onError: (error: any) => {
      message.error(error.message || '移除失敗')
    }
  })

  return {
    updateQuantity: updateQuantity.mutate,
    remove: remove.mutate,
    isUpdating: updateQuantity.isPending,
    isRemoving: remove.isPending
  }
}

/**
 * 使用快速添加到購物車
 */
export const useQuickAddToCart = () => {
  const { addToCart, isAddingToCart } = useCart()

  const quickAdd = (productId: string, variantId?: string, quantity = 1) => {
    addToCart({ productId, variantId, quantity })
  }

  return {
    quickAdd,
    isLoading: isAddingToCart
  }
}

/**
 * 使用購物車統計
 */
export const useCartStats = () => {
  const { cart } = useCart()

  return {
    itemCount: cart.itemCount,
    subtotal: cart.subtotal,
    total: cart.total,
    hasItems: cart.itemCount > 0,
    savings: cart.discountAmount
  }
}