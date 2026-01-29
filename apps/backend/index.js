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
app.use(express.json());

// uploads dir
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));

// DB pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
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
    credentials: true
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
};

// ================================
// API ROUTES
// ================================

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

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
            ipCategory,
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
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
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
            await connection.query('INSERT INTO inventors (user_id, delivery_unit) VALUES (?, ?)', [userId, deliveryUnit]);
        } else if (userType === 'CONSULTANT') {
            if (!ipCategory) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'IP category is required for consultants'
                });
            }
            await connection.query('INSERT INTO consultants (user_id, ip_category) VALUES (?, ?)', [userId, ipCategory]);
        } else if (userType === 'ADMIN') {
            await connection.query('INSERT INTO admins (user_id, admin_level) VALUES (?, ?)', [userId, adminLevel || 'ADMIN']);
        }

        await connection.commit();

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

// 5. Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query('DELETE FROM notifications WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// 6. Create manual notification (for testing or custom alerts)
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

// 7. Get notifications for specific submission type
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

// 8. Cleanup old notifications (optional)
app.delete('/api/notifications/cleanup', async (req, res) => {
    try {
        await pool.query('DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)');
        res.json({ success: true, message: 'Old notifications cleaned up' });
    } catch (error) {
        console.error('Error cleaning up notifications:', error);
        res.status(500).json({ error: 'Failed to cleanup notifications' });
    }
});


// ============================================
// PORTFOLIO API ENDPOINTS - APPROVED SUBMISSIONS ONLY
// ============================================

