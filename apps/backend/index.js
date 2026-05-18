// server.js - COMPLETE VERSION WITH TRACKER DONE FUNCTIONALITY
import dotenv from 'dotenv';
import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createCmsRouter, createPublicCmsRouter } from './cms_routes.js'; // ← CMS
import { createPagesRouter, createPublicPagesRouter } from './pages_routes.js'; // ← Page Builder

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3006;

// CORS - allow your frontend (Vite at 5173)
app.use(cors({
  origin:  process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// uploads dir
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
// Serve uploaded files inline — supports subfolders (e.g. pas-reports/file.pdf)
// Serve uploaded files at any subfolder depth using express.static.
// This works with all Express versions and bypasses path-to-regexp entirely.
// Files are served inline; Content-Disposition is set via setHeaders.
app.use('/uploads', (req, res, next) => {
  // Path traversal guard: decoded URL must not escape UPLOADS_DIR
  const decoded = decodeURIComponent(req.path);
  if (decoded.includes('..')) return res.status(403).json({ error: 'Forbidden.' });
  next();
}, express.static(UPLOADS_DIR, {
  setHeaders: (res, filePath) => {
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(filePath)}"`);
  }
}));
// 404 fallback for missing upload files
app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'File not found.' });
});

// DB pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 50,
  connectTimeout: 60000,      // Add this
  enableKeepAlive: true,
  queueLimit: 0
});

pool.getConnection()
  .then(conn => { console.log('✅ DB connected'); conn.release(); })
  .catch(err => { console.error('❌ DB connect fail:', err.message); process.exit(1); });

// ==========================================
// AUDIT LOGGING HELPER FUNCTION
// ==========================================
async function logAuditEntry({
    userId = null,
    actionType,
    description,
    ipAddress = null,
    userAgent = null,
    submissionId = null,
    submissionType = null,
    metadata = null
}) {
    try {
        let userName = null;
        let userType = null;

        if (userId) {
            const [users] = await pool.query(
                'SELECT full_name, user_type FROM users WHERE id = ?',
                [userId]
            );
            if (users.length > 0) {
                userName = users[0].full_name;
                userType = users[0].user_type;
            }
        }

        await pool.query(
            `INSERT INTO audit_logs 
            (user_id, user_name, user_type, action_type, description, 
             ip_address, user_agent, submission_id, submission_type, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, userName, userType, actionType, description, 
             ipAddress, userAgent, submissionId, submissionType, 
             metadata ? JSON.stringify(metadata) : null]
        );

        console.log(`📝 Audit: ${actionType} - ${description}`);
    } catch (error) {
        console.error('❌ Audit log error:', error);
    }
}
// ...existing code...

// ================================
// FILE UPLOAD CONFIGURATION
// ================================
const uploadDir = path.join(__dirname, 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Upload directory created');
}

const profilePictureStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `profile-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

const profileUpload = multer({
    storage: profilePictureStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
    next();
};

// ================================
// MIDDLEWARE CONFIGURATION
// ================================
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:200,
    message: 'Too many requests from this IP, please try again later.'
});
// Apply rate limiting to all requests
app.use('/api/', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());
app.use('/uploads', express.static(uploadDir));
// ================================
// AUTH MIDDLEWARE
// ================================
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret_change_this');

        req.userId = decoded.userId;
        req.userType = decoded.userType;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
// Middleware to check if user is admin
const isAdminMiddleware = (req, res, next) => {
    if (req.userType !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};
// Increase server timeout to prevent premature shutdowns
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000); // 10 minutes
  next();
});
// ================================
// HELPER FUNCTIONS
// ================================
const generateToken = (userId, userType) => {
    return jwt.sign(
        { userId, userType },
        process.env.JWT_SECRET || 'default_secret_change_this',
        { expiresIn: '7d' }
    );
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;
    return passwordRegex.test(password);
};

// Valid delivery units — must match SignUp.jsx DELIVERY_UNITS and the DB enum
const VALID_DELIVERY_UNITS = [
    'CCMS', 'COTT', 'CANR', 'CAS', 'COED',
    'COENG', 'CBPA', 'CFAST', 'ETIENZA',
    'CEID', 'GS', 'GASS'
];
// ================================
// API ROUTES
// ================================
// Health Check
app.get('/api/health', async (req, res) => {
    try {
        // Test database connection
        await pool.query('SELECT 1');
        
        res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            version: '2.0.0'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server running but database connection failed',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'disconnected',
            error: error.message
        });
    }
});
// REGISTER WITH PROFILE PICTURE UPLOAD
app.post('/api/auth/register', profileUpload.single('profilePicture'), handleMulterError, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        if (req.file) {
            req.body.profilePicture = req.file.filename;
        }

        const {
            email,
            password,
            userType,
            fullName,
            contact,          // ✅ ADDED
            address,
            age,
            birthdate,
            profilePicture,
            deliveryUnit,
            adminLevel
        } = req.body;

        if (!email || !password || !userType || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, user type, and full name are required'
            });
        }

        const validUserTypes = ['INVENTOR', 'CONSULTANT', 'ADMIN'];
        if (!validUserTypes.includes(userType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user type'
            });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and at least one special character (!@#$%^&* etc.)'
            });
        }

        // Check if email already exists
        const [existingUsers] = await connection.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // ✅ UPDATED INSERT WITH CONTACT FIELD
        const [userResult] = await connection.query(
            `INSERT INTO users (
                email, password_hash, user_type, profile_picture,
                full_name, contact, address, age, birthdate, is_verified, approval_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'pending')`,
            [email, passwordHash, userType, profilePicture || null, 
             fullName, contact || null, address || null, age || null, birthdate || null]
        );

        const userId = userResult.insertId;

        if (userType === 'INVENTOR') {
            if (!deliveryUnit) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Delivery unit is required for inventors'
                });
            }
            const trimmedDeliveryUnit = deliveryUnit.trim();
            if (!VALID_DELIVERY_UNITS.includes(trimmedDeliveryUnit)) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Invalid delivery unit. Must be one of: ${VALID_DELIVERY_UNITS.join(', ')}`
                });
            }
            await connection.query('INSERT INTO inventors (user_id, delivery_unit) VALUES (?, ?)', [userId, trimmedDeliveryUnit]);
        } else if (userType == 'CONSULTANT') {
            await connection.query('INSERT INTO consultants (user_id) VALUES (?)', [userId]);
        } else if (userType == 'ADMIN') {
            await connection.query('INSERT INTO admins (user_id, admin_level) VALUES (?, ?)', [userId, adminLevel || 'ADMIN']);
        }

        await connection.commit();

        // Notify admin of new user registration
        await createAdminNotification({
            type: 'new_user',
            title: 'New User Registration',
            message: `${fullName} registered as ${userType} and is awaiting approval.`,
            targetUserId: userId,
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now login.',
            data: { userId, email, userType, fullName }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// LOGIN (REMOVED EMAIL VERIFICATION CHECK)

// LOGIN WITH AUDIT LOGGING
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const [users] = await pool.query(
            `SELECT u.*, i.delivery_unit, c.ip_category, a.admin_level
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id
             LEFT JOIN consultants c ON u.id = c.user_id
             LEFT JOIN admins a ON u.id = a.user_id
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            // Log failed login attempt
            await logAuditEntry({
                actionType: 'Login',
                description: `Failed login attempt for email: ${email}`,
                ipAddress,
                userAgent,
                metadata: { reason: 'User not found', email }
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated'
            });
        }

        // Check approval status
        if (user.approval_status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for approval before logging in.'
            });
        }
        
        if (user.approval_status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: `Your account has been rejected. Reason: ${user.rejection_reason || 'No reason provided'}`
            });
        }

        if (user.approval_status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Account status unknown. Please contact support.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            // Log failed password attempt
            await logAuditEntry({
                userId: user.id,
                actionType: 'Login',
                description: `Failed login attempt: Invalid password`,
                ipAddress,
                userAgent,
                metadata: { reason: 'Invalid password' }
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const token = generateToken(user.id, user.user_type);
        const sessionToken = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await pool.query(
            `INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)`,
            [user.id, sessionToken, expiresAt, req.ip, req.get('user-agent')]
        );

        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // ✅ LOG SUCCESSFUL LOGIN TO AUDIT_LOGS
        await logAuditEntry({
            userId: user.id,
            actionType: 'Login',
            description: `${user.full_name} logged in successfully`,
            ipAddress,
            userAgent,
            metadata: {
                userType: user.user_type,
                loginTime: new Date().toISOString()
            }
        });

        // ✅ ALSO LOG TO login_logs FOR BACKWARD COMPATIBILITY
        await pool.query(
            `INSERT INTO login_logs (user_id, ip_address, user_agent, login_status)
             VALUES (?, ?, ?, 'SUCCESS')`,
            [user.id, ipAddress, userAgent]
        );

        const responseData = {
            userId: user.id,
            email: user.email,
            fullName: user.full_name,
            userType: user.user_type,
            profilePicture: user.profile_picture,
            address: user.address,
            age: user.age,
            birthdate: user.birthdate,
            approval_status: user.approval_status,
            rejection_reason: user.rejection_reason,
            token,
            sessionToken
        };

        if (user.user_type === 'INVENTOR') {
            responseData.deliveryUnit = user.delivery_unit;
        } else if (user.user_type === 'CONSULTANT') {
            responseData.ipCategory = user.ip_category;
        } else if (user.user_type === 'ADMIN') {
            responseData.adminLevel = user.admin_level;
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: responseData
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// GET PROFILE
app.get('/api/auth/profile', authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.*, 
                    i.delivery_unit, i.total_submissions, i.approved_submissions, i.pending_submissions,
                    c.ip_category, c.total_reviews, c.approved_reviews, c.rejected_reviews,
                    a.admin_level, a.department
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id
             LEFT JOIN consultants c ON u.id = c.user_id
             LEFT JOIN admins a ON u.id = a.user_id
             WHERE u.id = ?`,
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];
        delete user.password_hash;

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile',
            error: error.message
        });
    }
});

// LOGOUT
app.post('/api/auth/logout', async (req, res) => {
    try {
        const { sessionToken } = req.body;
        if (sessionToken) {
            await pool.query('UPDATE sessions SET is_active = FALSE WHERE session_token = ?', [sessionToken]);
        }
        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
});


// ============================================
// SHARED HELPER FUNCTIONS
// ============================================

// Format Time Ago - SINGLE DECLARATION (used by both notification systems)
function formatTimeAgo(minutes) {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min. ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''}. ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    
    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
}

// ============================================
// ADMIN NOTIFICATION SYSTEM
// Notifies admins about NEW submissions
// ============================================

async function createSubmissionNotification(submissionData, type, prefix) {
    const iconMap = {
        'Copyright': { icon: 'bi bi-file-earmark-text', color: 'text-info' },
        'Trademark': { icon: 'bi bi-award', color: 'text-danger' },
        'Industrial Design': { icon: 'bi bi-brush', color: 'text-success' },
        'Utility Model': { icon: 'bi bi-lightbulb', color: 'text-warning' }
    };
    
    const config = iconMap[type] || { icon: 'bi bi-bell-fill', color: 'text-primary' };
    
    try {
        await pool.query(
            `INSERT INTO notifications 
            (type, title, message, submission_id, submission_type, icon, icon_color) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                'new_submission',
                `New ${type} Submission`,
                `New ${type}: "${submissionData.title || 'Untitled'}" (ID: ${submissionData.id})`,
                submissionData.id,
                type,
                config.icon,
                config.color
            ]
        );
        console.log(`✅ Notification created for ${type} submission ID: ${submissionData.id}`);
    } catch (error) {
        console.error('❌ Error creating notification:', error);
    }
}

// ── Helper: create an admin-specific notification ────────────
async function createAdminNotification({
    type, title, message,
    submissionId = null, submissionType = null, submissionPrefix = null,
    targetUserId = null, consultantName = null
}) {
    const iconMap = {
        new_submission: { icon: 'bi bi-file-earmark-plus-fill',     color: 'text-primary'   },
        new_user:       { icon: 'bi bi-person-fill-add',             color: 'text-success'   },
        role_change:    { icon: 'bi bi-shield-fill-exclamation',     color: 'text-warning'   },
        pas_report:     { icon: 'bi bi-file-earmark-check-fill',     color: 'text-info'      },
        assignment:     { icon: 'bi bi-person-lines-fill',           color: 'text-secondary' },
        communication:  { icon: 'bi bi-envelope-fill',               color: 'text-danger'    },
    };
    const { icon, color } = iconMap[type] || { icon: 'bi bi-bell-fill', color: 'text-primary' };
    try {
        await pool.query(
            `INSERT INTO admin_notifications
             (type, title, message, submission_id, submission_type, submission_prefix,
              target_user_id, consultant_name, icon, icon_color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [type, title, message, submissionId, submissionType, submissionPrefix,
             targetUserId, consultantName, icon, color]
        );
        console.log(`📢 Admin notification [${type}]: ${title}`);
    } catch (error) {
        console.error('❌ Error creating admin notification:', error);
    }
}

// ── Helper: create an inventor-specific notification ─────────
async function createInventorNotification({
    targetUserId, type, title, message,
    submissionId = null, submissionType = null, submissionPrefix = null,
    consultantName = null
}) {
    const iconMap = {
        submission_received:   { icon: 'bi bi-check-circle-fill',        color: 'text-success' },
        consultant_assigned:   { icon: 'bi bi-person-check-fill',         color: 'text-primary' },
        resubmission_required: { icon: 'bi bi-exclamation-triangle-fill', color: 'text-warning' },
        status_update:         { icon: 'bi bi-arrow-repeat',              color: 'text-info'    },
        approved:              { icon: 'bi bi-patch-check-fill',          color: 'text-success' },
        rejected:              { icon: 'bi bi-x-circle-fill',             color: 'text-danger'  },
    };
    const { icon, color } = iconMap[type] || { icon: 'bi bi-bell-fill', color: 'text-primary' };
    try {
        await pool.query(
            `INSERT INTO inventor_notifications
             (target_user_id, type, title, message,
              submission_id, submission_type, submission_prefix,
              consultant_name, icon, icon_color)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [targetUserId, type, title, message,
             submissionId, submissionType, submissionPrefix,
             consultantName, icon, color]
        );
        console.log(`📬 Inventor notification [${type}] → user ${targetUserId}: ${title}`);
    } catch (error) {
        console.error('❌ Error creating inventor notification:', error);
    }
}

// ============================================
// ADMIN NOTIFICATION API ENDPOINTS
// ============================================

// 1. Get all notifications (recent first)
app.get('/api/notifications', async (req, res) => {
    try {
        const [notifications] = await pool.query(`
            SELECT 
                id,
                type,
                title,
                message,
                submission_id,
                submission_type,
                icon,
                icon_color,
                is_read,
                created_at,
                TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
            FROM notifications
            ORDER BY created_at DESC
            LIMIT 50
        `);

        const formattedNotifications = notifications.map(notif => ({
            ...notif,
            time_ago: formatTimeAgo(notif.minutes_ago)
        }));

        res.json(formattedNotifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// 2. Get unread notification count
app.get('/api/notifications/unread-count', async (req, res) => {
    try {
        const [result] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE is_read = FALSE
        `);
        
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Error counting notifications:', error);
        res.status(500).json({ error: 'Failed to count notifications' });
    }
});

// 3. Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ?',
            [id]
        );
        
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
});

// 4. Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
        
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
});

// 5. Cleanup old notifications (MUST be before :id route)
app.delete('/api/notifications/cleanup', async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)');
        res.json({ success: true, message: 'Old notifications cleaned up' });
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
        res.status(500).json({ error: 'Failed to cleanup notifications' });
    }
});

// 6. Clear all notifications (MUST be before :id route)
app.delete('/api/notifications/clear-all', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM notifications');
        
        console.log(`✅ Cleared ${result.affectedRows} notifications`);
        
        res.json({ 
            success: true, 
            message: 'All notifications cleared successfully',
            cleared: result.affectedRows
        });
    } catch (error) {
        console.error('❌ Error clearing notifications:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});

// 7. Delete single notification (MUST come LAST — :id is a wildcard)
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Guard: id must be a number. Rejects "clear-all", "cleanup", etc.
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        
        await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// 8. Create manual notification (for testing or custom alerts)
app.post('/api/notifications', async (req, res) => {
    try {
        const { type, title, message, submission_id, submission_type, icon, icon_color } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO notifications 
            (type, title, message, submission_id, submission_type, icon, icon_color) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [type, title, message, submission_id, submission_type, icon, icon_color]
        );
        
        res.json({ 
            success: true, 
            message: 'Notification created',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

// 9. Get notifications for specific submission type
app.get('/api/notifications/submission/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        
        const [notifications] = await pool.query(
            `SELECT * FROM notifications 
             WHERE submission_type = ? AND submission_id = ?
             ORDER BY created_at DESC`,
            [type, id]
        );
        
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching submission notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// ============================================
// ADMIN NOTIFICATION API ENDPOINTS
// /api/admin/notifications/*
// Covers: new submissions, new users, role/permission changes,
//         PAS reports, consultant assignments, communication letters
// ============================================

// GET /api/admin/notifications
app.get('/api/admin/notifications', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id, type, title, message,
                submission_id, submission_type, submission_prefix,
                target_user_id, consultant_name,
                icon, icon_color, is_read, created_at,
                TIMESTAMPDIFF(MINUTE, created_at, NOW()) AS minutes_ago
            FROM admin_notifications
            ORDER BY created_at DESC
            LIMIT 50
        `);
        const formatted = rows.map(n => ({ ...n, time_ago: formatTimeAgo(n.minutes_ago) }));
        res.json(formatted);
    } catch (error) {
        console.error('❌ Error fetching admin notifications:', error);
        res.status(500).json({ error: 'Failed to fetch admin notifications' });
    }
});

// GET /api/admin/notifications/unread-count
app.get('/api/admin/notifications/unread-count', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [[{ count }]] = await pool.query(
            'SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = FALSE'
        );
        res.json({ count });
    } catch (error) {
        console.error('❌ Error counting admin notifications:', error);
        res.status(500).json({ error: 'Failed to count admin notifications' });
    }
});

// PUT /api/admin/notifications/read-all  (must be before /:id)
app.put('/api/admin/notifications/read-all', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE is_read = FALSE');
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error marking all admin notifications as read:', error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// PUT /api/admin/notifications/:id/read
app.put('/api/admin/notifications/:id/read', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE admin_notifications SET is_read = TRUE WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error marking admin notification as read:', error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE /api/admin/notifications/clear-all  (must be before /:id)
app.delete('/api/admin/notifications/clear-all', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM admin_notifications');
        res.json({ success: true, cleared: result.affectedRows });
    } catch (error) {
        console.error('❌ Error clearing admin notifications:', error);
        res.status(500).json({ error: 'Failed to clear admin notifications' });
    }
});

// DELETE /api/admin/notifications/:id
app.delete('/api/admin/notifications/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });
        await pool.query('DELETE FROM admin_notifications WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting admin notification:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// ============================================
// INVENTOR NOTIFICATION API ENDPOINTS
// /api/inventor/notifications/*
// Each inventor only sees notifications for their own user_id
// ============================================

// GET /api/inventor/notifications
app.get('/api/inventor/notifications', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        const [rows] = await pool.query(`
            SELECT
                id, type, title, message,
                submission_id, submission_type, submission_prefix,
                consultant_name,
                icon, icon_color, is_read, created_at,
                TIMESTAMPDIFF(MINUTE, created_at, NOW()) AS minutes_ago
            FROM inventor_notifications
            WHERE target_user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [req.userId]);
        const formatted = rows.map(n => ({ ...n, time_ago: formatTimeAgo(n.minutes_ago) }));
        res.json(formatted);
    } catch (error) {
        console.error('❌ Error fetching inventor notifications:', error);
        res.status(500).json({ error: 'Failed to fetch inventor notifications' });
    }
});

// GET /api/inventor/notifications/unread-count
app.get('/api/inventor/notifications/unread-count', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        const [[{ count }]] = await pool.query(
            'SELECT COUNT(*) AS count FROM inventor_notifications WHERE target_user_id = ? AND is_read = FALSE',
            [req.userId]
        );
        res.json({ count });
    } catch (error) {
        console.error('❌ Error counting inventor notifications:', error);
        res.status(500).json({ error: 'Failed to count' });
    }
});

// PUT /api/inventor/notifications/read-all  (must be before /:id)
app.put('/api/inventor/notifications/read-all', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        await pool.query(
            'UPDATE inventor_notifications SET is_read = TRUE WHERE target_user_id = ? AND is_read = FALSE',
            [req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error marking all inventor notifications as read:', error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// PUT /api/inventor/notifications/:id/read
app.put('/api/inventor/notifications/:id/read', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        const { id } = req.params;
        await pool.query(
            'UPDATE inventor_notifications SET is_read = TRUE WHERE id = ? AND target_user_id = ?',
            [id, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error marking inventor notification as read:', error);
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE /api/inventor/notifications/clear-all  (must be before /:id)
app.delete('/api/inventor/notifications/clear-all', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        const [result] = await pool.query(
            'DELETE FROM inventor_notifications WHERE target_user_id = ?',
            [req.userId]
        );
        res.json({ success: true, cleared: result.affectedRows });
    } catch (error) {
        console.error('❌ Error clearing inventor notifications:', error);
        res.status(500).json({ error: 'Failed to clear inventor notifications' });
    }
});

// DELETE /api/inventor/notifications/:id
app.delete('/api/inventor/notifications/:id', authMiddleware, async (req, res) => {
    if (req.userType !== 'INVENTOR')
        return res.status(403).json({ error: 'Access denied' });
    try {
        const { id } = req.params;
        if (isNaN(id)) return res.status(400).json({ error: 'Invalid notification ID' });
        await pool.query(
            'DELETE FROM inventor_notifications WHERE id = ? AND target_user_id = ?',
            [id, req.userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting inventor notification:', error);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// ============================================
// PORTFOLIO API ENDPOINTS - APPROVED SUBMISSIONS ONLY
// ============================================

// Get APPROVED submissions over time by type and optional year
app.get('/api/portfolio/approved-submissions', authMiddleware, async (req, res) => {
    const { type, year } = req.query;
    const userId = req.userId;
    const userType = req.userType;
    
    try {
        const tableMap = {
            'umid': 'umid_submissions',
            'cr':   'cr_submissions',
            'tm':   'tm_submissions',
            // legacy aliases
            'um':   'umid_submissions',
            'id':   'umid_submissions'
        };
        
        const tableName = tableMap[type];
        if (!tableName) {
            return res.status(400).json({ error: 'Invalid type parameter. Use: id, cr, tm, or um' });
        }

        // ADMINs see all submissions; INVENTORs only see their own
        const userFilter = userType === 'ADMIN' ? '' : 'AND user_id = ?';
        const yearFilter = year && year !== 'all' ? 'AND YEAR(filing_date) = ?' : '';
        
        const query = `
            SELECT 
                YEAR(filing_date) AS year,
                MONTH(filing_date) AS month,
                COUNT(*) AS total_submissions
            FROM ${tableName}
            WHERE filing_date IS NOT NULL 
                AND status = 'Approved for Filing'
                ${userFilter}
                ${yearFilter}
            GROUP BY year, month
            ORDER BY year ASC, month ASC
        `;
        
        const params = [];
        if (userType !== 'ADMIN') params.push(userId);
        if (year && year !== 'all') params.push(parseInt(year));

        const [results] = await pool.execute(query, params);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedData = results.map(row => ({
            label: `${monthNames[row.month - 1]} ${row.year}`,
            submissions: row.total_submissions,
            year: row.year,
            month: row.month,
            sortKey: `${row.year}-${String(row.month).padStart(2, '0')}`
        }));

        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching approved submissions:", error);
        res.status(500).json({ 
            message: "Failed to fetch approved submission data.", 
            error: error.message 
        });
    }
});

// Get total APPROVED counts for each IP type
app.get('/api/portfolio/approved-totals', authMiddleware, async (req, res) => {
    const { year } = req.query;
    const userId = req.userId;
    const userType = req.userType;
    
    try {
        const userFilter = userType === 'ADMIN' ? '' : 'AND user_id = ?';
        const yearFilter = year && year !== 'all' ? `AND YEAR(filing_date) = ${parseInt(year)}` : '';
        const params = userType === 'ADMIN' ? [] : [userId];
        
        const [umidCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM umid_submissions WHERE status = 'Approved for Filing' ${userFilter} ${yearFilter}`, params
        );
        const [crCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM cr_submissions WHERE status = 'Approved for Filing' ${userFilter} ${yearFilter}`, params
        );
        const [tmCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM tm_submissions WHERE status = 'Approved for Filing' ${userFilter} ${yearFilter}`, params
        );
        
        res.json({
            industrialDesign: umidCount[0].count,
            copyright: crCount[0].count,
            trademark: tmCount[0].count,
            utilityModel: umidCount[0].count,
            total: umidCount[0].count + crCount[0].count + tmCount[0].count,
            year: year || 'all'
        });
    } catch (error) {
        console.error("Error fetching approved totals:", error);
        res.status(500).json({ error: "Failed to fetch approved totals" });
    }
});

// Get combined APPROVED submissions for all types (optional)
app.get('/api/portfolio/approved-combined', authMiddleware, async (req, res) => {
    const { year } = req.query;
    const userId = req.userId;
    const userType = req.userType;
    
    try {
        const userFilter = userType === 'ADMIN' ? '' : 'AND user_id = ?';
        const yearFilter = year && year !== 'all' ? `AND YEAR(filing_date) = ${parseInt(year)}` : '';
        const params = userType === 'ADMIN' ? [] : [userId, userId, userId];
        
        const query = `
            SELECT 
                YEAR(filing_date) AS year,
                MONTH(filing_date) AS month,
                COUNT(*) AS total_submissions
            FROM 
                (
                    SELECT filing_date FROM tm_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${userFilter} ${yearFilter}
                    UNION ALL
                    SELECT filing_date FROM cr_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${userFilter} ${yearFilter}
                    UNION ALL
                    SELECT filing_date FROM umid_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${userFilter} ${yearFilter}
                ) AS combined_approved
            GROUP BY year, month
            ORDER BY year ASC, month ASC
        `;

        const [results] = await pool.execute(query, params);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedData = results.map(row => ({
            label: `${monthNames[row.month - 1]} ${row.year}`,
            submissions: row.total_submissions,
            year: row.year,
            month: row.month,
            sortKey: `${row.year}-${String(row.month).padStart(2, '0')}`
        }));

        res.json(formattedData);
    } catch (error) {
        console.error("Error fetching combined approved data:", error);
        res.status(500).json({ 
            message: "Failed to fetch combined approved submission data.", 
            error: error.message 
        });
    }
});

// ============================================
// INITIALIZE TABLES ON STARTUP
// ============================================
(async () => {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        submission_id INT,
        submission_type ENUM('Copyright', 'Trademark', 'Industrial Design', 'Utility Model', 'UMID'),
        icon VARCHAR(50) DEFAULT 'bi bi-bell-fill',
        icon_color VARCHAR(50) DEFAULT 'text-primary',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at DESC),
        INDEX idx_is_read (is_read)
      );
    `);
    console.log('✅ Notifications table ensured');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS submission_status_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_prefix VARCHAR(10) NOT NULL,
        submission_id INT NOT NULL,
        stage VARCHAR(255) NOT NULL,
        status_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed TINYINT(1) DEFAULT 0,
        note TEXT,
        INDEX(submission_prefix, submission_id)
      );
    `);
    console.log('✅ Submission status history table ensured');

    // ── Admin notifications table ──────────────────────────────
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        type             VARCHAR(50)   NOT NULL,
        title            VARCHAR(255)  NOT NULL,
        message          TEXT          NOT NULL,
        submission_id    INT           DEFAULT NULL,
        submission_type  VARCHAR(100)  DEFAULT NULL,
        submission_prefix VARCHAR(10)  DEFAULT NULL,
        target_user_id   INT           DEFAULT NULL,
        consultant_name  VARCHAR(255)  DEFAULT NULL,
        icon             VARCHAR(100)  DEFAULT 'bi bi-bell-fill',
        icon_color       VARCHAR(50)   DEFAULT 'text-primary',
        is_read          TINYINT(1)    NOT NULL DEFAULT 0,
        created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_is_read   (is_read),
        INDEX idx_created   (created_at),
        INDEX idx_type      (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Admin notifications table ensured');

    // ── Inventor notifications table ───────────────────────────
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS inventor_notifications (
        id                INT AUTO_INCREMENT PRIMARY KEY,
        target_user_id    INT           NOT NULL,
        type              VARCHAR(50)   NOT NULL,
        title             VARCHAR(255)  NOT NULL,
        message           TEXT          NOT NULL,
        submission_id     INT           DEFAULT NULL,
        submission_type   VARCHAR(100)  DEFAULT NULL,
        submission_prefix VARCHAR(10)   DEFAULT NULL,
        consultant_name   VARCHAR(255)  DEFAULT NULL,
        icon              VARCHAR(100)  DEFAULT 'bi bi-bell-fill',
        icon_color        VARCHAR(50)   DEFAULT 'text-primary',
        is_read           TINYINT(1)    NOT NULL DEFAULT 0,
        created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (target_user_id),
        INDEX idx_is_read (is_read),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Inventor notifications table ensured');

  } catch (e) {
    console.error('❌ Could not create tables:', e);
  }
})();

