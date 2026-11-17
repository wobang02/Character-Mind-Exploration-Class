import { useState, useEffect } from 'react';
import { onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getSessionDocRef, isFirebaseConfigured } from '../firebase';

/**
 * 수업 세션(현재 단계 및 진행 상태)을 실시간으로 구독하고 제어하는 커스텀 훅
 * @param {string} sessionId 세션 ID (기본값: 'class_1')
 */
export function useSession(sessionId = 'class_1') {
  const [session, setSession] = useState({
    currentStep: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Firebase 설정이 되어있지 않은 로컬 테스트 환경의 경우 기본값 유지
    if (!isFirebaseConfigured) {
      console.warn("Firebase 환경 변수가 설정되지 않아 로컬 모의(Mock) 세션으로 동작합니다.");
      const savedMock = localStorage.getItem(`mock_session_${sessionId}`);
      if (savedMock) {
        try {
          setSession(JSON.parse(savedMock));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
      return;
    }

    const sessionRef = getSessionDocRef(sessionId);

    // 실시간 상태 구독
    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSession(docSnap.data());
        } else {
          // 세션 문서가 없으면 초기값으로 생성
          const initialData = {
            currentStep: 0,
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          setDoc(sessionRef, initialData, { merge: true }).catch((err) => {
            console.error("초기 세션 생성 실패:", err);
          });
          setSession(initialData);
        }
        setLoading(false);
      },
      (err) => {
        console.error("세션 실시간 구독 오류:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId]);

  /**
   * 화면 단계(currentStep) 변경
   * @param {number} newStep 변경할 스텝 번호
   */
  const updateStep = async (newStep) => {
    if (!isFirebaseConfigured) {
      const updated = { ...session, currentStep: newStep };
      setSession(updated);
      localStorage.setItem(`mock_session_${sessionId}`, JSON.stringify(updated));
      // 같은 브라우저 탭 간 동기화를 위한 커스텀 이벤트
      window.dispatchEvent(new Event('mock_session_changed'));
      return;
    }

    try {
      const sessionRef = getSessionDocRef(sessionId);
      await updateDoc(sessionRef, {
        currentStep: Number(newStep),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("화면 단계 업데이트 실패:", err);
      // 문서가 없는 경우 setDoc으로 재시도
      const sessionRef = getSessionDocRef(sessionId);
      await setDoc(sessionRef, {
        currentStep: Number(newStep),
        isActive: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  /**
   * 수업 활성화/비활성화 토글
   * @param {boolean} isActive
   */
  const toggleActive = async (isActive) => {
    if (!isFirebaseConfigured) {
      const updated = { ...session, isActive };
      setSession(updated);
      localStorage.setItem(`mock_session_${sessionId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('mock_session_changed'));
      return;
    }

    try {
      const sessionRef = getSessionDocRef(sessionId);
      await updateDoc(sessionRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("수업 상태 변경 실패:", err);
    }
  };

  return {
    currentStep: session?.currentStep ?? 0,
    isActive: session?.isActive ?? true,
    loading,
    error,
    updateStep,
    toggleActive,
  };
}
