import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import {
  Menu,
  X,
  Zap,
  BarChart3,
  Shield,
  Activity,
  Lock,
  Clock,
  Check,
  Star,
  MessageCircle,
  Send,
  ArrowRight,
  TrendingUp,
  Wifi,
  Users,
  Headphones,
  ChevronRight,
  ExternalLink,
  Download,
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Auto Trading',
    desc: 'Fully automated trading bots that execute trades 24/7 without manual intervention.',
  },
  {
    icon: BarChart3,
    title: 'Multiple Strategies',
    desc: 'Choose from proven trading strategies optimized for different market conditions.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    desc: 'Advanced risk controls with stop-loss, martingale, and capital protection settings.',
  },
  {
    icon: Activity,
    title: 'Real-time Analytics',
    desc: 'Live performance dashboards with detailed trade history and profit tracking.',
  },
  {
    icon: Lock,
    title: 'Secure Connection',
    desc: 'Encrypted API connections to your broker. We never hold your funds.',
  },
  {
    icon: Clock,
    title: '24/7 Trading',
    desc: 'Round-the-clock automated trading across multiple currency pairs and assets.',
  },
];

const sampleTrades = [
  { pair: 'EUR/USD', type: 'CALL', amount: '$100', result: 'WIN', profit: '+$87.00', time: '2s ago' },
  { pair: 'GBP/JPY', type: 'PUT', amount: '$50', result: 'WIN', profit: '+$43.50', time: '8s ago' },
  { pair: 'USD/CAD', type: 'CALL', amount: '$75', result: 'WIN', profit: '+$65.25', time: '14s ago' },
  { pair: 'AUD/USD', type: 'PUT', amount: '$100', result: 'WIN', profit: '+$87.00', time: '21s ago' },
  { pair: 'EUR/GBP', type: 'CALL', amount: '$60', result: 'WIN', profit: '+$52.20', time: '28s ago' },
];

const defaultPlans = [
  {
    name: 'Basic',
    price: '$49',
    period: '/month',
    features: ['1 Trading Bot', 'Basic Strategies', 'Email Support', '2 Currency Pairs', 'Daily Reports'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$129',
    period: '/3 months',
    features: ['5 Trading Bots', 'Advanced Strategies', 'Priority Support', '10 Currency Pairs', 'Real-time Analytics', 'Custom Indicators'],
    cta: 'Start Pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$450',
    period: '/12 months',
    features: ['Unlimited Bots', 'All Strategies', 'Dedicated Support', 'All Currency Pairs', 'Advanced Analytics', 'Custom Indicators', 'API Access'],
    cta: 'Go Premium',
    popular: false,
  },
];

const testimonials = [
  {
    name: 'Alex Johnson',
    initials: 'AJ',
    role: 'Day Trader',
    rating: 5,
    text: 'QX AUTO TRADE transformed my trading completely. I went from manually watching charts all day to letting the bots handle everything. My profits increased by 340% in just 2 months.',
  },
  {
    name: 'Sarah Mitchell',
    initials: 'SM',
    role: 'Forex Trader',
    rating: 5,
    text: 'The risk management features are incredible. I can set my own parameters and the system respects them perfectly. It\'s like having a professional trader working for you 24/7.',
  },
  {
    name: 'Michael Chen',
    initials: 'MC',
    role: 'Crypto & Forex',
    rating: 5,
    text: 'Best investment I\'ve made. The Pro plan pays for itself within the first week. The real-time analytics dashboard gives me full visibility into every trade.',
  },
];

const brokers = [
  { name: 'Quotex', color: 'from-green-400 to-emerald-500' },
  { name: 'PocketOption', color: 'from-blue-400 to-indigo-500' },
  { name: 'OlympTrade', color: 'from-green-500 to-teal-500' },
  { name: 'GuruTrade7', color: 'from-purple-400 to-pink-500' },
];

function getYouTubeEmbedUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('<iframe')) {
    const srcMatch = trimmed.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
  }
  if (trimmed.includes('youtube.com/embed/')) return trimmed;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2].length === 11) ? `https://www.youtube-nocookie.com/embed/${match[2]}` : trimmed;
}

