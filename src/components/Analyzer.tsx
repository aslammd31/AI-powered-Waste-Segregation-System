import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, RefreshCcw, CheckCircle2, AlertCircle, Zap, Globe } from 'lucide-react';
import { analyzeWasteImage } from '../services/gemini';
import { WasteAnalysis } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AnalyzerProps {
  onAnalysisComplete: (analysis: WasteAnalysis) => void;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        setIsComplete(false);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      setIsComplete(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg');
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
      
      setPreview(base64);
      setIsComplete(false);
      processImage(base64);
    }
  };

  const processImage = async (base64: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeWasteImage(base64);
      onAnalysisComplete(result);
      setIsComplete(true);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setError(null);
    setIsAnalyzing(false);
    setIsComplete(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 relative z-10">
      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-emerald-900 mb-3">Ready to Scan?</h2>
            <p className="text-emerald-600 font-medium">Choose your preferred method to identify your waste.</p>
          </div>

          <AnimatePresence mode="wait">
            {!preview && !isCameraActive ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-emerald-200/50 rounded-[2rem] hover:border-emerald-500 glass-emerald transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors" />
                  <div className="w-20 h-20 bg-emerald-100/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                    <Upload className="w-10 h-10 text-emerald-600" />
                  </div>
                  <span className="text-xl font-bold text-emerald-900">Upload Photo</span>
                  <span className="text-sm text-emerald-500 mt-2 font-medium">Select from your gallery</span>
                </button>

                <button
                  onClick={startCamera}
                  className="flex flex-col items-center justify-center p-10 bg-emerald-600 rounded-[2rem] hover:bg-emerald-700 transition-all group shadow-xl shadow-emerald-200/50 hover:shadow-emerald-300/50"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                    <Camera className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white">Open Camera</span>
                  <span className="text-sm text-emerald-100 mt-2 font-medium">Snap a live photo</span>
                </button>
              </motion.div>
            ) : isCameraActive ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative rounded-[2rem] overflow-hidden bg-black aspect-[4/3] shadow-2xl"
              >
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
                  <button
                    onClick={capturePhoto}
                    className="bg-white text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-transform border-8 border-emerald-600/20"
                  >
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      const stream = videoRef.current?.srcObject as MediaStream;
                      stream?.getTracks().forEach(track => track.stop());
                      setIsCameraActive(false);
                    }}
                    className="absolute right-8 bottom-4 glass-dark text-white px-6 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-[2rem] overflow-hidden shadow-2xl"
              >
                <img src={preview!} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center">
                    <div className="relative mb-8">
                      <div className="w-24 h-24 border-4 border-emerald-500/30 rounded-full animate-ping absolute inset-0" />
                      <div className="w-24 h-24 border-4 border-emerald-500 rounded-full animate-spin border-t-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-10 h-10 text-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-black mb-4">Analyzing...</h3>
                    <p className="text-emerald-100 text-lg max-w-xs mx-auto">Our AI is identifying the material and checking sustainability rules.</p>
                  </div>
                )}

                {isComplete && (
                  <div className="absolute inset-0 bg-emerald-600/80 backdrop-blur-xl flex flex-col items-center justify-center text-white p-10 text-center">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-white p-6 rounded-full shadow-2xl mb-8"
                    >
                      <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                    </motion.div>
                    <h3 className="text-3xl font-black mb-4">Success!</h3>
                    <p className="text-emerald-50 text-xl font-medium">We've identified your item. <br />Redirecting to your results...</p>
                  </div>
                )}

                {!isAnalyzing && !isComplete && (
                  <button
                    onClick={reset}
                    className="absolute top-6 right-6 glass p-3 rounded-2xl shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                  >
                    <RefreshCcw className="w-6 h-6 text-emerald-600" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-6 glass-red rounded-2xl flex items-center gap-4 text-red-700"
            >
              <div className="w-12 h-12 bg-red-100/50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">Something went wrong</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
              <button 
                onClick={reset}
                className="ml-auto px-4 py-2 bg-red-100/50 hover:bg-red-200/50 rounded-xl font-bold text-sm transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-8 text-emerald-500/50">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">AI Powered</span>
        </div>
        <div className="w-1 h-1 bg-emerald-200 rounded-full" />
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Eco Friendly</span>
        </div>
        <div className="w-1 h-1 bg-emerald-200 rounded-full" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Fast Results</span>
        </div>
      </div>
    </div>
  );
};
