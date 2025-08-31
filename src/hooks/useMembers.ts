// 會員相關 Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'
import { 
  memberService,
  type UpdateProfileRequest,
  type CreateAddressRequest,
  type UpdateAddressRequest,
  type AddToWishlistRequest,
  type MemberStats
} from '../api/services'
import type { MemberAddress, WishlistItem } from '../api/types'

// 查詢鍵
export const memberQueryKeys = {
  profile: ['member', 'profile'] as const,
  stats: ['member', 'stats'] as const,
  addresses: ['member', 'addresses'] as const,
  address: (id: string) => ['member', 'addresses', id] as const,
  defaultAddress: (type?: 'shipping' | 'billing') => ['member', 'addresses', 'default', type] as const,
  wishlist: ['member', 'wishlist'] as const,
  notifications: ['member', 'notifications'] as const,
  pointsHistory: ['member', 'points', 'history'] as const,
  rewards: ['member', 'points', 'rewards'] as const,
  tierRules: ['member', 'tier-rules'] as const
}

/**
 * 使用會員資料
 */
export const useMemberProfile = () => {
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: memberQueryKeys.profile,
    queryFn: memberService.getProfile,
    staleTime: 5 * 60 * 1000 // 5分鐘
  })

  const updateProfile = useMutation({
    mutationFn: (data: UpdateProfileRequest) => memberService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(memberQueryKeys.profile, updatedProfile)
      message.success('個人資料更新成功')
    },
    onError: (error: any) => {
      message.error(error.message || '個人資料更新失敗')
    }
  })

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => memberService.uploadAvatar(file),
    onSuccess: (result) => {
      // 更新個人資料中的頭像
      if (profile) {
        queryClient.setQueryData(memberQueryKeys.profile, {
          ...profile,
          avatar: result.avatarUrl
        })
      }
      message.success('頭像上傳成功')
    },
    onError: (error: any) => {
      message.error(error.message || '頭像上傳失敗')
    }
  })

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    uploadAvatar: uploadAvatar.mutate,
    isUpdatingProfile: updateProfile.isPending,
    isUploadingAvatar: uploadAvatar.isPending
  }
}

/**
 * 使用會員統計
 */
export const useMemberStats = () => {
  return useQuery({
    queryKey: memberQueryKeys.stats,
    queryFn: memberService.getStats,
    staleTime: 10 * 60 * 1000 // 10分鐘
  })
}

/**
 * 使用會員等級規則
 */
export const useMemberTierRules = () => {
  return useQuery({
    queryKey: memberQueryKeys.tierRules,
    queryFn: memberService.getTierRules,
    staleTime: 30 * 60 * 1000 // 30分鐘
  })
}

/**
 * 使用會員地址管理
 */
export const useMemberAddresses = () => {
  const queryClient = useQueryClient()

  const { data: addresses, isLoading } = useQuery({
    queryKey: memberQueryKeys.addresses,
    queryFn: memberService.getAddresses,
    staleTime: 5 * 60 * 1000
  })

  const createAddress = useMutation({
    mutationFn: (data: CreateAddressRequest) => memberService.createAddress(data),
    onSuccess: (newAddress) => {
      queryClient.setQueryData(memberQueryKeys.addresses, (old: MemberAddress[] = []) => [
        ...old,
        newAddress
      ])
      message.success('地址新增成功')
    },
    onError: (error: any) => {
      message.error(error.message || '地址新增失敗')
    }
  })

  const updateAddress = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAddressRequest }) => 
      memberService.updateAddress(id, data),
    onSuccess: (updatedAddress) => {
      queryClient.setQueryData(memberQueryKeys.addresses, (old: MemberAddress[] = []) =>
        old.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr)
      )
      message.success('地址更新成功')
    },
    onError: (error: any) => {
      message.error(error.message || '地址更新失敗')
    }
  })

  const deleteAddress = useMutation({
    mutationFn: (id: string) => memberService.deleteAddress(id),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(memberQueryKeys.addresses, (old: MemberAddress[] = []) =>
        old.filter(addr => addr.id !== deletedId)
      )
      message.success('地址刪除成功')
    },
    onError: (error: any) => {
      message.error(error.message || '地址刪除失敗')
    }
  })

  const setDefaultAddress = useMutation({
    mutationFn: (id: string) => memberService.setDefaultAddress(id),
    onSuccess: (defaultAddress) => {
      queryClient.setQueryData(memberQueryKeys.addresses, (old: MemberAddress[] = []) =>
        old.map(addr => ({
          ...addr,
          isDefault: addr.id === defaultAddress.id && addr.type === defaultAddress.type
        }))
      )
      message.success('默認地址設置成功')
    },
    onError: (error: any) => {
      message.error(error.message || '設置默認地址失敗')
    }
  })

  return {
    addresses: addresses || [],
    isLoading,
    createAddress: createAddress.mutate,
    updateAddress: updateAddress.mutate,
    deleteAddress: deleteAddress.mutate,
    setDefaultAddress: setDefaultAddress.mutate,
    isCreatingAddress: createAddress.isPending,
    isUpdatingAddress: updateAddress.isPending,
    isDeletingAddress: deleteAddress.isPending,
    isSettingDefault: setDefaultAddress.isPending
  }
}

