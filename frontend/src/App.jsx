import { useEffect } from 'react'
import Routes from './services/Routes'
import { RouterProvider } from 'react-router-dom'
import { useStore } from './zustand/store'
import { ToastContainer } from 'react-toastify'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import { ThemeProvider } from './context/ThemeProvider'
import { AdminThemeProvider } from './pages/admin/AdminThemeContext'
import FullScreenLoader from './pages/Loading'
import './toast.css'

function App() {
  const initializeApp = useStore((state) => state.initializeApp)
  const isLoading = useStore((state) => state.isLoading)

  useEffect(() => {
    initializeApp()
  }, [])

  return (
    <ThemeProvider>
      <AdminThemeProvider>
        {isLoading ? (
          <FullScreenLoader message="Initializing RealBell Ecosystem..." />
        ) : (
          <RouterProvider router={Routes} />
        )}
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
