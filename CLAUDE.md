# CLAUDE.md — 기본동사 영작퀴즈 (Quiz-English)

프로젝트 개발 지침. Claude Code 또는 Claude 채팅에서 이 프로젝트 작업 시 참조.

---

## 프로젝트 개요

- **앱**: 한국어→영어 영작 퀴즈 PWA
- **파일**: `index.html` (단일 파일 — HTML+CSS+JS+DB 500문장 통합)
- **배포**: GitHub Pages → `https://plan153.github.io/Quiz-English/`
- **버전**: v1.5.0

### 핵심 아키텍처

```
VB (VariationBuilders)  — 문장 변형 엔진 (부정/의문/시제/주어교체)
  makeNegative()        — 부정문 생성
  makePositive()        — 긍정문 복원 (부정→긍정)
  makeQuestion()        — 의문문 (일반)
  makeNegativeQuestion()— 부정 의문문 "Don't you think...?"
  changeTense()         — 시제 변환
  changeSubject()       — 주어 교체
  buildVariations()     — 4가지 변형 오케스트레이션 (pnq/tense/verb/subj)

SrsSystem               — SM-2 SRS (1→3→7→14→30일)
ShadowMode              — 쉐도잉 (MediaRecorder + TTS)
GoalManager             — 학습목표 CRUD
Progress                — 스트릭 + XP
```

### 변형 연습 (pnq) 로직

- **긍정 씨앗**: 부정 탭 제거 → [부정] [의문문] [긍정 답] [부정 답]
- **부정 씨앗**: 부정 탭 제거 → [긍정형] [의문문] [긍정 답] [부정 답]
- `isNegative()` 로 씨앗 판별
- compromise.js CDN 로드 (대명사 주어 문장 NLP 처리)

### VAR_DB (사전 생성 변형 DB)

- 500문장 × 변형(부정/의문/한국어) 사전 생성
- `const VAR_DB = {...}` — `buildVariations()` 에서 우선 참조
- 없으면 규칙 기반 자동 생성 (fallback)

---

## Karpathy 개발 가이드라인

*출처: [Andrej Karpathy's LLM coding observations](https://x.com/karpathy/status/2015883857489522876)*

### 1. 코딩 전에 먼저 생각하라

**가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 드러내라.**

구현 전에:
- 가정을 명시적으로 서술. 불확실하면 질문.
- 여러 해석이 가능하면 제시 — 조용히 하나를 고르지 말 것.
- 더 간단한 방법이 있으면 말하라. 필요하면 반박.
- 불명확하면 멈춰라. 무엇이 헷갈리는지 명시. 질문.

### 2. 단순함 우선

**문제를 해결하는 최소한의 코드. 추측성 코드 금지.**

- 요청 이상의 기능 추가 금지.
- 일회성 코드에 추상화 금지.
- 요청되지 않은 "유연성"이나 "설정 가능성" 금지.
- 불가능한 시나리오에 대한 오류 처리 금지.
- 200줄로 작성했는데 50줄로 가능하면 다시 써라.

스스로 물어봐라: "시니어 엔지니어가 이걸 보고 과도하게 복잡하다고 할까?" 그렇다면 단순화.

### 3. 외과적 변경

**반드시 필요한 것만 건드려라. 자신이 만든 문제만 정리하라.**

기존 코드 편집 시:
- 인접한 코드, 주석, 형식 "개선" 금지.
- 고장나지 않은 것 리팩토링 금지.
- 다르게 하고 싶어도 기존 스타일 맞추기.
- 관련 없는 데드 코드 발견 시 언급만 — 삭제 금지.

변경으로 고아가 생기면:
- 내 변경으로 사용되지 않게 된 import/변수/함수는 제거.
- 기존 데드 코드는 요청받지 않으면 제거 금지.

테스트: 변경된 모든 줄이 사용자 요청으로 직접 추적되어야 함.

### 4. 목표 중심 실행

**성공 기준을 정의하라. 검증될 때까지 반복하라.**

작업을 검증 가능한 목표로 전환:
- "검증 추가" → "잘못된 입력에 대한 테스트 작성, 그 다음 통과시키기"
- "버그 수정" → "버그를 재현하는 테스트 작성, 그 다음 통과시키기"
- "X 리팩토링" → "전후로 테스트 통과 확인"

다단계 작업은 간략한 계획 서술:
```
1. [단계] → 검증: [확인 방법]
2. [단계] → 검증: [확인 방법]
3. [단계] → 검증: [확인 방법]
```

---

## 프로젝트 개발 규칙

### 버전 업데이트 시 자동 반영

버전이 올라갈 때마다 동시에:
1. `index.html` — 버전 번호 업데이트
2. `CHANGELOG.md` — Added/Fixed/Architecture 섹션 추가
3. `README.md` — 버전 히스토리 표 최신화
4. `Quiz-English_vX.X.X_날짜.zip` — 6개 파일 패키징

### 버전 번호 규칙

```
v1.5.0  ← 현재
v1.6.0  ← 신기능 추가 시
v1.5.1  ← 버그 수정만 시
v2.0.0  ← 구조 전면 변경 시
```

### JS 수정 시 필수 검사

```bash
# 문법 확인
node --check index.html  # 또는 별도 추출 후

# VB 테스트 실행
node /tmp/vb_test.js

# 핵심 함수 존재 확인 (49개)
grep -c "function " index.html
```

### 배포

```bash
# 맥미니 터미널
cd ~/Downloads/Quiz-English_vX.X.X/
python3 upload_to_github.py
```

### localStorage 키 6종 (변경 금지)

| 키 | 용도 |
|----|------|
| `srs_v2` | SRS 복습 데이터 |
| `app_settings_v1` | 설정 5종 |
| `last_position_v1` | 학습 위치 |
| `voice_name` | 음성 이름 |
| `tts_rate` | TTS 속도 |
| `study_goals_v2` | 학습목표 |

---

*Karpathy 가이드라인 출처: https://github.com/forrestchang/andrej-karpathy-skills*