// ============================================
// MULTER CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + unique + ext);
  }
});
// QCP-based document field names (shared across all portals)
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }).fields([
  // UMID & shared
  { name: 'endorsementLetter',    maxCount: 1 },
  { name: 'disclosureForm',       maxCount: 1 },
  { name: 'drawings',             maxCount: 1 },
  { name: 'governmentId',         maxCount: 1 },
  // Trademark extras
  { name: 'applicationForm',      maxCount: 1 },
  { name: 'specimen',             maxCount: 1 },
  { name: 'proofOfUse',           maxCount: 1 },
  // Copyright extras
  { name: 'bcrrForm',             maxCount: 1 },
  { name: 'bcrrForm2',            maxCount: 1 },
  { name: 'deedOfAssignment',     maxCount: 1 },
  { name: 'authorId',             maxCount: 1 },
  { name: 'creativeWork',         maxCount: 1 },
  // Inventor-submitted PAS Report (UMID + Copyright portals)
  { name: 'inventorPasReport',    maxCount: 1 },
]);

const cleanupFiles = (files) => {
  if (!files) return;
  Object.keys(files).forEach(k => {
    if (files[k] && files[k].length) {
      try { fs.unlinkSync(files[k][0].path); } catch (e) { console.error('delete error', e); }
    }
  });
};

function extractFilingDate(raw) {
  let filingDate = raw;
  if (Array.isArray(filingDate)) filingDate = filingDate[0];
  else if (typeof filingDate === 'string' && filingDate.startsWith('["')) {
    try {
      const arr = JSON.parse(filingDate);
      if (Array.isArray(arr) && arr.length) filingDate = arr[0];
    } catch (e) { /* ignore */ }
  }
  if (!filingDate) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(filingDate)) return filingDate;
  const parsed = new Date(filingDate);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}



// ============================================================
// HELPER — get a single uploaded file's saved filename
// ============================================================
function getFile(files, fieldName) {
  return files && files[fieldName] && files[fieldName][0]
    ? files[fieldName][0].filename
    : null;
}

