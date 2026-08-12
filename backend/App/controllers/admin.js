import mongoose from "mongoose";
import OrganizationModel from "../models/organization.js";
import JobModel from "../models/job.js";
import TicketModel from "../models/ticket.js";
import CommunityPostModel from "../models/community.js";
import MeetingModel from "../models/meeting.js";
import MilestoneModel from "../models/milestone.js";

/* ======================= Dashboard Stats ======================= */

async function getDashboardStats(req, res) {
    try {
        const [
            totalUsers,
            startups,
            investors,
            mentors,
            incubators,
            admins,
            totalJobs,
            activeJobs,
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            totalPosts,
            totalMeetings,
            totalMilestones,
            recentUsers,
        ] = await Promise.all([
            OrganizationModel.countDocuments(),
            OrganizationModel.countDocuments({ company_type: "startup" }),
            OrganizationModel.countDocuments({ company_type: "investor" }),
            OrganizationModel.countDocuments({ company_type: "mentor" }),
            OrganizationModel.countDocuments({ company_type: "incubator/accelerator" }),
            OrganizationModel.countDocuments({ role: { $in: ["admin", "super_admin"] } }),
            JobModel.countDocuments(),
            JobModel.countDocuments({ status: "active" }),
            TicketModel.countDocuments(),
            TicketModel.countDocuments({ status: "Open" }),
            TicketModel.countDocuments({ status: "In Progress" }),
            TicketModel.countDocuments({ status: "Resolved" }),
            CommunityPostModel.countDocuments(),
            MeetingModel.countDocuments(),
            MilestoneModel.countDocuments(),
            OrganizationModel.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .select("name company_name company_type email account role createdAt"),
        ]);

        // Signups over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const signupTrend = await OrganizationModel.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Recent tickets
        const recentTickets = await TicketModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("organization", "name company_name account");

        return res.json({
            status: 1,
            stats: {
                users: { total: totalUsers, startups, investors, mentors, incubators, admins },
                jobs: { total: totalJobs, active: activeJobs },
                tickets: { total: totalTickets, open: openTickets, in_progress: inProgressTickets, resolved: resolvedTickets },
                posts: { total: totalPosts },
                meetings: { total: totalMeetings },
                milestones: { total: totalMilestones },
            },
            signupTrend,
            recentUsers,
            recentTickets,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= User Management ======================= */

async function getAllUsers(req, res) {
    try {
        const { page = 1, limit = 20, search = "", type = "", role = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { company_name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (type) query.company_type = type;
        if (role) query.role = role;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            OrganizationModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .select("-sessions -saved_profiles -connections -profile"),
            OrganizationModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function getUserById(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        const user = await OrganizationModel.findById(id)
            .select("-sessions")
            .populate("connections.with", "name company_name email account.image");

        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        const jobCount = await JobModel.countDocuments({ organization: id });
        const ticketCount = await TicketModel.countDocuments({ organization: id });
        const postCount = await CommunityPostModel.countDocuments({ author: id });

        return res.json({ status: 1, user, meta: { jobCount, ticketCount, postCount } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        if (!["normal", "admin", "super_admin"].includes(role)) {
            return res.status(400).json({ status: 7, msg: "Invalid role. Must be normal, admin, or super_admin" });
        }

        // Only super_admin can assign super_admin role
        if (role === "super_admin" && req.user.role !== "super_admin") {
            return res.status(403).json({ status: 0, msg: "Only super admins can assign super_admin role" });
        }

        // Cannot change own role
        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ status: 7, msg: "You cannot change your own role" });
        }

        const user = await OrganizationModel.findByIdAndUpdate(
            id,
            { role },
            { new: true }
        ).select("-sessions");

        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        return res.json({ status: 1, msg: `Role updated to ${role} successfully`, user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ status: 7, msg: "Invalid user id" });
        }

        // Cannot delete yourself
        if (String(req.user._id) === String(id)) {
            return res.status(400).json({ status: 7, msg: "You cannot delete your own account" });
        }

        const user = await OrganizationModel.findById(id);
        if (!user) return res.status(404).json({ status: 9, msg: "User not found" });

        // Only super_admin can delete admin users
        if ((user.role === "admin" || user.role === "super_admin") && req.user.role !== "super_admin") {
            return res.status(403).json({ status: 0, msg: "Only super admins can delete admin users" });
        }

        // Delete user's related data
        await Promise.all([
            JobModel.deleteMany({ organization: id }),
            TicketModel.deleteMany({ organization: id }),
            CommunityPostModel.deleteMany({ author: id }),
            OrganizationModel.findByIdAndDelete(id),
        ]);

        return res.json({ status: 1, msg: "User and all associated data deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Job Management ======================= */

async function getAllJobs(req, res) {
    try {
        const { page = 1, limit = 20, search = "", status = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { industry: { $regex: search, $options: "i" } },
            ];
        }
        if (status) query.status = status;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [jobs, total] = await Promise.all([
            JobModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("organization", "name company_name email account.image"),
            JobModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            jobs,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteJob(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid job id" });

        const job = await JobModel.findByIdAndDelete(id);
        if (!job) return res.status(404).json({ status: 9, msg: "Job not found" });

        return res.json({ status: 1, msg: "Job deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Ticket Management ======================= */

async function getAllTickets(req, res) {
    try {
        const { page = 1, limit = 20, search = "", status = "", issue_type = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { ticket_number: { $regex: search, $options: "i" } },
            ];
        }
        if (status) query.status = status;
        if (issue_type) query.issue_type = issue_type;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tickets, total] = await Promise.all([
            TicketModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("organization", "name company_name email account.image"),
            TicketModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            tickets,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function updateTicketStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid ticket id" });

        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ status: 7, msg: "Invalid status" });
        }

        const ticket = await TicketModel.findByIdAndUpdate(id, { status }, { new: true })
            .populate("organization", "name company_name email account.image");

        if (!ticket) return res.status(404).json({ status: 9, msg: "Ticket not found" });

        return res.json({ status: 1, msg: "Ticket status updated", ticket });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deleteTicket(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid ticket id" });

        const ticket = await TicketModel.findByIdAndDelete(id);
        if (!ticket) return res.status(404).json({ status: 9, msg: "Ticket not found" });

        return res.json({ status: 1, msg: "Ticket deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Community Management ======================= */

async function getAllCommunityPosts(req, res) {
    try {
        const { page = 1, limit = 20, search = "", post_type = "", sortBy = "createdAt", order = "desc" } = req.query;

        const query = {};
        if (search) query.content = { $regex: search, $options: "i" };
        if (post_type) query.post_type = post_type;

        const sortOrder = order === "asc" ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [posts, total] = await Promise.all([
            CommunityPostModel.find(query)
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("author", "name company_name email account.image company_type"),
            CommunityPostModel.countDocuments(query),
        ]);

        return res.json({
            status: 1,
            posts,
            pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function deletePost(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid post id" });

        const post = await CommunityPostModel.findByIdAndDelete(id);
        if (!post) return res.status(404).json({ status: 9, msg: "Post not found" });

        return res.json({ status: 1, msg: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

async function togglePinPost(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ status: 7, msg: "Invalid post id" });

        const post = await CommunityPostModel.findById(id);
        if (!post) return res.status(404).json({ status: 9, msg: "Post not found" });

        post.is_pinned = !post.is_pinned;
        await post.save();

        return res.json({ status: 1, msg: post.is_pinned ? "Post pinned" : "Post unpinned", is_pinned: post.is_pinned });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Analytics ======================= */

async function getAnalytics(req, res) {
    try {
        const { range = "30" } = req.query;
        const days = parseInt(range);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [
            usersByType,
            usersByRole,
            signupsByDay,
            ticketsByStatus,
            ticketsByType,
            jobsByStatus,
            jobsByType,
            topActiveUsers,
        ] = await Promise.all([
            // Users by company type
            OrganizationModel.aggregate([
                { $group: { _id: "$company_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Users by role
            OrganizationModel.aggregate([
                { $group: { _id: "$role", count: { $sum: 1 } } },
            ]),
            // Signups per day in range
            OrganizationModel.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            // Tickets by status
            TicketModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            // Tickets by type
            TicketModel.aggregate([
                { $group: { _id: "$issue_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Jobs by status
            JobModel.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
            // Jobs by employment type
            JobModel.aggregate([
                { $group: { _id: "$employment_type", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            // Top users by connection count
            OrganizationModel.aggregate([
                {
                    $project: {
                        name: 1,
                        company_name: 1,
                        company_type: 1,
                        "account.image": 1,
                        connectionCount: {
                            $size: {
                                $filter: {
                                    input: "$connections",
                                    as: "c",
                                    cond: { $eq: ["$$c.status", "accepted"] },
                                },
                            },
                        },
                    },
                },
                { $sort: { connectionCount: -1 } },
                { $limit: 5 },
            ]),
        ]);

        return res.json({
            status: 1,
            analytics: {
                usersByType,
                usersByRole,
                signupsByDay,
                ticketsByStatus,
                ticketsByType,
                jobsByStatus,
                jobsByType,
                topActiveUsers,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

/* ======================= Recent Activity ======================= */

async function getRecentActivity(req, res) {
    try {
        const [recentUsers, recentTickets, recentPosts, recentJobs] = await Promise.all([
            OrganizationModel.find().sort({ createdAt: -1 }).limit(10)
                .select("name company_name company_type email account.image role createdAt"),
            TicketModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("organization", "name company_name account.image"),
            CommunityPostModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("author", "name company_name account.image"),
            JobModel.find().sort({ createdAt: -1 }).limit(10)
                .populate("organization", "name company_name account.image"),
        ]);

        const activity = [
            ...recentUsers.map((u) => ({ type: "user_joined", data: u, createdAt: u.createdAt })),
            ...recentTickets.map((t) => ({ type: "ticket_created", data: t, createdAt: t.createdAt })),
            ...recentPosts.map((p) => ({ type: "post_created", data: p, createdAt: p.createdAt })),
            ...recentJobs.map((j) => ({ type: "job_posted", data: j, createdAt: j.createdAt })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);

        return res.json({ status: 1, activity });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, msg: "Internal server error" });
    }
}

export {
    getDashboardStats,
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    getAllJobs,
    deleteJob,
    getAllTickets,
    updateTicketStatus,
    deleteTicket,
    getAllCommunityPosts,
    deletePost,
    togglePinPost,
    getAnalytics,
    getRecentActivity,
};
