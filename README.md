# 📚 기본동사 영작퀴즈 (Quiz English)

**기본동사 100개 × 500문장**을 음성으로 영작하며 자연스러운 영어를 익히는 PWA 학습 앱

🔗 **라이브**: [https://plan153.github.io/Quiz-English/](https://plan153.github.io/Quiz-English/)

![iOS PWA](https://img.shields.io/badge/PWA-지원-7B6EF6?style=flat)
![Version](https://img.shields.io/badge/version-1.0.0-3EC98A?style=flat)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat)

---

## 주요 기능 (v1.0)

### ✏️ 영작 퀴즈
- 한국어 문장 → 영어로 말하기 (Web Speech API STT)
- **유연한 채점**: 관사(a/an/the) 차이·축약형 허용
- **부분 정답** 인식: "거의 맞아요!" 피드백
- **레벨 필터**: L1 초보 / L2 초급 / L3 중하 / L4 중급
- **탭 필터**: 전체 / 오늘 복습 / 틀린 것만
- ⌨️ 타이핑 모드 (STT 미지원 환경 대비)
- 👆 스와이프 제스처 / ⌨️ 키보드 단축키 (← → Space Enter)

### 🔄 변형 연습
씨앗 문장 1개 → 4가지 방향으로 즉시 변형:
- **긍·부·질문**: I go → I don't go → Do you go?
- **시제 변형**: 현재→과거→미래→진행형→부정
- **동사 교체**: have → get → own → hold
- **주어 교체**: I → He → She → We → They (3인칭 -s 자동)

### 🎤 쉐도잉 모드 *(v1.0 신규)*
- ① 모범 TTS 재생 → ② 내 음성 녹음 (MediaRecorder) → ③ 비교 청취
- 실시간 파형 시각화
- 속도 조절 (0.5x ~ 1.2x, 기본 0.8x)
- 퀴즈 현재 문장과 자동 동기화

### 🧱 문장 늘리기
- **기본 확장**: S → V → O → 장소 → 시간 (단계별 잠금해제)
- **시제 변환**: 씨앗 문장 → 6가지 시제 비교
- **문장 연결**: A + and/but/so/because + B

### 💬 OPIc / 스몰토크
- 6개 카테고리 × 2~3개 질문
- **IL / IM / IH** 3단계 모델 답변 비교
- 내 답변 직접 녹음 후 비교

### 📋 학습목표 관리 *(v1.0 신규)*
- 목표 생성/삭제 (컬러 자동 배정)
- 문장을 다른 목표로 이동
- 📢 **연속 읽기**: 목표 내 전체 TTS 자동 재생
- 🎤 목표 → 쉐도잉 모드 바로 진입

### 🧠 SRS — 망각곡선 복습
- SM-2 기반 복습 간격: 1 → 3 → 7 → 14 → 30일
- 😊 쉬웠어요 / 😓 어려웠어요 → ease factor 자동 조정
- 부분 정답 → 2일 후 복습
- 오답 횟수 시각화: 🟢 완벽 · 🟡 5~9회 · 🟠 10~14회 · 🔴 15회↑

### 🏠 학습 진도 영속성 *(v1.0 신규)*
- 재진입 시 **환영 화면**: 이어하기 / 핵심 복습 / 처음부터
- 마지막 문장 위치 자동 저장·복원
- 완료 문장·오늘 복습·정답률 통계 요약

### ⚙️ 학습 설정 *(v1.0 신규)*
| 설정 | 기본 | 설명 |
|------|------|------|
| 한국어 문장 보기 | ON | 문제 화면 한국어 표시 |
| 한국어 자동 음성 | OFF | 문제 전환 시 자동 읽기 |
| 정답 자동 음성 | ON | 정답 시 영어 TTS |
| 힌트 보기 | ON | 동사 카테고리 힌트 |
| 정답 보기 = 오답 처리 | ON | SRS 오답 기록 여부 |

### ✨ AI 피드백
- 오답 시 "왜 틀렸나요?" → **Claude API** 한국어 문법 설명

### 📊 기타
- 🔥 연속 학습 스트릭 / ⚡ XP 시스템
- 💾 SRS 데이터 JSON 백업/복원 (기기 변경 시 이력 유지)
- 📂 DB 관리: CSV 업로드·편집·삭제·추가
- 📱 PWA: 오프라인 동작, 홈 화면 추가 지원
- 🔔 학습 알림 (하루 최대 3번, Service Worker)

---

## 음성 시스템

| 항목 | 내용 |
|------|------|
| TTS 엔진 | Web Speech API (SpeechSynthesis) |
| 음성 출처 | **기기 내장 시스템 음성** (iOS/Android/macOS) |
| 외부 API | 없음 — 완전 무료·오프라인 동작 |
| 아이폰 기본 음성 | Ava (고품질) → Samantha (기본 탑재) |
| 음성 변경 | 🎙 버튼 → 음성 설정 패널에서 선택 |
| STT | Web Speech Recognition (Chrome 권장) |

---

## 코드 아키텍처

```
Utils                  순수 헬퍼 (normalize, tokenize, isCorrect...)
VB (VariationBuilders) 문장 변환 전략 패턴
  ├ makeNegative()       부정문 (don't / doesn't 자동 판별)
  ├ makeQuestion()       의문문 (Do/Does/Is/Are 자동)
  ├ changeTense()        시제 변환 (past/future/progressive)
  ├ replaceVerb()        동사 교체
  └ changeSubject()      주어 교체 + 3인칭 s 자동
SrsSystem              SM-2 SRS 복습 스케줄러
Progress               스트릭 + XP
LevelMap               힌트 기반 L1~L4 레벨 분류
ShadowMode             쉐도잉 모드 (MediaRecorder + TTS)
GoalManager            학습목표 관리
VarMode                변형 연습 모드
SBMode                 문장 늘리기 모드
OpicMode               OPIc 모드
run()                  DOMContentLoaded 앱 진입점
```

---

## DB 구조

```javascript
// 형식: [한국어문장, 영어정답, 힌트(동사·카테고리)]
["내 조카는 거북이를 키운다.", "My nephew has a turtle.", "HAVE · 소유/관계"]
```

| 동사 그룹 | Day | 문장 수 |
|-----------|-----|---------|
| HAVE | 1~10 | 50문장 |
| GET | 11~15 | 25문장 |
| MAKE | 16~19 | 20문장 |
| TAKE | 20~23 | 20문장 |
| DO / GO | 24~32 | 45문장 |
| COME / GIVE | 33~38 | 30문장 |
| 기타 핵심동사 | 39~100 | 310문장 |
| **합계** | **1~100** | **500문장** |

---

## 파일 구조

```
📁 Quiz-English/
├── index.html      ← 앱 전체 (HTML + CSS + JS + DB, 219KB)
├── sw.js           ← Service Worker (오프라인 캐시)
├── manifest.json   ← PWA 설정
├── icon.png        ← 앱 아이콘 (민트 V1)
└── README.md       ← 이 파일
```

---

## 버전 히스토리

| 버전 | 주요 내용 |
|------|-----------|
| v0.1 | 초기 앱 (STT 영작퀴즈, 기본 SRS) |
| v0.2 | 스트릭·XP·세션팝업·온보딩·AI피드백·SRS백업 |
| v0.3 | L1~L4 레벨 + 변형/늘리기/OPIc 모드 (4탭) |
| v0.4 | QA 1차 — 8개 버그 수정 |
| v0.5 | **전면 리팩터링** (Utils/VB/SrsSystem 전략패턴, 문법오류 수정) |
| v0.6 | 500문장 DB 통합, GitHub Pages 배포 파일 완성 |
| v0.7 | QA 2차 — 6개 버그 + 타이핑/스와이프/키보드 |
| v0.8 | 학습 진도 영속성 + 환영화면 + 설정 패널 |
| **v1.0** | **쉐도잉 + 학습목표 + 오답배지 + QA 검수 완료** |

---

## 아이폰 홈 화면 추가 (PWA)

```
1. Safari에서 https://plan153.github.io/Quiz-English/ 접속
2. 우측 하단 ··· (점 세 개) 아이콘 탭
3. 공유 버튼 탭
4. 홈 화면에 추가 선택
```

---

## GitHub Pages 배포

```
1. 리포지토리에 4개 파일 업로드
   (index.html / sw.js / manifest.json / icon.png)
2. Settings → Pages → Source: main 브랜치 / (root)
3. https://plan153.github.io/Quiz-English/ 접속
```

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프론트엔드 | Vanilla JS (ES2020+), HTML5, CSS3 |
| 음성 인식 (STT) | Web Speech API |
| TTS | Web Speech Synthesis (기기 내장) |
| 녹음 (쉐도잉) | MediaRecorder API |
| 오프라인 | Service Worker + Cache API |
| 저장소 | localStorage |
| AI 피드백 | Anthropic Claude API (claude-sonnet-4) |
| 배포 | GitHub Pages |
| 설치 | PWA (Progressive Web App) |

---

## 라이선스

MIT License · 학습 목적으로 자유롭게 사용 가능
