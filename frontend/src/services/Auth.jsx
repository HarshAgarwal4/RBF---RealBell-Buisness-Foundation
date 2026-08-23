import FullScreenLoader from "../pages/Loading";
import { useStore } from "../zustand/store";
import { Navigate } from "react-router-dom";
import { VideoCallProvider } from "../context/VideoCallContext";
import VideoCallModal from "../components/VideoCallModal";
import { hasPermission, hasAnyPermission, isSuperAdmin } from "../utils/rbac";
import AccessDenied from "../pages/admin/AccessDenied";
import AdminLayout from "../pages/admin/AdminLayout";

const ProtectedRoute = ({ children }) => {
    const user = useStore((state) => state.user);
    const isLoading = useStore((state) => state.isLoading);

    if (isLoading) return <FullScreenLoader />;
    if (!user && !isLoading) return <Navigate to='/login' replace />;

    // If user is not super_admin and approval is not granted, redirect to /approval-center
    if (
        user &&
        user.role !== "super_admin" &&
        user.approvalStatus &&
        user.approvalStatus !== "Approved"
    ) {
        return <Navigate to="/approval-center" replace />;
    }

    return (
        <VideoCallProvider>
            {children}
            <VideoCallModal />
        </VideoCallProvider>
    );
};

/**
 * IsAdminRoute — wraps admin-only pages
 * Checks if user is super_admin, admin, or has customRole
 */
const IsAdminRoute = ({ children }) => {
    const user = useStore((state) => state.user);

    if (!user) return <Navigate to="/login" replace />;

    if (user.accountStatus === "disabled") {
        return <Navigate to="/unauthorized" replace />;
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin" || Boolean(user.team);
    if (!isAdmin) return <Navigate to="/unauthorized" replace />;

    return children;
};

/**
 * PermissionRoute — guards specific admin modules with granular permissions
 * If unauthorized, renders the AccessDenied view inside AdminLayout
 */
const PermissionRoute = ({ children, permission, anyPermissions, moduleName = "this page" }) => {
    const user = useStore((state) => state.user);

    if (!user) return <Navigate to="/login" replace />;

    if (user.accountStatus === "disabled") {
        return <Navigate to="/unauthorized" replace />;
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin" || Boolean(user.team);
    if (!isAdmin) return <Navigate to="/unauthorized" replace />;

    // Super admin has full access
    if (isSuperAdmin(user)) return children;

    // Check specific permission
    let isAllowed = true;
    if (permission) {
        isAllowed = hasPermission(user, permission);
    } else if (anyPermissions && anyPermissions.length > 0) {
        isAllowed = hasAnyPermission(user, anyPermissions);
    }

    if (!isAllowed) {
        return (
            <AdminLayout title="Access Denied">
                <AccessDenied
                    requiredPermission={permission || anyPermissions}
                    moduleName={moduleName}
                />
            </AdminLayout>
        );
    }

    return children;
};

export { ProtectedRoute, IsAdminRoute, PermissionRoute };