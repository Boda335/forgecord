import { PermissionFlagsBits } from 'discord.js';

export default function getPermissionName(permissionValue: number | bigint): string[] | null {
  const matchedPermissions: string[] = [];
  const bigIntPermissionValue = BigInt(permissionValue);

  for (const [permissionName, permissionBit] of Object.entries(PermissionFlagsBits)) {
    const bit = BigInt(permissionBit);
    if ((bigIntPermissionValue & bit) === bit) {
      matchedPermissions.push(permissionName);
    }
  }

  return matchedPermissions.length > 0 ? matchedPermissions : null;
}
