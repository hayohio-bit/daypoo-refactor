import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8faf9] p-6 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white p-10 rounded-[40px] shadow-2xl border border-red-50"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-[#1A2B27] mb-4 tracking-tight">앗! 문제가 발생했어요 💩</h1>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">
              화면을 불러오는 중 예기치 못한 오류가 발생했습니다.<br />잠시 후 다시 시도해 주세요.
            </p>
            
            <div className="flex flex-col gap-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <RefreshCw size={18} /> 다시 시도하기
              </button>
              <button
                onClick={() => window.location.href = '/main'}
                className="w-full py-4 text-[#1B4332] font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Home size={18} /> 홈으로 돌아가기
              </button>
            </div>
            
            {this.state.error && (
              <div className="mt-10 pt-6 border-t border-gray-50">
                <p className="text-[10px] text-gray-300 font-mono break-all line-clamp-2">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
