/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { AssetDetails } from './pages/AssetDetails';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  setRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<'home' | 'dashboard' | 'asset'>('home');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Need to set role first, will be handled by UI
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching profile", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const setRole = async (role: UserRole) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || '',
      role,
      equipmentCategories: [],
      preferredLocation: '',
      createdAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const navigateTo = (p: 'home' | 'dashboard' | 'asset', id?: string) => {
    setPage(p);
    if (id) setSelectedAssetId(id);
    else setSelectedAssetId(null);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, setRole }}>
      <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-sans overflow-x-hidden selection:bg-yellow-500/30" dir="rtl">
        <Navbar 
          onNavigate={(p) => navigateTo(p)} 
          currentPage={page}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {page === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Home onAssetClick={(id) => navigateTo('asset', id)} />
              </motion.div>
            )}
            
            {page === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Dashboard />
              </motion.div>
            )}

            {page === 'asset' && selectedAssetId && (
              <motion.div
                key="asset"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <AssetDetails id={selectedAssetId} onBack={() => navigateTo('home')} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="bg-[#0A0A0A] border-t border-white/10 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">عتاد (ATAD)</h2>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              المنصة المفضلة لتأجير المعدات في المملكة العربية السعودية. جودة، ثقة، وسرعة في الإنجاز.
            </p>
            <div className="flex justify-center space-x-6 space-x-reverse text-sm text-white/40">
              <a href="#" className="hover:text-yellow-500 transition-colors">عن عتاد</a>
              <a href="#" className="hover:text-yellow-500 transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-yellow-500 transition-colors">شروط الاستخدام</a>
              <a href="#" className="hover:text-yellow-500 transition-colors">اتصل بنا</a>
            </div>
          </div>
        </footer>
      </div>
    </AuthContext.Provider>
  );
}
