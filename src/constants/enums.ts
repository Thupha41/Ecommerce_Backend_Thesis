export enum UserVerifyStatus {
  Unverified, // chưa xác thực email, mặc định = 0
  Verified, // đã xác thực email
  Banned // bị khóa
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum ProductType {
  Clothing = 'Clothing',
  Furniture = 'Furniture',
  Electronic = 'Electronic',
  Book = 'Book',
  Stationery = 'Stationery',
  Souvenir = 'Souvenir',
  Kitchenware = 'Kitchenware',
  Instrument = 'Instrument'
}

export enum InventoryStatus {
  InStock = 'InStock',
  OutOfStock = 'OutOfStock',
  RunningLow = 'RunningLow'
}

export enum DiscountType {
  Percentage = 'percentage',
  FixedAmount = 'fixed_amount'
}

export enum DiscountApplyTo {
  All = 'all',
  Specific = 'specific'
}

export enum CartStatus {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Active = 'active'
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  Image = 'image',
  Video = 'video'
}

export enum EncodingStatus {
  Pending, // Đang chờ ở hàng đợi (chưa được encode)
  Processing, // Đang encode
  Success, // Encode thành công
  Failed // Encode thất bại
}

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled'
}

export enum RoleStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}

export enum ShopStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}

export enum ReviewStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}
