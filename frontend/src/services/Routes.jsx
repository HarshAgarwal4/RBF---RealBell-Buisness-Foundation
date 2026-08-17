import { createBrowserRouter} from 'react-router-dom'
import Home from '../pages/Home.jsx';
import SignUp from '../pages/signup.jsx';
import LoginPage from '../pages/login.jsx';
import { ProtectedRoute, IsAdminRoute } from './Auth.jsx';
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
import Job from '../pages/app/Job.jsx';
import Tickets from '../pages/app/Tickets.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminJobs from '../pages/admin/AdminJobs.jsx';
import AdminTickets from '../pages/admin/AdminTickets.jsx';
import AdminCommunity from '../pages/admin/AdminCommunity.jsx';
import AdminAnalytics from '../pages/admin/AdminAnalytics.jsx';
import AdminResources from '../pages/admin/AdminResources.jsx';
import ContractsPage from '../pages/app/resources/ContractsPage.jsx';
import GlossaryPage from '../pages/app/resources/GlossaryPage.jsx';
import ReportsPage from '../pages/app/resources/ReportsPage.jsx';
import NewsPage from '../pages/app/resources/NewsPage.jsx';
import VideosPage from '../pages/app/resources/VideosPage.jsx';
import Programs from '../pages/app/Programs.jsx';
import ProgramDetail from '../pages/app/ProgramDetail.jsx';
import ProgramApply from '../pages/app/ProgramApply.jsx';
import AdminPrograms from '../pages/admin/AdminPrograms.jsx';
import AdminProgramApplications from '../pages/admin/AdminProgramApplications.jsx';
import Events from '../pages/app/Events.jsx';
import EventDetail from '../pages/app/EventDetail.jsx';
import EventApply from '../pages/app/EventApply.jsx';
import AdminEvents from '../pages/admin/AdminEvents.jsx';
import AdminEventAttendees from '../pages/admin/AdminEventAttendees.jsx';
import AdminRoles from '../pages/admin/AdminRoles.jsx';
import Subscription from '../pages/Subscription.jsx';
import AdminSubscriptions from '../pages/admin/AdminSubscriptions.jsx';
import AdminThemeCustomizer from '../pages/admin/AdminThemeCustomizer.jsx';
import AdminAuthSettings from '../pages/admin/AdminAuthSettings.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import LegalServices from '../pages/app/legalCompliance/LegalServices.jsx';
import LegalServiceApply from '../pages/app/legalCompliance/LegalServiceApply.jsx';
import MyLegalApplications from '../pages/app/legalCompliance/MyLegalApplications.jsx';
import LegalComplianceDocuments from '../pages/app/legalCompliance/LegalComplianceDocuments.jsx';
import AdminLegalCompliance from '../pages/admin/AdminLegalCompliance.jsx';

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
        path: '/forgot-password',
        element: <ForgotPassword />
    },
    {
        path: '/dashboard',
        element: <ProtectedRoute><Main /></ProtectedRoute>
    },
    {
        path: '/subscription',
        element: <ProtectedRoute><Subscription /></ProtectedRoute>
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
        path: '/jobs',
        element: <ProtectedRoute> <Job /> </ProtectedRoute>
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
        path: '/tickets',
        element: <ProtectedRoute> <Tickets /> </ProtectedRoute>
    },
    {
        path: '/unauthorized',
        element: <Unauthorized />
    },
    /* ── Admin Routes (ProtectedRoute → IsAdminRoute → Page) ── */
    {
        path: '/admin',
        element: <ProtectedRoute><IsAdminRoute><AdminDashboard /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/roles',
        element: <ProtectedRoute><IsAdminRoute><AdminRoles /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/subscriptions',
        element: <ProtectedRoute><IsAdminRoute><AdminSubscriptions /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/theme-customizer',
        element: <ProtectedRoute><IsAdminRoute><AdminThemeCustomizer /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/auth-settings',
        element: <ProtectedRoute><IsAdminRoute><AdminAuthSettings /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/users',
        element: <ProtectedRoute><IsAdminRoute><AdminUsers /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/jobs',
        element: <ProtectedRoute><IsAdminRoute><AdminJobs /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/tickets',
        element: <ProtectedRoute><IsAdminRoute><AdminTickets /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/community',
        element: <ProtectedRoute><IsAdminRoute><AdminCommunity /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/analytics',
        element: <ProtectedRoute><IsAdminRoute><AdminAnalytics /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/resources',
        element: <ProtectedRoute><IsAdminRoute><AdminResources /></IsAdminRoute></ProtectedRoute>
    },
    /* ── Resource Pages ── */
    {
        path: '/resources/contracts',
        element: <ProtectedRoute><ContractsPage /></ProtectedRoute>
    },
    {
        path: '/resources/glossary',
        element: <ProtectedRoute><GlossaryPage /></ProtectedRoute>
    },
    {
        path: '/resources/reports',
        element: <ProtectedRoute><ReportsPage /></ProtectedRoute>
    },
    {
        path: '/resources/news',
        element: <ProtectedRoute><NewsPage /></ProtectedRoute>
    },
    {
        path: '/resources/videos',
        element: <ProtectedRoute><VideosPage /></ProtectedRoute>
    },
    /* ── Programs ── */
    {
        path: '/programs',
        element: <ProtectedRoute><Programs /></ProtectedRoute>
    },
    {
        path: '/programs/:id',
        element: <ProtectedRoute><ProgramDetail /></ProtectedRoute>
    },
    {
        path: '/programs/:id/apply',
        element: <ProtectedRoute><ProgramApply /></ProtectedRoute>
    },
    /* ── Admin Programs ── */
    {
        path: '/admin/programs',
        element: <ProtectedRoute><IsAdminRoute><AdminPrograms /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/programs/:id/applications',
        element: <ProtectedRoute><IsAdminRoute><AdminProgramApplications /></IsAdminRoute></ProtectedRoute>
    },
    /* ── Events ── */
    {
        path: '/events',
        element: <ProtectedRoute><Events /></ProtectedRoute>
    },
    {
        path: '/events/:id',
        element: <ProtectedRoute><EventDetail /></ProtectedRoute>
    },
    {
        path: '/events/:id/apply',
        element: <ProtectedRoute><EventApply /></ProtectedRoute>
    },
    /* ── Admin Events ── */
    {
        path: '/admin/events',
        element: <ProtectedRoute><IsAdminRoute><AdminEvents /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '/admin/events/:id/attendees',
        element: <ProtectedRoute><IsAdminRoute><AdminEventAttendees /></IsAdminRoute></ProtectedRoute>
    },
    /* ── Legal Compliances ── */
    {
        path: '/legal-compliances',
        element: <ProtectedRoute><LegalServices /></ProtectedRoute>
    },
    {
        path: '/legal-compliances/services/:id/apply',
        element: <ProtectedRoute><LegalServiceApply /></ProtectedRoute>
    },
    {
        path: '/legal-compliances/my-applications',
        element: <ProtectedRoute><MyLegalApplications /></ProtectedRoute>
    },
    {
        path: '/legal-compliances/documents',
        element: <ProtectedRoute><LegalComplianceDocuments /></ProtectedRoute>
    },
    /* ── Admin Legal Compliance ── */
    {
        path: '/admin/legal-compliance',
        element: <ProtectedRoute><IsAdminRoute><AdminLegalCompliance /></IsAdminRoute></ProtectedRoute>
    },
    {
        path: '*',
        element: <PageNotFound />
    }
])

export default Routes;