// Get APPROVED submissions over time by type and optional year
app.get('/api/portfolio/approved-submissions', async (req, res) => {
    const { type, year } = req.query;
    
    try {
        const tableMap = {
            'id': 'id_submissions',
            'cr': 'cr_submissions',
            'tm': 'tm_submissions',
            'um': 'um_submissions'
        };
        
        const tableName = tableMap[type];
        if (!tableName) {
            return res.status(400).json({ error: 'Invalid type parameter. Use: id, cr, tm, or um' });
        }
        
        // Build query with APPROVED filter
        let query = `
            SELECT 
                YEAR(filing_date) AS year,
                MONTH(filing_date) AS month,
                COUNT(*) AS total_submissions
            FROM ${tableName}
            WHERE filing_date IS NOT NULL 
                AND status = 'Approved for Filing'
                ${year && year !== 'all' ? `AND YEAR(filing_date) = ?` : ''}
            GROUP BY year, month
            ORDER BY year ASC, month ASC
        `;
        
        const params = year && year !== 'all' ? [parseInt(year)] : [];
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
app.get('/api/portfolio/approved-totals', async (req, res) => {
    const { year } = req.query;
    
    try {
        const yearCondition = year && year !== 'all' ? `AND YEAR(filing_date) = ${parseInt(year)}` : '';
        
        const [idCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM id_submissions WHERE status = 'Approved for Filing' ${yearCondition}`
        );
        const [crCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM cr_submissions WHERE status = 'Approved for Filing' ${yearCondition}`
        );
        const [tmCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM tm_submissions WHERE status = 'Approved for Filing' ${yearCondition}`
        );
        const [umCount] = await pool.execute(
            `SELECT COUNT(*) as count FROM um_submissions WHERE status = 'Approved for Filing' ${yearCondition}`
        );
        
        res.json({
            industrialDesign: idCount[0].count,
            copyright: crCount[0].count,
            trademark: tmCount[0].count,
            utilityModel: umCount[0].count,
            total: idCount[0].count + crCount[0].count + tmCount[0].count + umCount[0].count,
            year: year || 'all'
        });
    } catch (error) {
        console.error("Error fetching approved totals:", error);
        res.status(500).json({ error: "Failed to fetch approved totals" });
    }
});

// Get combined APPROVED submissions for all types (optional)
app.get('/api/portfolio/approved-combined', async (req, res) => {
    const { year } = req.query;
    
    try {
        const yearCondition = year && year !== 'all' ? `AND YEAR(filing_date) = ${parseInt(year)}` : '';
        
        const query = `
            SELECT 
                YEAR(filing_date) AS year,
                MONTH(filing_date) AS month,
                COUNT(*) AS total_submissions
            FROM 
                (
                    SELECT filing_date FROM tm_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${yearCondition}
                    UNION ALL
                    SELECT filing_date FROM cr_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${yearCondition}
                    UNION ALL
                    SELECT filing_date FROM id_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${yearCondition}
                    UNION ALL
                    SELECT filing_date FROM um_submissions WHERE filing_date IS NOT NULL AND status = 'Approved for Filing' ${yearCondition}
                ) AS combined_approved
            GROUP BY year, month
            ORDER BY year ASC, month ASC
        `;

        const [results] = await pool.execute(query);

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
        submission_type ENUM('Copyright', 'Trademark', 'Industrial Design', 'Utility Model'),
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
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'officialForm', maxCount: 1 },
  { name: 'depositMaterial', maxCount: 1 }
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
  return filingDate || null;
}

// ============================================
// CREATE RESOURCE ROUTES FUNCTION
// ============================================
function createResourceRoutes({ prefix, tableName, successMessage, notificationType }) {
  
  // 1. SUBMIT NEW SUBMISSION
  app.post(`/api/${prefix}/submit`, (req, res) => {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer Error:", err);
        return res.status(400).json({ error: 'File upload failed: ' + err.message });
      } else if (err) {
        console.error("Unknown File Error:", err);
        return res.status(500).json({ error: 'An unknown error occurred during file upload.' });
      }

      const { title, description, type, submissionType } = req.body;
      const filingDate = extractFilingDate(req.body.date);
      const officialFormFile = req.files['file'] ? req.files['file'][0] : null;
      const designImageFile = req.files['image'] ? req.files['image'][0] : null;

      if (!title || !description || !officialFormFile || !submissionType) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'Missing required text or official form file fields.' });
      }

      if (submissionType === 'Complete Application' && (!type || !filingDate)) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'Missing required fields for a Complete Application.' });
      }
      
      if (submissionType === 'Complete Application' && !designImageFile) {
        cleanupFiles(req.files);
        return res.status(400).json({ error: 'Missing representation file (image/document) for Complete Application.' });
      }

      const officialFormPath = officialFormFile.filename;
      const designImagePath = designImageFile ? designImageFile.filename : null;

      try {
        const query = `
          INSERT INTO ${tableName}
          (title, description, submission_type, design_type, filing_date, official_form_path, design_image_path, inventor_identified, design_views_complete, description_clear, checklist_complete, rejection_reason)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.execute(query, [
          title,
          description,
          submissionType,
          type || null,
          filingDate,
          officialFormPath,
          designImagePath,
          0,0,0,0,null
        ]);

        await pool.execute(
          `INSERT INTO submission_status_history (submission_prefix, submission_id, stage, status_date, completed, note) VALUES (?, ?, ?, NOW(), ?, ?)`,
          [prefix, result.insertId, 'New Submission', 1, 'Initial submission']
        );

        await createSubmissionNotification(
         { id: result.insertId, title: title },
          notificationType,
          prefix
        );

        res.status(200).json({
          message: successMessage,
          submissionId: result.insertId,
          officialFilePath: `/uploads/${officialFormPath}`
        });
      } catch (error) {
        console.error('Database insertion error:', error);
        cleanupFiles(req.files);
        res.status(500).json({ error: 'Failed to save submission data.' });
      }
    });
  });

  // 2. GET NEW SUBMISSIONS
  app.get(`/api/${prefix}-submissions-new`, async (req, res) => {
    try {
      const [results] = await pool.execute(`
        SELECT id, title, description, submission_type, design_type, filing_date, official_form_path, design_image_path, status
        FROM ${tableName}
        WHERE status IS NULL OR status = 'New Submission'
        ORDER BY id DESC
      `);
      res.json(results);
    } catch (error) {
      console.error(`Error fetching new ${prefix} submissions:`, error);
      res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
  });

  // 3. RECEIVE SUBMISSION
  app.put(`/api/${prefix}-receive/:id`, async (req, res) => {
    const projectId = req.params.id;
    try {
      const [result] = await pool.execute(`
        UPDATE ${tableName}
        SET status = ?, inventor_identified = 0, design_views_complete = 0, description_clear = 0, checklist_complete = 0, rejection_reason = NULL, triage_date = NOW()
        WHERE id = ?
      `, ['Under Review', projectId]);
      
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });

      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix, submission_id, stage, status_date, completed, note) VALUES (?, ?, ?, NOW(), ?, ?)`,
        [prefix, projectId, 'Under Review', 0, 'Received by admin for triage']
      );

      res.json({ message: `Project ${projectId} status updated to 'Under Review'` });
    } catch (e) {
      console.error('Status update error:', e);
      res.status(500).json({ error: 'Database update failed' });
    }
  });

  // 4. GET UNDER REVIEW SUBMISSIONS
  app.get(`/api/${prefix}-submissions-under-review`, async (req, res) => {
    try {
      const [results] = await pool.execute(`
        SELECT id, title, description, submission_type, design_type, filing_date, official_form_path, design_image_path, status, inventor_identified, design_views_complete, description_clear, checklist_complete, rejection_reason
        FROM ${tableName}
        WHERE status IN ('Under Review', 'Ready for Review')
        ORDER BY id DESC
      `);
      res.json(results);
    } catch (e) {
      console.error('Error fetching under review submissions:', e);
      res.status(500).json({ error: 'Failed to fetch submissions.' });
    }
  });

  // 5. UPDATE CHECKLIST
  app.put(`/api/${prefix}-checklist-update/:id`, async (req, res) => {
    const projectId = req.params.id;
    const { inventor_identified, design_views_complete, description_clear, rejection_comment } = req.body;
    const checklistComplete = inventor_identified && design_views_complete && description_clear;
    const newStatus = checklistComplete ? 'Ready for Review' : 'Under Review';
    
    try {
      const [result] = await pool.execute(`
        UPDATE ${tableName}
        SET inventor_identified = ?, design_views_complete = ?, description_clear = ?, checklist_complete = ?, status = ?, rejection_reason = ?, triage_date = NOW()
        WHERE id = ?
      `, [inventor_identified, design_views_complete, description_clear, checklistComplete, newStatus, rejection_comment || null, projectId]);
      
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Project not found' });

      await pool.execute(
        `INSERT INTO submission_status_history (submission_prefix, submission_id, stage, status_date, completed, note) VALUES (?, ?, ?, NOW(), ?, ?)`,
        [prefix, projectId, newStatus, checklistComplete ? 1 : 0, rejection_comment || 'Checklist updated']
      );

      res.json({ message: `Project ${projectId} checklist updated to '${newStatus}'` });
    } catch (e) {
      console.error('Checklist update error:', e);
      res.status(500).json({ error: 'Database update failed' });
    }
  });

  // 6. REVIEW ACTION
  app.put(`/api/${prefix}-review-action/:id`, async (req, res) => {
    const projectId = req.params.id;
    const { action, rejection_reason } = req.body;

    if (!action || !['Approved for Filing', 'Rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "Approved for Filing" or "Rejected".' });
    }

    if (action === 'Rejected' && (!rejection_reason || rejection_reason.trim() === '')) {
      return res.status(400).json({ error: 'Rejection reason is required when rejecting a submission.' });
    }

    try {
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          status = ?, 
          approval_date = NOW(),
          rejection_reason = ?
        WHERE id = ?
      `;

      const [result] = await pool.execute(updateQuery, [
        action,
        rejection_reason || null,
        projectId
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      await pool.execute(
        `INSERT INTO submission_status_history 
         (submission_prefix, submission_id, stage, status_date, completed, note) 
         VALUES (?, ?, ?, NOW(), ?, ?)`,
        [
          prefix, 
          projectId, 
          action, 
          action === 'Approved for Filing' ? 1 : 0,
          rejection_reason || `Status changed to ${action}`
        ]
      );

      res.json({ 
        message: `Project ${projectId} status updated to '${action}'`,
        action,
        projectId
      });

    } catch (error) {
      console.error(`Error performing review action for ${prefix}:`, error);
      res.status(500).json({ error: 'Database update failed during review action.' });
    }
  });

  // 7. GET APPROVED SUBMISSIONS
  app.get(`/api/${prefix}-submissions-approved`, async (req, res) => {
    try {
      const [results] = await pool.execute(`
        SELECT 
          id, 
          title, 
          description, 
          submission_type, 
          design_type, 
          filing_date, 
          official_form_path, 
          design_image_path, 
          status,
          approval_date,
          rejection_reason
        FROM ${tableName}
        WHERE status = 'Approved for Filing'
        ORDER BY approval_date DESC, id DESC
      `);
      res.json(results);
    } catch (error) {
      console.error(`Error fetching approved ${prefix} submissions:`, error);
      res.status(500).json({ error: 'Failed to fetch approved submissions.' });
    }
  });

  // 8. GET REJECTED SUBMISSIONS
  app.get(`/api/${prefix}-submissions-rejected`, async (req, res) => {
    try {
      const [results] = await pool.execute(`
        SELECT 
          id, 
          title, 
          description, 
          submission_type, 
          design_type, 
          filing_date, 
          official_form_path, 
          design_image_path, 
          status,
          approval_date,
          rejection_reason
        FROM ${tableName}
        WHERE status = 'Rejected'
        ORDER BY approval_date DESC, id DESC
      `);
      res.json(results);
    } catch (error) {
      console.error(`Error fetching rejected ${prefix} submissions:`, error);
      res.status(500).json({ error: 'Failed to fetch rejected submissions.' });
    }
  });
}

// ============================================
// CREATE ROUTES FOR ALL RESOURCES
// ============================================
createResourceRoutes({ 
  prefix: 'um', 
  tableName: 'um_submissions', 
  successMessage: 'Utility Model submission successful!',
  notificationType: 'Utility Model'
});

createResourceRoutes({ 
  prefix: 'id', 
  tableName: 'id_submissions', 
  successMessage: 'Industrial Design submission successful!',
  notificationType: 'Industrial Design'
});

createResourceRoutes({ 
  prefix: 'tm', 
  tableName: 'tm_submissions', 
  successMessage: 'Trademark submission successful!',
  notificationType: 'Trademark'
});

createResourceRoutes({ 
  prefix: 'cr', 
  tableName: 'cr_submissions', 
  successMessage: 'Copyright submission successful!',
  notificationType: 'Copyright'
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

// Table prefix mapping
const TABLES = {
    um: "um_submissions",
    id: "id_submissions",
    tm: "tm_submissions",
    cr: "cr_submissions"
};

// =====================================
// GET ALL SUBMISSIONS (EXCLUDE HIDDEN)
// =====================================
app.get("/api/tracker/submissions", async (req, res) => {
    try {
        const queries = Object.entries(TABLES).map(([prefix, table]) =>
            pool.execute(
                `SELECT 
                        id,
                        title,
                        submission_type AS submissionType,
                        filing_date AS date,
                        status,
                        official_form_path AS file_path,
                        ? AS prefix
                 FROM ${table}
                 WHERE (hidden_from_tracker IS NULL OR hidden_from_tracker = 0)`,
                [prefix]
            )
        );

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
// GET SUBMISSION DETAILS
// =====================================
app.get("/api/tracker/submission/:prefix/:id", async (req, res) => {
    const { prefix, id } = req.params;
    const table = TABLES[prefix];

    if (!table) return res.status(400).json({ error: "Invalid prefix" });

    try {
        const [[submission]] = await pool.execute(
            `SELECT * FROM ${table} WHERE id = ?`,
            [id]
        );

        if (!submission) return res.status(404).json({ error: "Not found" });

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
            submissionType: submission.submission_type,
            date: submission.filing_date
                ? new Date(submission.filing_date).toISOString().split("T")[0]
                : null,
            status: submission.status ?? "New Submission",
            prefix: prefix,
            filePath: submission.official_form_path
                ? `/uploads/${submission.official_form_path}`
                : null,
            designImagePath: submission.design_image_path
                ? `/uploads/${submission.design_image_path}`
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

// Get approved users
app.get('/api/admin/users/approved', authMiddleware, isAdminMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id, u.email, u.full_name, u.user_type,
                    u.profile_picture, u.created_at, u.approved_at, u.approval_status
             FROM users u
             WHERE u.approval_status = 'approved'
             ORDER BY u.approved_at DESC`
        );
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch approved users' });
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
            // Industrial Design - with delivery_unit join
            `SELECT 
                s.id,
                'ID' as ip_type,
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
                s.description as comments
             FROM id_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Revision Required')`,
            
            // Trademark - with delivery_unit join
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
                s.description as comments
             FROM tm_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Revision Required')`,
            
            // Copyright - with delivery_unit join
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
                s.description as comments
             FROM cr_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Under Review', 'Revision Required')`,
            
            // Utility Model - with delivery_unit join
            `SELECT 
                s.id,
                'UM' as ip_type,
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
                s.description as comments
             FROM um_submissions s
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
            // Industrial Design - with delivery_unit join
            `SELECT 
                s.id,
                'ID' as ip_type,
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
             FROM id_submissions s
             LEFT JOIN users u ON s.user_id = u.id
             LEFT JOIN inventors i ON u.id = i.user_id
             WHERE s.status IN ('Approved for Filing', 'Rejected', 'DONE')`,
            
            // Trademark - with delivery_unit join
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
            
            // Copyright - with delivery_unit join
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
             WHERE s.status IN ('Approved for Filing', 'Rejected', 'DONE')`,
            
            // Utility Model - with delivery_unit join
            `SELECT 
                s.id,
                'UM' as ip_type,
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
             FROM um_submissions s
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
                SELECT id FROM id_submissions
                UNION ALL SELECT id FROM tm_submissions
                UNION ALL SELECT id FROM cr_submissions
                UNION ALL SELECT id FROM um_submissions
            ) as all_subs`,
            
            // New submissions (pending)
            `SELECT COUNT(*) as new FROM (
                SELECT id FROM id_submissions WHERE status = 'NEW SUBMISSION'
                UNION ALL SELECT id FROM tm_submissions WHERE status = 'NEW SUBMISSION'
                UNION ALL SELECT id FROM cr_submissions WHERE status = 'NEW SUBMISSION'
                UNION ALL SELECT id FROM um_submissions WHERE status = 'NEW SUBMISSION'
            ) as new_subs`,
            
            // New today
            `SELECT COUNT(*) as newToday FROM (
                SELECT id FROM id_submissions WHERE DATE(created_at) = CURDATE()
                UNION ALL SELECT id FROM tm_submissions WHERE DATE(created_at) = CURDATE()
                UNION ALL SELECT id FROM cr_submissions WHERE DATE(created_at) = CURDATE()
                UNION ALL SELECT id FROM um_submissions WHERE DATE(created_at) = CURDATE()
            ) as today_subs`,
            
            // Completed
            `SELECT COUNT(*) as completed FROM (
                SELECT id FROM id_submissions WHERE status IN ('Approved for Filing', 'DONE')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Approved for Filing', 'DONE')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Approved for Filing', 'DONE')
                UNION ALL SELECT id FROM um_submissions WHERE status IN ('Approved for Filing', 'DONE')
            ) as completed_subs`,
            
            // Completed today
            `SELECT COUNT(*) as completedToday FROM (
                SELECT id FROM id_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
                UNION ALL SELECT id FROM um_submissions WHERE status IN ('Approved for Filing', 'DONE') AND DATE(approval_date) = CURDATE()
            ) as completed_today`,
            
            // Approved
            `SELECT COUNT(*) as approved FROM (
                SELECT id FROM id_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
                UNION ALL SELECT id FROM tm_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
                UNION ALL SELECT id FROM cr_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
                UNION ALL SELECT id FROM um_submissions WHERE status LIKE '%Approved%' OR status = 'DONE'
            ) as approved_subs`,
            
            // Rejected
            `SELECT COUNT(*) as rejected FROM (
                SELECT id FROM id_submissions WHERE status LIKE '%Rejected%'
                UNION ALL SELECT id FROM tm_submissions WHERE status LIKE '%Rejected%'
                UNION ALL SELECT id FROM cr_submissions WHERE status LIKE '%Rejected%'
                UNION ALL SELECT id FROM um_submissions WHERE status LIKE '%Rejected%'
            ) as rejected_subs`,
            
            // Pending
            `SELECT COUNT(*) as pending FROM (
                SELECT id FROM id_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM um_submissions WHERE status IN ('Under Review', 'Revision Required')
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
                SELECT id FROM id_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM tm_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM cr_submissions WHERE status IN ('Under Review', 'Revision Required')
                UNION ALL SELECT id FROM um_submissions WHERE status IN ('Under Review', 'Revision Required')
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
        const [[idCount]] = await pool.query('SELECT COUNT(*) as count FROM id_submissions');
        const [[tmCount]] = await pool.query('SELECT COUNT(*) as count FROM tm_submissions');
        const [[crCount]] = await pool.query('SELECT COUNT(*) as count FROM cr_submissions');
        const [[umCount]] = await pool.query('SELECT COUNT(*) as count FROM um_submissions');

        const ipTypeBreakdown = {
            ID: idCount.count,
            TM: tmCount.count,
            CR: crCount.count,
            UM: umCount.count
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
            contact,        // ✅ ADDED
            address, 
            birthdate, 
            age,            // ✅ ADDED
            about, 
            specialization, 
            department 
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
        // ✅ ADD AGE UPDATE
        if (age !== undefined) {
            updates.push('age = ?');
            values.push(age);
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

        if (userType === 'Consultant' && (specialization !== undefined || about !== undefined)) {
            const consultantUpdates = [];
            const consultantValues = [];

            if (specialization !== undefined) {
                consultantUpdates.push('ip_category = ?');
                consultantValues.push(specialization);
            }
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
});
