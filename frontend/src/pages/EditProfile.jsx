import React, { useState, useEffect } from 'react'
import Sidebar from "../components/Sidebar";
import { useStore } from '../zustand/store'
import StartupEditProfile from './Profile/Startup/Edit'
import MentorEditProfile from './Profile/Mentor/Edit'
import IncubatorEditProfile from './Profile/Incubator/Edit'
import InvestorEditProfile from './Profile/Investor/Edit'

const EditProfilePage = () => {
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

    return (
        <div>
            <Sidebar />
            {role === 'startup' && <StartupEditProfile profile={profile} />}
            {role === 'mentor' && <MentorEditProfile profile={profile} />}
            {role === 'incubator/accelerator' && <IncubatorEditProfile profile={profile} />}
            {role === 'investor' && <InvestorEditProfile profile={profile} />}
        </div>
    )
}

export default EditProfilePage
