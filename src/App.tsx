/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Configure Monaco Loader with a reliable version
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs'
  }
});

import { 
  Play, 
  Terminal, 
  Code2, 
  Layout, 
  Trash2, 
  FileCode, 
  History,
  Box,
  Cpu,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Share2,
  Download,
  Save,
  Settings,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Types
type Language = 'html' | 'javascript' | 'python' | 'java' | 'cpp' | 'php';
type View = 'landing' | 'editor';

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: string;
}

interface ProjectTemplate {
  name: string;
  lang: Language;
  description: string;
  code: string;
}

// Initial Code Templates
const INITIAL_CODE: Record<Language, string> = {
  html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: white; }
    h1 { font-size: 3rem; color: #38bdf8; margin-bottom: 0.5rem; }
    p { font-size: 1.25rem; color: #94a3b8; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Hello World</h1>
    <p>Welcome to MiniCompile Live HTML Preview</p>
  </div>
</body>
</html>`,
  javascript: `// JavaScript Playground
function greet(name) {
  console.log("Initializing process...");
  return \`Heads up, \${name}! Code is executing correctly.\`;
}

const result = greet("Developer");
console.log(result);

// Try an asynchronous task
setTimeout(() => {
  console.info("Async task completed after 1 second.");
}, 1000);
`,
  python: `# Python (AI Simulated Execution)
def fibonacci(n):
    a, b = 0, 1
    for i in range(n):
        print(a, end=' ')
        a, b = b, a + b

print("Fibonacci Sequence up to 10 terms:")
fibonacci(10)

# Complex math
print("\\n\\nScientific calculation:")
result = (2 * 45) ** 0.5
print(f"sqrt(90) = {result}")
`,
  java: `// Java Execution (AI Sandbox)
// Note: Android/APK features are not supported here.
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
        
        int n = 10;
        int t1 = 0, t2 = 1;
        System.out.print("First " + n + " terms: ");

        for (int i = 1; i <= n; ++i) {
            System.out.print(t1 + " + ");
            int sum = t1 + t2;
            t1 = t2;
            t2 = sum;
        }
    }
}`,
  cpp: `// C++ Execution (AI Sandbox)
#include <iostream>
using namespace std;

int main() {
    cout << "Welcome to the C++ Compiler!" << endl;
    
    int n1=0, n2=1, n3, i, number;    
    cout << "Enter the number of elements: ";    
    number = 10;
    cout << n1 << " " << n2 << " "; 
    
    for(i=2; i<number; ++i) {    
        n3 = n1 + n2;    
        cout << n3 << " ";    
        n1 = n2;    
        n2 = n3;    
    }    
    return 0;  
}`,
  php: `<?php
// PHP Execution (AI Sandbox)
echo "Hello from MiniCompile PHP!\\n";

$fruits = ["Apple", "Banana", "Cherry"];
foreach ($fruits as $fruit) {
    echo "Processing fruit: $fruit\\n";
}

$date = date("Y-m-d H:i:s");
echo "Current Server Time (Simulated): $date";
?>`
};

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [language, setLanguage] = useState<Language>('html');
  const [code, setCode] = useState<string>(INITIAL_CODE['html']);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [output, setOutput] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSharable, setIsSharable] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'community' | 'templates'>('all');
  const [isMonacoReady, setIsMonacoReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const communityProjects = [
    { name: "Binary Search Implementation", lang: "cpp", author: "CoderX", likes: 124 },
    { name: "Responsive Dashboard Template", lang: "html", author: "WebWizard", likes: 89 },
    { name: "Data Processing Pipeline", lang: "python", author: "PyExpert", likes: 215 },
    { name: "Matrix Multiplication", lang: "java", author: "JavaGuru", likes: 56 },
  ];

  const templatesProjects: ProjectTemplate[] = [
    { 
      name: "Modern Login Page", 
      lang: "html", 
      description: "A clean, dark-themed login interface with Tailwind CSS styling.",
      code: `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0f172a; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: 'Inter', sans-serif; }
  </style>
</head>
<body>
  <div class="bg-gray-800 p-10 rounded-3xl border border-gray-700 shadow-2xl w-full max-w-md">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-black text-white mb-2">Welcome Back</h1>
      <p class="text-gray-400 text-sm">Enter your credentials to access the nexus</p>
    </div>
    <div class="space-y-6">
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
        <input type="email" placeholder="dev@example.com" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all">
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Security Key</label>
        <input type="password" placeholder="••••••••" class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all">
      </div>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">Authenticate</button>
    </div>
    <p class="text-center mt-8 text-xs text-gray-500">System secured by AES-256 Encryption</p>
  </div>
</body>
</html>`
    },
    {
      name: "Bubble Sort Visualizer",
      lang: "javascript",
      description: "Educational implementation of the Bubble Sort algorithm with step-by-step logs.",
      code: `// Bubble Sort Logger
function bubbleSort(arr) {
    let n = arr.length;
    console.log("Original Array:", arr);
    
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap
                console.info(\`Swapping \${arr[j]} and \${arr[j+1]}\`);
                let temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
        console.log(\`Step \${i + 1} completed:\`, [...arr]);
    }
    return arr;
}

const data = [64, 34, 25, 12, 22, 11, 90];
const sorted = bubbleSort(data);
console.log("FINAL SORTED ARRAY:", sorted);`
    },
    {
      name: "AI Stock Predictor (Mock)",
      lang: "python",
      description: "A Python model skeleton simulating stock data analysis.",
      code: `# AI Growth Predictor Simulation
import random

class GrowthModel:
    def __init__(self, ticker):
        self.ticker = ticker
        self.history = [random.uniform(100, 500) for _ in range(10)]
    
    def predict_next(self):
        avg = sum(self.history) / len(self.history)
        volatility = random.uniform(-0.05, 0.05)
        prediction = avg * (1 + volatility)
        return round(prediction, 2)

model = GrowthModel("NVDA")
print(f"Analyzing historical data for {model.ticker}...")
for i in range(5):
    print(f"Day {i+1} Prediction: \${model.predict_next()}")`
    }
  ];

  // Initialize from URL or LocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get('code');
    const sharedLang = params.get('lang') as Language;

    if (sharedCode && sharedLang) {
      try {
        const decoded = atob(sharedCode);
        setCode(decoded);
        setLanguage(sharedLang);
        setView('editor');
        addLog(`Shared ${sharedLang.toUpperCase()} project loaded!`, 'info');
      } catch (e) {
        console.error("Failed to decode shared code");
      }
    } else {
      const savedCode = localStorage.getItem('minicompile_last_code');
      const savedLang = localStorage.getItem('minicompile_last_lang') as Language;
      const savedName = localStorage.getItem('minicompile_last_name');
      
      if (savedCode && savedLang) {
        setCode(savedCode);
        setLanguage(savedLang);
        if (savedName) setProjectName(savedName);
      }
    }
  }, []);

  // Save to LocalStorage on changes
  useEffect(() => {
    if (view === 'editor') {
      localStorage.setItem('minicompile_last_code', code);
      localStorage.setItem('minicompile_last_lang', language);
      localStorage.setItem('minicompile_last_name', projectName);
    }
  }, [code, language, projectName, view]);

  const addLog = (content: string, type: ConsoleLog['type'] = 'log') => {
    const newLog: ConsoleLog = {
      content,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setConsoleLogs(prev => [...prev, newLog]);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setConsoleLogs([]);

    if (language === 'html') {
      setOutput(code);
      addLog("HTML/CSS Preview updated", "info");
      setIsRunning(false);
    } else if (language === 'javascript') {
      try {
        const createCapturedLog = (content: any[], type: ConsoleLog['type']): ConsoleLog => ({
          content: content.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          type,
          timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });

        const executeWithCapture = new Function('console', `
          try {
            ${code}
          } catch (e) {
            console.error(e);
          }
        `);

        const proxyConsole = {
          log: (...args: any[]) => addLog(createCapturedLog(args, 'log').content, 'log'),
          info: (...args: any[]) => addLog(createCapturedLog(args, 'info').content, 'info'),
          warn: (...args: any[]) => addLog(createCapturedLog(args, 'warn').content, 'warn'),
          error: (...args: any[]) => addLog(createCapturedLog(args, 'error').content, 'error'),
        };

        executeWithCapture(proxyConsole);
        addLog("Execution finished", "info");
      } catch (err) {
        addLog(`Compilation Error: ${String(err)}`, 'error');
      } finally {
        setIsRunning(false);
      }
    } else if (language === 'python' || language === 'java' || language === 'cpp' || language === 'php') {
      addLog(`Connecting to ${language.toUpperCase()} execution engine (AI)...`, "info");
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Execute this ${language.toUpperCase()} code and return ONLY the stdout/stderr output as it would appear in a terminal.
          Code:
          \`\`\`${language}
          ${code}
          \`\`\`
          
          If there are errors, include them. If successful, show the exact output. Do not add any preamble or markdown outside the code block.`,
          config: {
            systemInstruction: `You are a precise ${language.toUpperCase()} compiler and runtime. Return only the output of the provided code. If the code has errors, simulate the traceback. Do not explain the code.`
          }
        });

        const terminalOutput = response.text || "Execution finished with no output.";
        terminalOutput.split('\n').forEach(line => {
          if (line.trim()) addLog(line);
        });
        addLog(`${language.toUpperCase()} (Simulated) execution complete`, "info");
      } catch (err: any) {
        let errorMsg = String(err);
        if (err.message?.includes('API_KEY')) {
          errorMsg = "API Key error: Check your GEMINI_API_KEY in the Secrets panel.";
        }
        addLog(errorMsg, "error");
      } finally {
        setIsRunning(false);
      }
    }
  };

  const handleClear = () => {
    setConsoleLogs([]);
    if (language === 'html') setOutput('');
  };

  // Initialize Gemini
  const ai = React.useMemo(() => {
    let key = '';
    try {
      // Use window.process for browser compatibility in some environments
      key = ((window as any).process?.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
    } catch (e) {
      console.warn("API Key access error", e);
    }
    return new GoogleGenAI({ apiKey: key || '' });
  }, []);

  const hasApiKey = React.useMemo(() => {
    try {
      const key = ((window as any).process?.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
      return !!key;
    } catch (e) {
      return false;
    }
  }, []);

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setCode(INITIAL_CODE[lang]);
    setConsoleLogs([]);
    setOutput('');
    setView('editor');
  };

  const handleDownload = () => {
    const extensions: Record<Language, string> = {
      html: 'html',
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      php: 'php'
    };
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.${extensions[language]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog("Source code downloaded successfully", "info");
  };

  const handleShare = () => {
    const encoded = btoa(code);
    const url = `${window.location.origin}${window.location.pathname}?lang=${language}&code=${encoded}`;
    navigator.clipboard.writeText(url);
    setIsSharable(true);
    addLog("Share link copied to clipboard!", "info");
    setTimeout(() => setIsSharable(false), 3000);
  };

  const languagesMeta = [
    { id: 'html' as Language, name: 'HTML', icon: <Box className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'javascript' as Language, name: 'JavaScript', icon: <Code2 className="w-8 h-8" />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'python' as Language, name: 'Python', icon: <Terminal className="w-8 h-8" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'java' as Language, name: 'Java', icon: <Cpu className="w-8 h-8" />, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'cpp' as Language, name: 'C++', icon: <Code2 className="w-8 h-8" />, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'php' as Language, name: 'PHP', icon: <FileCode className="w-8 h-8" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setLanguage(template.lang);
    setCode(template.code);
    setProjectName(template.name);
    setConsoleLogs([]);
    setOutput('');
    setView('editor');
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen relative overflow-hidden bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Animated Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 blur-[120px] rounded-full animate-float" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/30 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-3s' }} />
        </div>

        {/* Header */}
        <header className="h-20 border-b border-gray-100/50 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter text-gray-900">MiniCompile</span>
          </div>
          <nav className="hidden md:flex items-center gap-10 text-[13px] font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Popular</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Programming</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Web</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Databases</a>
            <button 
              onClick={() => setView('editor')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 font-bold uppercase text-[11px] tracking-widest active:scale-95"
            >
              Open Editor
            </button>
          </nav>
          <button className="md:hidden p-2 text-gray-500">
            <MoreVertical className="w-6 h-6" />
          </button>
        </header>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 text-center max-w-6xl mx-auto z-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-10 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Network Live: 14,204 Active Compilers</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight text-gray-900 mb-10 leading-[1.05]"
          >
            Public Code. <br/>
            <span className="trending-gradient-text">Zero Setup.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-2xl mb-16 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            Empowering 12.8 million innovators to write, run, and share code in the ultimate cloud-native development playground.
          </motion.p>
          
          {/* Search Box */}
          <div className="relative max-w-3xl mx-auto mb-16 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-25 transition duration-1000"></div>
            <div className="relative">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <RefreshCw className="w-6 h-6 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text" 
                placeholder="Find a language, template, or community project..." 
                className="w-full pl-16 pr-6 py-6 bg-white border-2 border-gray-100 rounded-[2rem] focus:border-blue-500 outline-none transition-all shadow-2xl shadow-gray-200/50 text-gray-800 placeholder:text-gray-300 font-semibold text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Categories Pill Nav */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {['All Projects', 'Community Feed', 'Templates'].map(cat => (
              <button 
                key={cat} 
                onClick={() => {
                  if (cat === 'Community Feed') setActiveTab('community');
                  else if (cat === 'Templates') setActiveTab('templates');
                  else setActiveTab('all');
                }}
                className={`px-6 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                  (activeTab === 'community' && cat === 'Community Feed') || 
                  (activeTab === 'templates' && cat === 'Templates') ||
                  (activeTab === 'all' && cat === 'All Projects')
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'all' ? (
              <motion.div 
                key="languages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 max-w-7xl mx-auto h-auto md:h-[600px]"
              >
                {languagesMeta.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5).map((lang, idx) => {
                  const gridPos = [
                    "md:col-span-2 md:row-span-2", // Big feature
                    "md:col-span-1 md:row-span-1",
                    "md:col-span-1 md:row-span-1",
                    "md:col-span-1 md:row-span-1",
                    "md:col-span-1 md:row-span-1"
                  ][idx] || "md:col-span-1 md:row-span-1";
                  
                  return (
                    <motion.div
                      key={lang.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1, type: 'spring' }}
                      whileHover={{ scale: 1.02, rotate: idx % 2 === 0 ? 0.5 : -0.5 }}
                      onClick={() => selectLanguage(lang.id)}
                      className={`${gridPos} bento-card flex flex-col items-center justify-center gap-6 cursor-pointer group`}
                    >
                      <div className={`p-8 rounded-[2rem] ${lang.bg} ${lang.color} group-hover:scale-110 transition-all duration-700 shadow-sm group-hover:shadow-xl relative`}>
                        {lang.icon}
                        <div className="absolute -inset-4 bg-inherit opacity-20 blur-2xl rounded-full group-hover:opacity-40 transition-opacity" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-black text-gray-900 text-3xl tracking-tighter mb-2">{lang.name}</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">
                          {lang.id === 'html' || lang.id === 'javascript' || lang.id === 'python' ? 'High Performance Runtime' : 'Isolated Virtual Env'}
                        </p>
                      </div>
                      
                      {idx === 0 && (
                        <div className="mt-4 flex gap-2">
                           <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase">Live Output</span>
                           <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase">AI Assisted</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : activeTab === 'community' ? (
              <motion.div 
                key="community"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
              >
                {communityProjects.map((p, i) => (
                  <div key={i} className="flex bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all cursor-pointer group text-left">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mr-6 group-hover:bg-blue-50 transition-colors">
                      <FileCode className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 mb-1">{p.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        <span className="text-blue-500">{p.lang}</span>
                        <span>•</span>
                        <span>@{p.author}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> {p.likes}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="col-span-1 md:col-span-2 py-10 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100 flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-bold text-blue-600 mb-2">Want to see your code here?</p>
                  <p className="text-xs text-blue-400">Public your project from the editor to join the community!</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="templates"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
              >
                {templatesProjects.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).map((tmpl, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => handleTemplateSelect(tmpl)}
                    className="bg-white border border-gray-100 rounded-3xl p-8 text-left group cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                       <Zap className="w-12 h-12 text-blue-600" />
                    </div>
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                      {tmpl.lang}
                    </div>
                    <h3 className="font-black text-xl text-gray-900 mb-2">{tmpl.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-6">{tmpl.description}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-blue-600 font-bold text-xs">Load Blueprint</span>
                       <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Last Project Peek */}
        {localStorage.getItem('minicompile_last_code') && (
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <FileCode className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">Continue where you left off</h4>
                  <p className="text-xs text-gray-400 font-medium">Last project: {localStorage.getItem('minicompile_last_name') || 'Untitled'}</p>
                </div>
              </div>
              <button 
                onClick={() => setView('editor')}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
              >
                Resume Workspace
              </button>
            </div>
          </div>
        )}

        {/* Company Loyalty Section */}
        <section className="py-24 border-y border-gray-50 bg-gray-50/30">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em] mb-16">Trusted by developers at world's top companies</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center opacity-30 grayscale saturate-0 contrast-125">
              <span className="text-3xl font-black italic">Google</span>
              <span className="text-3xl font-black italic">Microsoft</span>
              <span className="text-3xl font-black italic">Meta</span>
              <span className="text-3xl font-black italic">Amazon</span>
              <span className="text-3xl font-black italic">Netflix</span>
              <span className="text-3xl font-black italic">Stripe</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-4 bg-gray-50/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
              <div>
                <span className="text-blue-600 font-bold text-[11px] uppercase tracking-widest mb-4 block">Engineered for focus</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight">The developer's edge. Now online.</h2>
                <div className="space-y-6">
                  {[
                    { icon: <Zap className="w-5 h-5" />, title: "Instant Execution", text: "Zero environment setup. Run code in milliseconds across 60+ languages." },
                    { icon: <Shield className="w-5 h-5" />, title: "Safe Sandboxing", text: "Enterprise-grade isolation ensures your code runs in a secure, transient environment." },
                    { icon: <Globe className="w-5 h-5" />, title: "Collaborative Ready", text: "One-click sharing with persistent URL snapshots of your logic." }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm shrink-0 text-blue-600">
                        {feat.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{feat.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{feat.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="bg-[#121418] rounded-3xl p-4 shadow-2xl relative border border-white/5">
                   <div className="flex gap-1.5 mb-4 px-2">
                     <div className="w-2 h-2 rounded-full bg-red-500/50" />
                     <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                     <div className="w-2 h-2 rounded-full bg-green-500/50" />
                   </div>
                   <div className="space-y-2 opacity-50">
                     <div className="h-4 bg-white/10 rounded-md w-3/4" />
                     <div className="h-4 bg-white/10 rounded-md w-1/2" />
                     <div className="h-4 bg-white/10 rounded-md w-5/6" />
                     <div className="h-4 bg-white/10 rounded-md w-2/3" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Purpose Section */}
        <section className="py-32 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-gray-900 mb-6">APIs, Editor embedding & more</h2>
            <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="group cursor-default">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
                <Layout className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-black text-xl mb-4 text-gray-900">Embed Editor & Challenges</h3>
              <p className="text-gray-400 text-sm leading-loose">Embed our Editor & Challenges as an iFrame into your website to get the code execution capabilities in minutes.</p>
              <button className="mt-6 text-blue-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">Read Documentation <ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <div className="group cursor-default">
              <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
                <Code2 className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-black text-xl mb-4 text-gray-900">APIs to run code</h3>
              <p className="text-gray-400 text-sm leading-loose">Build more complex use-cases by calling our APIs from your backend applications to run code, read reports etc.,</p>
              <button className="mt-6 text-pink-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">Explore APIs <ChevronRight className="w-4 h-4" /></button>
            </div>
            
            <div className="group cursor-default">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform">
                <Terminal className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="font-black text-xl mb-4 text-gray-900">Custom workflows</h3>
              <p className="text-gray-400 text-sm leading-loose">Reach out to us to build custom workflows that are not covered by APIs, to solve your specific technical use-cases.</p>
              <button className="mt-6 text-indigo-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">Contact Sales <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#121418] text-gray-500 py-32 px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-20">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <span className="font-black text-2xl text-white tracking-tighter">MiniCompile</span>
              </div>
              <p className="text-sm leading-loose max-w-xs mb-10">The world's most versatile online code execution platform. Supporting 60+ languages and cloud-native scaling.</p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/5 rounded-full hover:bg-blue-600 transition-colors cursor-pointer" />
                <div className="w-10 h-10 bg-white/5 rounded-full hover:bg-blue-600 transition-colors cursor-pointer" />
                <div className="w-10 h-10 bg-white/5 rounded-full hover:bg-blue-600 transition-colors cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-10">Products</h4>
              <ul className="space-y-6 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Compiler SDK</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Interview Tool</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Pro Plans</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-10">Languages</h4>
              <ul className="space-y-6 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Python</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">JavaScript</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Java</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Rust</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-10">Legal</h4>
              <ul className="space-y-6 text-sm font-medium">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">© Copyright 2026 MiniCompile Pvt. Ltd. | All rights reserved.</p>
            <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Status</a>
              <a href="#" className="hover:text-white transition-colors">Uptime</a>
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div id="app-container" className="h-screen w-full flex flex-col bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Editor Header */}
      <header id="header" className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-white/70 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('landing')}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-all border border-transparent hover:border-gray-200 group"
            title="Go Home"
          >
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 rotate-180 transition-all" />
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2 group flex-1 min-w-0 max-w-md">
            <input 
              type="text" 
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-b border-transparent focus:border-blue-600 outline-none text-gray-900 font-extrabold text-sm px-1 py-1 w-full truncate"
              placeholder="Project Name"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
            {(['html', 'javascript', 'python', 'java', 'cpp', 'php'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${
                  language === lang 
                    ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10 border border-blue-50' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-800 mx-2 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${isSharable ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-blue-50/50 border-blue-100 text-blue-500 hidden md:block'}`}>
              {isSharable ? 'Snap Copied' : 'Status: Public'}
            </div>
            <button 
              onClick={handleShare}
              className={`p-2.5 rounded-xl transition-all border border-gray-100 hover:bg-gray-50 group relative ${isSharable ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              {isSharable ? <CheckCircle className="w-4 h-4 text-blue-600" /> : <Share2 className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />}
            </button>
            
            <button 
              onClick={handleDownload}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all"
            >
              <Download className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-blue-600 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl font-black text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-blue-500/20 animate-pulse-glow`}
          >
            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />}
            <span className="hidden xs:inline tracking-widest">{isRunning ? '...' : 'EXECUTE'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main id="workspace" className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4 min-h-0">
        {!hasApiKey && ['python', 'java', 'cpp', 'php'].includes(language) && (
          <div className="absolute top-0 left-0 w-full bg-red-500/90 text-white text-[10px] text-center py-1 z-[100] backdrop-blur-sm font-bold animate-pulse">
            AI Engine ({language.toUpperCase()}) requires a GEMINI_API_KEY secret to run.
          </div>
        )}
        {/* Editor Pane */}
        <section id="editor-section" className="flex-[2] flex flex-col bg-[#1f2833]/50 rounded-xl sm:rounded-2xl border border-[#45a29e]/20 overflow-hidden shadow-2xl backdrop-blur-sm min-h-[300px]">
          <div className="h-10 sm:h-11 border-b border-[#45a29e]/10 flex items-center justify-between px-4 bg-[#0b0c10]/40 shrink-0">
            <div className="flex items-center gap-3">
              <FileCode className="w-4 h-4 text-[#66fcf1]" />
              <span className="text-[10px] sm:text-[11px] font-black text-[#c5c6c7] uppercase tracking-widest">main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : 'html'}</span>
            </div>
            <div className="flex sm:hidden items-center bg-[#1f2833] rounded-md px-2 py-1 border border-[#45a29e]/20">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#66fcf1] outline-none"
              >
                <option value="html">HTML</option>
                <option value="javascript">JS</option>
                <option value="python">PY</option>
                <option value="java">JAVA</option>
                <option value="cpp">C++</option>
                <option value="php">PHP</option>
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden dark-glass rounded-2xl border-white/5 mx-2 my-1">
            {!isMonacoReady && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0c10]/95 backdrop-blur-xl gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
                  <RefreshCw className="w-12 h-12 text-[#66fcf1] animate-spin relative z-10" />
                </div>
                <p className="text-[10px] font-black text-[#66fcf1] uppercase tracking-[0.4em] animate-pulse">Initializing Neural Sandbox...</p>
              </div>
            )}
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'html'}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              onMount={(editor, monaco) => {
                setIsMonacoReady(true);
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  handleRun();
                });
              }}
              options={{
                fontSize: fontSize,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                padding: { top: 20 },
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                roundedSelection: true,
                backgroundColor: '#1f2833',
              }}
            />
          </div>
          <div className="h-8 bg-[#0b0c10]/60 border-t border-[#45a29e]/10 flex items-center justify-between px-4 shrink-0 overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isMonacoReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500 animate-pulse'}`} />
                <span className="text-[9px] font-bold text-[#45a29e] uppercase tracking-wider">{isMonacoReady ? 'Runtime: Online' : 'Runtime: Readying'}</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-[#45a29e]/10 pl-4">
                <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                <span className="text-[9px] font-bold text-[#45a29e] uppercase tracking-wider">{hasApiKey ? 'AI Core: Link' : 'AI Core: Ghost'}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-[#45a29e]/60 uppercase tracking-widest">
               <span className="hidden sm:block">UTF-8 • {code.length} chars</span>
               <div className="w-px h-3 bg-[#45a29e]/20 hidden sm:block" />
               <span className="text-[#66fcf1] drop-shadow-[0_0_5px_rgba(102,252,241,0.5)]">{language.toUpperCase()} ENGINE</span>
            </div>
          </div>
        </section>

        {/* Console / Preview Pane */}
        <aside id="output-section" className="flex-1 lg:w-[450px] lg:flex-none flex flex-col gap-2 sm:gap-4 overflow-hidden min-h-0">
          {/* Live Preview for HTML */}
          {language === 'html' && (
            <div id="html-preview" className="flex-1 flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 shadow-2xl transition-all duration-500 min-h-[200px]">
              <div className="h-10 sm:h-11 bg-[#f8f9fa] border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4 text-gray-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] font-bold">Preview Environment</span>
                </div>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-300" />
                  <div className="w-2 h-2 rounded-full bg-yellow-300" />
                  <div className="w-2 h-2 rounded-full bg-green-300" />
                </div>
              </div>
              <div className="flex-1 bg-white relative">
                {!output ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200 gap-4">
                    <Box className="w-12 h-12 sm:w-16 sm:h-16 opacity-10" />
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Awaiting Render</p>
                  </div>
                ) : (
                  <iframe
                    ref={iframeRef}
                    title="preview"
                    srcDoc={output}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>
            </div>
          )}

          {/* Console / Terminal Output */}
          <div id="console-output" className={`${language === 'html' ? 'h-[200px] sm:h-[300px]' : 'flex-1'} flex flex-col bg-[#0b0c10] rounded-xl sm:rounded-2xl border border-[#45a29e]/20 overflow-hidden shadow-2xl relative min-h-[150px]`}>
            <div className="h-10 sm:h-11 border-b border-[#45a29e]/10 flex items-center justify-between px-4 bg-[#1f2833]/30 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#66fcf1]" />
                <span className="text-[10px] sm:text-[11px] font-black text-[#66fcf1] uppercase tracking-widest">Compiler Output</span>
              </div>
              <button 
                onClick={handleClear}
                className="p-1.5 hover:bg-[#66fcf1]/10 rounded-lg transition-colors group"
                title="Clear Console"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#45a29e] group-hover:text-[#66fcf1]" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[13px] space-y-2.5 scrollbar-thin scrollbar-thumb-[#45a29e]/30 scrollbar-track-transparent">
              <AnimatePresence initial={false}>
                {consoleLogs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#45a29e]/20 space-y-4">
                    <Terminal className="w-12 h-12 opacity-5" />
                    <p className="text-[9px] font-black uppercase tracking-[0.4em]">System IDLE - Ready for Execution</p>
                  </div>
                ) : (
                  consoleLogs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-4 leading-relaxed py-1 border-l-2 pl-4 transition-all ${
                        log.type === 'error' ? 'text-red-400 border-red-500/50' :
                        log.type === 'info' ? 'text-[#66fcf1] border-[#66fcf1]/50 bg-[#66fcf1]/5' :
                        log.type === 'warn' ? 'text-yellow-400 border-yellow-500/50' :
                        'text-[#c5c6c7] border-[#45a29e]/20'
                      }`}
                    >
                      <span className="text-[#45a29e] text-[9px] select-none opacity-40 shrink-0 mt-1 font-sans font-bold">[{log.timestamp}]</span>
                      <span className="break-all whitespace-pre-wrap font-medium">{log.content}</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Terminal Status Bar */}
            <div className="h-7 bg-[#1f2833]/50 border-t border-[#45a29e]/10 flex items-center justify-between px-4">
              <div className="flex items-center gap-6 text-[9px] font-black text-[#45a29e] uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-yellow-400 animate-pulse' : 'bg-[#66fcf1]'}`} />
                  {isRunning ? 'Busy' : 'Live'}
                </div>
                <span>Engine: V8 Runtime</span>
                <span>Latency: 12ms</span>
              </div>
              <div className="text-[9px] font-black text-[#45a29e]/40 uppercase tracking-widest">
                Connected
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Footer Info */}
      <footer id="footer" className="h-9 bg-[#0b0c10] border-t border-[#1f2833] flex items-center justify-between px-6 text-[10px] font-bold text-[#45a29e] uppercase tracking-[0.2em]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <History className="w-3 h-3" />
            Last run: {consoleLogs.length > 0 ? consoleLogs[consoleLogs.length-1].timestamp : 'N/A'}
          </div>
          <div className="flex items-center gap-2">
            <Code2 className="w-3 h-3" />
            Language: {language}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-[#66fcf1]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#66fcf1]" />
            Compiler Active
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#1f2833] w-full max-w-md rounded-2xl border border-[#45a29e]/30 shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-[#45a29e]/10 flex items-center justify-between">
                <h3 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#66fcf1]" />
                  Workspace Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-[#45a29e] hover:text-[#66fcf1]">
                  <Copy className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <label className="text-[10px] font-black text-[#45a29e] uppercase tracking-widest mb-4 block">Font size</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="range" 
                      min="10" 
                      max="24" 
                      value={fontSize} 
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 accent-[#66fcf1] h-1 bg-[#0b0c10] rounded-full appearance-none"
                    />
                    <span className="text-white font-mono text-xs w-8">{fontSize}px</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-[#45a29e] uppercase tracking-widest mb-4 block">Editor Theme (Coming Soon)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="bg-[#66fcf1] text-[#0b0c10] py-4 rounded-xl font-bold text-xs">Dark Nexus</button>
                    <button disabled className="bg-gray-800 text-gray-500 py-4 rounded-xl font-bold text-xs cursor-not-allowed">Cloud Light</button>
                  </div>
                </div>
                
                <div className="pt-4 text-center">
                   <p className="text-[9px] text-[#45a29e] font-medium leading-relaxed opacity-50 uppercase tracking-[0.2em]">All settings are automatically saved to your local environment.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .monaco-editor, .monaco-editor .margin, .monaco-editor .inputarea.ime-input {
          background-color: #1f2833 !important;
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0b0c10;
        }
        ::-webkit-scrollbar-thumb {
          background: #1f2833;
          border-radius: 4px;
          border: 1px solid #45a29e;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #45a29e;
        }
      `}</style>
    </div>
  );
}
