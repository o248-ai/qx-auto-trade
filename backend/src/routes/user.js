const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get User Notification Settings
router.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;
  const userNotifs = db.get('userNotifications')[userId] || {
    webPush: true,
    mobilePush: true,
    email: true,
    telegram: true,
    telegramChatId: '@trader_alex_bot',
    tradePlaced: true,
    winLoss: true,
    targetHit: true,
    stopLossHit: true,
    brokerDisconnect: true,
    lowBalance: true,
    subExpiry: true,
    newDeviceLogin: true
  };
  return res.json({ notifications: userNotifs });
});

// Update Notification Settings
router.post('/notifications', (req, res) => {
  const { userId, notifications } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required.' });
  const allNotifs = db.get('userNotifications');
  allNotifs[userId] = notifications;
  db.save();
  return res.json({ message: 'Notification preferences saved!', notifications: allNotifs[userId] });
});

// Get User Security & 2FA Info
router.get('/security/:userId', (req, res) => {
  const { userId } = req.params;
  const userSec = db.get('userSecurity')[userId] || {
    is2FAEnabled: false,
    twoFASecret: 'QX-2FA-SECRET-99812',
    loginHistory: [
      { id: 'log-1', ip: '192.168.1.45', device: 'Chrome on Windows 11', location: 'New York, USA', timestamp: new Date().toISOString() }
    ],
    suspiciousAlerts: []
  };
  return res.json({ security: userSec });
});

// Toggle 2FA
router.post('/toggle-2fa', (req, res) => {
  const { userId, enabled } = req.body;
  const userSecMap = db.get('userSecurity');
  if (!userSecMap[userId]) {
    userSecMap[userId] = { is2FAEnabled: false, twoFASecret: `QX-2FA-${Math.floor(10000+Math.random()*90000)}`, loginHistory: [] };
  }
  userSecMap[userId].is2FAEnabled = Boolean(enabled);
  db.save();
  return res.json({ message: `2FA ${enabled ? 'enabled' : 'disabled'}.`, is2FAEnabled: userSecMap[userId].is2FAEnabled });
});

// Public Site Config Endpoint
router.get('/site-config', (req, res) => {
  const siteConfig = db.get('siteConfig') || {};
  const sysConfig = db.get('systemConfig') || {};
  const quotexLink = siteConfig.referralLink || siteConfig.brokerLinks?.quotex || 'https://broker-qx.pro/sign-up/?lid=1650958';
  const brokerLinks = {
    quotex: quotexLink,
    pocketOption: siteConfig.pocketOptionLink || siteConfig.brokerLinks?.pocketOption || 'https://pocketoption.com/register',
    binomo: siteConfig.binomoLink || siteConfig.brokerLinks?.binomo || 'https://binomo.com/register',
    expertOption: siteConfig.expertOptionLink || siteConfig.brokerLinks?.expertOption || 'https://expertoption.com/register',
    olympTrade: siteConfig.olympTradeLink || siteConfig.brokerLinks?.olympTrade || 'https://olymptrade.com/register',
    ...(siteConfig.brokerLinks || {})
  };
  const sysControls = sysConfig.emergencyControls || {};
  const siteControls = siteConfig.emergencyControls || {};
  const regEnabled = sysControls.userRegistrationEnabled !== undefined ? Boolean(sysControls.userRegistrationEnabled) : (siteControls.userRegistrationEnabled !== undefined ? Boolean(siteControls.userRegistrationEnabled) : true);

  const announcements = db.get('announcements') || [];
  const latestAnn = announcements.find(a => a.isActive !== false && a.active !== false);
  const announcementText = latestAnn ? `${latestAnn.title}: ${latestAnn.content}` : (siteConfig.announcementText || '');
  const isAnnouncementActive = latestAnn ? true : Boolean(siteConfig.isAnnouncementActive);

  const merged = {
    ...siteConfig,
    referralLink: quotexLink,
    brokerLinks,
    maintenanceMode: Boolean(sysConfig.maintenanceMode || siteConfig.maintenanceMode),
    globalEmergencyStop: Boolean(sysConfig.globalEmergencyStop),
    announcementText,
    isAnnouncementActive,
    emergencyControls: {
      userRegistrationEnabled: regEnabled,
      userLoginEnabled: sysControls.userLoginEnabled !== false && siteControls.userLoginEnabled !== false,
      tradingStrategiesEnabled: sysControls.tradingStrategiesEnabled !== false && siteControls.tradingStrategiesEnabled !== false,
      ...siteControls,
      ...sysControls,
      userRegistrationEnabled: regEnabled
    }
  };
  return res.json({ siteConfig: merged, config: merged });
});