// ============================================================
// SHARED ADMIN ROUTES FACTORY
// Generates: new / under-review / checklist / review-action /
//            approved / rejected  for any table
// ============================================================
function createAdminRoutes({ prefix, tableName, docFields }) {
  const TYPE_COL_MAP = { umid_submissions: 'ip_type', tm_submissions: 'mark_type', cr_submissions: 'work_type' };
  const typeCol = TYPE_COL_MAP[tableName] || 'ip_type';

  // GET — new submissions (enriched with inventor name + ip type)
  app.get(`/api/${prefix}-submissions-new`, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.title, s.${typeCol} AS project_type, s.filing_date, s.status, s.created_at,
                u.full_name AS inventor_name, u.email AS inventor_email,
                i.delivery_unit
         FROM ${tableName} s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN inventors i ON u.id = i.user_id
         WHERE s.status = 'Submitted' OR s.status IS NULL
         ORDER BY s.id DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error(`[${prefix}] fetch-new error:`, e);
      res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
  });

  // PUT — receive (move to Under Review)
  app.put(`/api/${prefix}-receive/:id`, async (req, res) => {
    const id = req.params.id;
    try {
      const [r] = await pool.execute(
        `UPDATE ${tableName}
         SET status='Under Review', inventor_identified=0, design_views_complete=0,
             description_clear=0, checklist_complete=0, rejection_reason=NULL, triage_date=NOW()
         WHERE id=?`, [id]
      );
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        [prefix, id, 'Under Review', 0, 'Received by admin for triage']
      );
      res.json({ message: `Submission ${id} moved to Under Review` });
    } catch (e) {
      console.error(`[${prefix}] receive error:`, e);
      res.status(500).json({ error: 'Database update failed' });
    }
  });

  // GET — under review — aliases real doc columns to doc2/3/4_path so TriagePanel
  // can read them with the same keys regardless of which table we're querying.
  app.get(`/api/${prefix}-submissions-under-review`, async (req, res) => {
    // Per-table: map real column names to the generic aliases TriagePanel expects
    const DOC_ALIAS = {
      umid_submissions: [
        `s.endorsement_letter_path`,
        `s.disclosure_form_path        AS doc2_path`,
        `s.drawings_path               AS doc3_path`,
        `s.government_id_path          AS doc4_path`,
        `s.inventor_pas_report_path    AS doc5_path`,
      ],
      tm_submissions: [
        `s.endorsement_letter_path`,
        `s.application_form_path       AS doc2_path`,
        `s.specimen_path               AS doc3_path`,
        `s.government_id_path          AS doc4_path`,
        `s.proof_of_use_path           AS doc5_path`,
      ],
      cr_submissions: [
        `s.endorsement_letter_path`,
        `s.bcrr_form_path              AS doc2_path`,
        `s.bcrr_form2_path             AS doc3_path`,
        `s.deed_of_assignment_path     AS doc4_path`,
        `s.author_id_path              AS doc5_path`,
        `s.creative_work_path          AS doc6_path`,
        `s.inventor_pas_report_path    AS doc7_path`,
      ],
    };

    // Per-table chk_* columns — each table only has its own subset
    const CHK_COLS = {
      umid_submissions: [
        'chk_cover_letter','chk_disclosure_form','chk_drawings',
        'chk_all_views','chk_description','chk_inventor_details','chk_gov_id',
        'chk_inventor_pas'
      ],
      tm_submissions: [
        'chk_cover_letter','chk_ipophl_form','chk_specimen',
        'chk_mark_type','chk_goods_services','chk_inventor_details','chk_gov_id'
      ],
      cr_submissions: [
        'chk_cover_letter','chk_bcrr1','chk_bcrr2','chk_deed',
        'chk_author_id','chk_creative_work','chk_work_type','chk_inventor_details',
        'chk_inventor_pas'
      ],
    };

    const docAliases = (DOC_ALIAS[tableName] || docFields.map(f => `s.${f}_path`)).join(',\n                ');
    const chkCols   = (CHK_COLS[tableName]  || []).map(c => `s.${c}`).join(',\n                ');

    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.title,
                s.${typeCol} AS project_type,
                s.${typeCol} AS ip_type,
                s.filing_date, s.status, s.created_at, s.assigned_at,
                s.checklist_complete, s.rejection_reason,
                s.missing_items, s.triage_notes,
                ${chkCols ? chkCols + ',' : ''}
                ${docAliases},
                u.full_name AS inventor_name, u.email AS inventor_email,
                i.delivery_unit
         FROM ${tableName} s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN inventors i ON u.id = i.user_id
         WHERE s.status IN ('Under Review','Under Re-review','Pending Resubmission','Resubmission')
         ORDER BY s.id DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error(`[${prefix}] fetch-under-review error:`, e);
      res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
  });

  // PUT — checklist update (QCP chk_* fields + triage_notes, dynamic per table)
  app.put(`/api/${prefix}-checklist-update/:id`, async (req, res) => {
    const id = req.params.id;
    const { triage_notes, ...rest } = req.body;

    const CHK_COLS = {
      umid_submissions: new Set([
        'chk_cover_letter','chk_disclosure_form','chk_drawings',
        'chk_all_views','chk_description','chk_inventor_details','chk_gov_id',
        'chk_inventor_pas'
      ]),
      tm_submissions: new Set([
        'chk_cover_letter','chk_ipophl_form','chk_specimen',
        'chk_mark_type','chk_goods_services','chk_inventor_details','chk_gov_id'
      ]),
      cr_submissions: new Set([
        'chk_cover_letter','chk_bcrr1','chk_bcrr2','chk_deed',
        'chk_author_id','chk_creative_work','chk_work_type','chk_inventor_details',
        'chk_inventor_pas'
      ]),
    };
    const allowed   = CHK_COLS[tableName] || new Set();
    const chkFields = Object.keys(rest).filter(k => k.startsWith('chk_') && allowed.has(k));
    const checklistComplete = chkFields.length > 0 && chkFields.every(k => !!rest[k]);
    const newStatus = checklistComplete ? 'Under Re-review' : 'Under Review';

    const setClauses = chkFields.map(k => `${k} = ?`);
    const values     = chkFields.map(k => rest[k] ? 1 : 0);
    setClauses.push('triage_notes = ?', 'checklist_complete = ?', 'status = ?', 'triage_date = NOW()');
    values.push(triage_notes || null, checklistComplete ? 1 : 0, newStatus, id);

    try {
      const [r] = await pool.execute(
        `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`, values
      );
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        [prefix, id, newStatus, checklistComplete ? 1 : 0, triage_notes || 'Checklist updated']
      );
      res.json({ message: `Checklist updated to '${newStatus}'`, status: newStatus });
    } catch (e) {
      console.error(`[${prefix}] checklist error:`, e);
      res.status(500).json({ error: 'Database update failed', detail: e.message });
    }
  });

  // PUT — review action (Approved for Filing / Pending Resubmission / Rejected)
  app.put(`/api/${prefix}-review-action/:id`, async (req, res) => {
    const id = req.params.id;
    const { action, rejection_reason, missing_items, missing_checklist_keys } = req.body;
    const VALID = ['Approved for Filing', 'Pending Resubmission', 'Rejected', 'Filed to IPOPHL'];
    if (!VALID.includes(action))
      return res.status(400).json({ error: 'Invalid action.' });
    if ((action === 'Rejected' || action === 'Pending Resubmission') && !rejection_reason?.trim())
      return res.status(400).json({ error: 'Notes/reason is required for this action.' });
    try {
      const [r] = await pool.execute(
        `UPDATE ${tableName}
         SET status=?,
             approval_date = CASE WHEN approval_date IS NULL THEN NOW() ELSE approval_date END,
             rejection_reason=?, missing_items=?, missing_checklist_keys=?
         WHERE id=?`,
        [action, rejection_reason || null, missing_items || null, missing_checklist_keys || null, id]
      );
      if (r.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        [prefix, id, action, action === 'Approved for Filing' ? 1 : 0,
         rejection_reason || `Status: ${action}`]
      );

      // Fetch inventor user_id and title for notification
      const [[subRow]] = await pool.execute(
        `SELECT user_id, title FROM ${tableName} WHERE id = ?`, [id]
      );

      if (subRow) {
          if (action === 'Approved for Filing') {
              await createInventorNotification({
                  targetUserId: subRow.user_id,
                  type: 'approved',
                  title: 'Submission Approved for Filing',
                  message: `Congratulations! Your submission "${subRow.title}" (${prefix.toUpperCase()}-${id}) has been approved for filing with IPOPHL.`,
                  submissionId: id,
                  submissionPrefix: prefix,
              });
          } else if (action === 'Pending Resubmission') {
              await createInventorNotification({
                  targetUserId: subRow.user_id,
                  type: 'resubmission_required',
                  title: 'Resubmission Required',
                  message: `Your submission "${subRow.title}" (${prefix.toUpperCase()}-${id}) requires corrections. Notes: ${rejection_reason}`,
                  submissionId: id,
                  submissionPrefix: prefix,
              });
          } else if (action === 'Rejected') {
              await createInventorNotification({
                  targetUserId: subRow.user_id,
                  type: 'rejected',
                  title: 'Submission Rejected',
                  message: `Your submission "${subRow.title}" (${prefix.toUpperCase()}-${id}) has been rejected. Reason: ${rejection_reason}`,
                  submissionId: id,
                  submissionPrefix: prefix,
              });
          }
      }

      res.json({ message: `Submission ${id} → ${action}`, action, id });
    } catch (e) {
      console.error(`[${prefix}] review-action error:`, e);
      res.status(500).json({ error: 'Database update failed' });
    }
  });

  // GET — approved
  app.get(`/api/${prefix}-submissions-approved`, async (req, res) => {
    // Per-table doc columns
    const DOC_COLS = {
      umid_submissions: `s.endorsement_letter_path, s.disclosure_form_path, s.drawings_path, s.government_id_path, s.inventor_pas_report_path`,
      tm_submissions:   `s.endorsement_letter_path, s.application_form_path, s.specimen_path, s.government_id_path, s.proof_of_use_path`,
      cr_submissions:   `s.endorsement_letter_path, s.bcrr_form_path, s.bcrr_form2_path, s.deed_of_assignment_path, s.author_id_path, s.creative_work_path, s.inventor_pas_report_path`,
    };
    const docCols = DOC_COLS[tableName] || 's.endorsement_letter_path';
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.title, s.${typeCol} AS ip_type, s.${typeCol} AS project_type,
                s.filing_date, s.status, s.approval_date, s.rejection_reason,
                s.triage_notes, s.missing_items, s.pas_report_path,
                s.created_at, s.assigned_at,
                ${docCols},
                u.full_name AS inventor_name, u.email AS inventor_email
         FROM ${tableName} s
         LEFT JOIN users u ON s.user_id = u.id
         WHERE s.status = 'Approved for Filing'
         ORDER BY s.approval_date DESC, s.id DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error(`[${prefix}] approved fetch error:`, e);
      res.status(500).json({ error: 'Failed to fetch approved submissions.' });
    }
  });

  // GET — rejected
  app.get(`/api/${prefix}-submissions-rejected`, async (req, res) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, title, filing_date, status, approval_date, rejection_reason, created_at
         FROM ${tableName} WHERE status='Rejected'
         ORDER BY approval_date DESC, id DESC`
      );
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch rejected submissions.' });
    }
  });

  // GET — filed (Admin PAS Reports page)
  // Shows submissions where consultant already uploaded PAS report → status = 'Filed to IPOPHL'
  // Admin sees these and can download the full package + PAS report, then submits to IPOPHL
  app.get(`/api/${prefix}-submissions-filed`, authMiddleware, async (req, res) => {
    const DOC_COLS = {
      umid_submissions: `s.endorsement_letter_path, s.disclosure_form_path, s.drawings_path, s.government_id_path, s.inventor_pas_report_path`,
      tm_submissions:   `s.endorsement_letter_path, s.application_form_path, s.specimen_path, s.government_id_path, s.proof_of_use_path`,
      cr_submissions:   `s.endorsement_letter_path, s.bcrr_form_path, s.bcrr_form2_path, s.deed_of_assignment_path, s.author_id_path, s.creative_work_path, s.inventor_pas_report_path`,
    };
    const docCols = DOC_COLS[tableName] || 's.endorsement_letter_path';
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.title, s.${typeCol} AS ip_type,
                s.filing_date, s.status, s.approval_date,
                s.created_at,
                s.triage_notes, s.pas_report_path,
                s.assigned_to_consultant,
                '${prefix}' AS ip_type_prefix,
                ${docCols},
                u.full_name  AS inventor_name,
                u.email      AS inventor_email,
                c.full_name  AS consultant_name
         FROM ${tableName} s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN users c ON s.assigned_to_consultant = c.id
         WHERE s.status = 'Approved for Filing'
         ORDER BY s.created_at DESC, s.id DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error(`[${prefix}] filed fetch error:`, e);
      res.status(500).json({ error: 'Failed to fetch filed submissions.' });
    }
  });

  // GET — pending resubmission
  app.get(`/api/${prefix}-submissions-resubmission`, authMiddleware, async (req, res) => {
    const DOC_COLS = {
      umid_submissions: `s.endorsement_letter_path, s.disclosure_form_path, s.drawings_path, s.government_id_path, s.inventor_pas_report_path`,
      tm_submissions:   `s.endorsement_letter_path, s.application_form_path, s.specimen_path, s.government_id_path, s.proof_of_use_path`,
      cr_submissions:   `s.endorsement_letter_path, s.bcrr_form_path, s.bcrr_form2_path, s.deed_of_assignment_path, s.author_id_path, s.creative_work_path, s.inventor_pas_report_path`,
    };
    const docCols = DOC_COLS[tableName] || 's.endorsement_letter_path';
    try {
      const [rows] = await pool.execute(
        `SELECT s.id, s.title, s.${typeCol} AS ip_type,
                s.filing_date, s.status, s.approval_date,
                s.rejection_reason, s.missing_items, s.triage_notes,
                s.created_at, s.assigned_at, s.assigned_to_consultant,
                ${docCols},
                u.full_name AS inventor_name, u.email AS inventor_email,
                cl.file_path AS comm_letter_path,
                cl.signed_at AS comm_letter_signed_at
         FROM ${tableName} s
         LEFT JOIN users u ON s.user_id = u.id
         LEFT JOIN communication_letters cl
           ON cl.submission_id = s.id
           AND cl.id = (SELECT id FROM communication_letters
                        WHERE submission_id = s.id
                        ORDER BY created_at DESC LIMIT 1)
         WHERE s.status IN ('Pending Resubmission', 'Resubmission')
         ORDER BY s.approval_date DESC, s.id DESC`
      );
      res.json(rows);
    } catch (e) {
      console.error(`[${prefix}] resubmission fetch error:`, e);
      res.status(500).json({ error: 'Failed to fetch resubmission submissions.' });
    }
  });

  // PUT — reopen for review (Pending Resubmission → Under Review)
  app.put(`/api/${prefix}-reopen-review/:id`, authMiddleware, async (req, res) => {
    const id = req.params.id;
    try {
      const [r] = await pool.execute(
        `UPDATE ${tableName}
         SET status = 'Under Review', approval_date = NULL, missing_items = NULL
         WHERE id = ? AND status IN ('Pending Resubmission', 'Resubmission')`,
        [id]
      );
      if (r.affectedRows === 0)
        return res.status(404).json({ error: 'Submission not found or not in Resubmission status.' });
      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        [prefix, id, 'Under Review', 0, 'Re-opened for review after inventor resubmission']
      );
      res.json({ message: `Submission ${id} re-opened for review.`, id });
    } catch (e) {
      console.error(`[${prefix}] reopen-review error:`, e);
      res.status(500).json({ error: 'Failed to re-open submission.' });
    }
  });
}

// ============================================================
// POST /api/umid/submit
// Handles both Utility Model and Industrial Design
// Fields: ipType, title, date (filing)
// Files:  endorsementLetter, disclosureForm, drawings, governmentId
// ============================================================
app.post('/api/umid/submit', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    if (err)
      return res.status(500).json({ error: 'Unknown upload error.' });

    const userId = req.userId;
    if (!userId) { cleanupFiles(req.files); return res.status(401).json({ error: 'Unauthorized.' }); }

    const { ipType, title } = req.body;
    const filingDate = extractFilingDate(req.body.date);

    // Required field validation
    if (!ipType || !['Utility Model', 'Industrial Design'].includes(ipType))
      return res.status(400).json({ error: 'Invalid or missing ipType.' });
    if (!title?.trim())
      return res.status(400).json({ error: 'Title is required.' });
    if (!filingDate)
      return res.status(400).json({ error: 'Filing date is required.' });

    const endorsementLetterPath  = getFile(req.files, 'endorsementLetter');
    const disclosureFormPath     = getFile(req.files, 'disclosureForm');
    const drawingsPath           = getFile(req.files, 'drawings');
    const governmentIdPath       = getFile(req.files, 'governmentId');
    const inventorPasReportPath  = getFile(req.files, 'inventorPasReport'); // optional

    if (!endorsementLetterPath || !disclosureFormPath || !drawingsPath || !governmentIdPath) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'All 4 required documents must be uploaded.' });
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO umid_submissions
         (user_id, ip_type, title, filing_date,
          endorsement_letter_path, disclosure_form_path, drawings_path, government_id_path,
          inventor_pas_report_path,
          inventor_identified, design_views_complete, description_clear, checklist_complete)
         VALUES (?,?,?,?,?,?,?,?,?,0,0,0,0)`,
        [userId, ipType, title.trim(), filingDate,
         endorsementLetterPath, disclosureFormPath, drawingsPath, governmentIdPath,
         inventorPasReportPath || null]
      );

      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        ['umid', result.insertId, 'Submitted', 1, 'Initial submission']
      );

      await createSubmissionNotification(
        { id: result.insertId, title: title.trim() },
        ipType,
        'umid'
      );

      // Notify the inventor that their submission was received
      await createInventorNotification({
          targetUserId: userId,
          type: 'submission_received',
          title: 'Submission Received',
          message: `Your ${ipType} submission "${title.trim()}" (UMID-${result.insertId}) has been received and is pending assignment to a consultant.`,
          submissionId: result.insertId,
          submissionType: ipType,
          submissionPrefix: 'umid',
      });

      // Notify admin of new submission
      await createAdminNotification({
          type: 'new_submission',
          title: `New ${ipType} Submission`,
          message: `A new ${ipType} submission "${title.trim()}" (UMID-${result.insertId}) was submitted and is awaiting consultant assignment.`,
          submissionId: result.insertId,
          submissionType: ipType,
          submissionPrefix: 'umid',
          targetUserId: userId,
      });

      console.log(`✅ UMID submission #${result.insertId} (${ipType}) by user ${userId}`);
      res.status(200).json({
        message: `${ipType} submission successful!`,
        submissionId: result.insertId
      });
    } catch (e) {
      console.error('❌ UMID insert error:', e);
      cleanupFiles(req.files);
      res.status(500).json({ error: 'Failed to save submission.' });
    }
  });
});

// UMID admin routes
createAdminRoutes({
  prefix: 'umid',
  tableName: 'umid_submissions',
  docFields: ['endorsement_letter', 'disclosure_form', 'drawings', 'government_id']
});

// ============================================================
// ADMIN — full submission detail (all doc paths, no ownership check)
// GET /api/admin/submission/:prefix/:id
// ============================================================
app.get('/api/admin/submission/:prefix/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
  const { prefix, id } = req.params;
  const table = TABLES[prefix];
  if (!table) return res.status(400).json({ error: 'Invalid prefix.' });

  const TYPE_COL = { umid: 'ip_type', tm: 'mark_type', cr: 'work_type' };
  const typeCol  = TYPE_COL[prefix] || 'ip_type';

  try {
    const [[sub]] = await pool.execute(
      `SELECT s.*, s.${typeCol} AS submission_type,
              u.full_name AS inventor_name, u.email AS inventor_email,
              i.delivery_unit, i.college_institute
       FROM ${table} s
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN inventors i ON u.id = i.user_id
       WHERE s.id = ?`,
      [id]
    );
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });

    const [history] = await pool.execute(
      `SELECT stage, status_date, completed, note
       FROM submission_status_history
       WHERE submission_prefix = ? AND submission_id = ?
       ORDER BY status_date ASC`,
      [prefix, id]
    );

    // Collect all _path fields and convert to accessible URLs
    const docs = {};
    Object.keys(sub).forEach(key => {
      if (key.endsWith('_path') && sub[key]) {
        docs[key] = `/uploads/${sub[key]}`;
      }
    });

    res.json({
      id:             sub.id,
      prefix,
      title:          sub.title,
      submissionType: sub.submission_type,
      filingDate:     sub.filing_date,
      status:         sub.status ?? 'Submitted',
      createdAt:      sub.created_at,
      assignedAt:     sub.assigned_at,
      inventorName:   sub.inventor_name,
      inventorEmail:  sub.inventor_email,
      deliveryUnit:   sub.delivery_unit,
      collegeInstitute: sub.college_institute,
      checklist: {
        inventor_identified:    !!sub.inventor_identified,
        design_views_complete:  !!sub.design_views_complete,
        description_clear:      !!sub.description_clear,
        checklist_complete:     !!sub.checklist_complete,
      },
      rejectionReason: sub.rejection_reason,
      docs,
      timeline: history.map(h => ({
        stage:     h.stage,
        date:      h.status_date ? new Date(h.status_date).toISOString().split('T')[0] : null,
        completed: !!h.completed,
        note:      h.note || null,
      })),
    });
  } catch (e) {
    console.error('[admin-detail] error:', e);
    res.status(500).json({ error: 'Failed to fetch submission detail.' });
  }
});

// Keep legacy um / id prefixes pointing to umid table for backward compat
['um', 'id'].forEach(legacy => {
  app.get(`/api/${legacy}-submissions-new`,          (req, res) => res.redirect(`/api/umid-submissions-new`));
  app.get(`/api/${legacy}-submissions-under-review`, (req, res) => res.redirect(`/api/umid-submissions-under-review`));
  app.get(`/api/${legacy}-submissions-approved`,     (req, res) => res.redirect(`/api/umid-submissions-approved`));
  app.get(`/api/${legacy}-submissions-rejected`,     (req, res) => res.redirect(`/api/umid-submissions-rejected`));
});

// ============================================================
// POST /api/tm/submit
// Fields: title, markType, date
// Files:  endorsementLetter, applicationForm, specimen,
//         governmentId, proofOfUse (optional)
// ============================================================
app.post('/api/tm/submit', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    if (err)
      return res.status(500).json({ error: 'Unknown upload error.' });

    const userId = req.userId;
    if (!userId) { cleanupFiles(req.files); return res.status(401).json({ error: 'Unauthorized.' }); }

    const { title, markType } = req.body;
    const filingDate = extractFilingDate(req.body.date);

    if (!title?.trim())   return res.status(400).json({ error: 'Trademark title is required.' });
    if (!markType?.trim()) return res.status(400).json({ error: 'Type of mark is required.' });
    if (!filingDate)       return res.status(400).json({ error: 'Filing date is required.' });

    const endorsementLetterPath = getFile(req.files, 'endorsementLetter');
    const applicationFormPath   = getFile(req.files, 'applicationForm');
    const specimenPath          = getFile(req.files, 'specimen');
    const governmentIdPath      = getFile(req.files, 'governmentId');
    const proofOfUsePath        = getFile(req.files, 'proofOfUse'); // optional

    if (!endorsementLetterPath || !applicationFormPath || !specimenPath || !governmentIdPath) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'Docs 1–4 are required. Proof of Use is optional.' });
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO tm_submissions
         (user_id, title, mark_type, filing_date,
          endorsement_letter_path, application_form_path, specimen_path,
          government_id_path, proof_of_use_path,
          inventor_identified, design_views_complete, description_clear, checklist_complete)
         VALUES (?,?,?,?,?,?,?,?,?,0,0,0,0)`,
        [userId, title.trim(), markType.trim(), filingDate,
         endorsementLetterPath, applicationFormPath, specimenPath,
         governmentIdPath, proofOfUsePath || null]
      );

      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        ['tm', result.insertId, 'Submitted', 1, 'Initial submission']
      );

      await createSubmissionNotification(
        { id: result.insertId, title: title.trim() },
        'Trademark',
        'tm'
      );

      // Notify the inventor
      await createInventorNotification({
          targetUserId: userId,
          type: 'submission_received',
          title: 'Trademark Submission Received',
          message: `Your Trademark submission "${title.trim()}" (TM-${result.insertId}) has been received and is pending assignment to a consultant.`,
          submissionId: result.insertId,
          submissionType: 'Trademark',
          submissionPrefix: 'tm',
      });

      // Notify admin
      await createAdminNotification({
          type: 'new_submission',
          title: 'New Trademark Submission',
          message: `A new Trademark submission "${title.trim()}" (TM-${result.insertId}) was submitted and is awaiting consultant assignment.`,
          submissionId: result.insertId,
          submissionType: 'Trademark',
          submissionPrefix: 'tm',
          targetUserId: userId,
      });

      console.log(`✅ TM submission #${result.insertId} by user ${userId}`);
      res.status(200).json({
        message: 'Trademark submission successful!',
        submissionId: result.insertId
      });
    } catch (e) {
      console.error('❌ TM insert error:', e);
      cleanupFiles(req.files);
      res.status(500).json({ error: 'Failed to save submission.' });
    }
  });
});

// Trademark admin routes
createAdminRoutes({
  prefix: 'tm',
  tableName: 'tm_submissions',
  docFields: ['endorsement_letter', 'application_form', 'specimen', 'government_id', 'proof_of_use']
});

