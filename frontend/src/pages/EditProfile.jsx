import React , {useState, useEffect} from 'react'
import Sidebar from '../components/SIdebar'
import { useStore } from '../zustand/store'
import StartupProfile from './Profile/Startup/profile'
import EditProfile from './Profile/Startup/Edit'

const EditProfilePage = () => {
    const { user } = useStore()
    const [role , setRole] = useState(null)
    const profile = JSON.parse(user?.profile?.profile)
    useEffect(() => {
        if(!user) return navigate('/login')
        setRole(user?.company_type)
    } , [user])

    return (
        <div>
            <Sidebar />
            {role === 'startup' && <EditProfile profile={profile} /> }
        </div>
    )
}

export default EditProfilePage

