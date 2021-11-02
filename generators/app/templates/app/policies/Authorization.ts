import { Request, Response } from "express";
import _ from "lodash";
import { Role } from "@/models/Role";
import { Controller } from "@/libraries/Controller";
import { PermissionData, Policy } from "@/models/Policy";

interface ResourcePermission {
  resource: string;
  action: string;
}

interface DataPermission {
  resource: string;
  data: string;
  action: string;
  isAllowed: boolean;
}

interface Permission {
  path: ResourcePermission[];
  data: DataPermission[];
  custom: string[];
}

interface ParsedPermissions {
  allow: string[];
  deny: string[];
}

const requestMethodMapper = {
  r: ["GET"],
  c: ["POST"],
  d: ["DELETE"],
  u: ["PUT", "PATCH"],
  GET: "r",
  POST: "c",
  DELETE: "d",
  PUT: "u",
  PATCH: "u",
};
const regExpResource = new RegExp(/\w+\b(?!\*)(\.)(\*)(\.)[cudr]$/);
const regExpAllAccessResource = new RegExp(/\w+\b(?!\*)(\.)(\*)(\.)[*]$/);
const regExpData = new RegExp(/\w+\b(?!\*)(\.)(\w+)(\.)[cudr]$/);
const regExpAllAccessData = new RegExp(/\w+\b(?!\*)(\.)\w+\b(?!\*)(\.)[*]$/);
const regExpCustomPermission = new RegExp(/^[^\s.]+$/);

/**
 *
 * @param resourcePermission Array with all permission for source
 * @param dataPermission Array with all permission for data
 * @param permission Reference value to save the system format to handle permission
 */
function permissionFormat(
  resourcePermission: ParsedPermissions,
  dataPermission: ParsedPermissions,
  customPermission: ParsedPermissions,
  permission: Permission,
) {
  const removeDuplicates = (originalArray: string[], itemsToRemove: string[]) =>
    _.pullAll(_.uniq(originalArray), _.uniq(itemsToRemove)) as string[];

  const pathPermission = removeDuplicates(
    resourcePermission.allow,
    resourcePermission.deny,
  ).map(data => {
    const resourceParsed = data.split(".");
    return {
      resource: resourceParsed[0],
      action: resourceParsed[2],
    };
  });
  permission.path = _.uniq(permission.path.concat(pathPermission));

  const dataAllowPermissions = removeDuplicates(
    dataPermission.allow,
    dataPermission.deny,
  ).map(data => {
    const dataParsed = data.split(".");
    return {
      resource: dataParsed[0],
      data: dataParsed[1],
      action: dataParsed[2],
      isAllowed: true,
    };
  });

  const dataDenyPermissions = dataPermission.deny.map(data => {
    const resourceParsed = data.split(".");
    return {
      resource: resourceParsed[0],
      data: resourceParsed[1],
      action: resourceParsed[2],
      isAllowed: false,
    };
  });
  const allDataPermission = dataAllowPermissions.concat(dataDenyPermissions);
  permission.data = _.uniqWith(allDataPermission, _.isEqual);

  const custPermission = removeDuplicates(
    customPermission.allow,
    customPermission.deny,
  );
  permission.custom = _.uniq(permission.custom.concat(custPermission));
}

/**
 *
 * @param permission Permission in the original format word.(word|*).*
 * @param permissions Array to sava the parsed permission.
 * @param isResource Flag to validate the format of the path
 */
function createPermissionsFullAccess(
  permission: string,
  permissions: string[],
  isResource: boolean,
) {
  const actions = ["r", "c", "u", "d"];
  let permissionFormat = "";
  if (isResource) {
    const parsedPermission = permission.split(".");
    permissionFormat = `${parsedPermission[0]}.*.`;
  } else {
    const parsedPermission = permission.split(".");
    permissionFormat = `${parsedPermission[0]}.${parsedPermission[1]}.`;
  }
  for (const action of actions) {
    permissions.push(permissionFormat.concat(action));
  }
}

/**
 *
 * @param resource String that contains the permission
 * @param permission The value of permission
 * @param resourcePermission Object to handle source permission internally
 * @param dataPermission Object to handle data permission internally
 * @param customPermission Object to handle custom permission internally
 */
function getParsedPermissionString(
  resource: string,
  permission: PermissionData,
  resourcePermission: ParsedPermissions,
  dataPermission: ParsedPermissions,
  customPermission: ParsedPermissions,
) {
  /**
   * Match resource permission format word.*.* and parse the permission to  format word.*.(r,u,d,c)
   */
  if (regExpAllAccessResource.test(resource)) {
    if (permission[resource]) {
      createPermissionsFullAccess(resource, resourcePermission.allow, true);
    } else {
      createPermissionsFullAccess(resource, resourcePermission.deny, true);
    }
  }

  /**
   * Match resource permission format word.*.(r,u,d,c)
   */
  if (regExpResource.test(resource)) {
    if (permission[resource]) {
      resourcePermission.allow.push(resource);
    } else {
      resourcePermission.deny.push(resource);
    }
  }

  /**
   * Match resource permission format word.word.* and parse the permission to  format word.word.(r,u,d,c)
   */
  if (regExpAllAccessData.test(resource)) {
    if (permission[resource]) {
      createPermissionsFullAccess(resource, dataPermission.allow, false);
    } else {
      createPermissionsFullAccess(resource, dataPermission.deny, false);
    }
  }

  /**
   * Match resource permission format word.word.(r,u,d,c)
   */
  if (regExpData.test(resource)) {
    if (permission[resource]) {
      dataPermission.allow.push(resource);
    } else {
      dataPermission.deny.push(resource);
    }
  }

  /**
   * Match custom permission format "word"
   */
  if (regExpCustomPermission.test(resource)) {
    if (permission[resource]) {
      customPermission.allow.push(resource);
    } else {
      customPermission.deny.push(resource);
    }
  }
}

