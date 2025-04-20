export const USERS_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50: 'Password length must be from 8 to 50',
  PASSWORD_MUST_BE_STRONG:
    'Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_8_TO_50: 'Confirm password length must be from 8 to 50',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',
  DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601',
  LOGIN_SUCCESS: 'Login success',
  REGISTER_SUCCESS: 'Register success',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
  LOGOUT_SUCCESS: 'Logout success',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',
  EMAIL_VERIFY_SUCCESS: 'Email verify success',
  INVALID_CODE: 'Invalid code',
  RESEND_VERIFY_EMAIL_SUCCESS: 'Resend verify email success',
  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',
  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password success',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token',
  RESET_PASSWORD_SUCCESS: 'Reset password success',
  GET_ME_SUCCESS: 'Get my profile success',
  USER_NOT_VERIFIED: 'User not verified',
  BIO_MUST_BE_STRING: 'Bio must be a string',
  BIO_LENGTH: 'Bio length must be from 1 to 200',
  LOCATION_MUST_BE_STRING: 'Location must be a string',
  LOCATION_LENGTH: 'Location length must be from 1 to 200',
  WEBSITE_MUST_BE_STRING: 'Website must be a string',
  WEBSITE_LENGTH: 'Website length must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'Username must be a string',
  USERNAME_INVALID:
    'Username must be 4-15 characters long and contain only letters, numbers, underscores, not only numbers',
  IMAGE_URL_MUST_BE_STRING: 'Avatar must be a string',
  IMAGE_URL_LENGTH: 'Avatar length must be from 1 to 200',
  UPDATE_ME_SUCCESS: 'Update my profile success',
  GET_PROFILE_SUCCESS: 'Get profile success',
  FOLLOW_SUCCESS: 'Follow success',
  INVALID_USER_ID: 'Invalid user id',
  FOLLOWED: 'Followed',
  ALREADY_UNFOLLOWED: 'Already unfollowed',
  UNFOLLOW_SUCCESS: 'Unfollow success',
  USERNAME_EXISTED: 'Username existed',
  OLD_PASSWORD_NOT_MATCH: 'Old password not match',
  CHANGE_PASSWORD_SUCCESS: 'Change password success',
  GMAIL_NOT_VERIFIED: 'Gmail not verified',
  UPLOAD_SUCCESS: 'Upload success',
  REFRESH_TOKEN_SUCCESS: 'Refresh token success',
  GET_VIDEO_STATUS_SUCCESS: 'Get video status success'
} as const

export const TWEETS_MESSAGES = {
  INVALID_TYPE: 'Invalid type',
  INVALID_AUDIENCE: 'Invalid audience',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent id must be a valid tweet id',
  PARENT_ID_MUST_BE_NULL: 'Parent id must be null',
  CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non-empty string',
  CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
  HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array of string',
  MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
  MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
  INVALID_TWEET_ID: 'Invalid tweet id',
  TWEET_NOT_FOUND: 'Tweet not found',
  TWEET_IS_NOT_PUBLIC: 'Tweet is not public'
} as const

export const BOOKMARK_MESSAGES = {
  BOOKMARK_SUCCESSFULLY: 'Bookmark successfully',
  UNBOOKMARK_SUCCESSFULLY: 'Unbookmark successfully'
}

export const LIKE_MESSAGES = {
  LIKE_SUCCESSFULLY: 'Like successfully',
  UNLIKE_SUCCESSFULLY: 'Unlike successfully'
}

