import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages 배포 시 저장소 이름(Base URL)을 고려하여 상대 경로('./')를 기본값으로 설정합니다.
export default defineConfig({
  plugins: [react()],
  base: './',
});
