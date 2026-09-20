const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const tradingEngine = require('../engine/TradingEngine');

// Master Admin Stats
router.get('/stats', (req, res) => {
  const users = db.get('users');
  const connections = db.get('brokerConnections');
  const tradeLogs = db.get('tradeLogs');
  const referralRequests = db.get('referralRequests');

  const activeSessionsCount = Array.from(tradingEngine.activeSessions.values()).filter(s => s.status === 'RUNNING').length;
  const totalVolume = tradeLogs.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalProfit = tradeLogs.reduce((acc, t) => acc + (t.profitLoss || 0), 0);

  return res.json({
    totalUsers: users.length,
    activeSessionsCount,
    totalConnections: connections.length,
    pendingReferralsCount: referralRequests.filter(r => r.status === 'PENDING').length,
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    systemConfig: db.get('systemConfig')
  });
});

// Master Admin Global Emergency Stop
router.post('/global-emergency-stop', (req, res) => {
  const { adminEmail } = req.body;
  tradingEngine.emergencyStopAll(adminEmail || 'Master Admin');
  return res.json({
    message: 'GLOBAL EMERGENCY STOP ACTIVATED! All user bots have been force stopped.',
    systemConfig: db.get('systemConfig')
  });
});

// Clear Global Emergency Stop
router.post('/clear-emergency-stop', (req, res) => {
  const { adminEmail } = req.body;
  tradingEngine.clearEmergencyStop(adminEmail || 'Master Admin');
  return res.json({
    message: 'Global Emergency Stop cleared.',
    systemConfig: db.get('systemConfig')
  });
});

// Toggle Maintenance Mode
router.post('/toggle-maintenance', (req, res) => {
  const { enabled, isMaintenance, adminEmail } = req.body;
  const maintenanceState = (enabled !== undefined) ? Boolean(enabled) : Boolean(isMaintenance);

  const sysConfig = db.get('systemConfig') || {};
  sysConfig.maintenanceMode = maintenanceState;
  sysConfig.updatedAt = new Date().toISOString();
  db.set('systemConfig', sysConfig);

  const siteConfig = db.get('siteConfig') || {};
  siteConfig.maintenanceMode = maintenanceState;
  siteConfig.updatedAt = new Date().toISOString();
  db.set('siteConfig', siteConfig);

  if (maintenanceState) {
    for (const [userId, session] of tradingEngine.activeSessions.entries()) {
      tradingEngine.stopSession(userId, 'System Scheduled Maintenance');
    }
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: maintenanceState ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
    actorEmail: adminEmail || 'Master Admin',
    details: `Master Admin set Maintenance Mode to ${maintenanceState}`,
    timestamp: new Date().toISOString()
  });
  db.save();

  return res.json({ message: `Maintenance mode ${maintenanceState ? 'enabled' : 'disabled'}.`, systemConfig: sysConfig, siteConfig });
});

// Force Stop Single User Bot
router.post('/force-stop-user', (req, res) => {
  const { userId, adminEmail } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  const session = tradingEngine.forceStopUserBot(userId, adminEmail || 'Master Admin');
  return res.json({ message: `Force stopped bot session for user ${userId}.`, session });
});