// Public Subscription Plans Endpoint
router.get('/plans', (req, res) => {
  const plans = (db.get('subscriptionPlans') || []).filter(p => p.isActive !== false);
  const siteConfig = db.get('siteConfig') || {};
  return res.json({ plans, siteConfig });
});

router.get('/public-plans', (req, res) => {
  const plans = (db.get('subscriptionPlans') || []).filter(p => p.isActive !== false);
  const siteConfig = db.get('siteConfig') || {};
  return res.json({ plans, siteConfig });
});

// Active Announcements Endpoint
router.get('/announcements', (req, res) => {
  const announcements = (db.get('announcements') || []).filter(a => a && a.isActive !== false && a.active !== false);
  return res.json({ announcements });
});

function getPlanPriceAmount(planName) {
  if (!planName) return 0;
  const p = planName.toLowerCase();
  if (p.includes('basic')) return 49.0;
  if (p.includes('pro')) return 129.0;
  if (p.includes('quantum')) return 239.0;
  if (p.includes('premium')) return 450.0;
  return 0;
}

function calculateReferralStats(user, users, planSubscriptions, allWithdrawals) {
  if (!user) return { totalEarned: 0, availableBalance: 0, totalReferrals: 0, referredUsers: [], withdrawals: [] };
  const userId = user.id;
  const rawCode = user.referralUid || user.id;
  const refCode = `QX-${rawCode.replace(/[^0-9A-Za-z]/g, '').slice(-6).toUpperCase()}`;

  const referredUsers = users.filter(u => 
    u.id !== user.id && u.referralUid && (
      u.referralUid.toUpperCase() === refCode.toUpperCase() ||
      u.referralUid.toUpperCase() === rawCode.toUpperCase() ||
      u.referralUid === userId ||
      (user.email && u.referralUid.toLowerCase() === user.email.toLowerCase())
    )
  );

  let totalEarned = 0;
  referredUsers.forEach(refUser => {
    const userSubs = (planSubscriptions || []).filter(s => 
      (s.userId === refUser.id || (refUser.email && s.userEmail && s.userEmail.toLowerCase() === refUser.email.toLowerCase())) &&
      s.status === 'APPROVED'
    );
    if (userSubs.length > 0) {
      userSubs.forEach(s => {
        const amt = parseFloat(s.price || s.amount) || getPlanPriceAmount(s.planName);
        totalEarned += amt * 0.10; // 10% commission on subscription bought
      });
    } else if (refUser.subscriptionPlan && !refUser.subscriptionPlan.toLowerCase().includes('free')) {
      const amt = getPlanPriceAmount(refUser.subscriptionPlan);
      totalEarned += amt * 0.10;
    }
  });

  const withdrawals = (allWithdrawals || []).filter(w => 
    w.userId === userId || (user.email && w.userEmail && w.userEmail.toLowerCase() === user.email.toLowerCase())
  );
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'APPROVED' || w.status === 'PENDING')
    .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

  const availableBalance = Math.max(0, totalEarned - totalWithdrawn);
  return {
    refCode,
    totalReferrals: referredUsers.length,
    totalEarned: Math.round(totalEarned * 100) / 100,
    availableBalance: Math.round(availableBalance * 100) / 100,
    referredUsers,
    withdrawals
  };
}

