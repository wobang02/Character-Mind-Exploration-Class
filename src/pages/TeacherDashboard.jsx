import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Users, 
  LogOut, 
  CheckCircle2, 
  Sparkles,
  Search,
  Settings,
  Share2,
  Copy,
  Check,
  Database,
  RotateCcw,
  X
} from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { useResponses } from '../hooks/useResponses';
import { CLASS_STEPS } from '../constants/steps';
import { 
  getStoredCustomConfig, 
  saveCustomConfig, 
  resetCustomConfig, 
  activeFirebaseConfig 
} from '../firebase';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  // 동적 수업 코드 (기본값: '3-1')
  const sessionId = sessionStorage.getItem('currentRoom') || '3-1';

  const { currentStep, updateStep } = useSession(sessionId);
  const { responses, exportToExcel } = useResponses(sessionId);

  const [filterStep, setFilterStep] = useState('current');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // 파이어베이스 커스텀 연동 모달 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customConfigInput, setCustomConfigInput] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const currentStoredConfig = getStoredCustomConfig();

  // 학생 초대 링크 복사
  const handleCopyStudentLink = () => {
    const origin = window.location.origin + window.location.pathname;
    const studentUrl = `${origin}#/login?room=${encodeURIComponent(sessionId)}`;
    navigator.clipboard.writeText(studentUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // 파이어베이스 커스텀 키 저장
  const handleSaveFirebaseConfig = (e) => {
    e.preventDefault();
    try {
      let parsed;
      // JSON 파싱 시도
      if (customConfigInput.trim().startsWith('{')) {
        parsed = JSON.parse(customConfigInput);
      } else {
        // 객체 복사본 형태 파싱(apiKey: "...", 등 따옴표 없는 키 형식 보정)
        const jsonString = customConfigInput
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');
        parsed = JSON.parse(jsonString);
      }

      if (!parsed.apiKey || !parsed.projectId) {
        setSettingsError('apiKey와 projectId가 필수적으로 포함되어야 합니다.');
        return;
      }

      saveCustomConfig(parsed);
      setIsSettingsOpen(false);
    } catch (err) {
      setSettingsError('올바른 Firebase 설정 JSON 형식이 아닙니다. 형식을 확인해주세요.');
    }
  };

  const currentStepInfo = CLASS_STEPS.find((s) => s.step === currentStep) || CLASS_STEPS[0];

  // 필터링된 응답 목록
  const filteredResponses = responses.filter((item) => {
    const matchesStep = filterStep === 'all' || item.step === currentStep;
    const matchesSearch = 
      searchTerm === '' ||
      item.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStep && matchesSearch;
  });

  const handlePrevStep = () => {
    if (currentStep > 0) updateStep(currentStep - 1);
  };

  const handleNextStep = () => {
    if (currentStep < CLASS_STEPS.length - 1) updateStep(currentStep + 1);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('isTeacher');
    sessionStorage.removeItem('currentRoom');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      
      {/* 상단 네비게이션 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* 좌측 타이틀 & 학급 배지 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">선생님 수업 관제</h1>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200">
                  수업코드: {sessionId}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">실시간 인물 마음 탐구 교실</p>
            </div>
          </div>

          {/* 우측 컨트롤 버튼들 */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* 학생 초대 링크 복사 버튼 */}
            <button
              onClick={handleCopyStudentLink}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                copied
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
              }`}
              title="학생들이 바로 접속할 수 있는 링크를 복사합니다"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '링크 복사완료! 🎉' : '학생 접속 링크'}</span>
            </button>

            {/* 엑셀 다운로드 버튼 */}
            <button
              onClick={() => exportToExcel()}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">결과 엑셀 다운로드</span>
            </button>

            {/* Firebase 개인 설정 톱니바퀴 버튼 */}
            <button
              onClick={() => { setIsSettingsOpen(true); setSettingsError(''); }}
              className={`p-2 rounded-xl border text-sm transition-colors relative ${
                currentStoredConfig 
                  ? 'bg-amber-50 border-amber-300 text-amber-700' 
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="내 Firebase API 연동 설정"
            >
              <Settings className="w-4 h-4" />
              {currentStoredConfig && (
                <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-1 right-1"></span>
              )}
            </button>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="p-2 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-sm transition-colors"
              title="수업 종료 및 나가기"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* 현재 DB 상태 알림 배너 */}
        {currentStoredConfig && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-600" />
              <span>
                현재 <strong>선생님 개인 Firebase DB ({currentStoredConfig.projectId})</strong>에 연결되어 있습니다. 모든 학생 응답이 선생님 계정에 직접 저장됩니다.
              </span>
            </div>
            <button
              onClick={() => resetCustomConfig()}
              className="underline text-amber-700 hover:text-amber-900 font-semibold"
            >
              기본 DB로 복원
            </button>
          </div>
        )}

        {/* 1. 화면 제어 컨트롤러 패널 */}
        <section className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  현재 진행 화면
                </span>
                <span className="text-xs text-slate-400">학생들의 화면이 실시간으로 동기화됩니다</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mt-1">
                {currentStepInfo.title}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {currentStepInfo.guide}
              </p>
            </div>

            {/* 이전/다음 컨트롤 버튼 */}
            <div className="flex items-center space-x-2 self-start lg:self-center">
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>이전 화면</span>
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStep === CLASS_STEPS.length - 1}
                className="inline-flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
              >
                <span>다음 화면</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 스텝 빠른 이동 탭 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 mt-5">
            {CLASS_STEPS.map((stepItem) => {
              const isSelected = currentStep === stepItem.step;
              const stepResponsesCount = responses.filter((r) => r.step === stepItem.step).length;

              return (
                <button
                  key={stepItem.step}
                  onClick={() => updateStep(stepItem.step)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                      {stepItem.step === 0 ? '대기화면' : `Step ${stepItem.step}`}
                    </span>
                    {stepItem.step > 0 && (
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                        isSelected ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {stepResponsesCount}명 제출
                      </span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {stepItem.title.split(':')[1] || stepItem.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. 학생 제출 데이터 실시간 뷰어 */}
        <section className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                  <span>실시간 학생 응답 피드</span>
                  <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">
                    {filteredResponses.length}건
                  </span>
                </h3>
                <p className="text-xs text-slate-500">우리 반({sessionId}) 학생들이 제출한 생각이 실시간으로 도착합니다.</p>
              </div>
            </div>

            {/* 필터 및 검색 컨트롤 */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFilterStep('current')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterStep === 'current'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  현재 스텝 ({responses.filter((r) => r.step === currentStep).length})
                </button>
                <button
                  onClick={() => setFilterStep('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    filterStep === 'all'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  전체 ({responses.length})
                </button>
              </div>

              {/* 검색창 */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="학생 이름 / 내용 검색"
                  className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 w-36 sm:w-48"
                />
              </div>
            </div>
          </div>

          {/* 학생 응답 카드 그리드 */}
          {filteredResponses.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-slate-600 font-medium">아직 제출된 학생 답안이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">
                상단의 [학생 접속 링크]를 복사하여 학생들에게 접속을 안내해주세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResponses.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/50 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{item.studentName} 학생</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Step {item.step}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mt-2 bg-white p-3 rounded-lg border border-slate-100">
                      {item.answer}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{item.createdAt}</span>
                    <span className="text-emerald-600 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>제출완료</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* 3. Firebase 개인 설정 모달 팝업 */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600 font-bold text-base">
                <Database className="w-5 h-5" />
                <span>내 파이어베이스(Firebase) 연동 설정</span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              다른 선생님의 DB가 아니라 <strong>선생님 본인의 구글 Firebase 계정</strong>으로 학생들의 데이터를 직접 저장하고 싶으시다면, Firebase 콘솔에서 발급받은 <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">firebaseConfig</code> JSON을 아래에 붙여넣어 주세요.
            </p>

            <form onSubmit={handleSaveFirebaseConfig} className="space-y-3">
              <textarea
                rows={7}
                value={customConfigInput}
                onChange={(e) => { setCustomConfigInput(e.target.value); setSettingsError(''); }}
                placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-class.firebaseapp.com",\n  "projectId": "my-class-123",\n  "storageBucket": "my-class.appspot.com",\n  "messagingSenderId": "123456789",\n  "appId": "1:12345:web:abcdef"\n}`}
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />

              {settingsError && (
                <p className="text-xs text-rose-500 font-medium">{settingsError}</p>
              )}

              <div className="flex items-center justify-between pt-2">
                {currentStoredConfig ? (
                  <button
                    type="button"
                    onClick={() => resetCustomConfig()}
                    className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>기본 DB로 초기화</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50"
                  >
                    닫기
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200"
                  >
                    연동 저장하기
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500">
              🔒 입력하신 설정 정보는 서버로 전송되지 않고, 선생님 브라우저의 로컬에만 안전하게 보관됩니다.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
