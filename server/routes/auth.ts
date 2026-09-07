import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import { authenticate, signToken, AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password, role, state, district, businessName, designation } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name, email, and password are required.' },
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'USER_ALREADY_EXISTS', message: 'A user with this email address already exists.' },
      });
      return;
    }

    // Default to OWNER unless registered by an ADMIN
    let assignedRole = UserRole.OWNER;
    if (role && Object.values(UserRole).includes(role)) {
      assignedRole = role as UserRole;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      role: assignedRole,
      state: state || 'Telangana',
      district: district || 'Hyderabad',
      businessName: businessName ? businessName.trim() : undefined,
      designation: designation ? designation.trim() : undefined,
      isActive: true,
    });

    const token = signToken(newUser);

    await logAudit({
      action: 'USER_REGISTERED',
      actor: newUser,
      entityType: 'USER',
      entityId: newUser._id.toString(),
      detail: `New user registered: ${newUser.name} (${newUser.email}) with role ${newUser.role}`,
    });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          state: newUser.state,
          district: newUser.district,
          businessName: newUser.businessName,
          designation: newUser.designation,
        },
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An error occurred while creating your account.' },
    });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' },
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_SUSPENDED', message: 'This account has been deactivated.' },
      });
      return;
    }

    const token = signToken(user);

    await logAudit({
      action: 'USER_LOGGED_IN',
      actor: user,
      entityType: 'USER',
      entityId: user._id.toString(),
      detail: `User ${user.email} logged in.`,
    });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          state: user.state,
          district: user.district,
          businessName: user.businessName,
          designation: user.designation,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'An error occurred during authentication.' },
    });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not logged in.' } });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        state: req.user.state,
        district: req.user.district,
        businessName: req.user.businessName,
        designation: req.user.designation,
      },
    },
  });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (req.user) {
    await logAudit({
      action: 'USER_LOGGED_OUT',
      actor: req.user,
      entityType: 'USER',
      entityId: req.user._id.toString(),
      detail: `User ${req.user.email} logged out.`,
    });
  }

  res.json({
    success: true,
    data: { message: 'Logged out successfully.' },
  });
});
