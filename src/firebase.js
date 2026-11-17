import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, collection } from 'firebase/firestore';

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
    window.location.reload();
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

// 1. 활성화할 설정 추출 (커스텀 설정 우선, 없으면 환경 변수)
const customConfig = getStoredCustomConfig();
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

// 실제 유효한 Firebase 키가 존재하는지 엄격히 검사 (MOCK 키나 빈 값 제외)
export const isFirebaseConfigured = Boolean(
  (customConfig && customConfig.apiKey && customConfig.projectId) ||
  (envApiKey && envApiKey !== "AIzaSy_MOCK_KEY_FOR_DEV" && envProjectId && envProjectId !== "mock-school-app")
);

export const activeFirebaseConfig = customConfig || (isFirebaseConfigured ? {
  apiKey: envApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envProjectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null);

// 2. Firebase App & Firestore 안전 초기화
let app = null;
let firestoreDb = null;

if (isFirebaseConfigured && activeFirebaseConfig) {
  try {
    const existingApps = getApps();
    const appName = customConfig ? 'custom-school-app' : '[DEFAULT]';
    const found = existingApps.find(a => a.name === appName);
    app = found ? found : initializeApp(activeFirebaseConfig, appName === '[DEFAULT]' ? undefined : appName);
    firestoreDb = getFirestore(app);
  } catch (err) {
    console.warn("Firebase 연결 실패 (오프라인 로컬 모드로 전환됩니다):", err);
    firestoreDb = null;
  }
} else {
  console.info("💡 Firebase 설정이 없습니다. 웹앱이 안전한 [오프라인 모의 모드]로 작동합니다.");
}

export const db = firestoreDb;

// 참조 헬퍼 (db가 null일 경우 안전하게 null 반환)
export const getSessionDocRef = (sessionId = 'class_1') => {
  return db ? doc(db, 'sessions', sessionId) : null;
};

export const getResponsesCollectionRef = () => {
  return db ? collection(db, 'responses') : null;
};

export default app;
