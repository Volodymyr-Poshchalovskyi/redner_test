import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Maximize2, X, ChevronLeft, ChevronRight, Check, BedDouble, Square, 
  ChevronDown, MapPin, Sun, Moon, ZoomIn, ZoomOut, Sparkles, Gem, Hammer,
  User, Mail, Phone, Send, Calendar, Heart, Scale, Share2, Trash2, Filter,
  PanelLeftClose, PanelLeftOpen, Monitor, Minimize, Info, ArrowLeft, ArrowDown, 
  ArrowUpRight, Printer, MessageSquare, Globe
} from 'lucide-react';
import jsonData from '../final_data.json'; 

// --- 0. LOCALIZATION DICTIONARY ---
const translations = {
  en: {
    title: "LUXE 1",
    subtitle: "Zürich, Switzerland",
    filters: "Filters",
    status: "Status",
    rooms: "Rooms",
    floor: "Floor",
    price: "Price",
    all: "All",
    available: "Available",
    sold: "Sold",
    favorites: "Favorites",
    compare: "Compare",
    print_list: "Print List",
    contact_support: "Contact Support",
    unit: "Unit",
    price_label: "Price",
    area: "Area",
    sold_out: "Sold Out",
    interior: "Interior Finish",
    raw: "Raw",
    standard: "Standard",
    premium: "Premium",
    desc: "Experience luxury living with breathtaking panoramic views.",
    request_viewing: "Request Private Viewing",
    welcome_title: "Welcome to LUXE 1",
    welcome_text: "Experience our premium residential complex in immersive 360°. Click on any unit to view details, compare layouts, and book a viewing.",
    start_exploring: "Start Exploring",
    support_title: "Contact Us",
    support_desc: "Have a question or found a bug? Let us know.",
    message_placeholder: "Type your message here...",
    send: "Send Message",
    name: "Full Name",
    email: "Email",
    phone: "Phone",
    compare_limit: "Compare Limit Reached",
    compare_text: "You can compare a maximum of 3 units.",
    got_it: "Got it",
    book_viewing: "Book a Viewing",
    interest_in: "Interest in",
    pdf_header: "Price List & Availability",
    thank_you: "Message sent! We will contact you soon.",
    // Tutorial Keys
    tut_sidebar: "Filters & Menu",
    tut_tools: "View Modes & Fullscreen",
    tut_nav: "360° Navigation"
  },
  de: {
    title: "LUXE 1",
    subtitle: "Zürich, Schweiz",
    filters: "Filter",
    status: "Status",
    rooms: "Zimmer",
    floor: "Etage",
    price: "Preis",
    all: "Alle",
    available: "Verfügbar",
    sold: "Verkauft",
    favorites: "Favoriten",
    compare: "Vergleich",
    print_list: "Liste Drucken",
    contact_support: "Kontakt aufnehmen",
    unit: "Einheit",
    price_label: "Preis",
    area: "Fläche",
    sold_out: "Verkauft",
    interior: "Innenausbau",
    raw: "Rohbau",
    standard: "Standard",
    premium: "Premium",
    desc: "Erleben Sie luxuriöses Wohnen mit atemberaubendem Panoramablick.",
    request_viewing: "Besichtigung anfragen",
    welcome_title: "Willkommen bei LUXE 1",
    welcome_text: "Erleben Sie unseren Premium-Wohnkomplex in immersivem 360°. Klicken Sie auf eine Einheit für Details, Vergleiche und Buchungen.",
    start_exploring: "Erkunden starten",
    support_title: "Kontaktieren Sie uns",
    support_desc: "Haben Sie Fragen oder einen Fehler gefunden?",
    message_placeholder: "Ihre Nachricht hier...",
    send: "Nachricht senden",
    name: "Vollständiger Name",
    email: "E-Mail",
    phone: "Telefon",
    compare_limit: "Vergleichslimit erreicht",
    compare_text: "Sie können maximal 3 Einheiten vergleichen.",
    got_it: "Verstanden",
    book_viewing: "Besichtigung buchen",
    interest_in: "Interesse an",
    pdf_header: "Preisliste & Verfügbarkeit",
    thank_you: "Nachricht gesendet! Wir melden uns bald.",
    // Tutorial Keys
    tut_sidebar: "Filter & Menü",
    tut_tools: "Ansichtsmodi & Vollbild",
    tut_nav: "360° Steuerung"
  }
};

