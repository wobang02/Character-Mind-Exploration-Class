import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { db, isFirebaseConfigured } from '../firebase';

/**
 * 학생들의 제출 답안을 실시간으로 구독하고 답안을 제출/엑셀로 내보내는 커스텀 훅
 * @param {string} sessionId 세션 ID (기본값: 'class_1')
 */
export function useResponses(sessionId = 'class_1') {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Firebase 미설정 시 로컬스토리지 기반 Mock 모드
    if (!isFirebaseConfigured) {
      const loadMockResponses = () => {
        const raw = localStorage.getItem(`mock_responses_${sessionId}`);
        if (raw) {
          try {
            setResponses(JSON.parse(raw));
          } catch (e) {
            console.error(e);
          }
        } else {
          // 데모용 샘플 학생 데이터 기본 제공 (인물 마음 탐구 예시)
          const sampleData = [
            { id: '1', sessionId, studentName: '김지민', step: 1, answer: '심청이가 바다에 빠지기 전 심청전의 주인공 심청이를 골랐어요.', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
            { id: '2', sessionId, studentName: '이서준', step: 1, answer: '흥부와 놀부 이야기에서 박을 타는 흥부를 선택했습니다.', createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString() },
            { id: '3', sessionId, studentName: '박하은', step: 2, answer: '아버지를 다시는 못 볼 수도 있다는 생각에 가슴이 찢어지듯 슬펐을 것 같아요.', createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
            { id: '4', sessionId, studentName: '최우진', step: 2, answer: '가난하지만 착하게 살면 언젠가 좋은 일이 생길 거라며 희망을 품었을 것입니다.', createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
            { id: '5', sessionId, studentName: '정예린', step: 3, answer: '심청아, 너의 효심은 정말 대단하지만 네 목숨도 소중해! 꼭 살아 돌아와 줘.', createdAt: new Date(Date.now() - 1000 * 60 * 1).toISOString() },
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

          // 최신순 정렬
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
   * @param {Object} param0 
   * @param {string} param0.studentName 학생 이름
   * @param {number} param0.step 활동 단계
   * @param {string} param0.answer 제출 답안
   */
  const submitAnswer = async ({ studentName, step, answer }) => {
    if (!studentName || !answer) {
      throw new Error("학생 이름과 답안을 모두 입력해주세요.");
    }

    if (!isFirebaseConfigured) {
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
   * 수집된 학생 데이터를 엑셀(.xlsx) 파일로 내보내기
   * @param {Array} dataList 내보낼 데이터 목록 (기본값: 현재 세션의 전체 responses)
   * @param {string} customFileName 파일 이름
   */
  const exportToExcel = (dataList = responses, customFileName = '') => {
    if (!dataList || dataList.length === 0) {
      alert("다운로드할 학생 데이터가 아직 없습니다.");
      return;
    }

    // 엑셀 시트에 맞는 한국어 친화적 컬럼 구성 (초등학교 수업용)
    const exportData = dataList.map((item, index) => ({
      번호: index + 1,
      학생이름: item.studentName || '익명',
      활동단계: `Step ${item.step}`,
      제출내용: item.answer || '',
      제출시간: item.createdAt || '',
      수업세션: item.sessionId || sessionId,
    }));

    // SheetJS를 이용해 워크시트 및 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // 컬럼 너비 자동 조정
    worksheet['!cols'] = [
      { wch: 6 },  // 번호
      { wch: 12 }, // 학생이름
      { wch: 12 }, // 활동단계
      { wch: 50 }, // 제출내용
      { wch: 22 }, // 제출시간
      { wch: 12 }, // 수업세션
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '학생_답안_모음');

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = customFileName || `인물마음탐구_수업결과_${sessionId}_${dateStr}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  return {
    responses,
    loading,
    error,
    submitAnswer,
    exportToExcel,
  };
}
