import React, { useState, useEffect } from 'react';
import { Analyzer } from './components/Analyzer';
import { Dashboard } from './components/Dashboard';
import { VoiceAssistant } from './components/VoiceAssistant';
import { CivicReporting } from './components/CivicReporting';
import { WasteAnalysis, VoiceCommand } from './types';
import { Leaf, Recycle, BarChart3, Info, Github, Globe, Camera, Zap, CheckCircle2, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [history, setHistory] = useState<WasteAnalysis[]>([]);
  const [activeTab, setActiveTab] = useState<'scan' | 'dashboard' | 'action'>('scan');

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ecoscan_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migrate legacy data if needed
        const migrated = parsed.map((scan: any) => {
          if (!scan.items) {
            // This is legacy data, wrap it in the new structure
            return {
              items: [{
                item: scan.item,
                category: scan.category,
                hazard_level: scan.hazard_level,
                recycling_method: scan.recycling_method,
                environmental_impact: scan.environmental_impact,
                decomposition_time: scan.decomposition_time,
                recycled_products: scan.recycled_products || [],
                eco_score: scan.eco_score
              }],
              overall_advice: 'Legacy scan data.',
              timestamp: typeof scan.timestamp === 'string' ? new Date(scan.timestamp).getTime() : scan.timestamp
            };
          }
          return scan;
        });
        setHistory(migrated);
      } catch (e) {
        console.error('Failed to load history', e);
      }
    }
  }, []);

  const handleAnalysisComplete = (analysis: WasteAnalysis) => {
    const newHistory = [analysis, ...history];
    setHistory(newHistory);
    localStorage.setItem('ecoscan_history', JSON.stringify(newHistory));
    
    // Automatically switch to dashboard after scan to show results
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 1500);
  };

  const handleVoiceCommand = (command: VoiceCommand['command']) => {
    switch (command) {
      case 'open_scanner':
        setActiveTab('scan');
        break;
      case 'open_action':
      case 'open_reporting':
        setActiveTab('action');
        break;
      case 'open_dashboard':
      case 'open_history':
      case 'open_stats':
        setActiveTab('dashboard');
        // We could add sub-navigation within dashboard if needed
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f2] text-emerald-950 font-sans relative overflow-x-hidden">
      {/* Animated Bubbles Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="bubble w-96 h-96 -top-20 -left-20 animate-float" style={{ animationDelay: '0s' }} />
        <div className="bubble w-[30rem] h-[30rem] top-1/2 -right-40 animate-float" style={{ animationDelay: '-5s', backgroundColor: 'rgba(16, 185, 129, 0.05)' }} />
        <div className="bubble w-80 h-80 bottom-20 left-1/4 animate-float" style={{ animationDelay: '-10s', backgroundColor: 'rgba(52, 211, 153, 0.08)' }} />
        <div className="bubble w-64 h-64 top-1/4 right-1/3 animate-float" style={{ animationDelay: '-2s', backgroundColor: 'rgba(5, 150, 105, 0.03)' }} />
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant onCommand={handleVoiceCommand} />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-emerald-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200"
              >
                <Leaf className="w-6 h-6" />
              </motion.div>
              <span className="text-2xl font-black tracking-tight text-emerald-900">EcoScan</span>
            </div>
            
            <div className="flex glass-dark p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'scan' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-emerald-500 hover:text-emerald-700'
                }`}
              >
                <Recycle className="w-5 h-5" />
                Scan
              </button>
              <button
                onClick={() => setActiveTab('action')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'action' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-emerald-500 hover:text-emerald-700'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Action
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-emerald-500 hover:text-emerald-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Stats
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-12 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-emerald text-emerald-700 rounded-full text-sm font-bold mb-8">
              <Globe className="w-4 h-4" />
              Join 10,000+ eco-warriors
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-emerald-900 mb-6 tracking-tight leading-[1.1]">
              Waste Smarter, <br />
              <span className="text-emerald-600 italic">Live Greener.</span>
            </h1>
            <p className="text-xl text-emerald-700 max-w-2xl mx-auto mb-10 leading-relaxed">
              Not sure if it's recyclable? Just scan it. Our AI identifies any item and tells you exactly how to dispose of it responsibly.
            </p>
            
            {activeTab !== 'scan' && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('scan')}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
              >
                Start Scanning Now
              </motion.button>
            )}
          </motion.div>
        </div>
      </header>

      {/* How it Works Section */}
      {activeTab === 'scan' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Snap a Photo', desc: 'Take a picture of your waste item using your camera or upload an image.', icon: <Camera className="w-6 h-6" /> },
              { step: '02', title: 'AI Analysis', desc: 'Our Sustainable Intelligence identifies the material and its environmental impact.', icon: <Zap className="w-6 h-6" /> },
              { step: '03', title: 'Dispose Right', desc: 'Get clear instructions on recycling, composting, or safe disposal.', icon: <CheckCircle2 className="w-6 h-6" /> }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative p-8 glass rounded-3xl hover:shadow-xl transition-all group"
              >
                <span className="absolute top-4 right-6 text-4xl font-black text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">{item.step}</span>
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-2">{item.title}</h3>
                <p className="text-emerald-700/70 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'scan' ? (
            <motion.div
              key="scan-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <Analyzer onAnalysisComplete={handleAnalysisComplete} />
              
              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass p-8 rounded-3xl"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Global Impact</h3>
                  <p className="text-emerald-700/80">Every correctly sorted item reduces landfill waste and greenhouse gas emissions globally.</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass p-8 rounded-3xl"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <Recycle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Circular Economy</h3>
                  <p className="text-emerald-700/80">Proper recycling keeps valuable materials in the production cycle, saving energy and resources.</p>
                </motion.div>
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="glass p-8 rounded-3xl"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Smart Guidance</h3>
                  <p className="text-emerald-700/80">Get specific instructions for hazardous materials and electronic waste to prevent pollution.</p>
                </motion.div>
              </div>
            </motion.div>
          ) : activeTab === 'action' ? (
            <motion.div
              key="action-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <CivicReporting />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Dashboard history={history} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-emerald-900 text-emerald-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Leaf className="w-8 h-8 text-emerald-400" />
                <span className="text-2xl font-black text-white">EcoScan</span>
              </div>
              <p className="text-emerald-300 max-w-md mb-8">
                EcoScan uses advanced Gemini AI to help individuals and organizations manage waste more effectively. Together, we can build a more sustainable future.
              </p>
              <div className="flex gap-4">
                <a href="#" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4">Sustainability Tip</h4>
              <p className="text-emerald-200 italic">
                "The best waste is the waste that isn't produced. Consider reducing consumption and reusing items before recycling."
              </p>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/10 text-center text-emerald-400 text-sm">
            © 2024 EcoScan Sustainable Waste Intelligence. Powered by Gemini AI.
          </div>
        </div>
      </footer>
    </div>
  );
}
