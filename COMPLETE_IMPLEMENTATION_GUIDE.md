# 🚀 기본동사 영작퀴즈 — v2.0.0 완전 구현 가이드

**v1.7.0 → v2.0.0으로 진화하기**

---

## 📚 목차

1. [개요](#개요)
2. [파일 구조](#파일-구조)
3. [단계별 구현 방법](#단계별-구현-방법)
4. [테스트 가이드](#테스트-가이드)
5. [배포 및 마이그레이션](#배포-및-마이그레이션)

---

## 개요

### 🎯 목표
- ✅ **구조화**: 모놀리식 코드 → 모듈화된 아키텍처
- ✅ **사용자 시스템**: 다중 사용자 지원 + 맞춤 설정
- ✅ **날짜 기반 컨텐츠**: 하루 5문장, KST 기반
- ✅ **음성 개선**: 한국어/영어 선택, 플랫폼별 지원
- ✅ **연속 재생**: 오늘의 5문장 자동 재생

### 📊 현황
| 항목 | v1.7.0 | v2.0.0 |
|------|--------|--------|
| 파일 크기 | 476KB (단일) | 550KB 목표 |
| 모듈 수 | 0개 | 12개 |
| localStorage 키 | 6개 | 11개 (사용자별 격리) |
| 함수 수 | ~100개 | ~200개 (조직화됨) |
| 사용자 지원 | 1명 | N명 |

---

## 파일 구조

### 📂 새로운 구조 (v2.0.0)

```
index.html (기존 유지, 새 <script> 추가)
├── <style> — 기존 CSS + VOICE_PANEL_CSS
├── <html> — 기존 HTML + 음성 패널
└── <script>
    ├── PHASE_1_MODULES.js
    │   ├── Config — 설정 상수
    │   ├── Storage — localStorage 래퍼
    │   └── Utils — 순수 헬퍼 함수
    │
    ├── PHASE_2_USER_SYSTEM.js
    │   ├── UserManager — 사용자 관리
    │   ├── DailyScheduler — 날짜 관리 (KST)
    │   └── ContentManager — 컨텐츠 제공
    │
    ├── PHASE_3_VOICE_SYSTEM.js
    │   ├── VoiceRegistry — 음성 목록 (8개 En + 6개 Ko)
    │   ├── VoiceSettings — 음성 선택 저장
    │   ├── VoiceEngine — TTS/STT 엔진
    │   └── VoicePanel — 음성 선택 UI
    │
    ├── PHASE_4_FINAL_AND_INTEGRATION.js
    │   ├── SequentialPlayback — 순차 재생
    │   └── AppInitializer — 통합 초기화
    │
    └── app.js (기존 + 모듈 초기화)
```

### 📝 제공 파일

- ✅ `REFACTORING_STRATEGY.md` — 전체 전략 및 설계 문서
- ✅ `PHASE_1_MODULES.js` — Config, Storage, Utils (순수 함수)
- ✅ `PHASE_2_USER_SYSTEM.js` — 사용자 시스템 + 날짜 기반 컨텐츠
- ✅ `PHASE_3_VOICE_SYSTEM.js` — 음성 시스템 완전 개선
- ✅ `PHASE_4_FINAL_AND_INTEGRATION.js` — 연속 재생 + 통합 초기화
- ✅ 이 파일 — 구현 가이드

---

## 단계별 구현 방법

### 🔵 PHASE 1: 구조화 (1주)

#### 목표
기존 코드에 영향 없이 새 모듈 추가. 회귀 테스트로 기존 기능 검증.

#### 작업 순서

1️⃣ **PHASE_1_MODULES.js 적용**

```html
<!-- index.html <head> 직전에 추가 -->
<script src="PHASE_1_MODULES.js"></script>
```

2️⃣ **기존 코드 마이그레이션 (선택사항)**

기존 전역변수 → Config/Utils로 대체:

```javascript
// ❌ 기존 (전역)
SHOW_KO = true;
TTS_RATE = 1.0;
normalize(text);

// ✅ v2.0 (모듈)
Config.DEFAULT_USER_PREFERENCES.lang_ko
Storage.get('settings_v1', userId);
Utils.normalize(text);
```

3️⃣ **테스트**

```javascript
// 콘솔에서 실행
const config = new Config();
console.log('✅ Config:', config.getTodayKST());

const storage = new Storage();
storage.set('test', 'hello', 'user_1');
console.log('✅ Storage:', storage.get('test', 'user_1'));

const utils = new Utils();
console.log('✅ Utils:', utils.isCorrect('hello', 'Hello'));
```

#### 성공 기준
- ✅ 기존 기능 100% 동작
- ✅ 콘솔 에러 0개
- ✅ localStorage 사용량 < 50KB

---

### 🔵 PHASE 2: 사용자 시스템 (1주)

#### 목표
첫 방문 vs. 재방문 사용자 구분. 사용자별 데이터 격리.

#### 작업 순서

1️⃣ **PHASE_2_USER_SYSTEM.js 적용**

```html
<!-- index.html -->
<script src="PHASE_1_MODULES.js"></script>
<script src="PHASE_2_USER_SYSTEM.js"></script>
```

2️⃣ **앱 초기화 코드**

```javascript
// DOMContentLoaded 이벤트에서
const userManager = new UserManager();
const currentUser = userManager.getCurrentUser();

console.log('현재 사용자:', currentUser.name);
console.log('모든 사용자:', userManager.getAllUsers());

// 날짜 기반
const todayLabel = DailyScheduler.getTodayLabel();
console.log('오늘:', todayLabel);

const stats = ContentManager.getProgressStats(currentUser.id, DB.sentences);
console.log('진행도:', stats);
```

3️⃣ **환영 화면 렌더링**

```javascript
function renderWelcomeScreen(userManager) {
  const user = userManager.getCurrentUser();
  const todaysSentences = DailyScheduler.getTodaysSentences();
  
  const html = `
    <div class="welcome">
      <h2>${user.name}님, 환영합니다!</h2>
      
      <button onclick="continueLastStudy()">
        📚 이어하기
      </button>
      
      <button onclick="playToday()">
        🌟 오늘의 5문장 (${todaysSentences.length}개)
      </button>
    </div>
  `;
  
  document.getElementById('welcome-screen').innerHTML = html;
}
```

4️⃣ **테스트**

```javascript
// 새 사용자 생성
const newUser = userManager.createUser('테스트사용자');
console.log('새 사용자:', newUser.name);

// 사용자 목록 확인
const allUsers = userManager.getAllUsers();
console.log('사용자 수:', allUsers.length);

// 날짜별 컨텐츠
const filtered = ContentManager.getFilteredSentences(
  DB.sentences,
  'all',      // 레벨
  'today',    // 탭
  newUser.id
);
console.log('오늘의 문장:', filtered.length);
```

#### 성공 기준
- ✅ 새 사용자 생성 성공
- ✅ 재방문 시 자동 로그인
- ✅ localStorage 키 형식: `srs_v2:user_123` (사용자별 격리)
- ✅ 오늘의 5문장 명확히 표시

---

### 🔵 PHASE 3: 음성 시스템 (1주)

#### 목표
한국어/영어 음성 선택 저장. 플랫폼별 음성 제공.

#### 작업 순서

1️⃣ **PHASE_3_VOICE_SYSTEM.js 적용**

```html
<!-- index.html -->
<script src="PHASE_1_MODULES.js"></script>
<script src="PHASE_2_USER_SYSTEM.js"></script>
<script src="PHASE_3_VOICE_SYSTEM.js"></script>

<!-- CSS 추가 -->
<style>
  /* VOICE_PANEL_CSS 내용 복사 */
  .voice-panel { ... }
</style>
```

2️⃣ **음성 패널 렌더링**

```javascript
const userManager = new UserManager();
const currentUser = userManager.getCurrentUser();
const voicePanel = new VoicePanel(currentUser.id);

// HTML 렌더링
document.getElementById('voice-settings').innerHTML = voicePanel.renderPanel();

// 전역 함수 설정
window._selectVoice = (lang, voiceId) => {
  voicePanel.selectVoice(lang, voiceId);
};

window._previewVoice = (lang, voiceId) => {
  voicePanel.previewVoice(lang, voiceId);
};
```

3️⃣ **음성 엔진 테스트**

```javascript
const userId = currentUser.id;
const voiceEngine = new VoiceEngine(userId);

// 한국어 재생
voiceEngine.speakKo('안녕하세요!', () => {
  console.log('✅ 한국어 재생 완료');
});

// 영어 재생
voiceEngine.speakEn('Hello!', () => {
  console.log('✅ 영어 재생 완료');
});

// 음성 인식
voiceEngine.startRecognition(
  (result, interim) => console.log('인식:', result),
  (final) => console.log('최종:', final)
);
```

4️⃣ **테스트**

```javascript
// 가능한 음성 확인
const enVoices = VoiceRegistry.getAvailableVoices('en');
const koVoices = VoiceRegistry.getAvailableVoices('ko');

console.log(`📊 사용 가능한 음성:`);
console.log(`  영어: ${enVoices.length}개`);
console.log(`  한국어: ${koVoices.length}개`);

// 음성 저장/로드
VoiceSettings.setVoice('ko', 'yuna', userId);
const savedVoice = VoiceSettings.getVoice('ko', userId);
console.log('✅ 저장된 음성:', savedVoice);

// 미리 듣기
voicePanel.previewVoice('ko', 'yuna');
```

#### 성공 기준
- ✅ 한국어/영어 음성 선택 UI 표시
- ✅ 선택한 음성 저장 (`voice_ko_name:user_123`)
- ✅ 재방문 시 저장된 음성 로드
- ✅ 미리 듣기 기능 작동

---

### 🔵 PHASE 4: 연속 재생 & 통합 (1주)

#### 목표
오늘의 5문장을 자동으로 순차 재생. 모든 모듈 통합.

#### 작업 순서

1️⃣ **PHASE_4_FINAL_AND_INTEGRATION.js 적용**

```html
<!-- index.html -->
<script src="PHASE_1_MODULES.js"></script>
<script src="PHASE_2_USER_SYSTEM.js"></script>
<script src="PHASE_3_VOICE_SYSTEM.js"></script>
<script src="PHASE_4_FINAL_AND_INTEGRATION.js"></script>
```

2️⃣ **앱 초기화**

```javascript
// DOMContentLoaded 이벤트
document.addEventListener('DOMContentLoaded', async () => {
  const modules = await AppInitializer.initialize();
  
  const {
    userManager,
    voiceEngine,
    sequentialPlayback,
    currentUser
  } = modules;
  
  // 윈도우에 노출 (디버깅)
  window.app = modules;
  window.utils = { Utils, Storage, Config };
  
  console.log('✅ 앱 초기화 완료');
});
```

3️⃣ **오늘의 5문장 재생**

```javascript
const { sequentialPlayback } = window.app;

// 콜백 설정
sequentialPlayback.onStart = (info) => {
  console.log(`🎬 ${info.totalCount}개 문장 재생 시작`);
};

sequentialPlayback.onNext = (data) => {
  const { ko, en, current, total, percentage } = data;
  
  // UI 업데이트
  document.getElementById('ko-text').textContent = ko;
  document.getElementById('en-text').textContent = en;
  document.getElementById('progress').textContent = `${current}/${total}`;
  document.getElementById('progress-bar').style.width = percentage + '%';
};

sequentialPlayback.onEnd = () => {
  alert('오늘의 5문장 재생 완료! ✨');
};

// 재생 시작
sequentialPlayback.playTodaySequence('both');

// 제어
document.getElementById('pause-btn').onclick = () => sequentialPlayback.pause();
document.getElementById('resume-btn').onclick = () => sequentialPlayback.resume();
document.getElementById('stop-btn').onclick = () => sequentialPlayback.stop();

// 속도 조절
document.getElementById('speed-slider').onchange = (e) => {
  sequentialPlayback.setPlaybackSpeed(parseFloat(e.target.value));
};
```

4️⃣ **테스트**

```javascript
const playback = window.app.sequentialPlayback;

// 상태 확인
console.log('현재 상태:', playback.getStatus());

// 재생
playback.playTodaySequence('both');

// 다음 문장으로
playback.skipToNext();

// 이전 문장으로
playback.skipToPrevious();

// 특정 인덱스로 이동
playback.skipToIndex(2);

// 일시 정지
playback.pause();

// 재개
playback.resume();

// 중단
playback.stop();
```

#### 성공 기준
- ✅ 오늘의 5문장 자동 재생
- ✅ 한국어 → 영어 순차 재생
- ✅ 일시 정지/재개 기능
- ✅ 속도 조절 (0.5x ~ 1.2x)
- ✅ 진행도 표시 (n/5)

---

## 테스트 가이드

### 🧪 단위 테스트

#### Config 테스트
```javascript
// 테스트 코드
test('Config.getTodayKST는 정확한 날짜를 반환한다', () => {
  const config = new Config();
  const today = config.getTodayKST();
  
  // YYYY-MM-DD 형식 확인
  expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  
  // 실제 오늘인지 확인
  const kstDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const kstToday = kstDate.toISOString().split('T')[0];
  
  expect(today).toBe(kstToday);
});

// 실행
Config.getTodayKST(); // "2026-05-14"
```

#### Storage 테스트
```javascript
test('Storage는 사용자별로 데이터를 격리한다', () => {
  const user1 = 'user_1';
  const user2 = 'user_2';
  
  Storage.set('srs_v2', { sent_1: { done: true } }, user1);
  Storage.set('srs_v2', { sent_2: { done: true } }, user2);
  
  const user1Data = Storage.get('srs_v2', user1);
  const user2Data = Storage.get('srs_v2', user2);
  
  expect(user1Data).toEqual({ sent_1: { done: true } });
  expect(user2Data).toEqual({ sent_2: { done: true } });
});

// 실행
Storage.set('test', 'data', 'user_1');
Storage.get('test', 'user_1'); // "data"
```

#### Utils 테스트
```javascript
test('Utils.isCorrect는 정답 여부를 판정한다', () => {
  const correct = Utils.isCorrect('I go to school', 'I go to school');
  const wrong = Utils.isCorrect('I go to home', 'I go to school');
  
  expect(correct).toBe(true);
  expect(wrong).toBe(false);
});

// 실행
Utils.isCorrect('hello', 'Hello'); // true
Utils.isCorrect('goodbye', 'hello'); // false
```

### 🎯 통합 테스트

#### 사용자 흐름 테스트

```javascript
// 시나리오: 첫 방문 → 환영화면 → 오늘의 5문장 → 저장

// 1. 새 사용자 생성 (첫 방문)
const userManager = new UserManager();
const user = userManager.createUser('김영어');

// 2. 환영 화면
console.log('사용자:', user.name);
console.log('오늘:', DailyScheduler.getTodayLabel());

// 3. 오늘의 5문장 조회
const filtered = ContentManager.getFilteredSentences(
  DB.sentences,
  'all',
  'today',
  user.id
);
console.log(`오늘 풀어야 할 문장: ${filtered.length}`);

// 4. 음성 설정
const voicePanel = new VoicePanel(user.id);
voicePanel.selectVoice('ko', 'yuna');
voicePanel.selectVoice('en', 'ava');

// 5. 재생
const sequentialPlayback = new SequentialPlayback(
  new VoiceEngine(user.id),
  DB.sentences
);
sequentialPlayback.playTodaySequence('both');

// 6. 진행도 저장
userManager.updateStats(user.id, {
  totalSentences: 5,
  correctCount: 4,
  correctRate: 80
});

// 7. 데이터 확인
const stats = userManager.getStats(user.id);
console.log('최종 통계:', stats);
```

### 🔍 회귀 테스트

기존 기능이 깨지지 않았는지 확인:

```javascript
// ✅ 기존 변형 함수
const vb = new VB(); // 기존 코드
const result = vb.makeNegative('I go to school');
expect(result).toBe('I dont go to school');

// ✅ 기존 SRS 시스템
const srs = new SrsSystem();
srs.recordResult('sent_1', true); // 정답
const nextReview = srs.getNextReviewDate('sent_1');
expect(nextReview).not.toBeNull();

// ✅ 기존 정답 채점
const isCorrect = isCorrect('i go', 'I go');
expect(isCorrect).toBe(true);
```

---

## 배포 및 마이그레이션

### 📦 배포 절차

#### 1단계: v1.7 → v2.0 마이그레이션

```html
<!-- index.html -->

<!-- 기존 코드는 그대로 유지 -->
<script src="existing-code.js"></script>

<!-- 새 모듈 추가 (위에) -->
<script src="PHASE_1_MODULES.js"></script>
<script src="PHASE_2_USER_SYSTEM.js"></script>
<script src="PHASE_3_VOICE_SYSTEM.js"></script>
<script src="PHASE_4_FINAL_AND_INTEGRATION.js"></script>

<!-- 초기화 코드 -->
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const modules = await AppInitializer.initialize();
    window.app = modules;
  });
</script>
```

#### 2단계: 배포 전 체크리스트

```
✅ 로컬 테스트
  □ npm test (또는 브라우저 콘솔)
  □ 첫 방문 사용자 시나리오
  □ 재방문 사용자 시나리오
  □ 음성 선택 저장/로드
  □ 날짜 변경 시 새 5문장
  □ 오프라인 동작

✅ 파일 검사
  □ 번들 크기 < 550KB
  □ 문법 오류 0개 (node --check)
  □ 순환 의존성 확인
  □ localStorage 사용량 < 5MB

✅ 성능
  □ 첫 로드 < 2초 (3G)
  □ 메모리 사용량 < 50MB
  □ CPU 사용률 < 20% (유휴)
  □ 배터리 소비 < 5% (1시간)

✅ 호환성
  □ Chrome 최신
  □ Safari (iOS 12+)
  □ Firefox 최신
  □ Samsung Internet (Android)
```

#### 3단계: 버전 업데이트

```javascript
// index.html에서
// v1.7.0 → v2.0.0
```

**CHANGELOG.md 예시:**

```markdown
## [2.0.0] — 2026-05-14

### 🎯 주요 변경사항
- 💻 **모듈화**: 모놀리식 → 12개 핵심 모듈로 재설계
- 👤 **사용자 시스템**: 다중 사용자 지원, 사용자별 데이터 격리
- 📅 **날짜 기반 컨텐츠**: 하루 5문장, KST 기반 자동 갱신
- 🎙️  **음성 개선**: 한국어/영어 음성 선택 저장, 플랫폼별 지원
- 📢 **연속 재생**: 오늘의 5문장 자동 순차 재생

### 📝 상세
- Config: 설정 상수 통합 관리
- Storage: 사용자별 localStorage 격리 (key:{userId})
- Utils: 80개+ 순수 헬퍼 함수
- UserManager: 사용자 생성/선택/전환
- DailyScheduler: KST 시간대, 100일 주기
- VoiceRegistry: 8개 영어 + 6개 한국어 음성
- SequentialPlayback: 일시정지/재개/속도조절

### ⚠️ Breaking Changes
- localStorage 키 형식 변경: `srs_v2` → `srs_v2:{userId}`
  → 자동 마이그레이션 스크립트 제공

### 🆙 마이그레이션 가이드
[COMPLETE_IMPLEMENTATION_GUIDE.md 참조]
```

#### 4단계: 배포

```bash
# GitHub Pages
cd Quiz-English
git add -A
git commit -m "v2.0.0: 모듈화, 사용자 시스템, 날짜 기반 컨텐츠"
git push origin main

# 배포 확인
# https://plan153.github.io/Quiz-English/
```

### 🔄 롤백 계획

만약 문제가 발생하면:

```bash
# 이전 버전으로 되돌리기
git revert <commit-hash>
git push origin main

# 또는 즉시 복구
git checkout v1.7.0
git push origin main --force
```

---

## 🎓 학습 자료

### 추천 읽기 순서

1. `REFACTORING_STRATEGY.md` — 전체 그림 이해
2. `PHASE_1_MODULES.js` — 기초 (Config, Storage, Utils)
3. `PHASE_2_USER_SYSTEM.js` — 사용자 (UserManager, DailyScheduler)
4. `PHASE_3_VOICE_SYSTEM.js` — 음성 (VoiceEngine, VoicePanel)
5. `PHASE_4_FINAL_AND_INTEGRATION.js` — 통합 (SequentialPlayback)

### 주요 개념

#### 의존성 주입 (Dependency Injection)

```javascript
// ❌ 나쁜 예: 전역 의존
class VoiceEngine {
  speakEn(text) {
    const voice = window.currentVoice; // 전역변수
  }
}

// ✅ 좋은 예: 주입된 의존
class VoiceEngine {
  constructor(voiceRegistry, userSettings) {
    this.registry = voiceRegistry;
    this.settings = userSettings;
  }
}
```

#### 단일 책임 원칙 (Single Responsibility)

```javascript
// ✅ 각 클래스는 하나의 책임만 담당
class Config { }           // 설정 관리
class Storage { }          // 데이터 저장
class UserManager { }      // 사용자 관리
class VoiceEngine { }      // 음성 재생
```

#### 전략 패턴 (Strategy Pattern)

```javascript
// 다양한 변형 전략 (기존 VB 유지)
const strategies = {
  makeNegative: () => { ... },
  makeQuestion: () => { ... },
  changeTense: () => { ... }
};

// 런타임에 전략 선택
const transform = (sentence, strategyName) => {
  return strategies[strategyName](sentence);
};
```

---

## 📞 자주 묻는 질문 (FAQ)

### Q: 기존 코드는 언제 제거하나요?
**A:** v2.0에서는 기존 코드 유지. v2.1 이상에서 점진적 제거.

### Q: 기존 사용자 데이터는 어떻게 되나요?
**A:** 자동 마이그레이션 (Storage.migrateFromV1).

### Q: 오프라인에서 작동하나요?
**A:** 네, Service Worker + Cache API로 완전 오프라인 지원.

### Q: 음성 인식(STT)은?
**A:** Web Speech API로 기존 기능 유지. Chrome/Safari 권장.

### Q: 배포는 어떻게 하나요?
**A:** GitHub Pages 배포 (자동), 또는 자체 서버 (index.html만 필요).

---

## 📈 다음 단계

### v2.1 계획 (2026-06)
- Google Cloud TTS API 통합 (고품질 음성)
- OpenAI TTS 통합 (ChatGPT 음성)
- 음성 스타일 선택 (감정, 속도 등)

### v2.2 계획 (2026-07)
- AI 피드백 개선 (Claude API)
- 학습 분석 대시보드
- 커뮤니티 기능 (사용자 간 점수 비교)

### v2.3 계획 (2026-08)
- 오프라인 모드 강화
- 다국어 지원 (영어 퀴즈 UI)
- 테마 커스터마이징

---

**작성일**: 2026-05-14  
**버전**: v2.0.0 Final  
**상태**: ✅ 구현 준비 완료

**문의**: [GitHub Issues](https://github.com/plan153/Quiz-English/issues)
