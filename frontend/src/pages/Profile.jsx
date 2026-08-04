import React , {useState , useEffect} from 'react'
import Sidebar from '../components/Sidebar'
import { useStore } from '../zustand/store'
import StartupProfile from './Profile/Startup/profile'

const ProfilePage = () => {
    const { user } = useStore()
    const [role , setRole] = useState(null)
    useEffect(() => {
        if(!user) return navigate('/login')
        setRole(user?.company_type)
    } , [user])

    return (
        <div>
            <Sidebar />
            {role === 'startup' && <StartupProfile />  }
        </div>
    )
}

export default ProfilePage

