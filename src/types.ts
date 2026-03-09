export interface WasteItem {
  item: string;
  category: 'Plastic' | 'Organic' | 'Metal' | 'Paper' | 'Glass' | 'Hazardous' | 'E-waste' | 'Other';
  hazard_level: 'Low' | 'Medium' | 'High';
  recycling_method: string;
  environmental_impact: string;
  decomposition_time: string;
  recycled_products: string[];
  eco_score: number;
}

export interface WasteAnalysis {
  items: WasteItem[];
  overall_advice: string;
  timestamp: number;
}

export interface DashboardStats {
  category: string;
  count: number;
}

export type VoiceLanguage = 'en-US' | 'hi-IN' | 'te-IN' | 'kn-IN' | 'ml-IN' | 'mr-IN' | 'gu-IN' | 'ta-IN';

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  language: VoiceLanguage;
  timestamp: number;
}

export interface VoiceCommand {
  command: 'open_scanner' | 'open_dashboard' | 'open_history' | 'open_stats' | 'generate_letter' | 'open_action' | 'open_reporting' | 'none';
  response?: string;
  letterData?: {
    subject: string;
    body: string;
    recipient: string;
  };
}
