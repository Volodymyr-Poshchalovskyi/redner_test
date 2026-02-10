import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Maximize2, X, ChevronLeft, ChevronRight, Check, BedDouble, Square, 
  ChevronDown, MapPin, Sun, Moon, ZoomIn, ZoomOut, Sparkles, Gem, Hammer,
  User, Mail, Phone, Send, Calendar
} from 'lucide-react';
import jsonData from '../final_data.json'; 

// --- 1. MOCK DATA GENERATOR ---
const generateUnitData = (allFrames) => {
  const data = {};
  const allNamesSet = new Set();

  allFrames.forEach(frame => {
    frame.objects.forEach(obj => {
      allNamesSet.add(obj.name);
    });
  });

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
      description: "Experience luxury living with breathtaking panoramic views. This exclusive unit features a spacious terrace, floor-to-ceiling windows, and premium finishes throughout."
    };
  });
  return data;
};

// --- CUSTOM SELECT COMPONENT ---
const CustomSelect = ({ value, onChange, options, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || value;

  return (
    <div className="relative flex-1" ref={selectRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-white/80 backdrop-blur-sm border px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-sm
          ${isOpen ? 'border-slate-500 ring-2 ring-slate-200' : 'border-gray-200 hover:border-slate-400'}
        `}
      >
        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
          {Icon && <Icon size={16} className="text-slate-500" />}
          {selectedLabel}
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-4 py-3 text-sm cursor-pointer flex items-center justify-between border-b border-gray-50 last:border-0 hover:bg-slate-50 transition-colors 
                ${value === opt.value ? 'bg-slate-50 text-slate-900 font-bold' : 'text-slate-600'}
              `}
            >
              {opt.label}
              {value === opt.value && <Check size={14} className="text-slate-900" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RealEstateViewer() {
  // --- STATE ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 }); 
  
  const [hoveredObjectName, setHoveredObjectName] = useState(null);
  const [selectedObjectName, setSelectedObjectName] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRooms, setFilterRooms] = useState('all');

  // Visual & Feature States
  const [visualMode, setVisualMode] = useState('day'); 
  const [zoomLevel, setZoomLevel] = useState(1);
  const [finishPackage, setFinishPackage] = useState('standard'); 

  // --- Refs ---
  const flyIntervalRef = useRef(null);
  const dragRef = useRef({ isDragging: false, startX: 0 });
  const wheelAccumulatorRef = useRef(0); // NEW: для накопичення свайпу тачпада
  
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

  // --- LOGIC ---
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

  // --- MOUSE DRAG HANDLERS ---
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
      // Inverted logic: Drag Right (delta > 0) -> Rotate Left (-1)
      const direction = delta > 0 ? -1 : 1;
      
      setCurrentIndex((prev) => {
        return direction === 1 
          ? (prev + 1) % allFramesData.length 
          : (prev - 1 + allFramesData.length) % allFramesData.length;
      });

      dragRef.current.startX = x;
    }
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
    document.body.style.cursor = 'default';
  };

  // --- NEW: TOUCHPAD WHEEL HANDLER ---
  const handleWheel = (e) => {
    // Якщо це вертикальний скрол (наприклад, зум або скрол сторінки), ігноруємо для обертання
    // Але якщо deltaX значний, то це горизонтальний свайп
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      stopFlyover();
      
      // Додаємо зміщення до акумулятора
      wheelAccumulatorRef.current += e.deltaX;

      // Поріг чутливості (чим більше число, тим "тугіше" крутиться)
      const threshold = 30; 

      if (Math.abs(wheelAccumulatorRef.current) > threshold) {
        // Інверсія для тачпада:
        // Свайп пальцями вправо зазвичай дає Negative DeltaX (на Mac/Natural Scrolling) 
        // або Positive DeltaX (на Windows Standard).
        // Щоб працювало як "пальці вправо -> крутимо вліво":
        // Приймемо стандарт: якщо deltaX > 0 (ніби тягнемо скролбар вправо), робимо -1.
        
        const direction = wheelAccumulatorRef.current > 0 ? -1 : 1;

        setCurrentIndex((prev) => {
          return direction === 1 
            ? (prev + 1) % allFramesData.length 
            : (prev - 1 + allFramesData.length) % allFramesData.length;
        });

        // Скидаємо акумулятор після виконання дії
        wheelAccumulatorRef.current = 0;
      }
    }
  };

  const handleZoom = (delta) => {
    setZoomLevel(prev => Math.min(Math.max(prev + delta, 1), 1.8));
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
        else setSelectedObjectName(null);
      }
      if (e.key === ' ' && !showContactModal) isFlying ? stopFlyover() : startFlyover();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isFlying, showContactModal]);

  const getObjectDetails = (name) => unitsData[name] || {};

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
    if (filterStatus !== 'all' && details.status !== filterStatus) return false;
    if (filterRooms !== 'all' && String(details.rooms) !== filterRooms) return false;
    return true;
  };

  const getVisualFilter = () => {
    switch (visualMode) {
      case 'night': return 'brightness(0.7) contrast(1.1) hue-rotate(200deg) saturate(1.1)';
      default: return 'none';
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <div className="absolute left-0 top-0 h-full w-[400px] bg-white/95 backdrop-blur-2xl z-40 shadow-[10px_0_40px_rgba(0,0,0,0.3)] flex flex-col border-r border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">LUXE 1</h1>
              <div className="flex items-center gap-1 text-slate-500 mt-2 text-sm font-medium">
                <MapPin size={14} />
                <span>Zürich, Switzerland</span>
              </div>
            </div>
            {selectedObjectName && (
               <button 
                 onClick={() => setSelectedObjectName(null)} 
                 className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900"
               >
                 <X size={24} />
               </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {!selectedObjectName && (
          <div className="p-6 bg-slate-50/60 space-y-4 border-b border-gray-100">
             <div className="flex gap-3">
                <CustomSelect 
                  value={filterStatus}
                  onChange={setFilterStatus}
                  icon={Check}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'sold', label: 'Sold' }
                  ]}
                />
                <CustomSelect 
                  value={filterRooms}
                  onChange={setFilterRooms}
                  icon={BedDouble}
                  options={[
                    { value: 'all', label: 'Any Rooms' },
                    { value: '3.5', label: '3.5 Rooms' },
                    { value: '4.5', label: '4.5 Rooms' }
                  ]}
                />
             </div>
          </div>
        )}

        {/* Content List / Detail */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {selectedObjectName ? (
            <div className="animate-in slide-in-from-left-4 duration-300">
              {(() => {
                const details = getObjectDetails(selectedObjectName);
                return (
                  <>
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${details.status === 'sold' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {details.status === 'sold' ? 'Sold Out' : 'Available'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">UNIT {details.floor}.01</span>
                      </div>
                      <h2 className="text-4xl font-light text-slate-900 tracking-tight">{details.title}</h2>
                      <p className="text-2xl font-medium text-slate-800 mt-2 transition-all key={finishPackage}">
                        {details.status === 'sold' ? 'SOLD' : getPrice(details.basePrice)}
                      </p>
                    </div>

                    {/* FINISH CONFIGURATOR */}
                    {details.status !== 'sold' && (
                      <div className="mb-8">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Interior Finish</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={() => setFinishPackage('raw')}
                            className={`p-3 rounded-xl border text-center transition-all ${finishPackage === 'raw' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                          >
                            <Hammer size={20} className="mx-auto mb-1 text-slate-600"/>
                            <div className="text-[10px] font-bold">RAW</div>
                          </button>
                          <button 
                            onClick={() => setFinishPackage('standard')}
                            className={`p-3 rounded-xl border text-center transition-all ${finishPackage === 'standard' ? 'border-slate-900 bg-slate-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                          >
                            <Sparkles size={20} className="mx-auto mb-1 text-slate-600"/>
                            <div className="text-[10px] font-bold">MODERN</div>
                          </button>
                          <button 
                            onClick={() => setFinishPackage('premium')}
                            className={`p-3 rounded-xl border text-center transition-all ${finishPackage === 'premium' ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                          >
                            <Gem size={20} className="mx-auto mb-1 text-amber-500"/>
                            <div className="text-[10px] font-bold text-amber-700">PREMIUM</div>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Square className="w-5 h-5 text-slate-400 mb-2"/>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Living Area</p>
                        <p className="text-lg font-semibold text-slate-800">{details.area} m²</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <BedDouble className="w-5 h-5 text-slate-400 mb-2"/>
                        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Rooms</p>
                        <p className="text-lg font-semibold text-slate-800">{details.rooms}</p>
                      </div>
                    </div>

                    <div className="prose prose-slate prose-sm mb-8 text-slate-600 leading-relaxed">
                      <p>{details.description}</p>
                    </div>

                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl font-semibold tracking-wide flex items-center justify-center gap-2 group active:scale-[0.98]"
                    >
                      Request Private Viewing
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Available Units</p>
              {Object.values(unitsData).filter(u => isObjectVisibleInFilters(u.id)).map((unit) => (
                <div 
                  key={unit.id}
                  onClick={() => {
                    stopFlyover();
                    setSelectedObjectName(unit.id);
                  }}
                  onMouseEnter={() => setHoveredObjectName(unit.id)}
                  onMouseLeave={() => setHoveredObjectName(null)}
                  className={`group relative p-5 border rounded-2xl cursor-pointer transition-all duration-300 
                    ${selectedObjectName === unit.id ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-lg hover:-translate-y-1'}
                  `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg text-slate-800">{unit.title}</h3>
                    <div className={`w-2 h-2 rounded-full mt-2 ${unit.status === 'sold' ? 'bg-red-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'}`} />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1.5"><Square size={14} className="text-slate-400"/> {unit.area}m²</span>
                        <span className="flex items-center gap-1.5"><BedDouble size={14} className="text-slate-400"/> {unit.rooms}</span>
                    </div>
                    <span className="font-medium text-slate-700">
                      {unit.status === 'sold' ? 'Sold' : `CHF ${unit.basePrice.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN 360 VIEWER AREA --- */}
      <div 
        className="relative flex-1 h-full bg-[#111] flex justify-center items-center overflow-hidden ml-[400px] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel} // ADDED WHEEL LISTENER HERE
      >
        
        {/* VIEW MODE CONTROLS */}
        <div className="absolute top-8 right-8 z-50 flex flex-col gap-2">
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-xl flex gap-1 shadow-2xl">
              <button onClick={() => setVisualMode('day')} className={`p-2 rounded-lg transition-all ${visualMode === 'day' ? 'bg-white text-slate-900 shadow-md' : 'text-white/70 hover:bg-white/10'}`}>
                <Sun size={20} />
              </button>
              <button onClick={() => setVisualMode('night')} className={`p-2 rounded-lg transition-all ${visualMode === 'night' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-white/70 hover:bg-white/10'}`}>
                <Moon size={20} />
              </button>
           </div>
           
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-1.5 rounded-xl flex flex-col gap-1 shadow-2xl mt-2">
              <button onClick={() => handleZoom(0.1)} className="p-2 text-white/70 hover:bg-white/20 rounded-lg transition"><ZoomIn size={20}/></button>
              <button onClick={() => handleZoom(-0.1)} className="p-2 text-white/70 hover:bg-white/20 rounded-lg transition"><ZoomOut size={20}/></button>
           </div>
        </div>

        {/* RADAR */}
        <div className="absolute bottom-10 right-10 z-50 pointer-events-none select-none">
           <div className="relative w-20 h-20 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-sm shadow-xl">
              <div className="absolute top-[-5px] text-[8px] font-bold text-white/80 tracking-widest bg-black/20 px-1 rounded">N</div>
              <div 
                className="absolute inset-0 rounded-full transition-transform duration-75 ease-linear will-change-transform"
                style={{ transform: `rotate(${ (currentIndex / allFramesData.length) * 360 }deg)` }}
              >
                  <div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
                    style={{ background: 'conic-gradient(from -25deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.4) 25deg, transparent 50deg)' }}
                  ></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]"></div>
              </div>
           </div>
        </div>

        {/* IMAGE */}
        <div 
          className="relative flex justify-center items-center w-full h-full transition-transform duration-300 ease-out pointer-events-none" 
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={`${FOLDER_PATH}/${allFramesData[0].image_name}`}
            alt="Spacer"
            className="absolute max-w-full max-h-full object-contain opacity-0 pointer-events-none"
            onLoad={handleImageLoad}
          />

          {allFramesData.map((frame, frameIdx) => (
            <img
              key={frame.image_name}
              src={`${FOLDER_PATH}/${frame.image_name}`}
              alt={`Frame ${frameIdx}`}
              className="absolute inset-0 w-full h-full object-contain transition-none pointer-events-none"
              style={{ 
                opacity: frameIdx === currentIndex ? 1 : 0,
                zIndex: frameIdx === currentIndex ? 10 : 0,
                willChange: 'opacity',
                filter: getVisualFilter(),
                transition: 'filter 0.5s ease'
              }}
              loading="eager" 
            />
          ))}

          {imageSize.w > 0 && (
            <svg
              viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
              className="absolute inset-0 w-full h-full z-20 pointer-events-none" 
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                 <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                   <feGaussianBlur stdDeviation="3" result="blur" />
                   <feComposite in="SourceGraphic" in2="blur" operator="over" />
                 </filter>
              </defs>

              {allFramesData[currentIndex].objects.map((obj) => {
                const isSelected = obj.name === selectedObjectName;
                const isHovered = obj.name === hoveredObjectName;
                
                if (!isObjectVisibleInFilters(obj.name)) return null;

                let fill = 'transparent';
                let stroke = 'transparent';
                let strokeWidth = 0;
                let className = "transition-all ease-out pointer-events-auto";

                if (isSelected) {
                  fill = 'rgba(16, 185, 129, 0.25)'; 
                  stroke = '#ffffff'; 
                  strokeWidth = 3; 
                  className += " animate-pulse-slow"; 
                } else if (isHovered && !isFlying) {
                  fill = 'rgba(255, 255, 255, 0.1)'; 
                  stroke = 'rgba(255, 255, 255, 0.8)';
                  strokeWidth = 1.5;
                }

                if (isFlying && !isSelected) {
                   fill = 'transparent'; stroke = 'transparent';
                }

                return (
                  <polygon
                    key={obj.name}
                    points={obj.pointsString}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className={className}
                    strokeLinejoin="round"
                    style={{ 
                      cursor: !isFlying ? 'pointer' : 'default',
                      filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' : 'none',
                      transitionDuration: '200ms'
                    }} 
                    onMouseEnter={() => !isFlying && setHoveredObjectName(obj.name)}
                    onMouseLeave={() => !isFlying && setHoveredObjectName(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!isFlying) {
                        setSelectedObjectName(isSelected ? null : obj.name);
                        stopFlyover();
                      }
                    }}
                    onMouseDown={(e) => {
                         // Pass through
                    }}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 pointer-events-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-full p-2 pl-3 pr-3 flex items-center gap-4 shadow-2xl border border-white/50">
            <button onClick={() => manualChangeFrame(-1)} className="p-3 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all active:scale-95">
              <ChevronLeft size={22} />
            </button>
            <button onClick={isFlying ? stopFlyover : startFlyover} className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg flex items-center gap-2 min-w-[160px] justify-center ${isFlying ? 'bg-white text-red-500 border border-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              {isFlying ? (<> <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> STOP VIEW </>) : (<> <Maximize2 size={16}/> 360° VIEW </>)}
            </button>
            <button onClick={() => manualChangeFrame(1)} className="p-3 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all active:scale-95">
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* --- MODAL (OVERLAY) --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={() => setShowContactModal(false)}
          ></div>

          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 pb-4">
                <div className="flex justify-between items-start mb-2">
                   <h2 className="text-2xl font-bold text-slate-900">Book a Viewing</h2>
                   <button 
                     onClick={() => setShowContactModal(false)}
                     className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900"
                   >
                     <X size={20}/>
                   </button>
                </div>
                {selectedObjectName && (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-900">
                        <Calendar size={20} />
                     </div>
                     <div>
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Interest in</p>
                        <p className="font-semibold text-slate-800">{unitsData[selectedObjectName]?.title || 'Selected Unit'}</p>
                     </div>
                  </div>
                )}
             </div>

             <div className="px-8 pb-8 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Full Name</label>
                   <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input type="text" placeholder="John Doe" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-sm font-medium" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="email" placeholder="john@example.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-sm font-medium" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-1">Phone</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="tel" placeholder="+41 ..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-sm font-medium" />
                    </div>
                  </div>
                </div>

                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold tracking-wide shadow-lg hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4">
                   <Send size={18} />
                   Send Request
                </button>
             </div>
          </div>
        </div>
      )}

      {/* --- TOOLTIP --- */}
      <TooltipCursor name={hoveredObjectName} isFlying={isFlying} unitsData={unitsData} />
      
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { fill-opacity: 0.25; stroke-opacity: 1; }
          50% { fill-opacity: 0.45; stroke-opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// --- TOOLTIP COMPONENT ---
function TooltipCursor({ name, isFlying, unitsData }) {
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
      className="fixed z-[100] pointer-events-none bg-white/95 backdrop-blur-xl text-slate-800 p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/40 transform -translate-x-1/2 -translate-y-full mt-[-20px] min-w-[200px]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
        <span className="font-bold text-sm tracking-wide">{unit.title}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${unit.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
          {unit.status === 'sold' ? 'SOLD' : 'AVAIL'}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Square size={12}/> {unit.area} m²</span>
        <span className="flex items-center gap-1"><BedDouble size={12}/> {unit.rooms}</span>
      </div>
    </div>
  );
}