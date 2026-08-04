import { create } from 'zustand';
import axios from '../services/axios';
import { toast } from 'react-toastify';

export const useStore = create((set,get) => ({
    user: null,
    isLoading: true,
    setIsLoading: (data) => set({isLoading : data}),
    setUser: (data) => set({user: data}),
    fetchUser: async () => {
        try {
            let r = await axios.post('/me')
            if(r.status === 200 ){
                if(r.data.status === 0) return
                if(r.data.status === 1) {
                    toast.success("Welcome again")
                    set({user: r.data.user})
                    return
                } 
            }
        }catch(err){
            console.log(err)
            toast.error("Internal server error")
        }finally{
            set({isLoading : false})
        }
    },
    sendOtp: async (email) => {
        try {
            let r = await axios.post('/sendotp' , {email})
            if(r.status === 200 ){
                if(r.data.status === 0) return
                if(r.data.status === 1) {
                    toast.success("OTP sent successfully")
                    return
                }
                if(r.data.status === 7) {
                    toast.error("Invalid fields")
                    return
                }
                if(r.data.status === 8) {
                    toast.error("Error in generating OTP")
                    return
                }
            }
        }catch(err){
            console.log(err)
            toast.error("Internal server error")
        }
    },
    logout: async () => {
        try {
            let r = await axios.post('/logout')
            if(r.status === 200 ){
                if(r.data.status === 0) return toast.error("Internal server error")
                if(r.data.status === 1) {
                    toast.success("Logged out successfully")
                    set({user: null})
                    return
                }
            }
        }catch(err){
            console.log(err)
            toast.error("Internal server error")
        }
    }
}))
