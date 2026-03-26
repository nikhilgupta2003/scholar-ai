/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { 
  Upload, 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  ListOrdered, 
  Loader2, 
  ArrowRight,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  BrainCircuit,
  History,
  Trash2,
  LogOut,
  LogIn,
  User as UserIcon,
  X,
  Download,
  RotateCcw,
  HelpCircle,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  collection, 
  addDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  Timestamp,
  User
} from './firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';

// Types
type StudyMode = 'quiz' | 'notes' | 'points' | 'history' | null;
type AuthMode = 'login' | 'signup';

interface FileData {
  name: string;
  base64: string;
  mimeType: string;
}

interface HistoryItem {
  id: string;
  userId: string;
  fileName: string;
  mode: string;
  content: string;
  createdAt: Timestamp;
}

interface UserProgress {
  id: string;
  userId: string;
  historyId: string;
  type: 'quiz' | 'flashcard' | 'fill';
  score?: number;
  total?: number;
  correct?: number;
  incorrect?: number;
  completed: boolean;
  lastUpdated: Timestamp;
}

interface UserTime {
  id: string;
  userId: string;
  minutes: number;
  lastUpdated: Timestamp;
}

// Study Buddy Component
const StudyBuddy = ({ userContext, fileName, mode }: { userContext?: string, fileName?: string, mode?: StudyMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: 'Namaste! I am your Study Buddy. How can I help you today? (Aapki padhai mein main kaise madad kar sakta hoon?)' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastContext = useRef<{fileName?: string, mode?: StudyMode}>({});

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update greeting when context changes
  useEffect(() => {
    if (fileName && (fileName !== lastContext.current.fileName || mode !== lastContext.current.mode)) {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: `I see you're studying **${fileName}** in **${mode || 'General'}** mode. How can I help you with this material? (Main is material mein aapki kaise madad kar sakta hoon?)` }
      ]);
      lastContext.current = { fileName, mode };
    }
  }, [fileName, mode]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are a friendly, supportive, and highly knowledgeable Study Buddy. Your goal is to help students understand complex concepts, answer their doubts, and keep them motivated. You are bilingual and can seamlessly understand and reply in both Hindi (Hinglish/Devanagari) and English. 

Current Context:
- Document: "${fileName || 'General Topics'}"
- Study Mode: "${mode || 'General'}"
- Content Reference: ${userContext?.substring(0, 3000) || 'No specific content provided.'}

Your Task:
1. Answer the user's specific doubt based on the provided content.
2. If the user is in 'Quiz Master' mode, you can offer to explain a specific question or ask them a follow-up question to test their understanding.
3. If the user is in 'Study Notes' or 'Key Takeaways' mode, help them elaborate on points or simplify complex sections.
4. Always be encouraging and use a mix of Hindi and English where appropriate to make the student feel comfortable.

Tone: Friendly, encouraging, patient, and slightly informal (like a helpful senior or a peer).

User's Doubt: ${userMsg}` }] }
        ],
      });

      const text = response.text || "I'm sorry, I couldn't understand that. Could you rephrase? (Maaf kijiye, main samajh nahi paya. Kya aap fir se bol sakte hain?)";
      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Oops! Something went wrong. (Kuch galat ho gaya.)" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 h-[500px] bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <BrainCircuit size={18} />
                </div>
                <span className="font-bold">Study Buddy</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                  )}>
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600" size={18} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask a doubt... (Sawal puchein...)"
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-200"
      >
        {isOpen ? <X size={24} /> : <BrainCircuit size={24} />}
      </motion.button>
    </div>
  );
};

// Mermaid Component
const Mermaid = ({ chart }: { chart: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
      mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      });
    }
  }, [chart]);

  return <div ref={ref} className="my-6 flex justify-center overflow-x-auto" />;
};

