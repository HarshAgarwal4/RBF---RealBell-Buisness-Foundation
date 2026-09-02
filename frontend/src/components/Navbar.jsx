import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <div className="w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto flex flex-row justify-between items-center px-4 py-3">
                <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                    REAL<span className="text-blue-600 dark:text-blue-400">BELL</span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { navigate('/login'); }}
                        className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => (navigate('/signup'))}
                        className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer"
                    >
                        SignUp
                    </button>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;