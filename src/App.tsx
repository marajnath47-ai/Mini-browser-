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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Types
type Language = 'html' | 'javascript' | 'python' | 'java' | 'cpp';
type View = 'landing' | 'editor';

interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  content: string;
  timestamp: string;
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
}`
};

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [language, setLanguage] = useState<Language>('html');
  const [code, setCode] = useState<string>(INITIAL_CODE['html']);
  const [output, setOutput] = useState<string>('');
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize Gemini
  const ai = React.useMemo(() => {
    // Safely check for the API key in the environmental defines
    let key = '';
    try {
      key = (process.env.GEMINI_API_KEY as string) || '';
    } catch (e) {
      // Fallback if process is not defined
    }
    return new GoogleGenAI({ apiKey: key });
  }, []);

  const hasApiKey = React.useMemo(() => {
    try {
      return !!(process.env.GEMINI_API_KEY);
    } catch (e) {
      return false;
    }
  }, []);

  useEffect(() => {
    if (view === 'editor') {
      setCode(INITIAL_CODE[language]);
      setConsoleLogs([]);
      setOutput('');
    }
  }, [language, view]);

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
    } else if (language === 'python' || language === 'java' || language === 'cpp') {
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

  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setView('editor');
  };

  const languagesMeta = [
    { id: 'html' as Language, name: 'HTML', icon: <Box className="w-8 h-8" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'javascript' as Language, name: 'JavaScript', icon: <Code2 className="w-8 h-8" />, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { id: 'python' as Language, name: 'Python', icon: <Terminal className="w-8 h-8" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'java' as Language, name: 'Java', icon: <Cpu className="w-8 h-8" />, color: 'text-red-600', bg: 'bg-red-50' },
    { id: 'cpp' as Language, name: 'C++', icon: <Code2 className="w-8 h-8" />, color: 'text-blue-700', bg: 'bg-blue-50' },
    { id: 'javascript' as Language, name: 'PHP', icon: <FileCode className="w-8 h-8" />, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  ];

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Header */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-50">
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
        <section className="pt-24 pb-16 px-4 text-center max-w-5xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-8 leading-[1.1]"
          >
            Code online with <span className="text-blue-600">One Compiler.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Join over 12.8 million users worldwide writing and running code online. The ultimate development playground.
          </motion.p>
          
          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto mb-10 group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <RefreshCw className="w-5 h-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search by Language/ DB/ Template etc.," 
              className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 outline-none transition-all shadow-xl shadow-gray-100/50 text-gray-700 placeholder:text-gray-300 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Categories Pill Nav */}
          <div className="flex flex-wrap justify-center gap-3 mb-20">
            {['Popular', 'Programming', 'Web', 'Databases'].map(cat => (
              <button 
                key={cat} 
                className={`px-6 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                  cat === 'Popular' 
                    ? 'bg-gray-100 border-gray-100 text-gray-900' 
                    : 'bg-white border-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Language Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {languagesMeta.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase())).map((lang, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => selectLanguage(lang.id)}
                className="p-6 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-4 cursor-pointer group transition-all shadow-sm hover:shadow-2xl hover:shadow-gray-200/50 relative overflow-hidden"
              >
                <div className={`p-5 rounded-2xl ${lang.bg} ${lang.color} group-hover:scale-110 transition-transform duration-500`}>
                  {lang.icon}
                </div>
                <div className="text-center">
                  <h3 className="font-black text-gray-800 text-lg">{lang.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {lang.id !== 'javascript' && lang.name !== 'HTML' && lang.name !== 'Python' ? 'Template only' : 'Ready to compile'}
                  </p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-blue-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

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
    <div id="app-container" className="h-screen w-full flex flex-col bg-[#0b0c10] text-[#c5c6c7] font-sans selection:bg-[#66fcf1] selection:text-[#0b0c10]">
      {/* Editor Header */}
      <header id="header" className="h-16 border-b border-[#1f2833] flex items-center justify-between px-6 bg-[#0b0c10]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView('landing')}
            className="p-2 hover:bg-[#66fcf1]/10 rounded-lg transition-colors border border-transparent hover:border-[#66fcf1]/30 group"
            title="Go Home"
          >
            <ChevronRight className="w-5 h-5 text-[#45a29e] group-hover:text-[#66fcf1] rotate-180 transition-all" />
          </button>
          <div className="p-2 bg-[#66fcf1]/10 rounded-lg border border-[#66fcf1]/30">
            <Cpu className="w-5 h-5 text-[#66fcf1]" />
          </div>
          <div>
            <h1 className="font-bold tracking-tight text-white flex items-center gap-2">
              MiniCompile <span className="text-xs font-mono px-2 py-0.5 bg-[#45a29e]/20 text-[#66fcf1] rounded border border-[#66fcf1]/20">v1.0</span>
            </h1>
            <p className="text-[10px] text-[#45a29e] uppercase tracking-[0.2em] font-medium">Virtual Code Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
          <div className="hidden sm:flex items-center bg-[#1f2833] rounded-full p-1 border border-[#45a29e]/20">
            {(['html', 'javascript', 'python', 'java', 'cpp'] as const).map((lang) => (
              <button
                key={lang}
                id={`lang-btn-${lang}`}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 uppercase tracking-wider ${
                  language === lang 
                    ? 'bg-[#66fcf1] text-[#0b0c10] shadow-[0_0_15px_rgba(102,252,241,0.3)]' 
                    : 'text-[#c5c6c7] hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
          
          <button
            id="run-btn"
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 sm:px-6 py-2 bg-[#66fcf1] text-[#0b0c10] rounded-lg font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_20px_rgba(102,252,241,0.2)] hover:shadow-[0_0_30px_rgba(102,252,241,0.4)]`}
          >
            {isRunning ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            )}
            <span className="hidden xs:inline">{isRunning ? 'RUNNING...' : 'EXECUTE'}</span>
            <span className="xs:hidden">{isRunning ? '...' : <Play className="w-4 h-4 fill-current" />}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main id="workspace" className="flex-1 flex flex-col lg:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4 min-h-0">
        {!hasApiKey && ['python', 'java', 'cpp'].includes(language) && (
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
              </select>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#1f2833] border border-[#45a29e]/30" />
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage={language}
              language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'html'}
              value={code}
              theme="vs-dark"
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
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
              onMount={(editor, monaco) => {
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  handleRun();
                });
              }}
            />
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