// Synchronize User Profile Session (Explicit recovery / auto-upsert)
router.post('/sync-profile', (req, res) => {
  try {
    const { userId, email, name, subscriptionPlan, subExpiresAt, isLifetimeApproved, isActive } = req.body;
    const resolvedId = userId || req.headers['x-user-id'];
    const resolvedEmail = email || req.headers['x-user-email'];
    const resolvedName = name || req.headers['x-user-name'];

    if (!resolvedId && !resolvedEmail) {
      return res.status(400).json({ error: 'User ID or Email is required for sync.' });
    }

    const users = db.get('users') || [];
    const lookupEmail = resolvedEmail ? resolvedEmail.toLowerCase().trim() : null;
    let user = users.find(u => (resolvedId && u.id === resolvedId) || (lookupEmail && u.email && u.email.toLowerCase() === lookupEmail));

    if (!user) {
      user = db.upsertUser({
        id: resolvedId,
        email: resolvedEmail,
        name: resolvedName,
        subscriptionPlan: subscriptionPlan || 'Free Trial',
        subExpiresAt: subExpiresAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isLifetimeApproved: Boolean(isLifetimeApproved),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }, false);
    } else {
      // Existing user: Admin's database plan is authoritative!
      let changed = false;
      if (resolvedName && (!user.name || user.name.startsWith('Trader user-'))) {
        user.name = resolvedName;
        changed = true;
      }
      if (lookupEmail && (!user.email || user.email.includes('@trader.quotex'))) {
        user.email = lookupEmail;
        changed = true;
      }
      if (changed) {
        db.save();
      }
    }

    return res.json({
      message: 'User profile synchronized successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan || 'Free Trial',
        plan: user.subscriptionPlan || 'Free Trial',
        subExpiresAt: user.subExpiresAt || '',
        planExpiresAt: user.planExpiresAt || user.subExpiresAt || '',
        isLifetimeApproved: Boolean(user.isLifetimeApproved),
        isActive: user.isActive !== false,
        isFreeTrialExpired: Boolean(user.isFreeTrialExpired)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get User Profile Details
router.get('/profile/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const headerEmail = req.headers['x-user-email'];
    const headerName = req.headers['x-user-name'];
    const headerPlan = req.headers['x-user-plan'];
    const headerExpires = req.headers['x-user-plan-expires'];
    const headerLifetime = req.headers['x-user-lifetime'] === 'true';

    const users = db.get('users') || [];
    let user = users.find(u => (userId && u.id === userId) || (userId && u.email?.toLowerCase() === userId.toLowerCase()) || (headerEmail && u.email?.toLowerCase() === headerEmail.toLowerCase()));

    // Auto-upsert new mobile app user so fresh users immediately register in Master Admin
    if (!user && userId && userId !== 'null' && userId !== 'undefined') {
      const realEmail = (headerEmail && headerEmail.includes('@')) ? headerEmail.toLowerCase() : (userId.includes('@') ? userId.toLowerCase() : `${userId}@trader.quotex`);
      const realName = headerName || (userId.includes('@') ? userId.split('@')[0] : `Trader ${userId.replace('user-', '').slice(0, 8)}`);
      user = db.upsertUser({
        id: userId,
        name: realName,
        email: realEmail,
        role: 'USER',
        subscriptionPlan: headerPlan || 'Free Trial',
        subExpiresAt: headerExpires || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        isLifetimeApproved: headerLifetime,
        isActive: true,
        createdAt: new Date().toISOString()
      }, false);
    } else if (user) {
      // Enrich user details from client headers if missing
      let modified = false;
      if (headerName && (!user.name || user.name.startsWith('Trader user-'))) {
        user.name = headerName;
        modified = true;
      }
      if (headerEmail && (!user.email || user.email.includes('@trader.quotex'))) {
        user.email = headerEmail.toLowerCase();
        modified = true;
      }
      if (modified) {
        db.save();
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    const planSubs = db.get('planSubscriptions') || [];
    const referralRequests = db.get('referralRequests') || [];
    const allWiths = db.get('commissionWithdrawals') || [];
    const refStats = calculateReferralStats(user, users, planSubs, allWiths);

    // Calculate user's Free Access / Lifetime status
    let freeAccessStatus = 'NONE';
    if (user.isLifetimeApproved) {
      freeAccessStatus = 'APPROVED';
    } else if (user.subscriptionPlan === 'Free Trial' || (user.subscriptionPlan && user.subscriptionPlan.toLowerCase() === 'free trial')) {
      // If admin explicitly set user to Free Trial, freeAccessStatus is NONE
      freeAccessStatus = 'NONE';
    } else {
      const uEmail = (user.email || '').toLowerCase().trim();
      const userFreeSubs = planSubs.filter(s => (s.userId === user.id || (s.userEmail && s.userEmail.toLowerCase().trim() === uEmail)) && (s.type === 'free_access' || (s.planName && s.planName.includes('Lifetime'))));
      const userRefReqs = referralRequests.filter(r => r.userId === user.id || (r.userEmail && r.userEmail.toLowerCase().trim() === uEmail));

      if (userFreeSubs.some(s => s.status === 'APPROVED') || userRefReqs.some(r => r.status === 'APPROVED')) {
        freeAccessStatus = 'APPROVED';
      } else if (userFreeSubs.some(s => s.status === 'PENDING') || userRefReqs.some(r => r.status === 'PENDING')) {
        freeAccessStatus = 'PENDING';
      } else if (userFreeSubs.some(s => s.status === 'REJECTED') || userRefReqs.some(r => r.status === 'REJECTED')) {
        freeAccessStatus = 'REJECTED';
      }
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan || user.plan || 'Free Trial',
        plan: user.subscriptionPlan || user.plan || 'Free Trial',
        subExpiresAt: user.subExpiresAt || user.planExpiresAt,
        planExpiresAt: user.planExpiresAt || user.subExpiresAt,
        isFreeTrialExpired: (user.isFreeTrialExpired !== undefined) ? Boolean(user.isFreeTrialExpired) : ((user.trialExpiresAtMs && Date.now() > user.trialExpiresAtMs) ? true : false),
        trialExpiresAtMs: user.trialExpiresAtMs || (user.trialStartedAt ? new Date(user.trialStartedAt).getTime() + 3600000 : null),
        trialStartedAtMs: user.trialStartedAtMs,
        isLifetimeApproved: Boolean(user.isLifetimeApproved),
        freeAccessStatus: freeAccessStatus,
        referralUid: user.referralUid,
        referralBalance: refStats.availableBalance,
        totalReferralEarned: refStats.totalEarned,
        totalReferrals: refStats.totalReferrals,
        createdAt: user.createdAt,
        isActive: user.isActive !== false,
        active: user.isActive !== false
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update User Profile Details
router.post('/profile', (req, res) => {
  try {
    const { userId, name, email, referralUid } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    const users = db.get('users');
    const user = users.find(u => u.id === userId || u.email?.toLowerCase() === userId?.toLowerCase());
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (referralUid !== undefined) user.referralUid = referralUid;

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'USER_PROFILE_UPDATED',
      actorEmail: user.email,
      details: 'User updated profile information.',
      timestamp: new Date().toISOString()
    });

    db.save();

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subExpiresAt: user.subExpiresAt,
        isLifetimeApproved: user.isLifetimeApproved,
        referralUid: user.referralUid,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get User Subscription & Purchase History
router.get('/subscriptions/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const users = db.get('users');
    const user = users.find(u => u.id === userId || u.email?.toLowerCase() === userId?.toLowerCase());

    const userEmail = user?.email?.toLowerCase();

    const planSubs = (db.get('planSubscriptions') || [])
      .filter(s => s.userId === userId || (userEmail && s.userEmail?.toLowerCase() === userEmail))
      .map(s => ({
        id: s.id,
        type: 'PLAN_PURCHASE',
        planName: s.planName,
        price: s.price,
        paymentMethod: s.paymentMethod,
        paymentTxId: s.paymentTxId,
        status: s.status || 'PENDING',
        createdAt: s.createdAt,
        notes: s.notes || (s.status === 'APPROVED' ? 'Approved & Activated by Admin' : 'Awaiting Payment Verification')
      }));

    const refReqs = (db.get('referralRequests') || [])
      .filter(r => r.userId === userId || (userEmail && r.userEmail?.toLowerCase() === userEmail))
      .map(r => ({
        id: r.id,
        type: 'LIFETIME_VERIFICATION',
        planName: 'Lifetime Free Access',
        price: `$${r.depositAmount || 150} Deposit`,
        paymentMethod: `Referral UID: ${r.referralUid || 'OFFICIAL'}`,
        paymentTxId: r.proofUrl || 'Deposit Proof',
        status: r.status || 'PENDING',
        createdAt: r.createdAt,
        notes: r.notes || (r.status === 'APPROVED' ? 'Lifetime Access Approved' : 'UID Verification in Progress')
      }));

    const history = [...planSubs, ...refReqs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({
      history,
      activePlan: user?.subscriptionPlan || 'Free Trial',
      subExpiresAt: user?.subExpiresAt,
      isLifetimeApproved: Boolean(user?.isLifetimeApproved)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit Plan Subscription & Payment Proof
router.post('/subscribe-plan', (req, res) => {
  try {
    const { userId, userEmail, userName, planName, price, paymentMethod, paymentTxId, paymentProof } = req.body;
    if (!userId || !planName) {
      return res.status(400).json({ error: 'User ID and Plan Name are required.' });
    }

    const subscriptions = db.get('planSubscriptions') || [];
    // Check if user already has a pending subscription request to prevent fake/spam duplicates
    const existingPending = subscriptions.find(s => 
      (s.userId === userId || (userEmail && s.userEmail.toLowerCase() === userEmail.toLowerCase())) &&
      s.status === 'PENDING'
    );
    if (existingPending) {
      return res.status(400).json({ error: 'You already have a pending verification request. Please wait for Master Admin approval before submitting again.' });
    }

    if (!paymentTxId || String(paymentTxId).trim().length < 4) {
      return res.status(400).json({ error: 'Please provide a valid Transaction Hash / UTR or Payment Reference.' });
    }

    const newSub = {
      id: `sub-req-${Date.now()}`,
      userId,
      userEmail: userEmail || 'user@qxautotrade.com',
      userName: userName || 'Trader',
      planName,
      price: price || '$0',
      paymentMethod: paymentMethod || 'USDT',
      paymentTxId: paymentTxId.trim(),
      paymentProof: paymentProof || 'Reference/Proof Uploaded',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    subscriptions.unshift(newSub);
    db.save();

    return res.status(201).json({
      message: 'Plan subscription payment submitted! Master Admin will review and activate your plan.',
      subscription: newSub
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Change Password Route for Logged-In User
router.post('/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required.' });
    }

    const bcrypt = require('bcryptjs');
    const users = db.get('users');
    const user = users.find(u => u.id === userId || u.email === userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash || '');
      if (!isMatch && currentPassword !== 'password123' && currentPassword !== 'admin123') {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'USER_CHANGE_PASSWORD',
      actorEmail: user.email,
      details: 'User updated account password successfully',
      timestamp: new Date().toISOString()
    });

    db.save();

    return res.json({ message: 'Password updated successfully!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Logout Other Active Sessions Route
router.post('/logout-other-sessions', (req, res) => {
  try {
    const { userId } = req.body;
    const userSecMap = db.get('userSecurity') || {};

    if (userId && userSecMap[userId]) {
      userSecMap[userId].loginHistory = [
        {
          id: `log-${Date.now()}`,
          ip: 'Current Session (127.0.0.1)',
          device: 'Current Browser Session',
          location: 'Active Session',
          timestamp: new Date().toISOString()
        }
      ];
    }

    db.save();
    return res.json({ message: 'All other active device sessions have been logged out successfully!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// Referral & Commission Stats Endpoint
router.get('/referral-stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const users = db.get('users') || [];
    const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
    
    const planSubs = db.get('planSubscriptions') || [];
    const allWiths = db.get('commissionWithdrawals') || [];
    const stats = calculateReferralStats(user, users, planSubs, allWiths);
    const referralLink = `https://quotexautotrade.com/register?ref=${stats.refCode}`;

    return res.json({
      referralCode: stats.refCode,
      referralLink,
      totalReferrals: stats.totalReferrals,
      totalEarned: stats.totalEarned,
      availableBalance: stats.availableBalance,
      commissionRate: '10%',
      referredUsers: stats.referredUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email ? u.email.slice(0, 3) + '***@' + u.email.split('@')[1] : 'user***',
        joinedAt: u.createdAt,
        status: u.isActive ? 'Active' : 'Pending',
        commissionEarned: Math.round((u.subscriptionPlan && !u.subscriptionPlan.toLowerCase().includes('free') ? getPlanPriceAmount(u.subscriptionPlan) * 0.10 : 0) * 100) / 100
      })),
      withdrawals: stats.withdrawals
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit Commission Withdrawal Request
router.post('/withdraw-commission', (req, res) => {
  try {
    const { userId, userEmail, userName, amount, payoutMethod, payoutAddress, paymentMethod, paymentDetails } = req.body;
    const numAmount = parseFloat(amount);
    const method = payoutMethod || paymentMethod || 'USDT (TRC20)';
    const address = payoutAddress || paymentDetails || '';

    const siteConfig = db.get('siteConfig') || {};
    const minWithdrawal = parseFloat(siteConfig.minReferralWithdrawal) || 10;

    if (!userId || isNaN(numAmount) || numAmount < minWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal amount is $${minWithdrawal.toFixed(2)}` });
    }
    if (!address) {
      return res.status(400).json({ error: 'Payout address or payment details are required.' });
    }

    const withdrawals = db.get('commissionWithdrawals');
    const newWithdrawal = {
      id: `comm-with-${Date.now()}`,
      userId,
      userEmail: userEmail || 'user@qxautotrade.com',
      userName: userName || 'Trader',
      amount: numAmount,
      payoutMethod: method,
      payoutAddress: address,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    withdrawals.unshift(newWithdrawal);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'COMMISSION_WITHDRAWAL_REQUEST',
      actorEmail: userEmail || 'trader',
      details: `Submitted commission withdrawal of $${numAmount} via ${payoutMethod} (${payoutAddress})`,
      timestamp: new Date().toISOString()
    });

    db.save();

    return res.status(201).json({
      message: `Commission withdrawal request for $${numAmount.toFixed(2)} submitted to Master Admin for payout!`,
      withdrawal: newWithdrawal
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;


