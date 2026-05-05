# 📚 기본동사 영작퀴즈

**기본동사 100개 × 500문장**을 음성으로 영작하며 자연스러운 영어를 익히는 PWA 학습 앱

🔗 **라이브 데모**: [https://plan153.github.io/Quiz-English/](https://plan153.github.io/Quiz-English/)

---

## 주요 기능

### ✏️ 영작 퀴즈
- 한국어 문장 → 영어로 말하기 (Web Speech API STT)
- **유연한 채점**: 관사(a/an/the) 차이, 축약형 허용
- **부분 정답** 인식: "거의 맞아요!" 피드백
- **레벨 필터**: L1(초보) / L2(초급) / L3(중하) / L4(중급)
- **탭 필터**: 전체 / 오늘 복습 / 틀린 것만

### 🔄 변형 연습
씨앗 문장 1개를 4가지 방향으로 즉시 변형:
- **긍·부·질문**: I go → I don't go → Do you go?
- **시제 변형**: 현재→과거→미래→진행형→부정
- **동사 교체**: have → get → own → hold
- **주어 교체**: I → He → She → We → They (3인칭 -s 자동)

### 🧱 문장 늘리기
단계별 문장 확장:
- **기본 확장**: S → S+V → S+V+O → S+V+O+장소 → +시간 (잠금 해제 방식)
- **시제 변환**: 씨앗 문장 → 6가지 시제 비교
- **문장 연결**: A + and/but/so/because + B

### 🎤 OPIc / 스몰토크
6개 카테고리 × 2~3개 질문, 각 IL→IM→IH 3단계 모델 답변:
- 자기소개 / 취미 / 직장 / 일상 / 여행 / 스몰토크
- 내 답변 직접 녹음 후 비교 가능

### 🧠 SRS (망각곡선 복습)
- SM-2 기반 복습 간격: 1→3→7→14→30일
- 😊 쉬웠어요 / 😓 어려웠어요 → ease factor 자동 조정
- 부분 정답: 2일 후 복습

### ✨ AI 피드백
오답 시 "왜 틀렸나요?" → Claude API가 한국어로 문법 설명

### 📊 기타
- 🔥 연속 학습 스트릭 / ⚡ XP 시스템
- 💾 SRS 데이터 JSON 백업/복원
- 📂 DB 관리: CSV 업로드, 문장 편집/삭제/추가
- 📱 PWA: 오프라인 동작, 홈 화면 추가
- 🔔 학습 알림 (하루 3번)

---

## DB 구조

```
[한국어 문장, 영어 정답, 힌트(동사·카테고리)]
```

예시:
```javascript
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

---

## 파일 구조

```
📁 Quiz-English/
├── index.html      ← 앱 전체 (HTML + CSS + JS 통합)
├── sw.js           ← Service Worker (오프라인 캐시)
├── manifest.json   ← PWA 설정
├── icon.png        ← 앱 아이콘
└── README.md       ← 이 파일
```

## 코드 아키텍처

```
Utils               순수 헬퍼 (normalize, tokenize, isCorrect...)
VB (VariationBuilders)  문장 변환 전략 패턴
  ├ makeNegative()      부정문 (don't / doesn't 자동 판별)
  ├ makeQuestion()      의문문 (Do/Does/Is/Are 자동)
  ├ changeTense()       시제 변환 (past/future/progressive)
  ├ replaceVerb()       동사 교체
  └ changeSubject()     주어 교체 + 3인칭 s 자동
SrsSystem           SM-2 SRS 복습 스케줄러
Progress            스트릭 + XP
LevelMap            힌트 기반 L1~L4 레벨 분류
VarMode             변형 연습 모드
SBMode              문장 늘리기 모드
OpicMode            OPIc 모드
run()               DOMContentLoaded 앱 진입점
```

---

## GitHub Pages 배포

1. 이 리포지토리를 Fork 또는 Clone
2. Settings → Pages → Source: `main` 브랜치 `/root`
3. `https://[username].github.io/[repo-name]/` 접속

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프론트엔드 | Vanilla JS (ES2020+), HTML5, CSS3 |
| 음성 인식 (STT) | Web Speech API |
| TTS | Web Speech Synthesis API |
| 오프라인 | Service Worker + Cache API |
| 저장소 | localStorage |
| AI 피드백 | Anthropic Claude API |
| 배포 | GitHub Pages |
| 설치 | PWA (Progressive Web App) |

---

## 라이선스

MIT License · 학습 목적으로 자유롭게 사용 가능
