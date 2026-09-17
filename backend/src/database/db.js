const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

const DB_FILE = path.join(__dirname, 'db.json');

const defaultData = {
  deletedUsers: [],
  users: [
    {
      id: 'admin-1',
      name: 'Master Admin',
      email: 'admin@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1', // password: admin123
      role: 'MASTER_ADMIN',
      isActive: true,
      trialStartedAt: '2026-07-29T19:04:24.670Z',
      subscriptionPlan: 'Premium Plan',
      subExpiresAt: '2099-12-31T23:59:59.000Z',
      isLifetimeApproved: true,
      referralUid: 'REF-MASTER-001',
      depositVerified: true,
      createdAt: '2026-07-29T19:04:24.671Z'
    }
  ],
  brokerConnections: [
    {
      id: 'conn-1',
      userId: 'user-demo-1',
      broker: 'quotex',
      accountType: 'LIVE',
      accountId: 'QX-LIVE-884912',
      encryptedToken: 'enc_token_qx_884912',
      balance: 1450.50,
      isConnected: true,
      connectedAt: new Date().toISOString()
    },
    {
      id: 'conn-2',
      userId: 'user-demo-1',
      broker: 'pocketoption',
      accountType: 'DEMO',
      accountId: 'PO-DEMO-99102',
      encryptedToken: 'enc_token_po_99102',
      balance: 10000.00,
      isConnected: true,
      connectedAt: new Date().toISOString()
    }
  ],
  strategies: [
    {
      id: 'strat-1',
      name: 'OTC Volatility Scalper Pro v3',
      broker: 'quotex',
      winRate: 88.5,
      timeframe: '1M',
      indicatorSummary: 'RSI(14) Oversold + EMA(9/21) Crossover + Bollinger Squeeze',
      parameters: { rsiPeriod: 14, rsiOversold: 30, rsiOverbought: 70, emaFast: 9, emaSlow: 21, bollingerMult: 2.0 },
      description: 'High-frequency binary option scalping setup designed for fast OTC and volatility pairs.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-2',
      name: 'Trend Rider Momentum Pro',
      broker: 'quotex',
      winRate: 91.2,
      timeframe: '5M',
      indicatorSummary: 'MACD Zero-lag + SuperTrend (10,3) + Stochastic RSI',
      parameters: { macdFast: 12, macdSlow: 26, macdSignal: 9, supertrendPeriod: 10, supertrendMult: 3.0 },
      description: 'Momentum trend-following algorithm for strong directional market continuation.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-3',
      name: 'Price Action Reversal Master',
      broker: 'quotex',
      winRate: 86.4,
      timeframe: '1M',
      indicatorSummary: 'Pivot Point Reversal + Parabolic SAR + Volume Surge',
      parameters: { sarStart: 0.02, sarIncrement: 0.02, sarMax: 0.2 },
      description: 'Dynamic mean-reversion algorithm targeting sharp market turning points & price bounces.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-4',
      name: 'Smart Breakout & Volatility Engine',
      broker: 'quotex',
      winRate: 84.0,
      timeframe: '2M',
      indicatorSummary: 'Support/Resistance Breakout + ADX > 25',
      parameters: { adxThreshold: 25, lookbackBars: 20 },
      description: 'High-volatility support & resistance breakout detector for rapid price expansions.',
      isActive: true,
      createdBy: 'Master Admin'
    }
  ],
  riskSettings: {
    'user-demo-1': {
      mode: 'MTG',
      amountType: 'FIXED',
      fixedAmount: 20,
      percentageAmount: 2.0,
      mtgMultiplier: 2.1,
      maxMtgLevel: 5,
      dailyProfitTarget: 150,
      dailyStopLoss: 200,
      maxTradesPerSession: 20,
      maxConsecutiveLosses: 3,
      minBalanceProtection: 100
    }
  },
  userNotifications: {
    'user-demo-1': {
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
    }
  },
  userSecurity: {
    'user-demo-1': {
      is2FAEnabled: false,
      twoFASecret: 'QX-2FA-SECRET-99812',
      loginHistory: [
        { id: 'log-1', ip: '192.168.1.45', device: 'Chrome on Windows 11', location: 'New York, USA', timestamp: new Date(Date.now() - 3600000).toISOString() }
      ],
      suspiciousAlerts: []
    }
  },
  tradeLogs: [
    {
      id: 'trade-101',
      userId: 'user-demo-1',
      broker: 'quotex',
      asset: 'EUR/USD (OTC)',
      direction: 'CALL',
      amount: 20.00,
      entryPrice: 1.08450,
      exitPrice: 1.08485,
      result: 'WIN',
      profitLoss: 17.60,
      strategyName: 'Quotex OTC Volatility Scalper v3',
      mtgLevel: 1,
      refId: 'QX-TRD-9001',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  referralRequests: [],
  planSubscriptions: [],
  errorLogs: [],
  auditLogs: [],
  announcements: [],
  subscriptionPlans: [
    {
      id: 'plan-basic',
      name: 'Basic Plan',
      price: '$49',
      numericPrice: 49,
      period: '/month',
      features: ['All trading strategies', '1 broker connection', 'Email support', '2 currency pairs', 'Daily reports'],
      icon: 'Zap',
      isActive: true,
      popular: false,
      cta: 'Get Started'
    },
    {
      id: 'plan-pro',
      name: 'Pro Plan',
      price: '$129',
      numericPrice: 129,
      period: '/3 months',
      features: ['5 trading bots', 'Advanced strategies', 'Priority support', '10 currency pairs', 'Real-time analytics', 'Custom indicators'],
      icon: 'Star',
      isActive: true,
      popular: true,
      cta: 'Start Pro'
    },
    {
      id: 'plan-quantum',
      name: 'Quantum Plan',
      price: '$239',
      numericPrice: 239,
      period: '/6 months',
      features: ['Everything in Pro', '10 broker connections', 'Custom strategies', 'API access', 'Dedicated support'],
      icon: 'Zap',
      isActive: true,
      popular: false,
      cta: 'Choose Quantum'
    },
    {
      id: 'plan-premium',
      name: 'Premium Plan (Lifetime)',
      price: '$450',
      numericPrice: 450,
      period: '/12 months',
      features: ['Unlimited bots', 'All strategies', 'Dedicated 24/7 support', 'All currency pairs', 'Advanced analytics', 'VIP community access'],
      icon: 'Crown',
      isActive: true,
      popular: false,
      cta: 'Go Premium'
    }
  ],
  siteConfig: {
    telegramLink: 'https://t.me/quotexautotrade_official',
    telegramSupport: 'https://t.me/quotexautotrade_official',
    supportEmail: 'support@quotexautotrade.com',
    instagramLink: 'https://instagram.com/quotexautotrade',
    youtubeLink: 'https://youtube.com/c/quotexautotrade',
    youtubeEmbedCode: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    referralLink: 'https://broker-qx.pro/sign-up/?lid=1650958',
    referralDepositAmount: 150,
    priceBasic: 49,
    pricePro: 129,
    priceQuantum: 239,
    pricePremium: 450,
    enableUPI: true,
    enableBankTransfer: true,
    enableUSDT: true,
    brokerLinks: {
      quotex: 'https://broker-qx.pro/sign-up/?lid=1650958',
      pocketOption: 'https://pocketoption.com/register',
      binomo: 'https://binomo.com/register',
      olympTrade: 'https://olymptrade.com/register'
    },
    footerText: 'QUOTEX AUTO TRADE © 2026. All rights reserved.',
    paymentUsdt: 'TQUOTEXautoTradeAddress1234567890USDT',
    paymentUpi: 'quotexautotrade@upi',
    paymentBank: 'Bank: QUOTEX Trade Ltd | A/C: 9988776655 | IFSC: QXIN0001234',
    siteName: 'Auto Trade Bot',
    siteLogo: '',
    favicon: '',
    announcementText: 'Welcome to Quotex Auto Trade! Automated trading bot is active.',
    isAnnouncementActive: true,
    emergencyControls: {
      userRegistrationEnabled: true,
      userLoginEnabled: true,
      tradingStrategiesEnabled: true
    },
    updatedAt: new Date().toISOString()
  },
  systemConfig: {
    maintenanceMode: false,
    globalEmergencyStop: false,
    emergencyControls: {
      userRegistrationEnabled: true,
      userLoginEnabled: true,
      tradingStrategiesEnabled: true
    },
    updatedAt: new Date().toISOString()
  },
  announcements: [
    {
      id: 'ann-default-welcome',
      title: 'Welcome to Quotex Auto Trade',
      content: 'Official automated trading platform is active. Connect your broker account to start trading!',
      type: 'INFO',
      target: { homePage: true, userPage: true },
      isActive: true,
      active: true,
      createdAt: '2026-09-01T00:00:00.000Z'
    }
  ]
};

const USERS_REGISTRY_FILE = path.join(__dirname, 'users_registry.json');
const DELETED_USERS_FILE = path.join(__dirname, 'deleted_users.json');
const BACKUP_FILE = path.join(__dirname, 'db_users_backup.json');
const SITE_CONFIG_BACKUP_FILE = path.join(__dirname, 'site_config_backup.json');
const SYSTEM_CONFIG_BACKUP_FILE = path.join(__dirname, 'system_config_backup.json');
const ANNOUNCEMENTS_BACKUP_FILE = path.join(__dirname, 'announcements_backup.json');
const PLAN_SUBSCRIPTIONS_BACKUP_FILE = path.join(__dirname, 'plan_subscriptions_backup.json');
const SUBSCRIPTION_PLANS_BACKUP_FILE = path.join(__dirname, 'subscription_plans_backup.json');

let mongooseInstance = null;
let AppDataModel = null;

class Database {
  constructor() {
    this.data = JSON.parse(JSON.stringify(defaultData));
    this.mongoConnected = false;
    this.init();
    this.initMongo();
  }

  isUserDeleted(identifier) {
    if (!identifier) return false;
    const clean = String(identifier).trim().toLowerCase();
    const list = this.data?.deletedUsers || [];
    return list.some(item => {
      if (!item) return false;
      if (typeof item === 'string') return item.toLowerCase() === clean;
      if (item.id && item.id.toLowerCase() === clean) return true;
      if (item.email && item.email.toLowerCase() === clean) return true;
      return false;
    });
  }

  deleteUser(userId, adminEmail = 'Master Admin') {
    if (!userId) return null;
    let users = this.get('users') || [];
    const cleanId = String(userId).trim().toLowerCase();
    const target = users.find(u => (u.id && u.id.toLowerCase() === cleanId) || (u.email && u.email.toLowerCase() === cleanId));
    if (!target) return null;

    // 1. Remove from users list
    this.data.users = users.filter(u => u.id !== target.id && (!u.email || u.email.toLowerCase() !== (target.email || '').toLowerCase()));

    // 2. Track in deletedUsers blacklist
    if (!Array.isArray(this.data.deletedUsers)) {
      this.data.deletedUsers = [];
    }
    const delRecord = {
      id: target.id,
      email: (target.email || '').toLowerCase(),
      name: target.name || 'Trader',
      deletedAt: new Date().toISOString(),
      deletedBy: adminEmail
    };
    if (!this.data.deletedUsers.some(d => (d.id && d.id.toLowerCase() === target.id.toLowerCase()) || (d.email && target.email && d.email.toLowerCase() === target.email.toLowerCase()))) {
      this.data.deletedUsers.push(delRecord);
    }

    // 3. Purge all related user records
    if (Array.isArray(this.data.planSubscriptions)) {
      this.data.planSubscriptions = this.data.planSubscriptions.filter(s => s.userId !== target.id && (!target.email || s.userEmail?.toLowerCase() !== target.email.toLowerCase()));
    }
    if (Array.isArray(this.data.referralRequests)) {
      this.data.referralRequests = this.data.referralRequests.filter(r => r.userId !== target.id && (!target.email || r.userEmail?.toLowerCase() !== target.email.toLowerCase()));
    }
    if (Array.isArray(this.data.brokerConnections)) {
      this.data.brokerConnections = this.data.brokerConnections.filter(c => c.userId !== target.id);
    }
    if (this.data.userSecurity && typeof this.data.userSecurity === 'object') {
      delete this.data.userSecurity[target.id];
      if (target.email) delete this.data.userSecurity[target.email.toLowerCase()];
    }
    if (this.data.riskSettings && typeof this.data.riskSettings === 'object') {
      delete this.data.riskSettings[target.id];
    }

    // 4. Save to disk and sync to MongoDB
    this.save();
    return target;
  }

  unmarkDeletedUser(identifier) {
    if (!identifier || !Array.isArray(this.data.deletedUsers)) return;
    const clean = String(identifier).trim().toLowerCase();
    this.data.deletedUsers = this.data.deletedUsers.filter(d => {
      if (!d) return false;
      if (typeof d === 'string') return d.toLowerCase() !== clean;
      if (d.id && d.id.toLowerCase() === clean) return false;
      if (d.email && d.email.toLowerCase() === clean) return false;
      return true;
    });
    this.save();
  }

  // Merge multiple user arrays ensuring no user is ever lost or downgraded
  mergeUserLists(...lists) {
    const userMap = new Map();

    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const u of list) {
        if (!u || (!u.id && !u.email)) continue;
        if (this.isUserDeleted(u.id) || this.isUserDeleted(u.email)) continue;
        const key = (u.email ? u.email.toLowerCase().trim() : u.id);
        const existing = userMap.get(key) || (u.id ? userMap.get(u.id) : null);

        if (!existing) {
          userMap.set(key, { ...u });
          if (u.id) userMap.set(u.id, userMap.get(key));
        } else {
          // If existing is already loaded (from primary DB / higher priority), existing takes precedence!
          // We only enrich fields that are genuinely missing in existing.
          const merged = {
            ...u,
            ...existing,
            name: (existing.name && !existing.name.startsWith('Trader user-')) ? existing.name : (u.name || existing.name || 'Trader'),
            email: (existing.email && !existing.email.includes('@trader.quotex')) ? existing.email.toLowerCase() : (u.email ? u.email.toLowerCase() : existing.email),
            subscriptionPlan: existing.subscriptionPlan !== undefined ? existing.subscriptionPlan : (u.subscriptionPlan || 'Free Trial'),
            plan: existing.plan !== undefined ? existing.plan : (existing.subscriptionPlan || u.plan || u.subscriptionPlan || 'Free Trial'),
            isLifetimeApproved: existing.isLifetimeApproved !== undefined ? Boolean(existing.isLifetimeApproved) : Boolean(u.isLifetimeApproved),
            isActive: existing.isActive !== undefined ? Boolean(existing.isActive) : (u.isActive !== undefined ? Boolean(u.isActive) : true),
            isFreeTrialExpired: existing.isFreeTrialExpired !== undefined ? Boolean(existing.isFreeTrialExpired) : Boolean(u.isFreeTrialExpired),
            subExpiresAt: existing.subExpiresAt || u.subExpiresAt || '',
            planExpiresAt: existing.planExpiresAt || existing.subExpiresAt || u.planExpiresAt || u.subExpiresAt || '',
            passwordHash: existing.passwordHash || u.passwordHash || defaultData.users[0].passwordHash,
            createdAt: existing.createdAt || u.createdAt || new Date().toISOString()
          };
          userMap.set(key, merged);
          if (merged.id) userMap.set(merged.id, merged);
        }
      }
    }

    // Return unique users array (excluding any deleted users)
    const seenIds = new Set();
    const uniqueUsers = [];
    for (const user of userMap.values()) {
      if (this.isUserDeleted(user.id) || this.isUserDeleted(user.email)) continue;
      const uid = user.id || user.email;
      if (!seenIds.has(uid)) {
        seenIds.add(uid);
        uniqueUsers.push(user);
      }
    }
    return uniqueUsers;
  }

  init() {
    try {
      if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      }

      let loadedUsers = [];

      // 1. Read primary DB_FILE if available (HIGHEST PRIORITY)
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileContent = fs.readFileSync(DB_FILE, 'utf8');
          const parsed = JSON.parse(fileContent);
          this.data = parsed;
          if (Array.isArray(parsed.users)) loadedUsers.push(...parsed.users);
        } catch (e) {
          console.error('[DB] Primary file load warning:', e.message);
        }
      }

      // 2. Read USERS_REGISTRY_FILE if available
      if (fs.existsSync(USERS_REGISTRY_FILE)) {
        try {
          const regContent = fs.readFileSync(USERS_REGISTRY_FILE, 'utf8');
          const regParsed = JSON.parse(regContent);
          const regUsers = Array.isArray(regParsed) ? regParsed : (regParsed.users || []);
          loadedUsers.push(...regUsers);
        } catch (e) {
          console.error('[DB] Users registry load warning:', e.message);
        }
      }

      // 3. Read BACKUP_FILE if available
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const bkpContent = fs.readFileSync(BACKUP_FILE, 'utf8');
          const bkpParsed = JSON.parse(bkpContent);
          const bkpUsers = Array.isArray(bkpParsed) ? bkpParsed : (bkpParsed.users || []);
          loadedUsers.push(...bkpUsers);
        } catch (e) {
          console.error('[DB] Users backup load warning:', e.message);
        }
      }

      // 4. Read SITE_CONFIG_BACKUP_FILE if available (preserve db.json's siteConfig if loaded)
      let siteBackup = null;
      if (fs.existsSync(SITE_CONFIG_BACKUP_FILE)) {
        try {
          siteBackup = JSON.parse(fs.readFileSync(SITE_CONFIG_BACKUP_FILE, 'utf8'));
        } catch (e) {}
      }
      this.data.siteConfig = { ...defaultData.siteConfig, ...(siteBackup || {}), ...(this.data.siteConfig || {}) };

      // 5. Read SYSTEM_CONFIG_BACKUP_FILE if available
      let sysBackup = null;
      if (fs.existsSync(SYSTEM_CONFIG_BACKUP_FILE)) {
        try {
          sysBackup = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_BACKUP_FILE, 'utf8'));
        } catch (e) {}
      }
      this.data.systemConfig = { ...defaultData.systemConfig, ...(sysBackup || {}), ...(this.data.systemConfig || {}) };

      // 6. Read ANNOUNCEMENTS_BACKUP_FILE if available
      if (!Array.isArray(this.data.announcements) || this.data.announcements.length === 0) {
        if (fs.existsSync(ANNOUNCEMENTS_BACKUP_FILE)) {
          try {
            const annBackup = JSON.parse(fs.readFileSync(ANNOUNCEMENTS_BACKUP_FILE, 'utf8'));
            const list = Array.isArray(annBackup) ? annBackup : (annBackup?.announcements || []);
            if (list.length > 0) {
              this.data.announcements = list;
            }
          } catch (e) {}
        }
      }

      // Read DELETED_USERS_FILE if available
      if (fs.existsSync(DELETED_USERS_FILE)) {
        try {
          const delParsed = JSON.parse(fs.readFileSync(DELETED_USERS_FILE, 'utf8'));
          const delUsers = Array.isArray(delParsed) ? delParsed : (delParsed?.deletedUsers || []);
          if (Array.isArray(delUsers) && delUsers.length > 0) {
            this.data.deletedUsers = delUsers;
          }
        } catch (e) {}
      }
      if (!Array.isArray(this.data.deletedUsers)) {
        this.data.deletedUsers = [];
      }

      // Merge all users: loadedUsers from DB_FILE has FIRST priority, defaultData.users last!
      this.data.users = this.mergeUserLists(loadedUsers, this.data.users || [], defaultData.users);

      // 7. Read PLAN_SUBSCRIPTIONS_BACKUP_FILE if available
      if (fs.existsSync(PLAN_SUBSCRIPTIONS_BACKUP_FILE)) {
        try {
          const subsBackup = JSON.parse(fs.readFileSync(PLAN_SUBSCRIPTIONS_BACKUP_FILE, 'utf8'));
          if (Array.isArray(subsBackup)) {
            this.data.planSubscriptions = subsBackup;
          } else if (Array.isArray(subsBackup?.planSubscriptions)) {
            this.data.planSubscriptions = subsBackup.planSubscriptions;
          }
        } catch (e) {}
      }

      // 8. Read SUBSCRIPTION_PLANS_BACKUP_FILE if available
      if (fs.existsSync(SUBSCRIPTION_PLANS_BACKUP_FILE)) {
        try {
          const plansBackup = JSON.parse(fs.readFileSync(SUBSCRIPTION_PLANS_BACKUP_FILE, 'utf8'));
          if (Array.isArray(plansBackup) && plansBackup.length > 0) {
            this.data.subscriptionPlans = plansBackup;
          } else if (Array.isArray(plansBackup?.subscriptionPlans) && plansBackup.subscriptionPlans.length > 0) {
            this.data.subscriptionPlans = plansBackup.subscriptionPlans;
          }
        } catch (e) {}
      }

      // Ensure critical tables exist
      if (!this.data.userNotifications) this.data.userNotifications = defaultData.userNotifications;
      if (!this.data.userSecurity) this.data.userSecurity = defaultData.userSecurity;
      if (!this.data.errorLogs) this.data.errorLogs = [];
      if (!this.data.systemConfig) this.data.systemConfig = JSON.parse(JSON.stringify(defaultData.systemConfig));
      if (!this.data.siteConfig) this.data.siteConfig = JSON.parse(JSON.stringify(defaultData.siteConfig));
      if (!this.data.planSubscriptions) this.data.planSubscriptions = [];
      if (!this.data.referralRequests) this.data.referralRequests = [];
      if (!this.data.deletedSubscriptionIds) this.data.deletedSubscriptionIds = [];
      if (!this.data.riskSettings) this.data.riskSettings = defaultData.riskSettings;
      if (!this.data.brokerConnections) this.data.brokerConnections = defaultData.brokerConnections;
      if (!this.data.strategies) this.data.strategies = defaultData.strategies;
      if (!this.data.tradeLogs) this.data.tradeLogs = defaultData.tradeLogs;
      if (!this.data.auditLogs) this.data.auditLogs = [];
      if (!Array.isArray(this.data.announcements) || this.data.announcements.length === 0) {
        this.data.announcements = JSON.parse(JSON.stringify(defaultData.announcements));
      }
      if (!this.data.subscriptionPlans || this.data.subscriptionPlans.length === 0) {
        this.data.subscriptionPlans = defaultData.subscriptionPlans;
      }

      // Emergency controls: preserve whatever state the admin saved!
      if (!this.data.systemConfig.emergencyControls) {
        this.data.systemConfig.emergencyControls = {
          userRegistrationEnabled: true,
          userLoginEnabled: true,
          tradingStrategiesEnabled: true
        };
      }
      if (this.data.systemConfig.emergencyControls.userRegistrationEnabled === undefined) {
        this.data.systemConfig.emergencyControls.userRegistrationEnabled = true;
      }

      if (!this.data.siteConfig.emergencyControls) {
        this.data.siteConfig.emergencyControls = { ...this.data.systemConfig.emergencyControls };
      }
      if (this.data.siteConfig.emergencyControls.userRegistrationEnabled === undefined) {
        this.data.siteConfig.emergencyControls.userRegistrationEnabled = true;
      }

      // Referral link & support fallbacks: only if missing/empty
      if (!this.data.siteConfig.referralLink) {
        this.data.siteConfig.referralLink = 'https://broker-qx.pro/sign-up/?lid=1650958';
      }
      if (!this.data.siteConfig.telegramSupport) {
        this.data.siteConfig.telegramSupport = 'https://t.me/Quotexautotrade_Support';
      }
      if (!this.data.siteConfig.supportEmail) {
        this.data.siteConfig.supportEmail = 'support@quotexautotrade.com';
      }

      if (this.data.siteConfig.priceBasic === undefined) this.data.siteConfig.priceBasic = 49;
      if (this.data.siteConfig.pricePro === undefined) this.data.siteConfig.pricePro = 129;
      if (this.data.siteConfig.priceQuantum === undefined) this.data.siteConfig.priceQuantum = 239;
      if (this.data.siteConfig.pricePremium === undefined) this.data.siteConfig.pricePremium = 450;
      if (this.data.siteConfig.enableUPI === undefined) this.data.siteConfig.enableUPI = true;
      if (this.data.siteConfig.enableBankTransfer === undefined) this.data.siteConfig.enableBankTransfer = true;
      if (this.data.siteConfig.enableUSDT === undefined) this.data.siteConfig.enableUSDT = true;
      if (!this.data.siteConfig.brokerLinks) this.data.siteConfig.brokerLinks = defaultData.siteConfig.brokerLinks;

      // Save merged snapshot to disk and backups
      this.save();
      console.log(`[DB] Database initialized successfully. Total permanent users: ${this.data.users.length}`);
    } catch (err) {
      console.error('[DB] Error initializing database:', err.message);
      this.data.users = this.mergeUserLists(this.data.users || [], defaultData.users);
    }
  }

  async initMongo() {
    const defaultMongoUri = 'mongodb+srv://testing:Testing%401234@cluster0.hpcm1wl.mongodb.net/90pips?retryWrites=true&w=majority';
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || defaultMongoUri;
    if (!mongoUri || (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://'))) {
      console.log('[DB-Mongo] No MONGODB_URI configured. Running on multi-tier local file persistence.');
      return;
    }

    try {
      const mongoose = require('mongoose');
      mongooseInstance = mongoose;
      console.log('[DB-Mongo] Connecting to MongoDB Atlas cloud database...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10
      });
      this.mongoConnected = true;
      console.log('[DB-Mongo] Connected to MongoDB Atlas successfully! Permanent cloud persistence active.');

      const schema = new mongoose.Schema({
        key: { type: String, unique: true, required: true },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
        updatedAt: { type: Date, default: Date.now }
      });
      AppDataModel = mongoose.models.AppData || mongoose.model('AppData', schema);

      // Load cloud state and merge
      const cloudDoc = await AppDataModel.findOne({ key: 'qx_app_data' });
      if (cloudDoc && cloudDoc.data) {
        console.log('[DB-Mongo] Synced latest snapshot from MongoDB Atlas.');
        const cloudData = cloudDoc.data;

        // Authoritatively restore all collections/tables from cloudData
        for (const [key, value] of Object.entries(cloudData)) {
          if (key === 'users') {
            this.data.users = this.mergeUserLists(value, this.data.users || [], defaultData.users);
          } else if (key === 'siteConfig') {
            this.data.siteConfig = { ...defaultData.siteConfig, ...this.data.siteConfig, ...value };
          } else if (key === 'systemConfig') {
            this.data.systemConfig = { ...defaultData.systemConfig, ...this.data.systemConfig, ...value };
          } else if (Array.isArray(value)) {
            this.data[key] = value;
          } else if (typeof value === 'object' && value !== null) {
            this.data[key] = { ...(defaultData[key] || {}), ...(this.data[key] || {}), ...value };
          } else {
            this.data[key] = value;
          }
        }

        // Restore and sync deletedUsers from cloud snapshot
        if (Array.isArray(cloudData.deletedUsers)) {
          const currentDeleted = this.data.deletedUsers || [];
          cloudData.deletedUsers.forEach(d => {
            const did = (d.id || d || '').toString().toLowerCase();
            const demail = (d.email || '').toString().toLowerCase();
            if (!currentDeleted.some(cd => (cd.id && cd.id.toLowerCase() === did) || (cd.email && demail && cd.email.toLowerCase() === demail))) {
              currentDeleted.push(d);
            }
          });
          this.data.deletedUsers = currentDeleted;
        }

        // Purge any deleted users from active user list
        this.data.users = (this.data.users || []).filter(u => !this.isUserDeleted(u.id) && !this.isUserDeleted(u.email));

        // Guarantee userRegistrationEnabled strictly defaults to true
        if (!this.data.systemConfig.emergencyControls) {
          this.data.systemConfig.emergencyControls = {
            userRegistrationEnabled: true,
            userLoginEnabled: true,
            tradingStrategiesEnabled: true
          };
        }
        if (this.data.systemConfig.emergencyControls.userRegistrationEnabled === undefined) {
          this.data.systemConfig.emergencyControls.userRegistrationEnabled = true;
        }

        if (!this.data.siteConfig.emergencyControls) {
          this.data.siteConfig.emergencyControls = { ...this.data.systemConfig.emergencyControls };
        }
        if (this.data.siteConfig.emergencyControls.userRegistrationEnabled === undefined) {
          this.data.siteConfig.emergencyControls.userRegistrationEnabled = true;
        }

        this.save();
        console.log(`[DB-Mongo] Cloud state restored. Total users: ${this.data.users?.length || 0}`);
      } else {
        console.log('[DB-Mongo] No cloud snapshot found. Seeding initial data to MongoDB Atlas...');
        await this.syncToMongo();
        console.log('[DB-Mongo] Initial data successfully seeded to MongoDB Atlas.');
      }
    } catch (err) {
      console.error('[DB-Mongo] MongoDB connection error:', err.message);
    }
  }

  async syncToMongo() {
    if (!this.mongoConnected) {
      try {
        await this.initMongo();
      } catch (_) {}
    }
    if (!this.mongoConnected || !AppDataModel) return;
    try {
      // Keep MongoDB payload lean (<50KB) so queries never time out
      const payload = { ...this.data };
      if (Array.isArray(payload.auditLogs) && payload.auditLogs.length > 100) {
        payload.auditLogs = payload.auditLogs.slice(0, 100);
      }
      if (Array.isArray(payload.tradeLogs) && payload.tradeLogs.length > 100) {
        payload.tradeLogs = payload.tradeLogs.slice(0, 100);
      }
      await AppDataModel.findOneAndUpdate(
        { key: 'qx_app_data' },
        { data: payload, updatedAt: new Date() },
        { upsert: true, returnDocument: 'after' }
      );
      console.log('[DB-Mongo] State saved to MongoDB Atlas.');
    } catch (err) {
      console.error('[DB-Mongo] Error syncing to MongoDB Atlas:', err.message);
    }
  }

  save() {
    try {
      const jsonContent = JSON.stringify(this.data, null, 2);
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, jsonContent, 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (e) {
        console.error('[DB] Failed to save DB_FILE:', e.message);
      }
    }

    // Always keep updated multi-file backups
    try {
      const usersJson = JSON.stringify({ users: this.data.users, updatedAt: new Date().toISOString() }, null, 2);
      fs.writeFileSync(USERS_REGISTRY_FILE, usersJson, 'utf8');
      fs.writeFileSync(BACKUP_FILE, usersJson, 'utf8');

      if (Array.isArray(this.data.deletedUsers)) {
        fs.writeFileSync(DELETED_USERS_FILE, JSON.stringify({ deletedUsers: this.data.deletedUsers, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
      }

      if (this.data.siteConfig) {
        fs.writeFileSync(SITE_CONFIG_BACKUP_FILE, JSON.stringify(this.data.siteConfig, null, 2), 'utf8');
      }
      if (this.data.systemConfig) {
        fs.writeFileSync(SYSTEM_CONFIG_BACKUP_FILE, JSON.stringify(this.data.systemConfig, null, 2), 'utf8');
      }
      if (this.data.announcements) {
        fs.writeFileSync(ANNOUNCEMENTS_BACKUP_FILE, JSON.stringify({ announcements: this.data.announcements, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
      }
      if (Array.isArray(this.data.planSubscriptions)) {
        fs.writeFileSync(PLAN_SUBSCRIPTIONS_BACKUP_FILE, JSON.stringify(this.data.planSubscriptions, null, 2), 'utf8');
      }
      if (Array.isArray(this.data.subscriptionPlans)) {
        fs.writeFileSync(SUBSCRIPTION_PLANS_BACKUP_FILE, JSON.stringify(this.data.subscriptionPlans, null, 2), 'utf8');
      }
    } catch (e) {
      // Non-fatal
    }

    // Asynchronously sync to MongoDB Atlas if connected
    this.syncToMongo().catch(() => {});
  }

  // Safe Upsert user method: updates or inserts without losing user details
  upsertUser(userData, fromAdmin = false) {
    if (!userData) return null;
    const users = this.get('users');
    const lookupId = userData.id;
    const lookupEmail = userData.email ? userData.email.toLowerCase().trim() : null;

    if (!fromAdmin) {
      if (this.isUserDeleted(lookupId) || this.isUserDeleted(lookupEmail)) {
        return null;
      }
    }

    let index = users.findIndex(u => (lookupId && u.id === lookupId) || (lookupEmail && u.email && u.email.toLowerCase() === lookupEmail));

    if (index >= 0) {
      // User exists: admin input is authoritative. Client requests NEVER overwrite plan or lifetime status!
      const existing = users[index];
      
      const plan = fromAdmin
        ? (userData.subscriptionPlan || userData.plan || existing.subscriptionPlan || 'Free Trial')
        : (existing.subscriptionPlan || existing.plan || userData.subscriptionPlan || 'Free Trial');

      const isLifetime = fromAdmin
        ? (userData.isLifetimeApproved !== undefined ? Boolean(userData.isLifetimeApproved) : Boolean(existing.isLifetimeApproved))
        : Boolean(existing.isLifetimeApproved);

      const isActive = fromAdmin
        ? (userData.isActive !== undefined ? Boolean(userData.isActive) : (existing.isActive !== undefined ? Boolean(existing.isActive) : true))
        : (existing.isActive !== undefined ? Boolean(existing.isActive) : true);

      users[index] = {
        ...existing,
        ...userData,
        name: (userData.name && !userData.name.startsWith('Trader user-')) ? userData.name : existing.name,
        email: (userData.email && !userData.email.includes('@trader.quotex')) ? userData.email.toLowerCase() : existing.email,
        passwordHash: userData.passwordHash || existing.passwordHash,
        password: userData.password || existing.password || '',
        subscriptionPlan: plan,
        plan: plan,
        isLifetimeApproved: isLifetime,
        isActive: isActive,
        subExpiresAt: fromAdmin && userData.subExpiresAt ? userData.subExpiresAt : (existing.subExpiresAt || userData.subExpiresAt || ''),
        planExpiresAt: fromAdmin && (userData.planExpiresAt || userData.subExpiresAt) ? (userData.planExpiresAt || userData.subExpiresAt) : (existing.planExpiresAt || existing.subExpiresAt || userData.subExpiresAt || '')
      };
      this.save();
      return users[index];
    } else {
      // User does not exist: create user
      const nowMs = Date.now();
      const plan = userData.subscriptionPlan || userData.plan || 'Free Trial';
      let passwordHash = userData.passwordHash;
      if (!passwordHash && userData.password) {
        try {
          const bcrypt = require('bcryptjs');
          passwordHash = bcrypt.hashSync(userData.password, 10);
        } catch (_) {}
      }
      if (!passwordHash) {
        passwordHash = defaultData.users[0].passwordHash;
      }
      const newUser = {
        id: userData.id || `user-${nowMs}`,
        name: userData.name || 'Trader',
        email: (userData.email && !userData.email.includes('@trader.quotex')) ? userData.email.toLowerCase() : `${userData.id || nowMs}@trader.quotex`,
        passwordHash: passwordHash,
        password: userData.password || '',
        role: userData.role || 'USER',
        subscriptionPlan: plan,
        plan: plan,
        subExpiresAt: userData.subExpiresAt || new Date(nowMs + 60 * 60 * 1000).toISOString(),
        planExpiresAt: userData.planExpiresAt || userData.subExpiresAt || new Date(nowMs + 60 * 60 * 1000).toISOString(),
        isLifetimeApproved: Boolean(userData.isLifetimeApproved),
        isActive: userData.isActive !== undefined ? Boolean(userData.isActive) : true,
        createdAt: userData.createdAt || new Date(nowMs).toISOString(),
        brokerName: userData.brokerName || 'QUOTEX',
        brokerId: userData.brokerId || '',
        telegramId: userData.telegramId || ''
      };
      users.unshift(newUser);

      // Default risk settings if missing
      const riskSettings = this.get('riskSettings');
      if (!riskSettings[newUser.id]) {
        riskSettings[newUser.id] = {
          mode: 'MTG',
          amountType: 'FIXED',
          fixedAmount: 10,
          percentageAmount: 2.0,
          mtgMultiplier: 2.1,
          maxMtgLevel: 5,
          dailyProfitTarget: 100,
          dailyStopLoss: 150,
          maxTradesPerSession: 15,
          maxConsecutiveLosses: 3,
          minBalanceProtection: 50
        };
      }
      this.save();
      return newUser;
    }
  }

  get(table) {
    if (!this.data[table]) {
      this.data[table] = defaultData[table] || (table.endsWith('s') ? [] : {});
    }
    return this.data[table];
  }

  set(table, value) {
    this.data[table] = value;
    this.save();
  }
}

module.exports = new Database();