export const PRODUCTS_MESSAGES = {
  // Validation Messages
  PRODUCT_NOT_FOUND: 'Product not found',
  INVALID_PRODUCT_ID: 'Invalid product id',
  PRODUCT_NAME_IS_REQUIRED: 'Product name is required',
  PRODUCT_THUMB_IS_REQUIRED: 'Product thumbnail is required',
  PRODUCT_PRICE_IS_REQUIRED: 'Product price is required',
  PRODUCT_QUANTITY_IS_REQUIRED: 'Product quantity is required',
  PRODUCT_TYPE_IS_REQUIRED: 'Product type is required',
  PRODUCT_SHOP_IS_REQUIRED: 'Product shop is required',
  PRODUCT_ATTRIBUTES_IS_REQUIRED: 'Product attributes is required',
  INVALID_PRODUCT_TYPE: 'Invalid product type',
  PRODUCT_ATTRIBUTES_VALUES_CANNOT_BE_NULL: 'Product attributes values cannot be null',

  // Success Messages
  CREATE_PRODUCT_SUCCESS: 'Create new product successfully',
  UPDATE_PRODUCT_SUCCESS: 'Update product successfully',
  GET_PRODUCT_SUCCESS: 'Get product successfully',
  GET_ALL_PRODUCTS_SUCCESS: 'Get all products successfully',
  GET_PRODUCT_DETAIL_SUCCESS: 'Get product detail successfully',
  DELETE_PRODUCT_SUCCESS: 'Delete product successfully',

  // Draft & Published Messages
  GET_ALL_DRAFTS_SUCCESS: 'Get list of draft products successfully',
  GET_ALL_PUBLISHED_SUCCESS: 'Get list of published products successfully',
  PUBLISH_PRODUCT_SUCCESS: 'Publish product successfully',
  UNPUBLISH_PRODUCT_SUCCESS: 'Unpublish product successfully',

  // Search Messages
  SEARCH_PRODUCT_SUCCESS: 'Search products successfully',
  NO_PRODUCTS_FOUND: 'No products found',

  // Shop Messages
  PRODUCT_SHOP_NOT_FOUND: 'Product shop not found',
  NOT_SHOP_OWNER: 'You are not the owner of this product',

  // Inventory Messages
  PRODUCT_OUT_OF_STOCK: 'Product is out of stock',
  INSUFFICIENT_PRODUCT_QUANTITY: 'Insufficient product quantity',

  // Status Messages
  PRODUCT_IS_NOT_PUBLISHED: 'Product is not published',
  PRODUCT_ALREADY_PUBLISHED: 'Product is already published',
  PRODUCT_ALREADY_UNPUBLISHED: 'Product is already unpublished',

  // Operation Messages
  PRODUCT_VARIATION_EXISTS: 'Product variation already exists',
  PRODUCT_VARIATION_NOT_FOUND: 'Product variation not found',
  UPDATE_PRODUCT_QUANTITY_SUCCESS: 'Update product quantity successfully',
  UPDATE_PRODUCT_PRICE_SUCCESS: 'Update product price successfully',
  GET_TOP_RATED_PRODUCTS_SUCCESS: 'Get top rated products successfully'
} as const