// ============================================================
// POST /api/cr/submit
// Fields: title, workType, date
// Files:  endorsementLetter, bcrrForm, bcrrForm2,
//         deedOfAssignment, authorId, creativeWork
// ============================================================
app.post('/api/cr/submit', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    if (err)
      return res.status(500).json({ error: 'Unknown upload error.' });

    const userId = req.userId;
    if (!userId) { cleanupFiles(req.files); return res.status(401).json({ error: 'Unauthorized.' }); }

    const { title, workType } = req.body;
    const filingDate = extractFilingDate(req.body.date);

    if (!title?.trim())    return res.status(400).json({ error: 'Title of work is required.' });
    if (!workType?.trim()) return res.status(400).json({ error: 'Type of work is required.' });
    if (!filingDate)       return res.status(400).json({ error: 'Filing date is required.' });

    const endorsementLetterPath = getFile(req.files, 'endorsementLetter');
    const bcrrFormPath          = getFile(req.files, 'bcrrForm');
    const bcrrForm2Path         = getFile(req.files, 'bcrrForm2');
    const deedOfAssignmentPath  = getFile(req.files, 'deedOfAssignment');
    const authorIdPath          = getFile(req.files, 'authorId');
    const creativeWorkPath      = getFile(req.files, 'creativeWork');
    const inventorPasReportPath = getFile(req.files, 'inventorPasReport'); // optional

    if (!endorsementLetterPath || !bcrrFormPath || !bcrrForm2Path ||
        !deedOfAssignmentPath  || !authorIdPath || !creativeWorkPath) {
      cleanupFiles(req.files);
      return res.status(400).json({ error: 'All 6 required documents must be uploaded.' });
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO cr_submissions
         (user_id, title, work_type, filing_date,
          endorsement_letter_path, bcrr_form_path, bcrr_form2_path,
          deed_of_assignment_path, author_id_path, creative_work_path,
          inventor_pas_report_path,
          inventor_identified, design_views_complete, description_clear, checklist_complete)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0,0,0)`,
        [userId, title.trim(), workType.trim(), filingDate,
         endorsementLetterPath, bcrrFormPath, bcrrForm2Path,
         deedOfAssignmentPath, authorIdPath, creativeWorkPath,
         inventorPasReportPath || null]
      );

      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
         VALUES (?,?,?,NOW(),?,?)`,
        ['cr', result.insertId, 'Submitted', 1, 'Initial submission']
      );

      await createSubmissionNotification(
        { id: result.insertId, title: title.trim() },
        'Copyright',
        'cr'
      );

      // Notify the inventor
      await createInventorNotification({
          targetUserId: userId,
          type: 'submission_received',
          title: 'Copyright Submission Received',
          message: `Your Copyright submission "${title.trim()}" (CR-${result.insertId}) has been received and is pending assignment to a consultant.`,
          submissionId: result.insertId,
          submissionType: 'Copyright',
          submissionPrefix: 'cr',
      });

      // Notify admin
      await createAdminNotification({
          type: 'new_submission',
          title: 'New Copyright Submission',
          message: `A new Copyright submission "${title.trim()}" (CR-${result.insertId}) was submitted and is awaiting consultant assignment.`,
          submissionId: result.insertId,
          submissionType: 'Copyright',
          submissionPrefix: 'cr',
          targetUserId: userId,
      });

      console.log(`✅ CR submission #${result.insertId} by user ${userId}`);
      res.status(200).json({
        message: 'Copyright submission successful!',
        submissionId: result.insertId
      });
    } catch (e) {
      console.error('❌ CR insert error:', e);
      cleanupFiles(req.files);
      res.status(500).json({ error: 'Failed to save submission.' });
    }
  });
});

// Copyright admin routes
createAdminRoutes({
  prefix: 'cr',
  tableName: 'cr_submissions',
  docFields: ['endorsement_letter', 'bcrr_form', 'bcrr_form2',
              'deed_of_assignment', 'author_id', 'creative_work']
});

// ============================================================
// RESUBMISSION SYSTEM
// QCP Process: Inventor uploads corrected docs → returns to Under Review
// ============================================================

// ── DB MIGRATION (run once before starting server) ───────────
// ALTER TABLE umid_submissions ADD COLUMN IF NOT EXISTS missing_checklist_keys TEXT NULL;
// ALTER TABLE tm_submissions   ADD COLUMN IF NOT EXISTS missing_checklist_keys TEXT NULL;
// ALTER TABLE cr_submissions   ADD COLUMN IF NOT EXISTS missing_checklist_keys TEXT NULL;

// ── GET /api/inventor/resubmission-pending/:tablePrefix ───────
// Inventor sees ONLY their own applications in Pending Resubmission.
// Returns full doc paths + missing_items + missing_checklist_keys + rejection_reason.
app.get('/api/inventor/resubmission-pending/:tablePrefix', authMiddleware, async (req, res) => {
  const userId       = req.userId;
  const { tablePrefix } = req.params;

  const TABLE_FOR = { umid: 'umid_submissions', tm: 'tm_submissions', cr: 'cr_submissions' };
  const TYPE_COL  = { umid: 'ip_type', tm: 'mark_type', cr: 'work_type' };

  const tableName = TABLE_FOR[tablePrefix];
  const typeCol   = TYPE_COL[tablePrefix] || 'ip_type';
  if (!tableName) return res.status(400).json({ error: 'Invalid table prefix.' });

  const DOC_COLS = {
    umid_submissions: `s.endorsement_letter_path, s.disclosure_form_path,
                       s.drawings_path, s.government_id_path`,
    tm_submissions:   `s.endorsement_letter_path, s.application_form_path,
                       s.specimen_path, s.government_id_path, s.proof_of_use_path`,
    cr_submissions:   `s.endorsement_letter_path, s.bcrr_form_path, s.bcrr_form2_path,
                       s.deed_of_assignment_path, s.author_id_path, s.creative_work_path`,
  };
  const docCols = DOC_COLS[tableName] || '';

  try {
    const [rows] = await pool.execute(
      `SELECT s.id, s.title, s.${typeCol} AS ip_type,
              s.filing_date, s.status, s.approval_date, s.created_at,
              '${tablePrefix}' AS ip_type_prefix,
              s.missing_items, s.missing_checklist_keys,
              s.rejection_reason, s.triage_notes,
              ${docCols},
              cl.file_path AS comm_letter_path,
              cl.signed_at AS comm_letter_signed_at
       FROM ${tableName} s
       LEFT JOIN communication_letters cl
         ON cl.submission_id = s.id
         AND cl.id = (SELECT id FROM communication_letters
                      WHERE submission_id = s.id
                      ORDER BY created_at DESC LIMIT 1)
       WHERE s.user_id = ?
         AND s.status IN ('Pending Resubmission', 'Resubmission')
       ORDER BY s.approval_date DESC, s.id DESC`,
      [userId]
    );
    res.json(rows);
  } catch (e) {
    console.error(`[inventor-resub/${tablePrefix}] fetch error:`, e);
    res.status(500).json({ error: 'Failed to fetch resubmission requests.' });
  }
});

// ── Resubmit route factory ─────────────────────────────────────
// Builds POST /api/{routePrefix}/resubmit/:id
// Inventor uploads ONLY the missing/flagged files.
// Updates specific doc columns → sets status back to 'Under Review'.
function createResubmitRoute({ routePrefix, tableName, ipTypeLabel, docFieldMap }) {
  app.post(`/api/${routePrefix}/resubmit/:id`, authMiddleware, (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError)
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      if (err)
        return res.status(500).json({ error: 'Unknown upload error.' });

      const userId = req.userId;
      const id     = req.params.id;

      if (!userId) { cleanupFiles(req.files); return res.status(401).json({ error: 'Unauthorized.' }); }

      // Verify ownership + current status
      try {
        const [[sub]] = await pool.execute(
          `SELECT id, status, user_id FROM ${tableName} WHERE id = ?`, [id]
        );
        if (!sub)
          return res.status(404).json({ error: 'Submission not found.' });
        if (sub.user_id !== userId)
          return res.status(403).json({ error: 'You do not own this submission.' });
        if (!['Pending Resubmission', 'Resubmission'].includes(sub.status))
          return res.status(400).json({ error: 'Submission is not awaiting resubmission.' });
      } catch (e) {
        console.error(`[${routePrefix}/resubmit] ownership check error:`, e);
        return res.status(500).json({ error: 'Failed to verify submission.' });
      }

      // Build SET clause — only update columns for files actually uploaded
      const setClauses = [];
      const values     = [];

      Object.entries(docFieldMap).forEach(([fieldName, dbColumn]) => {
        const file = getFile(req.files, fieldName);
        if (file) {
          setClauses.push(`${dbColumn} = ?`);
          values.push(file);
        }
      });

      if (setClauses.length === 0) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'No files were uploaded.' });
      }

      // Reset status → Under Review, clear deficiency fields
      setClauses.push(`status = 'Under Review'`);
      setClauses.push(`missing_items = NULL`);
      setClauses.push(`missing_checklist_keys = NULL`);
      setClauses.push(`rejection_reason = NULL`);
      setClauses.push(`approval_date = NOW()`);
      values.push(id);

      try {
        const [r] = await pool.execute(
          `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`,
          values
        );
        if (r.affectedRows === 0) {
          cleanupFiles(req.files);
          return res.status(404).json({ error: 'Submission not found or not updated.' });
        }

        // Log to status history
        const filesReplaced = setClauses.filter(c => c.includes('_path')).length;
        await pool.execute(
          `INSERT INTO submission_status_history
           (submission_prefix, submission_id, stage, status_date, completed, note)
           VALUES (?, ?, 'Under Review', NOW(), 0, ?)`,
          [routePrefix, id,
           `Inventor resubmitted corrected documents (${filesReplaced} file(s) replaced). Returned to Under Review.`]
        );

        // Notify admin/consultant — resubmission received
        const iconMap = {
          'Utility Model / Industrial Design': { icon: 'bi bi-arrow-clockwise', color: 'text-warning' },
          'Trademark':                         { icon: 'bi bi-arrow-clockwise', color: 'text-danger'  },
          'Copyright':                         { icon: 'bi bi-arrow-clockwise', color: 'text-info'    },
        };
        const cfg = iconMap[ipTypeLabel] || { icon: 'bi bi-arrow-clockwise', color: 'text-primary' };

        const [[subInfo]] = await pool.execute(
          `SELECT title FROM ${tableName} WHERE id = ?`, [id]
        );

        await pool.execute(
          `INSERT INTO notifications
           (type, title, message, submission_id, submission_type, icon, icon_color)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            'resubmission_received',
            `Resubmission Received — ${routePrefix.toUpperCase()}-${id}`,
            `${ipTypeLabel} "${subInfo?.title || 'Untitled'}" (ID: ${id}) has been resubmitted by the inventor and is now Under Review.`,
            id, ipTypeLabel, cfg.icon, cfg.color,
          ]
        );

        // Also notify via the new admin_notifications table
        await createAdminNotification({
            type: 'new_submission',
            title: `Resubmission Received — ${routePrefix.toUpperCase()}-${id}`,
            message: `${ipTypeLabel} "${subInfo?.title || 'Untitled'}" (${routePrefix.toUpperCase()}-${id}) has been resubmitted by the inventor and is now back Under Review.`,
            submissionId: id,
            submissionType: ipTypeLabel,
            submissionPrefix: routePrefix,
        });

        console.log(`✅ [${routePrefix}/resubmit] Submission #${id} resubmitted by user ${userId} — ${filesReplaced} file(s) replaced`);
        res.json({
          message: 'Documents resubmitted successfully. Your application is now Under Review.',
          submissionId: id,
          filesReplaced,
        });
      } catch (e) {
        console.error(`[${routePrefix}/resubmit] DB error:`, e);
        cleanupFiles(req.files);
        res.status(500).json({ error: 'Failed to save resubmitted documents.' });
      }
    });
  });
}

// Register resubmit routes for all IP types
createResubmitRoute({
  routePrefix:  'umid',
  tableName:    'umid_submissions',
  ipTypeLabel:  'Utility Model / Industrial Design',
  docFieldMap: {
    endorsementLetter: 'endorsement_letter_path',
    disclosureForm:    'disclosure_form_path',
    drawings:          'drawings_path',
    governmentId:      'government_id_path',
  },
});

createResubmitRoute({
  routePrefix:  'tm',
  tableName:    'tm_submissions',
  ipTypeLabel:  'Trademark',
  docFieldMap: {
    endorsementLetter: 'endorsement_letter_path',
    applicationForm:   'application_form_path',
    specimen:          'specimen_path',
    governmentId:      'government_id_path',
    proofOfUse:        'proof_of_use_path',
  },
});

createResubmitRoute({
  routePrefix:  'cr',
  tableName:    'cr_submissions',
  ipTypeLabel:  'Copyright',
  docFieldMap: {
    endorsementLetter: 'endorsement_letter_path',
    bcrrForm:          'bcrr_form_path',
    bcrrForm2:         'bcrr_form2_path',
    deedOfAssignment:  'deed_of_assignment_path',
    authorId:          'author_id_path',
    creativeWork:      'creative_work_path',
  },
});

// ── Communication Letters ─────────────────────────────────────
// TABLE (run once):
// CREATE TABLE IF NOT EXISTS communication_letters (
//   id               INT AUTO_INCREMENT PRIMARY KEY,
//   submission_id    INT NOT NULL,
//   submission_ref   VARCHAR(50) NOT NULL,
//   ip_type          VARCHAR(50) NOT NULL,
//   ip_type_prefix   VARCHAR(10) NOT NULL,
//   applicant_name   VARCHAR(255),
//   applicant_email  VARCHAR(255),
//   submission_title VARCHAR(500),
//   missing_items    TEXT,
//   deficiency_notes TEXT,
//   letter_date      VARCHAR(100),
//   letter_ref       VARCHAR(100),
//   file_path        VARCHAR(500) NULL,
//   status           VARCHAR(100) DEFAULT 'Pending Director Signature',
//   signed_at        DATETIME NULL,
//   issued_at        DATETIME NULL,
//   created_at       DATETIME DEFAULT NOW(),
//   updated_at       DATETIME DEFAULT NOW() ON UPDATE NOW()
// );
// Run this once to add file_path to existing tables:
// ALTER TABLE communication_letters ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) NULL;
pool.execute('ALTER TABLE communication_letters ADD COLUMN IF NOT EXISTS file_path VARCHAR(500) NULL')
  .catch(() => {}); // already exists = fine

