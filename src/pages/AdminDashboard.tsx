import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, EquipmentAsset, RentalRequest } from '../types';
import { Users, Package, ShoppingCart, Trash2, ShieldAlert, CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

export function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, assets: 0, rentals: 0 });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [assets, setAssets] = useState<EquipmentAsset[]>([]);
  const [rentals, setRentals] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'assets' | 'rentals'>('stats');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(d => ({ ...d.data() } as UserProfile)));
      setStats(prev => ({ ...prev, users: snap.size }));
    });
    const unsubAssets = onSnapshot(collection(db, 'assets'), (snap) => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as EquipmentAsset)));
      setStats(prev => ({ ...prev, assets: snap.size }));
    });
    const unsubRentals = onSnapshot(query(collection(db, 'rentals'), orderBy('createdAt', 'desc')), (snap) => {
      setRentals(snap.docs.map(d => ({ id: d.id, ...d.data() } as RentalRequest)));
      setStats(prev => ({ ...prev, rentals: snap.size }));
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubAssets();
      unsubRentals();
    };
  }, []);

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعدة؟')) return;
    try {
      await deleteDoc(doc(db, 'assets', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `assets/${id}`);
    }
  };

  const handleUpdateRentalStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'rentals', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rentals/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  const filteredUsers = users.filter(u => u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAssets = assets.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.category.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRentals = rentals.filter(r => r.id.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-[#141414] p-6 rounded-3xl border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">لوحة الإدارة</h1>
          <p className="text-white/40 mt-1">مرحباً بك في لوحة تحكم عتاد العامة</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-[#0A0A0A] border border-white/5 p-1 rounded-2xl">
            <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}>الإحصائيات</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}>المستخدمين</button>
            <button onClick={() => setActiveTab('assets')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'assets' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}>الأصول</button>
            <button onClick={() => setActiveTab('rentals')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'rentals' ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'text-white/40 hover:text-white'}`}>الطلبات</button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141414] p-8 rounded-3xl border border-white/10 text-center hover:border-yellow-500/30 transition-colors">
              <Users className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
              <div className="text-4xl font-black text-white mb-1">{stats.users}</div>
              <div className="text-white/40 text-sm font-bold uppercase tracking-widest">إجمالي المستخدمين</div>
            </div>
            <div className="bg-[#141414] p-8 rounded-3xl border border-white/10 text-center hover:border-blue-500/30 transition-colors">
              <Package className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <div className="text-4xl font-black text-white mb-1">{stats.assets}</div>
              <div className="text-white/40 text-sm font-bold uppercase tracking-widest">إجمالي الأصول</div>
            </div>
            <div className="bg-[#141414] p-8 rounded-3xl border border-white/10 text-center hover:border-green-500/30 transition-colors">
              <ShoppingCart className="w-10 h-10 text-green-500 mx-auto mb-4" />
              <div className="text-4xl font-black text-white mb-1">{stats.rentals}</div>
              <div className="text-white/40 text-sm font-bold uppercase tracking-widest">إجمالي الطلبات</div>
            </div>
          </motion.div>
        )}

        {activeTab !== 'stats' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
              <input 
                type="text" 
                placeholder="بحث سريع..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-12 py-4 focus:outline-none focus:border-yellow-500 transition-all font-medium"
              />
            </div>

            {activeTab === 'users' && (
              <div className="bg-[#141414] rounded-3xl border border-white/10 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-white/40 font-bold text-sm">المستخدم</th>
                      <th className="p-4 text-white/40 font-bold text-sm">الدور</th>
                      <th className="p-4 text-white/40 font-bold text-sm">التاريخ</th>
                      <th className="p-4 text-white/40 font-bold text-sm text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-white overflow-hidden">
                              {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover" /> : user.displayName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-white">{user.displayName}</div>
                              <div className="text-xs text-white/40">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'lender' ? 'bg-blue-500/10 text-blue-500' : user.role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                            {user.role === 'lender' ? 'مؤجر' : user.role === 'admin' ? 'أدمن' : 'مستأجر'}
                          </span>
                        </td>
                        <td className="p-4 text-white/40 text-sm">
                          {user.createdAt?.seconds ? format(new Date(user.createdAt.seconds * 1000), 'MMM d, yyyy') : '-'}
                        </td>
                        <td className="p-4 text-left">
                          <button onClick={() => handleDeleteUser(user.uid)} className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="bg-[#141414] rounded-3xl border border-white/10 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-white/40 font-bold text-sm">المعدة</th>
                      <th className="p-4 text-white/40 font-bold text-sm">التصنيف</th>
                      <th className="p-4 text-white/40 font-bold text-sm">السعر</th>
                      <th className="p-4 text-white/40 font-bold text-sm text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map(asset => (
                      <tr key={asset.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={asset.imageUrl} className="w-10 h-10 rounded-lg object-cover grayscale opacity-80" />
                            <div className="font-bold text-white">{asset.name}</div>
                          </div>
                        </td>
                        <td className="p-4 text-white/40 text-sm">{asset.category}</td>
                        <td className="p-4 font-bold text-white">{asset.dailyRate} ر.س / يوم</td>
                        <td className="p-4 text-left">
                          <button onClick={() => handleDeleteAsset(asset.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'rentals' && (
              <div className="bg-[#141414] rounded-3xl border border-white/10 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="p-4 text-white/40 font-bold text-sm">الطلب</th>
                      <th className="p-4 text-white/40 font-bold text-sm">السعر الإجمالي</th>
                      <th className="p-4 text-white/40 font-bold text-sm">الحالة</th>
                      <th className="p-4 text-white/40 font-bold text-sm text-left">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRentals.map(rental => (
                      <tr key={rental.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div className="font-bold text-white truncate w-32" title={rental.id}>#{rental.id.slice(0, 8)}</div>
                          <div className="text-xs text-white/40">{rental.startDate} - {rental.endDate}</div>
                        </td>
                        <td className="p-4 font-bold text-white">{rental.totalPrice} ر.س</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            rental.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                            rental.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                            rental.status === 'rejected' || rental.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {rental.status}
                          </span>
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100">
                             <button onClick={() => handleUpdateRentalStatus(rental.id, 'completed')} className="p-2 text-white/20 hover:text-green-500 transition-colors" title="إكمال"><CheckCircle className="w-4 h-4" /></button>
                             <button onClick={() => handleUpdateRentalStatus(rental.id, 'cancelled')} className="p-2 text-white/20 hover:text-red-500 transition-colors" title="إلغاء"><XCircle className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
