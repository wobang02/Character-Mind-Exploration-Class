import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, GraduationCap, Sparkles, KeyRound, ArrowRight, Hash } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(null); // 'student' | 'teacher' | null
  const [roomCode, setRoomCode] = useState('3-1'); // 기본 수업 코드
  const [studentName, setStudentName] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 한글 IME 조합 중 state 업데이트를 막아 자모 분리 버그 방지
  const [isComposing, setIsComposing] = useState(false);

  const handleKoreanChange = (setter) => (e) => {
    if (!isComposing) setter(e.target.value);
  };
  const handleCompositionEnd = (setter) => (e) => {
    setIsComposing(false);
    setter(e.target.value);
  };

  // URL 파라미터(?room=xxx)가 있으면 자동으로 방 코드 채우기
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRoom = params.get('room');
    if (urlRoom) {
      setRoomCode(urlRoom.trim());
      // URL로 들어온 경우 자동으로 학생 모드로 전환
      setRole('student');
    }
  }, [location.search]);

  // 학생 로그인 처리
  const handleStudentLogin = (e) => {
    e.preventDefault();
    const cleanRoom = roomCode.trim();
    const cleanName = studentName.trim();

    if (!cleanRoom) {
      setErrorMsg('선생님이 알려주신 수업 코드를 입력해 주세요! (예: 3-1)');
      return;
    }
    if (!cleanName) {
      setErrorMsg('멋진 내 이름을 입력해 주세요! 😊');
      return;
    }

    sessionStorage.setItem('currentRoom', cleanRoom);
    sessionStorage.setItem('studentName', cleanName);
    navigate('/student');
  };

  // 선생님 로그인 처리 (비밀번호: 1234 또는 자유 설정)
  const handleTeacherLogin = (e) => {
    e.preventDefault();
    const cleanRoom = roomCode.trim();

    if (!cleanRoom) {
      setErrorMsg('개설할 수업 코드를 입력해 주세요! (예: 3-1, 행복반)');
      return;
    }

    if (teacherPassword === '1234' || teacherPassword === 'teacher') {
      sessionStorage.setItem('currentRoom', cleanRoom);
      sessionStorage.setItem('isTeacher', 'true');
      navigate('/teacher');
    } else {
      setErrorMsg('비밀번호가 맞지 않아요. (기본 비밀번호: 1234)');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-indigo-50/50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-indigo-100/50 p-6 md:p-8 border border-white">
        
        {/* 상단 타이틀 */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-200 mb-3 animate-bounce">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            인물 마음 탐구 교실
          </h1>
          <p className="text-sm md:text-base text-slate-500 mt-1.5">
            실시간으로 생각을 나누고 인물의 마음을 함께 여행해요! ✨
          </p>
        </div>

        {/* 역할 선택 전 화면 */}
        {!role && (
          <div className="space-y-4">
            <button
              onClick={() => { setRole('student'); setErrorMsg(''); }}
              className="w-full group p-5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all transform hover:-translate-y-1 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  🎒
                </div>
                <div className="text-left">
                  <div className="text-lg">학생으로 입장하기</div>
                  <div className="text-xs text-amber-100 font-normal">수업 코드와 이름을 적고 참여해요</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => { setRole('teacher'); setErrorMsg(''); }}
              className="w-full group p-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                  👩‍🏫
                </div>
                <div className="text-left">
                  <div className="text-lg">선생님으로 입장하기</div>
                  <div className="text-xs text-indigo-100 font-normal">우리 반 화면을 제어하고 생각을 모아요</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* 학생 입장 폼 */}
        {role === 'student' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div className="flex items-center space-x-2 text-amber-600 font-semibold mb-1">
              <GraduationCap className="w-5 h-5" />
              <span>학생 참여 등록</span>
            </div>

            {/* 수업 코드 (방 번호) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                <span>선생님이 알려주신 수업 코드 (반 이름)</span>
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={handleKoreanChange(setRoomCode)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={handleCompositionEnd(setRoomCode)}
                placeholder="예: 3-1 또는 5학년2반"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 text-sm font-semibold"
              />
            </div>

            {/* 이름 입력 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                내 이름 (또는 번호와 이름) 😊
              </label>
              <input
                type="text"
                value={studentName}
                onChange={handleKoreanChange((v) => { setStudentName(v); setErrorMsg(''); })}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={handleCompositionEnd((v) => { setStudentName(v); setErrorMsg(''); })}
                placeholder="예: 15번 김민수"
                maxLength={15}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-400 text-slate-800 text-sm"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setRole(null); setErrorMsg(''); }}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
              >
                뒤로가기
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-200 text-sm transition-all"
              >
                교실 들어가기 🚀
              </button>
            </div>
          </form>
        )}

        {/* 선생님 입장 폼 */}
        {role === 'teacher' && (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 font-semibold mb-1">
              <KeyRound className="w-5 h-5" />
              <span>선생님 수업 개설</span>
            </div>

            {/* 개설할 수업 코드 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center space-x-1">
                <Hash className="w-3.5 h-3.5 text-indigo-500" />
                <span>개설할 수업 코드 (학급명)</span>
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="예: 3-1, 5-2, 국어A반"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-semibold"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * 이 코드를 학생들에게 알려주시면 해당 학급 화면으로만 접속됩니다.
              </p>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                선생님 비밀번호
              </label>
              <input
                type="password"
                value={teacherPassword}
                onChange={(e) => { setTeacherPassword(e.target.value); setErrorMsg(''); }}
                placeholder="비밀번호 입력 (기본값: 1234)"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium">{errorMsg}</p>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => { setRole(null); setErrorMsg(''); }}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors"
              >
                뒤로가기
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 text-sm transition-all"
              >
                대시보드 입장 👩‍🏫
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
