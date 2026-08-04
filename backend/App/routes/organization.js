import express from 'express';
import { fetchUser, login, logout, sendOTPToEmail, signUp , updateAccount ,updateProfile} from '../controllers/organization.js';
import { uploadFile } from '../../services/upload.js';
const organizationRoutes = express.Router();

organizationRoutes.post('/signup' , signUp)
organizationRoutes.post('/login' , login)
organizationRoutes.post('/sendotp' , sendOTPToEmail)
organizationRoutes.post('/me' , fetchUser)
organizationRoutes.post('/logout' , logout)
organizationRoutes.post('/update-account' , uploadFile.single('image') , updateAccount)
organizationRoutes.post('/update-profile' , uploadFile.none() , updateProfile)

export {organizationRoutes}