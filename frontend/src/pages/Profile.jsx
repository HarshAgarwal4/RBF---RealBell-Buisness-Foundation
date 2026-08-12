import React, { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useStore } from '../zustand/store'
import StartupProfile from './Profile/Startup/profile'
import MentorProfile from './Profile/Mentor/profile'
import IncubatorProfile from './Profile/Incubator/profile'
import InvestorProfile from './Profile/Investor/profile'

const ProfilePage = () => {
    const { user } = useStore()
    const [role, setRole] = useState(null)

    useEffect(() => {
        if (!user) return
        setRole(user?.company_type)
        console.log(user?.company_type)
    }, [user])

    return (
        <div>
            <Sidebar />
            {role === 'startup' && <StartupProfile />}
            {role === 'mentor' && <MentorProfile />}
            {role === 'incubator/accelerator' && <IncubatorProfile />}
            {role === 'investor' && <InvestorProfile />}
        </div>
    )
}

export default ProfilePage