export const DISCOUNTS_MESSAGES = {
  DISCOUNT_NOT_FOUND: 'Discount not found',
  DISCOUNT_ALREADY_EXISTS: 'Discount already exists',
  DISCOUNT_CODE_IS_REQUIRED: 'Discount code is required',
  DISCOUNT_CODE_MUST_BE_A_STRING: 'Discount code must be a string',
  DISCOUNT_MAX_USES_IS_REQUIRED: 'Discount max uses is required',
  DISCOUNT_MAX_USES_MUST_BE_A_NUMBER: 'Discount max uses must be a number',
  DISCOUNT_MAX_USES_MUST_BE_GREATER_THAN_0: 'Discount max uses must be greater than 0',
  DISCOUNT_MAX_USES_PER_USER_MUST_BE_A_NUMBER: 'Discount max uses per user must be a number',
  DISCOUNT_MAX_USES_PER_USER_MUST_BE_GREATER_THAN_0: 'Discount max uses per user must be greater than 0',
  DISCOUNT_MIN_ORDER_VALUE_IS_REQUIRED: 'Discount min order value is required',
  DISCOUNT_MIN_ORDER_VALUE_MUST_BE_A_NUMBER: 'Discount min order value must be a number',
  DISCOUNT_MIN_ORDER_VALUE_MUST_BE_GREATER_THAN_0: 'Discount min order value must be greater than 0',
  DISCOUNT_MIN_ORDER_VALUE_MUST_BE_LESS_THAN_100000000: 'Discount min order value must be less than 100000000',
  DISCOUNT_START_DATE_IS_REQUIRED: 'Discount start date is required',
  DISCOUNT_START_DATE_MUST_BE_A_DATE: 'Discount start date must be a date',
  DISCOUNT_END_DATE_IS_REQUIRED: 'Discount end date is required',
  DISCOUNT_END_DATE_MUST_BE_A_DATE: 'Discount end date must be a date',
  DISCOUNT_END_DATE_MUST_BE_GREATER_THAN_START_DATE: 'Discount end date must be greater than start date',
  DISCOUNT_END_DATE_MUST_BE_GREATER_THAN_CURRENT_DATE: 'Discount end date must be greater than current date',
  DISCOUNT_IS_ACTIVE_IS_REQUIRED: 'Discount is active is required',
  DISCOUNT_IS_ACTIVE_MUST_BE_A_BOOLEAN: 'Discount is active must be a boolean',
  DISCOUNT_IS_ACTIVE_MUST_BE_TRUE_OR_FALSE: 'Discount is active must be true or false',
  DISCOUNT_IS_ACTIVE_MUST_BE_TRUE: 'Discount is active must be true',
  DISCOUNT_IS_ACTIVE_MUST_BE_FALSE: 'Discount is active must be false',
  DISCOUNT_TYPE_IS_REQUIRED: 'Discount type is required',
  DISCOUNT_MAX_USES_PER_USER_IS_REQUIRED: 'Discount max uses per user is required',
  DISCOUNT_CODE_HAS_EXPIRED: 'Discount code has expired',
  DISCOUNT_NAME_IS_REQUIRED: 'Discount name is required',
  DISCOUNT_NAME_MUST_BE_A_STRING: 'Discount name must be a string',
  DISCOUNT_NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Discount name length must be from 1 to 100',
  DISCOUNT_DESCRIPTION_IS_REQUIRED: 'Discount description is required',
  DISCOUNT_DESCRIPTION_MUST_BE_A_STRING: 'Discount description must be a string',
  DISCOUNT_DESCRIPTION_LENGTH_MUST_BE_FROM_1_TO_1000: 'Discount description length must be from 1 to 1000',
  DISCOUNT_VALUE_IS_REQUIRED: 'Discount value is required',
  DISCOUNT_VALUE_MUST_BE_A_NUMBER: 'Discount value must be a number',
  DISCOUNT_VALUE_MUST_BE_GREATER_THAN_0: 'Discount value must be greater than 0',
  DISCOUNT_VALUE_MUST_BE_LESS_THAN_100: 'Discount value must be less than 100',
  DISCOUNT_PRODUCT_IDS_IS_REQUIRED: 'Discount product ids is required',
  DISCOUNT_NOT_ACTIVE: 'Discount code is not active',
  DISCOUNT_MAX_USES_REACHED: 'Discount code has reached the maximum usage',
  DISCOUNT_MAX_USES_PER_USER_REACHED: 'Discount code has reached the maximum usage per user',
  GET_ALL_DISCOUNT_CODES_SUCCESS: 'Get all discount codes success',
  GET_ALL_DISCOUNT_CODES_WITH_PRODUCTS_SUCCESS: 'Get all discount codes with products success',
  GET_DISCOUNT_AMOUNT_SUCCESS: 'Get discount amount success',
  CANCEL_DISCOUNT_CODE_SUCCESS: 'Cancel discount code success',
  DELETE_DISCOUNT_CODE_SUCCESS: 'Delete discount code success',
  DISCOUNT_START_DATE_MUST_BE_BEFORE_END_DATE: 'Start date must be before end date',
  DISCOUNT_DATE_MUST_BE_ISO8601: 'Date must be ISO8601',
  USER_ID_IS_REQUIRED: 'User id is required',
  SHOP_ID_IS_REQUIRED: 'Shop id is required',
  PRODUCTS_IS_REQUIRED: 'Products is required'
} as const

export const CARTS_MESSAGES = {
  ADD_TO_CART_SUCCESS: 'Add to cart successfully',
  UPDATE_CART_SUCCESS: 'Update cart successfully',
  DELETE_CART_SUCCESS: 'Delete cart successfully',
  GET_CART_SUCCESS: 'Get cart successfully',
  CART_NOT_FOUND: 'Cart not found',
  INVALID_CART_ITEM: 'Invalid cart item',
  PRODUCT_NOT_IN_CART: 'Product not in cart'
} as const

