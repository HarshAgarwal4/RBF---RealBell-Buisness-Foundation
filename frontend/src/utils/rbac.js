/**
 * Reusable RBAC authorization utilities for frontend (Team-based permissions)
 */

/**
 * Check if the user is a Super Admin
 */
export function isSuperAdmin(user) {
  return user?.role === "super_admin";
}

/**
 * Extract active permissions array from user object
 */
export function getUserPermissions(user) {
  if (!user) return [];
  if (user.role === "super_admin") return ["*"];
  if (user.accountStatus === "disabled") return [];

  // If user object has computed permissions array from backend
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }

  // If team object is populated with permissions
  if (user.team && typeof user.team === "object") {
    if (user.team.status === "inactive") return [];
    if (Array.isArray(user.team.permissions)) {
      return user.team.permissions;
    }
  }

  // If customRole object is populated with permissions
  if (user.customRole && typeof user.customRole === "object") {
    if (user.customRole.status === "inactive") return [];
    if (Array.isArray(user.customRole.permissions)) {
      return user.customRole.permissions;
    }
  }

  return [];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.accountStatus === "disabled") return false;

  const userPerms = getUserPermissions(user);
  if (userPerms.includes("*")) return true;

  if (Array.isArray(permission)) {
    return permission.some((p) => userPerms.includes(p));
  }

  return userPerms.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user, permissions = []) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.accountStatus === "disabled") return false;
  if (!permissions || permissions.length === 0) return true;

  const userPerms = getUserPermissions(user);
  if (userPerms.includes("*")) return true;

  return permissions.some((p) => userPerms.includes(p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user, permissions = []) {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  if (user.accountStatus === "disabled") return false;
  if (!permissions || permissions.length === 0) return true;

  const userPerms = getUserPermissions(user);
  if (userPerms.includes("*")) return true;

  return permissions.every((p) => userPerms.includes(p));
}

/**
 * Return formatted display badge data for user role / team
 */
export function getRoleBadgeInfo(user) {
  if (!user) return { label: "Guest", color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  if (user.role === "super_admin") {
    return {
      label: "Super Admin",
      icon: "⭐",
      color: "#fbbf24",
      bg: "rgba(245,158,11,0.15)",
      border: "rgba(245,158,11,0.3)",
    };
  }
  if (user.team?.name) {
    return {
      label: `${user.team.name} Team`,
      icon: "🏢",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.15)",
      border: "rgba(56,189,248,0.3)",
      team: user.team.name,
    };
  }
  if (user.role === "admin") {
    return {
      label: "Admin",
      icon: "🛡️",
      color: "#818cf8",
      bg: "rgba(99,102,241,0.15)",
      border: "rgba(99,102,241,0.3)",
    };
  }
  return {
    label: user.company_type || "Member",
    icon: "👤",
    color: "#a1a1aa",
    bg: "rgba(161,161,170,0.1)",
    border: "rgba(161,161,170,0.2)",
  };
}
