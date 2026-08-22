import express from 'express';
import {
  fetchUser,
  login,
  logout,
  sendSignupOTP,
  sendOTPToEmail,
  forgotPasswordSendOTP,
  resetPasswordWithOTP,
  signUp,
  updateAccount,
  updateProfile,
  switchOrganizationType,
} from '../controllers/organization.js';
import { getPublicAuthSettings } from '../controllers/authSettingController.js';
import { uploadFile } from '../../services/upload.js';
const organizationRoutes = express.Router();

organizationRoutes.get('/auth-settings', getPublicAuthSettings);
organizationRoutes.post('/signup', signUp);
organizationRoutes.post('/signup/send-otp', sendSignupOTP);
organizationRoutes.post('/login', login);
organizationRoutes.post('/sendotp', sendOTPToEmail);
organizationRoutes.post('/forgot-password/send-otp', forgotPasswordSendOTP);
organizationRoutes.post('/forgot-password/reset', resetPasswordWithOTP);
organizationRoutes.post('/me', fetchUser);
organizationRoutes.post('/logout', logout);
organizationRoutes.post('/update-account', uploadFile.single('image'), updateAccount);
organizationRoutes.post('/update-profile', uploadFile.any(), updateProfile);
organizationRoutes.post('/switch-organization-type', switchOrganizationType);

export { organizationRoutes };