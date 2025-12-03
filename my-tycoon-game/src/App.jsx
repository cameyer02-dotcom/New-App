import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Zap, Users, Server, Briefcase, DollarSign, TrendingUp, Star, Gift } from 'lucide-react';

// --- STYLES & ANIMATIONS ---
const styleTag = `
  @keyframes float-across {
    0% { transform: translateX(-100px) translateY(0px) rotate(0deg); }
    25% { transform: translateX(25vw) translateY(-20px) rotate(5deg); }
    50% { transform: translateX(50vw) translateY(0px) rotate(-5deg); }
    75% { transform: translateX(75vw) translateY(20px) rotate(5deg); }
    100% { transform: translateX(110vw) translateY(0px) rotate(0deg); }
  }
  @keyframes pop-out {
    0% { transform: scale(0); opacity: 0; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes fade-up {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-40px); opacity: 0; }
  }
  .animate-float-across {
    animation: float-across linear forwards;
  }
  .animate-pop {
    animation: pop-out 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  .animate-fade-up {
    animation: fade-up 1s ease-out forwards;
  }
`;

const Card = ({ children, className = "", color = "white" }) => {
  const bgColors = {
    white: "bg-white border-gray-100",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    orange: "bg-orange-50 border-orange-200",
    red: "bg-red-50 border-red-200"
  };
  
  return (
    <div className={`rounded-xl shadow-lg border-2 ${bgColors[color] || bgColors.white} ${className}`}>
      {children}
    </div>
  );
};