// POST /api/communication-letters — create letter record (called by TriagePanel on resubmission confirm)
app.post('/api/communication-letters', authMiddleware, async (req, res) => {
  const {
    submission_id, submission_ref, ip_type, ip_type_prefix,
    applicant_name, applicant_email, submission_title,
    missing_items, deficiency_notes, letter_date, letter_ref, status,
  } = req.body;

  if (!submission_id || !submission_ref || !ip_type)
    return res.status(400).json({ error: 'Missing required fields.' });

  try {
    const [result] = await pool.execute(
      `INSERT INTO communication_letters
       (submission_id, submission_ref, ip_type, ip_type_prefix,
        applicant_name, applicant_email, submission_title,
        missing_items, deficiency_notes, letter_date, letter_ref, status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        submission_id, submission_ref, ip_type, ip_type_prefix || '',
        applicant_name || '', applicant_email || '', submission_title || '',
        missing_items || '', deficiency_notes || '',
        letter_date || new Date().toLocaleDateString('en-PH'),
        letter_ref  || `${submission_ref}-COMM-${new Date().getFullYear()}`,
        status      || 'Pending Director Signature',
      ]
    );

    // Log in status history
    await pool.execute(
      `INSERT INTO submission_status_history
       (submission_prefix, submission_id, stage, status_date, completed, note)
       VALUES (?, ?, 'Communication Letter Drafted', NOW(), 0, ?)`,
      [ip_type_prefix || ip_type, submission_id,
       `Deficiency notice drafted. Missing: ${missing_items || 'See notes'}`]
    );

    // Notify admin of the new communication letter
    await createAdminNotification({
        type: 'communication',
        title: `Communication Letter — ${submission_ref}`,
        message: `A deficiency notice for ${ip_type} "${submission_title || 'Untitled'}" (${submission_ref}) has been drafted with ${missing_items ? missing_items.split(',').length : 0} missing item(s). Pending IPMO Director signature.`,
        submissionId: submission_id,
        submissionPrefix: ip_type_prefix || ip_type,
    });

    res.json({ message: 'Communication Letter created.', id: result.insertId, letter_ref });
  } catch (e) {
    console.error('[comm-letters] POST error:', e);
    res.status(500).json({ error: 'Failed to create communication letter.' });
  }
});

// GET /api/communication-letters — all letters (admin view)
app.get('/api/communication-letters', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM communication_letters ORDER BY created_at DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) {
    console.error('[comm-letters] GET error:', e);
    res.status(500).json({ error: 'Failed to fetch communication letters.' });
  }
});

// GET /api/communication-letters/pending — unsigned letters only (Director dashboard)
app.get('/api/communication-letters/pending', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM communication_letters
       WHERE status = 'Pending Director Signature'
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error('[comm-letters] GET pending error:', e);
    res.status(500).json({ error: 'Failed to fetch pending letters.' });
  }
});

// PUT /api/communication-letters/:id/mark-signed — Director marks letter as signed & issued
app.put('/api/communication-letters/:id/mark-signed', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.execute(
      `UPDATE communication_letters
       SET status = 'Signed & Issued', signed_at = NOW(), issued_at = NOW()
       WHERE id = ?`,
      [id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Letter not found.' });
    res.json({ message: 'Communication Letter marked as signed and issued.', id });
  } catch (e) {
    console.error('[comm-letters] mark-signed error:', e);
    res.status(500).json({ error: 'Failed to update letter status.' });
  }
});

// POST /api/notifications/comm-letter — admin notification when resubmission is triggered
app.post('/api/notifications/comm-letter', authMiddleware, async (req, res) => {
  const { submission_id, submission_ref, ip_type, applicant_name, title, missing_count } = req.body;
  try {
    const iconMap = {
      'Copyright':         { icon: 'bi bi-envelope-paper', color: 'text-info'    },
      'Trademark':         { icon: 'bi bi-envelope-paper', color: 'text-danger'  },
      'Industrial Design': { icon: 'bi bi-envelope-paper', color: 'text-success' },
      'Utility Model':     { icon: 'bi bi-envelope-paper', color: 'text-warning' },
    };
    const cfg = iconMap[ip_type] || { icon: 'bi bi-envelope-paper', color: 'text-warning' };

    await pool.execute(
      `INSERT INTO notifications
       (type, title, message, submission_id, submission_type, icon, icon_color)
       VALUES (?,?,?,?,?,?,?)`,
      [
        'comm_letter_pending',
        `Communication Letter — ${submission_ref}`,
        `Deficiency notice for ${ip_type} "${title || 'Untitled'}" (${submission_ref}) — ${missing_count || 0} missing item(s). Pending IPMO Director signature.`,
        submission_id, ip_type, cfg.icon, cfg.color,
      ]
    );
    res.json({ message: 'Admin notification created for communication letter.' });
  } catch (e) {
    console.error('[notifications/comm-letter] error:', e);
    res.status(500).json({ error: 'Failed to create notification.' });
  }
});

// =====================================
// TRACKER BACKEND
// =====================================

// Connected clients (SSE)
let trackerClients = [];

// Real-time event stream
app.get("/api/tracker/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    trackerClients.push(res);

    req.on("close", () => {
        trackerClients = trackerClients.filter(c => c !== res);
        res.end();
    });
});

function broadcastTrackerUpdate(data) {
    trackerClients.forEach(client => {
        client.write(`data: ${JSON.stringify(data)}\n\n`);
    });
}

// Table prefix mapping (um/id merged → umid_submissions)
const TABLES = {
    umid: "umid_submissions",
    tm:   "tm_submissions",
    cr:   "cr_submissions"
};

// =====================================
// GET ALL SUBMISSIONS (EXCLUDE HIDDEN)
// =====================================
// =====================================
// GET USER SPECIFIC SUBMISSIONS
// =====================================
app.get("/api/tracker/submissions", authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const userType = req.userType; // Assuming authMiddleware sets this

        // If user is ADMIN, they might want to see ALL (remove this if block if you want strict user-only)
        // For now, let's strictly follow your request: Filter by User ID.
        
        const TYPE_COL = { umid: 'ip_type', tm: 'mark_type', cr: 'work_type' };

        const queries = Object.entries(TABLES).map(([prefix, table]) => {
            const typeCol = TYPE_COL[prefix] || 'ip_type';
            let sql = `
                SELECT 
                    id,
                    title,
                    ${typeCol} AS submissionType,
                    filing_date AS date,
                    status,
                    endorsement_letter_path AS file_path,
                    ? AS prefix
                FROM ${table}
                WHERE (hidden_from_tracker IS NULL OR hidden_from_tracker = 0)
            `;

            const params = [prefix];

            if (userType !== 'ADMIN') {
                sql += ` AND user_id = ?`;
                params.push(userId);
            }
            
            return pool.execute(sql, params);
        });

        const results = await Promise.all(queries);

        const combined = results
            .flatMap(([rows]) => rows)
            .map(r => ({
                id: r.id,
                title: r.title,
                submissionType: r.submissionType,
                date: r.date ? new Date(r.date).toISOString().split("T")[0] : null,
                status: r.status ?? "New Submission",
                prefix: r.prefix,
                filePath: r.file_path ? `/uploads/${r.file_path}` : null
            }))
            .sort((a, b) => b.id - a.id);

        res.json(combined);
    } catch (err) {
        console.error("Error fetching submissions:", err);
        res.status(500).json({ error: "Failed to fetch submissions" });
    }
});
// =====================================
// GET SUBMISSION DETAILS (SECURED)
// =====================================
app.get("/api/tracker/submission/:prefix/:id", authMiddleware, async (req, res) => {
    const { prefix, id } = req.params;
    const userId = req.userId;
    const userType = req.userType;
    const table = TABLES[prefix];

    if (!table) return res.status(400).json({ error: "Invalid prefix" });

    try {
        // Build query to check ownership
        let query = `SELECT * FROM ${table} WHERE id = ?`;
        const params = [id];

        if (userType !== 'ADMIN') {
            query += ` AND user_id = ?`;
            params.push(userId);
        }

        const [[submission]] = await pool.execute(query, params);

        if (!submission) {
            // Returns 404 if it doesn't exist OR if it belongs to someone else
            return res.status(404).json({ error: "Not found or access denied" });
        }

        const [history] = await pool.execute(
            `SELECT stage, status_date, completed, note 
             FROM submission_status_history
             WHERE submission_prefix = ? AND submission_id = ?
             ORDER BY status_date ASC`,
            [prefix, id]
        );

        const timeline = history.length
            ? history.map(h => ({
                  stage: h.stage,
                  date: h.status_date
                      ? new Date(h.status_date).toISOString().split("T")[0]
                      : null,
                  completed: !!h.completed,
                  note: h.note || null
              }))
            : [
                  {
                      stage: "Project Pending",
                      date: submission.filing_date
                          ? new Date(submission.filing_date).toISOString().split("T")[0]
                          : null,
                      completed: true
                  },
                  submission.triage_date && {
                      stage: "Received by Admin",
                      date: new Date(submission.triage_date).toISOString().split("T")[0],
                      completed: true
                  },
                  {
                      stage: submission.status,
                      date: submission.triage_date
                          ? new Date(submission.triage_date).toISOString().split("T")[0]
                          : null,
                      completed: submission.status !== "New Submission"
                  }
              ].filter(Boolean);

        res.json({
            id: submission.id,
            title: submission.title,
            submissionType: submission.ip_type || submission.work_type || submission.mark_type || null,
            date: submission.filing_date
                ? new Date(submission.filing_date).toISOString().split("T")[0]
                : null,
            status: submission.status ?? "Submitted",
            prefix: prefix,
            filePath: submission.endorsement_letter_path
                ? `/uploads/${submission.endorsement_letter_path}`
                : null,
            timeline
        });
    } catch (err) {
        console.error("Error fetching submission details:", err);
        res.status(500).json({ error: "Failed to fetch details" });
    }
});

// =====================================
// UPDATE STATUS + REAL TIME
// =====================================
app.put("/api/tracker/submission/:prefix/:id/status", async (req, res) => {
    const { prefix, id } = req.params;
    const { stage, completed = 0, note = null, setStatus = null } = req.body;

    const table = TABLES[prefix];
    if (!table) return res.status(400).json({ error: "Invalid prefix" });
    if (!stage) return res.status(400).json({ error: "Missing stage" });

    try {
        const [ins] = await pool.execute(
            `INSERT INTO submission_status_history
             (submission_prefix, submission_id, stage, status_date, completed, note)
             VALUES (?, ?, ?, NOW(), ?, ?)`,
            [prefix, id, stage, completed ? 1 : 0, note]
        );

        if (setStatus) {
            await pool.execute(
                `UPDATE ${table}
                 SET status = ?, triage_date = NOW()
                 WHERE id = ?`,
                [setStatus, id]
            );
        }

        broadcastTrackerUpdate({
            id,
            prefix,
            stage,
            completed,
            note,
            setStatus
        });

        res.json({ message: "Status updated", insertedId: ins.insertId });
    } catch (err) {
        console.error("Error updating status:", err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// =====================================
// MARK SUBMISSION AS DONE
// Only for APPROVED or REJECTED submissions
// =====================================
app.put("/api/tracker/submission/:prefix/:id/done", async (req, res) => {
    const { prefix, id } = req.params;
    const table = TABLES[prefix];

    if (!table) {
        return res.status(400).json({ error: "Invalid prefix" });
    }

    try {
        // Get the current submission
        const [[submission]] = await pool.execute(
            `SELECT status FROM ${table} WHERE id = ?`,
            [id]
        );

        if (!submission) {
            return res.status(404).json({ error: "Submission not found" });
        }

        const status = submission.status;

        // Only allow DONE for APPROVED or REJECTED submissions
        if (status !== 'Rejected' && status !== 'Approved for Filing') {
            return res.status(400).json({ 
                error: "Can only mark APPROVED or REJECTED submissions as done",
                currentStatus: status
            });
        }

        if (status === 'Rejected') {
            // REJECTED: Delete from database completely
            await pool.execute(
                `DELETE FROM ${table} WHERE id = ?`,
                [id]
            );

            // Also delete from status history
            await pool.execute(
                `DELETE FROM submission_status_history 
                 WHERE submission_prefix = ? AND submission_id = ?`,
                [prefix, id]
            );

            console.log(`🗑️ DELETED rejected submission: ${prefix}-${id}`);
            
            // Broadcast update
            broadcastTrackerUpdate({
                action: 'done',
                id,
                prefix,
                removed: true,
                deleted: true
            });
            
            return res.json({ 
                success: true,
                message: "Rejected submission deleted from database",
                action: "deleted",
                id,
                prefix
            });

        } else if (status === 'Approved for Filing') {
            // APPROVED: Just hide from tracker (keep in database)
            await pool.execute(
                `UPDATE ${table} 
                 SET hidden_from_tracker = 1, 
                     done_date = NOW()
                 WHERE id = ?`,
                [id]
            );

            // Add to status history
            await pool.execute(
                `INSERT INTO submission_status_history
                 (submission_prefix, submission_id, stage, status_date, completed, note)
                 VALUES (?, ?, ?, NOW(), ?, ?)`,
                [prefix, id, 'Marked as Done', 1, 'Removed from tracker but kept in database']
            );

            console.log(`✅ HIDDEN from tracker: ${prefix}-${id} (kept in database)`);
            
            // Broadcast update
            broadcastTrackerUpdate({
                action: 'done',
                id,
                prefix,
                removed: true,
                deleted: false
            });
            
            return res.json({ 
                success: true,
                message: "Approved submission hidden from tracker",
                action: "hidden",
                id,
                prefix
            });
        }

    } catch (err) {
        console.error("❌ Error in DONE endpoint:", err);
        return res.status(500).json({ 
            error: "Failed to mark submission as done",
            details: err.message 
        });
    }
});
// =========================================
// ROLE PERMISSIONS ENDPOINTS
// =========================================

// =========================================
// GET ALL USERS — Admin User Accounts Table
// GET /api/admin/users
// NOTE: Must be registered BEFORE any /api/admin/users/:param routes
// =========================================
app.get('/api/admin/users', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.full_name, u.user_type,
                    u.profile_picture, u.created_at, u.approval_status,
                    u.is_active, u.contact, u.address
             FROM users u
             ORDER BY u.created_at DESC`
        );
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// =========================================
// UPDATE USER INFO — Admin User Accounts Table
// PUT /api/admin/users/:id
// NOTE: Must be registered BEFORE other PUT /api/admin/users/:param/* routes
// =========================================
app.put('/api/admin/users/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
    const { id } = req.params;
    const { fullName, email, newPassword } = req.body;

    if (!fullName || !email) {
        return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    try {
        // Check email uniqueness (exclude this user)
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? AND id != ?', [email, id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use by another account.' });
        }

        if (newPassword) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;
            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
                });
            }
            const passwordHash = await bcrypt.hash(newPassword, 12);
            await pool.query(
                'UPDATE users SET full_name = ?, email = ?, password_hash = ? WHERE id = ?',
                [fullName, email, passwordHash, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
                [fullName, email, id]
            );
        }

        await logAuditEntry({
            userId: req.userId,
            actionType: 'User Update',
            description: `Admin updated user ID ${id} (${email})`,
            metadata: { targetUserId: id, updatedFields: ['full_name', 'email', newPassword ? 'password' : null].filter(Boolean) }
        });

        const [[updated]] = await pool.query(
            'SELECT id, email, full_name, user_type, approval_status, created_at FROM users WHERE id = ?', [id]
        );

        res.json({ success: true, message: 'User updated successfully.', data: updated });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Failed to update user.', error: error.message });
    }
});

// Get pending approval users
app.get('/api/admin/users/pending', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.full_name, u.user_type, 
                    u.profile_picture, u.created_at, u.approval_status
             FROM users u
             WHERE u.approval_status = 'pending'
             ORDER BY u.created_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
    }
});
// Get rejected users
app.get('/api/admin/users/rejected', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.full_name, u.user_type,
                    u.profile_picture, u.created_at, u.rejection_reason, u.approval_status
             FROM users u
             WHERE u.approval_status = 'rejected'
             ORDER BY u.created_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching rejected users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rejected users' });
    }
});

// Approve a user
app.put('/api/admin/users/:userId/approve', authMiddleware, isAdminMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId } = req.params;
        const adminId = req.userId; // From JWT token
        
        // ✅ FIXED: Use is_active instead of status
        const [result] = await connection.query(
            `UPDATE users 
             SET approval_status = 'approved', 
                 is_active = 1,
                 approved_at = NOW(),
                 approved_by = ?
             WHERE id = ?`,
            [adminId, userId]
        );
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get updated user info
        const [[updatedUser]] = await connection.query(
            'SELECT id, email, full_name, approval_status FROM users WHERE id = ?',
            [userId]
        );
        
        await connection.commit();
        
        console.log(`✅ User approved: ${updatedUser.email}`);

        // Notify admin of role/permission change
        await createAdminNotification({
            type: 'role_change',
            title: 'User Account Approved',
            message: `${updatedUser.full_name} (${updatedUser.email}) has been approved and is now active.`,
            targetUserId: userId,
        });
        
        res.json({ 
            success: true, 
            message: 'User approved successfully',
            data: updatedUser
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error approving user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to approve user',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// =========================================
// REJECT USER
// =========================================
app.put('/api/admin/users/:userId/reject', authMiddleware, isAdminMiddleware, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { userId } = req.params;
        const { reason } = req.body;
        
        if (!reason || !reason.trim()) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }
        
        // ✅ FIXED: Use is_active instead of status
        const [result] = await connection.query(
            `UPDATE users 
             SET approval_status = 'rejected',
                 is_active = 0,
                 rejection_reason = ?
             WHERE id = ?`,
            [reason, userId]
        );
        
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
        
        // Get updated user info
        const [[updatedUser]] = await connection.query(
            'SELECT id, email, full_name, approval_status, rejection_reason FROM users WHERE id = ?',
            [userId]
        );
        
        await connection.commit();
        
        console.log(`❌ User rejected: ${updatedUser.email}`);

        // Notify admin of role/permission change
        await createAdminNotification({
            type: 'role_change',
            title: 'User Account Rejected',
            message: `${updatedUser.full_name} (${updatedUser.email}) has been rejected. Reason: ${reason}`,
            targetUserId: userId,
        });
        
        res.json({ 
            success: true, 
            message: 'User rejected',
            data: updatedUser
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error rejecting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to reject user',
            error: error.message
        });
    } finally {
        connection.release();
    }
});

// =========================================
// 1. GET INVENTORS
// =========================================
app.get('/api/admin/inventors', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [inventors] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name,
                u.contact, 
                u.address, 
                u.age, 
                u.birthdate, 
                u.profile_picture, 
                u.created_at,
                u.is_active,
                i.delivery_unit,
                i.total_submissions,
                i.approved_submissions,
                i.pending_submissions
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE u.user_type = 'INVENTOR' AND u.approval_status = 'approved'
             ORDER BY u.created_at DESC`
        );
        
        // Map is_active to status for frontend
        const mapped = inventors.map(inv => ({
            ...inv,
            status: inv.is_active ? 'active' : 'inactive'
        }));
        
        console.log(`✅ Fetched ${mapped.length} inventors`);
        res.json({ success: true, data: mapped });
    } catch (error) {
        console.error('❌ Error fetching inventors:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch inventors',
            error: error.message 
        });
    }
});

// =========================================
// 2. GET CONSULTANTS
// =========================================
app.get('/api/admin/consultants', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [consultants] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name,
                u.contact, 
                u.address,
                u.age, 
                u.birthdate, 
                u.profile_picture, 
                u.created_at,
                u.is_active,
                c.ip_category,
                c.specialization,
                c.years_of_experience,
                c.total_reviews,
                c.approved_reviews,
                c.rejected_reviews,
                c.expertise_area
             FROM users u
             LEFT JOIN consultants c ON u.id = c.user_id
             WHERE u.user_type = 'CONSULTANT' AND u.approval_status = 'approved'
             ORDER BY u.created_at DESC`
        );
        
        // Map data for frontend
        const mapped = consultants.map(c => ({
            ...c,
            status: c.is_active ? 'active' : 'inactive',
            expertise_area: c.expertise_area || c.ip_category || c.specialization || 'General Consultation',
            delivery_unit: c.ip_category || c.specialization || 'General',
            position: 'Consultant',
            contact: null
        }));
        
        console.log(`✅ Fetched ${mapped.length} consultants`);
        res.json({ success: true, data: mapped });
    } catch (error) {
        console.error('❌ Error fetching consultants:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch consultants',
            error: error.message 
        });
    }
});

// =========================================
// 3. GET PENDING USERS (Role Permissions)
// =========================================
app.get('/api/admin/users/pending', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name,
                u.contact, 
                u.address,
                u.age, 
                u.birthdate, 
                u.user_type, 
                u.profile_picture, 
                u.created_at, 
                u.approval_status,
                CASE 
                    WHEN u.user_type = 'INVENTOR' THEN i.delivery_unit
                    WHEN u.user_type = 'CONSULTANT' THEN c.ip_category
                    ELSE NULL
                END as delivery_unit
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id AND u.user_type = 'INVENTOR'
             LEFT JOIN consultants c ON u.id = c.user_id AND u.user_type = 'CONSULTANT'
             WHERE u.approval_status = 'pending'
             ORDER BY u.created_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending users' });
    }
});
app.put('/api/admin/users/:userId/toggle-access', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { is_active } = req.body;

        // Validate input
        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_active must be a boolean value'
            });
        }

        // Get user info before update
        const [userBefore] = await pool.query(
            'SELECT full_name, user_type, is_active FROM users WHERE id = ?',
            [userId]
        );

        if (userBefore.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deactivating themselves
        if (parseInt(userId) === req.userId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Update user status
        await pool.query(
            'UPDATE users SET is_active = ? WHERE id = ?',
            [is_active, userId]
        );

        // Log audit entry
        await logAuditEntry({
            userId: req.userId,
            actionType: 'Status Change',
            description: `${is_active ? 'Activated' : 'Deactivated'} user: ${userBefore[0].full_name} (${userBefore[0].user_type})`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            metadata: {
                targetUserId: userId,
                targetUserName: userBefore[0].full_name,
                targetUserType: userBefore[0].user_type,
                previousStatus: userBefore[0].is_active,
                newStatus: is_active
            }
        });

        console.log(`✅ User ${userId} access ${is_active ? 'activated' : 'deactivated'} by admin ${req.userId}`);

        // Notify admin of role/permission change
        await createAdminNotification({
            type: 'role_change',
            title: `User Access ${is_active ? 'Activated' : 'Deactivated'}`,
            message: `${userBefore[0].full_name} (${userBefore[0].user_type})'s account has been ${is_active ? 'activated' : 'deactivated'}.`,
            targetUserId: userId,
        });
        
        res.json({
            success: true,
            message: `User access ${is_active ? 'activated' : 'deactivated'} successfully`,
            data: {
                userId: userId,
                is_active: is_active,
                status: is_active ? 'active' : 'inactive'
            }
        });

    } catch (error) {
        console.error('❌ Error toggling user access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle user access',
            error: error.message
        });
    }
});

// =========================================
// 4. GET APPROVED USERS (Role Permissions)
// =========================================
app.get('/api/admin/users/approved', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name, 
                u.user_type,
                u.profile_picture, 
                u.created_at, 
                u.approved_at, 
                u.approval_status,
                u.address,
                u.age,
                u.birthdate,
                CASE 
                    WHEN u.user_type = 'INVENTOR' THEN i.delivery_unit
                    WHEN u.user_type = 'CONSULTANT' THEN c.ip_category
                    ELSE NULL
                END as delivery_unit
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id AND u.user_type = 'INVENTOR'
             LEFT JOIN consultants c ON u.id = c.user_id AND u.user_type = 'CONSULTANT'
             WHERE u.approval_status = 'approved'
             ORDER BY u.approved_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch approved users' });
    }
});