// Edit User Details (Name, Email, Plan, Expiry, Active Status, Telegram ID, Broker ID, Broker Name, Trading Mode, MTG Level)
router.post('/edit-user-details', (req, res) => {
  try {
    const { userId, name, email, subscriptionPlan, plan, subExpiresAt, planExpiresAt, isFreeTrialExpired, isActive, active, isLifetimeApproved, telegramId, brokerId, brokerName, tradingMode, maxMtgLevel, adminEmail } = req.body;
    const users = db.get('users');
    const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === (userId || '').toLowerCase()));

    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    
    const targetPlan = subscriptionPlan || plan;
    if (targetPlan) {
      user.subscriptionPlan = targetPlan;
      user.plan = targetPlan;
      if (targetPlan.toLowerCase().includes('free') && !targetPlan.toLowerCase().includes('lifetime')) {
        user.isLifetimeApproved = false;
      } else if (targetPlan.toLowerCase().includes('lifetime')) {
        user.isLifetimeApproved = true;
        user.isFreeTrialExpired = false;
      } else {
        // Upgraded to a paid plan (Basic, Pro, Quantum, Premium, etc.)
        user.isFreeTrialExpired = false;
      }
    }
    
    if (planExpiresAt) {
      user.planExpiresAt = planExpiresAt;
      user.subExpiresAt = planExpiresAt;
    } else if (subExpiresAt) {
      user.subExpiresAt = subExpiresAt;
      user.planExpiresAt = subExpiresAt;
    }

    if (isFreeTrialExpired !== undefined) {
      user.isFreeTrialExpired = Boolean(isFreeTrialExpired);
    }
    if (isActive !== undefined || active !== undefined) {
      const activeVal = (isActive !== undefined) ? Boolean(isActive) : Boolean(active);
      user.isActive = activeVal;
      user.active = activeVal;
    }
    if (isLifetimeApproved !== undefined) user.isLifetimeApproved = Boolean(isLifetimeApproved);
    if (telegramId !== undefined) user.telegramId = telegramId;
    if (brokerId !== undefined) user.brokerId = brokerId;
    if (brokerName !== undefined) user.brokerName = brokerName;

    // Update risk settings if tradingMode or maxMtgLevel provided
    const riskSettingsMap = db.get('riskSettings');
    if (!riskSettingsMap[userId]) {
      riskSettingsMap[userId] = {
        mode: 'MTG',
        fixedAmount: 10,
        mtgMultiplier: 2.1,
        maxMtgLevel: 5,
        dailyProfitTarget: 100,
        dailyStopLoss: 150
      };
    }
    if (tradingMode) riskSettingsMap[userId].mode = tradingMode;
    if (maxMtgLevel !== undefined) riskSettingsMap[userId].maxMtgLevel = parseInt(maxMtgLevel, 10);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_EDIT_USER_DETAILS',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Updated details for ${user.email}: Plan=${user.subscriptionPlan}, Active=${user.isActive}, Mode=${tradingMode || riskSettingsMap[userId].mode}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'User details updated successfully!', user, riskSettings: riskSettingsMap[userId] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Reactivate Free Trial (1 Hour Full Access) by Admin
router.post('/reactivate-free-trial', (req, res) => {
  try {
    const { userId, adminEmail } = req.body;
    const users = db.get('users') || [];
    const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === (userId || '').toLowerCase()));
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const nowMs = Date.now();
    user.trialStartedAt = new Date(nowMs).toISOString();
    user.trialStartedAtMs = nowMs;
    user.trialExpiresAtMs = nowMs + 60 * 60 * 1000;
    user.subExpiresAt = new Date(nowMs + 60 * 60 * 1000).toISOString();
    user.planExpiresAt = new Date(nowMs + 60 * 60 * 1000).toISOString();
    user.isFreeTrialExpired = false;
    user.subscriptionPlan = 'Free Trial';
    user.plan = 'Free Trial';
    user.isActive = true;
    user.active = true;

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_REACTIVATE_FREE_TRIAL',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: user.id,
      details: `Reactivated 1-Hour Free Trial for ${user.name} (${user.email})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Free Trial re-activated for 1 hour for ${user.name}!`, user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Reset User Password by Master Admin
router.post('/reset-user-password', async (req, res) => {
  try {
    const { userId, newPassword, adminEmail } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required.' });
    }

    const users = db.get('users');
    const user = users.find(u => u.id === userId);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_RESET_USER_PASSWORD',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Master Admin reset password for ${user.email}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Password reset successfully for ${user.email}!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle User Active Status
router.post('/toggle-user-active', (req, res) => {
  const { userId, isActive, active, adminEmail } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  const nextActive = (isActive !== undefined) ? Boolean(isActive) : (active !== undefined ? Boolean(active) : (user.isActive === false || user.active === false));
  user.isActive = nextActive;
  user.active = nextActive;

  if (!nextActive) {
    tradingEngine.stopSession(userId, 'Account deactivated by Master Admin');
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: nextActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    actorEmail: adminEmail || 'Master Admin',
    targetUserId: userId,
    details: `User account ${user.email} marked as ${nextActive ? 'ACTIVE' : 'INACTIVE'}`,
    timestamp: new Date().toISOString()
  });

  db.save();
  return res.json({ message: `User ${user.email} ${nextActive ? 'activated' : 'deactivated'}.`, user, isActive: nextActive, active: nextActive });
});

// List All Live User Sessions & Activity Logs
router.get('/live-sessions', (req, res) => {
  const sessions = Array.from(tradingEngine.activeSessions.values());
  const users = db.get('users') || [];
  const enriched = sessions.map(s => {
    const u = users.find(usr => usr.id === s.userId);
    return {
      ...s,
      userName: u?.name || s.userId,
      userEmail: u?.email || 'unknown@user.com'
    };
  });
  const activityLogs = (db.get('auditLogs') || []).slice(0, 300);
  return res.json({ sessions: enriched, activityLogs });
});

router.get('/activity-logs', (req, res) => {
  const activityLogs = (db.get('auditLogs') || []).slice(0, 300);
  return res.json({ activityLogs });
});

// Update Strategy Parameters
router.post('/strategy-parameters', (req, res) => {
  const { strategyId, parameters, winRate, timeframe } = req.body;
  const strategies = db.get('strategies');
  const strat = strategies.find(s => s.id === strategyId);

  if (!strat) return res.status(404).json({ error: 'Strategy not found.' });

  if (parameters) strat.parameters = parameters;
  if (winRate) strat.winRate = parseFloat(winRate);
  if (timeframe) strat.timeframe = timeframe;

  db.save();
  return res.json({ message: 'Strategy parameters updated successfully!', strategy: strat });
});

// Audit Logs & Errors
router.get('/audit-logs', (req, res) => {
  return res.json({
    auditLogs: db.get('auditLogs'),
    announcements: db.get('announcements'),
    errorLogs: db.get('errorLogs') || []
  });
});

// All System Trade Logs for Admin
router.get('/all-trade-logs', (req, res) => {
  const tradeLogs = db.get('tradeLogs') || [];
  return res.json({ tradeLogs });
});

// List Users (Newest registrations appear first)
router.get('/users', (req, res) => {
  const users = [...(db.get('users') || [])];
  users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return res.json({ users });
});

// Approve or Reject Referral Lifetime Free Access
router.post('/approve-referral', (req, res) => {
  const { requestId, status, adminEmail } = req.body;
  const requests = db.get('referralRequests');
  const reqItem = requests.find(r => r.id === requestId);

  if (!reqItem) return res.status(404).json({ error: 'Referral request not found.' });

  reqItem.status = status;

  if (status === 'APPROVED') {
    const users = db.get('users');
    const user = users.find(u => u.id === reqItem.userId);
    if (user) {
      user.isLifetimeApproved = true;
      user.depositVerified = true;
      user.subscriptionPlan = 'Lifetime Free';
    }
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: `REFERRAL_${status}`,
    actorEmail: adminEmail || 'Master Admin',
    targetUserId: reqItem.userId,
    details: `Referral deposit request ${requestId} marked as ${status}`,
    timestamp: new Date().toISOString()
  });

  db.save();
  return res.json({ message: `Referral request ${status.toLowerCase()}!`, request: reqItem });
});

// Get All Announcements
router.get('/announcements', (req, res) => {
  const announcements = db.get('announcements') || [];
  return res.json({ announcements });
});

// Helper to sync active announcement to siteConfig
function syncAnnouncementToSiteConfig(announcements) {
  try {
    const active = (announcements || []).find(a => a.isActive !== false && a.active !== false);
    const siteConfig = db.get('siteConfig') || {};
    if (active) {
      siteConfig.announcementText = `${active.title}: ${active.content}`;
      siteConfig.isAnnouncementActive = true;
    } else {
      siteConfig.isAnnouncementActive = false;
    }
    db.set('siteConfig', siteConfig);
  } catch(e) {}
}

// Send/Create Announcement
router.post('/announcements', (req, res) => {
  const { title, content, type, target } = req.body;
  const announcements = db.get('announcements') || [];
  const newAnn = {
    id: `ann-${Date.now()}`,
    title,
    content,
    type: type || 'INFO',
    target: target || { homePage: true, userPage: true },
    isActive: true,
    active: true,
    createdAt: new Date().toISOString()
  };
  announcements.unshift(newAnn);
  db.set('announcements', announcements);
  syncAnnouncementToSiteConfig(announcements);
  db.save();
  return res.json({ message: 'Announcement published!', announcement: newAnn, announcements });
});

// Update/Edit Announcement
router.put('/announcements/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, target, isActive } = req.body;
  const announcements = db.get('announcements') || [];
  const ann = announcements.find(a => a.id === id);
  if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

  if (title !== undefined) ann.title = title;
  if (content !== undefined) ann.content = content;
  if (target !== undefined) ann.target = target;
  if (isActive !== undefined) {
    ann.isActive = Boolean(isActive);
    ann.active = Boolean(isActive);
  }

  syncAnnouncementToSiteConfig(announcements);
  db.save();
  return res.json({ message: 'Announcement updated!', announcement: ann, announcements });
});

// Toggle Announcement Active Status
router.post('/toggle-announcement-active', (req, res) => {
  const { announcementId, isActive, active } = req.body;
  const announcements = db.get('announcements') || [];
  const ann = announcements.find(a => a.id === announcementId || a._id === announcementId || String(a.id) === String(announcementId) || String(a._id) === String(announcementId));
  if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

  const nextState = (isActive !== undefined) ? Boolean(isActive) : (active !== undefined ? Boolean(active) : !(ann.isActive || ann.active));
  ann.isActive = nextState;
  ann.active = nextState;
  syncAnnouncementToSiteConfig(announcements);
  db.save();
  return res.json({ message: `Announcement set to ${nextState ? 'Active' : 'Inactive'}`, announcements, isActive: nextState, active: nextState });
});

// REST DELETE route for announcement
router.delete('/announcements/:id', (req, res) => {
  try {
    const { id } = req.params;
    let announcements = db.get('announcements') || [];
    const idx = announcements.findIndex(a => a.id === id || a._id === id || String(a.id) === String(id) || String(a._id) === String(id));
    if (idx !== -1) {
      announcements.splice(idx, 1);
      db.set('announcements', announcements);
      syncAnnouncementToSiteConfig(announcements);
      db.save();
    }
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Add New User by Admin
router.post('/add-user', async (req, res) => {
  try {
    const { name, email, password, subscriptionPlan, brokerName, brokerId, telegramId, adminEmail } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const users = db.get('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = db.upsertUser({
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER',
      isActive: true,
      subscriptionPlan: subscriptionPlan || 'Free Trial',
      subExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      brokerName: brokerName || 'QUOTEX',
      brokerId: brokerId || '',
      telegramId: telegramId || '',
      createdAt: new Date().toISOString()
    });

    const riskSettings = db.get('riskSettings');
    if (!riskSettings[newUser.id]) {
      riskSettings[newUser.id] = {
        mode: 'MTG',
        fixedAmount: 10,
        mtgMultiplier: 2.1,
        maxMtgLevel: 5,
        dailyProfitTarget: 100,
        dailyStopLoss: 150
      };
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_ADD_USER',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: newUser.id,
      details: `Master Admin created user account for ${newUser.email}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'User created successfully!', user: newUser, users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Change Admin Password
router.post('/change-admin-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, adminEmail } = req.body;
    if (!newPassword || newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters.' });
    }

    const siteConfig = db.get('siteConfig') || {};
    const users = db.get('users') || [];
    const normalizedEmail = (adminEmail || req.headers['x-user-email'] || 'admin@qxautotrade.com').trim().toLowerCase();
    const adminUser = users.find(u => u.email?.toLowerCase() === normalizedEmail || u.role === 'MASTER_ADMIN');

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to change admin password.' });
    }

    // Verify current password against siteConfig hash, plain text, or admin user record
    let isCurrentValid = false;
    if (siteConfig.adminPasswordHash) {
      isCurrentValid = await bcrypt.compare(currentPassword, siteConfig.adminPasswordHash);
    } else if (siteConfig.adminPassword) {
      isCurrentValid = (currentPassword === siteConfig.adminPassword);
    } else if (adminUser && adminUser.passwordHash) {
      isCurrentValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
    } else {
      isCurrentValid = (currentPassword === 'admin123' || currentPassword === 'password123');
    }

    if (!isCurrentValid) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword.trim(), salt);

    siteConfig.adminPasswordHash = hash;
    siteConfig.adminPasswordSet = true;
    siteConfig.adminPasswordUpdatedAt = new Date().toISOString();
    delete siteConfig.adminPassword;
    db.set('siteConfig', siteConfig);

    if (adminUser) {
      adminUser.passwordHash = hash;
      adminUser.password = '';
    } else {
      users.push({
        id: 'admin-master',
        name: 'Master Admin',
        email: normalizedEmail,
        passwordHash: hash,
        role: 'MASTER_ADMIN',
        isActive: true,
        createdAt: new Date().toISOString()
      });
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_CHANGE_PASSWORD',
      actorEmail: normalizedEmail,
      details: 'Master Admin changed administrative login password.',
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Admin login password updated successfully! Please use your new password for subsequent logins.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin: Get All Strategies
router.get('/strategies', (req, res) => {
  try {
    const { broker, includeInactive } = req.query;
    let strategies = db.get('strategies') || [];
    if (broker) {
      const bLower = broker.toLowerCase().trim();
      strategies = strategies.filter(s => {
        const sBroker = (s.broker || '').toLowerCase().trim();
        return !sBroker || sBroker === bLower || sBroker === 'all' || (bLower === 'quotex' && (sBroker.includes('quotex') || sBroker === ''));
      });
    }
    if (includeInactive !== 'true') {
      strategies = strategies.filter(s => s.isActive !== false);
    }
    return res.json({ strategies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin: Add Strategy
router.post('/add-strategy', (req, res) => {
  try {
    const { name, broker, winRate, timeframe, indicatorSummary, description, parameters, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Strategy name is required.' });
    }

    let strategies = db.get('strategies');
    if (!Array.isArray(strategies)) {
      strategies = [];
      db.set('strategies', strategies);
    }

    const newStrategy = {
      id: `strat-${Date.now()}`,
      name: name.trim(),
      broker: (broker || 'quotex').toLowerCase().trim(),
      winRate: parseFloat(winRate || 85),
      timeframe: (timeframe || '1m').toUpperCase(),
      indicatorSummary: indicatorSummary || 'Custom Algorithmic Setup',
      description: description || 'Master Admin configured trading algorithm.',
      parameters: parameters || {},
      isActive: isActive !== false,
      createdAt: new Date().toISOString(),
      createdBy: 'Master Admin'
    };

    strategies.push(newStrategy);
    db.get('auditLogs')?.unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_ADD_STRATEGY',
      details: `Added new strategy "${newStrategy.name}" (${newStrategy.broker})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Strategy added successfully!', strategy: newStrategy, strategies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin: Edit Strategy
router.post('/edit-strategy', (req, res) => {
  try {
    const { id, strategyId, name, broker, winRate, timeframe, indicatorSummary, description, parameters, isActive } = req.body;
    const targetId = id || strategyId;
    if (!targetId) {
      return res.status(400).json({ error: 'Strategy ID is required.' });
    }

    const strategies = db.get('strategies') || [];
    const idx = strategies.findIndex(s => String(s.id).trim().toLowerCase() === String(targetId).trim().toLowerCase());
    if (idx === -1) {
      return res.status(404).json({ error: 'Strategy not found.' });
    }

    strategies[idx] = {
      ...strategies[idx],
      name: name !== undefined ? name.trim() : strategies[idx].name,
      broker: broker !== undefined ? broker.toLowerCase().trim() : strategies[idx].broker,
      winRate: winRate !== undefined ? parseFloat(winRate) : strategies[idx].winRate,
      timeframe: timeframe !== undefined ? timeframe.toUpperCase() : strategies[idx].timeframe,
      indicatorSummary: indicatorSummary !== undefined ? indicatorSummary : strategies[idx].indicatorSummary,
      description: description !== undefined ? description : strategies[idx].description,
      parameters: parameters !== undefined ? parameters : (strategies[idx].parameters || {}),
      isActive: isActive !== undefined ? Boolean(isActive) : strategies[idx].isActive,
      updatedAt: new Date().toISOString()
    };

    db.get('auditLogs')?.unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_EDIT_STRATEGY',
      details: `Updated strategy "${strategies[idx].name}" (${targetId})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Strategy updated successfully!', strategy: strategies[idx], strategies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin: Delete Strategy
router.post('/delete-strategy', (req, res) => {
  try {
    const { id, strategyId } = req.body;
    const targetId = id || strategyId;
    if (!targetId) {
      return res.status(400).json({ error: 'Strategy ID is required.' });
    }

    let strategies = db.get('strategies') || [];
    const initialLen = strategies.length;
    const filtered = strategies.filter(s => s.id !== targetId);

    db.set('strategies', filtered);

    // Permanently record in deletedStrategyIds so it is NEVER resurrected on reboot or sync
    if (!Array.isArray(db.data.deletedStrategyIds)) {
      db.data.deletedStrategyIds = [];
    }
    const cleanStratId = String(targetId).trim().toLowerCase();
    if (!db.data.deletedStrategyIds.some(id => String(id).trim().toLowerCase() === cleanStratId)) {
      db.data.deletedStrategyIds.push(targetId);
    }

    db.get('auditLogs')?.unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_DELETE_STRATEGY',
      details: `Deleted strategy with ID ${targetId}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Strategy deleted successfully!', strategies: filtered });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin: Toggle Strategy Active
router.post('/toggle-strategy-active', (req, res) => {
  try {
    const { id, strategyId, isActive } = req.body;
    const targetId = id || strategyId;
    if (!targetId) {
      return res.status(400).json({ error: 'Strategy ID is required.' });
    }

    const strategies = db.get('strategies') || [];
    const strat = strategies.find(s => s.id === targetId);
    if (!strat) {
      return res.status(404).json({ error: 'Strategy not found.' });
    }

    strat.isActive = (isActive !== undefined) ? Boolean(isActive) : !strat.isActive;
    strat.updatedAt = new Date().toISOString();

    db.save();
    return res.json({ message: `Strategy "${strat.name}" is now ${strat.isActive ? 'active' : 'inactive'}.`, strategy: strat, strategies });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle Individual Emergency Controls (User Reg, User Login, Trading Strategies)
router.post('/toggle-emergency-control', (req, res) => {
  try {
    const { controlKey, enabled, key, value, adminEmail } = req.body;
    const targetKey = controlKey || key;
    const isEnabled = (enabled !== undefined) ? Boolean(enabled) : Boolean(value);

    if (!targetKey) {
      return res.status(400).json({ error: 'Control key is required.' });
    }

    const sysConfig = db.get('systemConfig') || {};
    if (!sysConfig.emergencyControls) {
      sysConfig.emergencyControls = {
        userRegistrationEnabled: true,
        userLoginEnabled: true,
        tradingStrategiesEnabled: true
      };
    }
    sysConfig.emergencyControls[targetKey] = isEnabled;
    sysConfig.updatedAt = new Date().toISOString();
    db.set('systemConfig', sysConfig);

    // Synchronize to siteConfig as well
    const siteConfig = db.get('siteConfig') || {};
    if (!siteConfig.emergencyControls) {
      siteConfig.emergencyControls = { ...sysConfig.emergencyControls };
    }
    siteConfig.emergencyControls[targetKey] = isEnabled;
    siteConfig.updatedAt = new Date().toISOString();
    db.set('siteConfig', siteConfig);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'TOGGLE_EMERGENCY_CONTROL',
      actorEmail: adminEmail || 'Master Admin',
      details: `Emergency control ${targetKey} set to ${isEnabled}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Control ${targetKey} set to ${isEnabled}`, systemConfig: sysConfig, siteConfig });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Site Settings (Social Links, Referral Link & Amount, Footer Text, Payment Details)
router.get('/site-config', (req, res) => {
  return res.json({ siteConfig: db.get('siteConfig') });
});

router.post('/site-config', (req, res) => {
  try {
    const newConfig = req.body?.siteConfig || req.body || {};
    const existingConfig = db.get('siteConfig') || {};

    const upi = newConfig.paymentUpi || newConfig.upiAddress || existingConfig.paymentUpi || existingConfig.upiAddress || '';
    const usdt = newConfig.paymentUsdt || newConfig.usdtAddress || existingConfig.paymentUsdt || existingConfig.usdtAddress || '';
    const logo = newConfig.logoUrl || newConfig.siteLogo || existingConfig.logoUrl || existingConfig.siteLogo || '';
    const fav = newConfig.faviconUrl || newConfig.favicon || existingConfig.faviconUrl || existingConfig.favicon || '';

    let ytEmbed = (newConfig.youtubeEmbedLink !== undefined ? newConfig.youtubeEmbedLink : (newConfig.youtubeEmbedCode !== undefined ? newConfig.youtubeEmbedCode : (existingConfig.youtubeEmbedLink || existingConfig.youtubeEmbedCode || ''))).trim();
    if (ytEmbed) {
      const match = ytEmbed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
      if (match && match[1]) {
        ytEmbed = `https://www.youtube.com/embed/${match[1]}`;
      }
    }

    const updatedConfig = {
      ...existingConfig,
      ...newConfig,
      youtubeEmbedLink: ytEmbed,
      youtubeEmbedCode: ytEmbed,
      paymentUpi: upi,
      upiAddress: upi,
      paymentUsdt: usdt,
      usdtAddress: usdt,
      logoUrl: logo,
      siteLogo: logo,
      faviconUrl: fav,
      favicon: fav,
      updatedAt: new Date().toISOString()
    };

    if (newConfig.priceBasic !== undefined) updatedConfig.priceBasic = parseFloat(newConfig.priceBasic) || 0;
    if (newConfig.pricePro !== undefined) updatedConfig.pricePro = parseFloat(newConfig.pricePro) || 0;
    if (newConfig.priceQuantum !== undefined) updatedConfig.priceQuantum = parseFloat(newConfig.priceQuantum) || 0;
    if (newConfig.pricePremium !== undefined) updatedConfig.pricePremium = parseFloat(newConfig.pricePremium) || 0;

    db.set('siteConfig', updatedConfig);

    // Sync updated prices to subscriptionPlans
    const plans = db.get('subscriptionPlans') || [];
    if (updatedConfig.priceBasic !== undefined) {
      const basic = plans.find(p => p.id === 'plan-basic' || p.name.toLowerCase().includes('basic'));
      if (basic) {
        basic.price = `$${updatedConfig.priceBasic}`;
        basic.numericPrice = updatedConfig.priceBasic;
      }
    }
    if (updatedConfig.pricePro !== undefined) {
      const pro = plans.find(p => p.id === 'plan-pro' || p.name.toLowerCase().includes('pro'));
      if (pro) {
        pro.price = `$${updatedConfig.pricePro}`;
        pro.numericPrice = updatedConfig.pricePro;
      }
    }
    if (updatedConfig.priceQuantum !== undefined) {
      const quantum = plans.find(p => p.id === 'plan-quantum' || p.name.toLowerCase().includes('quantum'));
      if (quantum) {
        quantum.price = `$${updatedConfig.priceQuantum}`;
        quantum.numericPrice = updatedConfig.priceQuantum;
      }
    }
    if (updatedConfig.pricePremium !== undefined) {
      const premium = plans.find(p => p.id === 'plan-premium' || p.name.toLowerCase().includes('premium'));
      if (premium) {
        premium.price = `$${updatedConfig.pricePremium}`;
        premium.numericPrice = updatedConfig.pricePremium;
      }
    }
    db.set('subscriptionPlans', plans);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_UPDATE_SITE_CONFIG',
      actorEmail: 'admin@qxautotrade.com',
      details: 'Updated site configuration, plan pricing, and links',
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Site configuration updated successfully!', siteConfig: updatedConfig });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Plan Subscriptions List & Approval / Rejection
router.get('/plan-subscriptions', (req, res) => {
  const users = db.get('users') || [];
  let subscriptions = db.get('planSubscriptions') || [];
  const referralRequests = db.get('referralRequests') || [];
  const deletedIds = new Set(db.get('deletedSubscriptionIds') || []);

  // Filter out any explicitly deleted subscriptions
  subscriptions = subscriptions.filter(s => {
    if (deletedIds.has(s.id) || deletedIds.has(s.paymentTxId) || (s.refRequestId && deletedIds.has(s.refRequestId))) return false;
    return true;
  });

  // Merge any referral free access requests not already present and NOT deleted
  let added = false;
  referralRequests.forEach(ref => {
    const freeSubId = ref.subId || `sub-free-${ref.id}`;
    const txId = `FREE-${ref.referralUid}-${ref.id}`;
    if (deletedIds.has(freeSubId) || deletedIds.has(ref.id) || deletedIds.has(txId) || deletedIds.has(ref.subId)) return;

    const existing = subscriptions.find(s => s.id === freeSubId || s.id === ref.subId || s.paymentTxId === txId || (s.refRequestId && s.refRequestId === ref.id) || (s.userId === ref.userId && s.type === 'free_access'));
    if (!existing) {
      const u = users.find(usr => usr.id === ref.userId || (ref.userEmail && usr.email && usr.email.toLowerCase() === ref.userEmail.toLowerCase()));
      subscriptions.unshift({
        id: freeSubId,
        refRequestId: ref.id,
        userId: ref.userId,
        userEmail: (u && u.email) ? u.email : (ref.userEmail || ''),
        userName: (u && u.name) ? u.name : (ref.userName || 'Trader'),
        planName: 'Lifetime VIP (Free Access)',
        price: '$0 (Deposit Proof)',
        period: 'Lifetime',
        paymentTxId: txId,
        paymentProof: ref.proofUrl || 'Deposit Proof (Broker Trader ID)',
        status: ref.status || 'PENDING',
        type: 'free_access',
        notes: `Trader ID: ${ref.referralUid || 'N/A'}, Deposit: $${ref.depositAmount || 100}`,
        createdAt: ref.createdAt || new Date().toISOString()
      });
      added = true;
    }
  });

  // Enrich ALL subscriptions with user name and user email from db.users if placeholder/missing
  subscriptions.forEach(s => {
    const u = users.find(usr => usr.id === s.userId || (s.userEmail && usr.email && usr.email.toLowerCase() === s.userEmail.toLowerCase()));
    if (u) {
      if (!s.userName || s.userName === 'Trader') s.userName = u.name || s.userName;
      if (!s.userEmail || s.userEmail.includes('@trader.quotex') || s.userEmail.includes('@user.local') || s.userEmail === 'user@qxautotrade.com') {
        s.userEmail = u.email || s.userEmail;
      }
    }
  });

  if (added) {
    db.set('planSubscriptions', subscriptions);
    db.save();
  }

  return res.json({ subscriptions });
});

router.post('/approve-plan-subscription', (req, res) => {
  try {
    const { subscriptionId, adminEmail } = req.body;
    const subscriptions = db.get('planSubscriptions') || [];
    const sub = subscriptions.find(s => s.id === subscriptionId);

    if (!sub) return res.status(404).json({ error: 'Subscription payment request not found.' });

    sub.status = 'APPROVED';
    sub.approvedAt = new Date().toISOString();

    // Upgrade User Plan
    const users = db.get('users') || [];
    const user = users.find(u => u.id === sub.userId || (sub.userEmail && u.email && u.email.toLowerCase() === sub.userEmail.toLowerCase()));
    if (user) {
      user.subscriptionPlan = sub.planName;
      // Set sub expiry depending on plan duration
      let durationDays = 30;
      if (sub.planName.includes('Basic')) durationDays = 30;
      else if (sub.planName.includes('Pro')) durationDays = 90;
      else if (sub.planName.includes('Quantum')) durationDays = 180;
      else if (sub.planName.includes('Premium')) durationDays = 365;
      else if (sub.planName.includes('Lifetime') || sub.type === 'free_access') durationDays = 36500;

      if (sub.planName.includes('Lifetime') || sub.type === 'free_access') {
        user.isLifetimeApproved = true;
        user.depositVerified = true;
        user.subscriptionPlan = 'Lifetime VIP';
      }

      user.subExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
      user.planExpiresAt = user.subExpiresAt;
      user.isFreeTrialExpired = false;

      // Also mark any matching referralRequests as APPROVED
      const refRequests = db.get('referralRequests') || [];
      refRequests.forEach(r => {
        if (r.userId === sub.userId || (sub.userEmail && r.userEmail && r.userEmail.toLowerCase() === sub.userEmail.toLowerCase())) {
          r.status = 'APPROVED';
        }
      });

      // 10% Referral Commission Credit to Referrer
      if (user.referralUid) {
        const cleanRef = user.referralUid.trim();
        const referrer = users.find(u =>
          u.id === cleanRef ||
          (u.email && u.email.toLowerCase() === cleanRef.toLowerCase()) ||
          (u.referralUid && u.referralUid.toUpperCase() === cleanRef.toUpperCase()) ||
          (`QX-${(u.referralUid || u.id).replace(/[^0-9A-Za-z]/g, '').slice(-6).toUpperCase()}` === cleanRef.toUpperCase())
        );
        if (referrer && referrer.id !== user.id) {
          const rawPrice = parseFloat(String(sub.price || '0').replace(/[^0-9.]/g, '')) || 0;
          const commAmount = rawPrice * 0.10;
          if (commAmount > 0) {
            referrer.referralEarnings = (referrer.referralEarnings || 0) + commAmount;
            db.get('auditLogs').unshift({
              id: `audit-${Date.now()}`,
              action: 'REFERRAL_COMMISSION_CREDITED',
              actorEmail: 'System',
              targetUserId: referrer.id,
              details: `Credited $${commAmount.toFixed(2)} (10%) commission to ${referrer.email} for ${user.email}'s ${sub.planName} purchase.`,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_APPROVED',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: sub.userId,
      details: `Approved subscription ${sub.planName} ($${sub.price}) for ${sub.userEmail}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Subscription for ${sub.userEmail} approved successfully!`, subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/reject-plan-subscription', (req, res) => {
  try {
    const { subscriptionId, adminEmail } = req.body;
    const subscriptions = db.get('planSubscriptions') || [];
    const sub = subscriptions.find(s => s.id === subscriptionId);

    if (!sub) return res.status(404).json({ error: 'Subscription payment request not found.' });

    sub.status = 'REJECTED';
    sub.rejectedAt = new Date().toISOString();

    const users = db.get('users') || [];
    const user = users.find(u => u.id === sub.userId || (sub.userEmail && u.email && u.email.toLowerCase() === sub.userEmail.toLowerCase()));
    if (user && (sub.type === 'free_access' || sub.planName.includes('Lifetime'))) {
      user.isLifetimeApproved = false;
    }

    const refRequests = db.get('referralRequests') || [];
    refRequests.forEach(r => {
      if (r.userId === sub.userId || (sub.userEmail && r.userEmail && r.userEmail.toLowerCase() === sub.userEmail.toLowerCase())) {
        r.status = 'REJECTED';
      }
    });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_REJECTED',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: sub.userId,
      details: `Rejected subscription request ${subscriptionId} for ${sub.userEmail}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Subscription request rejected.`, subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete User by Master Admin
router.post('/delete-user', (req, res) => {
  try {
    const { userId, adminEmail } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    const deletedUser = db.deleteUser(userId, adminEmail || 'Master Admin');
    if (!deletedUser) return res.status(404).json({ error: 'User not found.' });

    // Stop active bot session if running
    tradingEngine.stopSession(userId, 'User account deleted by Master Admin');

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_DELETE_USER',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Deleted user ${deletedUser.email} (${deletedUser.name})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `User ${deletedUser.email} deleted permanently.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Bulk Delete Users by Master Admin
router.post('/bulk-delete-users', (req, res) => {
  try {
    const userIds = req.body.userIds || req.body.ids || [];
    const { adminEmail } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided for deletion.' });
    }

    const deletedEmails = [];
    userIds.forEach(uId => {
      const deleted = db.deleteUser(uId, adminEmail || 'Master Admin');
      if (deleted) {
        tradingEngine.stopSession(uId, 'User account deleted by Master Admin');
        deletedEmails.push(deleted.email || uId);
      }
    });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_BULK_DELETE_USERS',
      actorEmail: adminEmail || 'Master Admin',
      details: `Master Admin bulk deleted ${deletedEmails.length} user account(s): ${deletedEmails.slice(0, 10).join(', ')}${deletedEmails.length > 10 ? '...' : ''}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({
      message: `Successfully deleted ${deletedEmails.length} user(s) permanently.`,
      deletedCount: deletedEmails.length,
      users: db.get('users')
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete plan subscription request
router.post('/delete-plan-subscription', (req, res) => {
  try {
    const subId = req.body.subscriptionId || req.body.id;
    if (!subId) return res.status(400).json({ error: 'Subscription ID is required.' });

    let subscriptions = db.get('planSubscriptions') || [];
    const target = subscriptions.find(s => s.id === subId);

    // Remove from planSubscriptions
    subscriptions = subscriptions.filter(s => s.id !== subId);
    db.set('planSubscriptions', subscriptions);

    // Collect all IDs associated with this subscription
    const idsToBlacklist = new Set([subId]);
    if (target?.paymentTxId) idsToBlacklist.add(target.paymentTxId);
    if (target?.refRequestId) idsToBlacklist.add(target.refRequestId);

    const rawTimestamp = subId.replace(/^sub-free-(ref-req-)?/, '').replace(/^sub-req-/, '');
    if (rawTimestamp) {
      idsToBlacklist.add(rawTimestamp);
      idsToBlacklist.add(`ref-req-${rawTimestamp}`);
      idsToBlacklist.add(`sub-free-${rawTimestamp}`);
      idsToBlacklist.add(`sub-free-ref-req-${rawTimestamp}`);
    }

    // Also clean up matching item from referralRequests so it NEVER resurrects!
    let referralRequests = db.get('referralRequests') || [];
    referralRequests = referralRequests.filter(ref => {
      if (idsToBlacklist.has(ref.id) || idsToBlacklist.has(ref.subId)) return false;
      if (target && target.userId && ref.userId === target.userId && (target.type === 'free_access' || target.planName?.includes('Lifetime'))) return false;
      if (target && target.paymentTxId && (target.paymentTxId.includes(ref.id) || (ref.referralUid && target.paymentTxId.includes(ref.referralUid)))) return false;
      return true;
    });
    db.set('referralRequests', referralRequests);

    // Track in deletedSubscriptionIds blacklist
    let deletedIds = db.get('deletedSubscriptionIds') || [];
    idsToBlacklist.forEach(id => {
      if (id && !deletedIds.includes(id)) deletedIds.push(id);
    });
    db.set('deletedSubscriptionIds', deletedIds);

    // If target belonged to a user, check if their active plan should revert to Free Trial
    if (target && (target.userId || target.userEmail)) {
      const users = db.get('users') || [];
      const user = users.find(u => (target.userId && u.id === target.userId) || (target.userEmail && u.email && u.email.toLowerCase() === target.userEmail.toLowerCase()));
      if (user) {
        const hasOtherApproved = subscriptions.some(s => (s.userId === user.id || (user.email && s.userEmail?.toLowerCase() === user.email.toLowerCase())) && s.status === 'APPROVED');
        if (!hasOtherApproved) {
          user.subscriptionPlan = 'Free Trial';
          user.plan = 'Free Trial';
          user.isLifetimeApproved = false;
          user.subExpiresAt = '';
          user.planExpiresAt = '';
        }
      }
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_DELETED',
      actorEmail: 'Master Admin',
      details: `Permanently deleted subscription request: ${subId}`,
      timestamp: new Date().toISOString()
    });
    db.save();
    return res.json({ message: 'Subscription deleted successfully!', subscriptions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Bulk delete plan subscriptions
router.post('/bulk-delete-plan-subscriptions', (req, res) => {
  try {
    const ids = req.body.subscriptionIds || req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No subscriptions selected.' });
    }
    const idSet = new Set(ids);
    let subscriptions = db.get('planSubscriptions') || [];
    const targets = subscriptions.filter(s => idSet.has(s.id));
    const remaining = subscriptions.filter(s => !idSet.has(s.id));
    db.set('planSubscriptions', remaining);

    const idsToBlacklist = new Set(ids);
    targets.forEach(t => {
      if (t.paymentTxId) idsToBlacklist.add(t.paymentTxId);
      if (t.refRequestId) idsToBlacklist.add(t.refRequestId);
      const rawTimestamp = t.id.replace(/^sub-free-(ref-req-)?/, '').replace(/^sub-req-/, '');
      if (rawTimestamp) {
        idsToBlacklist.add(rawTimestamp);
        idsToBlacklist.add(`ref-req-${rawTimestamp}`);
        idsToBlacklist.add(`sub-free-${rawTimestamp}`);
        idsToBlacklist.add(`sub-free-ref-req-${rawTimestamp}`);
      }
    });

    // Clean up referralRequests
    let referralRequests = db.get('referralRequests') || [];
    referralRequests = referralRequests.filter(ref => {
      if (idsToBlacklist.has(ref.id) || idsToBlacklist.has(ref.subId)) return false;
      for (const t of targets) {
        if (t.userId && ref.userId === t.userId && (t.type === 'free_access' || t.planName?.includes('Lifetime'))) return false;
        if (t.paymentTxId && (t.paymentTxId.includes(ref.id) || (ref.referralUid && t.paymentTxId.includes(ref.referralUid)))) return false;
      }
      return true;
    });
    db.set('referralRequests', referralRequests);

    let deletedIds = db.get('deletedSubscriptionIds') || [];
    idsToBlacklist.forEach(id => {
      if (id && !deletedIds.includes(id)) deletedIds.push(id);
    });
    db.set('deletedSubscriptionIds', deletedIds);

    // Revert user plans if they have no remaining approved subscriptions
    const users = db.get('users') || [];
    targets.forEach(t => {
      if (t.userId || t.userEmail) {
        const user = users.find(u => (t.userId && u.id === t.userId) || (t.userEmail && u.email && u.email.toLowerCase() === t.userEmail.toLowerCase()));
        if (user) {
          const hasOtherApproved = remaining.some(s => (s.userId === user.id || (user.email && s.userEmail?.toLowerCase() === user.email.toLowerCase())) && s.status === 'APPROVED');
          if (!hasOtherApproved) {
            user.subscriptionPlan = 'Free Trial';
            user.plan = 'Free Trial';
            user.isLifetimeApproved = false;
            user.subExpiresAt = '';
            user.planExpiresAt = '';
          }
        }
      }
    });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTIONS_BULK_DELETED',
      actorEmail: 'Master Admin',
      details: `Bulk deleted ${ids.length} subscription requests`,
      timestamp: new Date().toISOString()
    });
    db.save();
    return res.json({ message: `${ids.length} subscriptions deleted!`, subscriptions: remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Clear fake and test plan subscriptions
router.post('/clear-test-plan-subscriptions', (req, res) => {
  try {
    let subscriptions = db.get('planSubscriptions') || [];
    const remaining = subscriptions.filter(s => s.paymentTxId !== 'TX-PENDING' && s.userEmail !== 'user@qxautotrade.com');
    db.set('planSubscriptions', remaining);

    let referralRequests = db.get('referralRequests') || [];
    referralRequests = referralRequests.filter(r => r.userEmail !== 'user@qxautotrade.com' && r.userEmail !== 'alex@qxautotrade.com');
    db.set('referralRequests', referralRequests);

    db.save();
    return res.json({ message: 'Purged fake and test subscription requests.', subscriptions: remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Edit Deposit Verification / Plan Payment Request
router.post('/edit-deposit-request', (req, res) => {
  try {
    const { requestId, depositId, status, price, amount, paymentTxId, paymentProof, notes, adminEmail } = req.body;
    const targetId = requestId || depositId;
    const subscriptions = db.get('planSubscriptions') || [];
    const sub = subscriptions.find(s => s.id === targetId || s.paymentTxId === targetId);

    if (!sub) return res.status(404).json({ error: 'Deposit request not found.' });

    const normStatus = status ? status.toUpperCase() : sub.status;
    sub.status = normStatus;
    if (price) sub.price = price;
    if (amount) sub.depositAmount = amount;
    if (paymentTxId) sub.paymentTxId = paymentTxId;
    if (paymentProof) sub.paymentProof = paymentProof;
    if (notes !== undefined) sub.notes = notes;

    // If approved, also update user plan
    if (normStatus === 'APPROVED') {
      const users = db.get('users') || [];
      const user = users.find(u => u.id === sub.userId || (sub.userEmail && u.email && u.email.toLowerCase() === sub.userEmail.toLowerCase()));
      if (user) {
        user.subscriptionPlan = sub.planName || 'Lifetime VIP';
        user.plan = user.subscriptionPlan;
        let durationDays = 30;
        if (user.subscriptionPlan.includes('Basic')) durationDays = 30;
        else if (user.subscriptionPlan.includes('Pro')) durationDays = 90;
        else if (user.subscriptionPlan.includes('Quantum')) durationDays = 180;
        else if (user.subscriptionPlan.includes('Premium')) durationDays = 365;
        else if (user.subscriptionPlan.includes('Lifetime') || sub.type === 'free_access') durationDays = 36500;

        if (user.subscriptionPlan.includes('Lifetime') || sub.type === 'free_access') {
          user.isLifetimeApproved = true;
          user.depositVerified = true;
          user.subscriptionPlan = 'Lifetime VIP';
          user.plan = 'Lifetime VIP';
        }

        user.subExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        user.planExpiresAt = user.subExpiresAt;
        user.isFreeTrialExpired = false;
        sub.approvedAt = new Date().toISOString();
      }
    }

    // If rejected, reset user plan to Free Trial
    if (normStatus === 'REJECTED') {
      const users = db.get('users') || [];
      const user = users.find(u => u.id === sub.userId || (sub.userEmail && u.email && u.email.toLowerCase() === sub.userEmail.toLowerCase()));
      if (user && user.subscriptionPlan === sub.planName) {
        user.subscriptionPlan = 'Free Trial';
        user.plan = 'Free Trial';
        user.subExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        user.planExpiresAt = user.subExpiresAt;
      }
      sub.rejectedAt = new Date().toISOString();
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'SUBSCRIPTION_EDITED',
      actorEmail: adminEmail || 'Master Admin',
      details: `Updated subscription ${sub.id}: status=${normStatus}, price=${price || sub.price}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Subscription updated successfully!', subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete Announcement
router.post('/delete-announcement', (req, res) => {
  try {
    const { announcementId } = req.body;
    let announcements = db.get('announcements');
    const idx = (announcements || []).findIndex(a => a.id === announcementId || a._id === announcementId || String(a.id) === String(announcementId) || String(a._id) === String(announcementId));
    if (idx !== -1) {
      announcements.splice(idx, 1);
      db.set('announcements', announcements);
      syncAnnouncementToSiteConfig(announcements);
      db.save();
    }
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ===== Subscription Plan Management =====

// Get all plans
router.get('/plans', (req, res) => {
  const plans = db.get('subscriptionPlans') || [];
  return res.json({ plans });
});

// Add new plan
router.post('/plans', (req, res) => {
  try {
    const { name, price, period, features, icon } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Plan name and price are required.' });

    const plans = db.get('subscriptionPlans') || [];
    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      price: price.toString().startsWith('$') ? price : `$${price}`,
      period: period || '/month',
      features: features || [],
      icon: icon || 'Zap',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    plans.push(newPlan);
    db.set('subscriptionPlans', plans);

    // Sync to siteConfig
    const siteCfg = db.get('siteConfig') || {};
    const pName = (name || '').toLowerCase();
    const cleanNum = parseFloat(price.toString().replace(/[^0-9.]/g, '')) || 0;
    if (pName.includes('basic')) siteCfg.priceBasic = cleanNum;
    if (pName.includes('pro')) siteCfg.pricePro = cleanNum;
    if (pName.includes('quantum')) siteCfg.priceQuantum = cleanNum;
    if (pName.includes('premium')) siteCfg.pricePremium = cleanNum;
    db.set('siteConfig', siteCfg);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_CREATED',
      actorEmail: 'Master Admin',
      details: `Created plan: ${name} ($${price})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${name}" created successfully!`, plan: newPlan, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update plan
router.post('/plans/update', (req, res) => {
  try {
    const { planId, name, price, period, features, isActive } = req.body;
    const plans = db.get('subscriptionPlans') || [];
    const plan = plans.find(p => p.id === planId);

    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price.toString().startsWith('$') ? price : `$${price}`;
    if (period !== undefined) plan.period = period;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    plan.updatedAt = new Date().toISOString();

    db.set('subscriptionPlans', plans);

    // Sync to siteConfig
    const siteCfg = db.get('siteConfig') || {};
    const pName = (plan.name || '').toLowerCase();
    const cleanPrice = parseFloat(plan.price.replace(/[^0-9.]/g, '')) || 0;
    if (plan.id === 'plan-basic' || pName.includes('basic')) siteCfg.priceBasic = cleanPrice;
    if (plan.id === 'plan-pro' || pName.includes('pro')) siteCfg.pricePro = cleanPrice;
    if (plan.id === 'plan-quantum' || pName.includes('quantum')) siteCfg.priceQuantum = cleanPrice;
    if (plan.id === 'plan-premium' || pName.includes('premium')) siteCfg.pricePremium = cleanPrice;
    db.set('siteConfig', siteCfg);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_UPDATED',
      actorEmail: 'Master Admin',
      details: `Updated plan: ${plan.name} ($${plan.price})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${plan.name}" updated successfully!`, plan, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete plan
router.post('/plans/delete', (req, res) => {
  try {
    const targetPlanId = req.body?.planId || req.body?.id;
    if (!targetPlanId) return res.status(400).json({ error: 'Plan ID is required.' });

    let plans = db.get('subscriptionPlans') || [];
    const idx = plans.findIndex(p => p.id === targetPlanId);

    if (idx === -1) return res.status(404).json({ error: 'Plan not found.' });

    const deleted = plans.splice(idx, 1)[0];
    db.set('subscriptionPlans', plans);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_DELETED',
      actorEmail: 'Master Admin',
      details: `Deleted plan: ${deleted.name}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${deleted.name}" deleted successfully!`, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// Commission Withdrawals List & Approval
router.get('/commission-withdrawals', (req, res) => {
  const withdrawals = db.get('commissionWithdrawals') || [];
  return res.json({ withdrawals });
});

router.post('/approve-commission-withdrawal', (req, res) => {
  try {
    const { withdrawalId, status, adminNotes } = req.body;
    const withdrawals = db.get('commissionWithdrawals') || [];
    const item = withdrawals.find(w => w.id === withdrawalId);
    if (!item) return res.status(404).json({ error: 'Withdrawal request not found.' });

    item.status = status || 'APPROVED';
    item.notes = adminNotes || (item.status === 'APPROVED' ? 'Payout sent via ' + item.payoutMethod : 'Rejected by Admin');
    item.processedAt = new Date().toISOString();

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'APPROVE_COMMISSION_WITHDRAWAL',
      actorEmail: 'Master Admin',
      details: `Commission withdrawal ${withdrawalId} marked as ${item.status}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Withdrawal request marked as ${item.status}`, withdrawal: item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Edit Commission Withdrawal Amount & Details by Admin
router.post('/edit-commission-withdrawal', (req, res) => {
  try {
    const { withdrawalId, amount, status, adminNotes } = req.body;
    const withdrawals = db.get('commissionWithdrawals') || [];
    const item = withdrawals.find(w => w.id === withdrawalId);
    if (!item) return res.status(404).json({ error: 'Withdrawal request not found.' });

    if (amount !== undefined) item.amount = parseFloat(amount);
    if (status) item.status = status;
    if (adminNotes !== undefined) item.notes = adminNotes;
    item.updatedAt = new Date().toISOString();

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'EDIT_COMMISSION_WITHDRAWAL',
      actorEmail: 'Master Admin',
      details: `Updated withdrawal ${withdrawalId}: Amount=$${item.amount}, Status=${item.status}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Withdrawal request updated successfully!', withdrawal: item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

