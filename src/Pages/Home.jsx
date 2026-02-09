import { useState, useEffect, useMemo, useRef } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight, Check, BedDouble, Square, Layers, ChevronDown, MapPin } from 'lucide-react';
import jsonData from '../final_data.json'; 

// --- 1. MOCK DATA GENERATOR (FIXED) ---
// Тепер сканує ВЕСЬ масив кадрів, щоб знайти всі квартири, навіть ті, що ззаду
const generateUnitData = (allFrames) => {
  const data = {};
  const allNamesSet = new Set();

  // Проходимо по кожному кадру і збираємо всі унікальні назви
  allFrames.forEach(frame => {
    frame.objects.forEach(obj => {
      allNamesSet.add(obj.name);
    });
  });

  const uniqueNames = Array.from(allNamesSet).sort();
  
  uniqueNames.forEach((name, index) => {
    // Рандомізація даних
    const rooms = index % 2 === 0 ? 3.5 : 4.5;
    const area = 120 + (index * 10);
    const price = 850000 + (index * 45000);
    // Робимо "проданими" наприклад 2-гу і 5-ту квартиру
    const isSold = index === 1 || index === 4; 
    
    data[name] = {
      id: name,
      title: name.toUpperCase().replace('_', ' '),
      price: isSold ? 'SOLD' : `CHF ${price.toLocaleString()}`,
      status: isSold ? 'sold' : 'available',
      rooms: rooms,
      area: area,
      floor: (index % 3) + 1, // Фейковий поверх
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
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRooms, setFilterRooms] = useState('all');

  const flyIntervalRef = useRef(null);
  const FOLDER_PATH = '/oblit'; 

  // --- DATA PROCESSING ---
  const allFramesData = useMemo(() => {
    return jsonData.map(frame => ({
      ...frame,
      objects: frame.objects.map(obj => ({
        ...obj,
        pointsString: obj.points.map(p => p.join(',')).join(' ')
      }))
    }));
  }, []);

  // Генеруємо дані, передаючи ВЕСЬ JSON, щоб знайти всі квартири
  const unitsData = useMemo(() => {
    if (jsonData.length > 0) return generateUnitData(jsonData);
    return {};
  }, []);

  // --- LOGIC ---
  const startFlyover = () => {
    if (isFlying) return;
    setIsFlying(true);
    
    const totalDuration = 10000; 
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

  const handleImageLoad = (e) => {
    // Встановлюємо розмір SVG тільки один раз по першому завантаженому зображенню
    if (imageSize.w === 0 && e.target.naturalWidth > 0) {
      setImageSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') manualChangeFrame(-1);
      if (e.key === 'ArrowRight') manualChangeFrame(1);
      if (e.key === 'Escape') setSelectedObjectName(null);
      if (e.key === ' ') isFlying ? stopFlyover() : startFlyover();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlying]);

  const getObjectDetails = (name) => unitsData[name] || {};

  const isObjectVisibleInFilters = (name) => {
    const details = unitsData[name];
    if (!details) return false; // Якщо дані не згенерувались, ховаємо
    if (filterStatus !== 'all' && details.status !== filterStatus) return false;
    if (filterRooms !== 'all' && String(details.rooms) !== filterRooms) return false;
    return true;
  };

  return (
    <div className="relative w-full h-full bg-[#111] flex overflow-hidden font-sans text-slate-800">
      
      {/* --- SIDEBAR --- */}
      <div className="absolute left-0 top-0 h-full w-[400px] bg-white/90 backdrop-blur-2xl z-40 shadow-[10px_0_30px_rgba(0,0,0,0.2)] flex flex-col border-r border-white/20">
        
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
            // DETAILED VIEW
            <div className="animate-in slide-in-from-left-4 duration-300">
              {(() => {
                const details = getObjectDetails(selectedObjectName);
                return (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${details.status === 'sold' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {details.status === 'sold' ? 'Sold Out' : 'Available'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">UNIT {details.floor}.01</span>
                      </div>
                      <h2 className="text-4xl font-light text-slate-900 tracking-tight">{details.title}</h2>
                      <p className="text-2xl font-medium text-slate-800 mt-2">{details.price}</p>
                    </div>

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

                    <button className="w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl font-semibold tracking-wide flex items-center justify-center gap-2 group">
                      Request Private Viewing
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                  </>
                );
              })()}
            </div>
          ) : (
            // LIST VIEW
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
                    <span className="font-medium text-slate-700">{unit.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MAIN 360 VIEWER --- */}
      <div className="relative flex-1 h-full bg-[#e5e5e5] flex justify-center items-center overflow-hidden cursor-move ml-[400px]">
        
        {/* Image Container */}
        <div className="relative flex justify-center items-center w-full h-full">
          {/* Spacer - Задає розміри контейнера */}
          <img
            src={`${FOLDER_PATH}/${allFramesData[0].image_name}`}
            alt="Spacer"
            className="absolute max-w-full max-h-full object-contain opacity-0 pointer-events-none"
            onLoad={handleImageLoad}
          />

          {/* Image Stack - ОПТИМІЗАЦІЯ */}
          {/* Всі картинки рендеряться відразу (як в старому коді), але ховаються через opacity. */}
          {/* Це дозволяє браузеру тримати їх в пам'яті. */}
          {allFramesData.map((frame, frameIdx) => (
            <img
              key={frame.image_name}
              src={`${FOLDER_PATH}/${frame.image_name}`}
              alt={`Frame ${frameIdx}`}
              className="absolute inset-0 w-full h-full object-contain transition-none pointer-events-none"
              style={{ 
                opacity: frameIdx === currentIndex ? 1 : 0,
                zIndex: frameIdx === currentIndex ? 10 : 0,
                willChange: 'opacity' // Підказка браузеру для оптимізації
              }}
              loading="eager" 
            />
          ))}

          {/* SVG Overlay */}
          {imageSize.w > 0 && (
            <svg
              viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
              className="absolute inset-0 w-full h-full z-20"
              preserveAspectRatio="xMidYMid meet"
            >
              {allFramesData[currentIndex].objects.map((obj) => {
                const isSelected = obj.name === selectedObjectName;
                const isHovered = obj.name === hoveredObjectName;
                
                if (!isObjectVisibleInFilters(obj.name)) return null;

                let fill = 'transparent';
                let stroke = 'transparent';
                let strokeWidth = 0;

                if (isSelected) {
                  fill = 'rgba(16, 185, 129, 0.3)'; 
                  stroke = '#059669';
                  strokeWidth = 2.5;
                } else if (isHovered && !isFlying) {
                  fill = 'rgba(255, 255, 255, 0.15)'; 
                  stroke = 'rgba(255, 255, 255, 0.9)';
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
                    className={`transition-colors ease-out pointer-events-auto ${!isFlying ? 'cursor-pointer' : ''}`}
                    style={{ transitionDuration: '50ms' }} 
                    onMouseEnter={() => !isFlying && setHoveredObjectName(obj.name)}
                    onMouseLeave={() => !isFlying && setHoveredObjectName(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if(!isFlying) {
                        setSelectedObjectName(isSelected ? null : obj.name);
                        stopFlyover();
                      }
                    }}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* --- BOTTOM CONTROLS --- */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30">
          <div className="bg-white/80 backdrop-blur-md rounded-full p-2 pl-3 pr-3 flex items-center gap-4 shadow-2xl border border-white/50">
            <button
              onClick={() => manualChangeFrame(-1)}
              className="p-3 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all active:scale-95"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              onClick={isFlying ? stopFlyover : startFlyover}
              className={`px-8 py-3 rounded-full font-bold text-sm tracking-wide transition-all active:scale-95 shadow-lg flex items-center gap-2 min-w-[160px] justify-center
                ${isFlying ? 'bg-white text-red-500 border border-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'}
              `}
            >
              {isFlying ? (
                 <> <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> STOP VIEW </>
              ) : (
                 <> <Maximize2 size={16}/> 360° VIEW </>
              )}
            </button>

            <button
              onClick={() => manualChangeFrame(1)}
              className="p-3 text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all active:scale-95"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
        
      </div>

      {/* --- ENHANCED TOOLTIP CURSOR --- */}
      <TooltipCursor name={hoveredObjectName} isFlying={isFlying} unitsData={unitsData} />
    </div>
  );
}

// --- SUBCOMPONENT: ADVANCED MOUSE TOOLTIP ---
function TooltipCursor({ name, isFlying, unitsData }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!name || isFlying || !unitsData[name]) return null;

  const unit = unitsData[name];

  return (
    <div 
      className="fixed z-[100] pointer-events-none bg-white/95 backdrop-blur-xl text-slate-800 p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-white/40 transform -translate-x-1/2 -translate-y-full mt-[-20px] min-w-[200px]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
        <span className="font-bold text-sm tracking-wide">{unit.title}</span>
        {unit.status === 'sold' ? (
             <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">SOLD</span>
        ) : (
             <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded">AVAIL</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Square size={12}/> {unit.area} m²</span>
        <span className="flex items-center gap-1"><BedDouble size={12}/> {unit.rooms}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">
        {unit.price}
      </div>
    </div>
  );
}