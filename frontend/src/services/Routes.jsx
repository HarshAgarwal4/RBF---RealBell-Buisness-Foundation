import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home.jsx';
import SignUp from '../pages/signup.jsx';
import LoginPage from '../pages/login.jsx';
import { ProtectedRoute, IsAdminRoute, PermissionRoute } from './Auth.jsx';
import SubscriptionGuard from '../components/SubscriptionGuard.jsx';
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
import NotificationsPage from '../pages/app/Notifications.jsx';
import BusinessBooster from '../pages/app/BusinessBooster.jsx';
import Unauthorized from '../pages/Unauthorized.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminBusinessBooster from '../pages/admin/AdminBusinessBooster.jsx';
import AdminTeams from '../pages/admin/AdminTeams.jsx';
import AdminUsers from '../pages/admin/AdminUsers.jsx';
import AdminJobs from '../pages/admin/AdminJobs.jsx';
import AdminTickets from '../pages/admin/AdminTickets.jsx';
import AdminNotifications from '../pages/admin/AdminNotifications.jsx';
import AdminMail from '../pages/admin/AdminMail.jsx';
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
import RbfAi from '../pages/app/RbfAi.jsx';
import AdminAiConfig from '../pages/admin/AdminAiConfig.jsx';
import AdminThemeCustomizer from '../pages/admin/AdminThemeCustomizer.jsx';
import AdminAuthSettings from '../pages/admin/AdminAuthSettings.jsx';
import AdminAuditLogs from '../pages/admin/AdminAuditLogs.jsx';
import AdminWalletManagement from '../pages/admin/AdminWalletManagement.jsx';
import Wallet from '../pages/app/Wallet.jsx';
import ReferralPage from '../pages/app/ReferralPage.jsx';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import LegalServices from '../pages/app/legalCompliance/LegalServices.jsx';
import LegalServiceApply from '../pages/app/legalCompliance/LegalServiceApply.jsx';
import MyLegalApplications from '../pages/app/legalCompliance/MyLegalApplications.jsx';
import LegalComplianceDocuments from '../pages/app/legalCompliance/LegalComplianceDocuments.jsx';
import AdminLegalCompliance from '../pages/admin/AdminLegalCompliance.jsx';
import LiveSessions from '../pages/app/LiveSessions.jsx';
import LiveSessionRoom from '../pages/app/liveSession/LiveSessionRoom.jsx';
import AdminFrontendCustomizer from '../pages/admin/AdminFrontendCustomizer.jsx';
import AdminApprovals from '../pages/admin/AdminApprovals.jsx';
import AdminApprovalFormBuilder from '../pages/admin/AdminApprovalFormBuilder.jsx';
import ApprovalCenter from '../pages/app/ApprovalCenter.jsx';
import PrivacyPolicy from '../pages/PrivacyPolicy.jsx';
import TermsOfService from '../pages/TermsOfService.jsx';
import CodeOfConduct from '../pages/CodeOfConduct.jsx';

// Assessment & Certification - Admin
import AdminAssessments from '../pages/admin/AdminAssessments.jsx';
import AdminTestBuilder from '../pages/admin/AdminTestBuilder.jsx';
import AdminQuestionBank from '../pages/admin/AdminQuestionBank.jsx';
import AdminCollaborators from '../pages/admin/AdminCollaborators.jsx';
import AdminTestAttempts from '../pages/admin/AdminTestAttempts.jsx';
import AdminCertificates from '../pages/admin/AdminCertificates.jsx';
import AdminCertificateTemplates from '../pages/admin/AdminCertificateTemplates.jsx';
import AdminAssessmentAnalytics from '../pages/admin/AdminAssessmentAnalytics.jsx';

