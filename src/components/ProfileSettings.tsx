import { useState } from 'react';
import { motion } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../App';
import { XCircle, Camera, Loader2, Save } from 'lucide-react';
import { updateProfile } from 'firebase/auth';

export function ProfileSettings({ onClose }: { onClose: () => void }) {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setLoading(true);
    try {
      if (user.displayName !== displayName || user.photoURL !== photoUrl) {
         await updateProfile(user, { displayName, photoURL: photoUrl });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        displayName,
        phoneNumber,
        photoUrl
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F0F0F] border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-center p-8 border-b border-white/10">
          <h3 className="text-2xl font-black text-white">إعدادات الحساب</h3>
          <button type="button" onClick={onClose} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white/40"><XCircle className="w-5 h-5" /></button>
        </div>
        
        <form onSubmit={handleSave} className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-center mb-6">
             <div className="relative group cursor-pointer">
                <img 
                  src={photoUrl || 'https://via.placeholder.com/150'} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full border-4 border-white/10 object-cover bg-[#141414]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="text-white w-6 h-6" />
                </div>
             </div>
          </div>
          
          <div className="space-y-2 relative">
             <label className="text-sm font-bold text-white/50">رابط صورة الملف الشخصي</label>
             <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} type="url" placeholder="https://" className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500" />
          </div>

          <div className="space-y-2 relative">
             <label className="text-sm font-bold text-white/50">الاسم</label>
             <input required value={displayName} onChange={e => setDisplayName(e.target.value)} type="text" className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500" />
          </div>
          
          <div className="space-y-2 relative">
             <label className="text-sm font-bold text-white/50">رقم الهاتف</label>
             <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} type="tel" placeholder="+966 5X XXX XXXX" className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-3 focus:outline-none focus:border-yellow-500 text-right" dir="ltr" />
          </div>

          <div className="pt-4">
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-400 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> حفظ التغييرات</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
