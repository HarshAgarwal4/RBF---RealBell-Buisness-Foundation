import { useEffect } from 'react'
import Routes from './services/Routes'
import { RouterProvider } from 'react-router-dom'
import { useStore } from './zustand/store'
import { ToastContainer } from 'react-toastify'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { ThemeProvider } from './context/ThemeProvider'
import { AdminThemeProvider } from './pages/admin/AdminThemeContext'
import './toast.css'

function App() {
  const fetchUser = useStore((state) => state.fetchUser)

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <ThemeProvider>
      <AdminThemeProvider>
        <RouterProvider router={Routes} />
        <PWAInstallPrompt />
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
        />
      </AdminThemeProvider>
    </ThemeProvider>
  )
}

export default App
