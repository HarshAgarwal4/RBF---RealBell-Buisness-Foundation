import { create } from 'zustand';
import axios from '../services/axios';
import { toast } from 'react-toastify';

export const useStore = create((set, get) => ({
    user: null,
    isLoading: true,
    isInitialized: false,
    loginMethod: "both", // "otp" | "password" | "both"
    roles: [],

    setIsLoading: (data) => set({ isLoading: data }),
    setUser: (data) => set({ user: data }),
    setLoginMethod: (data) => set({ loginMethod: data }),
    setRoles: (data) => set({ roles: data }),

    // Runs once on app startup:
    // If user is not logged in -> fetches BOTH organization types and login method
    // If user is logged in -> fetches organization types for dashboard sidebar
    initializeApp: async () => {
        try {

            // Temporary 5-second delay for testing loading screen
            // await new Promise((resolve) => setTimeout(resolve, 5000));

            // 1. Check user session
            let user = null;
            try {
                const meRes = await axios.post('/me');
                if (meRes.status === 200 && meRes.data?.status === 1) {
                    user = meRes.data.user;
                }
            } catch (meErr) {
                console.log("[RBF INIT] No active user session");
            }

            let loginMethod = "both";
            let roles = [];

            if (!user) {
                // User is NOT logged in: Fetch BOTH organization types and login method in parallel
                const [authRes, rolesRes] = await Promise.allSettled([
                    axios.get('/auth-settings'),
                    axios.get('/roles'),
                ]);

                if (
                    authRes.status === 'fulfilled' &&
                    authRes.value.data?.status === 1 &&
                    authRes.value.data?.loginMethod
                ) {
                    loginMethod = authRes.value.data.loginMethod;
                }

                if (
                    rolesRes.status === 'fulfilled' &&
                    rolesRes.value.data?.status === 1 &&
                    Array.isArray(rolesRes.value.data?.roles)
                ) {
                    roles = rolesRes.value.data.roles;
                }

                console.log("[RBF INIT] ✅ Fetched login method setting:", loginMethod);
                console.log("[RBF INIT] ✅ Fetched organization types / roles:", roles);
            } else {
                // User IS logged in: Fetch organization types for the dashboard sidebar
                try {
                    const rolesRes = await axios.get('/roles');
                    if (rolesRes.data?.status === 1 && Array.isArray(rolesRes.data?.roles)) {
                        roles = rolesRes.data.roles;
                    }
                } catch (rolesErr) {
                    console.error("Error fetching roles for sidebar:", rolesErr);
                }
            }

            set({
                user,
                loginMethod,
                roles,
                isInitialized: true,
                isLoading: false,
            });
        } catch (err) {
            console.error("App initialization error:", err);
            set({ isInitialized: true, isLoading: false });
        }
    },

    fetchUser: async ({ silent = true } = {}) => {
        try {
            let r = await axios.post('/me');
            if (r.status === 200) {
                if (r.data.status === 0) {
                    set({ user: null });
                    return;
                }
                if (r.data.status === 1) {
                    if (!silent) {
                        toast.success("Welcome again");
                    }
                    set({ user: r.data.user });
                    return;
                }
            }
        } catch (err) {
            console.error(err);
        }
    },

    fetchAuthSettings: async () => {
        try {
            const res = await axios.get('/auth-settings');
            if (res.data?.status === 1 && res.data?.loginMethod) {
                console.log("[RBF STORE] Updated login method:", res.data.loginMethod);
                set({ loginMethod: res.data.loginMethod });
            }
        } catch (err) {
            console.error("Error updating auth settings:", err);
        }
    },

    fetchRoles: async () => {
        try {
            const res = await axios.get('/roles');
            if (res.data?.status === 1 && Array.isArray(res.data?.roles)) {
                console.log("[RBF STORE] Updated organization types / roles:", res.data.roles);
                set({ roles: res.data.roles });
            }
        } catch (err) {
            console.error("Error updating roles:", err);
        }
    },

    sendSignupOtp: async (email) => {
        try {
            let r = await axios.post('/signup/send-otp', { email });
            if (r.status === 200) {
                const { status, msg } = r.data;
                if (status === 1) {
                    toast.success(msg || "Verification OTP sent to your email");
                    return { success: true, data: r.data };
                }
                if (status === 3) {
                    toast.error(msg || "Email already registered");
                    return { success: false, data: r.data };
                }
                toast.error(msg || "Failed to send OTP");
                return { success: false, data: r.data };
            }
            toast.error("Failed to send OTP");
            return { success: false };
        } catch (err) {
            console.error("Signup OTP error:", err);
            toast.error("Internal server error. Please try again.");
            return { success: false };
        }
    },

    sendOtp: async (email) => {
        try {
            let r = await axios.post('/sendotp', { email });
            if (r.status === 200) {
                const { status, msg } = r.data;
                if (status === 1) {
                    toast.success(msg || "OTP sent successfully");
                    return { success: true, data: r.data };
                }
                toast.error(msg || "Failed to send OTP");
                return { success: false, data: r.data };
            }
            toast.error("Failed to send OTP");
            return { success: false };
        } catch (err) {
            console.error(err);
            toast.error("Internal server error");
            return { success: false };
        }
    },

    switchOrganizationType: async (company_type) => {
        try {
            const res = await axios.post('/switch-organization-type', { company_type });
            if (res.data?.status === 1) {
                toast.success(res.data.msg || `Switched to ${company_type}`);
                set({ user: res.data.user });
                return { success: true, user: res.data.user };
            } else {
                toast.error(res.data?.msg || "Failed to switch organization type");
                return { success: false };
            }
        } catch (err) {
            console.error("switchOrganizationType error:", err);
            toast.error("Failed to switch organization profile");
            return { success: false };
        }
    },

    logout: async () => {
        try {
            let r = await axios.post('/logout');
            if (r.status === 200) {
                if (r.data.status === 0) return toast.error("Internal server error");
                if (r.data.status === 1) {
                    toast.success("Logged out successfully");
                    set({ user: null });
                    return;
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Internal server error");
        }
    },
}));
