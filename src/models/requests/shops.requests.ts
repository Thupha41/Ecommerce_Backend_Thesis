import { ShopStatus } from '~/constants/enums'

export interface IUpsertShopReqBody {
  shop_owner: string
  shop_name: string
  shop_description: string
  shop_slug?: string
  shop_status: ShopStatus
  shop_response_rate?: number
  shop_hotline_phone?: string
  shop_email?: string
  shop_logo?: string
  shop_banner?: string
  shop_revenue?: number
  follower_count?: number
  is_followed?: boolean
  shop_rating?: number
}

export interface GetProductsByShopOptions {
  sortBy: 'sold_quantity' | 'created_at' | 'price_asc' | 'price_desc'; // Tiêu chí sắp xếp
  limit?: number; // Giới hạn số sản phẩm
  page?: number; // Phân trang
}

export interface ShopProductsCache {
  products: string; // JSON string của mảng sản phẩm
  total: string;
  page: string;
  limit: string;
  totalPages: string;
}