// Define type for secure path exceptions with actions
type NonSecurePathConfig = {
  path: string
  actions?: string[] // Optional actions - if not specified, all actions are non-secure
}

// Define routes that don't require permission checks
export const nonSecurePaths: NonSecurePathConfig[] = [
  { path: '/users/logout' },
  { path: '/users/register' },
  { path: '/users/login' },
  { path: '/users/verify-email' },
  { path: '/users/forgot-password' },
  { path: '/users/reset-password' },
  { path: '/users/search' },
  { path: '/users/me' },
  { path: '/delivery-info/default' },
  { path: '/check-services-jwt' },
  // Base paths
  { path: '/categories', actions: ['create'] },
  { path: '/categories/level/:level', actions: ['read', 'read:any'] },
  { path: '/categories/children/:parentId', actions: ['read', 'read:any'] },
  { path: '/categories/products/:categoryId', actions: ['read', 'read:any'] },
  { path: '/categories/:categoryId', actions: ['read', 'read:any'] },
  { path: '/categories', actions: ['read', 'read:any'] },
  { path: '/categories/name/:categoryName', actions: ['read', 'read:any'] },

  { path: '/products', actions: ['read', 'read:any'] },
  { path: '/products', actions: ['create'] },

  { path: '/shops', actions: ['read', 'read:any'] },
  { path: '/shops', actions: ['create'] },
  { path: '/shops/:shop_id', actions: ['read', 'read:any'] },

  { path: '/carts', actions: ['create'] },
  { path: '/carts', actions: ['read', 'read:any'] },
  { path: '/carts/update', actions: ['update'] },
  { path: '/carts', actions: ['delete'] },
  { path: '/orders/checkout/checkout-review', actions: ['create'] },
  { path: '/delivery-info', actions: ['create'] },
  { path: '/delivery-info', actions: ['read', 'read:any'] },
  { path: '/delivery-info', actions: ['update'] },
  { path: '/delivery-info', actions: ['delete'] },
  { path: '/orders', actions: ['create'] },
]

// For backward compatibility, export just the paths as an array of strings
export const nonSecurePathsLegacy = nonSecurePaths.map((item) => item.path)