const Button = ({ children, onClick, disabled, className = "", variant = "primary" }) => {
  const baseStyle = "px-4 py-3 rounded-xl font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-md hover:shadow-lg";
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700",
    warning: "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600",
    disabled: "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none active:scale-100",
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${disabled ? variants.disabled : variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default function App() {
  // --- STATIC CONFIG ---
  const INITIAL_UPGRADES = [
    { id: 1, name: "Espresso Machine", cost: 15, rate: 0.5, count: 0, color: "orange", icon: <Zap size={20} /> },
    { id: 2, name: "Unpaid Intern", cost: 100, rate: 2, count: 0, color: "blue", icon: <Users size={20} /> },
    { id: 3, name: "Cloud Server", cost: 500, rate: 10, count: 0, color: "green", icon: <Server size={20} /> },
    { id: 4, name: "Acquire Rival", cost: 2000, rate: 50, count: 0, color: "purple", icon: <Briefcase size={20} /> },
    { id: 5, name: "Go Public (IPO)", cost: 10000, rate: 250, count: 0, color: "red", icon: <TrendingUp size={20} /> },
  ];

  // --- STATE ---
  const [money, setMoney] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [autoRate, setAutoRate] = useState(0);
  const [adBonusActive, setAdBonusActive] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const [upgrades, setUpgrades] = useState(INITIAL_UPGRADES);
  
  // Visuals State
  const [floaters, setFloaters] = useState([]); // The floating characters
  const [clickEffects, setClickEffects] = useState([]); // Floating text on click

  // --- HELPERS ---
  const formatMoney = (amount) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}k`;
    return `$${Math.floor(amount)}`;
  };

  // --- GAME LOOPS ---

  // 1. Load Game
  useEffect(() => {
    const savedGame = localStorage.getItem('startupTycoonSave_v2');
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        setMoney(parsed.money || 0);
        setLifetimeEarnings(parsed.lifetimeEarnings || 0);
        
        if (parsed.upgrades) {
          const mergedUpgrades = INITIAL_UPGRADES.map(initUpgrade => {
            const savedUpgrade = parsed.upgrades.find(u => u.id === initUpgrade.id);
            if (savedUpgrade) {
              return { ...initUpgrade, count: savedUpgrade.count, cost: savedUpgrade.cost };
            }
            return initUpgrade;
          });
          setUpgrades(mergedUpgrades);
          const newRate = mergedUpgrades.reduce((acc, curr) => acc + (curr.rate * curr.count), 0);
          setAutoRate(newRate);
        }
      } catch (e) { console.error("Save load failed", e); }
    }
  }, []);

  // 2. Save Game
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const upgradesToSave = upgrades.map(({ icon, ...rest }) => rest);
      localStorage.setItem('startupTycoonSave_v2', JSON.stringify({
        money, lifetimeEarnings, upgrades: upgradesToSave
      }));
    }, 5000);
    return () => clearInterval(saveInterval);
  }, [money, lifetimeEarnings, upgrades]);

  // 3. Income Ticker
  useEffect(() => {
    const tickRate = 100;
    const interval = setInterval(() => {
      const incomePerTick = (autoRate * (adBonusActive ? 2 : 1)) / (1000 / tickRate);
      if (incomePerTick > 0) {
        setMoney(prev => prev + incomePerTick);
        setLifetimeEarnings(prev => prev + incomePerTick);
      }
    }, tickRate);
    return () => clearInterval(interval);
  }, [autoRate, adBonusActive]);

  // 4. Ad Timer
  useEffect(() => {
    let interval;
    if (adBonusActive && adTimer > 0) {
      interval = setInterval(() => setAdTimer(p => p - 1), 1000);
    } else if (adTimer <= 0) {
      setAdBonusActive(false);
    }
    return () => clearInterval(interval);
  }, [adBonusActive, adTimer]);

  // 5. Floater Spawner (New!)
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      // 30% chance to spawn every 3 seconds if tab is active
      if (Math.random() > 0.7) {
        const id = Date.now();
        const types = [
          { emoji: "👼", type: "angel", speed: 10 + Math.random() * 5 }, // Slow, high value
          { emoji: "🚀", type: "vc", speed: 5 + Math.random() * 3 },    // Fast, medium value
          { emoji: "🤑", type: "bonus", speed: 8 }
        ];
        const randomType = types[Math.floor(Math.random() * types.length)];
        const topPos = 10 + Math.random() * 60; // Top 10% to 70% of screen

        setFloaters(prev => [...prev, { 
          id, 
          ...randomType, 
          top: topPos,
          createdAt: Date.now() 
        }]);

        // Cleanup old floaters
        setTimeout(() => {
          setFloaters(prev => prev.filter(f => f.id !== id));
        }, randomType.speed * 1000);
      }
    }, 2000);
    return () => clearInterval(spawnInterval);
  }, []);

  // --- ACTIONS ---

  const spawnClickEffect = (x, y, text) => {
    const id = Date.now() + Math.random();
    setClickEffects(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setClickEffects(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  const handleClick = (e) => {
    const amount = clickValue * (adBonusActive ? 2 : 1);
    setMoney(prev => prev + amount);
    setLifetimeEarnings(prev => prev + amount);
    
    // Spawn visual effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX || (rect.left + rect.width / 2); // Fallback for keyboard
    const y = e.clientY || (rect.top + rect.height / 2);
    spawnClickEffect(x, y, `+$${amount}`);
  };

  const handleFloaterClick = (floater, e) => {
    e.stopPropagation();
    // Reward calculation
    let reward = 0;
    if (floater.type === 'angel') reward = (autoRate * 60) + 100; // 1 min of income + base
    if (floater.type === 'vc') reward = (autoRate * 30) + 50;
    if (floater.type === 'bonus') reward = (money * 0.1) + 20; // 10% of current cash
    
    if (reward === 0) reward = 50; // Fallback for early game
    
    setMoney(prev => prev + reward);
    setLifetimeEarnings(prev => prev + reward);
    
    // Remove floater immediately
    setFloaters(prev => prev.filter(f => f.id !== floater.id));
    
    // Visuals
    spawnClickEffect(e.clientX, e.clientY, `+${formatMoney(reward)}!`);
  };

  const buyUpgrade = (id) => {
    const upgrade = upgrades.find(u => u.id === id);
    if (money >= upgrade.cost) {
      setMoney(prev => prev - upgrade.cost);
      
      const newUpgrades = upgrades.map(u => {
        if (u.id === id) {
          return { ...u, count: u.count + 1, cost: Math.round(u.cost * 1.15) };
        }
        return u;
      });
      
      setUpgrades(newUpgrades);
      const newRate = newUpgrades.reduce((acc, curr) => acc + (curr.rate * curr.count), 0);
      setAutoRate(newRate);
    }
  };

  const watchAd = () => {
    setShowAdModal(true);
    setTimeout(() => {
      setShowAdModal(false);
      setAdBonusActive(true);
      setAdTimer(30);
    }, 3000);
  };

  return (
    <div className="min-h-screen font-sans p-4 md:p-8 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <style>{styleTag}</style>

      {/* Floating Elements Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floaters.map(floater => (
          <div
            key={floater.id}
            onClick={(e) => handleFloaterClick(floater, e)}
            className="absolute cursor-pointer pointer-events-auto text-4xl hover:scale-125 transition-transform active:scale-95 animate-float-across select-none"
            style={{
              top: `${floater.top}%`,
              animationDuration: `${floater.speed}s`,
              left: '-50px' // Start off screen
            }}
          >
            {floater.emoji}
          </div>
        ))}
        
        {/* Click Effects */}
        {clickEffects.map(effect => (
          <div
            key={effect.id}
            className="absolute font-bold text-green-600 text-xl animate-fade-up pointer-events-none"
            style={{ left: effect.x, top: effect.y }}
          >
            {effect.text}
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-6 bg-white/50 p-4 rounded-2xl backdrop-blur-sm shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              STARTUP TYCOON
            </h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Passive Income Sim</p>
          </div>
          <div className="text-right">
             <div className="text-[10px] text-gray-500 uppercase font-bold">Lifetime Value</div>
             <div className="font-mono font-bold text-gray-700">{formatMoney(lifetimeEarnings)}</div>
          </div>
        </header>

        {/* Main Scoreboard */}
        <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 rounded-3xl p-8 text-white text-center shadow-xl shadow-indigo-200 relative overflow-hidden">
          {/* Background pattern for card */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>
          
          <div className="relative z-10">
            <div className="text-sm font-bold opacity-80 mb-2 uppercase tracking-widest">Current Balance</div>
            <div className="text-6xl font-black tracking-tighter mb-6 drop-shadow-md">{formatMoney(money)}</div>
            
            <div className="flex justify-center gap-3">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                <Zap size={16} className="text-yellow-300 fill-current" />
                {formatMoney(autoRate)}/sec
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm">
                <Users size={16} className="text-green-300 fill-current" />
                {upgrades.reduce((acc, u) => acc + u.count, 0)} Staff
              </div>
            </div>
          </div>
        </div>

        {/* The Big Button */}
        <button 
          onClick={handleClick}
          className="w-full group relative py-6 bg-white rounded-3xl shadow-xl shadow-blue-100 border-b-[6px] border-blue-100 active:border-b-0 active:translate-y-[6px] transition-all overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex flex-col items-center gap-2">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white shadow-lg group-active:scale-90 transition-transform">
              <DollarSign size={36} strokeWidth={3} />
            </div>
            <div className="font-black text-2xl text-blue-900">MAKE DEAL</div>
            <div className="text-sm font-bold text-blue-400">
              +{formatMoney(clickValue * (adBonusActive ? 2 : 1))}
            </div>
          </div>
        </button>

        {/* Ad Bonus Bar */}
        <div className="relative">
          {adBonusActive ? (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full"><Star className="fill-current" size={18} /></div>
                <div>
                  <div className="font-black leading-none">2X REVENUE</div>
                  <div className="text-xs font-bold opacity-90">Bonus Active</div>
                </div>
              </div>
              <div className="font-mono font-bold text-2xl">{adTimer}s</div>
            </div>
          ) : (
            <Button 
              variant="warning" 
              className="w-full justify-between group py-4"
              onClick={watchAd}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full"><Play className="fill-current" size={18} /></div>
                <div className="text-left">
                  <div className="font-black leading-none">WATCH AD</div>
                  <div className="text-xs font-medium opacity-90">Get 2x Income for 30s</div>
                </div>
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-lg text-sm font-bold group-hover:bg-white/30 transition">
                Start
              </div>
            </Button>
          )}
        </div>

        {/* Upgrades Section */}
        <div className="space-y-4 pt-4">
          <h2 className="font-black text-gray-800 text-xl px-2 flex items-center gap-2">
            <Briefcase className="text-gray-400" size={20} />
            Assets
          </h2>
          {upgrades.map(upgrade => (
            <Card key={upgrade.id} color={upgrade.color} className="p-4 flex justify-between items-center group transition-all hover:scale-[1.02]">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-sm ${money >= upgrade.cost ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-400'}`}>
                  {upgrade.icon}
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-lg leading-tight">{upgrade.name}</div>
                  <div className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">
                    <TrendingUp size={12} /> +{formatMoney(upgrade.rate)}/sec
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                 <div className="text-xs font-bold text-gray-400 uppercase">Owned: {upgrade.count}</div>
                <Button 
                  disabled={money < upgrade.cost}
                  onClick={() => buyUpgrade(upgrade.id)}
                  className={`px-4 py-2 text-sm min-w-[100px] ${money < upgrade.cost ? 'opacity-50' : 'opacity-100'}`}
                >
                  {formatMoney(upgrade.cost)}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="h-20"></div> {/* Spacer for scroll */}
      </div>

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-pop">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-6">
            <div className="flex justify-center mb-4">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                 <Play size={32} className="fill-current ml-1" />
               </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Watching Ad...</h3>
              <p className="text-gray-500 font-medium">This is where the money is made. 💰</p>
            </div>
            
            <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden p-1">
               <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full animate-[width_3s_linear]" style={{width: '100%', animation: 'width 3s linear'}}></div>
            </div>
            
            <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-xl border border-gray-100">
              Debug: In production, this would trigger the Google AdMob Rewarded Video SDK.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}