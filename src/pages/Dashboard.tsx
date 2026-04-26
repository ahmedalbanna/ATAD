import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EquipmentAsset, RentalRequest } from '../types';
import { useAuth } from '../App';
import { Plus, Package, Clock, CheckCircle, XCircle, MapPin, Search, Loader2, Camera, User, ExternalLink, CreditCard, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { notifyUser } from '../utils/notifications';
import { format, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';

export function Dashboard() {
  const { user, profile } = useAuth();
  const [assets, setAssets] = useState<EquipmentAsset[]>([]);
  const [rentals, setRentals] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [editingAsset, setEditingAsset] = useState<EquipmentAsset | null>(null);
  const [tab, setTab] = useState<'overview' | 'assets' | 'rentals' | 'calendar'>('overview');

  useEffect(() => {
    if (!user || !profile) return;

    let qAssets = query(collection(db, 'assets'), where('lenderId', '==', user.uid));
    let qRentals = profile.role === 'lender' 
      ? query(collection(db, 'rentals'), where('lenderId', '==', user.uid))
      : query(collection(db, 'rentals'), where('renterId', '==', user.uid));

    if (profile.role === 'admin') {
      qAssets = query(collection(db, 'assets'));
      qRentals = query(collection(db, 'rentals'));
    }

    const unsubAssets = onSnapshot(qAssets, (snap) => {
      setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as EquipmentAsset)));
    });

    const unsubRentals = onSnapshot(qRentals, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as RentalRequest));
      setRentals(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });

    return () => {
      unsubAssets();
      unsubRentals();
    };
  }, [user, profile]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-yellow-500 w-10 h-10" /></div>;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white">أهلاً، {user?.displayName}</h1>
          <p className="text-white/50">تابع نشاطك وطلباتك من هنا</p>
        </div>
        {profile?.role === 'lender' && (
          <button 
            onClick={() => setIsAddingAsset(true)}
            className="bg-yellow-500 text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10"
          >
            <Plus className="w-5 h-5" />
            إضافة معدة
          </button>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><Package /></div>
            <div>
              <p className="text-xs text-white/50 font-bold">إجمالي المعدات</p>
              <h4 className="text-2xl font-black text-white">{assets.length}</h4>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><Clock /></div>
            <div>
              <p className="text-xs text-white/50 font-bold">طلبات قيد المراجعة</p>
              <h4 className="text-2xl font-black text-white">{rentals.filter(r => r.status === 'pending').length}</h4>
            </div>
          </div>
        </div>
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-2xl text-green-500"><CheckCircle /></div>
            <div>
              <p className="text-xs text-white/50 font-bold">طلبات مكتملة</p>
              <h4 className="text-2xl font-black text-white">{rentals.filter(r => r.status === 'completed').length}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-2">
        <button 
          onClick={() => setTab('overview')}
          className={`px-6 py-2 font-bold transition-all border-b-2 ${tab === 'overview' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-white/40 hover:text-white/60'}`}
        >
          نظرة عامة
        </button>
        {profile?.role === 'lender' && (
          <button 
            onClick={() => setTab('assets')}
            className={`px-6 py-2 font-bold transition-all border-b-2 ${tab === 'assets' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            معداتي
          </button>
        )}
        <button 
          onClick={() => setTab('rentals')}
          className={`px-6 py-2 font-bold transition-all border-b-2 ${tab === 'rentals' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-white/40 hover:text-white/60'}`}
        >
          {profile?.role === 'lender' ? 'الطلبات الواردة' : 'طلباتي'}
        </button>
        {profile?.role === 'lender' && (
          <button 
            onClick={() => setTab('calendar')}
            className={`px-6 py-2 font-bold transition-all border-b-2 ${tab === 'calendar' ? 'border-yellow-500 text-yellow-500' : 'border-transparent text-white/40 hover:text-white/60'}`}
          >
            التقويم
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            <h3 className="text-xl font-bold text-white">آخر النشاطات</h3>
            {rentals.slice(0, 5).map(rental => (
              <RentalItem key={rental.id} rental={rental} role={profile?.role!} />
            ))}
            {rentals.length === 0 && <p className="text-center py-10 bg-[#141414] border border-white/5 rounded-3xl text-white/40">لا يوجد نشاط مسجل حتى الآن</p>}
          </motion.div>
        )}

        {tab === 'assets' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assets.map(asset => (
              <div key={asset.id} className="bg-[#141414] p-4 rounded-3xl border border-white/10 flex gap-4 relative group">
                <img src={asset.imageUrl || `https://picsum.photos/seed/${asset.id}/200`} className="w-24 h-24 rounded-2xl object-cover grayscale opacity-80" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <h4 className="font-bold text-white">{asset.name}</h4>
                  <p className="text-xs text-white/40">{asset.category} • {asset.location}</p>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm font-black text-yellow-500">{asset.dailyRate} ر.س/يوم</span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${asset.status === 'available' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                      {asset.status === 'available' ? 'متاح' : 'مؤجر'}
                    </span>
                  </div>
                </div>
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setEditingAsset(asset)} className="p-2 bg-black/50 text-white rounded-full hover:bg-white/10" title="تعديل"><Edit className="w-4 h-4" /></button>
                   {asset.status === 'available' && (
                     <button onClick={async () => {
                       if (confirm('هل أنت متأكد من حذف هذه المعدة؟')) {
                         try {
                           await deleteDoc(doc(db, 'assets', asset.id));
                           setAssets(assets.filter(a => a.id !== asset.id));
                         } catch (err) {
                           handleFirestoreError(err, OperationType.DELETE, `assets/${asset.id}`);
                         }
                       }
                     }} className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-500" title="حذف">
                        <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {tab === 'rentals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {rentals.map(rental => (
              <RentalItem key={rental.id} rental={rental} role={profile?.role!} isDetail />
            ))}
          </motion.div>
        )}

        {tab === 'calendar' && profile?.role === 'lender' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-[#141414] p-6 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">المعدات المحجوزة والمتاحة</h3>
            <div className="space-y-4 overflow-x-auto pb-4">
              <div className="min-w-[800px]">
                 {/* Calendar Header: Next 14 days */}
                 <div className="flex border-b border-white/10 pb-2 mb-4">
                   <div className="w-48 shrink-0 text-white/50 text-sm font-bold">المعدة</div>
                   {[...Array(14)].map((_, i) => {
                      const d = addDays(new Date(), i);
                      return (
                         <div key={i} className="flex-1 text-center text-xs text-white/50 font-bold border-r border-white/5">
                           {format(d, 'MMM d')}
                         </div>
                      );
                   })}
                 </div>

                 {/* Assets Rows */}
                 {assets.map(asset => {
                    const rowRentals = rentals.filter(r => r.assetId === asset.id && r.status !== 'cancelled' && r.status !== 'rejected');
                    return (
                      <div key={asset.id} className="flex items-center mb-4 border-b border-white/5 pb-4">
                         <div className="w-48 shrink-0 flex items-center gap-2 pr-2">
                           <img src={asset.imageUrl || `https://picsum.photos/seed/${asset.id}/50`} className="w-8 h-8 rounded-lg object-cover grayscale opacity-80" referrerPolicy="no-referrer" />
                           <span className="text-sm text-white font-bold truncate" title={asset.name}>{asset.name}</span>
                         </div>
                         {[...Array(14)].map((_, i) => {
                            const currentDay = addDays(new Date(), i);
                            const isBooked = rowRentals.some(r => {
                               const start = new Date(r.startDate!);
                               const end = new Date(r.endDate!);
                               return currentDay >= start && currentDay <= end;
                            });

                            return (
                               <div key={i} className={`flex-1 h-8 border-r border-white/5 mx-0.5 rounded ${isBooked ? 'bg-red-500/20 shadow-inner' : 'bg-green-500/5'}`} title={isBooked ? 'محجوز' : 'متاح'}></div>
                            );
                         })}
                      </div>
                    );
                 })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Form Modal */}
      <AnimatePresence>
        {(isAddingAsset || editingAsset) && (
          <AssetForm 
            asset={editingAsset}
            onClose={() => {
              setIsAddingAsset(false);
              setEditingAsset(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RentalItem({ rental, role, isDetail }: { rental: RentalRequest, role: string, isDetail?: boolean }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const updateStatus = async (newStatus: string) => {
    setLoadingAction(newStatus);
    try {
      await updateDoc(doc(db, 'rentals', rental.id), { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });

      // Send notification based on the new status
      const recipientId = role === 'lender' ? rental.renterId : rental.lenderId;
      let title = '';
      let message = '';
      
      switch (newStatus) {
        case 'approved':
          title = 'تمت الموافقة على طلبك';
          message = `تمت الموافقة على طلب استئجارك برقم #${rental.id.slice(0, 8)}. يمكنك الآن دفع الرسوم.`;
          break;
        case 'rejected':
           title = 'تم رفض طلبك';
           message = `تم رفض طلب استئجارك برقم #${rental.id.slice(0, 8)}.`;
           break;
        case 'paid':
           title = 'تم الاستلام';
           message = `قام المستأجر بدفع رسوم الطلب #${rental.id.slice(0, 8)}.`;
           break;
        case 'completed':
           title = 'اكتمل الطلب';
           message = `تم اكتمال الطلب #${rental.id.slice(0, 8)}. شكراً لك!`;
           break;
        case 'cancelled':
           title = 'تم إلغاء الطلب';
           message = `تم إلغاء الطلب #${rental.id.slice(0, 8)} من قبل الطرف الآخر.`;
           break;
      }

      if (title) {
        await notifyUser(recipientId, title, message, 'rental_update');
      }

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `rentals/${rental.id}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const statusMap: any = {
    pending: { label: 'قيد المراجعة', color: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20', icon: Clock },
    approved: { label: 'موافق عليه', color: 'bg-blue-500/10 text-blue-500 border border-blue-500/20', icon: CheckCircle },
    rejected: { label: 'مرفوض', color: 'bg-red-500/10 text-red-500 border border-red-500/20', icon: XCircle },
    paid: { label: 'مدفوع', color: 'bg-green-500/10 text-green-500 border border-green-500/20', icon: CreditCard },
    completed: { label: 'مكتمل', color: 'bg-white/5 text-white/60 border border-white/10', icon: CheckCircle },
    cancelled: { label: 'ملغي', color: 'bg-white/5 text-white/40 border border-white/10', icon: XCircle },
  };

  const s = statusMap[rental.status];

  const handleReview = async () => {
    const rating = prompt('قيّم من 1 إلى 5:');
    if (!rating || isNaN(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) return alert('تقييم غير صحيح');
    const comment = prompt('اكتب تعليقك:');
    if (!comment) return alert('التعليق مطلوب');

    setLoadingAction('review');
    try {
      await addDoc(collection(db, 'reviews'), {
         assetId: rental.assetId,
         reviewerId: role === 'lender' ? rental.lenderId : rental.renterId,
         lenderId: rental.lenderId,
         rating: Number(rating),
         comment,
         rentalId: rental.id,
         createdAt: serverTimestamp()
      });
      alert('تم إرسال التقييم بنجاح!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'reviews');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="bg-[#141414] p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/5 transition-all">
      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className={`p-4 rounded-2xl ${s.color}`}>
          <s.icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-white">طلب رقم #{rental.id.slice(0, 8)}</h4>
          <p className="text-xs text-white/50 mt-1">
            {rental.startDate} • {rental.endDate} • {rental.totalPrice} ر.س
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${s.color}`}>
          {s.label}
        </div>

        {isDetail && (
          <div className="flex gap-2">
            {role === 'lender' && rental.status === 'pending' && (
              <>
                <button 
                  onClick={() => updateStatus('approved')}
                  disabled={!!loadingAction}
                  className="p-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl hover:bg-green-500/20 disabled:opacity-50"
                  title="موافقة"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => updateStatus('rejected')}
                  disabled={!!loadingAction}
                  className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-50"
                  title="رفض"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            )}
            {role === 'renter' && rental.status === 'approved' && (
              <button 
                onClick={() => updateStatus('paid')}
                disabled={!!loadingAction}
                className="bg-yellow-500 text-black px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-yellow-400"
              >
                دفع الرسوم
              </button>
            )}
            {role === 'lender' && rental.status === 'paid' && (
              <button 
                onClick={() => updateStatus('completed')}
                disabled={!!loadingAction}
                className="bg-white/10 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20"
              >
                إكمال الطلب
              </button>
            )}
            {rental.status === 'completed' && (
              <button 
                onClick={handleReview}
                disabled={!!loadingAction}
                className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-500/20"
              >
                تقييم
              </button>
            )}
            {role === 'renter' && (rental.status === 'pending' || rental.status === 'approved') && (
               <button 
                 onClick={() => {
                   if (confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
                     updateStatus('cancelled');
                   }
                 }}
                 disabled={!!loadingAction}
                 className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-500/20"
               >
                 إلغاء الطلب
               </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetForm({ onClose, asset }: { onClose: () => void, asset?: EquipmentAsset | null }) {
  const { user } = useAuth();
  const [name, setName] = useState(asset?.name || '');
  const [description, setDescription] = useState(asset?.description || '');
  const [category, setCategory] = useState(asset?.category || 'heavy');
  const [dailyRate, setDailyRate] = useState(asset?.dailyRate?.toString() || '');
  const [location, setLocation] = useState(asset?.location || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const data = {
        name,
        description,
        category,
        dailyRate: Number(dailyRate),
        location,
        lenderId: asset ? asset.lenderId : user.uid,
        status: asset ? asset.status : 'available',
      };

      if (asset) {
        await updateDoc(doc(db, 'assets', asset.id), data);
      } else {
        await addDoc(collection(db, 'assets'), {
          ...data,
          imageUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, asset ? OperationType.UPDATE : OperationType.CREATE, asset ? `assets/${asset.id}` : 'assets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0F0F0F] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-white">{asset ? 'تعديل المعدة' : 'إضافة معدة جديدة'}</h3>
            <button type="button" onClick={onClose} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10"><XCircle className="w-5 h-5 text-white/40" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-white/50">اسم المعدة</label>
              <input required value={name} onChange={e => setName(e.target.value)} type="text" placeholder="مثلاً: رافعة شوكية تويوتا 2023" className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-4 focus:outline-none focus:border-yellow-500" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/50">الفئة</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-[#141414] border border-white/10 text-white rounded-2xl px-4 py-4 focus:outline-none focus:border-yellow-500">
                <option value="heavy">معدات ثقيلة</option>
                <option value="transport">نقل وشحن</option>
                <option value="manual">أدوات يدوية</option>
                <option value="safety">معدات سلامة</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/50">السعر اليومي (ر.س)</label>
              <input required value={dailyRate} onChange={e => setDailyRate(e.target.value)} type="number" placeholder="0" className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-4 focus:outline-none focus:border-yellow-500" />
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-white/50">الموقع</label>
              <div className="relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 w-5 h-5" />
                <input required value={location} onChange={e => setLocation(e.target.value)} type="text" placeholder="الرياض، جدة، الشرقية..." className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl pr-12 pl-4 py-4 focus:outline-none focus:border-yellow-500" />
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-bold text-white/50">الوصف</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="اكتب تفاصيل المعدة، حالتها، وأي ملاحظات هامة..." className="w-full bg-[#141414] border border-white/10 text-white placeholder:text-white/20 rounded-2xl px-4 py-4 focus:outline-none focus:border-yellow-500"></textarea>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-500 text-black py-5 rounded-2xl font-black text-lg hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'تأكيد الإضافة'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
