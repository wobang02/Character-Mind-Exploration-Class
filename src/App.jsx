import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentScreen from './pages/StudentScreen';

/**
 * 교사용 페이지 보호 라우트 (비밀번호 미인증 시 로그인 화면으로 유도)
 */
function ProtectedTeacherRoute({ children }) {
  const isTeacher = sessionStorage.getItem('isTeacher') === 'true';
  if (!isTeacher) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * 학생 페이지 보호 라우트 (이름 미입력 시 로그인 화면으로 유도)
 */
function ProtectedStudentRoute({ children }) {
  const studentName = sessionStorage.getItem('studentName');
  if (!studentName) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 진입 및 로그인 */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* 선생님 대시보드 */}
        <Route
          path="/teacher"
          element={
            <ProtectedTeacherRoute>
              <TeacherDashboard />
            </ProtectedTeacherRoute>
          }
        />

        {/* 학생 화면 */}
        <Route
          path="/student"
          element={
            <ProtectedStudentRoute>
              <StudentScreen />
            </ProtectedStudentRoute>
          }
        />

        {/* 미확인 경로 처리 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  );
}