/**
 *
 * @param policies  Policies to generate permission
 * @param permission Reference to store the result of permission
 */
function getPermission(policies: Policy[], permission: Permission) {
  const resourcePermission: ParsedPermissions = {
    allow: [],
    deny: [],
  };
  const dataPermission: ParsedPermissions = {
    allow: [],
    deny: [],
  };
  const customPermission: ParsedPermissions = {
    allow: [],
    deny: [],
  };
  for (const policy in policies) {
    const permission = policies[policy].permission;
    for (const resource in permission) {
      getParsedPermissionString(
        resource,
        permission,
        resourcePermission,
        dataPermission,
        customPermission,
      );
    }
  }
  permissionFormat(
    resourcePermission,
    dataPermission,
    customPermission,
    permission,
  );
}

/**
 *
 * @param roleIds RolesIds to generate permissions
 */
async function getRolePoliciesFromTokenPayload(
  roleIds: string[],
): Promise<Permission> {
  const rolePolicies = await Role.findAll({
    where: {
      id: roleIds,
    },
    include: [{ model: Policy, as: "policies" }],
  });
  const permission: Permission = {
    path: [],
    data: [],
    custom: [],
  };
  const rolePoliciesMap = rolePolicies.map(rolePolicy => rolePolicy.policies);
  for (const rolePolicy in rolePoliciesMap) {
    getPermission(rolePoliciesMap[rolePolicy], permission);
  }
  return permission;
}

/**
 *
 * @param req User request
 * @param dataPermission User data permission
 * @param method  request method
 */
function handleDataPermission(
  req: Request,
  dataPermission: DataPermission[],
  method: string,
) {
  const hideValues: string[] = [];
  for (const permission of dataPermission) {
    const data = permission.data;
    if (method === "GET") {
      if (!permission.isAllowed) {
        hideValues.push(permission.data);
      }
    } else {
      if (!permission.isAllowed) {
        if (!_.isEmpty(req.body[`${data}`])) return false;
      }
    }
  }
  req.query.attributes = {
    exclude: hideValues,
  };
  return true;
}

/**
 *
 * @param req User request
 * @param permissions All user permissions source and data.
 */
function roleCanAccessResource(req: Request, permissions: Permission) {
  const { originalUrl, method } = req;
  const preFix = "/api/v1/";
  const methodWithQueryParams = originalUrl.split("?");
  const url =
    methodWithQueryParams.length > 0 ? methodWithQueryParams[0] : originalUrl;
  const pathWithoutSlashes: string[] = url
    .replace(preFix, "")
    .split("/")
    .splice(0, 1);

  const permissionsToResource = permissions.path.filter(permission =>
    pathWithoutSlashes.includes(permission.resource),
  );
  const dataPermission = _.filter(permissions.data, {
    resource: pathWithoutSlashes[0],
    action: requestMethodMapper[method],
  });
  if (_.isEmpty(permissionsToResource)) {
    return false;
  }

  const allowedMethods: string[] = _.flatMap(
    permissionsToResource,
    permission => {
      return requestMethodMapper[permission.action];
    },
  );
  const isMethodAllowed = allowedMethods.includes(method);
  if (!isMethodAllowed) {
    return false;
  }
  if (isMethodAllowed && _.isEmpty(dataPermission)) {
    return true;
  }

  return handleDataPermission(req, dataPermission, method);
}

/**
 *
 * @param req User request
 * @param permissions All user permissions source and data.
 */
function roleAllowsCustomPermission(
  permission: string,
  permissions: Permission,
): boolean {
  return permissions.custom.includes(permission);
}

/**
 *
 * @constructor Middleware to handle users permission based on their roles.
 */
export function AuthMiddleware() {
  return (req: Request, res: Response, next: Function) => {
    const roles = req.session.jwt.roles;
    if (_.isEmpty(roles)) return Controller.unauthorized(res);
    getRolePoliciesFromTokenPayload(roles)
      .then(permissions => roleCanAccessResource(req, permissions))
      .then(canAccess => {
        if (canAccess) {
          next();
        } else {
          return Controller.unauthorized(res);
        }
      })
      .catch(error => {
        throw error;
      });
  };
}

export function hasCustomPermission(permission: string) {
  return async (req: Request, res: Response, next: Function) => {
    const roles = req.session.jwt.roles;
    if (_.isEmpty(roles)) return Controller.unauthorized(res);
    try {
      const permissions = await getRolePoliciesFromTokenPayload(roles);
      const canAccess = roleAllowsCustomPermission(permission, permissions);
      if (canAccess) {
        next();
      } else {
        return Controller.unauthorized(res);
      }
    } catch (error) {
      throw error;
    }
  };
}

export function hasAdminAccess() {
  return hasCustomPermission("admin");
}
