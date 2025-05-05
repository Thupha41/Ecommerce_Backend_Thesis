// Define type for secure path exceptions with actions
type NonSecurePathConfig = {
  path: string;
  actions?: string[]; // Optional actions - if not specified, all actions are non-secure
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
  { path: '/categories/level/:level', actions: ['read', 'read:any'] },
  { path: '/categories/children/:parentId', actions: ['read', 'read:any'] },
  { path: '/categories/products/:categoryId', actions: ['read', 'read:any'] },
  { path: '/categories/:categoryId', actions: ['read', 'read:any'] },
  { path: '/categories', actions: ['read', 'read:any'] },
]

// For backward compatibility, export just the paths as an array of strings
export const nonSecurePathsLegacy = nonSecurePaths.map(item => item.path);
