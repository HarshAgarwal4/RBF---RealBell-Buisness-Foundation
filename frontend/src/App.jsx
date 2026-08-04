import { useEffect } from 'react'
import Routes from './services/Routes'
import {RouterProvider} from 'react-router-dom'
import { useStore } from './zustand/store'
import { ToastContainer } from 'react-toastify'
import './toast.css'


function App() {
  const fetchUser = useStore((state) => state.fetchUser)

  useEffect(() => {
    fetchUser()
  } , [])

  return (
    <>
      <RouterProvider router={Routes} />
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
      />
    </>
  )
}

export default App
