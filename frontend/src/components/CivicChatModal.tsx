import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';
import {
  ChatMessage,
  CivicAnalysisResponse,
  LanguageCode,
} from '../types';
import { sendChatMessage } from '../utils/api';
import { UI_TEXT } from '../utils/translations';

interface CivicChatModalProps {
  language: LanguageCode;
  activeReport: CivicAnalysisResponse | null;
}

export const CivicChatModal: React.FC<CivicChatModalProps> = ({
  language,
  activeReport,
}) => {
  const t = UI_TEXT[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    language === 'hi'
      ? 'नगर निगम में शिकायत का समाधान न होने पर क्या करें?'
      : 'What should I do if the municipal body does not resolve my complaint in 15 days?',
    language === 'hi'
      ? 'सड़क गड्ढे या सीवर समस्या के लिए आरटीआई (RTI) कैसे लगाएं?'
      : 'How do I draft and file a Right to Information (RTI) application for this issue?',
    language === 'hi'
      ? 'इस विभाग के आपातकालीन हेल्पलाइन नंबर क्या हैं?'
      : 'What are the official municipal escalation helpline numbers?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (messageText: string) => {
    const textToSend = messageText.trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        message: textToSend,
        language,
        context: activeReport ? activeReport : null,
        history: messages.slice(-6),
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        setSuggestedQuestions(response.suggested_questions);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get answer from assistant.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col h-[650px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800/40 text-cyan-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>CivicLens Assistant</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'hi'
                ? 'नगर निगम कानून, आरटीआई (RTI) और शिकायत निवारण में आपका मार्गदर्शक'
                : 'Guidance on municipal rules, RTI filing, and complaint escalation'}
            </p>
          </div>
        </div>

        {activeReport && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 max-w-xs truncate">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-medium truncate">{activeReport.issue_title}</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{t.chatEmptyTitle}</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                {t.chatEmptySubtitle}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'glass-card border border-slate-800 text-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-card border border-slate-800 rounded-2xl p-3 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{language === 'hi' ? 'सहायक सोच रहा है...' : 'Assistant is thinking...'}</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Chips */}
      {suggestedQuestions.length > 0 && (
        <div className="pt-2 pb-3 border-t border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'hi' ? 'सुझाए गए प्रश्न:' : 'Suggested Questions:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-[11px] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/60 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.chatPlaceholder}
          disabled={isLoading}
          className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="p-2.5 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-cyan-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
