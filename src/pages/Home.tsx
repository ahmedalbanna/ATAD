import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { EquipmentAsset } from '../types';
import { useAuth } from '../App';
import { Search, MapPin, Tag, ChevronRight, Construction, Truck, HardHat, Pickaxe, Filter, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isWithinInterval, parseISO } from 'date-fns';

interface HomeProps {
  onAssetClick: (id: string) => void;
}

export function Home({ onAssetClick }: HomeProps) {
  const { user, profile, setRole } = useAuth();
  const [assets, setAssets] = useState<EquipmentAsset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [locationStr, setLocationStr] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const q = query(collection(db, 'assets'), where('status', '==', 'available'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentAsset));
        setAssets(data);
      } catch (err) {
        console.error("Error fetching assets", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const categories = [
    { id: 'heavy', label: 'معدات ثقيلة', icon: Construction },
    { id: 'transport', label: 'نقل وشحن', icon: Truck },
    { id: 'manual', label: 'أدوات يدوية', icon: Pickaxe },
    { id: 'safety', label: 'معدات سلامة', icon: HardHat },
  ];

  const filteredAssets = useMemo(() => {
    let result = assets.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || (a.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchLoc = !locationStr || a.location.toLowerCase().includes(locationStr.toLowerCase());
      const matchCat = !category || a.category === category;
      const matchMin = minPrice === '' || a.dailyRate >= minPrice;
      const matchMax = maxPrice === '' || a.dailyRate <= maxPrice;
      return matchSearch && matchLoc && matchCat && matchMin && matchMax;
    });

    if (sortBy === 'price_asc') result.sort((a, b) => a.dailyRate - b.dailyRate);
    else if (sortBy === 'price_desc') result.sort((a, b) => b.dailyRate - a.dailyRate);
    else if (sortBy === 'rating') result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

    return result;
  }, [assets, debouncedSearch, locationStr, category, minPrice, maxPrice, sortBy]);

  if (user && !profile) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 bg-[#141414] rounded-3xl border border-white/10 text-center">
        <h2 className="text-3xl font-black text-white mb-4">أهلاً بك في عتاد</h2>
        <p className="text-white/50 mb-8">يرجى اختيار نوع حسابك للمتابعة</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setRole('renter')}
            className="p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-yellow-500 hover:bg-yellow-500/10 transition-all group"
          >
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-yellow-500 group-hover:border-yellow-500">
              <Truck className="text-white/50 group-hover:text-black" />
            </div>
            <span className="font-bold text-white">مستأجر</span>
            <p className="text-xs text-white/40 mt-2">أريد استئجار معدات</p>
          </button>
          <button
            onClick={() => setRole('lender')}
            className="p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-yellow-500 hover:bg-yellow-500/10 transition-all group"
          >
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-yellow-500 group-hover:border-yellow-500">
              <Construction className="text-white/50 group-hover:text-black" />
            </div>
            <span className="font-bold text-white">مؤجر</span>
            <p className="text-xs text-white/40 mt-2">أريد تأجير معداتي</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative h-[500px] rounded-[40px] overflow-hidden bg-[#0F0F0F] flex items-center px-12 border border-white/5">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1541625602330-2277d34d8fa0?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Background"
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A]/90 via-[#0A0A0A]/60 to-transparent"></div>
        <div className="relative z-10 max-w-2xl text-white space-y-6">
          <motion.h1 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-black leading-tight"
          >
            ابدأ مشروعك مع <span className="text-yellow-500">أفضل المعدات</span>
          </motion.h1>
          <p className="text-lg text-white/50 leading-relaxed font-light">
            نوفر لك منصة متكاملة للبحث عن وتأجير كافة أنواع المعدات والآلات الثقيلة في جميع أنحاء المملكة.
          </p>
          <div className="flex bg-[#141414] border border-white/10 rounded-2xl p-2 items-center w-full max-w-2xl focus-within:border-yellow-500/50 transition-colors relative">
            <Search className="text-white/40 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="ابحث عن جرار، رافعة، أو معدات ثقيلة..."
              className="flex-1 bg-transparent text-white px-2 py-3 focus:outline-none placeholder:text-white/30"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="w-px h-8 bg-white/10 mx-2 hidden sm:block"></div>
            <input 
              type="text" 
              placeholder="الموقع..."
              className="w-32 bg-transparent text-white px-2 py-3 focus:outline-none placeholder:text-white/30 hidden sm:block"
              value={locationStr}
              onChange={(e) => setLocationStr(e.target.value)}
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="w-12 h-12 flex items-center justify-center text-white/50 hover:text-yellow-500 hover:bg-white/5 rounded-xl transition-colors ml-2"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {filteredAssets.length === 0 && search !== '' && (
               <div className="absolute top-full left-0 right-0 mt-2 text-center text-red-500 text-sm bg-red-500/10 border border-red-500/20 py-3 rounded-xl backdrop-blur-md">
                  لا توجد نتائج لـ "{search}"
               </div>
            )}
          </div>
          
          <AnimatePresence>
             {showFilters && (
                <motion.div 
                   initial={{ opacity: 0, y: -10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="bg-[#141414] border border-white/10 p-6 rounded-3xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl"
                >
                   <div>
                      <label className="text-xs font-bold text-white/50 mb-2 block">السعر من (ر.س)</label>
                      <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')} placeholder="الحد الأدنى" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-500" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-white/50 mb-2 block">السعر إلى (ر.س)</label>
                      <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')} placeholder="الحد الأعلى" className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-500" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-white/50 mb-2 block">ترتيب حسب</label>
                      <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 focus:outline-none focus:border-yellow-500 appearance-none">
                        <option value="relevance">الأكثر صلة</option>
                        <option value="price_asc">السعر: الأقل إلى الأعلى</option>
                        <option value="price_desc">السعر: الأعلى إلى الأقل</option>
                        <option value="rating">الأعلى تقييماً</option>
                      </select>
                   </div>
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white">تصفح حسب الفئة</h2>
            <p className="text-white/40 mt-1">اختر نوع المعدات التي تبحث عنها</p>
          </div>
          {category && (
            <button 
              onClick={() => setCategory(null)}
              className="text-sm font-bold text-yellow-500 hover:underline"
            >
              عرض الكل
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-4
                ${category === cat.id 
                  ? 'border-yellow-500 bg-yellow-500/10' 
                  : 'border-white/10 bg-[#141414] hover:bg-white/5 hover:border-white/20'}`}
            >
              <div className={`p-4 rounded-xl ${category === cat.id ? 'bg-yellow-500/20' : 'bg-white/5'}`}>
                <cat.icon className={`w-6 h-6 ${category === cat.id ? 'text-yellow-500' : 'text-white/50'}`} />
              </div>
              <span className={`font-bold ${category === cat.id ? 'text-yellow-500' : 'text-white'}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Assets Grid */}
      <section className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-white">المعدات المتاحة</h2>
          <span className="text-sm text-white/40 font-medium">{filteredAssets.length} معدة متوفرة</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[400px] bg-white/5 animate-pulse rounded-3xl border border-white/10"></div>
            ))}
          </div>
        ) : filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <motion.div
                layout
                key={asset.id}
                onClick={() => onAssetClick(asset.id)}
                className="bg-[#141414] border border-white/10 rounded-2xl group cursor-pointer overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-56 overflow-hidden bg-white/5 border-b border-white/5">
                  <img 
                    src={asset.imageUrl || `https://picsum.photos/seed/${asset.id}/800/600`} 
                    alt={asset.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100 mix-blend-luminosity hover:mix-blend-normal"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 right-4 bg-[#0A0A0A]/80 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-yellow-500 shadow-sm">
                    {asset.category}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-yellow-500 transition-colors">{asset.name}</h3>
                      <div className="flex items-center text-white/40 text-sm mt-1 gap-1">
                        <MapPin className="w-3 h-3" />
                        {asset.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-end pt-4 mt-auto">
                    <div className="flex flex-col text-left">
                      <span className="text-xl font-bold text-yellow-500 leading-none">{asset.dailyRate}</span>
                      <span className="text-xs text-white/30 tracking-tight mt-1">ر.س / يوم</span>
                    </div>
                    <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-black group-hover:border-yellow-500 transition-all">
                      <ChevronRight className="w-5 h-5 -rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/20">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white/60">لا توجد معدات تناسب بحثك حالياً</h3>
            <p className="text-white/40 mt-2">جرّب البحث بكلمات أخرى أو اختر فئة مختلفة</p>
          </div>
        )}
      </section>

      {/* Trust Section */}
      <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-[40px] p-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-full text-sm font-bold shadow-sm">
            لماذا عتاد؟
          </div>
          <h2 className="text-4xl font-black text-white leading-tight">
            الثقة والأمان قبل كل شيء في <span className="text-yellow-500 border-b-2 border-yellow-500 pb-1">عتاد</span>
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/60">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              تغطية شاملة لكل مدن المملكة
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              عقود تأجير إلكترونية معتمدة
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              دعم فني وصيانة طوارئ
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              خيارات دفع مرنة
            </li>
          </ul>
        </div>
        <div className="w-full md:w-1/3">
          <div className="relative">
             <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full"></div>
             <img 
               src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070&auto=format&fit=crop" 
               alt="Professional Equipment"
               className="relative rounded-3xl border border-white/10 shadow-2xl h-80 w-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
               referrerPolicy="no-referrer"
             />
          </div>
        </div>
      </section>
    </div>
  );
}
