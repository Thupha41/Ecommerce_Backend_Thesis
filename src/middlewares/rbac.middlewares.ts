import HTTP_STATUS from "~/constants/httpStatus";
import { verifyToken, extractToken } from "~/utils/jwt";
import { Request, Response, NextFunction } from "express";
import { TokenPayload } from "~/models/requests/users.requests";
import { ErrorWithStatus } from "~/models/Errors";
import { AUTH_MESSAGES } from "~/constants/messages";
import { nonSecurePaths } from "~/constants/nonSecurePath";
import { envConfig } from "~/constants/config";
import { result } from "lodash";

// Map HTTP methods to corresponding actions
const mapMethodToAction = (method: string) => {
  switch (method.toUpperCase()) {
    case 'POST': return ['create'];
    case 'GET': return ['read', 'read:any'];
    case 'PUT': return ['update'];
    case 'PATCH': return ['update'];
    case 'DELETE': return ['delete'];
    default: return ['read', 'read:any'];
  }
};

export const checkUserPermission = (req: Request, res: Response, next: NextFunction) => {
  if (nonSecurePaths.includes(req.path as typeof nonSecurePaths[number])) {
    return next();
  }

  if (req.decoded_authorization) {
    const { roles } = req.decoded_authorization as TokenPayload;
    const currentPath = req.path;
    console.log("Current Path:", currentPath);
    console.log("HTTP Method:", req.method);

    if (!roles || roles.length === 0) {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.NO_PERMISSION,
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    // Extract the base path (first segment of the path)
    // For example: /shops/123abc or /shops/e0d7be34a425e074711df -> /shops
    const segments = currentPath.split('/').filter(Boolean);
    const basePath = segments.length > 0 ? `/${segments[0]}` : '';
    console.log("Base Path:", basePath);

    // Get allowed actions for current method
    const allowedActions = mapMethodToAction(req.method);
    console.log("Allowed Actions:", allowedActions);

    // Check if user has permission for this resource and action
    let hasPermission = false;

    // Loop through each role
    for (const role of roles) {
      if (!role.role_grant || !Array.isArray(role.role_grant)) continue;

      // Loop through each grant in the role
      for (const grant of role.role_grant) {
        // Check if resources_url matches the base path
        if (grant.resources_url && basePath.toLowerCase() === grant.resources_url.toLowerCase()) {
          console.log(`Checking grant: ${JSON.stringify(grant)}`);

          // Check if the action is allowed
          if (allowedActions.includes(grant.actions)) {
            console.log(`Permission granted by role ${role.role_name} with action ${grant.actions}`);
            hasPermission = true;
            break;
          }
        }
      }

      if (hasPermission) break;
    }

    if (hasPermission) {
      next();
    } else {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.NO_PERMISSION_TO_ACCESS_RESOURCE,
        status: HTTP_STATUS.FORBIDDEN
      });
    }
  } else {
    throw new ErrorWithStatus({
      message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
};

export const checkServicesJWT = async (req: Request, res: Response, next: NextFunction) => {
  //extract token from header
  const tokenFromHeader = extractToken(req);
  if (tokenFromHeader) {
    let access_token = tokenFromHeader;
    let decoded = await verifyToken({ token: access_token, secretOrPublicKey: envConfig.jwtSecretAccessToken });
    console.log(">>> check decoded services JWT", decoded);
    if (decoded) {
      res.json({
        message: "Verify services JWT successfully",
        result: decoded
      })
      return;
    } else {
      throw new ErrorWithStatus({
        message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }
  } else {
    throw new ErrorWithStatus({
      message: AUTH_MESSAGES.USER_NOT_AUTHENTICATED,
      status: HTTP_STATUS.UNAUTHORIZED
    });
  }
};



