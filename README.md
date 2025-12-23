# QR 보물찾기 (QR Treasure Hunt)

오프라인 공간에 배치된 QR 코드를 스캔하여 스탬프를 수집하고 점수를 획득하는 모바일 웹 애플리케이션입니다.

## 🚀 주요 기능

### 1. QR 스캐너 (`/scan`)
- 모바일 카메라를 활용한 실시간 QR 코드 인식
- 중복 습득 방지 로직 (서버 사이드 검증)
- 획득 성공/실패 시 애니메이션 피드백 및 포인트 알림

### 2. 어드민 포털 (`/admin`)
- 새로운 보물(스탬프) 생성 및 관리
- 보물별 고유 UUID 생성 및 QR 코드 이미지 즉시 생성
- 생성된 QR 코드를 PNG로 다운로드 가능

### 3. 유저 대시보드 (`/dashboard`)
- 총 획득 포인트 및 발견한 스탬프 개수 확인
- 수집한 보물 목록 시각화

### 4. 고성능 백엔드 및 보안
- **Next.js Server Actions**: 클라이언트 변조가 불가능한 서버 측 검증 로직
- **Firebase**: 실시간 데이터 동기화 및 익명 인증(Anonymous Auth) 지원
- **치팅 방지**: QR 코드에 실제 데이터를 담지 않고 난수화된 ID(UUID)만 담아 서버에서 조회하는 방식 채택

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), Vanilla CSS
- **Backend/Database**: Firebase Firestore, Firebase Auth
- **Icons**: Lucide React
- **QR**: html5-qrcode (Scanner), qrcode.react (Generator)

## 📦 시작하기

### 1. 환경 변수 설정
`.env.local` 파일을 생성하고 아래 Firebase 설정값들을 입력하세요:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. 패키지 설치 및 실행
```bash
npm install
npm run dev
```

### 3. QR 코드 생성 (로컬 테스트용)
이미 정의된 `data/treasures.json`을 사용하여 QR 코드를 생성하려면:
```bash
node scripts/generate-qrs.mjs
```
생성된 이미지는 `public/qrs/` 폴더에서 확인할 수 있습니다.

## 📁 프로젝트 구조
- `src/app`: 페이지 및 레이아웃 정의 (Next.js App Router)
- `src/lib`: Firebase 초기화 등 공통 유틸리티
- `src/actions`: 서버 측 비즈니스 로직 (Server Actions)
- `public/qrs`: 생성된 QR 코드 이미지 저장 폴더
- `data`: 스탬프 및 보물 데이터 정보
- `scripts`: 데이터 기반 QR 생성 스크립트