// Flashcard Component
const Flashcard = ({ content, historyId, onComplete }: { content: string, historyId?: string, onComplete?: (score: number, total: number) => void }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cards = content.split('\n').filter(line => line.includes('|')).map(line => {
    const [q, a] = line.split('|').map(s => s.trim());
    return { q, a };
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedIndices, setViewedIndices] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    if (viewedIndices.size === cards.length && onComplete) {
      onComplete(cards.length, cards.length);
    }
  }, [viewedIndices, cards.length, onComplete]);

  if (cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  return (
    <div className="my-8 flex flex-col items-center gap-4 no-pdf-break">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-2">
        <BrainCircuit size={18} />
        Interactive Flashcards ({currentIndex + 1}/{cards.length})
      </div>
      
      <div 
        className="relative w-full max-w-md h-64 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d transition-transform duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border-2 border-indigo-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-50/50">
            <HelpCircle className="text-indigo-200 mb-4" size={40} />
            <p className="text-lg font-bold text-slate-800">{currentCard.q}</p>
            <p className="mt-6 text-xs font-bold text-indigo-400 uppercase tracking-widest">Click to reveal answer</p>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-indigo-600 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-xl shadow-indigo-200/50"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <CheckCircle2 className="text-indigo-200 mb-4" size={40} />
            <p className="text-lg font-bold text-white">{currentCard.a}</p>
            <p className="mt-6 text-xs font-bold text-indigo-200 uppercase tracking-widest">Click to flip back</p>
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button 
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(prev => prev - 1); setIsFlipped(false); }}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          disabled={currentIndex === cards.length - 1}
          onClick={() => { 
            setCurrentIndex(prev => prev + 1); 
            setIsFlipped(false); 
            setViewedIndices(prev => new Set([...prev, currentIndex + 1]));
          }}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 hover:bg-slate-200 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

