import { useState, useEffect } from 'react';
import { LogIn, LogOut, LayoutDashboard, Home as HomeIcon, User, Menu, X, Settings, Bell, Check } from 'lucide-react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { ProfileSettings } from './ProfileSettings';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

interface NavbarProps {
  onNavigate: (page: 'home' | 'dashboard' | 'asset') => void;
  currentPage: string;
}

export function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const { user, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
     if (!user) return;
     const q = query(collection(db, 'notifications'), where('userId', '==', user.uid));
     return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
     });
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    notifications.filter(n => !n.read).forEach((n) => {
       // Ideally batch this 
       const docRef = doc(db, 'notifications', n.id);
       updateDoc(docRef, { read: true });
    });
  };

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: HomeIcon },
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  ];

  return (
    <nav className="h-20 border-b border-white/10 sticky top-0 z-50 bg-[#0F0F0F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex items-center space-x-8 space-x-reverse">
            <button 
              onClick={() => onNavigate('home')}
              className="text-3xl font-bold tracking-tighter text-yellow-500 flex flex-col items-start leading-none"
            >
              <div><span className="border-r-4 border-yellow-500 pr-3">عتاد</span></div>
              <span className="text-sm font-light text-white/40 block leading-none pr-4 mt-1">ATAD</span>
            </button>
            
            <div className="hidden md:flex items-center space-x-2 space-x-reverse mr-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as any)}
                  className={`px-4 py-2 flex items-center gap-2 rounded-xl text-sm font-medium transition-colors
                    ${currentPage === item.id 
                      ? 'bg-yellow-500/10 text-yellow-500' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button 
                    title="الإشعارات" 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-white/40 hover:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                  </button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-4 w-80 bg-[#141414] border border-white/10 rounded-3xl shadow-xl overflow-hidden z-50 origin-top-right"
                      >
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                          <h4 className="font-bold text-white">الإشعارات</h4>
                          {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-yellow-500 hover:text-yellow-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> مقروءة
                            </button>
                          )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center text-white/40 text-sm">
                              لا توجد إشعارات حالياً
                            </div>
                          ) : (
                            notifications.map(notif => (
                              <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-default ${!notif.read ? 'bg-yellow-500/5' : ''}`}>
                                <h5 className={`text-sm ${!notif.read ? 'font-bold text-white' : 'font-medium text-white/70'}`}>{notif.title}</h5>
                                <p className="text-xs text-white/50 mt-1">{notif.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={() => setShowProfile(true)}
                  className="p-2 text-white/40 hover:text-yellow-500 transition-colors"
                  title="الإعدادات"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-end border-r border-white/10 pr-4">
                  <span className="text-xs text-white/50">مرحباً، {user.displayName}</span>
                  <span className="text-sm font-bold text-yellow-500">{profile?.role === 'lender' ? 'حساب المؤجر' : 'حساب المستأجر'}</span>
                </div>
                {profile?.photoUrl || user.photoURL ? (
                  <img src={profile?.photoUrl || user.photoURL || ''} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20 object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <User className="text-white/50 w-5 h-5" />
                  </div>
                )}
                <button 
                  onClick={logout}
                  className="p-2 text-white/40 hover:text-red-500 transition-colors ml-2"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                className="bg-yellow-500 text-black px-6 py-2.5 rounded-full text-sm font-bold hover:bg-yellow-400 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-yellow-500/10"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-white/60 hover:bg-white/10 focus:outline-none"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0F0F0F] border-t border-white/10 overflow-hidden absolute w-full"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id as any);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full text-right px-4 py-3 rounded-xl text-base font-medium flex items-center gap-3
                    ${currentPage === item.id ? 'bg-yellow-500/10 text-yellow-500' : 'text-white/60 hover:bg-white/5'}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              {user && (
                 <button
                    onClick={() => {
                      setShowProfile(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 rounded-xl text-base font-medium text-white/60 hover:bg-white/5 flex items-center gap-3"
                  >
                    <Settings className="w-5 h-5" />
                    الإعدادات
                 </button>
              )}
              <div className="pt-4 border-t border-white/10 mt-4">
                {user ? (
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 rounded-xl text-base font-medium text-red-500 flex items-center gap-3 hover:bg-white/5"
                  >
                    <LogOut className="w-5 h-5" />
                    تسجيل الخروج
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      login();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-right px-4 py-3 rounded-xl text-base font-medium text-yellow-500 flex items-center gap-3 hover:bg-white/5"
                  >
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </nav>
  );
}