// =========================================
// 5. GET REJECTED USERS (Role Permissions)
// =========================================
app.get('/api/admin/users/rejected', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT 
                u.id, 
                u.email, 
                u.full_name, 
                u.user_type,
                u.profile_picture, 
                u.created_at, 
                u.rejection_reason, 
                u.approval_status,
                CASE 
                    WHEN u.user_type = 'INVENTOR' THEN i.delivery_unit
                    WHEN u.user_type = 'CONSULTANT' THEN c.ip_category
                    ELSE NULL
                END as delivery_unit
             FROM users u
             LEFT JOIN inventors i ON u.id = i.user_id AND u.user_type = 'INVENTOR'
             LEFT JOIN consultants c ON u.id = c.user_id AND u.user_type = 'CONSULTANT'
             WHERE u.approval_status = 'rejected'
             ORDER BY u.created_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching rejected users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rejected users' });
    }
});
// ============================================
// ACTIVE REVIEWS AND FINALIZED PROJECT END POINTS
// ============================================//
app.get('/api/admin/active-reviews', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const queries = [
            // UMID (Utility Model + Industrial Design — merged)
            `SELECT 
                s.id,
                s.ip_type as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'Unassigned' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                s.created_at as submission_date,
                s.assigned_at as assigned_date,
                DATEDIFF(NOW(), COALESCE(s.assigned_at, s.created_at)) as days_active,
                NULL as comments
             FROM umid_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Under Re-review', 'Revision Required', 'Pending Resubmission', 'Resubmission', 'Resubmitted')`,
            
            // Trademark
            `SELECT 
                s.id,
                'TM' as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'Unassigned' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                s.created_at as submission_date,
                s.assigned_at as assigned_date,
                DATEDIFF(NOW(), COALESCE(s.assigned_at, s.created_at)) as days_active,
                NULL as comments
             FROM tm_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Under Re-review', 'Revision Required', 'Pending Resubmission', 'Resubmission', 'Resubmitted')`,
            
            // Copyright
            `SELECT 
                s.id,
                'CR' as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'Unassigned' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                s.created_at as submission_date,
                s.assigned_at as assigned_date,
                DATEDIFF(NOW(), COALESCE(s.assigned_at, s.created_at)) as days_active,
                NULL as comments
             FROM cr_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Revision Required')`
        ];

        const results = await Promise.all(queries.map(query => pool.query(query)));
        const activeReviews = results.flatMap(([rows]) => rows);
        activeReviews.sort((a, b) => (b.days_active || 0) - (a.days_active || 0));

        console.log(`✅ Fetched ${activeReviews.length} active reviews`);
        res.json({ success: true, data: activeReviews });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch', error: error.message });
    }
});

// FINALIZED PROJECTS - Now fetches Delivery Unit from inventors table
app.get('/api/admin/finalized-projects', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const queries = [
            // UMID (merged)
            `SELECT 
                s.id,
                s.ip_type as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'System' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                CASE 
                    WHEN s.status LIKE '%Approved%' OR s.status = 'DONE' THEN 'Approved'
                    WHEN s.status LIKE '%Rejected%' THEN 'Rejected' 
                    ELSE 'Unknown' 
                END as final_result,
                s.created_at as submission_date,
                COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date) as finalized_date,
                DATEDIFF(COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date, NOW()), s.created_at) as duration_days,
                s.final_comments,
                s.rejection_reason
             FROM umid_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Approved for Filing', 'Rejected', 'DONE')`,
            
            // Trademark
            `SELECT 
                s.id,
                'TM' as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'System' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                CASE 
                    WHEN s.status LIKE '%Approved%' OR s.status = 'DONE' THEN 'Approved'
                    WHEN s.status LIKE '%Rejected%' THEN 'Rejected' 
                    ELSE 'Unknown' 
                END as final_result,
                s.created_at as submission_date,
                COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date) as finalized_date,
                DATEDIFF(COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date, NOW()), s.created_at) as duration_days,
                s.final_comments,
                s.rejection_reason
             FROM tm_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Approved for Filing', 'Rejected', 'DONE')`,
            
            // Copyright
            `SELECT 
                s.id,
                'CR' as ip_type,
                s.title,
                u.full_name as applicant_name,
                u.email as applicant_email,
                COALESCE(i.delivery_unit, 'N/A') as delivery_unit,
                'System' as consultant_name,
                'N/A' as consultant_specialization,
                s.status,
                CASE 
                    WHEN s.status LIKE '%Approved%' OR s.status = 'DONE' THEN 'Approved'
                    WHEN s.status LIKE '%Rejected%' THEN 'Rejected' 
                    ELSE 'Unknown' 
                END as final_result,
                s.created_at as submission_date,
                COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date) as finalized_date,
                DATEDIFF(COALESCE(s.approval_date, s.rejection_date, s.done_date, s.filing_date, NOW()), s.created_at) as duration_days,
                s.final_comments,
                s.rejection_reason
             FROM cr_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Approved for Filing', 'Rejected', 'DONE')`
        ];

        const results = await Promise.all(queries.map(query => pool.query(query)));
        const finalizedProjects = results.flatMap(([rows]) => rows);
        finalizedProjects.sort((a, b) => {
            const dateA = a.finalized_date ? new Date(a.finalized_date) : new Date(0);
            const dateB = b.finalized_date ? new Date(b.finalized_date) : new Date(0);
            return dateB - dateA;
        });

        console.log(`✅ Fetched ${finalizedProjects.length} finalized projects`);
        res.json({ success: true, data: finalizedProjects });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch', error: error.message });
    }
});
// GET System Audit Logs
// SYSTEM AUDIT ENDPOINT WITH FULL AUDIT_LOGS SUPPORT
app.get('/api/admin/system-audit', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { 
            action_type = 'all',
            user_type = 'all',
            start_date = null,
            end_date = null,
            limit = 500 
        } = req.query;

        let query = `
            SELECT 
                id,
                user_id,
                user_name,
                user_type,
                action_type,
                description,
                ip_address,
                user_agent,
                submission_id,
                submission_type,
                metadata,
                timestamp
            FROM audit_logs
            WHERE 1=1
        `;

        const params = [];

        // Filter by action type
        if (action_type && action_type !== 'all') {
            query += ' AND action_type = ?';
            params.push(action_type);
        }

        // Filter by user type
        if (user_type && user_type !== 'all') {
            query += ' AND user_type = ?';
            params.push(user_type);
        }

        // Filter by date range
        if (start_date) {
            query += ' AND timestamp >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND timestamp <= ?';
            params.push(end_date + ' 23:59:59');
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(parseInt(limit));

        const [logs] = await pool.query(query, params);

        // Parse JSON metadata for each log
        const processedLogs = logs.map(log => ({
    ...log,
    metadata: log.metadata || null
}));

        console.log(`✅ Fetched ${processedLogs.length} audit logs`);
        
        res.json({ 
            success: true, 
            data: processedLogs,
            count: processedLogs.length
        });

    } catch (error) {
        console.error('❌ Error fetching system audit logs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch audit logs',
            error: error.message 
        });
    }
});

// DELETE System Audit Logs (Cleanup after Export)
app.delete('/api/admin/system-audit', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { 
            action_type = 'all',
            user_type = 'all',
            start_date = null,
            end_date = null
        } = req.query;

        // Base delete query
        let deleteQuery = `DELETE FROM audit_logs WHERE 1=1`;
        const params = [];

        // 1. Filter by action type
        if (action_type && action_type !== 'all') {
            deleteQuery += ' AND action_type = ?';
            params.push(action_type);
        }

        // 2. Filter by user type
        if (user_type && user_type !== 'all') {
            deleteQuery += ' AND user_type = ?';
            params.push(user_type);
        }

        // 3. Filter by date range (Crucial for safety)
        if (start_date) {
            deleteQuery += ' AND timestamp >= ?';
            params.push(start_date);
        }

        if (end_date) {
            deleteQuery += ' AND timestamp <= ?';
            params.push(end_date + ' 23:59:59');
        }

        // 4. Safety Guard: Prevent accidental full table wipe if no filters are provided
        if (params.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Refusing to delete all logs. Please provide date filters.' 
            });
        }

        const [result] = await pool.query(deleteQuery, params);

        console.log(`🗑️ Deleted ${result.affectedRows} audit logs`);

        res.json({ 
            success: true, 
            message: `Successfully deleted ${result.affectedRows} logs.`,
            deletedCount: result.affectedRows
        });

    } catch (error) {
        console.error('❌ Error deleting system audit logs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete audit logs',
            error: error.message 
        });
    }
});
// ============================================
// DASHBOARD & ADMIN SETTING ENDPOINTS
// Add to ipms2.js
// ============================================

// =========================================
// DASHBOARD STATS ENDPOINT
// =========================================
app.get('/api/admin/dashboard-stats', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const { range = 'all' } = req.query;
        
        // Calculate date filter based on range
        let dateFilter = '';
        const now = new Date();
        if (range === 'today') {
            dateFilter = `AND DATE(created_at) = CURDATE()`;
        } else if (range === 'week') {
            const weekAgo = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
            dateFilter = `AND created_at >= '${weekAgo}'`;
        } else if (range === 'month') {
            const monthAgo = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
            dateFilter = `AND created_at >= '${monthAgo}'`;
        }

        // Get submission stats
        const submissionQueries = [
            // Total submissions
            `SELECT COUNT(*) as total FROM (
                SELECT id FROM umid_submissions
                UNION ALL SELECT id FROM tm_submissions
                UNION ALL SELECT id FROM cr_submissions
            ) as all_subs`,
            
            // New submissions (pending)
            `SELECT COUNT(*) as new FROM (
                SELECT id FROM umid_submissions WHERE status = 'Submitted'
                UNION ALL SELECT id FROM tm_submissions WHERE status = 'Submitted'
                UNION ALL SELECT id FROM cr_submissions WHERE status = 'Submitted'
            ) as new_subs`,
            
            // New today
            `SELECT COUNT(*) as newToday FROM (
                SELECT id FROM umid_submissions WHERE DATE(created_at) = CURDATE()
                UNION ALL SELECT id FROM tm_submissions WHERE DATE(created_at) = CURDATE()
                UNION ALL SELECT id FROM cr_submissions WHERE DATE(created_at) = CURDATE()
            ) as today_subs`,
            
            // Completed
            `SELECT COUNT(*) as completed FROM (
                SELECT id FROM umid_submissions WHERE status IN ('Approved for Filing', 'DONE')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Approved for Filing', 'DONE')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Approved for Filing', 'DONE')
            ) as completed_subs`,
            
            // Completed today
            `SELECT COUNT(*) as completedToday FROM (
                SELECT id FROM umid_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
            ) as completed_today`,
            
            // Approved
            `SELECT COUNT(*) as approved FROM (
                SELECT id FROM umid_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
                UNION ALL SELECT id FROM tm_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
                UNION ALL SELECT id FROM cr_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
            ) as approved_subs`,
            
            // Rejected
            `SELECT COUNT(*) as rejected FROM (
                SELECT id FROM umid_submissions WHERE status LIKE '%Rejected%'
                UNION ALL SELECT id FROM tm_submissions WHERE status LIKE '%Rejected%'
                UNION ALL SELECT id FROM cr_submissions WHERE status LIKE '%Rejected%'
            ) as rejected_subs`,
            
            // Pending review
            `SELECT COUNT(*) as pending FROM (
                SELECT id FROM umid_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Under Review', 'Revision Required')
            ) as pending_subs`
        ];

        const [totalRes, newRes, newTodayRes, completedRes, completedTodayRes, approvedRes, rejectedRes, pendingRes] = 
            await Promise.all(submissionQueries.map(q => pool.query(q)));

        const submissions = {
            total: totalRes[0][0].total,
            new: newRes[0][0].new,
            newToday: newTodayRes[0][0].newToday,
            completed: completedRes[0][0].completed,
            completedToday: completedTodayRes[0][0].completedToday,
            approved: approvedRes[0][0].approved,
            rejected: rejectedRes[0][0].rejected,
            pending: pendingRes[0][0].pending,
            avgProcessingDays: 14 // Placeholder - calculate if needed
        };

        // Get reviews stats
        const [[reviewsData]] = await pool.query(`
            SELECT COUNT(*) as active FROM (
                SELECT id FROM umid_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Under Review', 'Revision Required')
            ) as active_reviews
        `);

        const reviews = {
            active: reviewsData.active
        };

        // Get users stats
        const [[usersTotal]] = await pool.query('SELECT COUNT(*) as total FROM users');
        const [[usersInventors]] = await pool.query('SELECT COUNT(*) as inventors FROM inventors');
        const [[usersConsultants]] = await pool.query('SELECT COUNT(*) as consultants FROM consultants');
        const [[usersActiveToday]] = await pool.query(`
            SELECT COUNT(DISTINCT user_id) as activeToday FROM login_logs 
            WHERE DATE(login_time) = CURDATE() AND login_status = 'SUCCESS'
        `);

        const users = {
            total: usersTotal.total,
            inventors: usersInventors.inventors,
            consultants: usersConsultants.consultants,
            activeToday: usersActiveToday.activeToday
        };

        // Get IP type breakdown
        const [[umidCount]] = await pool.query('SELECT COUNT(*) as count FROM umid_submissions');
        const [[tmCount]]   = await pool.query('SELECT COUNT(*) as count FROM tm_submissions');
        const [[crCount]]   = await pool.query('SELECT COUNT(*) as count FROM cr_submissions');

        const ipTypeBreakdown = {
            UMID: umidCount.count,
            TM:   tmCount.count,
            CR:   crCount.count
        };

        // Calculate approval rate
        const approvalRate = submissions.total > 0 
            ? (submissions.approved / submissions.total) * 100 
            : 0;

        // Get users by delivery unit
        const [deliveryUnitResults] = await pool.query(`
            SELECT 
                i.delivery_unit,
                COUNT(*) as user_count
            FROM inventors i
            INNER JOIN users u ON i.user_id = u.id
            WHERE u.is_active = 1 AND u.approval_status = 'approved'
            GROUP BY i.delivery_unit
            ORDER BY user_count DESC
        `);

        const usersByDeliveryUnit = {};
        deliveryUnitResults.forEach(row => {
            const unitName = row.delivery_unit || 'Unassigned';
            usersByDeliveryUnit[unitName] = row.user_count;
        });

        const dashboardData = {
            submissions,
            reviews,
            users,
            ipTypeBreakdown,
            approvalRate,
            usersByDeliveryUnit
        };

        console.log('✅ Dashboard stats fetched successfully');
        res.json({ success: true, data: dashboardData });
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard stats',
            error: error.message 
        });
    }
});

