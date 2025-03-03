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
  UPDATE_PRODUCT_PRICE_SUCCESS: 'Update product price successfully'
} as const
