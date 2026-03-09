import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { WasteAnalysis } from '../types';
import { 
  Trash2, Recycle, AlertTriangle, Info, 
  Leaf, Droplets, Zap, FileText, Box, FlaskConical, Monitor, BarChart3, Globe
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  history: WasteAnalysis[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Plastic: '#10b981', // emerald-500
  Organic: '#84cc16', // lime-500
  Metal: '#64748b',   // slate-500
  Paper: '#fbbf24',   // amber-400
  Glass: '#38bdf8',   // sky-400
  Hazardous: '#ef4444', // red-500
  'E-waste': '#8b5cf6', // violet-500
  Other: '#94a3b8',    // slate-400
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Plastic: <Box className="w-5 h-5" />,
  Organic: <Leaf className="w-5 h-5" />,
  Metal: <Zap className="w-5 h-5" />,
  Paper: <FileText className="w-5 h-5" />,
  Glass: <Droplets className="w-5 h-5" />,
  Hazardous: <FlaskConical className="w-5 h-5" />,
  'E-waste': <Monitor className="w-5 h-5" />,
  Other: <Trash2 className="w-5 h-5" />,
};

export const Dashboard: React.FC<DashboardProps> = ({ history }) => {
  const latest = history[0];

  const categoryStats = history.reduce((acc, scan) => {
    if (scan.items && Array.isArray(scan.items)) {
      scan.items.forEach(item => {
        acc[item.category] = (acc[item.category] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const totalItemsScanned = history.reduce((acc, scan) => acc + (scan.items?.length || 0), 0) || 0;
  const avgEcoScore = history.length > 0 
    ? Math.round(history.reduce((acc, scan) => {
        const items = scan.items || [];
        if (items.length === 0) return acc;
        const score = items.reduce((sum, item) => sum + (Number(item.eco_score) || 0), 0) / items.length;
        return acc + (isNaN(score) ? 0 : score);
      }, 0) / history.length) || 0
    : 0;

  const chartData = Object.entries(categoryStats).map(([name, value]) => ({
    name,
    value,
    fill: CATEGORY_COLORS[name] || CATEGORY_COLORS.Other
  }));

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-10 relative z-10">
      {/* Latest Result Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between px-4">
          <h2 className="text-3xl font-black text-emerald-900">Latest Analysis</h2>
          <span className="text-emerald-500 font-bold">{new Date(latest.timestamp).toLocaleTimeString()}</span>
        </div>

        {latest.overall_advice && (
          <div className="glass-deep text-white p-8 rounded-[2.5rem] relative overflow-hidden">
            <div className="relative z-10 flex items-start gap-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-emerald-400 text-sm font-black uppercase tracking-widest mb-2">Segregation Advice</h3>
                <p className="text-lg font-medium leading-relaxed">{latest.overall_advice}</p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -mr-32 -mt-32" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          {latest.items && Array.isArray(latest.items) && latest.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info Card */}
              <div className="lg:col-span-2 glass rounded-[2.5rem] overflow-hidden flex flex-col">
                <div className="bg-emerald-600 p-8 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-4 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Item {index + 1}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      item.hazard_level === 'High' ? 'bg-red-500' : item.hazard_level === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      {item.hazard_level} Risk
                    </span>
                  </div>
                  <h2 className="text-4xl font-black mb-2">{item.item}</h2>
                  <div className="flex items-center gap-2 text-emerald-100">
                    {CATEGORY_ICONS[item.category]}
                    <span className="font-bold">{item.category} Waste</span>
                  </div>
                </div>
                
                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Recycle className="w-5 h-5" />
                      <span className="text-sm font-black uppercase tracking-widest">How to Recycle</span>
                    </div>
                    <p className="text-emerald-900 font-medium leading-relaxed glass-emerald p-4 rounded-2xl border border-emerald-100/50">
                      {item.recycling_method}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <Info className="w-5 h-5" />
                      <span className="text-sm font-black uppercase tracking-widest">Decomposition</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-900">{item.decomposition_time}</span>
                    </div>
                    <p className="text-sm text-emerald-600/70">Estimated time to break down in nature.</p>
                  </div>
                </div>
              </div>

              {/* Eco Score Gauge Card */}
              <div className="glass-deep rounded-[2.5rem] p-8 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-400 rounded-full blur-3xl" />
                </div>
                
                <h3 className="text-emerald-400 text-sm font-black uppercase tracking-widest mb-8">Eco Score</h3>
                
                <div className="relative w-48 h-48 mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-white/10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 - (282.7 * item.eco_score) / 100}
                      strokeLinecap="round"
                      className="text-emerald-400 transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black">{item.eco_score}</span>
                    <span className="text-emerald-400 font-bold">/ 100</span>
                  </div>
                </div>

                <div className={`px-6 py-2 rounded-full font-bold text-sm mb-4 ${
                  item.eco_score > 70 ? 'bg-emerald-500' : item.eco_score > 40 ? 'bg-amber-500' : 'bg-red-500'
                }`}>
                  {item.eco_score > 70 ? 'Eco Friendly' : item.eco_score > 40 ? 'Moderate Impact' : 'High Impact'}
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {item.recycled_products.slice(0, 3).map((product, i) => (
                    <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-tighter">
                      {product}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-emerald-900">Waste Distribution</h3>
            <div className="w-10 h-10 glass-emerald rounded-xl flex items-center justify-center text-emerald-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-10 rounded-[2.5rem] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-emerald-900">Your Progress</h3>
            <div className="w-10 h-10 glass-emerald rounded-xl flex items-center justify-center text-emerald-600">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-6 glass-emerald rounded-3xl">
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">Total Items</p>
              <p className="text-5xl font-black text-emerald-900">{totalItemsScanned}</p>
            </div>
            <div className="p-6 glass-emerald rounded-3xl">
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest mb-2">Avg Eco Score</p>
              <p className="text-5xl font-black text-emerald-900">{avgEcoScore}</p>
            </div>
          </div>

          <div className="flex-1 glass-deep rounded-3xl p-6 text-emerald-100 flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-sm leading-relaxed">
              "You've diverted <span className="text-white font-black">{totalItemsScanned} items</span> from potential landfill. That's equivalent to saving approximately <span className="text-white font-black">{((Number(totalItemsScanned) || 0) * 0.5).toFixed(1)}kg</span> of CO2 emissions!"
            </p>
          </div>
        </div>
      </div>

      {/* Recent Scans List */}
      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-10 border-b border-emerald-50 flex items-center justify-between">
          <h3 className="text-2xl font-black text-emerald-900">Recent Scans</h3>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const data = JSON.stringify(history, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ecoscan-report-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Download Report
            </button>
            <button 
              onClick={() => {
                // Simple state-less confirmation alternative: check if it's the second click
                const btn = document.getElementById('clear-history-btn');
                if (btn?.getAttribute('data-confirm') === 'true') {
                  localStorage.removeItem('ecoscan_history');
                  window.location.reload();
                } else {
                  if (btn) {
                    btn.innerText = 'Click again to confirm';
                    btn.setAttribute('data-confirm', 'true');
                    btn.classList.add('text-red-500');
                    setTimeout(() => {
                      if (btn) {
                        btn.innerText = 'Clear History';
                        btn.setAttribute('data-confirm', 'false');
                        btn.classList.remove('text-red-500');
                      }
                    }, 3000);
                  }
                }
              }}
              id="clear-history-btn"
              data-confirm="false"
              className="text-emerald-400 hover:text-red-500 font-bold text-sm transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
        <div className="divide-y divide-emerald-50">
          {history.length > 0 ? history.slice(0, 5).map((scan, idx) => {
            const items = scan.items || [];
            if (items.length === 0) return null;
            
            return (
              <div key={idx} className="p-8 flex items-center justify-between hover:bg-emerald-50/50 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 glass-emerald rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform relative">
                    {CATEGORY_ICONS[items[0].category]}
                    {items.length > 1 && (
                      <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        +{items.length - 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-black text-emerald-900">
                      {items.length > 1 
                        ? `${items[0].item} & ${items.length - 1} more`
                        : items[0].item}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-emerald-500">{items[0].category}</span>
                      <span className="w-1 h-1 bg-emerald-200 rounded-full" />
                      <span className="text-sm text-emerald-400">{new Date(scan.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-emerald-400 uppercase tracking-widest">Avg Eco Score</p>
                    <p className="font-bold text-emerald-900">
                      {Math.round(items.reduce((sum, item) => sum + (Number(item.eco_score) || 0), 0) / items.length) || 0}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl glass-emerald flex flex-col items-center justify-center border border-emerald-100/50">
                    <span className="text-xl font-black text-emerald-600">
                      {Math.round(items.reduce((sum, item) => sum + (Number(item.eco_score) || 0), 0) / items.length) || 0}
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Score</span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-20 text-center">
              <div className="w-20 h-20 glass-emerald rounded-full flex items-center justify-center mx-auto mb-6">
                <Recycle className="w-10 h-10 text-emerald-200" />
              </div>
              <p className="text-emerald-900 font-bold text-xl">No scans yet</p>
              <p className="text-emerald-500 mt-2">Start scanning to see your history here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sustainability Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Reduce First', desc: 'The best waste is the one never created. Buy in bulk to reduce packaging.', icon: <Leaf className="w-6 h-6" /> },
          { title: 'Clean it Up', desc: 'Rinse containers before recycling. Food residue can contaminate entire batches.', icon: <Droplets className="w-6 h-6" /> },
          { title: 'E-Waste Alert', desc: 'Never throw batteries or electronics in the trash. They contain toxic chemicals.', icon: <Zap className="w-6 h-6" /> }
        ].map((tip, i) => (
          <div key={i} className="glass-deep text-white p-10 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
              {tip.icon}
            </div>
            <h4 className="text-2xl font-black mb-4">{tip.title}</h4>
            <p className="text-emerald-100/80 text-lg leading-relaxed">{tip.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
