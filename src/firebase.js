import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getFirestore, doc, collection } from 'firebase/firestore';

/**
 * 기본 Firebase 환경 설정 (GitHub Secrets 환경변수 또는 모의 기본값)
 */
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_MOCK_KEY_FOR_DEV",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-school-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-school-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-school-app.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

/**
 * 로컬스토리지에 저장된 사용자 정의(선생님 개인) Firebase Config 가져오기
 */
export function getStoredCustomConfig() {
  try {
    const raw = localStorage.getItem('custom_firebase_config');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("커스텀 Firebase 설정 파싱 오류:", e);
  }
  return null;
}

/**
 * 사용자 정의(선생님 개인) Firebase Config 저장
 */
export function saveCustomConfig(config) {
  try {
    localStorage.setItem('custom_firebase_config', JSON.stringify(config));
    window.location.reload(); // 새 설정 적용을 위한 새로고침
  } catch (e) {
    console.error("커스텀 설정 저장 실패:", e);
  }
}

/**
 * 기본 Firebase Config로 초기화(삭제)
 */
export function resetCustomConfig() {
  localStorage.removeItem('custom_firebase_config');
  window.location.reload();
}

// 실제 활성화할 설정 (커스텀 설정 우선, 없으면 기본 설정)
const customConfig = getStoredCustomConfig();
export const activeFirebaseConfig = customConfig || defaultFirebaseConfig;

// Firebase 환경 변수 또는 커스텀 키 설정 여부 확인
export const isFirebaseConfigured = Boolean(
  (customConfig && customConfig.apiKey && customConfig.projectId) ||
  (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID)
);

// Firebase App 초기화
const appName = customConfig ? 'custom-school-app' : '[DEFAULT]';
let app;
try {
  const existingApps = getApps();
  const found = existingApps.find(a => a.name === appName);
  app = found ? found : initializeApp(activeFirebaseConfig, appName === '[DEFAULT]' ? undefined : appName);
} catch (e) {
  console.warn("Firebase App 초기화 중 경고:", e);
  app = getApps()[0] || initializeApp(activeFirebaseConfig);
}

// Firestore 인스턴스
export const db = getFirestore(app);

// 자주 사용하는 컬렉션 및 문서 참조 헬퍼
export const getSessionDocRef = (sessionId = 'class_1') => doc(db, 'sessions', sessionId);
export const getResponsesCollectionRef = () => collection(db, 'responses');

export default app;