export default function Landing() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [plans, setPlans] = useState(defaultPlans);
  const [siteConfig, setSiteConfig] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    api.getPublicPlans().then((data) => {
      if (!mounted) return;
      if (data?.siteConfig) {
        setSiteConfig(data.siteConfig);
      }
      const apiPlans = data?.plans || [];
      if (apiPlans.length > 0) {
        setPlans(apiPlans.map(p => ({
          ...p,
          cta: p.cta || (p.popular ? 'Start Pro' : 'Get Started')
        })));
      }
    }).catch(() => {});

    // Live sync Master Admin announcements to Landing website
    api.getUserAnnouncements().then((d) => {
      if (!mounted) return;
      if (d?.announcements && Array.isArray(d.announcements)) {
        const active = d.announcements.filter(a => a.isActive !== false && a.active !== false);
        setAnnouncements(active);
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  const activeAnnouncementText = (announcements.length > 0)
    ? `${announcements[0].title}: ${announcements[0].content}`
    : (siteConfig.isAnnouncementActive && siteConfig.announcementText ? siteConfig.announcementText : null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location]);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Live Trades', href: '#live-trades' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
  ];

  const scrollTo = (href) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-dark-900 min-h-screen text-white font-sans overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark-900/95 backdrop-blur-md shadow-lg border-b border-cyan-500/10' : 'bg-dark-900/80 backdrop-blur-sm'
        }`}
      >
        {/* Live Admin Announcement Banner */}
        {activeAnnouncementText && !announcementDismissed && (
          <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-medium flex items-center justify-between border-b border-cyan-400/30 shadow-md">
            <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden">
              <span className="bg-black/30 border border-white/20 text-cyan-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 animate-pulse">
                📢 ANNOUNCEMENT
              </span>
              <span className="text-white truncate font-medium">{activeAnnouncementText}</span>
            </div>
            <button
              onClick={() => setAnnouncementDismissed(true)}
              className="text-cyan-200 hover:text-white p-1 rounded transition-colors ml-2 shrink-0"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                <span className="text-cyan-400">QX</span>{' '}
                <span className="text-white group-hover:text-cyan-300 transition-colors">AUTO TRADE</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all text-sm font-medium"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-gray-300 hover:text-cyan-400 transition-colors text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-semibold text-sm transition-all shadow-glow hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]"
                  >
                    Sign Up Free
                  </Link>
                  <a
                    href="/Autotrade.apk"
                    download="Autotrade.apk"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-dark-900 font-bold text-sm transition-all shadow-glow flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download App
                  </a>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-gray-300 hover:text-cyan-400 transition-colors"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-dark-800/98 backdrop-blur-md border-t border-cyan-500/10">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="block w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:text-cyan-400 hover:bg-dark-700 transition-all text-sm"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2 border-t border-dark-700 space-y-2">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-center text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-lg text-gray-300 text-center text-sm"
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-lg bg-cyan-500 text-dark-900 font-semibold text-center text-sm"
                    >
                      Sign Up Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-cyan-300 text-sm font-medium">Live Trading Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Automated Trading
            </span>
            <br />
            <span className="text-white">Made Simple</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Harness the power of AI-driven trading bots to execute profitable strategies
            on binary options platforms — automatically, 24/7.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-lg transition-all shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] flex items-center gap-2"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <a
                  href="/Autotrade.apk"
                  download="Autotrade.apk"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-white font-extrabold text-lg transition-all shadow-glow flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download App Now
                </a>
                <Link
                  to="/signup"
                  className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-lg transition-all shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] flex items-center gap-2"
                >
                  Start Auto Trade <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => scrollTo('#pricing')}
                  className="px-8 py-4 rounded-xl border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold text-lg transition-all"
                >
                  View Pricing
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-white font-bold text-lg">10K+</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Active Traders</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-white font-bold text-lg">99.9%</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Uptime</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-cyan-400" />
              <div className="text-left">
                <div className="text-white font-bold text-lg">24/7</div>
                <div className="text-gray-500 text-xs uppercase tracking-wider">Support</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronRight className="w-6 h-6 text-cyan-400 rotate-90" />
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Everything you need to automate your trading and maximize profits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all duration-300 group hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Video Showcase ─── */}
      {(siteConfig.youtubeEmbedLink || siteConfig.youtubeEmbedCode) && (
        <section id="demo" className="py-20 bg-dark-900/90 relative overflow-hidden border-t border-b border-cyan-500/10">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-300 text-xs font-semibold uppercase tracking-wider">Live Video Guide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                See QX Auto Trade In Action
              </span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-10 text-sm sm:text-base">
              Watch how our intelligent automated trading bot executes high-probability signals on Quotex with real-time risk management.
            </p>

            <div className="relative mx-auto rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,212,255,0.15)] aspect-video max-w-4xl bg-black">
              <iframe
                src={getYouTubeEmbedUrl(siteConfig.youtubeEmbedLink || siteConfig.youtubeEmbedCode)}
                title="Quotex Auto Trade Video Demonstration"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </section>
      )}

      {/* ─── Live Trades ─── */}
      <section id="live-trades" className="py-24 bg-dark-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <h2 className="text-3xl sm:text-4xl font-bold">
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Live Trade Feed
                </span>
              </h2>
            </div>
            <p className="text-gray-400">Watch our bots execute trades in real-time.</p>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/10">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Pair</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Type</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Amount</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Result</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Profit</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTrades.map((t, i) => (
                    <tr
                      key={i}
                      className="border-b border-dark-700/50 hover:bg-cyan-500/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-white">{t.pair}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            t.type === 'CALL'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">{t.amount}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                          {t.result}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-400">{t.profit}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 text-right">{t.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-dark-700/50 flex items-center justify-between">
              <p className="text-xs text-gray-500">Showing recent trades</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Live</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 bg-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Simple Pricing
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Choose the plan that fits your trading needs. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? 'glass-card border-cyan-500/50 shadow-glow ring-1 ring-cyan-500/20'
                    : 'glass-card'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-cyan-500 text-dark-900 text-xs font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`block w-full py-3 rounded-xl text-center font-semibold text-sm transition-all ${
                    plan.popular
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-dark-900 shadow-glow hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]'
                      : 'border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                What Traders Say
              </span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Join thousands of satisfied traders already using QX AUTO TRADE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 hover:shadow-glow transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-brand-gold fill-brand-gold" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-sm font-bold text-dark-900">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Brokers ─── */}
      <section id="brokers" className="py-24 bg-dark-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Supported Brokers
              </span>
            </h2>
            <p className="text-gray-400">Connect seamlessly with top binary options platforms.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {brokers.map((b, i) => (
              <div
                key={i}
                className="glass-card rounded-2xl p-6 flex flex-col items-center gap-4 hover:shadow-glow transition-all duration-300 group hover:-translate-y-1"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Community ─── */}
      <section className="py-24 bg-dark-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <div className="glass-card rounded-2xl p-10 sm:p-14">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Join Our Community
              </span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Get free trading signals, bot updates, and connect with thousands of traders on Telegram.
            </p>
            <a
              href={siteConfig?.telegramLink || siteConfig?.telegram || "https://t.me/"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-bold text-lg transition-all shadow-glow hover:shadow-[0_0_30px_rgba(0,212,255,0.5)]"
            >
              <Send className="w-5 h-5" />
              Join on Telegram
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-dark-800 border-t border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">
                  <span className="text-cyan-400">QX</span>{' '}
                  <span className="text-white">AUTO TRADE</span>
                </span>
              </Link>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI-powered automated trading for binary options. Trade smarter, not harder.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Live Trades', 'API Docs'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => scrollTo('#features')}
                      className="text-sm text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2">
                {['About Us', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Terms of Service', 'Privacy Policy', 'Risk Disclaimer', 'Refund Policy'].map((item) => (
                  <li key={item}>
                    <span className="text-sm text-gray-500 hover:text-cyan-400 transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-700 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} QX AUTO TRADE. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {['Telegram', 'Discord', 'Twitter', 'YouTube'].map((social) => (
                <span
                  key={social}
                  className="text-xs text-gray-600 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {social}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