/**
 * 使用單個地址
 */
export const useMemberAddress = (id: string) => {
  return useQuery({
    queryKey: memberQueryKeys.address(id),
    queryFn: () => memberService.getAddress(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 使用默認地址
 */
export const useDefaultAddress = (type?: 'shipping' | 'billing') => {
  return useQuery({
    queryKey: memberQueryKeys.defaultAddress(type),
    queryFn: () => memberService.getDefaultAddress(type),
    staleTime: 5 * 60 * 1000
  })
}

/**
 * 使用願望清單
 */
export const useWishlist = (params?: {
  page?: number
  limit?: number
  sort?: string
}) => {
  const queryClient = useQueryClient()

  const { data: wishlist, isLoading } = useQuery({
    queryKey: [...memberQueryKeys.wishlist, params],
    queryFn: () => memberService.getWishlist(params),
    staleTime: 2 * 60 * 1000
  })

  const addToWishlist = useMutation({
    mutationFn: (data: AddToWishlistRequest) => memberService.addToWishlist(data),
    onSuccess: () => {
      message.success('已添加到願望清單')
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.wishlist })
    },
    onError: (error: any) => {
      message.error(error.message || '添加到願望清單失敗')
    }
  })

  const removeFromWishlist = useMutation({
    mutationFn: (id: string) => memberService.removeFromWishlist(id),
    onSuccess: () => {
      message.success('已從願望清單移除')
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.wishlist })
    },
    onError: (error: any) => {
      message.error(error.message || '從願望清單移除失敗')
    }
  })

  const clearWishlist = useMutation({
    mutationFn: () => memberService.clearWishlist(),
    onSuccess: () => {
      message.success('願望清單已清空')
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.wishlist })
    },
    onError: (error: any) => {
      message.error(error.message || '清空願望清單失敗')
    }
  })

  const addWishlistToCart = useMutation({
    mutationFn: (items: Array<{ wishlistItemId: string; quantity?: number }>) => 
      memberService.addWishlistToCart(items),
    onSuccess: (result) => {
      message.success(`成功添加 ${result.addedItems} 件商品到購物車`)
      if (result.failedItems > 0) {
        message.warning(`有 ${result.failedItems} 件商品添加失敗`)
      }
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
    onError: (error: any) => {
      message.error(error.message || '批量添加到購物車失敗')
    }
  })

  return {
    wishlist: wishlist?.items || [],
    pagination: wishlist?.pagination,
    isLoading,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
    clearWishlist: clearWishlist.mutate,
    addWishlistToCart: addWishlistToCart.mutate,
    isAddingToWishlist: addToWishlist.isPending,
    isRemovingFromWishlist: removeFromWishlist.isPending,
    isClearingWishlist: clearWishlist.isPending,
    isAddingToCart: addWishlistToCart.isPending
  }
}

