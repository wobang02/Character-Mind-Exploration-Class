import { useState, useEffect } from 'react';
import { onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getSessionDocRef, isFirebaseConfigured, db } from '../firebase';

/**
 * 수업 세션(현재 단계 및 진행 상태)을 실시간으로 구독하고 제어하는 커스텀 훅
 * @param {string} sessionId 세션 ID (기본값: '3-1')
 */
export function useSession(sessionId = '3-1') {
  const [session, setSession] = useState({
    currentStep: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Firebase 설정이 없거나 db가 null인 경우: 안전한 로컬스토리지 Mock 세션
    if (!isFirebaseConfigured || !db) {
      const savedMock = localStorage.getItem(`mock_session_${sessionId}`);
      if (savedMock) {
        try {
          setSession(JSON.parse(savedMock));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);

      const handleStorageChange = () => {
        const updated = localStorage.getItem(`mock_session_${sessionId}`);
        if (updated) {
          try {
            setSession(JSON.parse(updated));
          } catch (e) {}
        }
      };
      window.addEventListener('mock_session_changed', handleStorageChange);
      return () => window.removeEventListener('mock_session_changed', handleStorageChange);
    }

    // 2. Firebase 실제 구독
    try {
      const sessionRef = getSessionDocRef(sessionId);
      if (!sessionRef) {
        setLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(
        sessionRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setSession(docSnap.data());
          } else {
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
    } catch (err) {
      console.error("useSession 초기화 에러:", err);
      setError(err);
      setLoading(false);
    }
  }, [sessionId]);

  const updateStep = async (newStep) => {
    const stepNum = Number(newStep);
    if (!isFirebaseConfigured || !db) {
      const updated = { ...session, currentStep: stepNum };
      setSession(updated);
      localStorage.setItem(`mock_session_${sessionId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('mock_session_changed'));
      return;
    }

    try {
      const sessionRef = getSessionDocRef(sessionId);
      if (sessionRef) {
        await setDoc(sessionRef, {
          currentStep: stepNum,
          isActive: true,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    } catch (err) {
      console.error("화면 단계 업데이트 실패:", err);
    }
  };

  const toggleActive = async (isActive) => {
    if (!isFirebaseConfigured || !db) {
      const updated = { ...session, isActive };
      setSession(updated);
      localStorage.setItem(`mock_session_${sessionId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('mock_session_changed'));
      return;
    }

    try {
      const sessionRef = getSessionDocRef(sessionId);
      if (sessionRef) {
        await updateDoc(sessionRef, {
          isActive,
          updatedAt: serverTimestamp(),
        });
      }
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
