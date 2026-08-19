import FullScreenLoader from "../pages/Loading"
import { useStore } from "../zustand/store"
import { Navigate } from "react-router-dom"
import { VideoCallProvider } from "../context/VideoCallContext"
import VideoCallModal from "../components/VideoCallModal"
import LiveSessionInviteModal from "../components/LiveSessionInviteModal"

const ProtectedRoute = ({children}) => {
    const user = useStore((state) => state.user)
    const isLoading = useStore((state) => state.isLoading)

    if(isLoading) return <FullScreenLoader />
    if(!user && !isLoading) return <Navigate to='/login' />;

    return (
        <VideoCallProvider>
            {children}
            <VideoCallModal />
            <LiveSessionInviteModal />
        </VideoCallProvider>
    )
}

/**
 * IsAdminRoute — wraps admin-only pages
 * Must be used INSIDE a ProtectedRoute (so user is guaranteed to be loaded)
 * Redirects to /unauthorized if the user's role is not admin or super_admin
 */
const IsAdminRoute = ({ children }) => {
    const user = useStore((state) => state.user)

    if (!user) return <Navigate to="/login" replace />

    const isAdmin = user.role === "admin" || user.role === "super_admin"
    if (!isAdmin) return <Navigate to="/unauthorized" replace />

    return children
}

export { ProtectedRoute, IsAdminRoute }