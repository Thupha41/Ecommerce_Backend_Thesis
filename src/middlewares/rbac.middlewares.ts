import HTTP_STATUS from '~/constants/httpStatus'
import { verifyToken, extractToken } from '~/utils/jwt'
import { Request, Response, NextFunction } from 'express'
import { TokenPayload } from '~/models/requests/users.requests'
import { ErrorWithStatus } from '~/models/Errors'
import { AUTH_MESSAGES } from '~/constants/messages'
import { nonSecurePaths } from '~/constants/nonSecurePath'
import { envConfig } from '~/constants/config'

// Map HTTP methods to corresponding actions
const mapMethodToAction = (method: string) => {
  switch (method.toUpperCase()) {
    case 'POST':
      return ['create']
    case 'GET':
      return ['read', 'read:any']
    case 'PUT':
      return ['update']
    case 'PATCH':
      return ['update']
    case 'DELETE':
      return ['delete']
    default:
      return ['read', 'read:any']
  }
}

// Simple path matcher that handles path parameters
const isPathMatch = (pattern: string, path: string): boolean => {
  try {
    // Split the pattern and path into segments
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    // If the number of segments differs, they can't match
    if (patternSegments.length !== pathSegments.length) {
      // console.log(`Path length mismatch: ${pattern} (${patternSegments.length}) vs ${path} (${pathSegments.length})`);
      return false;
    }

    // Check each segment
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSeg = patternSegments[i];
      const pathSeg = pathSegments[i];

      // If pattern segment starts with :, it's a parameter and matches anything
      if (patternSeg.startsWith(':')) {
        continue;
      }

      // Otherwise, the segments should match exactly
      if (patternSeg !== pathSeg) {
        // console.log(`Segment mismatch at position ${i}: ${patternSeg} vs ${pathSeg}`);
        return false;
      }
    }

    console.log(`Path match found: ${pattern} matches ${path}`);
    // All segments matched
    return true;
  } catch (error) {
    console.error('Path matching error:', error);
    return false;
  }
}

export const checkUserPermission = (req: Request, res: Response, next: NextFunction) => {
  // Get current request actions based on HTTP method
  const requestActions = mapMethodToAction(req.method)

  // Check if path is in non-secure paths with action consideration
  for (const nonSecurePath of nonSecurePaths) {
    // Check if the path pattern matches
    if (isPathMatch(nonSecurePath.path, req.path)) {
      // If no actions are specified, all actions are allowed
      if (!nonSecurePath.actions) {
        return next()
      }

      // Check if any of the request actions are in the allowed non-secure actions
      const isActionAllowed = requestActions.some(action =>
        nonSecurePath.actions?.includes(action)
      )

      if (isActionAllowed) {
        return next()
      }
    }
  }

  if (req.decoded_authorization) {
    const { roles } = req.decoded_authorization as TokenPayload
    const currentPath = req.path
    console.log('Current Path:', currentPath)
    console.log('HTTP Method:', req.method)

    if (!roles || roles.length === 0) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.NO_PERMISSION,
        status: HTTP_STATUS.FORBIDDEN
      })
    }

    // Extract the base path (first segment of the path)
    // For example: /shops/123abc or /shops/e0d7be34a425e074711df -> /shops
    const segments = currentPath.split('/').filter(Boolean)
    const basePath = segments.length > 0 ? `/${segments[0]}` : ''
    console.log('Base Path:', basePath)

    // Get allowed actions for current method
    const allowedActions = requestActions
    console.log('Allowed Actions:', allowedActions)

    // Check if user has permission for this resource and action
    let hasPermission = false

    // Loop through each role
    for (const role of roles) {
      if (!role.role_grant || !Array.isArray(role.role_grant)) continue

      // Loop through each grant in the role
      for (const grant of role.role_grant) {
        // Check if resources_url matches the base path
        if (grant.resources_url && basePath.toLowerCase() === grant.resources_url.toLowerCase()) {
          console.log(`Checking grant: ${JSON.stringify(grant)}`)

          // Check if the action is allowed
          if (allowedActions.includes(grant.actions)) {
            console.log(`Permission granted by role ${role.role_name} with action ${grant.actions}`)
            hasPermission = true
            break
          }
        }
      }

      if (hasPermission) break
    }

    if (hasPermission) {
      next()
    } else {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.NO_PERMISSION_TO_ACCESS_RESOURCE,
        status: HTTP_STATUS.FORBIDDEN
      })
    }
  } else {
    throw new ErrorWithStatus({
      message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
}

export const checkServicesJWT = async (req: Request, res: Response, next: NextFunction) => {
  //extract token from header
  const tokenFromHeader = extractToken(req)
  if (tokenFromHeader) {
    let access_token = tokenFromHeader
    let decoded = await verifyToken({ token: access_token, secretOrPublicKey: envConfig.jwtSecretAccessToken })
    console.log('>>> check decoded services JWT', decoded)
    if (decoded) {
      res.json({
        message: 'Verify services JWT successfully',
        result: decoded
      })
      return
    } else {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
        status: HTTP_STATUS.UNAUTHORIZED
      })
    }
  } else {
    throw new ErrorWithStatus({
      message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
}
