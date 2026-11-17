import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';

/**
 * 학생들의 제출 답안을 실시간으로 구독하고 답안을 제출/엑셀로 내보내는 커스텀 훅
 * @param {string} sessionId 세션 ID (기본값: '3-1')
 */
export function useResponses(sessionId = '3-1') {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Firebase 미설정 또는 db null인 경우: 안전한 로컬스토리지 Mock 모드
    if (!isFirebaseConfigured || !db) {
      const loadMockResponses = () => {
        const raw = localStorage.getItem(`mock_responses_${sessionId}`);
        if (raw) {
          try {
            setResponses(JSON.parse(raw));
          } catch (e) {
            console.error(e);
          }
        } else {
          // 데모용 샘플 학생 데이터 기본 제공
          const sampleData = [
            { id: '1', sessionId, studentName: '김지민', step: 1, answer: '심청전의 심청이를 골랐어요. 아버지를 위하는 모습이 인상 깊었습니다.', createdAt: new Date(Date.now() - 1000 * 60 * 5).toLocaleTimeString('ko-KR') },
            { id: '2', sessionId, studentName: '이서준', step: 1, answer: '흥부와 놀부 이야기에서 박을 타는 착한 흥부를 선택했습니다.', createdAt: new Date(Date.now() - 1000 * 60 * 4).toLocaleTimeString('ko-KR') },
            { id: '3', sessionId, studentName: '박하은', step: 2, answer: '아버지를 두고 떠나야 해서 가슴이 찢어지듯 슬프지만 효도하고 싶은 마음이었을 것 같아요.', createdAt: new Date(Date.now() - 1000 * 60 * 3).toLocaleTimeString('ko-KR') },
          ];
          setResponses(sampleData);
          localStorage.setItem(`mock_responses_${sessionId}`, JSON.stringify(sampleData));
        }
        setLoading(false);
      };

      loadMockResponses();

      const handleStorageChange = () => loadMockResponses();
      window.addEventListener('mock_response_added', handleStorageChange);
      return () => window.removeEventListener('mock_response_added', handleStorageChange);
    }

    // 2. Firebase 실제 연동 모드
    try {
      const q = query(
        collection(db, 'responses'),
        where('sessionId', '==', sessionId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            let createdDate = new Date();
            if (data.timestamp?.toDate) {
              createdDate = data.timestamp.toDate();
            } else if (data.timestamp?.seconds) {
              createdDate = new Date(data.timestamp.seconds * 1000);
            }
            return {
              id: docSnap.id,
              ...data,
              createdAt: createdDate.toLocaleString('ko-KR'),
              rawTimestamp: createdDate.getTime(),
            };
          });

          list.sort((a, b) => (b.rawTimestamp || 0) - (a.rawTimestamp || 0));
          setResponses(list);
          setLoading(false);
        },
        (err) => {
          console.error("응답 데이터 실시간 구독 오류:", err);
          setError(err);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setError(err);
      setLoading(false);
    }
  }, [sessionId]);

  /**
   * 학생 답안 제출
   */
  const submitAnswer = async ({ studentName, step, answer }) => {
    if (!studentName || !answer) {
      throw new Error("학생 이름과 답안을 모두 입력해주세요.");
    }

    if (!isFirebaseConfigured || !db) {
      const newResponse = {
        id: 'mock_' + Date.now(),
        sessionId,
        studentName,
        step: Number(step),
        answer,
        createdAt: new Date().toLocaleString('ko-KR'),
        rawTimestamp: Date.now(),
      };
      const updated = [newResponse, ...responses];
      setResponses(updated);
      localStorage.setItem(`mock_responses_${sessionId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('mock_response_added'));
      return newResponse.id;
    }

    try {
      const docRef = await addDoc(collection(db, 'responses'), {
        sessionId,
        studentName,
        step: Number(step),
        answer,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      console.error("답안 제출 실패:", err);
      throw err;
    }
  };

  /**
   * 브라우저 호환 100% 안전한 엑셀(CSV UTF-8 BOM) 다운로드
   * (외부 무거운 모듈 번들 에러로 인한 흰 화면 방지)
   */
  const exportToExcel = async (dataList = responses, customFileName = '') => {
    if (!dataList || dataList.length === 0) {
      alert("다운로드할 학생 데이터가 아직 없습니다.");
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = customFileName || `인물마음탐구_수업결과_${sessionId}_${dateStr}`;

    // 1. XLSX 동적 임포트 시도 (번들링 충돌 방지)
    try {
      const XLSX = await import('xlsx');
      if (XLSX && XLSX.utils) {
        const exportData = dataList.map((item, index) => ({
          번호: index + 1,
          학생이름: item.studentName || '익명',
          활동단계: `Step ${item.step}`,
          제출내용: item.answer || '',
          제출시간: item.createdAt || '',
          수업코드: item.sessionId || sessionId,
        }));
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '학생_답안');
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        return;
      }
    } catch (e) {
      console.warn("XLSX 모듈 로드 실패, 안전한 표준 CSV 방식으로 전환합니다:", e);
    }

    // 2. 대체 방식: 엑셀에서 바로 열리는 UTF-8 BOM CSV 생성 (100% 안전)
    let csvContent = '\uFEFF'; // Excel 한글 깨짐 방지용 BOM
    csvContent += "번호,학생이름,활동단계,제출내용,제출시간,수업코드\n";

    dataList.forEach((item, index) => {
      const cleanAnswer = (item.answer || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csvContent += `${index + 1},"${item.studentName}","Step ${item.step}","${cleanAnswer}","${item.createdAt}","${item.sessionId || sessionId}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    responses,
    loading,
    error,
    submitAnswer,
    exportToExcel,
  };
}
