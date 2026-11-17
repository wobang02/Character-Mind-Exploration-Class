import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

/**
 * 어떤 에러가 발생해도 흰 화면이 뜨지 않도록 감싸주는 에러 경계 컴포넌트
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary 감지 오류:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 text-center border border-amber-200 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-bold text-slate-800">
              화면을 불러오는 중 문제가 생겼어요 🎈
            </h2>
            
            <p className="text-sm text-slate-600 leading-relaxed">
              설정이나 연결에 일시적인 오류가 있을 수 있습니다.<br />
              아래 버튼을 눌러 초기 화면으로 돌아가 보세요!
            </p>

            <div className="bg-slate-100 p-3 rounded-xl text-left text-xs font-mono text-slate-700 overflow-x-auto max-h-32">
              {this.state.error?.toString()}
            </div>

            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md text-sm transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>데이터 초기화하고 다시 시작하기</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