// Assessment & Certification - User
import Assessments from '../pages/app/Assessments.jsx';
import AssessmentDetail from '../pages/app/AssessmentDetail.jsx';
import TestTaking from '../pages/app/TestTaking.jsx';
import TestResult from '../pages/app/TestResult.jsx';
import MyCertificates from '../pages/app/MyCertificates.jsx';
import CertificateVerification from '../pages/CertificateVerification.jsx';

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
        path: '/privacy-policy',
        element: <PrivacyPolicy />
    },
    {
        path: '/privacy',
        element: <PrivacyPolicy />
    },
    {
        path: '/terms-of-service',
        element: <TermsOfService />
    },
    {
        path: '/terms',
        element: <TermsOfService />
    },
    {
        path: '/code-of-conduct',
        element: <CodeOfConduct />
    },
    {
        path: '/approval-center',
        element: <ApprovalCenter />
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
        path: '/wallet',
        element: <ProtectedRoute><Wallet /></ProtectedRoute>
    },
    {
        path: '/app/wallet',
        element: <ProtectedRoute><Wallet /></ProtectedRoute>
    },
    {
        path: '/referrals',
        element: <ProtectedRoute><ReferralPage /></ProtectedRoute>
    },
    {
        path: '/app/referrals',
        element: <ProtectedRoute><ReferralPage /></ProtectedRoute>
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
        path: '/profile/:id',
        element: <ProtectedRoute> <ViewProfile /> </ProtectedRoute>
    },
    {
        path: '/jobs',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="jobs" moduleName="Job Opportunities"><Job /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/connect/:type',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="connect" moduleName="Connect with Others"><Connect /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/connect/:type/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="connect" moduleName="Connect with Others"><ViewProfile /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/connections',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="connections" moduleName="My Connections"><ConnectionsPage /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/community',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="community" moduleName="Community Wall"><CommunityWall /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/live_sessions',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="live_sessions" moduleName="Live Sessions & Rooms"><LiveSessions /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/live_sessions/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="live_sessions" moduleName="Live Sessions & Rooms"><LiveSessionRoom /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/live-sessions',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="live_sessions" moduleName="Live Sessions & Rooms"><LiveSessions /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/live-sessions/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="live_sessions" moduleName="Live Sessions & Rooms"><LiveSessionRoom /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path : '/meetings',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="meetings" moduleName="Scheduled Meetings"><Meetings /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/milestones',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="milestones" moduleName="Milestone Tracking"><Milestones /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/tickets',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="tickets" moduleName="Support Helpdesk"><Tickets /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/notifications',
        element: <ProtectedRoute> <NotificationsPage /> </ProtectedRoute>
    },
    {
        path: '/app/notifications',
        element: <ProtectedRoute> <NotificationsPage /> </ProtectedRoute>
    },
    {
        path: '/booster',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="booster" moduleName="Business Booster Kit"><BusinessBooster /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/booster',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="booster" moduleName="Business Booster Kit"><BusinessBooster /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/business-booster',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="booster" moduleName="Business Booster Kit"><BusinessBooster /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/ai',
        element: <ProtectedRoute><RbfAi /></ProtectedRoute>
    },
    {
        path: '/app/ai',
        element: <ProtectedRoute><RbfAi /></ProtectedRoute>
    },
    {
        path: '/unauthorized',
        element: <Unauthorized />
    },

    /* ── Admin Routes Protected by RBAC PermissionRoute ── */
    {
        path: '/admin/ai-config',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission={['ai_config.view', 'ai_config.manage']} moduleName="AI Configuration">
                    <AdminAiConfig />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="dashboard.view" moduleName="Admin Dashboard">
                    <AdminDashboard />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/approvals',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="approvals.view" moduleName="Ecosystem Approvals">
                    <AdminApprovals />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/approval-forms',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="approvals.manage_forms" moduleName="Approval Form Builder">
                    <AdminApprovalFormBuilder />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/teams',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="teams.view" moduleName="Teams & Role Management">
                    <AdminTeams />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/users',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="users.view" moduleName="Ecosystem Users">
                    <AdminUsers />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/roles',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="teams.view" moduleName="Role & Profile Schemas">
                    <AdminRoles />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/subscriptions',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="subscriptions.view" moduleName="Subscription Plans">
                    <AdminSubscriptions />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/wallets',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="users.view" moduleName="Wallet Management">
                    <AdminWalletManagement />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/theme-customizer',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="theme.manage" moduleName="Theme Customizer">
                    <AdminThemeCustomizer />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/frontend-customizer',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="frontend_customizer.view" moduleName="Frontend Customizer">
                    <AdminFrontendCustomizer />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/auth-settings',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="auth_settings.view" moduleName="Authentication Settings">
                    <AdminAuthSettings />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/audit-logs',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="audit_logs.view" moduleName="Security & Audit Logs">
                    <AdminAuditLogs />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/jobs',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="jobs.view" moduleName="Job Opportunities">
                    <AdminJobs />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/tickets',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="tickets.view" moduleName="Support Tickets">
                    <AdminTickets />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/notifications',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="notifications.view" moduleName="Notifications Hub">
                    <AdminNotifications />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/mail',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="mail.view" moduleName="Mail Dispatcher">
                    <AdminMail />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/community',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="community.view" moduleName="Community Wall">
                    <AdminCommunity />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/analytics',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="analytics.view" moduleName="Platform Analytics">
                    <AdminAnalytics />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/resources',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="resources.view" moduleName="Resource Library">
                    <AdminResources />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },

    /* ── Resource Pages ── */
    {
        path: '/resources/contracts',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="resources" moduleName="Resource Library"><ContractsPage /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/resources/glossary',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="resources" moduleName="Resource Library"><GlossaryPage /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/resources/reports',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="resources" moduleName="Resource Library"><ReportsPage /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/resources/news',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="news" moduleName="Industry News"><NewsPage /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/resources/videos',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="videos" moduleName="Knowledge Videos"><VideosPage /></SubscriptionGuard></ProtectedRoute>
    },

    /* ── Programs ── */
    {
        path: '/programs',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="programs" moduleName="Incubation Programs"><Programs /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/programs/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="programs" moduleName="Incubation Programs"><ProgramDetail /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/programs/:id/apply',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="programs" moduleName="Incubation Programs"><ProgramApply /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/admin/programs',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="programs.view" moduleName="Incubation Programs">
                    <AdminPrograms />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/programs/:id/applications',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="programs.applications_view" moduleName="Program Applications">
                    <AdminProgramApplications />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/booster',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="booster.view" moduleName="Business Booster Kit">
                    <AdminBusinessBooster />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/business-booster',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="booster.view" moduleName="Business Booster Kit">
                    <AdminBusinessBooster />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },

    /* ── Events ── */
    {
        path: '/events',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="events" moduleName="Events & Workshops"><Events /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/events/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="events" moduleName="Events & Workshops"><EventDetail /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/events/:id/apply',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="events" moduleName="Events & Workshops"><EventApply /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/admin/events',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="events.view" moduleName="Events & Workshops">
                    <AdminEvents />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/events/:id/attendees',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="events.attendees_view" moduleName="Event Attendees">
                    <AdminEventAttendees />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },

    /* ── Legal Compliances ── */
    {
        path: '/legal-compliances',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="legal_compliance" moduleName="Legal Compliance"><LegalServices /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/legal-compliances/services/:id/apply',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="legal_compliance" moduleName="Legal Compliance"><LegalServiceApply /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/legal-compliances/my-applications',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="legal_compliance" moduleName="Legal Compliance"><MyLegalApplications /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/legal-compliances/documents',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="legal_compliance" moduleName="Legal Compliance"><LegalComplianceDocuments /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/admin/legal-compliance',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="legal_compliance.view" moduleName="Legal Compliance">
                    <AdminLegalCompliance />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },

    /* ── Assessment & Certification - Admin ── */
    {
        path: '/admin/assessments',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.view" moduleName="Test & Assessments">
                    <AdminAssessments />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/create',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.create" moduleName="Test & Assessments">
                    <AdminTestBuilder />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/:id/edit',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.update" moduleName="Test & Assessments">
                    <AdminTestBuilder />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/questions',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.view" moduleName="Test & Assessments">
                    <AdminQuestionBank />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/collaborators',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.view" moduleName="Test & Assessments">
                    <AdminCollaborators />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/:id/attempts',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.view" moduleName="Test & Assessments">
                    <AdminTestAttempts />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/assessments/analytics',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="assessments.view" moduleName="Test & Assessments">
                    <AdminAssessmentAnalytics />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/certificates',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="certificates.view" moduleName="Certificate Management">
                    <AdminCertificates />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/certificates/templates',
        element: (
            <ProtectedRoute>
                <PermissionRoute permission="certificates.templates_view" moduleName="Certificate Builder">
                    <AdminCertificateTemplates />
                </PermissionRoute>
            </ProtectedRoute>
        )
    },

    /* ── Assessment & Certification - User ── */
    {
        path: '/assessments',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><Assessments /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/assessments',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><Assessments /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/assessments/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><AssessmentDetail /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/assessments/:id',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><AssessmentDetail /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/assessments/:id/take',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><TestTaking /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/assessments/:id/take',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><TestTaking /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/assessments/attempts/:id/result',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><TestResult /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/assessments/attempts/:id/result',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="assessments" moduleName="Tests & Assessments"><TestResult /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/my-certificates',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="certificates" moduleName="My Certificates"><MyCertificates /></SubscriptionGuard></ProtectedRoute>
    },
    {
        path: '/app/certificates',
        element: <ProtectedRoute><SubscriptionGuard moduleKey="certificates" moduleName="My Certificates"><MyCertificates /></SubscriptionGuard></ProtectedRoute>
    },

    /* ── Public Certificate Verification ── */
    {
        path: '/verify/certificate/:certificateId',
        element: <CertificateVerification />
    },

    {
        path: '*',
        element: <PageNotFound />
    }
]);

export default Routes;
