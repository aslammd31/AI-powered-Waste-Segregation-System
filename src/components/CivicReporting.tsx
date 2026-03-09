import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Send, Trash2, AlertTriangle, MapPin, CheckCircle, Loader2, Mail, Building2, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface CivicReport {
  recipient: string;
  subject: string;
  body: string;
}

const ISSUES = [
  { id: 'garbage', label: 'Overflowing Bins', icon: <Trash2 className="w-5 h-5" />, color: 'bg-orange-100 text-orange-600' },
  { id: 'dumping', label: 'Illegal Dumping', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-100 text-red-600' },
  { id: 'hazard', label: 'Hazardous Waste', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600' },
  { id: 'drainage', label: 'Blocked Drainage', icon: <FileText className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600' },
];

export const CivicReporting: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<CivicReport | null>(null);
  const [isSent, setIsSent] = useState(false);

  const generateReport = async () => {
    if (!selectedIssue || !location) return;

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (process.env as any).GEMINI_API_KEY });
      const issueLabel = ISSUES.find(i => i.id === selectedIssue)?.label;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Draft a formal civic complaint letter to the local municipal authority about ${issueLabel} at ${location}. 
        Return ONLY a JSON object with keys: recipient (e.g. The Municipal Commissioner), subject, and body.`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text || '{}');
      setReport(data);
    } catch (error) {
      console.error("Failed to generate report", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setReport(null);
      setSelectedIssue(null);
      setLocation('');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto relative z-10">
      <div className="glass rounded-3xl overflow-hidden">
        <div className="p-8 border-b border-emerald-100/50 glass-emerald">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-black text-emerald-900">Civic Action Center</h2>
          </div>
          <p className="text-emerald-700/70">Report environmental issues directly to your local municipality.</p>
        </div>

        <div className="p-8">
          {!report ? (
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-4 uppercase tracking-wider">
                  1. Select the Issue
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {ISSUES.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue.id)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                        selectedIssue === issue.id
                          ? 'border-emerald-600 glass-emerald shadow-md'
                          : 'border-emerald-100/50 bg-white/50 hover:border-emerald-200'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${issue.color.replace('bg-', 'bg-opacity-50 bg-')}`}>
                        {issue.icon}
                      </div>
                      <span className="text-sm font-bold text-center">{issue.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-900 mb-4 uppercase tracking-wider">
                  2. Location Details
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter street name, landmark, or area..."
                    className="w-full pl-12 pr-4 py-4 glass-emerald border-2 border-emerald-100/50 rounded-2xl focus:border-emerald-500 focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateReport}
                disabled={!selectedIssue || !location || isGenerating}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-200/50 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Drafting Formal Letter...
                  </>
                ) : (
                  <>
                    <FileText className="w-6 h-6" />
                    Generate Civic Report
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="glass-emerald p-6 rounded-2xl border border-emerald-100/50 relative">
                <div className="absolute top-4 right-4 text-emerald-300">
                  <Mail className="w-12 h-12 opacity-20" />
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">To:</span>
                    <p className="font-bold text-emerald-900">{report.recipient}</p>
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Subject:</span>
                    <p className="font-bold text-emerald-900">{report.subject}</p>
                  </div>
                  <div className="pt-4 border-t border-emerald-100/50">
                    <p className="text-emerald-800 leading-relaxed whitespace-pre-wrap">{report.body}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setReport(null)}
                  className="flex-1 py-4 glass border-2 border-emerald-100/50 text-emerald-600 rounded-2xl font-bold hover:bg-white transition-all"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSent}
                  className={`flex-[2] py-4 rounded-2xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isSent 
                      ? 'bg-emerald-100 text-emerald-600 shadow-none' 
                      : 'bg-emerald-600 text-white shadow-emerald-200/50 hover:bg-emerald-700'
                  }`}
                >
                  {isSent ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Report Submitted!
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      Send to Municipality
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass p-6 rounded-2xl flex items-start gap-4"
        >
          <div className="w-10 h-10 bg-blue-100/50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 mb-1">Why report?</h4>
            <p className="text-sm text-emerald-700/70 leading-relaxed">Reporting issues helps authorities prioritize cleanup and maintenance in your neighborhood.</p>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5 }}
          className="glass p-6 rounded-2xl flex items-start gap-4"
        >
          <div className="w-10 h-10 glass-emerald rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 mb-1">Official Format</h4>
            <p className="text-sm text-emerald-700/70 leading-relaxed">Our AI ensures your letter follows standard administrative protocols for faster processing.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
