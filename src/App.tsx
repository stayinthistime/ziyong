import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzeProblem, generateVocabulary } from './services/gemini';
import { AnalysisResult } from './components/AnalysisResult';
import { Status, ActiveTab, SUBJECT_LABELS } from './types';
import type { AnalysisResponse, Subject, VocabularyResponse, HistoryItem } from './types';
import { 
  BrainCircuit, 
  X, 
  Loader2, 
  Camera, 
  Image as ImageIcon,
  History,
  Send,
  BookA,
  Eye,
  EyeOff,
  Sparkles,
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.ANALYZE);
  
  // Analysis State
  const [subject, setSubject] = useState<Subject>('MATH');
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(Status.IDLE);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Vocabulary State
  const [vocabTopic, setVocabTopic] = useState('');
  const [vocabStatus, setVocabStatus] = useState<Status>(Status.IDLE);
  const [vocabResult, setVocabResult] = useState<VocabularyResponse | null>(null);
  const [revealedWords, setRevealedWords] = useState<Set<number>>(new Set());

  // History State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('study-app-history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Save history to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('study-app-history', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history (likely quota exceeded)", e);
    }
  }, [history]);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!inputText && !selectedImage) return;

    setStatus(Status.LOADING);
    setResult(null);
    setErrorMsg(null);

    try {
      const data = await analyzeProblem(inputText, subject, selectedImage || undefined);
      setResult(data);
      setStatus(Status.SUCCESS);
      
      // Save to History
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        subject,
        originalProblem: inputText,
        originalImage: selectedImage,
        result: data
      };
      setHistory(prev => [newItem, ...prev]);
      
    } catch (err) {
      console.error(err);
      setStatus(Status.ERROR);
      setErrorMsg("分析失败，请稍后重试。可能网络不稳定或图片过大。");
    }
  }, [inputText, subject, selectedImage]);

  const handleVocabSubmit = useCallback(async () => {
    if (!vocabTopic) return;
    
    setVocabStatus(Status.LOADING);
    setVocabResult(null);
    setRevealedWords(new Set());
    
    try {
      const data = await generateVocabulary(vocabTopic);
      setVocabResult(data);
      setVocabStatus(Status.SUCCESS);
    } catch (err) {
      console.error(err);
      setVocabStatus(Status.ERROR);
    }
  }, [vocabTopic]);

  const toggleWordReveal = (index: number) => {
    const newSet = new Set(revealedWords);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setRevealedWords(newSet);
  };

  const toggleAllWords = () => {
    if (!vocabResult) return;
    if (revealedWords.size === vocabResult.words.length) {
      setRevealedWords(new Set());
    } else {
      setRevealedWords(new Set(vocabResult.words.map((_, i) => i)));
    }
  };

  // History Actions
  const loadHistoryItem = (item: HistoryItem) => {
    setSubject(item.subject);
    setInputText(item.originalProblem);
    setSelectedImage(item.originalImage || null);
    setResult(item.result);
    setStatus(Status.SUCCESS);
    setActiveTab(ActiveTab.ANALYZE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条记录吗？')) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const clearHistory = () => {
    if (window.confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
      setHistory([]);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">刘浩扬</h1>
              <p className="text-xs text-slate-500">高中错题自检</p>
            </div>
          </div>
          
          <nav className="flex gap-1 overflow-x-auto no-scrollbar">
             <button 
              onClick={() => setActiveTab(ActiveTab.ANALYZE)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === ActiveTab.ANALYZE ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              错题分析
            </button>
            <button 
              onClick={() => setActiveTab(ActiveTab.VOCABULARY)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === ActiveTab.VOCABULARY ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><BookA className="w-4 h-4"/> 背单词</span>
            </button>
            <button 
               onClick={() => setActiveTab(ActiveTab.HISTORY)}
               className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === ActiveTab.HISTORY ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
             >
               <span className="flex items-center gap-2"><History className="w-4 h-4"/> 历史记录</span>
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        {activeTab === ActiveTab.ANALYZE && (
          <div className="space-y-8 animate-fade-in">
            {/* Subject Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {(Object.keys(SUBJECT_LABELS) as Subject[]).map((subj) => (
                <button
                  key={subj}
                  onClick={() => setSubject(subj)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    subject === subj 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {SUBJECT_LABELS[subj]}
                </button>
              ))}
            </div>

            {/* Input Section */}
            <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 ${status === Status.SUCCESS ? 'opacity-100' : 'translate-y-0'}`}>
              <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                {SUBJECT_LABELS[subject]}题目输入
              </h2>
              
              <div className="space-y-4">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`请输入${SUBJECT_LABELS[subject]}题目文本，或者简述你的疑问...`}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-y min-h-[120px] text-slate-700 placeholder:text-slate-400"
                />

                <div className="flex flex-wrap items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {/* Image Upload Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors text-sm font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    上传题目图片
                  </button>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={status === Status.LOADING || (!inputText && !selectedImage)}
                    className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg font-medium shadow-md shadow-indigo-200 transition-all active:scale-95"
                  >
                    {status === Status.LOADING ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI 思考中...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        开始分析
                      </>
                    )}
                  </button>
                </div>

                {/* Selected Image Preview */}
                {selectedImage && (
                  <div className="relative inline-block mt-4 group">
                    <img 
                      src={selectedImage} 
                      alt="Selected" 
                      className="h-32 w-auto rounded-lg border border-slate-200 object-cover shadow-sm" 
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 hover:text-red-500 text-slate-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {status === Status.ERROR && errorMsg && (
               <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center justify-center">
                 {errorMsg}
               </div>
            )}

            {/* Results Section */}
            {status === Status.SUCCESS && result && (
               <div className="animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-slate-400 text-sm font-medium">分析报告</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  <AnalysisResult data={result} />
               </div>
            )}

            {/* Empty State / Intro */}
            {status === Status.IDLE && (
              <div className="text-center py-12 px-4">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">准备好攻克难题了吗？</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  拍照上传数学、物理或化学错题，AI 智能助手将为你诊断错误原因，梳理知识点，并提供针对性的巩固练习。
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === ActiveTab.VOCABULARY && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  智能单词本
                </h2>
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={vocabTopic}
                    onChange={(e) => setVocabTopic(e.target.value)}
                    placeholder="输入主题 (例如: 高考高频词, 环保, 科技, 旅行...)"
                    className="flex-1 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleVocabSubmit()}
                  />
                  <button 
                    onClick={handleVocabSubmit}
                    disabled={vocabStatus === Status.LOADING || !vocabTopic}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl font-medium shadow-sm transition-all whitespace-nowrap"
                  >
                    {vocabStatus === Status.LOADING ? <Loader2 className="animate-spin w-5 h-5"/> : '生成单词'}
                  </button>
                </div>
             </div>

             {vocabResult && (
               <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-slate-500 font-medium text-sm">当前主题: <span className="text-slate-900 font-bold">{vocabResult.topic}</span></h3>
                    <button 
                      onClick={toggleAllWords}
                      className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      {revealedWords.size === vocabResult.words.length ? (
                        <><EyeOff className="w-4 h-4"/> 隐藏所有释义</>
                      ) : (
                         <><Eye className="w-4 h-4"/> 显示所有释义</>
                      )}
                    </button>
                 </div>
                 
                 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {vocabResult.words.map((item, idx) => {
                      const isRevealed = revealedWords.has(idx);
                      return (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                           <div className="p-5 flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-br from-white to-slate-50 border-b border-slate-100">
                             <h4 className="text-2xl font-bold text-slate-800 mb-1">{item.word}</h4>
                             <span className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded text-center">{item.pronunciation}</span>
                           </div>
                           
                           <div 
                             className={`p-4 text-sm transition-all cursor-pointer relative min-h-[100px] flex flex-col justify-center ${isRevealed ? 'bg-white' : 'bg-slate-50 hover:bg-slate-100'}`}
                             onClick={() => toggleWordReveal(idx)}
                           >
                              {!isRevealed ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400 gap-2">
                                  <Eye className="w-4 h-4" /> 点击查看释义
                                </div>
                              ) : (
                                <div className="animate-fade-in space-y-2">
                                  <p className="font-bold text-slate-800">{item.definition}</p>
                                  <p className="text-slate-600 italic">"{item.example}"</p>
                                </div>
                              )}
                           </div>
                        </div>
                      );
                    })}
                 </div>
               </div>
             )}
          </div>
        )}

        {activeTab === ActiveTab.HISTORY && (
           <div className="space-y-6 animate-fade-in">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  历史错题本
                </h2>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 className="w-4 h-4" /> 清空记录
                  </button>
                )}
             </div>

             <div className="grid gap-4">
               {history.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">暂无历史记录</h3>
                    <p className="text-slate-400 mt-2">快去分析你的第一道错题吧！</p>
                  </div>
               ) : (
                  history.map(item => (
                     <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.subject === 'MATH' ? 'bg-blue-100 text-blue-700' :
                                item.subject === 'PHYSICS' ? 'bg-purple-100 text-purple-700' :
                                item.subject === 'CHEMISTRY' ? 'bg-emerald-100 text-emerald-700' :
                                item.subject === 'BIOLOGY' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {SUBJECT_LABELS[item.subject]}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {formatTime(item.timestamp)}
                              </span>
                           </div>
                           <button 
                             onClick={(e) => deleteHistoryItem(e, item.id)}
                             className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                        
                        <div className="flex gap-4 mb-4">
                          {item.originalImage && (
                            <img src={item.originalImage} className="w-16 h-16 rounded-lg object-cover bg-slate-100 flex-shrink-0" alt="Problem" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-800 text-sm line-clamp-2 mb-1 font-medium">
                              {item.originalProblem || "（无文字描述，仅图片）"}
                            </p>
                            <p className="text-xs text-slate-500 truncate mb-0.5">
                              <span className="font-medium text-slate-600">考点:</span> {item.result.coreConcept}
                            </p>
                            <p className="text-xs text-red-400 truncate">
                              <span className="font-medium text-red-500">诊断:</span> {item.result.mistakeDiagnosis}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => loadHistoryItem(item)}
                          className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          查看详情与复习 <ArrowRight className="w-4 h-4" />
                        </button>
                     </div>
                  ))
               )}
             </div>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;