// =========================================
// SPECIALIST / CONSULTANT DASHBOARD STATS
// GET /api/specialist/dashboard-stats
// Returns data scoped to the logged-in consultant's own cases.
// =========================================
app.get('/api/specialist/dashboard-stats', authMiddleware, async (req, res) => {
    if (req.userType !== 'CONSULTANT') {
        return res.status(403).json({ success: false, message: 'Access denied. Consultant account required.' });
    }

    try {
        const consultantId = req.userId;

        // ── Summary counts: MY cases only ──────────────────────
        // Assigned (not yet started)
        const [[assignedRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ? AND status = 'Assigned'
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ? AND status = 'Assigned'
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ? AND status = 'Assigned'
            ) t
        `, [consultantId, consultantId, consultantId]);

        // Under Review (in progress)
        const [[reviewRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ? AND status = 'Under Review'
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ? AND status = 'Under Review'
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ? AND status = 'Under Review'
            ) t
        `, [consultantId, consultantId, consultantId]);

        // Pending Resubmission (waiting for inventor)
        const [[resubPendRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ? AND status IN ('Pending Resubmission','Resubmission')
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ? AND status IN ('Pending Resubmission','Resubmission')
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ? AND status IN ('Pending Resubmission','Resubmission')
            ) t
        `, [consultantId, consultantId, consultantId]);

        // Approved for Filing (done, awaiting PAS)
        const [[approvedRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ? AND status = 'Approved for Filing'
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ? AND status = 'Approved for Filing'
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ? AND status = 'Approved for Filing'
            ) t
        `, [consultantId, consultantId, consultantId]);

        // Resubmitted docs received (inventor acted)
        const [[resubSubRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ? AND status = 'Resubmitted'
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ? AND status = 'Resubmitted'
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ? AND status = 'Resubmitted'
            ) t
        `, [consultantId, consultantId, consultantId]);

        // Total assigned to me (all statuses)
        const [[totalRow]] = await pool.query(`
            SELECT COUNT(*) AS v FROM (
                SELECT id FROM umid_submissions WHERE assigned_to_consultant = ?
                UNION ALL
                SELECT id FROM tm_submissions   WHERE assigned_to_consultant = ?
                UNION ALL
                SELECT id FROM cr_submissions   WHERE assigned_to_consultant = ?
            ) t
        `, [consultantId, consultantId, consultantId]);

        // ── IP Type breakdown for MY cases ─────────────────────
        const [[umidCount]] = await pool.query(
            `SELECT COUNT(*) AS count FROM umid_submissions WHERE assigned_to_consultant = ? AND ip_type = 'Utility Model'`,
            [consultantId]
        );
        const [[idCount]] = await pool.query(
            `SELECT COUNT(*) AS count FROM umid_submissions WHERE assigned_to_consultant = ? AND ip_type = 'Industrial Design'`,
            [consultantId]
        );
        const [[tmCount]] = await pool.query(
            `SELECT COUNT(*) AS count FROM tm_submissions WHERE assigned_to_consultant = ?`,
            [consultantId]
        );
        const [[crCount]] = await pool.query(
            `SELECT COUNT(*) AS count FROM cr_submissions WHERE assigned_to_consultant = ?`,
            [consultantId]
        );

        // ── Approval rate for MY cases ─────────────────────────
        const total    = totalRow.v;
        const approved = approvedRow.v;
        const resubTotal = resubPendRow.v + resubSubRow.v;

        // ── My Active Cases (all active, sorted by assigned_at ASC = oldest first = most urgent) ──
        const [recentRows] = await pool.query(`
            SELECT id, title, 'UM' AS type, user_id, assigned_at, created_at AS dateFiled, status
            FROM umid_submissions
            WHERE assigned_to_consultant = ?
              AND status NOT IN ('Filed to IPOPHL', 'DONE', 'Rejected')
            UNION ALL
            SELECT id, title, 'TM' AS type, user_id, assigned_at, created_at AS dateFiled, status
            FROM tm_submissions
            WHERE assigned_to_consultant = ?
              AND status NOT IN ('Filed to IPOPHL', 'DONE', 'Rejected')
            UNION ALL
            SELECT id, title, 'CR' AS type, user_id, assigned_at, created_at AS dateFiled, status
            FROM cr_submissions
            WHERE assigned_to_consultant = ?
              AND status NOT IN ('Filed to IPOPHL', 'DONE', 'Rejected')
            ORDER BY assigned_at ASC
            LIMIT 50
        `, [consultantId, consultantId, consultantId]);

        const recentSubmissions = await Promise.all(recentRows.map(async (row) => {
            const [[user]] = await pool.query('SELECT full_name FROM users WHERE id = ?', [row.user_id]);
            return {
                ...row,
                inventor:   user ? user.full_name : 'Unknown',
                dateFiled:  row.dateFiled  ? new Date(row.dateFiled).toISOString()  : null,
                assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : null,
            };
        }));

        console.log(`✅ Specialist dashboard stats fetched for consultant ${consultantId}`);
        res.json({
            success: true,
            data: {
                // Summary cards
                myCases: {
                    assigned:    assignedRow.v,
                    underReview: reviewRow.v,
                    pendingResub: resubPendRow.v,
                    approved:    approvedRow.v,
                },
                // Secondary stats
                submissions: {
                    total,
                    underReview: reviewRow.v,
                    approved,
                },
                // Resubmission details
                resubmissions: {
                    total:     resubTotal,
                    pending:   resubPendRow.v,
                    submitted: resubSubRow.v,
                },
                // IP breakdown
                ipTypeBreakdown: {
                    UM: umidCount.count,
                    ID: idCount.count,
                    TM: tmCount.count,
                    CR: crCount.count,
                },
                // My Active Cases table
                recentSubmissions,
                approvalRate: total > 0 ? (approved / total) * 100 : 0,
            }
        });

    } catch (error) {
        console.error('❌ Specialist dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message
        });
    }
});


// =========================================
// ADMIN PROFILE ENDPOINTS
// =========================================

// GET Admin Profile
app.get('/api/admin/profile', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // ❌ OLD (Caused Error): const userId = req.user.id;
        const userId = req.userId; // ✅ NEW: Matches authMiddleware
        
        const [[user]] = await pool.query(
            'SELECT id, email, full_name, profile_picture, user_type FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        console.log('✅ Profile fetched successfully');
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile',
            error: error.message 
        });
    }
});

// UPDATE Admin Profile
app.put('/api/admin/profile', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        // ❌ OLD (Caused Error): const userId = req.user.id;
        const userId = req.userId; // ✅ NEW: Matches authMiddleware

        const { full_name, email, profile_picture } = req.body;

        // Check if email is already taken by another user
        if (email) {
            const [[existing]] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existing) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already in use' 
                });
            }
        }

        await pool.query(
            'UPDATE users SET full_name = ?, email = ?, profile_picture = ? WHERE id = ?',
            [full_name, email, profile_picture, userId]
        );

        console.log('✅ Profile updated successfully');
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile',
            error: error.message 
        });
    }
});

app.post('/api/users/profile-picture', authMiddleware, profileUpload.single('profilePicture'), handleMulterError, async (req, res) => {
    try {
        const userId = req.userId; // From authMiddleware
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filename = req.file.filename;
        const fileUrl = `/uploads/profile-pictures/${filename}`;

        // Get old profile picture to delete it
        const [users] = await pool.query(
            'SELECT profile_picture FROM users WHERE id = ?',
            [userId]
        );

        const oldPicture = users[0]?.profile_picture;

        // Update database with new picture
        await pool.query(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [filename, userId]
        );

        // Delete old picture file (if exists and not default)
        if (oldPicture && !oldPicture.startsWith('http')) {
            const oldPath = path.join(__dirname, 'uploads', 'profile-pictures', oldPicture);
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                    console.log('✅ Old profile picture deleted:', oldPicture);
                } catch (err) {
                    console.error('⚠️ Could not delete old picture:', err.message);
                }
            }
        }

        console.log('✅ Profile picture uploaded:', filename);
        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            filename: filename,
            url: fileUrl
        });

    } catch (error) {
        console.error('❌ Error uploading profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture',
            error: error.message
        });
    }
});

// ================================================================
// PROFILE PICTURE DELETE ENDPOINT
// ================================================================
/**
 * DELETE /api/users/profile-picture
 * Remove profile picture (set to null)
 */
app.delete('/api/users/profile-picture', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;

        // Get current profile picture
        const [users] = await pool.query(
            'SELECT profile_picture FROM users WHERE id = ?',
            [userId]
        );

        const currentPicture = users[0]?.profile_picture;

        // Update database (set to null)
        await pool.query(
            'UPDATE users SET profile_picture = NULL WHERE id = ?',
            [userId]
        );

        // Delete file (if exists and not default)
        if (currentPicture && !currentPicture.startsWith('http')) {
            const filePath = path.join(__dirname, 'uploads', 'profile-pictures', currentPicture);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('✅ Profile picture file deleted:', currentPicture);
                } catch (err) {
                    console.error('⚠️ Could not delete picture file:', err.message);
                }
            }
        }

        console.log('✅ Profile picture removed for user:', userId);
        res.json({
            success: true,
            message: 'Profile picture removed successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete profile picture',
            error: error.message
        });
    }
});

// ================================================================
// UPDATE USER PROFILE ENDPOINT (For all user types)
// ================================================================
app.put('/api/users/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { 
            full_name,
            email,
            contact,
            address,
            birthdate,
            age,
            about,
            specialization,
            department,
            position,
            delivery_unit,
        } = req.body;

        // Validate email if provided
        if (email) {
            const [existing] = await pool.query(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, userId]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(full_name);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        // ✅ ADD CONTACT UPDATE
        if (contact !== undefined) {
            updates.push('contact = ?');
            values.push(contact);
        }
        if (address !== undefined) {
            updates.push('address = ?');
            values.push(address);
        }
        if (birthdate !== undefined) {
            updates.push('birthdate = ?');
            values.push(birthdate);
        }
        if (age !== undefined) {
            updates.push('age = ?');
            values.push(age);
        }
        if (position !== undefined) {
            updates.push('position = ?');
            values.push(position);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Update users table
        values.push(userId);
        await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Update type-specific tables if needed
        const [user] = await pool.query('SELECT user_type FROM users WHERE id = ?', [userId]);
        const userType = user[0]?.user_type;

        // Update inventors table if Inventor
        if (userType === 'Inventor' && delivery_unit !== undefined) {
            const trimmedUnit = delivery_unit.trim();
            if (!VALID_DELIVERY_UNITS.includes(trimmedUnit)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid delivery unit. Must be one of: ${VALID_DELIVERY_UNITS.join(', ')}`
                });
            }
            await pool.query(
                'UPDATE inventors SET delivery_unit = ? WHERE user_id = ?',
                [trimmedUnit, userId]
            );
        }

        if (userType === 'Consultant' && (specialization !== undefined || about !== undefined)) {
            const consultantUpdates = [];
            const consultantValues = [];

            if (about !== undefined) {
                consultantUpdates.push('about = ?');
                consultantValues.push(about);
            }

            if (consultantUpdates.length > 0) {
                consultantValues.push(userId);
                await pool.query(
                    `UPDATE consultants SET ${consultantUpdates.join(', ')} WHERE user_id = ?`,
                    consultantValues
                );
            }
        }

        if (userType === 'Admin' && department !== undefined) {
            await pool.query(
                'UPDATE admins SET department = ? WHERE user_id = ?',
                [department, userId]
            );
        }

        console.log('✅ Profile updated successfully for user:', userId);
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

// ================================================================
// PASSWORD CHANGE ENDPOINT
// Add this to your index.js file (around line 2900-3000, near other user profile endpoints)
// ================================================================

/**
 * PUT /api/users/change-password
 * Change user password (works for all user types: Admin, Inventor, Consultant)
 */
app.put('/api/users/change-password', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password format
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and at least one special character (!@#$%^&* etc.)'
            });
        }

        // Check if current password and new password are the same
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Get user's current password hash
        const [users] = await pool.query(
            'SELECT password_hash, email, full_name FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await pool.query(
            'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
            [newPasswordHash, userId]
        );

        // Log the password change for audit
        await logAuditEntry({
            userId: userId,
            actionType: 'Profile Update',
            description: `Password changed for user: ${user.full_name} (${user.email})`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        console.log('✅ Password changed successfully for user:', userId);
        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
});

// ================================================================
// GET PROFILE PICTURE URL HELPER
// ================================================================
/**
 * GET /api/users/profile-picture/:userId
 * Get profile picture URL for a specific user (optional - for admin)
 */
app.get('/api/users/profile-picture/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        const [users] = await pool.query(
            'SELECT profile_picture FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const profilePicture = users[0].profile_picture;
        const url = profilePicture
            ? `/uploads/profile-pictures/${profilePicture}`
            : null;

        res.json({
            success: true,
            profile_picture: profilePicture,
            url: url
        });

    } catch (error) {
        console.error('❌ Error getting profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile picture',
            error: error.message
        });
    }
});
// ================================================================
// ASSIGNMENT SYSTEM
// Admin assigns submitted IP applications to consultants.
// Consultant views their own assigned queue.
// ================================================================

// ── GET  /api/admin/pending-submissions ──────────────────────
// Returns all Submitted rows across umid, tm, cr tables
// joined with inventor name + email. Admin only.
app.get('/api/admin/pending-submissions', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                'umid'           AS prefix,
                s.id,
                s.ip_type        AS ip_type,
                s.ip_type        AS project_type,
                s.title,
                s.filing_date    AS date_submitted,
                s.status,
                s.assigned_to_consultant,
                u.full_name      AS inventor_name,
                u.email          AS inventor_email,
                i.delivery_unit
            FROM umid_submissions s
            LEFT JOIN users     u ON s.user_id  = u.id
            LEFT JOIN inventors i ON u.id        = i.user_id
            WHERE s.status = 'Submitted' OR s.status IS NULL

            UNION ALL

            SELECT
                'tm'             AS prefix,
                s.id,
                'Trademark'      AS ip_type,
                s.mark_type      AS project_type,
                s.title,
                s.filing_date    AS date_submitted,
                s.status,
                s.assigned_to_consultant,
                u.full_name      AS inventor_name,
                u.email          AS inventor_email,
                i.delivery_unit
            FROM tm_submissions s
            LEFT JOIN users     u ON s.user_id  = u.id
            LEFT JOIN inventors i ON u.id        = i.user_id
            WHERE s.status = 'Submitted' OR s.status IS NULL

            UNION ALL

            SELECT
                'cr'             AS prefix,
                s.id,
                'Copyright'      AS ip_type,
                s.work_type      AS project_type,
                s.title,
                s.filing_date    AS date_submitted,
                s.status,
                s.assigned_to_consultant,
                u.full_name      AS inventor_name,
                u.email          AS inventor_email,
                i.delivery_unit
            FROM cr_submissions s
            LEFT JOIN users     u ON s.user_id  = u.id
            LEFT JOIN inventors i ON u.id        = i.user_id
            WHERE s.status = 'Submitted' OR s.status IS NULL

            ORDER BY date_submitted DESC
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error fetching pending submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending submissions',
            error: error.message
        });
    }
});

// ── PUT  /api/admin/assign-submission ────────────────────────
// Assigns a submission to a consultant.
// Body: { prefix, submissionId, consultantId }
app.put('/api/admin/assign-submission', authMiddleware, isAdminMiddleware, async (req, res) => {
    const { prefix, submissionId, consultantId } = req.body;

    const tableMap = {
        umid: 'umid_submissions',
        tm:   'tm_submissions',
        cr:   'cr_submissions',
    };
    const table = tableMap[prefix];

    if (!table)
        return res.status(400).json({ success: false, message: 'Invalid prefix. Use umid, tm, or cr.' });
    if (!submissionId || !consultantId)
        return res.status(400).json({ success: false, message: 'submissionId and consultantId are required.' });

    try {
        // Verify the consultant is active and approved
        const [[consultant]] = await pool.query(
            `SELECT u.id, u.full_name
             FROM users u
             WHERE u.id = ?
               AND u.user_type        = 'CONSULTANT'
               AND u.approval_status  = 'approved'
               AND u.is_active        = 1`,
            [consultantId]
        );

        if (!consultant)
            return res.status(404).json({ success: false, message: 'Consultant not found or is inactive.' });

        // Assign the submission — status moves to 'Assigned' so it lands
        // in the consultant's Assigned Submissions list first.
        // The consultant must click Review to move it to 'Under Review'.
        await pool.execute(
            `UPDATE ${table}
             SET assigned_to_consultant = ?,
                 status                 = 'Assigned',
                 assigned_at            = NOW()
             WHERE id = ?`,
            [consultantId, submissionId]
        );

        // Log to status history
        await pool.execute(
            `INSERT INTO submission_status_history
             (submission_prefix, submission_id, stage, status_date, completed, note)
             VALUES (?, ?, 'Assigned', NOW(), 1, ?)`,
            [prefix, submissionId, `Assigned to consultant: ${consultant.full_name}`]
        );

        // Audit log
        await logAuditEntry({
            userId:         req.userId,
            actionType:     'Status Change',
            description:    `Assigned ${prefix.toUpperCase()} #${submissionId} to ${consultant.full_name}`,
            submissionId,
            submissionType: prefix,
        });

        // Fetch submission details for notification messages
        const [[subInfo]] = await pool.execute(
            `SELECT user_id, title FROM ${table} WHERE id = ?`, [submissionId]
        );

        // Notify the inventor that a consultant was assigned
        if (subInfo) {
            await createInventorNotification({
                targetUserId: subInfo.user_id,
                type: 'consultant_assigned',
                title: 'Consultant Assigned to Your Project',
                message: `${consultant.full_name} has been assigned as your consultant for "${subInfo.title}" (${prefix.toUpperCase()}-${submissionId}). They will begin their review shortly.`,
                submissionId,
                submissionType: prefix,
                submissionPrefix: prefix,
                consultantName: consultant.full_name,
            });
        }

        // Notify admin of the assignment record
        await createAdminNotification({
            type: 'assignment',
            title: 'Submission Assigned to Consultant',
            message: `${prefix.toUpperCase()}-${submissionId}${subInfo ? ` "${subInfo.title}"` : ''} has been assigned to ${consultant.full_name}.`,
            submissionId,
            submissionPrefix: prefix,
            consultantName: consultant.full_name,
        });

        console.log(`✅ ${prefix.toUpperCase()} #${submissionId} assigned to ${consultant.full_name}`);
        res.json({ success: true, message: `Assigned to ${consultant.full_name}` });

    } catch (error) {
        console.error('❌ Assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign submission.',
            error: error.message
        });
    }
});

// ── GET  /api/consultant/assigned ────────────────────────────
// Returns all submissions assigned to the logged-in consultant.
// Each row includes inventor info + all uploaded document paths.
app.get('/api/consultant/assigned', authMiddleware, async (req, res) => {
    // Allow only CONSULTANT accounts
    if (req.userType !== 'CONSULTANT') {
        return res.status(403).json({ success: false, message: 'Access denied. Consultant account required.' });
    }

    const consultantId = req.userId;

    try {
        // Each table uses different column names for the uploaded documents.
        // We alias them all to doc2_path, doc3_path, doc4_path so the
        // UNION result set has a consistent shape the frontend can read.
        // All three SELECTs must have the same number of columns for UNION ALL.
        // CR has 6 doc slots; UMID and TM pad with NULL for doc5_path and doc6_path.
        const [rows] = await pool.query(`
            SELECT
                'umid'                        AS prefix,
                s.id,
                s.ip_type                     AS ip_type,
                s.ip_type                     AS project_type,
                s.title,
                s.filing_date                 AS date_submitted,
                s.assigned_at,
                s.status,
                u.full_name                   AS inventor_name,
                u.email                       AS inventor_email,
                s.endorsement_letter_path,
                s.disclosure_form_path        AS doc2_path,
                s.drawings_path               AS doc3_path,
                s.government_id_path          AS doc4_path,
                NULL                          AS doc5_path,
                NULL                          AS doc6_path
            FROM umid_submissions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.assigned_to_consultant = ?
              AND s.status = 'Assigned'

            UNION ALL

            SELECT
                'tm'                          AS prefix,
                s.id,
                'Trademark'                   AS ip_type,
                s.mark_type                   AS project_type,
                s.title,
                s.filing_date                 AS date_submitted,
                s.assigned_at,
                s.status,
                u.full_name                   AS inventor_name,
                u.email                       AS inventor_email,
                s.endorsement_letter_path,
                s.application_form_path       AS doc2_path,
                s.specimen_path               AS doc3_path,
                s.government_id_path          AS doc4_path,
                NULL                          AS doc5_path,
                NULL                          AS doc6_path
            FROM tm_submissions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.assigned_to_consultant = ?
              AND s.status = 'Assigned'

            UNION ALL

            SELECT
                'cr'                          AS prefix,
                s.id,
                'Copyright'                   AS ip_type,
                s.work_type                   AS project_type,
                s.title,
                s.filing_date                 AS date_submitted,
                s.assigned_at,
                s.status,
                u.full_name                   AS inventor_name,
                u.email                       AS inventor_email,
                s.endorsement_letter_path,
                s.bcrr_form_path              AS doc2_path,
                s.bcrr_form2_path             AS doc3_path,
                s.deed_of_assignment_path     AS doc4_path,
                s.author_id_path              AS doc5_path,
                s.creative_work_path          AS doc6_path
            FROM cr_submissions s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.assigned_to_consultant = ?
              AND s.status = 'Assigned'

            ORDER BY date_submitted DESC
        `, [consultantId, consultantId, consultantId]);

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Error fetching consultant assignments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned submissions.',
            error: error.message
        });
    }
});

// ── GET  /api/admin/submission/:prefix/:id ───────────────────
// Returns full detail of any single submission. Admin only.
// Used by admin panels that want to inspect a specific record.
app.get('/api/admin/submission/:prefix/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
    const { prefix, id } = req.params;

    const tableMap = {
        umid: 'umid_submissions',
        tm:   'tm_submissions',
        cr:   'cr_submissions',
    };
    const table = tableMap[prefix];

    if (!table)
        return res.status(400).json({ success: false, message: 'Invalid prefix.' });

    try {
        const [[row]] = await pool.query(
            `SELECT s.*, u.full_name AS inventor_name, u.email AS inventor_email
             FROM ${table} s
             LEFT JOIN users u ON s.user_id = u.id
             WHERE s.id = ?`,
            [id]
        );

        if (!row)
            return res.status(404).json({ success: false, message: 'Submission not found.' });

        res.json({ success: true, data: row });
    } catch (error) {
        console.error('❌ Error fetching submission detail:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch submission.',
            error: error.message
        });
    }
});

// ── PUT  /api/consultant/start-review ────────────────────────
// Moves an assigned submission to 'Under Review' when the consultant
// clicks the Review button. Validates that this consultant is assigned.
app.put('/api/consultant/start-review', authMiddleware, async (req, res) => {
    if (req.userType !== 'CONSULTANT')
        return res.status(403).json({ success: false, message: 'Access denied.' });

    const { prefix, submissionId } = req.body;
    const TABLE_MAP = { umid: 'umid_submissions', tm: 'tm_submissions', cr: 'cr_submissions' };
    const table = TABLE_MAP[prefix];
    if (!table) return res.status(400).json({ success: false, message: 'Invalid prefix.' });

    try {
        const [[row]] = await pool.query(
            `SELECT id, assigned_to_consultant FROM ${table} WHERE id = ? LIMIT 1`, [submissionId]
        );
        if (!row) return res.status(404).json({ success: false, message: 'Submission not found.' });
        if (row.assigned_to_consultant !== req.userId)
            return res.status(403).json({ success: false, message: 'Submission not assigned to you.' });

        await pool.query(
            `UPDATE ${table} SET status = 'Under Review', triage_date = NOW() WHERE id = ?`, [submissionId]
        );
        await pool.query(
            `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
             VALUES (?,?,?,NOW(),?,?)`,
            [prefix, submissionId, 'Under Review', 0, 'Consultant started review']
        );
        res.json({ success: true, message: `${prefix.toUpperCase()}-${submissionId} moved to Under Review.` });
    } catch (error) {
        console.error('❌ start-review error:', error);
        res.status(500).json({ success: false, message: 'Failed to start review.', error: error.message });
    }
});

// ── POST /api/approved/upload-pas ─────────────────────────────
// Consultant uploads the Pre-filing Assessment Sheet (PAS) report
// for an approved submission. Saves file + records path in DB.
const pasStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOADS_DIR, 'pas-reports');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext  = path.extname(file.originalname);
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `pasReport-${Date.now()}-${safe}`);
    },
});
const pasUpload = multer({
    storage: pasStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf','.doc','.docx','.jpg','.jpeg','.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only PDF, DOC, DOCX, JPG, PNG files are allowed.'));
    },
}).single('pasReport');

