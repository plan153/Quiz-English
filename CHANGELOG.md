# Changelog — 기본동사 영작퀴즈

모든 주요 변경 사항을 이 파일에 기록합니다.  
형식: [Semantic Versioning](https://semver.org) 준수

---

## [1.7.0] — 2026-05-13

### 핵심 교육 흐름 개선 (Language Education Expert + UX Designer 관점)

**목표**: 한국어 듣자마자 → 영어가 연상 → 바로 입으로 나오게

#### 교육 흐름 변경
- 🔊 **한국어 자동재생 기본값 ON** (`autoKo: false → true`)
  - 문장 전환 시 300ms 후 자동 재생
  - "눈으로 읽고 번역" → "귀로 듣고 연상" 학습 패턴으로 전환
  - iOS 사용자 제스처 이후부터 정상 작동
- 🎯 **모범 발음 공통재생** (정답/오답 관계없이)
  - 이전: 정답 시만 영어 TTS 재생
  - 개선: 정답/오답 모두 600ms 후 모범 발음 자동재생
  - 오답 학습에서도 올바른 발음 귀에 박히게

#### UI 개선
- "한국어 듣기" → "🔊 다시 듣기" (액션 명확화)
- "영어로 말해보세요" 불필요한 힌트 텍스트 제거
- 모범 답안 텍스트 크기 확대 (18px, bold)
- "다음 문제 →" → "다음 문장 →" + 스타일 강화
- **스페이스바 단축키**: 피드백 열려있을 때 다음 문장으로
- 한국어 재생 시 pulse 애니메이션

#### DB 편집 개선
- 영어 문장 전체 표시 (ellipsis 제거, word-break 적용)
- 영어 문장 민트색(#5DCAA5)으로 강조

## [1.6.0] — 2026-05-13

### 추가 (Added)
- 🧠 **VAR_DB — 500문장 변형 사전 생성 DB**
  - Claude가 직접 500문장 × pnq 변형 일괄 생성
  - 긍정 씨앗 398개: 부정문/의문문/한국어 사전 계산
  - 부정 씨앗 102개: 긍정형/의문문/한국어 사전 계산
  - `buildVariations('pnq')` 호출 시 VAR_DB 우선 참조
  - VAR_DB 미존재 시 규칙 기반 VB 코드로 fallback
  - 145KB 데이터 → 즉시 응답 (API 호출 없음)
- 📄 **CLAUDE.md 추가**
  - Andrej Karpathy 코딩 가이드라인 통합
  - 프로젝트 아키텍처 문서화
  - 개발 규칙 (버전 관리, localStorage 키 등)

### 개선 (Improved)
- 복잡 주어 부정/의문문 정확도 대폭 향상
  - "My nephew has" → "My nephew doesn't have" / "Does my nephew have?" ✅
  - "Running usually makes" → "doesn't make" / "Does...make?" ✅
  - "Losing his business made" → "didn't make" / "Did...make?" ✅
- Yes/No 답변 과거형 수정: "Yes, it does." → "Yes, it did." (과거 문장)
- 부정 씨앗 의문문: 의문문 형태 수정 "These pants don't?" → "Do these pants have?" ✅
- 종속절 can 처리: "I don't think we can" → Yes: "Yes, I do." (not "Yes, I can.") ✅

## [1.5.0] — 2026-05-13

### 수정 (Fixed)
- 🔄 **부정 씨앗 문장 변형 완성**
  - [긍정형] 씨앗이 부정이면 긍정으로 변환
    - ~~"I don't think..."~~ → **"I think we can get a place in Gangnam."** ✅
    - 한국어: "집 못 얻을 듯해." → "집 얻을 듯해." ✅
  - [부정] 씨앗이 이미 부정이면 완전히 제거 (중복 방지)
  - [의문문] 부정 의문문 형태 `makeNegativeQuestion()` 신규 추가
    - ~~"Do you don't think...?"~~ → **"Don't you think...?"** ✅
    - "She doesn't like it." → **"Doesn't she like it?"** ✅
    - "He didn't go." → **"Didn't he go?"** ✅
    - "I won't go." → **"Won't you go?"** ✅
  - 한국어 의문문: 원문 + "?" ✅

### 추가 (Added)
- `makeNegativeQuestion(s)` — 부정 의문문 전용 함수
- `_koPos(ko)` — 부정 한국어 → 긍정 근사 변환 (못→제거, 없다→있다 등)

### 테스트 결과
- pnq 전수 테스트: 7/7 통과

## [1.4.0] — 2026-05-13

### 수정 (Fixed)
- 🔄 **변형연습 pnq 전면 재설계**
  - **부정문 씨앗 감지** — `isNegative()` 추가: 원문이 이미 부정이면 긍정형/의문문으로 변환
    - ~~"I don't think..."~~ 씨앗 → [원문(부정)] → [긍정형] → [의문문] 순서 ✅
    - 부정 씨앗에서 "부정" 탭 중복 제거 ✅
  - **`makePositive()` 추가** — 부정문 → 긍정문 자동 변환
    - `"I don't go"` → `"I go"` / `"He doesn't make"` → `"He makes"` ✅
  - **`toBase3rd()` 추가** — 3인칭 현재형 → 원형 정확 변환
    - ~~`makes→mak`~~ → `makes→make` ✅ / `watches→watch` / `carries→carry` ✅
  - **의문문 개선** — "Do you" 접두사 방식 → 문장 구조 분석 후 올바른 의문문 생성
    - ~~"Do you don't think..."~~ → `"Do you think we can get a place in Gangnam?"` ✅
  - **한국어 변환 개선** — `_koNeg()` / `_koQ()` 추가
    - 된다 → 되지 않는다 / 됩니까? / 한다 → 하지 않는다 / 합니까? 등 ✅
    - 모든 변형에서 동일 한국어 반복 → 상황에 맞는 한국어 표시 ✅

### 추가 (Added)
- 👥 **주어 교체 `It (그것은)` 추가** — SUBJ_POOL 7개로 확장

### 변경 (Changed)
- 🎙 **음성 설정 영어 전용** — `lang` 기반 필터만 사용, 비영어 음성 완전 제거

### 테스트 결과
- VB 전수 테스트: 10/10 통과
- JS 문법: ✅

## [1.3.0] — 2026-05-13

### 추가 (Added)
- 🧠 **compromise.js 통합** (영어 NLP 라이브러리)
  - CDN: `https://cdn.jsdelivr.net/npm/compromise/builds/compromise.min.js`
  - 대명사 주어(I/He/She/We/They/You) 문장에서 문법적으로 정확한 변환
  - spaCy의 JS 브라우저 등가물 — Python 불필요
- 🔄 **비대명사 주어 부정문·의문문 수정**
  - 동명사 주어: ~~"I don't losing..."~~ → **"Losing X didn't make Y."** ✅
  - 명사구 주어: ~~"Do you running..."~~ → **"Does running X keep Y?"** ✅
  - `_negateNonPronoun()` / `_questionNonPronoun()` 로직 추가
- ✅ **Yes/No 답변 동사 타입별 단일 출력**
  - be동사: ~~"Yes, I do. / Yes, I am."~~ → **"Yes, I am."** 만 출력 ✅
  - 미래형: → **"Yes, I will."** ✅
  - 3인칭: → **"Yes, he does."** ✅
  - `_getYesNo()` 도우미 함수 추가

### 라이브러리 비교 (spaCy vs compromise.js)

| 라이브러리 | 언어 | 브라우저 | 부정문 | 의문문 | 복잡주어 |
|-----------|------|---------|-------|-------|---------|
| spaCy + pyInflect | Python | ❌ | ✅ | ✅ | ✅ |
| mlconjug3 | Python | ❌ | ✅ | ❌ | ❌ |
| **compromise.js** | **JS** | **✅** | **✅** | **✅** | ⚠️ 자체 보완 |
| 기존 VB 코드 | JS | ✅ | △ | △ | ❌ |

→ **결론**: compromise.js(브라우저 호환) + 비대명사 주어 자체 처리 조합 채택

### 수정 (Fixed)
- `makeNegative()` 비대명사 주어 폴백 오류
  - ~~"I don't losing his business made him..."~~ → **"Losing his business didn't make him..."** ✅
- `makeQuestion()` 비대명사 주어 폴백 오류
  - ~~"Do you running every day..."~~ → **"Does running every day keep me healthy?"** ✅
- `makeQuestion()` 과거 분기를 대명사 주어 한정으로 수정 (비대명사 주어 오인식 방지)

### 테스트
- 변형 전수 테스트 22/22 통과

## [1.2.0] — 2026-05-11

### 추가 (Added)
- 🔄 **변형 탭 시 즉시 TTS 재생** — 첫 탭부터 문장 보여주면서 동시에 발음
- 👥 **주어 교체 원문 감지** — 원문 주어 자동 파악, 중복 제외, `[원문]` 표시
- 🏷 **주격 조사 포함** — `He (그는)`, `She (그녀는)`, `We (우리는)`, `You (당신은)`, `They (그들은)`
- 📖 **과거형 역방향 사전** — went→go, ate→eat, saw→see 등 자동 원형 복원
- 🔤 **동사별 맥락적 대체어** — 30개 동사 × 3개 맥락 대체어 확장

### 수정 (Fixed)
- `makeNegative()` 과거 부정 오류
  - ~~"I don't went"~~ → **"I didn't go"** ✅
- `makeNegative()` 미래 부정 오류
  - ~~"I don't will go"~~ → **"I won't go"** ✅
- `makeNegative()` be동사 과거 처리 추가
  - "I was tired." → **"I wasn't tired."** ✅
- `makeQuestion()` 과거 의문 오류
  - ~~"Do you went?"~~ → **"Did you go?"** ✅
- `makeQuestion()` 미래 의문 오류
  - ~~"Do you will go?"~~ → **"Will you go?"** ✅
- `changeSubject()` 주어 교체 전혀 안 되던 버그
  - ~~"He goes to school."~~ (I→He 교체 실패) → **"He goes to school."** ✅
- `changeSubject()` have→haves 오류
  - ~~"She haves her wallet."~~ → **"She has her wallet."** ✅
- `changeSubject()` 소유격 누락 (my→her 등 미적용)
  - my/his/her/our/their 전체 교체 적용
- `to3rd()` have→haves 오류
  - ~~"haves"~~ → **"has"** ✅
- `changeTense()` 마침표 중복 버그
  - ~~"I went to school. yesterday."~~ → **"I went to school yesterday."** ✅
- `isPastTense()` 초기화 전 호출 시 오류
  - PAST_IRR 역방향 탐색 fallback 추가

### 테스트 (Tests)
- 변형 전수 테스트 18/18 통과

---

## [1.1.4] — 2026-05-10

### 추가
- 🎙 **음성 패널 완전 개편**
  - Zoe 사용 방법 단계별 안내 박스
  - 📱 시스템 기본 음성 (권장) 버튼 — iOS Accessibility 음성(Zoe) 자동 사용
  - 🔄 새로고침 버튼 — iOS 음성 재로드
  - 음성 수 표시 (로드된 음성 개수)

### 수정
- iOS Safari 음성 목록 빈 배열 반환 문제
  - 0.3s·0.8s·1.5s·3.0s 4단계 재시도
  - 더미 speak으로 TTS 엔진 워크업
  - 영어 음성 필터를 이름 기반으로도 확장 (Zoe·Ava·Samantha 등)
- `__system__` 모드 추가 — voice 미지정 시 iOS 시스템 기본 음성 사용

---

## [1.1.3] — 2026-05-10

### 추가
- 음성 진단 도구 (`voice_diagnostic.html`)
  - 전체 음성 목록 표시
  - 시스템 기본 음성 테스트 재생
  - Zoe 직접 지정 테스트

### 수정
- iOS `getVoices()` 빈 배열 반환 문제 추가 대응
  - 더미 utterance로 TTS 엔진 초기화 유도
  - `forceReloadVoices()` 함수 신설

---

## [1.1.2] — 2026-05-10

### 수정
- iOS에서 Zoe가 음성 목록에 안 보이는 근본 원인 분석 및 대응
  - 원인 1: 사용자 터치 후에만 전체 음성 목록 반환 → 패널 열릴 때 강제 재로드
  - 원인 2: `getVoices()` 타이밍 불일치 → 다단계 setTimeout 재시도
  - 원인 3: 영어 필터 `/en/i` 일부 iOS 코드 누락 → 이름 기반 감지 추가

---

## [1.1.1] — 2026-05-10

### 추가
- ✅ **Zoe 자동 감지** — `voice.default === true` → iOS 설정 기본 음성 자동 선택
- 🏷 **음성 품질 배지** — 📱 기기 기본 / ⭐ 프리미엄 / ☁️ 온라인
- **음성 이름 기반 저장** — 인덱스 불일치 버그 제거

### 수정 (Critical)
- **음성 인덱스-배열 불일치 버그** — 선택 음성 ≠ 실제 재생 음성
  - `renderVoiceList()` 정렬 배열과 `speakEn()` 비정렬 배열 불일치
  - 이름(voice.name) 기반으로 전면 재작성
- 자동 선택 우선순위 정립
  1. 사용자 저장값 → 2. 기기 기본(default:true) → 3. 프리미엄 → 4. en-US → 5. 첫 번째

---

## [1.1.0] — 2026-05-09

### 추가 (UI 전면 리디자인)
- 🎯 **마이크 히어로 버튼** — 76px 중앙 배치, 시각적 최우선
- 📄 **문장 영역 단순화** — 라벨/카드 제거, 문자만 크게
- 🔼 **피드백 슬라이드업 시트** — 채점 결과 즉시 표시
- ≡ **필터 드로어** — 레벨/탭 필터를 메뉴 안으로 이동
- 📊 **진행바 + 번호 한 줄** — 상단 공간 절약
- 하단 컨트롤 4행 → **1행 (← 🎤 →)** 로 대폭 단순화
- 정답 보기 → 마이크 아래 작은 링크로 축소

### 참고 앱 분석
- Duolingo: 1화면 1액션 원칙 적용
- ELSA Speak: 채점 결과 즉시 오버레이 방식 적용
- Babbel: Primary CTA 크기 확대 적용
- Pimsleur: 불필요 옵션 메뉴로 이동

---

## [1.0.1] — 2026-05-10

### 수정 (Fixed)
- `toIng()` 이중모음 자음 겹침 버그
  - ~~eat → eatting~~ → **eating** ✅
  - ~~read → readding~~ → **reading** ✅
  - ~~look → lookking~~ → **looking** ✅
  - 원인: `/[aeiou][자음]$/` 패턴이 이중모음(ea, oo 등)에도 겹침 적용
  - 수정: `/[^aeiou][aeiou][자음]$/` 로 단일모음(CVC) 패턴만 겹침 적용
- 전수 테스트 54/54 통과 확인

---

## [1.0.0] — 2026-05-09

### 추가 (Added)
- 🎤 **쉐도잉 모드** (5번째 탭)
  - MediaRecorder API로 실제 오디오 캡처
  - 모범 TTS → 내 녹음 → 비교 청취 3단계
  - 실시간 파형 시각화
  - 속도 슬라이더 (0.5x~1.2x, 기본 0.8x)
- 📋 **학습목표 관리** (DB 관리 → 학습목표 탭)
  - 목표 생성/삭제, 컬러 자동 배정
  - 문장을 다른 목표로 이동
  - 📢 연속 읽기, 🎤 쉐도잉 바로 진입
- 🟢🟡🟠🔴 **오답 횟수 배지** — 0회/1~4/5~9/10~14/15회↑
- 🏠 **환영 화면** — 이어하기·복습·처음부터
- ⚙️ **설정 패널** — 한국어보기/듣기, 힌트, TTS 5종
- 💾 **학습 위치 자동 저장**
- ⌨️ 타이핑 모드 / 👆 스와이프 / ⌨️ 키보드 단축키
- 🎨 민트 V1 아이콘

### 수정 (Fixed)
- `switchMode('quiz')` render() 미호출
- OPIc / 문장늘리기 탭 재방문 초기화 버그
- `showAns()` SRS 기록 누락
- 환영화면 onend 이벤트 기반 연속 읽기 타이밍

### 아키텍처
- `ShadowMode`, `GoalManager`, `wrongBadge()` 추가
- 모드바 4탭 → 5탭, DB 관리 3탭 → 4탭

---

## [0.9.0] — 2026-05

### 추가
- 학습 설정 패널 (한국어 보기/듣기, 힌트, TTS 옵션)
- 환영 화면 (이어하기/복습/처음부터)
- 학습 위치 저장/복원

---

## [0.8.0] — 2026-05

### 추가
- 재방문 → 환영 화면 표시
- 마지막 문제 위치 자동 저장
- 설정 5종 토글

---

## [0.7.0] — 2026-05

### 수정 (QA 2차)
- `switchMode` render() 누락
- OPIc/SBMode 재방문 리셋 버그
- `showAns()` SRS 기록 누락
- 내장 DB 수정 방지

### 추가
- 타이핑 모드 / 스와이프 / 키보드 단축키

---

## [0.6.0] — 2026-05

### 추가
- 500문장 원본 DB 통합
- README.md 작성
- GitHub Pages 배포 완성

---

## [0.5.0] — 2026-05

### 변경 (Breaking)
- **전체 JS 리팩터링** — Utils / VB / SrsSystem / Progress / LevelMap 모듈 분리

### 수정 (Critical)
- `buildVariations()` 문법 오류 (`]` → `;`) — 앱 전체 동작 불가 원인
- 35개 onclick 중 10개 미정의 함수 연결

---

## [0.4.0] — 2026-05

### 수정 (QA 1차 — 8개)
- `isCorrect()` 중복 정의 / `sessionStartOk/Ng` 미선언
- OPIc·변형연습 탭 버튼 오작동
- 시제변환 과거형 중복 / 씨앗 상한선 누락

---

## [0.3.0] — 2026-05

### 추가
- L1~L4 레벨 필터
- 변형 연습 모드 (긍·부·질문 / 시제 / 동사교체 / 주어교체)
- 문장 늘리기 모드 (S→V→O→L→T)
- OPIc/스몰토크 모드 (IL/IM/IH 3단계)
- 하단 모드바 4탭

---

## [0.2.0] — 2026-05

### 추가
- 🔥 스트릭 / ⚡ XP / 세션 팝업 / 온보딩
- Ease Factor (쉬웠어요/어려웠어요)
- 부분 정답 / AI 피드백 (Claude API)
- SRS 백업/복원 (JSON)

### 수정
- `sw.js` Cache-First 전략
- `manifest.json` start_url 수정
- 진행 바 3px → 5px

---

## [0.1.0] — 2026-04

### 초기 릴리즈
- 한→영 영작 퀴즈 (500문장)
- Web Speech API STT/TTS
- 기본 SRS (망각곡선)
- PWA 기본 구조
