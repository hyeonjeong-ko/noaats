# 구독 가치 분석 서비스

사용 패턴과 비용을 기반으로 구독 **유지 여부를 판단**하는 웹 기반 분석 도구입니다.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 주요 기능

**단일 분석**

- 콘텐츠형 (Netflix, Spotify, YouTube Premium)
- 혜택형 (쿠팡 WOW, 멤버십 카드)
- 용량형 (Google Drive, OneDrive, iCloud)
- 활용률, 미활용 비용, 본전 회복 시간 계산
- 자동 의사결정 및 생활소비 환산

**복수 비교**

- 여러 구독 서비스 동시 비교
- 활용률 그래프 및 비효율 분석
- 서비스별 등급 판정

---

## 시작하기

**웹 브라우저에서 실행**

```bash
cd /path/to/subscription-break-even-app
python -m http.server 8000
# http://localhost:8000 접속
```

**Node.js 테스트**

```bash
node test/test-calculator.js
node test/test-types.js
```

---

## 계산 방법

### 콘텐츠형 (OTT, 음악 등)

```
활용률 = 실제 사용 시간 / 기대 사용 시간 × 100%
미활용 비용 = 월 구독료 × (1 - 활용률)
시간당 비용 = 월 구독료 / 실제 사용 시간

예: Netflix 12,900원, 기대 30시간, 실제 35시간
→ 활용률 117%, 시간당 비용 368원 → 초과 만족
```

### 혜택형 (쿠팡, 멤버십 등)

```
획득 가치 = 무료배송 + 할인쿠폰 + 멤버십할인 + 포인트 + 기타
활용률 = 획득 가치 / 월 구독료 × 100%
미활용 비용 = 월 구독료 - 획득 가치 (0 이상만)

예: 쿠팡 4,900원, 혜택 45,500원
→ 활용률 928%, 초과 이득 40,600원
```

### 용량형 (클라우드 저장소)

```
활용률 = 사용 용량 / 제공 용량 × 100%
미활용 비용 = 월 구독료 × (1 - 활용률)
1GB당 비용 = 월 구독료 / 제공 용량

예: Google One 2,900원, 100GB 중 25GB 사용
→ 활용률 25%, 1GB당 29원, 미활용 비용 2,175원
```

---

## 등급 산정

모든 타입에 동일한 기준 적용:

| 활용률 | 의사결정 | 의미                   |
| ------ | -------- | ---------------------- |
| ≥ 100% | ✅ 유지  | 기대 이상의 가치 획득  |
| 50~99% | ⚠️ 검토  | 적절한 수준의 활용     |
| < 50%  | ❌ 해제  | 낮은 활용률, 해지 고려 |

---

## 설치

---

## 🧪 테스트

**테스트 실행**

```bash
node test/test-calculator.js      # 기본 계산 테스트 (45개)
node test/test-types.js           # 유형별 분석 테스트 (40개)
```

**테스트 커버리지**

- 0% ~ 1000%+ 활용률 계산
- 음수 입력, 큰 숫자, 소수점 정확도
- 콘텐츠형: 시간 계산, 본전 회복
- 혜택형: 혜택 조합, 초과 가치
- 용량형: 단위 변환, 용량 검증

---

## 프로젝트 구조

```
subscription-break-even-app/
├── index.html                 # 메인 페이지
├── css/style.css              # 스타일시트
├── js/
│   ├── main.js                # 단일/복수 분석 로직
│   ├── calculator.js          # 레거시 계산 클래스
│   ├── SubscriptionAnalyzer.js          # 기본 추상 클래스
│   ├── ContentConsumptionAnalyzer.js    # 콘텐츠형
│   ├── BenefitConsumptionAnalyzer.js    # 혜택형
│   ├── StorageBasedAnalyzer.js          # 용량형
│   └── type-analyzer.js       # 타입별 분석
├── test/
│   ├── test-calculator.js
│   └── test-types.js
└── README.md
```

---

## 기술 스택

**Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)

- 클래스 기반 OOP
- IIFE 패턴 (Module Scoping)
- 브라우저/Node.js 듀얼 환경

**Backend (Test)**: Node.js

---

## 오류 처리

**입력값 검증**

- 음수 확인 및 차단
- 기대값 0 체크
- 사용량 > 제공량 검증
- 형식 오류 캐치

**UI 에러 처리**

```javascript
try {
  // 계산 로직
} catch (error) {
  alert("계산 중 오류가 발생했습니다: " + error.message);
}
```

---

## 예외 상황

| 상황       | 처리                      |
| ---------- | ------------------------- |
| 0% 활용    | 미활용 비용 = 전체 구독료 |
| 0시간 사용 | 시간당 비용 = 0           |
| 100% 초과  | 초과 가치 계산            |
| 음수 입력  | 에러 메시지 + alert       |
| 큰 숫자    | 천 단위 쉼표 포맷팅       |
| 소수점     | 2자리 반올림              |

---

## 버전

**v1.0.0** (2026-02-12)

- 3가지 구독 타입 분석 구현
- 단일/복수 분석 완성

---

**라이선스**: MIT
