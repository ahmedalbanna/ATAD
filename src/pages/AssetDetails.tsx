import { useState, useEffect } from 'react';
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EquipmentAsset, RentalRequest, UserProfile, Review } from '../types';
import { useAuth } from '../App';
import { ArrowRight, MapPin, Calendar, Shield, CreditCard, ChevronLeft, Loader2, CheckCircle2, User, MessageCircle, Star, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addDays, differenceInDays } from 'date-fns';
import { notifyUser } from '../utils/notifications';

interface AssetDetailsProps {
  id: string;
  onBack: () => void;
  onNavigate?: (page: 'home' | 'dashboard' | 'asset') => void;
}

export function AssetDetails({ id, onBack, onNavigate }: AssetDetailsProps) {
  const { user, profile } = useAuth();
  const [asset, setAsset] = useState<EquipmentAsset | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  
  // Booking dates
  const [startDate, setStartDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const docRef = doc(db, 'assets', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const assetData = { id: snapshot.id, ...snapshot.data() } as EquipmentAsset;
          setAsset(assetData);
          
          // Fetch Owner
          const ownerDoc = await getDoc(doc(db, 'users', assetData.lenderId));
          if (ownerDoc.exists()) {
             setOwner({ uid: ownerDoc.id, ...ownerDoc.data() } as UserProfile);
          }
          
          // Fetch Reviews
          const reviewsSnapshot = await getDocs(query(collection(db, 'reviews'), where('assetId', '==', snapshot.id)));
          setReviews(reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));

        }
      } catch (err) {
        console.error("Error fetching asset", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [id]);

  const days = differenceInDays(new Date(endDate), new Date(startDate)) || 1;
  const totalPrice = asset ? asset.dailyRate * days : 0;

  const handleBooking = async () => {
    if (!user || !profile || !asset) return;
    
    setBooking(true);
    try {
      const rental: Partial<RentalRequest> = {
        assetId: asset.id,
        renterId: user.uid,
        lenderId: asset.lenderId,
        startDate: startDate,
        endDate: endDate,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'rentals'), rental);
      
      // Notify lender
      await notifyUser(
         asset.lenderId,
         'طلب استئجار جديد',
         `قام ${user.displayName} بطلب استئجار معدتك "${asset.name}". يرجى مراجعة الطلب.`,
         'rental_request'
      );

      setBooked(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'rentals');
    } finally {
      setBooking(false);
    }
  };

  const handleShare = async () => {
    const shareText = `شاهد ${asset?.name} على منصة عتاد: ${window.location.href}`;
    if (navigator.clipboard) {
       await navigator.clipboard.writeText(shareText);
       alert('تم نسخ الرابط بنجاح!');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!asset) return <div className="text-center py-20 text-white/50">Asset not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-white/50 hover:text-yellow-500 transition-colors font-bold"
      >
        <ArrowRight className="w-5 h-5" />
        العودة للرئيسية
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Images & Description */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[40px] overflow-hidden bg-white/5 border border-white/10 h-[500px]"
          >
            <img 
              src={asset.imageUrl || `https://picsum.photos/seed/${asset.id}/1200/800`} 
              alt={asset.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-white">{asset.name}</h1>
                <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 transition-colors shrink-0" title="مشاركة">
                   <Share2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center text-white/40 mt-2 gap-2">
                  <MapPin className="w-4 h-4" />
                  {asset.location}
                </div>
              </div>
              <div className="bg-yellow-500/10 text-yellow-500 px-4 py-2 rounded-xl font-bold text-sm">
                {asset.category}
              </div>
            </div>

            <div className="prose prose-lg text-white/60 max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap">{asset.description || 'لا يوجد وصف متاح لهذه المعدة حالياً.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-3 bg-white/10 rounded-xl shadow-sm">
                  <Shield className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">صيانة مضمونة</h4>
                  <p className="text-xs text-white/50 mt-1">نضمن فحص المعدة دورياً لضمان كفاءتها</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-3 bg-white/10 rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-white">حجز فوري</h4>
                  <p className="text-xs text-white/50 mt-1">احجز معداتك الآن واحصل على تأكيد خلال دقائق</p>
                </div>
              </div>
            </div>
            
            {/* Owner Section */}
            {owner && (
               <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     {owner.photoUrl ? (
                         <img src={owner.photoUrl} alt="Owner" className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                     ) : (
                         <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <User className="w-6 h-6 text-white/40" />
                         </div>
                     )}
                     <div>
                        <p className="text-sm font-bold text-white mb-1">مقدمة بواسطة</p>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-yellow-500 tracking-tight">{owner.displayName}</h4>
                          {reviews.length > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs font-bold text-yellow-500">
                                {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                  <a href={`mailto:${owner.email}?subject=استفسار بخصوص معدة: ${asset.name}`} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white flex items-center gap-2 font-medium">
                     <MessageCircle className="w-5 h-5" />
                     تواصل
                  </a>
               </div>
            )}
            
            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="pt-6 border-t border-white/10 space-y-6">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   التقييمات 
                   <span className="text-sm font-light bg-white/10 px-2 py-0.5 rounded-full">{reviews.length}</span>
                 </h3>
                 <div className="grid grid-cols-1 gap-4">
                    {reviews.map(review => (
                      <div key={review.id} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-white/20'}`} />
                           ))}
                        </div>
                        <p className="text-sm text-white/80">{review.comment}</p>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Booking Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-[#141414] p-8 rounded-[32px] border border-white/10 space-y-6">
            <div className="flex justify-between items-end pb-6 border-b border-white/10">
              <div>
                <p className="text-sm text-white/40 font-medium">سعر الإيجار اليومي</p>
                <div className="flex items-end gap-1">
                  <h3 className="text-3xl font-black text-yellow-500">{asset.dailyRate}</h3>
                  <span className="text-sm text-white/30 tracking-tight pb-1">ر.س</span>
                </div>
              </div>
            </div>

            {booked ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-white">تم إرسال طلبك بنجاح!</h4>
                <p className="text-sm text-white/50">سيقوم صاحب المعدة بمراجعة طلبك والرد عليك قريباً.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => onNavigate && onNavigate('dashboard')}
                    className="flex-1 py-4 text-black font-bold bg-yellow-500 rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10"
                  >
                    لوحة التحكم
                  </button>
                  <button 
                    onClick={() => onBack()}
                    className="flex-1 py-4 text-white font-bold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    الرئيسية
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/50">من تاريخ</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-white/50">إلى تاريخ</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{asset.dailyRate} ر.س × {days} أيام</span>
                    <span>{totalPrice} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/60">
                    <span>رسوم المنصة (مجانات حالياً)</span>
                    <span>0 ر.س</span>
                  </div>
                  <div className="flex justify-between font-black text-white pt-3 border-t border-white/10">
                    <span>الإجمالي</span>
                    <span className="text-yellow-500">{totalPrice} ر.س</span>
                  </div>
                </div>

                {user ? (
                  profile?.role === 'renter' ? (
                    <button 
                      onClick={handleBooking}
                      disabled={booking}
                      className="w-full bg-yellow-500 text-black py-4 rounded-xl font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {booking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          طلب تأجير
                          <CreditCard className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold">
                      يجب أن تكون مسجلاً كمستأجر لطلب المعدات
                    </div>
                  )
                ) : (
                  <p className="text-center text-sm text-white/40 pt-2 font-medium border-t border-white/10">سجل دخولك لتتمكن من حجز المعدات</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