// --- 1. MOCK DATA GENERATOR ---
const generateUnitData = (allFrames) => {
  const data = {};
  const allNamesSet = new Set();
  allFrames.forEach(frame => frame.objects.forEach(obj => allNamesSet.add(obj.name)));
  const uniqueNames = Array.from(allNamesSet).sort();
  
  uniqueNames.forEach((name, index) => {
    const rooms = index % 2 === 0 ? 3.5 : 4.5;
    const area = 120 + (index * 10);
    const basePrice = 850000 + (index * 45000);
    const isSold = index === 1 || index === 4; 
    
    data[name] = {
      id: name,
      title: name.toUpperCase().replace('_', ' '),
      basePrice: basePrice, 
      status: isSold ? 'sold' : 'available',
      rooms: rooms,
      area: area,
      floor: (index % 3) + 1,
      description_key: "desc"
    };
  });
  return data;
};

// --- CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ value, onChange, options, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative flex-1 min-w-[100px]" ref={selectRef}>
      {label && <span className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block tracking-wider">{label}</span>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-white border px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 
          ${isOpen ? 'border-slate-800 ring-1 ring-slate-800' : 'border-gray-200 hover:border-gray-300'}
        `}
      >
        <span className="truncate text-sm font-semibold text-slate-700">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-[150px] overflow-y-auto">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-slate-50 
                ${value === opt.value ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600'}
              `}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RealEstateViewer() {
  // --- STATE ---
  const [lang, setLang] = useState('en'); 
  const t = (key) => translations[lang][key] || key;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 }); 
  
  const [hoveredObjectName, setHoveredObjectName] = useState(null);
  const [selectedObjectName, setSelectedObjectName] = useState(null);
  
  // Modals
  const [showContactModal, setShowContactModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRooms, setFilterRooms] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterPrice, setFilterPrice] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Lists
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('luxe_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [compareList, setCompareList] = useState([]);

  // Visuals
  const [visualMode, setVisualMode] = useState('day'); 
  const [zoomLevel, setZoomLevel] = useState(1);
  const [finishPackage, setFinishPackage] = useState('standard'); 
  const [isCopied, setIsCopied] = useState(false);

  // --- Refs ---
  const flyIntervalRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0 });
  const wheelAccumulatorRef = useRef(0);
  
  const FOLDER_PATH = '/oblit'; 

  // --- DATA ---
  const allFramesData = useMemo(() => {
    return jsonData.map(frame => ({
      ...frame,
      objects: frame.objects.map(obj => ({
        ...obj,
        pointsString: obj.points.map(p => p.join(',')).join(' ')
      }))
    }));
  }, []);

  const unitsData = useMemo(() => {
    if (jsonData.length > 0) return generateUnitData(jsonData);
    return {};
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const hasSeen = localStorage.getItem('luxe_tutorial_seen_v2');
    if (!hasSeen) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('luxe_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // --- LOGIC ---
  const getVisualFilter = () => {
    switch (visualMode) {
      case 'night': return 'brightness(0.7) contrast(1.1) hue-rotate(200deg) saturate(1.1)';
      default: return 'none';
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    }
  };

  const startFlyover = () => {
    if (isFlying) return;
    setIsFlying(true);
    const totalDuration = 6000; 
    const delayPerFrame = totalDuration / allFramesData.length;
    if (flyIntervalRef.current) clearInterval(flyIntervalRef.current);
    flyIntervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allFramesData.length);
    }, delayPerFrame);
  };

  const stopFlyover = () => {
    if (flyIntervalRef.current) {
      clearInterval(flyIntervalRef.current);
      flyIntervalRef.current = null;
    }
    setIsFlying(false);
  };

  const manualChangeFrame = (direction) => {
    stopFlyover();
    setCurrentIndex((prev) => {
      return direction === 1 
        ? (prev + 1) % allFramesData.length 
        : (prev - 1 + allFramesData.length) % allFramesData.length;
    });
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current.isDragging = true;
    dragRef.current.startX = e.clientX;
    document.body.style.cursor = 'grabbing';
    stopFlyover(); 
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const x = e.clientX;
    const delta = x - dragRef.current.startX;
    const sensitivity = 8;
    if (Math.abs(delta) > sensitivity) {
      const direction = delta > 0 ? -1 : 1;
      setCurrentIndex((prev) => direction === 1 ? (prev + 1) % allFramesData.length : (prev - 1 + allFramesData.length) % allFramesData.length);
      dragRef.current.startX = x;
    }
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    document.body.style.cursor = 'default';
  };

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      stopFlyover();
      wheelAccumulatorRef.current += e.deltaX;
      if (Math.abs(wheelAccumulatorRef.current) > 30) {
        const direction = wheelAccumulatorRef.current > 0 ? -1 : 1;
        setCurrentIndex((prev) => direction === 1 ? (prev + 1) % allFramesData.length : (prev - 1 + allFramesData.length) % allFramesData.length);
        wheelAccumulatorRef.current = 0;
      }
    }
  };

  const handleImageLoad = (e) => {
    if (imageSize.w === 0 && e.target.naturalWidth > 0) {
      setImageSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') manualChangeFrame(-1);
      if (e.key === 'ArrowRight') manualChangeFrame(1);
      if (e.key === 'Escape') {
        if(showContactModal) setShowContactModal(false);
        else if(showCompareModal) setShowCompareModal(false);
        else if(showLimitModal) setShowLimitModal(false);
        else if(showFeedbackModal) setShowFeedbackModal(false);
        else setSelectedObjectName(null);
      }
      if (e.key === ' ' && !showContactModal && !showCompareModal && !showLimitModal && !showFeedbackModal) isFlying ? stopFlyover() : startFlyover();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isFlying, showContactModal, showCompareModal, showLimitModal, showFeedbackModal]);


  // --- APP LOGIC ---
  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCompare = (id) => {
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        setShowLimitModal(true);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getPrice = (basePrice) => {
    let multiplier = 0;
    if (finishPackage === 'raw') multiplier = -50000;
    if (finishPackage === 'premium') multiplier = 120000;
    const final = basePrice + multiplier;
    return `CHF ${final.toLocaleString()}`;
  };

  const isObjectVisibleInFilters = (name) => {
    const details = unitsData[name];
    if (!details) return false; 
    
    if (showFavoritesOnly && !favorites.includes(name)) return false;
    if (filterStatus !== 'all' && details.status !== filterStatus) return false;
    if (filterRooms !== 'all' && String(details.rooms) !== filterRooms) return false;
    if (filterFloor !== 'all' && String(details.floor) !== filterFloor) return false;
    if (filterPrice !== 'all') {
      const p = details.basePrice;
      if (filterPrice === 'low' && p > 900000) return false;
      if (filterPrice === 'mid' && (p < 900000 || p > 1000000)) return false;
      if (filterPrice === 'high' && p < 1000000) return false;
    }
    return true;
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-800 print:block print:bg-white print:h-auto print:overflow-visible">
      
      {/* --- PRINT ONLY VIEW --- */}
      <div className="hidden print:block p-8 bg-white text-black w-full">
        <div className="flex justify-between items-center mb-8 border-b-2 border-black pb-4">
          <div>
            <h1 className="text-4xl font-bold uppercase tracking-tighter">LUXE 1</h1>
            <p className="text-sm mt-1">Zürich, Switzerland</p>
          </div>
          <div className="text-right">
            <p className="font-bold">{t('pdf_header')}</p>
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2 text-sm font-bold uppercase">{t('unit')}</th>
              <th className="py-2 text-sm font-bold uppercase">{t('floor')}</th>
              <th className="py-2 text-sm font-bold uppercase">{t('rooms')}</th>
              <th className="py-2 text-sm font-bold uppercase">{t('area')}</th>
              <th className="py-2 text-sm font-bold uppercase">{t('status')}</th>
              <th className="py-2 text-sm font-bold uppercase text-right">{t('price_label')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(unitsData).map((u, i) => (
              <tr key={u.id} className="border-b border-gray-200">
                <td className="py-3 font-medium">{u.title}</td>
                <td className="py-3">{u.floor}</td>
                <td className="py-3">{u.rooms}</td>
                <td className="py-3">{u.area} m²</td>
                <td className="py-3 uppercase text-xs font-bold">{u.status === 'sold' ? t('sold') : t('available')}</td>
                <td className="py-3 text-right font-mono">{u.status === 'sold' ? '-' : `CHF ${u.basePrice.toLocaleString()}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- SIDEBAR (NO-PRINT) --- */}
      <div 
        className={`print:hidden absolute left-4 top-4 bottom-4 w-[400px] bg-white/90 backdrop-blur-xl z-40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/40 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] 
          ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}
        `}
      >
        
        {/* Sidebar Header */}
        <div className="p-6 pb-2">
          <div className="flex justify-between items-start mb-2">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl font-bold text-xl">L1</div>
                <div>
                   <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{t('title')}</h1>
                   <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{t('subtitle')}</span>
                </div>
             </div>
             
             {/* Toolbar */}
             <div className="flex gap-2">
                 <button onClick={() => setLang(l => l === 'en' ? 'de' : 'en')} className="p-3 hover:bg-slate-100 rounded-xl text-xs font-bold uppercase border border-transparent hover:border-slate-200 transition-all flex items-center gap-1.5">
                    <Globe size={18}/> {lang}
                 </button>
                 <button onClick={handlePrint} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors" title={t('print_list')}>
                    <Printer size={22} />
                 </button>
                 <button onClick={() => setShowFeedbackModal(true)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors" title={t('contact_support')}>
                    <MessageSquare size={22} />
                 </button>
                 <button onClick={() => setIsSidebarOpen(false)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-xl transition-colors" title="Close Sidebar">
                    <PanelLeftClose size={22} />
                 </button>
             </div>
          </div>
        </div>

        {/* Filters Area */}
        {!selectedObjectName && (
          <div className="px-6 py-4">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Filter size={12}/> {t('filters')}</h3>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                     className={`text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${showFavoritesOnly ? 'bg-red-500 text-white shadow-red-200 shadow-lg' : 'bg-slate-50 border text-slate-500 hover:bg-slate-100'}`}
                   >
                     <Heart size={12} className={showFavoritesOnly ? "fill-white" : ""} /> {t('favorites')}
                   </button>
                   <button 
                     onClick={() => setShowCompareModal(true)}
                     disabled={compareList.length === 0}
                     className={`text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${compareList.length > 0 ? 'bg-indigo-600 text-white shadow-indigo-200 shadow-lg' : 'bg-slate-50 border text-slate-500 opacity-50'}`}
                   >
                     <Scale size={12} /> {compareList.length}
                   </button>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <CustomSelect label={t('status')} value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: t('all') }, { value: 'available', label: t('available') }, { value: 'sold', label: t('sold') }]} />
                <CustomSelect label={t('rooms')} value={filterRooms} onChange={setFilterRooms} options={[{ value: 'all', label: t('all') }, { value: '3.5', label: t('3.5') }, { value: '4.5', label: t('4.5') }]} />
                <CustomSelect label={t('floor')} value={filterFloor} onChange={setFilterFloor} options={[{ value: 'all', label: t('all') }, { value: '1', label: t('1.') }, { value: '2', label: t('2.') }, { value: '3', label: t('3.') }]} />
                <CustomSelect label={t('price')} value={filterPrice} onChange={setFilterPrice} options={[{ value: 'all', label: t('all') }, { value: 'low', label: '< 900k' }, { value: 'mid', label: '900k-1M' }, { value: 'high', label: '> 1M' }]} />
             </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide mask-image-b">
          {selectedObjectName ? (
            // DETAIL VIEW
            <div className="animate-in slide-in-from-right-4 duration-500">
                {(() => {
                  const details = unitsData[selectedObjectName];
                  const isFav = favorites.includes(details.id);
                  return (
                    <div className="flex flex-col h-full">
                       <button onClick={() => setSelectedObjectName(null)} className="self-start mb-4 text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-slate-900 transition-colors py-2"><ArrowLeft size={14}/> {t('all')}</button>
                       
                       <div className="flex justify-between items-start mb-2">
                          <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${details.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                              {details.status === 'sold' ? t('sold_out') : t('available')}
                          </span>
                          <div className="flex gap-2">
                              <button onClick={() => toggleFavorite(details.id)} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-50 transition-colors">
                                <Heart size={18} className={isFav ? "fill-red-500 text-red-500" : "text-slate-400"} />
                              </button>
                              <button onClick={() => toggleCompare(details.id)} className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-slate-50 transition-colors">
                                <Scale size={18} className={compareList.includes(details.id) ? "text-indigo-600" : "text-slate-400"} />
                              </button>
                          </div>
                       </div>

                       <h2 className="text-4xl font-light text-slate-900 mb-1">{details.title}</h2>
                       <p className="text-2xl font-medium text-slate-800 mb-6">{details.status === 'sold' ? t('sold') : getPrice(details.basePrice)}</p>

                       {/* CONFIGURATOR */}
                       {details.status !== 'sold' && (
                          <div className="bg-slate-50 p-5 rounded-2xl mb-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('interior')}</p>
                            <div className="flex gap-3">
                              {['raw', 'standard', 'premium'].map(pkg => (
                                <button 
                                  key={pkg} onClick={() => setFinishPackage(pkg)}
                                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all border ${finishPackage === pkg ? 'bg-white border-slate-900 shadow-sm text-slate-900' : 'border-transparent text-slate-400 hover:bg-white hover:text-slate-600'}`}
                                >
                                  {t(pkg)}
                                </button>
                              ))}
                            </div>
                          </div>
                       )}

                       <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="p-4 border rounded-xl flex flex-col items-center justify-center text-center">
                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('area')}</span>
                             <span className="font-bold text-lg text-slate-900">{details.area} m²</span>
                          </div>
                          <div className="p-4 border rounded-xl flex flex-col items-center justify-center text-center">
                             <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{t('rooms')}</span>
                             <span className="font-bold text-lg text-slate-900">{details.rooms}</span>
                          </div>
                       </div>
                       
                       <p className="text-sm text-slate-500 leading-relaxed mb-8">{t('desc')}</p>

                       <button 
                         onClick={() => setShowContactModal(true)}
                         className="mt-auto w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2"
                       >
                         {t('request_viewing')} <ChevronRight size={16} />
                       </button>
                    </div>
                  );
                })()}
            </div>
          ) : (
            // LIST VIEW
            <div className="space-y-4 pt-2">
              {Object.values(unitsData).filter(u => isObjectVisibleInFilters(u.id)).map((unit, idx) => (
                  <div 
                    key={unit.id}
                    onClick={() => { stopFlyover(); setSelectedObjectName(unit.id); }}
                    onMouseEnter={() => setHoveredObjectName(unit.id)}
                    onMouseLeave={() => setHoveredObjectName(null)}
                    className="group relative p-5 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-slate-300 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold text-slate-800 text-base">{unit.title}</span>
                      {unit.status === 'sold' && <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-1 rounded">{t('sold')}</span>}
                    </div>
                    <div className="flex justify-between items-end">
                       <div className="flex gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5"><Square size={14}/> {unit.area}</span>
                          <span className="flex items-center gap-1.5"><BedDouble size={14}/> {unit.rooms}</span>
                       </div>
                       <span className="font-bold text-slate-900">{unit.status === 'sold' ? '-' : `CHF ${(unit.basePrice/1000000).toFixed(2)}M`}</span>
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- FLOATING CONTROLS --- */}
      
      <button 
          onClick={() => setIsSidebarOpen(true)}
          className={`print:hidden absolute left-6 top-6 z-30 bg-white/90 backdrop-blur p-4 rounded-full shadow-xl text-slate-800 transition-all hover:scale-110 ${isSidebarOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}`}
      >
          <PanelLeftOpen size={24} />
      </button>

      {/* Top Right Tools */}
      <div className="print:hidden absolute top-6 right-6 z-30 flex flex-col gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl shadow-2xl flex flex-col gap-2">
             <button onClick={() => setVisualMode('day')} className={`p-2.5 rounded-lg transition-all ${visualMode === 'day' ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'}`}><Sun size={20}/></button>
             <button onClick={() => setVisualMode('night')} className={`p-2.5 rounded-lg transition-all ${visualMode === 'night' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'}`}><Moon size={20}/></button>
          </div>
          <button onClick={toggleFullscreen} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl text-white/70 hover:bg-white/20 hover:text-white transition-all">
             {isFullscreen ? <Minimize size={20}/> : <Monitor size={20}/>}
          </button>
      </div>

      {/* Bottom Center Nav */}
      <div className="print:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-xl text-white rounded-full p-2 pl-4 pr-4 flex items-center gap-6 shadow-2xl border border-white/10">
            <button onClick={() => manualChangeFrame(-1)} className="hover:text-emerald-400 transition-colors p-2"><ChevronLeft size={28} /></button>
            <button onClick={isFlying ? stopFlyover : startFlyover} className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase min-w-[120px] justify-center hover:text-emerald-400 transition-colors">
              {isFlying ? <span className="flex items-center gap-2 text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> Auto</span> : <span className="flex items-center gap-2"><Maximize2 size={14}/> 360° View</span>}
            </button>
            <button onClick={() => manualChangeFrame(1)} className="hover:text-emerald-400 transition-colors p-2"><ChevronRight size={28} /></button>
          </div>
      </div>

      {/* --- 3D VIEWPORT --- */}
      <div 
        className={`print:hidden relative w-full h-full flex justify-center items-center cursor-grab active:cursor-grabbing`}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
      >
        {/* Radar */}
        <div className="absolute bottom-8 right-8 z-20 w-16 h-16 rounded-full border border-white/20 bg-black/20 backdrop-blur flex items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ transform: `rotate(${ (currentIndex / allFramesData.length) * 360 }deg)` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-t from-transparent via-transparent to-white/50 rounded-full clip-path-conic"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"></div>
            </div>
            <div className="w-1 h-1 bg-white/50 rounded-full"></div>
        </div>

        {/* Renderer */}
        <div className="relative w-full h-full transition-transform duration-300 ease-out" style={{ transform: `scale(${zoomLevel})` }}>
           
           <img src={`${FOLDER_PATH}/${allFramesData[0]?.image_name}`} className="opacity-0 absolute pointer-events-none" onLoad={handleImageLoad} />
           
           {allFramesData.map((frame, frameIdx) => (
             <img
               key={frame.image_name}
               src={`${FOLDER_PATH}/${frame.image_name}`}
               className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
               loading="eager"
               style={{ 
                 opacity: frameIdx === currentIndex ? 1 : 0,
                 zIndex: frameIdx === currentIndex ? 10 : 0,
                 willChange: 'opacity',
                 filter: getVisualFilter(),
                 transition: 'filter 0.5s ease' 
               }}
             />
           ))}

           {imageSize.w > 0 && (
             <svg viewBox={`0 0 ${imageSize.w} ${imageSize.h}`} className="absolute inset-0 w-full h-full z-20 pointer-events-none">
               {allFramesData[currentIndex].objects.map((obj) => {
                  if (!isObjectVisibleInFilters(obj.name)) return null;
                  const isSelected = obj.name === selectedObjectName;
                  const isHovered = obj.name === hoveredObjectName;
                  
                  let fill = 'transparent';
                  let stroke = 'transparent';
                  let strokeWidth = 0;
                  
                  if (isSelected) {
                      fill = 'rgba(16, 185, 129, 0.25)'; stroke = '#ffffff'; strokeWidth = 4;
                  } else if (isHovered && !isFlying) {
                      fill = 'rgba(255, 255, 255, 0.1)'; stroke = 'rgba(255, 255, 255, 0.8)'; strokeWidth = 1.5;
                  }

                  if (isFlying && !isSelected) { fill = 'transparent'; stroke = 'transparent'; }

                  return (
                    <polygon
                      key={obj.name} points={obj.pointsString}
                      className="transition-all duration-200 ease-out pointer-events-auto cursor-pointer"
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      onClick={(e) => { e.stopPropagation(); setSelectedObjectName(isSelected ? null : obj.name); stopFlyover(); }}
                      onMouseEnter={() => !isFlying && setHoveredObjectName(obj.name)}
                      onMouseLeave={() => !isFlying && setHoveredObjectName(null)}
                    />
                  );
               })}
             </svg>
           )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. ONBOARDING (UPDATED WITH ARROWS) */}
      {showOnboarding && (
         <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
            
            {/* --- TUTORIAL ARROWS LAYER (Visible only on larger screens) --- */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
                
                {/* 1. Arrow pointing to Sidebar (Left) */}
                <div className="absolute top-20 left-[420px] flex items-center gap-4 animate-in slide-in-from-right-8 duration-1000 delay-300 fill-mode-both">
                    <svg width="100" height="60" viewBox="0 0 100 60" className="text-white drop-shadow-lg transform -scale-x-100">
                        <path d="M 10 30 Q 50 30 90 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 85 5 L 90 10 L 82 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-white font-handwriting text-xl font-bold tracking-wide drop-shadow-md whitespace-nowrap">{t('tut_sidebar')}</span>
                </div>

                {/* 2. Arrow pointing to Tools (Top Right) */}
                <div className="absolute top-24 right-28 flex flex-col items-end gap-2 animate-in slide-in-from-left-8 duration-1000 delay-500 fill-mode-both">
                    <span className="text-white font-handwriting text-xl font-bold tracking-wide drop-shadow-md whitespace-nowrap">{t('tut_tools')}</span>
                    <svg width="80" height="80" viewBox="0 0 80 80" className="text-white drop-shadow-lg">
                        <path d="M 10 70 Q 40 60 70 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 60 10 L 70 10 L 68 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                {/* 3. Arrow pointing to Navigation (Bottom) */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-in slide-in-from-top-8 duration-1000 delay-700 fill-mode-both">
                    <span className="text-white font-handwriting text-xl font-bold tracking-wide drop-shadow-md whitespace-nowrap">{t('tut_nav')}</span>
                    <svg width="40" height="80" viewBox="0 0 40 80" className="text-white drop-shadow-lg">
                        <path d="M 20 0 Q 20 40 20 70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M 10 60 L 20 70 L 30 60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            </div>

            {/* --- MAIN CARD --- */}
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative z-10 animate-in zoom-in-95 duration-300">
                <button onClick={() => setShowOnboarding(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 transition-colors"><X size={20}/></button>
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl rotate-3">
                    <Sparkles size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">{t('welcome_title')}</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">{t('welcome_text')}</p>
                <div className="flex justify-center gap-2 mb-6">
                    <button onClick={() => setLang('en')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${lang === 'en' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>English</button>
                    <button onClick={() => setLang('de')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${lang === 'de' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>Deutsch</button>
                </div>
                <button 
                    onClick={() => { setShowOnboarding(false); localStorage.setItem('luxe_tutorial_seen_v2', 'true'); }}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02]"
                >
                    {t('start_exploring')}
                </button>
            </div>
         </div>
      )}

      {/* 2. FEEDBACK / CONTACT FORM MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowFeedbackModal(false)}></div>
           <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95">
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900">{t('support_title')}</h2>
                    <p className="text-slate-500 text-sm mt-1">{t('support_desc')}</p>
                 </div>
                 <button onClick={() => setShowFeedbackModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="space-y-4 mt-6">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">{t('name')}</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">{t('email')}</label>
                    <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5 ml-1">Message</label>
                    <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none h-32" 
                        placeholder={t('message_placeholder')} 
                    />
                 </div>
              </div>

              <button 
                onClick={() => { setShowFeedbackModal(false); alert(t('thank_you')); }}
                className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                {t('send')} <Send size={16}/>
              </button>
           </div>
        </div>
      )}

      {/* 3. BOOK VIEWING MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowContactModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-2xl font-bold text-slate-900">{t('book_viewing')}</h2>
                   <button onClick={() => setShowContactModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
                </div>
                {selectedObjectName && (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-900"><Calendar size={24} /></div>
                     <div><p className="text-xs text-slate-500 uppercase font-bold">{t('interest_in')}</p><p className="font-bold text-lg text-slate-800">{unitsData[selectedObjectName]?.title}</p></div>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="relative"><User className="absolute left-4 top-3.5 text-slate-400" size={18} /><input type="text" placeholder={t('name')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900" /></div>
                  <div className="relative"><Mail className="absolute left-4 top-3.5 text-slate-400" size={18} /><input type="email" placeholder={t('email')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900" /></div>
                  <div className="relative"><Phone className="absolute left-4 top-3.5 text-slate-400" size={18} /><input type="tel" placeholder={t('phone')} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900" /></div>
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-6">{t('send')} <Send size={18} /></button>
             </div>
          </div>
        </div>
      )}

      {/* 4. COMPARE MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCompareModal(false)}></div>
           <div className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">{t('compare')}</h2>
                <button onClick={() => setShowCompareModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {compareList.map(id => {
                   const u = unitsData[id];
                   return (
                     <div key={id} className="border rounded-2xl p-6 relative bg-slate-50">
                       <button onClick={() => toggleCompare(id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={18}/></button>
                       <h3 className="font-bold text-xl mb-4">{u.title}</h3>
                       <div className="space-y-3 text-sm">
                         <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">{t('price')}</span> <span className="font-bold">{getPrice(u.basePrice)}</span></div>
                         <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">{t('area')}</span> <span>{u.area} m²</span></div>
                         <div className="flex justify-between border-b border-gray-200 pb-2"><span className="text-slate-500">{t('rooms')}</span> <span>{u.rooms}</span></div>
                         <div className="flex justify-between pt-2"><span className="text-slate-500">{t('floor')}</span> <span>{u.floor}</span></div>
                       </div>
                     </div>
                   )
                 })}
                 {compareList.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400">No items to compare</div>}
              </div>
           </div>
        </div>
      )}

      {/* 5. LIMIT WARNING */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <Info size={40} className="mx-auto text-amber-500 mb-4"/>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('compare_limit')}</h3>
              <p className="text-slate-500 mb-6">{t('compare_text')}</p>
              <button onClick={() => setShowLimitModal(false)} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">{t('got_it')}</button>
           </div>
        </div>
      )}

      {/* --- TOOLTIP --- */}
      <TooltipCursor name={hoveredObjectName} isFlying={isFlying} unitsData={unitsData} t={t} />

      <style>{`
        .mask-image-b { mask-image: linear-gradient(to bottom, black 90%, transparent 100%); }
        .clip-path-conic { clip-path: polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 0); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function TooltipCursor({ name, isFlying, unitsData, t }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!name || isFlying || !unitsData[name] || pos.x < 400) return null;
  const unit = unitsData[name];

  return (
    <div 
      className="fixed z-[100] pointer-events-none bg-slate-900/90 backdrop-blur text-white p-3 rounded-xl shadow-xl transform -translate-x-1/2 -translate-y-full mt-[-20px] min-w-[180px]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-sm">{unit.title}</span>
        <div className={`w-2 h-2 rounded-full ${unit.status === 'sold' ? 'bg-red-500' : 'bg-emerald-500'}`} />
      </div>
      <div className="text-[10px] text-gray-300 flex gap-3">
         <span>{unit.area} m²</span>
         <span>{unit.rooms} {t('rooms')}</span>
      </div>
    </div>
  );
}