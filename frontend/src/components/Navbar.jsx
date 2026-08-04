import { useNavigate } from 'react-router-dom'

const Navbar = () => {
    const navigate = useNavigate()
    return (
        <div className='w-full bg-yellow-500'>
            <nav className='w-full flex flex-row justify-around items-center'>
                <div className='py-2'>
                    Logo
                </div>
                <div className='flex gap-4'>
                    <button onClick={() => { navigate('/login') }}>Login</button>
                    <button onClick={() => (navigate('/signup'))}>SignUp</button>
                </div>
            </nav>
        </div>
    )
}

export default Navbar