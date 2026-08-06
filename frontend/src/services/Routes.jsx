import { createBrowserRouter} from 'react-router-dom'
import Home from '../pages/Home.jsx';
import SignUp from '../pages/signup.jsx';
import LoginPage from '../pages/login.jsx';
import { ProtectedRoute } from './Auth.jsx';
import Main from '../pages/Main.jsx';
import { AccountPage } from '../pages/Account.jsx';
import PageNotFound from '../pages/PageNotFound.jsx';
import ProfilePage from '../pages/Profile.jsx';
import EditProfilePage from '../pages/EditProfile.jsx';
import Connect from '../pages/app/connect.jsx';
import ViewProfile from '../pages/app/viewProfile.jsx';
import ConnectionsPage from '../pages/app/connections.jsx';
import CommunityWall from '../pages/app/community.jsx';
import Meetings from '../pages/app/meetings.jsx';
import Milestones from '../pages/app/MileStone.jsx';

const Routes = createBrowserRouter([
    {
        path: '/',
        element: <Home />
    },
    {
        path: '/signup',
        element: <SignUp />
    },
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/dashboard',
        element: <ProtectedRoute><Main /></ProtectedRoute>
    },
    {
        path: '/account',
        element: <ProtectedRoute><AccountPage /></ProtectedRoute>
    },
    {
        path: '/profile',
        element: <ProtectedRoute> <ProfilePage /> </ProtectedRoute>
    },
    {
        path: '/profile/edit',
        element: <ProtectedRoute> <EditProfilePage /> </ProtectedRoute>
    },
    {
        path: '/connect/:type',
        element: <ProtectedRoute> <Connect /> </ProtectedRoute>
    },
    {
        path: '/connect/:type/:id',
        element: <ProtectedRoute> <ViewProfile /> </ProtectedRoute>
    },
    {
        path: '/connections',
        element: <ProtectedRoute> <ConnectionsPage /> </ProtectedRoute>
    },
    {
        path: '/community',
        element: <ProtectedRoute> <CommunityWall /> </ProtectedRoute>
    },
    {
        path : '/meetings',
        element: <ProtectedRoute> <Meetings /> </ProtectedRoute>
    },
    {
        path: '/milestones',
        element: <ProtectedRoute> <Milestones /> </ProtectedRoute>
    },
    {
        path: '*',
        element: <PageNotFound />
    }
])

export default Routes;
