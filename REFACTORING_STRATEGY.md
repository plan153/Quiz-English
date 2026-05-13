# 🎯 기본동사 영작퀴즈 — 구조화 재설계 및 기능 확장 전략안
**v1.7.0 → v2.0.0 로드맵**

---

## 📋 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [구조화 및 모듈화 전략](#구조화-및-모듈화-전략)
3. [사용자 시스템 개선](#사용자-시스템-개선)
4. [신규 기능 상세 계획](#신규-기능-상세-계획)
5. [단계별 구현 로드맵](#단계별-구현-로드맵)

---

## 현재 상태 분석

### 📊 현재 구조의 장점 ✅
- 단일 HTML 파일로 배포 간편 (PWA)
- 500문장 DB 통합 + Service Worker 오프라인 동작
- VB(VariationBuilders) 패턴으로 문장 변형 체계화
- SRS 기반 복습 시스템 구현
- localStorage 기반 데이터 영속성

### ⚠️ 현재 구조의 문제점 ❌
1. **모놀리식 구조**: CSS + HTML + JS + DB가 모두 하나의 파일
2. **재사용성 부족**: 함수들이 전역 스코프에 흩어져 있음
3. **테스트 어려움**: 순환 의존성, 전역변수 남용
4. **유지보수 복잡**: 새 기능 추가 시 기존 코드에 미치는 영향 파악 어려움
5. **음성 시스템 중복**: Ko/En 음성 선택이 체계화되지 않음
6. **사용자 시스템 부재**: 모든 사용자가 같은 데이터 공유
7. **DB 관리 수동**: 날짜별 컨텐츠 제공 불가

---

## 구조화 및 모듈화 전략

### 📦 신규 아키텍처 (v2.0.0)

```
index.html (구조 변경 없음, 단일 배포)
├── CSS (전체)
├── HTML (전체)
├── JS — 5개 주요 모듈로 분리
│   ├── core/
│   │   ├── Config.js          ← 설정, 상수, 시간대 관리
│   │   ├── Storage.js         ← localStorage 계층화 (사용자별 격리)
│   │   └── Utils.js           ← 순수 헬퍼 함수 (80개+)
│   │
│   ├── user/
│   │   ├── UserManager.js     ← 사용자 생성/선택/전환
│   │   └── UserProfile.js     ← 사용자 프로필 (이름, 선호도, 통계)
│   │
│   ├── voice/
│   │   ├── VoiceEngine.js     ← TTS/STT 통합 (Ko/En 분리)
│   │   ├── VoiceRegistry.js   ← 음성 목록 (플랫폼별)
│   │   └── VoiceSettings.js   ← 사용자 음성 저장/복원
│   │
│   ├── content/
│   │   ├── ContentManager.js  ← 날짜별 컨텐츠 제공 (하루 5문장)
│   │   ├── DailyScheduler.js  ← KST 기반 일정 관리
│   │   └── VAR_DB.js          ← 변형 사전 (사전생성)
│   │
│   ├── learning/
│   │   ├── VB.js              ← 문장 변형 (부정/의문/시제 등)
│   │   ├── SrsSystem.js        ← SM-2 복습 스케줄러
│   │   └── Progress.js         ← 스트릭 + XP
│   │
│   ├── ui/
│   │   ├── UIRenderer.js       ← 화면 렌더링 (React 스타일)
│   │   ├── ScreenManager.js    ← 모드/탭 전환
│   │   └── VoicePanel.js       ← 음성 선택 UI
│   │
│   └── app.js                  ← 진입점 (초기화, 이벤트 위임)
│
└── DB
    └── 500문장 (내장)
```

### 🔄 핵심 설계 원칙

#### 1. **사용자 격리 (User Isolation)**
```javascript
// 각 사용자마다 독립적인 데이터 공간
storage.get('srs_v2', userId)     // userId = "user_123"
storage.get('settings_v1', userId)
storage.get('progress_v1', userId)

// 전역 데이터는 userId 없이
storage.get('voice_registry')      // 모든 사용자 공유
```

#### 2. **의존성 주입 (Dependency Injection)**
```javascript
// ❌ 나쁜 예: 전역 변수 의존
function speakEn(text) {
  const voice = window.currentVoice; // 전역변수 의존
}

// ✅ 좋은 예: 명시적 주입
class VoiceEngine {
  constructor(voiceRegistry, userSettings) {
    this.registry = voiceRegistry;
    this.settings = userSettings;
  }
}
```

#### 3. **계층화된 Storage**
```javascript
// ❌ 문제: 모든 데이터가 혼재
localStorage.setItem('srs_v2', JSON.stringify({
  user1_data: {...},
  user2_data: {...},
  global_data: {...}
}));

// ✅ 개선: 사용자별 키 분리
localStorage.setItem('srs_v2:user_123', JSON.stringify({...}));
localStorage.setItem('settings_v1:user_123', JSON.stringify({...}));
localStorage.setItem('voice_registry', JSON.stringify({...})); // 전역
```

---

## 사용자 시스템 개선

### 👤 UserManager 설계

```javascript
class UserManager {
  // 사용자 생성 (처음 방문)
  createUser(name, preferences = {}) {
    const userId = 'user_' + Date.now();
    const profile = {
      id: userId,
      name,
      createdAt: new Date().toISOString(),
      deviceId: this.getDeviceId(),
      preferences: {
        lang_ko: true,
        voice_en: 'default',
        voice_ko: 'Yuna',
        tts_rate: 1.0,
        theme: 'dark',
        ...preferences
      },
      stats: {
        totalSentences: 0,
        correctRate: 0,
        currentStreak: 0,
        xp: 0,
        lastActiveAt: null
      }
    };
    
    Storage.set('users_list', [...this.getAllUsers(), userId]);
    Storage.set('user_profile:' + userId, profile);
    Storage.set('current_user', userId); // 현재 활성 사용자
    
    return profile;
  }

  // 사용자 선택 (기존 사용자 로그인)
  selectUser(userId) {
    const profile = Storage.get('user_profile:' + userId);
    if (!profile) throw new Error('사용자를 찾을 수 없습니다');
    
    Storage.set('current_user', userId);
    this.loadUserData(userId);
    
    return profile;
  }

  // 현재 활성 사용자
  getCurrentUser() {
    const userId = Storage.get('current_user');
    if (!userId) return this.createUser('기본사용자');
    
    return Storage.get('user_profile:' + userId);
  }

  // 모든 사용자 목록
  getAllUsers() {
    const userIds = Storage.get('users_list') || [];
    return userIds.map(id => Storage.get('user_profile:' + id));
  }

  // 기기 식별 (언제 새 사용자인지 판단)
  getDeviceId() {
    let deviceId = Storage.get('device_id');
    if (!deviceId) {
      deviceId = 'device_' + navigator.userAgent.split('/').pop() + '_' + Date.now();
      Storage.set('device_id', deviceId);
    }
    return deviceId;
  }

  // 사용자 삭제
  deleteUser(userId) {
    const userIds = Storage.get('users_list') || [];
    Storage.set('users_list', userIds.filter(id => id !== userId));
    
    // 사용자 관련 모든 데이터 삭제
    Object.keys(localStorage).forEach(key => {
      if (key.includes(userId)) localStorage.removeItem(key);
    });
    
    // 다른 사용자로 전환
    if (Storage.get('current_user') === userId) {
      const remaining = this.getAllUsers();
      if (remaining.length > 0) {
        this.selectUser(remaining[0].id);
      }
    }
  }
}
```

### 🎯 첫 방문 vs. 재방문 흐름

```
┌─ 앱 로드 ─┐
│
├─ localStorage 확인
│  ├─ 비어있음? → 새 사용자 생성
│  │  └─ UserManager.createUser('첫방문자')
│  │
│  └─ 데이터 있음? → 기존 사용자 선택
│     ├─ 1명만? → 자동 로그인
│     └─ 2명이상? → 사용자 선택 화면
│
├─ 환영 화면 표시
│  ├─ [이어하기] (마지막 위치)
│  ├─ [오늘의 5문장] (DailyScheduler)
│  ├─ [전체 복습]
│  └─ [처음부터]
│
└─ 퀴즈 시작
```

---

## 신규 기능 상세 계획

### 🗓️ 1. 날짜별 컨텐츠 제공 (하루 5문장)

#### 설계: `DailyScheduler` + `ContentManager`

```javascript
class DailyScheduler {
  // KST 자정 기준
  getToday() {
    const now = new Date();
    const kstTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    return kstTime.toISOString().split('T')[0]; // "2026-05-14"
  }

  // 앱 설치 후 경과 일수
  getDaysSinceInstall() {
    const installDate = Storage.get('install_date') || this.getToday();
    const today = this.getToday();
    
    const d1 = new Date(installDate);
    const d2 = new Date(today);
    const diffMs = d2 - d1;
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    
    return diffDays;
  }

  // 오늘의 5문장 인덱스 (0~499)
  getTodaysSentences() {
    const dayIndex = this.getDaysSinceInstall();
    const baseIndex = (dayIndex % 100) * 5; // 100일마다 반복
    
    return [
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 3,
      baseIndex + 4
    ].map(i => i % 500); // 500문장 순환
  }
}

class ContentManager {
  // 레벨/탭 필터 + 날짜별 제공
  getFilteredSentences(level, tab, userId) {
    const allSentences = DB.sentences; // 500문장
    const scheduler = new DailyScheduler();
    const todaysSentences = scheduler.getTodaysSentences();
    
    let filtered = allSentences;
    
    // 레벨 필터
    if (level !== 'all') {
      filtered = filtered.filter(s => s.level === level);
    }
    
    // 탭 필터
    switch (tab) {
      case 'today':
        // 오늘의 5문장 + 복습 대기 중인 것
        const srs = Storage.get('srs_v2', userId);
        const dueIds = Object.entries(srs || {})
          .filter(([_, s]) => s.dueDate <= scheduler.getToday())
          .map(([id]) => id);
        
        filtered = filtered.filter(s =>
          todaysSentences.includes(s.id) || dueIds.includes(s.id)
        );
        break;
        
      case 'wrong':
        const wrong = Storage.get('srs_v2', userId);
        filtered = filtered.filter(s => wrong && wrong[s.id] && wrong[s.id].failCount > 0);
        break;
    }
    
    return filtered;
  }

  // "오늘의 5문장" 텍스트로 표시
  getTodayLabel() {
    const scheduler = new DailyScheduler();
    const today = scheduler.getToday();
    const d = new Date(today);
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    
    return `오늘의 5문장 (${today.split('-')[1]}/${today.split('-')[2]} ${dayName}요일)`;
  }
}
```

#### 사용자 경험 개선

```
환영 화면 (첫 방문)
├─ [📚 이어하기]     ← 마지막 학습 위치
├─ [🌟 오늘의 5문장]  ← 🔴 신규: 오늘만의 특정 5문장
├─ [♻️ 복습 대기]     ← SRS 복습 필요한 것
└─ [🎯 전체 처음부터]

진행 바
├─ 📊 오늘: 0/5 (5문장 중 0개 완료)
├─ 📅 이번주: 12/35
└─ 📈 누적: 123/500
```

---

### 🎙️ 2. 한국어 음성 선택 저장 및 다중 음성 지원

#### 설계: `VoiceRegistry` + `VoiceSettings`

```javascript
class VoiceRegistry {
  // 플랫폼별 음성 목록 (사전 정의)
  static VOICES = {
    en: {
      // 영어
      default: {
        name: 'System Default',
        badge: '📱',
        description: '기기 기본 음성',
        quality: 'basic',
        provider: 'system'
      },
      ava: {
        name: 'Ava',
        badge: '⭐',
        description: 'iOS 프리미엄',
        quality: 'premium',
        provider: 'ios'
      },
      samantha: {
        name: 'Samantha',
        badge: '⭐',
        description: 'iOS 자연스러움',
        quality: 'premium',
        provider: 'ios'
      },
      'google-en': {
        name: 'Google English',
        badge: '☁️',
        description: '구글 클라우드',
        quality: 'premium',
        provider: 'google'
      },
      // ... 총 12개
    },
    ko: {
      // 한국어
      yuna: {
        name: 'Yuna',
        badge: '🥇',
        description: '가장 자연스러움',
        quality: 'premium',
        provider: 'ios'
      },
      seoyeon: {
        name: 'Seoyeon',
        badge: '🥈',
        description: '자연스러움',
        quality: 'premium',
        provider: 'ios'
      },
      nari: {
        name: 'Nari',
        badge: '🥉',
        description: '기본 음성',
        quality: 'basic',
        provider: 'system'
      },
      'google-ko': {
        name: 'Google 한국어',
        badge: '☁️',
        description: '구글 클라우드',
        quality: 'premium',
        provider: 'google'
      },
      'chatgpt-ko': {
        name: 'OpenAI Korean',
        badge: '✨',
        description: 'ChatGPT 음성',
        quality: 'premium',
        provider: 'openai'
      }
      // ... 총 5개
    }
  };

  // 현재 플랫폼에서 사용 가능한 음성
  getAvailableVoices(lang = 'en') {
    const available = [];
    const voices = window.speechSynthesis?.getVoices() || [];
    
    Object.entries(this.VOICES[lang]).forEach(([id, meta]) => {
      // 시스템 음성 확인
      if (meta.provider === 'system') {
        const found = voices.find(v =>
          v.lang.startsWith(lang.split('-')[0])
        );
        if (found) available.push({ id, ...meta, native: found });
      } else {
        // 클라우드/서드파티는 활성화 여부만 확인
        available.push({ id, ...meta });
      }
    });
    
    return available;
  }

  // 플랫폼별 기본값
  getDefaultVoice(lang = 'en') {
    const available = this.getAvailableVoices(lang);
    
    // 우선순위: 사용자 선택 > 프리미엄 > 기본
    return available.find(v => v.quality === 'premium') ||
           available[0];
  }
}

class VoiceSettings {
  // 사용자 음성 선택 저장
  setVoice(lang, voiceId, userId) {
    const key = lang === 'ko' ? 'voice_ko_name' : 'voice_en_name';
    Storage.set(key, voiceId, userId); // ← userId 포함
  }

  // 사용자 음성 선택 로드
  getVoice(lang, userId) {
    const key = lang === 'ko' ? 'voice_ko_name' : 'voice_en_name';
    let voiceId = Storage.get(key, userId);
    
    if (!voiceId) {
      // 첫 선택: 플랫폼 기본값
      const registry = new VoiceRegistry();
      voiceId = registry.getDefaultVoice(lang).id;
      this.setVoice(lang, voiceId, userId);
    }
    
    return voiceId;
  }

  // 미리 듣기 (한국어만 지원)
  previewVoice(lang, voiceId) {
    const text = lang === 'ko'
      ? '안녕하세요, 반갑습니다.'
      : 'Hello, nice to meet you.';
    
    const voice = VoiceRegistry.VOICES[lang][voiceId];
    
    if (voice.provider === 'google') {
      // Google Cloud TTS
      this.speakGoogle(text, lang, voiceId);
    } else if (voice.provider === 'openai') {
      // OpenAI TTS
      this.speakOpenAI(text, lang);
    } else {
      // Web Speech API
      this.speakSystem(text, voiceId);
    }
  }
}
```

#### UI 개선 (음성 선택 패널)

```html
<!-- 🇺🇸 영어 음성 섹션 -->
<section class="voice-section">
  <h3>🇺🇸 영어 음성</h3>
  
  <div class="voice-option selected">
    <div class="voice-label">
      <span class="badge">📱</span>
      <span class="name">System Default</span>
      <span class="desc">(기기 기본)</span>
    </div>
    <button class="preview-btn">🔊 미리 듣기</button>
    <input type="radio" name="voice-en" value="default" checked />
  </div>
  
  <div class="voice-option">
    <div class="voice-label">
      <span class="badge">⭐</span>
      <span class="name">Ava</span>
      <span class="desc">(프리미엄)</span>
    </div>
    <button class="preview-btn">🔊 미리 듣기</button>
    <input type="radio" name="voice-en" value="ava" />
  </div>
  
  <!-- ... 더 많은 옵션 -->
  
  <button class="expand-btn">+ 12개 더 보기 (영어 음성 전체)</button>
</section>

<!-- 🇰🇷 한국어 음성 섹션 -->
<section class="voice-section">
  <h3>🇰🇷 한국어 음성</h3>
  
  <div class="voice-option">
    <div class="voice-label">
      <span class="badge">🥇</span>
      <span class="name">Yuna</span>
      <span class="desc">(가장 자연스러움)</span>
    </div>
    <button class="preview-btn">🔊 미리 듣기</button>
    <input type="radio" name="voice-ko" value="yuna" />
  </div>
  
  <!-- ... 더 많은 옵션 -->
  
  <button class="expand-btn">+ 5개 더 보기 (한국어 음성 전체)</button>
</section>
```

---

### 📢 3. 날짜별 연속 재생 기능

```javascript
class SequentialPlayback {
  // 오늘의 5문장 연속 재생
  playTodaySequence(lang = 'both') {
    const scheduler = new DailyScheduler();
    const sentences = scheduler.getTodaysSentences();
    
    const sentenceTexts = sentences.map(id => {
      const s = DB.sentences[id];
      return {
        ko: s[0],
        en: s[1],
        id: s.id
      };
    });
    
    this.queue = sentenceTexts;
    this.currentIndex = 0;
    this.lang = lang;
    
    this.playNext();
  }

  playNext() {
    if (this.currentIndex >= this.queue.length) {
      // 모두 재생 완료
      UI.showNotification('오늘의 5문장 재생 완료! ✨');
      return;
    }

    const item = this.queue[this.currentIndex];
    const delay = 300; // 각 문장 사이 간격

    if (this.lang === 'both' || this.lang === 'ko') {
      VoiceEngine.speakKo(item.ko, () => {
        setTimeout(() => {
          if (this.lang === 'both') {
            VoiceEngine.speakEn(item.en, () => {
              this.currentIndex++;
              setTimeout(() => this.playNext(), delay);
            });
          } else {
            this.currentIndex++;
            setTimeout(() => this.playNext(), delay);
          }
        }, 200);
      });
    } else {
      VoiceEngine.speakEn(item.en, () => {
        this.currentIndex++;
        setTimeout(() => this.playNext(), delay);
      });
    }
  }

  pause() {
    window.speechSynthesis.pause();
  }

  resume() {
    window.speechSynthesis.resume();
  }

  stop() {
    window.speechSynthesis.cancel();
    this.queue = [];
    this.currentIndex = 0;
  }
}
```

---

## 단계별 구현 로드맵

### 📅 Phase 1: 구조화 (1주)
- [ ] 모듈 디렉토리 구조 설계 (index.html 내 구간 분리)
- [ ] Config.js: 설정 및 상수 추출
- [ ] Storage.js: 계층화된 localStorage 래퍼
- [ ] Utils.js: 순수 헬퍼 함수 모듈화
- [ ] **테스트**: 기존 기능 동작 확인 (회귀 테스트)

### 📅 Phase 2: 사용자 시스템 (1주)
- [ ] UserManager.js: 사용자 생성/선택/전환
- [ ] UserProfile: 프로필 + 통계
- [ ] 환영 화면: 사용자 선택 / 이어하기 / 오늘의 5문장
- [ ] 사용자별 데이터 격리 (localStorage 키)
- [ ] **테스트**: 다중 사용자 시나리오

### 📅 Phase 3: 음성 시스템 (1주)
- [ ] VoiceRegistry: 음성 목록 관리
- [ ] VoiceSettings: 사용자 음성 선택 저장
- [ ] VoicePanel UI: 음성 선택 + 미리 듣기
- [ ] Google Cloud TTS API 통합 (선택)
- [ ] **테스트**: 플랫폼별 음성 확인

### 📅 Phase 4: 날짜 기반 컨텐츠 (1주)
- [ ] DailyScheduler: KST 기반 날짜 관리
- [ ] ContentManager: 하루 5문장 제공
- [ ] 진행 바 개선: 오늘/이번주/누적
- [ ] **테스트**: 날짜 경계 테스트

### 📅 Phase 5: 연속 재생 (3일)
- [ ] SequentialPlayback: 순차 음성 재생
- [ ] UI 통합: 오늘의 5문장 → 재생 버튼
- [ ] **테스트**: 일시 정지/재개 기능

### 📅 Phase 6: 최적화 및 배포 (3일)
- [ ] 번들 크기 최적화
- [ ] Service Worker 캐시 전략 수정
- [ ] 성능 테스트 (Lighthouse)
- [ ] v2.0.0 릴리스 + CHANGELOG 업데이트

---

## 📝 파일 수정 체크리스트

### localStorage 키 8개 (기존 6개 → 신규 2개)
| 키 | 용도 | 변경 사항 |
|----|------|----------|
| `srs_v2:{userId}` | SRS 데이터 | ← 사용자별 격리 |
| `settings_v1:{userId}` | 설정 | ← 사용자별 격리 |
| `progress_v1:{userId}` | 스트릭/XP | ← 사용자별 격리 |
| `last_position_v1:{userId}` | 학습 위치 | ← 사용자별 격리 |
| `voice_en_name:{userId}` | 영어 음성 | 🆕 사용자별 |
| `voice_ko_name:{userId}` | 한국어 음성 | 🆕 사용자별 |
| `study_goals_v2:{userId}` | 학습목표 | ← 사용자별 격리 |
| `users_list` | 사용자 목록 | 🆕 전역 |
| `current_user` | 현재 사용자 | 🆕 전역 |
| `device_id` | 기기 식별 | 🆕 전역 |
| `install_date` | 설치 날짜 | 🆕 전역 |

### 함수 추가 예상 (총 ~80개)

**UserManager (8개)**
- createUser, selectUser, getCurrentUser, getAllUsers, deleteUser, getDeviceId, switchUser, updateProfile

**DailyScheduler (5개)**
- getToday, getDaysSinceInstall, getTodaysSentences, getTodayLabel, getWeekStats

**ContentManager (6개)**
- getFilteredSentences, getTodayLabel, getProgressStats, getWeekSentences, getRemainingSentences, getSentenceByDate

**VoiceRegistry (8개)**
- getAvailableVoices, getDefaultVoice, getVoiceMetadata, getPlatformVoices, getQualityTier, filterByProvider

**VoiceSettings (10개)**
- setVoice, getVoice, previewVoice, speakGoogle, speakOpenAI, speakSystem, getVoiceList, isVoiceAvailable, validateVoice, syncVoices

**SequentialPlayback (8개)**
- playTodaySequence, playNext, pause, resume, stop, setPlaybackSpeed, getQueue, getCurrentIndex

**Storage (15개)**
- get, set, delete, clear, getAllKeys, hasKey, getUserData, setUserData, deleteUserData, migrateFromV1, backup, restore, exportJSON, importJSON, cleanOldData

**Utils (8개)**
- getTimeUntilMidnight, getCurrentKSTTime, formatDateKST, parseDateKST, getDayOfWeek, calculateStreak, generateUserId, sanitizeUsername

---

## 🎯 성공 기준

### 코드 품질
- ✅ 순환 의존성 0개
- ✅ 전역변수 10개 이하 (현재 50+개)
- ✅ 함수 평균 길이 < 30줄
- ✅ 테스트 커버리지 80%+

### 사용자 경험
- ✅ 새 사용자 생성 < 3초
- ✅ 사용자 전환 < 1초
- ✅ 음성 선택 저장/복원 100% 동기화
- ✅ 오늘의 5문장 명확히 표시
- ✅ 날짜별 컨텐츠 오류 0개

### 배포
- ✅ index.html 크기 < 550KB (현재 476KB)
- ✅ 첫 로드 < 2초 (3G)
- ✅ Service Worker 캐시 적중률 > 95%
- ✅ 오프라인 동작 100%

---

## 🚨 주의사항

### 1. **역호환성 유지**
기존 사용자 데이터를 손실하지 않기 위해:
```javascript
// v1.x → v2.0 마이그레이션
if (localStorage.getItem('srs_v2')) {
  const v1Data = JSON.parse(localStorage.getItem('srs_v2'));
  const defaultUserId = Storage.get('current_user') || 'user_default';
  Storage.set('srs_v2', v1Data, defaultUserId);
}
```

### 2. **점진적 배포**
한 번에 모든 기능을 출시하지 말고:
- v2.0 (구조화만)
- v2.1 (사용자 시스템)
- v2.2 (음성 개선)
- v2.3 (날짜 기반 컨텐츠)

### 3. **성능 모니터링**
```javascript
// 각 주요 함수에 성능 측정
function measurePerf(name, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  console.log(`${name}: ${(t1 - t0).toFixed(2)}ms`);
  return result;
}
```

---

## 📞 다음 단계

1. **Phase 1 구현**: Config.js + Storage.js 작성 (코드 제공)
2. **테스트 계획**: 각 모듈별 테스트 케이스 (30개+)
3. **마이그레이션 도구**: v1 → v2 데이터 변환 스크립트
4. **UI 프로토타입**: 사용자 선택 화면 Figma 디자인

---

**작성일**: 2026-05-14  
**버전**: v2.0.0 로드맵  
**상태**: 📋 검토 대기