export const SELLER_MESSAGES = {
  CREATE_SELLER_SUCCESS: 'Create restaurant successfully',
  UPDATE_SELLER_SUCCESS: 'Update restaurant successfully',
  GET_ALL_SELLER_SUCCESS: 'Get all restaurant successfully',
  DELETE_SELLER_SUCCESS: 'Delete restaurant successfully',
  INVALID_SELLER_ID: 'Invalid restaurant ID',
  SELLER_NOT_FOUND: 'Restaurant not found',
  NAME_IS_REQUIRED: 'Name is required',
  NAME_MUST_BE_A_STRING: 'Name must be a string',
  PHONE_IS_REQUIRED: 'Phone is required',
  PHONE_MUST_BE_A_STRING: 'Phone must be a string',
  ADDRESS_IS_REQUIRED: 'Address is required',
  ADDRESS_MUST_BE_A_STRING: 'Address must be a string',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_MUST_BE_A_STRING: 'Email must be a string',
  RATING_MUST_BE_A_FLOAT: 'Rating must be a float (or double)',
  IMAGE_MUST_BE_A_STRING: 'Image must be a string',
  ISACTIVE_MUST_BE_A_BOOLEAN: 'isActive must be a boolean'
} as const

export const DELIVERY_INFO_MESSAGES = {
  PROVINCE_CITY_IS_REQUIRED: 'Province city is required',
  PROVINCE_CITY_MUST_BE_A_STRING: 'Province city must be a string',
  DISTRICT_IS_REQUIRED: 'District is required',
  DISTRICT_MUST_BE_A_STRING: 'District must be a string',
  WARD_IS_REQUIRED: 'Ward is required',
  WARD_MUST_BE_A_STRING: 'Ward must be a string',
  STREET_IS_REQUIRED: 'Street is required',
  STREET_MUST_BE_A_STRING: 'Street must be a string',
  IS_DEFAULT_MUST_BE_A_BOOLEAN: 'Is default must be a boolean',
  DELIVERY_INFO_IS_REQUIRED: 'Delivery info is required',
  DELIVERY_INFO_NOT_FOUND: 'Delivery info not found',
  INVALID_DELIVERY_INFO_ID: 'Invalid delivery info id',
  USER_ALREADY_HAVE_DEFAULT_DELIVERY_INFO: 'User already have default delivery info',
  CREATE_DELIVERY_INFO_SUCCESS: 'Create delivery info successfully',
  UPDATE_DELIVERY_INFO_SUCCESS: 'Update delivery info successfully',
  GET_ALL_DELIVERY_INFO_SUCCESS: 'Get all delivery info successfully',
  DELETE_DELIVERY_INFO_SUCCESS: 'Delete delivery info successfully',
  GET_DELIVERY_DETAIL_SUCCESS: 'Get delivery detail successfully',
  GET_DELIVERY_DEFAULT_SUCCESS: 'Get delivery default successfully'
} as const

export const ORDERS_MESSAGES = {
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_ALREADY_CANCELLED: 'Order already cancelled',
  ORDER_ALREADY_CONFIRMED: 'Order already confirmed',
  ORDER_ALREADY_SHIPPED: 'Order already shipped',
  ORDER_ALREADY_DELIVERED: 'Order already delivered',
  CHECKOUT_DELIVERY_INFORMATION_SUCCESS: 'Checkout delivery information successfully',
  CHECKOUT_REVIEW_ORDER_SUCCESS: 'Checkout review order successfully',
  GET_ORDER_BY_USER_SUCCESS: 'Get order by user successfully',
  GET_ALL_ORDERS_SUCCESS: 'Get all orders successfully',
  GET_ONE_ORDER_BY_USER_SUCCESS: 'Get one order by user successfully',
  PLACE_ORDER_SUCCESS: 'Place order successfully',
  CANCEL_ORDER_SUCCESS: 'Cancel order successfully',
  UPDATE_ORDER_STATUS_SUCCESS: 'Update order status successfully'
} as const

export const INVENTORY_MESSAGES = {
  ADD_STOCK_TO_INVENTORY_SUCCESS: 'Add stock to inventory successfully',
  INVALID_INVENTORY_ID: 'Invalid inventory id',
  INVENTORY_NOT_FOUND: 'Inventory not found',
  SHOP_ID_IS_REQUIRED: 'Shop id is required',
  SHOP_ID_MUST_BE_A_STRING: 'Shop id must be a string',
  PRODUCT_ID_IS_REQUIRED: 'Product id is required',
  PRODUCT_ID_MUST_BE_A_STRING: 'Product id must be a string',
  LOCATION_IS_REQUIRED: 'Location is required',
  LOCATION_MUST_BE_A_STRING: 'Location must be a string',
  STOCK_IS_REQUIRED: 'Stock is required',
  STOCK_MUST_BE_A_NUMBER: 'Stock must be a number',
  STOCK_MUST_BE_GREATER_THAN_0: 'Stock must be greater than 0'
} as const
