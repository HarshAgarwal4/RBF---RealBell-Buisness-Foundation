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
import { authLimiter, uploadLimiter } from '../../middlewares/rateLimiter.js';
const organizationRoutes = express.Router();

organizationRoutes.get('/auth-settings', getPublicAuthSettings);
organizationRoutes.post('/signup', authLimiter, signUp);
organizationRoutes.post('/signup/send-otp', authLimiter, sendSignupOTP);
organizationRoutes.post('/login', authLimiter, login);
organizationRoutes.post('/sendotp', authLimiter, sendOTPToEmail);
organizationRoutes.post('/forgot-password/send-otp', authLimiter, forgotPasswordSendOTP);
organizationRoutes.post('/forgot-password/reset', authLimiter, resetPasswordWithOTP);
organizationRoutes.post('/me', fetchUser);
organizationRoutes.post('/logout', logout);
organizationRoutes.post('/update-account', uploadLimiter, uploadFile.single('image'), updateAccount);
organizationRoutes.post('/update-profile', uploadLimiter, uploadFile.any(), updateProfile);
organizationRoutes.post('/switch-organization-type', switchOrganizationType);

export { organizationRoutes };