// Fill-in-the-blanks Component
const FillInTheBlanks = ({ content, historyId, onComplete }: { content: string, historyId?: string, onComplete?: (score: number, total: number) => void }) => {
  const items = content.split('\n').filter(line => line.includes('|')).map(line => {
    const [sentence, answer] = line.split('|').map(s => s.trim());
    return { sentence, answer };
  });

  const [userAnswers, setUserAnswers] = useState<string[]>(new Array(items.length).fill(''));
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (showResults && onComplete) {
      const correctCount = userAnswers.filter((ans, idx) => ans.toLowerCase() === items[idx].answer.toLowerCase()).length;
      onComplete(correctCount, items.length);
    }
  }, [showResults, userAnswers, items, onComplete]);

  if (items.length === 0) return null;

  return (
    <div className="my-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100 no-pdf-break">
      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-6">
        <Sparkles size={18} />
        Fill in the Blanks
      </div>
      
      <div className="space-y-6">
        {items.map((item, idx) => {
          const parts = item.sentence.split(/\[.*?\]/);
          return (
            <div key={idx} className="text-slate-700 leading-relaxed">
              <span className="font-bold text-indigo-300 mr-2">{idx + 1}.</span>
              {parts.map((part, pIdx) => (
                <React.Fragment key={pIdx}>
                  {part}
                  {pIdx < parts.length - 1 && (
                    <input
                      type="text"
                      value={userAnswers[idx]}
                      onChange={(e) => {
                        const newAnswers = [...userAnswers];
                        newAnswers[idx] = e.target.value;
                        setUserAnswers(newAnswers);
                      }}
                      disabled={showResults}
                      className={cn(
                        "mx-2 px-3 py-1 rounded-lg border-b-2 outline-none transition-all w-32 text-center font-bold",
                        showResults 
                          ? (userAnswers[idx].toLowerCase() === item.answer.toLowerCase() 
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700" 
                              : "bg-red-50 border-red-500 text-red-700")
                          : "bg-white border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                      )}
                      placeholder="..."
                    />
                  )}
                </React.Fragment>
              ))}
              {showResults && userAnswers[idx].toLowerCase() !== item.answer.toLowerCase() && (
                <span className="ml-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  Correct: {item.answer}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-4">
        {!showResults ? (
          <button 
            onClick={() => setShowResults(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Check Answers
          </button>
        ) : (
          <button 
            onClick={() => { setShowResults(false); setUserAnswers(new Array(items.length).fill('')); }}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

// Interactive Quiz Component
const InteractiveQuiz = ({ content, onComplete }: { content: string, onComplete: (score: number, total: number) => void }) => {
  const questions = useMemo(() => {
    const lines = content.split('\n');
    const qs: any[] = [];
    let currentQ: any = null;

    lines.forEach(line => {
      if (line.match(/^\d+\./)) {
        if (currentQ) qs.push(currentQ);
        currentQ = { question: line.replace(/^\d+\.\s*/, ''), options: [], answer: '' };
      } else if (line.match(/^[a-d]\)/i)) {
        currentQ?.options.push(line);
      } else if (line.toLowerCase().includes('correct answer:') || line.toLowerCase().startsWith('answer:')) {
        if (currentQ) {
          currentQ.answer = line.split(':')[1]?.trim().charAt(0).toUpperCase() || '';
        }
      }
    });
    if (currentQ) qs.push(currentQ);
    return qs;
  }, [content]);

  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(new Array(questions.length).fill(''));
  const [showResults, setShowResults] = useState(false);

  const score = useMemo(() => {
    return selectedAnswers.filter((ans, idx) => ans === questions[idx].answer).length;
  }, [selectedAnswers, questions]);

  useEffect(() => {
    if (showResults) {
      onComplete(score, questions.length);
    }
  }, [showResults, score, questions.length, onComplete]);

  if (questions.length === 0) return null;

  return (
    <div className="my-10 space-y-8 no-pdf-break">
      <div className="flex items-center gap-3 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-6">
        <CheckCircle2 size={20} />
        Interactive Quiz
      </div>

      <div className="space-y-10">
        {questions.map((q, idx) => (
          <div key={idx} className="space-y-4 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <p className="font-bold text-slate-800 text-lg">
              <span className="text-indigo-500 mr-2">{idx + 1}.</span>
              {q.question}
            </p>
            <div className="grid grid-cols-1 gap-3">
              {q.options.map((opt: string, oIdx: number) => {
                const letter = opt.charAt(0).toUpperCase();
                const isSelected = selectedAnswers[idx] === letter;
                const isCorrect = q.answer === letter;
                
                return (
                  <button
                    key={oIdx}
                    disabled={showResults}
                    onClick={() => {
                      const newAns = [...selectedAnswers];
                      newAns[idx] = letter;
                      setSelectedAnswers(newAns);
                    }}
                    className={cn(
                      "text-left px-5 py-3 rounded-2xl border-2 transition-all font-medium",
                      showResults
                        ? (isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-700" : 
                           (isSelected ? "bg-red-50 border-red-500 text-red-700" : "bg-slate-50 border-slate-100 text-slate-400"))
                        : (isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-slate-100 hover:border-indigo-200 text-slate-600")
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!showResults ? (
        <button 
          onClick={() => setShowResults(true)}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
        >
          Submit Quiz
        </button>
      ) : (
        <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center space-y-4">
          <h4 className="text-2xl font-display font-bold text-indigo-900">Quiz Completed!</h4>
          <p className="text-indigo-600 font-bold text-lg">Your Score: {score} / {questions.length}</p>
          <button 
            onClick={() => { setShowResults(false); setSelectedAnswers(new Array(questions.length).fill('')); }}
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-bold border border-indigo-200 hover:bg-indigo-50 transition-all"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};

// Progress Dashboard Component
const ProgressDashboard = ({ progress, history, timeSpent }: { progress: UserProgress[], history: HistoryItem[], timeSpent: number }) => {
  const stats = useMemo(() => {
    const totalActivities = progress.length;
    const completedActivities = progress.filter(p => p.completed).length;
    const avgScore = progress.length > 0 
      ? (progress.reduce((acc, p) => acc + (p.score || 0) / (p.total || 1), 0) / progress.length) * 100 
      : 0;

    const totalCorrect = progress.reduce((acc, p) => acc + (p.correct || 0), 0);
    const totalIncorrect = progress.reduce((acc, p) => acc + (p.incorrect || 0), 0);

    const typeData = [
      { name: 'Quizzes', value: progress.filter(p => p.type === 'quiz').length },
      { name: 'Flashcards', value: progress.filter(p => p.type === 'flashcard').length },
      { name: 'Fill-in-blanks', value: progress.filter(p => p.type === 'fill').length },
    ].filter(d => d.value > 0);

    const performanceData = progress.map(p => {
      const historyItem = history.find(h => h.id === p.historyId);
      return {
        name: historyItem ? historyItem.fileName.substring(0, 15) + '...' : 'Unknown',
        score: Math.round(((p.score || 0) / (p.total || 1)) * 100),
        type: p.type
      };
    }).slice(0, 5);

    // Time spent data for circular graph
    const timeGoal = 60; // 60 minutes goal
    const timeData = [
      { name: 'Time Spent', value: timeSpent, fill: '#6366f1' }
    ];

    return { totalActivities, completedActivities, avgScore, typeData, performanceData, totalCorrect, totalIncorrect, timeData, timeGoal };
  }, [progress, history, timeSpent]);

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <BrainCircuit size={24} />
          </div>
          <h4 className="text-3xl font-display font-bold text-slate-900">{stats.totalActivities}</h4>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Activities</p>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="text-3xl font-display font-bold text-slate-900">{stats.completedActivities}</h4>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Completed</p>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles size={24} />
          </div>
          <h4 className="text-3xl font-display font-bold text-slate-900">{Math.round(stats.avgScore)}%</h4>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Average Mastery</p>
        </div>
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <History size={24} />
          </div>
          <h4 className="text-3xl font-display font-bold text-slate-900">{timeSpent}m</h4>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Time Spent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-xl font-display font-bold text-slate-900 mb-6">Study Time Progress</h4>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="100%" 
                barSize={20} 
                data={stats.timeData} 
                startAngle={90} 
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, stats.timeGoal]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{timeSpent}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">Minutes</span>
            </div>
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">Daily Goal: {stats.timeGoal}m</p>
        </div>

        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-xl font-display font-bold text-slate-900 mb-6">Accuracy Breakdown</h4>
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="flex gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-500">{stats.totalCorrect}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-red-500">{stats.totalIncorrect}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incorrect</div>
              </div>
            </div>
            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-1000" 
                style={{ width: `${(stats.totalCorrect / (stats.totalCorrect + stats.totalIncorrect || 1)) * 100}%` }} 
              />
              <div 
                className="bg-red-500 h-full transition-all duration-1000" 
                style={{ width: `${(stats.totalIncorrect / (stats.totalCorrect + stats.totalIncorrect || 1)) * 100}%` }} 
              />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Overall Accuracy: {Math.round((stats.totalCorrect / (stats.totalCorrect + stats.totalIncorrect || 1)) * 100)}%
            </p>
          </div>
        </div>

        <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h4 className="text-xl font-display font-bold text-slate-900 mb-6">Activity Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {stats.typeData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h4 className="text-xl font-display font-bold text-slate-900 mb-6">Recent Performance</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h4 className="text-xl font-display font-bold text-slate-900 mb-6">Areas for Improvement</h4>
        <div className="space-y-4">
          {progress.filter(p => (p.score || 0) / (p.total || 1) < 0.7).length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-medium">
              You're doing great! No specific areas for improvement identified yet.
            </div>
          ) : (
            progress.filter(p => (p.score || 0) / (p.total || 1) < 0.7).slice(0, 3).map((p, i) => {
              const historyItem = history.find(h => h.id === p.historyId);
              return (
                <div key={i} className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900">{historyItem?.fileName || 'Unknown Topic'}</h5>
                      <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{p.type} Mastery: {Math.round(((p.score || 0) / (p.total || 1)) * 100)}%</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      // Logic to jump to this study material
                    }}
                    className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors"
                  >
                    Review Now
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [file, setFile] = useState<FileData | null>(null);
  const [mode, setMode] = useState<StudyMode>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [userTime, setUserTime] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // History Listener
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'study_history'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HistoryItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as HistoryItem);
      });
      setHistory(items);
    }, (err) => {
      console.error("Firestore Error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Progress Listener
  useEffect(() => {
    if (!user) {
      setProgress([]);
      return;
    }

    const q = query(
      collection(db, 'user_progress'),
      where('userId', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: UserProgress[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as UserProgress);
      });
      setProgress(items);
    }, (err) => {
      console.error("Firestore Error (Progress):", err);
    });

    return () => unsubscribe();
  }, [user]);

  // Time Spent Listener
  useEffect(() => {
    if (!user) {
      setUserTime(0);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'user_time', user.uid), (doc) => {
      if (doc.exists()) {
        setUserTime(doc.data().minutes || 0);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Timer Effect
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setUserTime(prev => {
        const newTime = prev + 1;
        setDoc(doc(db, 'user_time', user.uid), {
          userId: user.uid,
          minutes: newTime,
          lastUpdated: Timestamp.now()
        }, { merge: true });
        return newTime;
      });
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      reset();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check for 1GB limit (1024 * 1024 * 1024 bytes)
    if (selectedFile.size > 1024 * 1024 * 1024) {
      setError('File size exceeds 1GB limit.');
      return;
    }

    if (selectedFile.type !== 'application/pdf' && !selectedFile.type.startsWith('text/')) {
      setError('Please upload a PDF or text file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setFile({
        name: selectedFile.name,
        base64,
        mimeType: selectedFile.type,
      });
      setError(null);
    };
    reader.readAsDataURL(selectedFile);
  };

  const generateContent = async (selectedMode: StudyMode) => {
    if (!file || !selectedMode || !user) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    setMode(selectedMode);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      let prompt = 'Analyze the provided document carefully. Detect the academic level (e.g., primary school, high school, undergraduate, medical, engineering, or postgraduate/M.Tech) and technical complexity of the content. ';
      
      prompt += 'IMPORTANT: If the document contains diagrams, or if a diagram would help explain a concept (especially for medical, engineering, or scientific subjects), please describe the diagram in detail. If the diagram can be represented as a flowchart, sequence, or structure, please provide a Mermaid.js code block (e.g., ```mermaid ... ```). ';
      
      prompt += 'INTERACTIVE ELEMENTS: To make the study material more engaging, please include: \n' +
                '1. Flashcards: Use a code block like ```flashcard\nQuestion | Answer\nQuestion | Answer\n```\n' +
                '2. Fill-in-the-blanks: Use a code block like ```fill\nThis is a [blank] sentence. | blank\nAnother [example] here. | example\n```\n' +
                '3. Interactive Quiz: Use a code block like ```quiz\n1. Question text?\na) Option 1\nb) Option 2\nc) Option 3\nd) Option 4\nCorrect Answer: A\n```\n' +
                'Integrate these elements naturally into the notes or quiz sections where they add value for memorization.';
      
      if (selectedMode === 'quiz') {
        prompt += 'Generate a comprehensive quiz tailored to this specific academic level. Include a mix of conceptual, analytical, and practical questions. For technical subjects like engineering or medical, include relevant terminology and problem-solving scenarios. Provide answers and detailed explanations at the end. Format with clear headings and numbered questions.';
      } else if (selectedMode === 'notes') {
        prompt += 'Create structured, high-quality study notes. Adapt the depth of explanation to match the content level—provide simple analogies for lower levels and rigorous technical definitions for higher levels (like M.Tech or Medical). Focus on core concepts, formulas, or clinical correlations where applicable. Use bold text for key terms.';
      } else if (selectedMode === 'points') {
        prompt += 'Summarize the main points in a clear, hierarchical bulleted list. Ensure the summary captures the essential arguments or findings, maintaining the appropriate level of technical detail for the subject matter.';
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: file.mimeType,
                  data: file.base64,
                },
              },
              { text: prompt },
            ],
          },
        ],
      });

      const generatedText = response.text || 'No content generated.';
      setResult(generatedText);

      // Save to History
      const docRef = await addDoc(collection(db, 'study_history'), {
        userId: user.uid,
        fileName: file.name,
        mode: selectedMode,
        content: generatedText,
        createdAt: Timestamp.now()
      });
      setCurrentHistoryId(docRef.id);

    } catch (err) {
      console.error(err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'study_history', id));
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete history item.');
    }
  };

  const reset = () => {
    setFile(null);
    setMode(null);
    setResult(null);
    setError(null);
    setShowHistory(false);
    setShowProgress(false);
    setSelectedHistoryItem(null);
  };

  const updateProgress = async (historyId: string, type: 'quiz' | 'flashcard' | 'fill', score?: number, total?: number, completed: boolean = true) => {
    if (!user) return;

    try {
      const progressId = `${user.uid}_${historyId}_${type}`;
      const existing = progress.find(p => p.id === progressId);
      
      const correct = score !== undefined ? score : (existing?.correct || 0);
      const totalVal = total !== undefined ? total : (existing?.total || 0);
      const incorrect = totalVal - correct;

      await setDoc(doc(db, 'user_progress', progressId), {
        userId: user.uid,
        historyId,
        type,
        score: correct,
        total: totalVal,
        correct,
        incorrect,
        completed,
        lastUpdated: Timestamp.now()
      });
    } catch (err) {
      console.error("Error updating progress:", err);
    }
  };

  const downloadPDF = async () => {
    if (!resultRef.current) return;
    
    setLoading(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`${file?.name || 'ScholarAI'}_StudyMaterial.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setError('Failed to export PDF.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl shadow-indigo-100 border border-slate-100 text-center space-y-6 relative z-10"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white mx-auto shadow-xl shadow-indigo-200/50">
            <GraduationCap size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold text-slate-900">Scholar AI</h1>
            <p className="text-slate-500 font-medium text-sm">
              {authMode === 'login' ? 'Welcome back! Please sign in.' : 'Create an account to get started.'}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              />
            </div>
            {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
            <button 
              type="submit"
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or continue with</span></div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Google
          </button>

          <p className="text-sm text-slate-500 font-medium">
            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="ml-1 text-indigo-600 font-bold hover:underline"
            >
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-indigo-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={reset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50">
              <GraduationCap size={26} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              Scholar AI
            </h1>
          </motion.div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setShowProgress(!showProgress);
                setShowHistory(false);
                setFile(null);
                setResult(null);
                setSelectedHistoryItem(null);
              }}
              className={cn(
                "p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm",
                showProgress ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <BarChart3 size={20} />
              <span className="hidden sm:inline">Progress</span>
            </button>

            <button 
              onClick={() => {
                setShowHistory(!showHistory);
                setShowProgress(false);
                setFile(null);
                setResult(null);
                setSelectedHistoryItem(null);
              }}
              className={cn(
                "p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm",
                showHistory ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <History size={20} />
              <span className="hidden sm:inline">History</span>
            </button>
            
            <div className="h-8 w-px bg-slate-200 mx-2" />

            <div className="group relative">
              <button className="flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                    <UserIcon size={16} />
                  </div>
                )}
                <span className="text-sm font-bold text-slate-700 hidden sm:inline">{user.displayName?.split(' ')[0] || 'User'}</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <AnimatePresence mode="wait">
          {showProgress ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-extrabold text-slate-900">My Progress</h2>
                <button 
                  onClick={() => setShowProgress(false)}
                  className="p-2 text-slate-400 hover:text-slate-900"
                >
                  <X size={24} />
                </button>
              </div>
              <ProgressDashboard progress={progress} history={history} timeSpent={userTime} />
            </motion.div>
          ) : showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-display font-extrabold text-slate-900">Study History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 text-slate-400 hover:text-slate-900"
                >
                  <X size={24} />
                </button>
              </div>

              {selectedHistoryItem ? (
                <div className="space-y-6">
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <ChevronLeft size={20} />
                    Back to History List
                  </button>
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
                      <div className="h-3 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500" />
                      <div className="p-10 md:p-16 prose prose-slate max-w-none" ref={resultRef}>
                        <div className="mb-8 pb-8 border-b border-slate-100">
                          <h3 className="text-3xl font-display font-bold text-slate-900 mb-2">{selectedHistoryItem.fileName}</h3>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                              {selectedHistoryItem.mode}
                            </span>
                            <span className="text-sm text-slate-400 font-medium">
                              {selectedHistoryItem.createdAt.toDate().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="markdown-content">
                          <ReactMarkdown 
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match) {
                                  if (match[1] === 'mermaid') {
                                    return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                                  }
                                  if (match[1] === 'flashcard') {
                                    return <Flashcard content={String(children).replace(/\n$/, '')} onComplete={(s, t) => updateProgress(selectedHistoryItem.id, 'flashcard', s, t)} />;
                                  }
                                  if (match[1] === 'fill') {
                                    return <FillInTheBlanks content={String(children).replace(/\n$/, '')} onComplete={(s, t) => updateProgress(selectedHistoryItem.id, 'fill', s, t)} />;
                                  }
                                  if (match[1] === 'quiz') {
                                    return <InteractiveQuiz content={String(children).replace(/\n$/, '')} onComplete={(s, t) => updateProgress(selectedHistoryItem.id, 'quiz', s, t)} />;
                                  }
                                }
                                return (
                                  <code className={className} {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {selectedHistoryItem.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center pt-6">
                      <button 
                        onClick={downloadPDF}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-lg"
                      >
                        <Download size={20} />
                        Download as PDF
                      </button>
                    </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <History size={40} />
                      </div>
                      <p className="text-xl font-bold text-slate-400">No study history yet.</p>
                      <button 
                        onClick={() => setShowHistory(false)}
                        className="text-indigo-600 font-bold hover:underline"
                      >
                        Start your first session
                      </button>
                    </div>
                  ) : (
                    history.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ y: -4 }}
                        onClick={() => setSelectedHistoryItem(item)}
                        className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg",
                            item.mode === 'quiz' ? "bg-emerald-500" :
                            item.mode === 'notes' ? "bg-indigo-500" :
                            "bg-purple-500"
                          )}>
                            {item.mode === 'quiz' ? <CheckCircle2 size={24} /> :
                             item.mode === 'notes' ? <FileText size={24} /> :
                             <ListOrdered size={24} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 truncate">{item.fileName}</h4>
                            <p className="text-sm text-slate-500 font-medium">
                              {item.createdAt.toDate().toLocaleDateString()} • {item.mode}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          ) : !file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-12"
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold tracking-wide uppercase"
                >
                  <Sparkles size={16} />
                  AI-Powered Learning
                </motion.div>
                <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                  Study Smarter, <br />
                  <span className="text-indigo-600">Not Harder.</span>
                </h2>
                <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Transform your lecture notes, textbooks, and research papers into interactive study materials in seconds.
                </p>
              </div>

              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => fileInputRef.current?.click()}
                className="group relative bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.txt"
                />
                <div className="relative z-10 space-y-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-sm">
                    <Upload className="text-slate-400 group-hover:text-white transition-colors" size={36} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-display font-bold text-slate-900">Drop your material here</p>
                    <p className="text-slate-500 font-medium">PDF or Text files up to 1GB</p>
                  </div>
                </div>
              </motion.div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-red-500 font-bold bg-red-50 py-3 px-6 rounded-2xl inline-block mx-auto w-full"
                >
                  {error}
                </motion.p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
                {[
                  { icon: BrainCircuit, title: 'Deep Analysis', desc: 'Our AI understands context, not just keywords.' },
                  { icon: CheckCircle2, title: 'Instant Quizzes', desc: 'Test retention with generated assessments.' },
                  { icon: ListOrdered, title: 'Smart Summaries', desc: 'Get the gist of 50 pages in 5 minutes.' },
                ].map((feature, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-lg font-display font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : !result ? (
            <motion.div
              key="modes"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="flex items-center gap-6 p-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                  <FileText size={32} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-1">Active Resource</p>
                  <p className="text-2xl font-display font-bold text-slate-900 truncate">{file.name}</p>
                </div>
                <button 
                  onClick={() => setFile(null)}
                  className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                >
                  <RefreshCw size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-display font-extrabold text-slate-900">Select Study Mode</h3>
                  <p className="text-slate-500 mt-2">How would you like to process this document?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { id: 'quiz', title: 'Quiz Master', icon: CheckCircle2, color: 'from-emerald-500 to-teal-400', desc: 'Interactive assessment to test your understanding.' },
                    { id: 'notes', title: 'Study Notes', icon: FileText, color: 'from-indigo-600 to-blue-500', desc: 'Concise definitions and core conceptual summaries.' },
                    { id: 'points', title: 'Key Takeaways', icon: ListOrdered, color: 'from-violet-600 to-purple-500', desc: 'High-level bullet points for quick revision.' },
                  ].map((item) => (
                    <motion.button
                      key={item.id}
                      whileHover={{ y: -8 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => generateContent(item.id as StudyMode)}
                      disabled={loading}
                      className={cn(
                        "group relative p-8 text-left bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
                        mode === item.id && "border-indigo-500 ring-4 ring-indigo-500/10"
                      )}
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg bg-gradient-to-br", item.color)}>
                        <item.icon size={28} />
                      </div>
                      <h4 className="text-xl font-display font-bold text-slate-900 mb-3">{item.title}</h4>
                      <p className="text-slate-500 leading-relaxed mb-6 text-sm">{item.desc}</p>
                      <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:gap-3 gap-2 transition-all">
                        Generate Now <ArrowRight size={18} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[100] flex flex-col items-center justify-center"
                >
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center space-y-6 max-w-sm text-center border border-slate-100">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" strokeWidth={2.5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit size={24} className="text-indigo-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-display font-bold text-slate-900">Analyzing Content</p>
                      <p className="text-slate-500 font-medium">Our AI is reading your document and crafting the perfect study guide...</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setResult(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm w-fit"
                  >
                    <ChevronLeft size={20} />
                    Back to Modes
                  </button>
                  <button 
                    onClick={downloadPDF}
                    className="flex items-center gap-2 text-sm font-bold text-white bg-slate-900 hover:bg-indigo-600 transition-all px-5 py-2.5 rounded-2xl shadow-sm w-fit"
                  >
                    <Download size={20} />
                    Download PDF
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Result Type:</span>
                  <span className={cn(
                    "px-5 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider shadow-sm",
                    mode === 'quiz' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                    mode === 'notes' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                    "bg-violet-50 text-violet-700 border border-violet-100"
                  )}>
                    {mode === 'points' ? 'Key Takeaways' : mode === 'notes' ? 'Study Notes' : 'Quiz Master'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500" />
                <div className="p-10 md:p-16 prose prose-slate max-w-none" ref={resultRef}>
                  <div className="markdown-content">
                    <ReactMarkdown 
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          if (!inline && match) {
                            if (match[1] === 'mermaid') {
                              return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                            }
                            if (match[1] === 'flashcard') {
                              return <Flashcard content={String(children).replace(/\n$/, '')} onComplete={(s, t) => currentHistoryId && updateProgress(currentHistoryId, 'flashcard', s, t)} />;
                            }
                            if (match[1] === 'fill') {
                              return <FillInTheBlanks content={String(children).replace(/\n$/, '')} onComplete={(s, t) => currentHistoryId && updateProgress(currentHistoryId, 'fill', s, t)} />;
                            }
                            if (match[1] === 'quiz') {
                              return <InteractiveQuiz content={String(children).replace(/\n$/, '')} onComplete={(s, t) => currentHistoryId && updateProgress(currentHistoryId, 'quiz', s, t)} />;
                            }
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {result}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-10">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={reset}
                  className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-lg hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-200"
                >
                  Process Another Document
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-slate-200/60 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 text-sm font-medium">
          <p>© 2026 Scholar AI. All rights reserved.</p>
          <div className="flex items-center gap-8">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
          </div>
        </div>
      </footer>

      <style>{`
        .markdown-content h1 { font-family: 'Outfit', sans-serif; font-size: 2.5rem; font-weight: 800; margin-bottom: 2rem; color: #0f172a; line-height: 1.2; }
        .markdown-content h2 { font-family: 'Outfit', sans-serif; font-size: 1.875rem; font-weight: 700; margin-top: 3rem; margin-bottom: 1.25rem; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; }
        .markdown-content h3 { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #334155; }
        .markdown-content p { margin-bottom: 1.5rem; line-height: 1.8; color: #475569; font-size: 1.125rem; }
        .markdown-content ul, .markdown-content ol { margin-bottom: 1.5rem; padding-left: 1.75rem; }
        .markdown-content li { margin-bottom: 0.75rem; color: #475569; font-size: 1.125rem; }
        .markdown-content li::marker { color: #6366f1; font-weight: bold; }
        .markdown-content strong { color: #0f172a; font-weight: 700; }
        .markdown-content blockquote { border-left: 6px solid #6366f1; padding: 1.5rem 2rem; font-style: italic; color: #64748b; margin: 2rem 0; background: #f8fafc; border-radius: 0 1.5rem 1.5rem 0; }
        .markdown-content code { background: #f1f5f9; padding: 0.25rem 0.5rem; border-radius: 0.5rem; font-size: 0.9em; color: #4f46e5; font-weight: 600; }
        .markdown-content hr { border: none; border-top: 2px solid #f1f5f9; margin: 3rem 0; }
      `}</style>
      <StudyBuddy 
        userContext={selectedHistoryItem?.content || result || undefined} 
        fileName={selectedHistoryItem?.fileName || file?.name}
        mode={(selectedHistoryItem?.mode as StudyMode) || mode}
      />
    </div>
  );
}
