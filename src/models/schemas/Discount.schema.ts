import { ObjectId } from 'mongodb'
import { DiscountType, DiscountApplyTo } from '~/constants/enums'
interface IDiscountType {
  _id?: ObjectId
  discount_name: string
  discount_description: string
  discount_value: number
  discount_type: DiscountType
  discount_code: string
  //Số lượng discount tối đa được áp dụng
  discount_max_uses: number
  //Số discount đã sử dụng
  discount_used_count: number
  //Danh sách user đã sử dụng discount
  discount_users_used?: ObjectId[]
  //Mỗi user được sử dụng tối đa bao nhiêu lần
  discount_max_uses_per_user: number
  //Ngày bắt đầu áp dụng discount
  discount_start_date: Date
  //Ngày kết thúc áp dụng discount
  discount_end_date: Date
  //Giá trị đơn hàng tối thiểu để áp dụng discount
  discount_min_order_value: number
  //Mã shop áp dụng discount
  discount_shopId: ObjectId
  //Đối tượng áp dụng discount
  discount_apply_to: DiscountApplyTo
  //Danh sách sản phẩm áp dụng discount
  discount_product_ids: ObjectId[]
  //Trạng thái discount
  discount_status: boolean
  discount_is_active: boolean
  created_at?: Date
  updated_at?: Date
}
export default class Discount {
  _id?: ObjectId
  discount_name: string
  discount_description: string
  discount_value: number
  discount_type: DiscountType
  discount_code: string
  discount_max_uses: number
  discount_used_count: number
  discount_users_used?: ObjectId[]
  discount_max_uses_per_user: number
  discount_start_date: Date
  discount_end_date: Date
  discount_min_order_value: number
  discount_shopId: ObjectId
  discount_apply_to: DiscountApplyTo = DiscountApplyTo.All
  discount_product_ids: ObjectId[] = []
  discount_is_active: boolean = true
  created_at?: Date
  updated_at?: Date
  constructor({
    _id,
    discount_name,
    discount_description,
    discount_value,
    discount_type,
    discount_code,
    discount_max_uses,
    discount_used_count,
    discount_users_used,
    discount_max_uses_per_user,
    discount_start_date,
    discount_end_date,
    discount_min_order_value,
    discount_shopId,
    discount_apply_to,
    discount_product_ids,
    discount_is_active,
    created_at,
    updated_at
  }: IDiscountType) {
    this._id = _id
    this.discount_name = discount_name
    this.discount_description = discount_description
    this.discount_value = discount_value
    this.discount_type = discount_type
    this.discount_code = discount_code
    this.discount_max_uses = discount_max_uses
    this.discount_used_count = discount_used_count
    this.discount_users_used = discount_users_used
    this.discount_max_uses_per_user = discount_max_uses_per_user
    this.discount_start_date = discount_start_date
    this.discount_end_date = discount_end_date
    this.discount_min_order_value = discount_min_order_value
    this.discount_shopId = discount_shopId
    this.discount_apply_to = discount_apply_to
    this.discount_product_ids = discount_product_ids
    this.discount_is_active = discount_is_active
    this.created_at = created_at || new Date()
    this.updated_at = updated_at || new Date()
  }
}