/**
 * 檢查商品是否在願望清單中
 */
export const useIsInWishlist = (productId: string, variantId?: string) => {
  return useQuery({
    queryKey: [...memberQueryKeys.wishlist, 'check', productId, variantId],
    queryFn: () => memberService.isInWishlist(productId, variantId),
    enabled: !!productId,
    staleTime: 1 * 60 * 1000
  })
}

/**
 * 使用積分歷史
 */
export const usePointsHistory = (params?: {
  type?: 'earn' | 'spend'
  page?: number
  limit?: number
}) => {
  return useQuery({
    queryKey: [...memberQueryKeys.pointsHistory, params],
    queryFn: () => memberService.getPointsHistory(params),
    staleTime: 2 * 60 * 1000
  })
}

/**
 * 使用可兌換獎品
 */
export const useRedeemableRewards = () => {
  return useQuery({
    queryKey: memberQueryKeys.rewards,
    queryFn: memberService.getRedeemableRewards,
    staleTime: 10 * 60 * 1000
  })
}

/**
 * 使用兌換積分
 */
export const useRedeemPoints = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ couponId, points }: { couponId: string; points: number }) =>
      memberService.redeemPointsForCoupon(couponId, points),
    onSuccess: (result) => {
      message.success(`成功兌換優惠券！剩餘積分：${result.remainingPoints}`)
      // 刷新積分歷史和會員資料
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.pointsHistory })
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.profile })
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.stats })
    },
    onError: (error: any) => {
      message.error(error.message || '積分兌換失敗')
    }
  })
}

/**
 * 使用通知
 */
export const useNotifications = (params?: {
  type?: 'order' | 'promotion' | 'system'
  isRead?: boolean
  page?: number
  limit?: number
}) => {
  const queryClient = useQueryClient()

  const { data: notifications, isLoading } = useQuery({
    queryKey: [...memberQueryKeys.notifications, params],
    queryFn: () => memberService.getNotifications(params),
    staleTime: 1 * 60 * 1000
  })

  const markRead = useMutation({
    mutationFn: (id: string) => memberService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.notifications })
    }
  })

  const markAllRead = useMutation({
    mutationFn: () => memberService.markAllNotificationsRead(),
    onSuccess: () => {
      message.success('所有通知已標記為已讀')
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.notifications })
    },
    onError: (error: any) => {
      message.error(error.message || '標記已讀失敗')
    }
  })

  return {
    notifications: notifications?.items || [],
    pagination: notifications?.pagination,
    isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    isMarkingRead: markRead.isPending,
    isMarkingAllRead: markAllRead.isPending
  }
}

/**
 * 使用未讀通知數量
 */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: [...memberQueryKeys.notifications, 'unread-count'],
    queryFn: memberService.getUnreadNotificationCount,
    staleTime: 30 * 1000, // 30秒
    refetchInterval: 2 * 60 * 1000 // 每2分鐘自動刷新
  })
}

/**
 * 願望清單工具 Hook
 */
export const useWishlistToggle = () => {
  const queryClient = useQueryClient()

  const toggle = useMutation({
    mutationFn: async ({ productId, variantId, inWishlist }: {
      productId: string
      variantId?: string
      inWishlist: boolean
    }) => {
      if (inWishlist) {
        // 找到願望清單項目ID並移除
        const wishlist = await memberService.getWishlist({ limit: 1000 }) // 獲取所有項目
        const item = wishlist.items.find(item => 
          item.productId === productId && item.variantId === variantId
        )
        if (item) {
          await memberService.removeFromWishlist(item.id)
        }
      } else {
        await memberService.addToWishlist({ productId, variantId })
      }
      return !inWishlist
    },
    onSuccess: (newState) => {
      message.success(newState ? '已添加到願望清單' : '已從願望清單移除')
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.wishlist })
    },
    onError: (error: any) => {
      message.error(error.message || '操作失敗')
    }
  })

  return {
    toggle: toggle.mutate,
    isToggling: toggle.isPending
  }
}