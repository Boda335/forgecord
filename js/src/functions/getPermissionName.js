const { PermissionFlagsBits } = require('discord.js');

/**
 *
 * @param {number} permissionValue
 * @returns
 */

function getPermissionName(permissionValue) {
  const matchedPermissions = [];
  const bigIntPermissionValue = BigInt(permissionValue);

  for (const [permissionName, permissionBit] of Object.entries(PermissionFlagsBits)) {
    const bit = BigInt(permissionBit);
    if ((bigIntPermissionValue & bit) === bit) {
      matchedPermissions.push(permissionName);
    }
  }

  return matchedPermissions.length > 0 ? matchedPermissions : null;
}

module.exports = getPermissionName;
