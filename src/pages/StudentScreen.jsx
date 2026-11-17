import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  User, 
  LogOut, 
  Hash
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useResponses } from '../hooks/useResponses';
import { CLASS_STEPS } from '../constants/steps';

export default function StudentScreen() {
  const navigate = useNavigate();
  // 동적 수업 코드 (기본값: '3-1')
  const sessionId = sessionStorage.getItem('currentRoom') || '3-1';
  const studentName = sessionStorage.getItem('studentName') || '우리반 친구';

  const { currentStep } = useSession(sessionId);
  const { submitAnswer } = useResponses(sessionId);

  const [answerText, setAnswerText] = useState('');
  const [isComposing, setIsComposing] = useState(false); // 한글 IME 조합 중 여부
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSteps, setSubmittedSteps] = useState({});
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState('');

  // 스텝이 변경되면 기존에 해당 스텝에 제출한 내용이 있는지 로컬스토리지에서 복원
  useEffect(() => {
    const saved = localStorage.getItem(`submission_${sessionId}_${studentName}_step_${currentStep}`);
    if (saved) {
      setSubmittedSteps((prev) => ({ ...prev, [currentStep]: true }));
      setLastSubmittedAnswer(saved);
      setAnswerText(saved);
    } else {
      setAnswerText('');
    }
  }, [currentStep, studentName, sessionId]);

  const currentStepInfo = CLASS_STEPS.find((s) => s.step === currentStep) || CLASS_STEPS[0];
  const isAlreadySubmitted = Boolean(submittedSteps[currentStep]);

  // 답안 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answerText.trim()) {
      alert('생각을 한 글자 이상 적어주세요! 😊');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitAnswer({
        studentName,
        step: currentStep,
        answer: answerText.trim(),
      });

      setSubmittedSteps((prev) => ({ ...prev, [currentStep]: true }));
      setLastSubmittedAnswer(answerText.trim());
      localStorage.setItem(`submission_${sessionId}_${studentName}_step_${currentStep}`, answerText.trim());
    } catch (err) {
      alert('제출 중 문제가 생겼어요. 다시 한 번 눌러주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 학생 나가기
  const handleLeave = () => {
    if (confirm('수업 교실을 나갈까요?')) {
      sessionStorage.removeItem('studentName');
      sessionStorage.removeItem('currentRoom');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-sky-50 to-indigo-50/40 flex flex-col font-sans">
      
      {/* 학생 상단 바 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-100 sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎈</span>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-800 text-sm sm:text-base">인물 마음 탐구</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black">
                  {sessionId}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>실시간 수업 연결됨</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 bg-amber-100 text-amber-900 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>{studentName} 학생</span>
            </div>
            <button
              onClick={handleLeave}
              title="나가기"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 화면 콘텐츠 */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {/* Step 0: 대기 화면 */}
        {currentStep === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-lg shadow-sky-100 border border-sky-100 my-auto">
            <div className="inline-block p-4 rounded-3xl bg-sky-100/70 text-sky-600 mb-6 animate-bounce">
              <Clock className="w-12 h-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-3">
              선생님이 다음 활동을 준비 중입니다 🎈
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
              선생님께서 화면을 열어주시면 멋진 탐구 질문이 바로 나타나요.<br />
              친구들과 함께 귀 기울여 선생님 말씀을 들어보아요!
            </p>

            <div className="mt-8 flex justify-center items-center space-x-2 text-xs text-sky-500 font-semibold bg-sky-50 py-2.5 px-4 rounded-full max-w-xs mx-auto">
              <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></span>
              <span>선생님의 신호를 실시간으로 기다리고 있어요 ({sessionId})</span>
            </div>
          </div>
        ) : (
          /* Step 1 이상: 활동 및 생각 제출 화면 */
          <div className="bg-white rounded-3xl shadow-lg shadow-indigo-100/60 border border-slate-100 p-6 sm:p-8 space-y-6">
            
            {/* 상단 활동 안내 헤더 */}
            <div className="border-b border-slate-100 pb-5">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>활동 {currentStep}단계</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {currentStepInfo.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2 font-medium">
                {currentStepInfo.subtitle}
              </p>

              {/* 선생님의 안내 팁 */}
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs sm:text-sm flex items-start space-x-2.5">
                <span className="text-lg">💡</span>
                <div className="leading-relaxed">
                  <span className="font-bold block mb-0.5">활동 팁:</span>
                  {currentStepInfo.guide}
                </div>
              </div>
            </div>

            {/* 이미 제출 완료된 경우 안내 배지 */}
            {isAlreadySubmitted && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-800 text-sm font-bold">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>내 생각이 선생님께 성공적으로 전달되었어요! 🎉</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">수정 후 재제출 가능</span>
              </div>
            )}

            {/* 생각 입력 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ✍️ 내 생각과 느낌을 솔직하게 적어보세요
                </label>
                <textarea
                  rows={5}
                  value={answerText}
                  onChange={(e) => {
                    // 한글 IME 조합 중에는 state 업데이트를 미뤄 자모 분리 버그 방지
                    if (!isComposing) {
                      setAnswerText(e.target.value);
                    }
                  }}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false);
                    setAnswerText(e.target.value); // 조합 완료 후 최종값 반영
                  }}
                  placeholder={currentStepInfo.placeholder}
                  className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 text-base text-slate-800 placeholder-slate-400 transition-all shadow-inner resize-none leading-relaxed"
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting || !answerText.trim()}
                className={`w-full py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-98 ${
                  isAlreadySubmitted
                    ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-300'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Send className="w-5 h-5" />
                <span>
                  {isSubmitting
                    ? '선생님께 보내는 중...'
                    : isAlreadySubmitted
                    ? '내 생각 다시 수정해서 제출하기 🔄'
                    : '선생님께 내 생각 제출하기 🚀'}
                </span>
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-400">
                제출한 내용은 선생님 화면에 실시간으로 안전하게 전달됩니다 🔒
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
