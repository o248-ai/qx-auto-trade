const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const db = require('./database/db');

const authRoutes = require('./routes/auth');
const brokerRoutes = require('./routes/broker');
const strategyRoutes = require('./routes/strategy');
const tradingRoutes = require('./routes/trading');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const userRoutes = require('./routes/user');
const setupWebSocketServer = require('./websocket/socketServer');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Global User Auto-Healing & Permanent Session Recovery Middleware
app.use((req, res, next) => {
  try {
    let userId = req.headers['x-user-id'];
    let userEmail = req.headers['x-user-email'];
    let userName = req.headers['x-user-name'];
    let userPlan = req.headers['x-user-plan'];
    let userExpires = req.headers['x-user-plan-expires'];
    let isLifetime = req.headers['x-user-lifetime'] === 'true';

    // Decode JWT token if present
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token);
        if (decoded && typeof decoded === 'object') {
          // Master Admin and Admin tokens are never restricted by user deletion checks
          if (decoded.role === 'MASTER_ADMIN' || decoded.role === 'ADMIN') {
            return next();
          }
          if (!userId && decoded.id) userId = decoded.id;
          if (!userEmail && decoded.email) userEmail = decoded.email;
          if (!userName && decoded.name) userName = decoded.name;
        }
      } catch (e) {}
    }

    // Check query or body if present
    if (!userId && req.query?.userId) userId = req.query.userId;
    if (!userEmail && req.query?.userEmail) userEmail = req.query.userEmail;

    // If userId or userEmail is identified, check if account was deleted or ensure user is registered
    if ((userId && userId !== 'null' && userId !== 'undefined') || (userEmail && userEmail.includes('@'))) {
      const lookupEmail = userEmail ? userEmail.toLowerCase().trim() : null;

      // Block deleted users from being auto-healed, and notify client to clear session
      if (db.isUserDeleted(userId) || db.isUserDeleted(lookupEmail)) {
        if (
          req.path.startsWith('/api/') &&
          !req.path.startsWith('/api/admin') &&
          !req.path.startsWith('/api/strategy') &&
          !req.path.startsWith('/api/broker/supported') &&
          !req.path.startsWith('/api/auth/register') &&
          !req.path.startsWith('/api/auth/send-otp')
        ) {
          return res.status(401).json({
            error: 'Account has been deleted by administrator.',
            accountDeleted: true,
            isDeleted: true
          });
        }
        return next();
      }

      const users = db.get('users');
      const existing = users.find(u => (userId && u.id === userId) || (lookupEmail && u.email && u.email.toLowerCase() === lookupEmail));

      if (!existing) {
        // Auto-heal / restore missing user into Master Admin database
        const restored = db.upsertUser({
          id: userId || `user-${Date.now()}`,
          email: lookupEmail || `${userId}@trader.quotex`,
          name: userName || 'Trader',
          subscriptionPlan: userPlan || 'Free Trial',
          subExpiresAt: userExpires || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          isLifetimeApproved: isLifetime,
          isActive: true
        });
        console.log(`[Auto-Heal] Missing user auto-restored into Admin DB: ${restored.email} (${restored.name})`);
      } else {
        // If user exists, enhance any missing or placeholder fields
        let changed = false;
        if (userName && (!existing.name || existing.name.startsWith('Trader user-'))) {
          existing.name = userName;
          changed = true;
        }
        if (lookupEmail && (!existing.email || existing.email.includes('@trader.quotex'))) {
          existing.email = lookupEmail;
          changed = true;
        }
        if (changed) {
          db.save();
        }
      }
    }
  } catch (err) {
    // Non-blocking
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'QX Auto Trade Backend & Execution Engine',
    version: '2.4.2',
    timestamp: new Date().toISOString()
  });
});

// Robust frontend dist directory detection for both local and production VPS
let frontendDist = path.join(__dirname, '../../frontend/dist');
if (!fs.existsSync(frontendDist)) {
  frontendDist = path.join(__dirname, '../../dist');
}
if (!fs.existsSync(frontendDist)) {
  frontendDist = path.join(__dirname, '../../public_html');
}

console.log(`[Static Files] Serving fresh frontend production build from: ${frontendDist}`);

const dashboardDist = path.join(frontendDist, 'dashboard-app');

// Serve dashboard and admin static assets
app.use('/dashboard', express.static(dashboardDist));
app.use('/admin', express.static(dashboardDist));

// Explicit APK Download Route
app.get([
  '/Quotexautotrade.apk',
  '/downloads/Quotexautotrade.apk',
  '/downloads/Autotrade.apk',
  '/Autotrade.apk',
  '/downloads/qx-auto-trade.apk',
  '/qx-auto-trade.apk',
  '/QuCaptain.apk',
  '/downloads/QuCaptain.apk'
], (req, res) => {
  const isQuCaptain = req.path.toLowerCase().includes('qucaptain');
  const candidates = isQuCaptain ? [
    path.join(frontendDist, 'QuCaptain.apk'),
    path.join(__dirname, '../../QuCaptain.apk'),
    path.join(frontendDist, 'Quotexautotrade.apk'),
    path.join(frontendDist, 'Autotrade.apk')
  ] : [
    path.join(frontendDist, 'Quotexautotrade.apk'),
    path.join(__dirname, '../../Quotexautotrade.apk'),
    path.join(frontendDist, 'downloads/Autotrade.apk'),
    path.join(frontendDist, 'Autotrade.apk'),
    path.join(frontendDist, 'QuCaptain.apk'),
    path.join(__dirname, '../../frontend/dist/Quotexautotrade.apk')
  ];

  const downloadFilename = isQuCaptain ? 'QuCaptain.apk' : 'Quotexautotrade.apk';

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return res.download(p, downloadFilename);
    }
  }
  res.status(404).send('APK file not found');
});

// Explicit routes for dashboard & admin entry
app.get(['/dashboard', '/admin'], (req, res) => {
  res.sendFile(path.join(dashboardDist, 'index.html'));
});

// Serve original frontend for everything else
app.use(express.static(frontendDist));

// Original SPA Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  
  if (req.path.startsWith('/admin') || req.path.startsWith('/dashboard')) {
    return res.sendFile(path.join(dashboardDist, 'index.html'));
  }
  
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found');
  }
});

// Setup WebSocket Server
setupWebSocketServer(server);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('[Server] Connecting to MongoDB Atlas and restoring cloud snapshot...');
    await db.initMongo();
  } catch (err) {
    console.error('[Server] Cloud sync on startup error (fallback active):', err.message);
  }

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` QX AUTO TRADE Backend Server listening on port ${PORT}`);
    console.log(` WebSocket Real-Time Server Ready`);
    console.log(`=======================================================`);
  });
}

startServer();
