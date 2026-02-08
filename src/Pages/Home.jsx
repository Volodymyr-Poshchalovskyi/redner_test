import { useState, useEffect, useMemo, useRef } from 'react';
import jsonData from '../final_data.json'; 

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 }); 
  
  const [hoveredObjectName, setHoveredObjectName] = useState(null);
  const [selectedObjectName, setSelectedObjectName] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  const flyIntervalRef = useRef(null);
  const FOLDER_PATH = '/oblit'; 

  const COLORS = {
    DEFAULT: { fill: 'transparent', stroke: 'transparent' }, 
    HOVER:   { fill: 'rgba(255, 255, 255, 0.3)', stroke: '#ffffff' },
    SELECTED:{ fill: 'rgba(0, 255, 0, 0.4)',     stroke: '#00ff00' }
  };

  // --- 1. ОПТИМІЗАЦІЯ ДАНИХ ---
  const allFramesData = useMemo(() => {
    return jsonData.map(frame => ({
      ...frame,
      objects: frame.objects.map(obj => ({
        ...obj,
        pointsString: obj.points.map(p => p.join(',')).join(' ')
      }))
    }));
  }, []);

  // --- 2. ЛОГІКА ---
  const startFlyover = () => {
    if (isFlying) return;
    setIsFlying(true);
    
    const totalDuration = 5000; 
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
    if (imageSize.w === 0) {
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

  return (
    <div 
      className="relative w-screen h-screen bg-gray-900 flex justify-center items-center overflow-hidden cursor-default select-none"
      onMouseMove={(e) => setCursorPos({ x: e.clientX, y: e.clientY })}
    >
      
      {/* --- ЕКРАН ПЕРЕГЛЯДУ --- */}
      <div className="relative max-w-full max-h-full shadow-2xl bg-black">
        
        {/* Spacer Image */}
        <img
          src={`${FOLDER_PATH}/${allFramesData[0].image_name}`}
          alt="Spacer"
          className="block max-w-full max-h-[100vh] opacity-0 pointer-events-none"
          style={{ visibility: 'hidden' }} 
          onLoad={handleImageLoad}
        />

        {/* Stack of Images */}
        {allFramesData.map((frame, frameIdx) => {
          const isActive = frameIdx === currentIndex;
          return (
            <img
              key={frame.image_name}
              src={`${FOLDER_PATH}/${frame.image_name}`}
              alt={`Frame ${frameIdx}`}
              className="absolute top-0 left-0 w-full h-full object-contain block select-none pointer-events-none"
              style={{ 
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 5 : 1
              }}
              loading="eager" 
            />
          );
        })}

        {/* SVG Layer */}
        {imageSize.w > 0 && (
          <svg
            viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
            className="absolute top-0 left-0 w-full h-full"
            style={{ zIndex: 10 }}
          >
            {allFramesData[currentIndex].objects.map((obj) => {
              const isSelected = obj.name === selectedObjectName;
              if (isFlying && !isSelected) return null;

              const isHovered = obj.name === hoveredObjectName;
              let style = COLORS.DEFAULT;
              let strokeW = 0;

              if (isSelected) {
                style = COLORS.SELECTED;
                strokeW = 3;
              } else if (isHovered && !isFlying) {
                style = COLORS.HOVER;
                strokeW = 2;
              }

              return (
                <polygon
                  key={obj.name}
                  points={obj.pointsString}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={strokeW}
                  pointerEvents="all"
                  
                  className={!isFlying ? "cursor-pointer transition-colors duration-150" : ""}
                  
                  onMouseEnter={() => !isFlying && setHoveredObjectName(obj.name)}
                  onMouseLeave={() => !isFlying && setHoveredObjectName(null)}
                  
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if(!isFlying) setSelectedObjectName(obj.name);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if(!isFlying) setSelectedObjectName(null);
                  }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {/* --- ТУЛТІП --- */}
      {hoveredObjectName && !isFlying && (
        <div 
          className="fixed pointer-events-none bg-black/80 text-white px-3 py-1 rounded text-sm font-medium border border-white/20 backdrop-blur-md z-50 whitespace-nowrap shadow-lg"
          style={{ 
            left: cursorPos.x + 15,
            top: cursorPos.y + 15
          }}
        >
          {hoveredObjectName}
        </div>
      )}

      {/* --- ПАНЕЛЬ КЕРУВАННЯ (НИЗ) --- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
        
        {/* Кнопка НАЗАД */}
        <button
          onClick={() => manualChangeFrame(-1)}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-lg group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Кнопка 360 */}
        <button
          onClick={isFlying ? stopFlyover : startFlyover}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-95 flex items-center gap-2 font-medium tracking-wide shadow-lg group min-w-[140px] justify-center"
        >
          {isFlying ? (
            <>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> Stop
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              360° View
            </>
          )}
        </button>

        {/* Кнопка ВПЕРЕД */}
        <button
          onClick={() => manualChangeFrame(1)}
          className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-lg group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 group-hover:translate-x-1 transition-transform">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

      </div>

    </div>
  );
}