app.post('/api/approved/upload-pas', authMiddleware, (req, res) => {
    pasUpload(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });

        const { prefix, submissionId } = req.body;
        const TABLE_MAP = { umid: 'umid_submissions', um: 'umid_submissions', id: 'umid_submissions', tm: 'tm_submissions', cr: 'cr_submissions' };
        const table = TABLE_MAP[prefix];
        if (!table) return res.status(400).json({ success: false, error: 'Invalid prefix.' });

        // Store as relative path (pas-reports/filename) so /uploads/ can serve it
        const filePath = `pas-reports/${req.file.filename}`;

        try {
            // Only save the PAS path — status stays 'Approved for Filing'
            // so the admin can see it in PAS Reports, verify, then approve.
            await pool.query(
                `UPDATE ${table} SET pas_report_path = ? WHERE id = ?`,
                [filePath, submissionId]
            );
            await pool.query(
                `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
                 VALUES (?,?,?,NOW(),?,?)`,
                [prefix === 'id' ? 'umid' : prefix, submissionId, 'PAS Report Uploaded', 1, 'PAS Report uploaded by consultant — awaiting admin approval']
            );

            // Notify admin that PAS report is ready for review
            await createAdminNotification({
                type: 'pas_report',
                title: 'PAS Report Uploaded — Awaiting Your Approval',
                message: `A PAS Report was uploaded for ${(prefix === 'id' ? 'umid' : prefix).toUpperCase()}-${submissionId}. Please review and approve in PAS Reports.`,
                submissionId,
                submissionPrefix: prefix === 'id' ? 'umid' : prefix,
            });

            res.json({
                success: true,
                message: 'PAS Report uploaded successfully.',
                filePath,
            });
        } catch (dbErr) {
            console.error('❌ PAS upload DB error:', dbErr);
            res.status(500).json({ success: false, error: 'Database update failed.', detail: dbErr.message });
        }
    });
});

// Comm Letter upload routes
// POST /api/umid/upload-comm-letter/:id
// POST /api/tm/upload-comm-letter/:id
// POST /api/cr/upload-comm-letter/:id
const commLetterStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(UPLOADS_DIR, 'comm-letters');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `commLetter-${Date.now()}-${safe}`);
    },
});
const commLetterUpload = multer({
    storage: commLetterStorage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Only PDF, DOC, DOCX files are allowed.'));
    },
}).single('commLetter');

const COMM_TABLE_MAP = {
    umid: 'umid_submissions', um: 'umid_submissions', id: 'umid_submissions',
    tm: 'tm_submissions', cr: 'cr_submissions',
};

['umid', 'tm', 'cr'].forEach(pfx => {
    app.post(`/api/${pfx}/upload-comm-letter/:id`, authMiddleware, isAdminMiddleware, (req, res) => {
        commLetterUpload(req, res, async (err) => {
            if (err instanceof multer.MulterError)
                return res.status(400).json({ error: 'File too large. Max 20 MB.' });
            if (err) return res.status(400).json({ error: err.message });
            if (!req.file) return res.status(400).json({ error: 'No file received.' });

            const submissionId = req.params.id;
            const filePath = `comm-letters/${req.file.filename}`;

            try {
                const [existing] = await pool.execute(
                    `SELECT id FROM communication_letters WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1`,
                    [submissionId]
                );
                if (existing.length > 0) {
                    await pool.execute(
                        `UPDATE communication_letters SET file_path = ?, status = 'Signed & Issued', signed_at = NOW(), issued_at = NOW() WHERE id = ?`,
                        [filePath, existing[0].id]
                    );
                } else {
                    await pool.execute(
                        `INSERT INTO communication_letters (submission_id, submission_ref, ip_type, ip_type_prefix, file_path, status, signed_at, issued_at) VALUES (?,?,?,?,?,'Signed & Issued',NOW(),NOW())`,
                        [submissionId, `${pfx.toUpperCase()}-${submissionId}`,
                         pfx === 'tm' ? 'Trademark' : pfx === 'cr' ? 'Copyright' : 'Utility Model',
                         pfx, filePath]
                    );
                }

                // Notify inventor
                const table = COMM_TABLE_MAP[pfx];
                const [[sub]] = await pool.execute(
                    `SELECT user_id, title FROM ${table} WHERE id = ?`, [submissionId]
                ).catch(() => [[null]]);
                if (sub) {
                    await pool.execute(
                        `INSERT INTO inventor_notifications (target_user_id, type, title, message, submission_id, submission_prefix, icon, icon_color) VALUES (?, 'resubmission_required', 'Communication Letter Issued', ?, ?, ?, 'bi bi-envelope-paper-fill', 'text-warning')`,
                        [sub.user_id,
                         `A Communication Letter has been issued for "${sub.title || 'Untitled'}". Please review and resubmit corrected documents.`,
                         submissionId, pfx]
                    ).catch(() => {});
                }

                await pool.execute(
                    `INSERT INTO submission_status_history (submission_prefix, submission_id, stage, status_date, completed, note) VALUES (?, ?, 'Communication Letter Uploaded', NOW(), 1, ?)`,
                    [pfx, submissionId, `Comm letter uploaded: ${req.file.filename}`]
                ).catch(() => {});

                res.json({ success: true, message: 'Communication Letter uploaded successfully.', filePath });
            } catch (dbErr) {
                console.error(`[${pfx}] comm-letter upload DB error:`, dbErr);
                try { fs.unlinkSync(path.join(UPLOADS_DIR, filePath)); } catch (_) {}
                res.status(500).json({ error: 'Database update failed. ' + dbErr.message });
            }
        });
    });
});

// ── GET /api/umid-submissions-approved-inventor ───────────────
// Returns the logged-in inventor's own UMID submissions that are
// Approved for Filing or Filed to IPOPHL, including pas_report_path.
// Used by the UMID portal PAS Report tab so the inventor can view /
// download the PAS Report the specialist uploaded for their submission.
app.get('/api/umid-submissions-approved-inventor', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
                s.id,
                s.title,
                s.ip_type,
                s.filing_date,
                s.status,
                s.approval_date,
                s.pas_report_path,
                s.triage_notes,
                s.rejection_reason
             FROM umid_submissions s
             WHERE s.user_id = ?
               AND s.status IN ('Approved for Filing', 'Filed to IPOPHL')
             ORDER BY s.approval_date DESC, s.id DESC`,
            [req.userId]
        );
        res.json(rows);
    } catch (e) {
        console.error('❌ umid-submissions-approved-inventor error:', e);
        res.status(500).json({ error: 'Failed to fetch approved UMID submissions.' });
    }
});

// ── GET /api/cr-submissions-approved-inventor ─────────────────
// Returns the logged-in author's own CR (Copyright) submissions that
// are Approved for Filing or Filed to IPOPHL, including pas_report_path.
// Used by the Copyright portal PAS Report tab.
app.get('/api/cr-submissions-approved-inventor', authMiddleware, async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
                s.id,
                s.title,
                s.work_type  AS ip_type,
                s.filing_date,
                s.status,
                s.approval_date,
                s.pas_report_path,
                s.triage_notes,
                s.rejection_reason
             FROM cr_submissions s
             WHERE s.user_id = ?
               AND s.status IN ('Approved for Filing', 'Filed to IPOPHL')
             ORDER BY s.approval_date DESC, s.id DESC`,
            [req.userId]
        );
        res.json(rows);
    } catch (e) {
        console.error('❌ cr-submissions-approved-inventor error:', e);
        res.status(500).json({ error: 'Failed to fetch approved Copyright submissions.' });
    }
});

// ── END OF ASSIGNMENT SYSTEM ─────────────────────────────────

// ============================================================
// APPROVED APPLICATION — Unified endpoint
// GET  /api/approved-applications  → UM/ID/CR (Filed to IPOPHL) + TM (Filed to IPOPHL)
// DELETE /api/approved-applications/:prefix/:id?permanent=true|false
// DELETE /api/tm-submission-done/:id  (legacy — used by PASReports Done button)
// ============================================================

// GET — all filed/approved applications for the Approved Application table
app.get('/api/approved-applications', authMiddleware, async (req, res) => {
  try {
    const [umidRows] = await pool.execute(
      `SELECT s.id, s.title, s.ip_type, s.filing_date, s.status, s.approval_date,
              s.triage_notes, s.pas_report_path,
              s.endorsement_letter_path, s.disclosure_form_path,
              s.drawings_path, s.government_id_path,
              u.full_name AS inventor_name, u.email AS inventor_email,
              'umid' AS _prefix
       FROM umid_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'Filed to IPOPHL'
       ORDER BY s.approval_date DESC, s.id DESC`
    );
    const [tmRows] = await pool.execute(
      `SELECT s.id, s.title, 'Trademark' AS ip_type, s.mark_type, s.filing_date, s.status, s.approval_date,
              s.triage_notes, s.pas_report_path,
              s.endorsement_letter_path, s.application_form_path,
              s.specimen_path, s.government_id_path, s.proof_of_use_path,
              u.full_name AS inventor_name, u.email AS inventor_email,
              'tm' AS _prefix
       FROM tm_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'Filed to IPOPHL'
       ORDER BY s.approval_date DESC, s.id DESC`
    );
    const [crRows] = await pool.execute(
      `SELECT s.id, s.title, 'Copyright' AS ip_type, s.work_type, s.filing_date, s.status, s.approval_date,
              s.triage_notes,
              s.endorsement_letter_path, s.bcrr_form_path, s.bcrr_form2_path,
              s.deed_of_assignment_path, s.author_id_path, s.creative_work_path,
              u.full_name AS inventor_name, u.email AS inventor_email,
              'cr' AS _prefix
       FROM cr_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'Filed to IPOPHL'
       ORDER BY s.approval_date DESC, s.id DESC`
    );
    const merged = [...umidRows, ...tmRows, ...crRows]
      .sort((a, b) => new Date(b.approval_date || 0) - new Date(a.approval_date || 0));
    res.json(merged);
  } catch (e) {
    console.error('[approved-applications] fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch approved applications.' });
  }
});

// DELETE — remove from approved applications table
// ?permanent=true  → hard delete from DB
// ?permanent=false → set hidden_from_tracker=1, keep record
app.delete('/api/approved-applications/:prefix/:id', authMiddleware, isAdminMiddleware, async (req, res) => {
  const { prefix, id } = req.params;
  const permanent = req.query.permanent === 'true';
  const TABLE_MAP = { umid: 'umid_submissions', tm: 'tm_submissions', cr: 'cr_submissions' };
  const table = TABLE_MAP[prefix];
  if (!table) return res.status(400).json({ error: 'Invalid prefix.' });
  try {
    if (permanent) {
      await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
      await pool.execute(
        `DELETE FROM submission_status_history WHERE submission_prefix = ? AND submission_id = ?`,
        [prefix, id]
      );
    } else {
      await pool.execute(
        `UPDATE ${table} SET hidden_from_tracker = 1 WHERE id = ?`, [id]
      );
    }
    res.json({ success: true, permanent });
  } catch (e) {
    console.error('[approved-applications] delete error:', e);
    res.status(500).json({ error: 'Failed to remove application.' });
  }
});

// DELETE /api/tm-submission-done/:id
// Called by PASReports "Done" button after TM is approved.
// Moves TM to Filed to IPOPHL (does NOT hard-delete — it goes to ApprovedApplication).
app.delete('/api/tm-submission-done/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.execute(
      `UPDATE tm_submissions SET status = 'Filed to IPOPHL', approval_date = NOW() WHERE id = ?`,
      [id]
    );
    await pool.execute(
      `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
       VALUES ('tm',?,?,NOW(),1,'Approved via PAS Reports — moved to Approved Applications')`,
      [id, 'Filed to IPOPHL']
    );
    res.json({ success: true, message: 'TM submission marked as Filed to IPOPHL.' });
  } catch (e) {
    console.error('[tm-submission-done] error:', e);
    res.status(500).json({ error: 'Failed to finalize TM submission.' });
  }
});

// ── PUT /api/umid-submission-approve/:id ─────────────────────
// Admin approves UM/ID PAS Report → moves to Filed to IPOPHL
app.put('/api/umid-submission-approve/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.execute(
      `UPDATE umid_submissions
       SET status = 'Filed to IPOPHL',
           approval_date = CASE WHEN approval_date IS NULL THEN NOW() ELSE approval_date END
       WHERE id = ? AND status = 'Approved for Filing'`,
      [id]
    );
    if (r.affectedRows === 0)
      return res.status(404).json({ error: 'Submission not found or already processed.' });
    await pool.execute(
      `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
       VALUES ('umid',?,?,NOW(),1,'Approved by admin via PAS Reports')`, [id, 'Filed to IPOPHL']
    );
    const [[sub]] = await pool.execute(`SELECT user_id, title, ip_type FROM umid_submissions WHERE id=?`, [id]);
    if (sub) {
      await createInventorNotification({
        targetUserId: sub.user_id, type: 'approved',
        title: 'Application Filed to IPOPHL',
        message: `Your ${sub.ip_type} application "${sub.title}" has been approved and filed with IPOPHL.`,
        submissionId: id, submissionPrefix: 'umid',
      });
    }
    res.json({ success: true, message: `UMID-${id} moved to Filed to IPOPHL.` });
  } catch (e) {
    console.error('[umid-submission-approve] error:', e);
    res.status(500).json({ error: 'Failed to approve submission.' });
  }
});

// ── PUT /api/tm-submission-approve/:id ───────────────────────
// Admin approves TM PAS Report → moves to Filed to IPOPHL
app.put('/api/tm-submission-approve/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [r] = await pool.execute(
      `UPDATE tm_submissions
       SET status = 'Filed to IPOPHL',
           approval_date = CASE WHEN approval_date IS NULL THEN NOW() ELSE approval_date END
       WHERE id = ? AND status = 'Approved for Filing'`,
      [id]
    );
    if (r.affectedRows === 0)
      return res.status(404).json({ error: 'Submission not found or already processed.' });
    await pool.execute(
      `INSERT INTO submission_status_history (submission_prefix,submission_id,stage,status_date,completed,note)
       VALUES ('tm',?,?,NOW(),1,'Approved by admin via PAS Reports')`, [id, 'Filed to IPOPHL']
    );
    const [[sub]] = await pool.execute(`SELECT user_id, title FROM tm_submissions WHERE id=?`, [id]);
    if (sub) {
      await createInventorNotification({
        targetUserId: sub.user_id, type: 'approved',
        title: 'Application Filed to IPOPHL',
        message: `Your Trademark application "${sub.title}" has been approved and filed with IPOPHL.`,
        submissionId: id, submissionPrefix: 'tm',
      });
    }
    res.json({ success: true, message: `TM-${id} moved to Filed to IPOPHL.` });
  } catch (e) {
    console.error('[tm-submission-approve] error:', e);
    res.status(500).json({ error: 'Failed to approve submission.' });
  }
});

// ── GET /api/pas-reports-pending ─────────────────────────────
// Returns ALL types (UM, ID, TM, CR) with status = 'Approved for Filing'
// Used by the admin PAS Reports page.
app.get('/api/pas-reports-pending', authMiddleware, async (req, res) => {
  try {
    const [umidRows] = await pool.execute(
      `SELECT s.id, s.ip_type, s.title, s.filing_date, s.status, s.approval_date,
              s.pas_report_path, s.triage_notes,
              s.endorsement_letter_path, s.disclosure_form_path,
              s.drawings_path, s.government_id_path,
              u.full_name AS inventor_name, u.email AS inventor_email,
              'umid' AS _prefix
       FROM umid_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'Approved for Filing'
       ORDER BY s.approval_date DESC, s.id DESC`
    );
    const [tmRows] = await pool.execute(
      `SELECT s.id, 'Trademark' AS ip_type, s.title, s.filing_date, s.status, s.approval_date,
              s.pas_report_path, s.triage_notes,
              s.endorsement_letter_path, s.application_form_path,
              s.specimen_path, s.government_id_path, s.proof_of_use_path,
              u.full_name AS inventor_name, u.email AS inventor_email,
              'tm' AS _prefix
       FROM tm_submissions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.status = 'Approved for Filing'
       ORDER BY s.approval_date DESC, s.id DESC`
    );
    // CR (Copyright) does not require PAS Report — excluded from this endpoint.
    const merged = [...umidRows, ...tmRows]
      .sort((a, b) => new Date(b.approval_date || 0) - new Date(a.approval_date || 0));
    res.json(merged);
  } catch (e) {
    console.error('[pas-reports-pending] error:', e);
    res.status(500).json({ error: 'Failed to fetch PAS pending submissions.' });
  }
});

// ============================================================
// CMS — CONTENT MANAGEMENT SYSTEM
// Uses the shared pool from index.js — no second DB connection
//
//  PUBLIC  → /api/cms/public/all        (no auth — called by HomePage.jsx)
//  ADMIN   → /api/cms/*                 (authMiddleware + isAdminMiddleware)
//
// IMPORTANT: publicCmsRouter must be registered BEFORE the admin router
//            so Express doesn't try to auth the public endpoint.
// ============================================================
const publicCmsRouter = createPublicCmsRouter(pool);
const cmsRouter       = createCmsRouter(pool);

// 1. Public first — NO auth (HomePage.jsx calls this)
app.use('/api/cms/public', publicCmsRouter);

// 2. Admin routes — auth required
app.use('/api/cms', authMiddleware, isAdminMiddleware, cmsRouter);

// ============================================================
// PAGE BUILDER ROUTES
//   Public  → /api/public/pages/:slug  (no auth — served to visitors)
//   Admin   → /api/pages/*             (authMiddleware + isAdminMiddleware)
// ============================================================
const publicPagesRouter = createPublicPagesRouter(pool);
const pagesRouter       = createPagesRouter(pool);

// 1. Public first — no auth
app.use('/api/public/pages', publicPagesRouter);

// 2. Admin CRUD — auth required
app.use('/api/pages', authMiddleware, isAdminMiddleware, pagesRouter);


const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
        // Close database pool
        await pool.end();
        console.log('✅ Database pool closed');
        
        // Exit process
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle different shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
// 404 handler
app.use((req, res) => {
        res.status(404).json({
                success: false,
                message: 'Route not found'
        });
});

// Error handler
app.use((err, req, res, next) => {
        console.error('Error:', err);
        res.status(err.status || 500).json({
                success: false,
                message: err.message || 'Internal server error'
        });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL  || 'http://localhost:5173'}`);
    console.log(`📬 Admin notification system active`);
    console.log(`✅ Admin approval system active`);
    console.log(`📋 User directory endpoints active`);
    console.log(`🔐 Role permissions system active`);
    console.log(`📧 Inventor notification system active`);
    console.log(`📊 Portfolio endpoints active`);
    console.log(`📍 Tracker endpoints active with DONE functionality`);
    console.log(`🗂️  UMID (UM+ID merged), TM, CR submission portals active`);
    console.log(`📋 Inventor PAS Report endpoints active (UMID + CR)`);
    console.log(`🌐 CMS routes active (/api/cms/* admin | /api/cms/public/all public)`);
    console.log(`📄 Page Builder routes active (/api/pages/* admin | /api/public/pages/* public)`);
    console.log('='.repeat(60));
});