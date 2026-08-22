import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useStore } from '../zustand/store'
import StartupProfile from './Profile/Startup/profile'
import MentorProfile from './Profile/Mentor/profile'
import IncubatorProfile from './Profile/Incubator/profile'
import InvestorProfile from './Profile/Investor/profile'
import DynamicProfileView from './Profile/DynamicProfileView'

const BUILTIN_ROLES = ['startup', 'mentor', 'incubator', 'accelerator', 'incubator/accelerator', 'investor'];

const ProfilePage = () => {
    const { user } = useStore()
    const [role, setRole] = useState(null)
    const [profile, setProfile] = useState({})

    useEffect(() => {
        if (!user) return
        setRole(user?.company_type)
        try {
            const raw = user?.profile?.profile
            setProfile(raw ? JSON.parse(raw) : user?.profile || {})
        } catch {
            setProfile(user?.profile || {})
        }
    }, [user])

    const isBuiltIn = BUILTIN_ROLES.includes(role);

    return (
        <div>
            <Sidebar />
            {role === 'startup' && <StartupProfile />}
            {role === 'mentor' && <MentorProfile />}
            {(role === 'incubator' || role === 'accelerator' || role === 'incubator/accelerator') && <IncubatorProfile />}
            {role === 'investor' && <InvestorProfile />}

            {/* Dynamic Custom Role Profile View */}
            {role && !isBuiltIn && (
                <DynamicProfileView profile={profile} roleKey={role} isOwn={true} />
            )}
        </div>
    )
}

export default ProfilePage
