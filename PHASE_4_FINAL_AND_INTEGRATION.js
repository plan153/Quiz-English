/* ============================================================
   PHASE 4 — 날짜별 연속 재생 & 최종 통합
   ============================================================
   
   이전 파일 (PHASE_1, PHASE_2, PHASE_3) 이후 추가하면 됨
   
   담당 기능:
   1. SequentialPlayback: 오늘의 5문장 순차 재생
   2. AppInitializer: 모든 모듈 통합 초기화
   
============================================================ */

// ============================================================
// 1️⃣  SEQUENTIALPLAYBACK — 날짜별 연속 재생
// ============================================================

class SequentialPlayback {
  constructor(voiceEngine, sentences = []) {
    this.voiceEngine = voiceEngine;
    this.sentences = sentences; // 전체 500문장
    this.queue = [];            // 재생 대기열
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.language = 'both';     // 'both' | 'ko' | 'en'
    this.speed = 1.0;
    
    // 콜백
    this.onStart = null;
    this.onNext = null;
    this.onPause = null;
    this.onResume = null;
    this.onEnd = null;
  }
  
  // ✅ 오늘의 5문장 재생
  playTodaySequence(language = 'both') {
    const todayIds = DailyScheduler.getTodaysSentences();
    const todaysSentences = todayIds.map(id => this.sentences[id]);
    
    this._startPlayback(todaysSentences, language);
  }
  
  // ✅ 특정 문장 목록 재생
  playSequence(sentenceIds, language = 'both') {
    const selectedSentences = sentenceIds.map(id => this.sentences[id]);
    
    this._startPlayback(selectedSentences, language);
  }
  
  // ✅ 재생 시작 (내부)
  _startPlayback(sentences, language) {
    if (sentences.length === 0) {
      console.error('❌ 재생할 문장이 없습니다');
      return;
    }
    
    this.queue = sentences;
    this.currentIndex = 0;
    this.language = language;
    this.isPlaying = true;
    this.isPaused = false;
    
    if (this.onStart) {
      this.onStart({
        totalCount: this.queue.length,
        language: language
      });
    }
    
    console.log(`▶️  ${this.queue.length}개 문장 재생 시작 (${language})`);
    
    this._playNext();
  }
  
  // ✅ 다음 문장 재생
  _playNext() {
    if (!this.isPlaying) return;
    if (this.currentIndex >= this.queue.length) {
      this._onPlaybackEnd();
      return;
    }
    
    const sentence = this.queue[this.currentIndex];
    const progress = {
      current: this.currentIndex + 1,
      total: this.queue.length,
      percentage: Math.round(((this.currentIndex + 1) / this.queue.length) * 100)
    };
    
    if (this.onNext) {
      this.onNext({
        ko: sentence[0],
        en: sentence[1],
        ...progress
      });
    }
    
    // 문장 재생 로직
    const playSequence = () => {
      if (!this.isPlaying) return;
      
      if (this.language === 'both' || this.language === 'ko') {
        // 1. 한국어 재생
        this.voiceEngine.speakKo(sentence[0], () => {
          if (!this.isPlaying) return;
          
          // 한국어-영어 사이 간격 (200ms)
          setTimeout(() => {
            if (this.language === 'both') {
              // 2. 영어 재생
              this.voiceEngine.speakEn(sentence[1], () => {
                if (!this.isPlaying) return;
                
                // 영어 재생 후 대기 (500ms)
                setTimeout(() => {
                  this.currentIndex++;
                  this._playNext();
                }, 500);
              });
            } else {
              // Ko만 재생
              this.currentIndex++;
              setTimeout(() => this._playNext(), 500);
            }
          }, 200);
        });
      } else if (this.language === 'en') {
        // 영어만 재생
        this.voiceEngine.speakEn(sentence[1], () => {
          if (!this.isPlaying) return;
          
          this.currentIndex++;
          setTimeout(() => this._playNext(), 500);
        });
      }
    };
    
    playSequence();
  }
  
  // ✅ 재생 일시 정지
  pause() {
    if (!this.isPlaying) return;
    
    this.isPaused = true;
    this.voiceEngine.pause();
    
    if (this.onPause) {
      this.onPause({
        current: this.currentIndex + 1,
        total: this.queue.length
      });
    }
    
    console.log('⏸️  재생 일시 정지');
  }
  
  // ✅ 재생 재개
  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    
    this.isPaused = false;
    this.voiceEngine.resume();
    
    if (this.onResume) {
      this.onResume({
        current: this.currentIndex + 1,
        total: this.queue.length
      });
    }
    
    console.log('▶️  재생 재개');
  }
  
  // ✅ 재생 중단
  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.voiceEngine.stop();
    
    const currentQueue = this.queue;
    this.queue = [];
    this.currentIndex = 0;
    
    console.log('⏹️  재생 중단');
  }
  
  // ✅ 재생 언어 변경
  setLanguage(language) {
    if (!['ko', 'en', 'both'].includes(language)) {
      console.error('❌ 유효하지 않은 언어:', language);
      return;
    }
    
    this.language = language;
    console.log(`🌐 재생 언어 변경:`, language);
  }
  
  // ✅ 재생 속도 설정
  setPlaybackSpeed(speed) {
    // 0.5x ~ 1.2x
    const normalized = Math.max(0.5, Math.min(1.2, speed));
    
    this.speed = normalized;
    this.voiceEngine.setRate(normalized);
    
    console.log(`⚙️  재생 속도:`, normalized + 'x');
  }
  
  // ✅ 다음 문장으로 건너뛰기
  skipToNext() {
    if (!this.isPlaying) return;
    
    this.voiceEngine.stop();
    this.currentIndex++;
    this._playNext();
  }
  
  // ✅ 이전 문장으로 돌아가기
  skipToPrevious() {
    if (!this.isPlaying) return;
    
    this.voiceEngine.stop();
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    this._playNext();
  }
  
  // ✅ 특정 문장으로 이동
  skipToIndex(index) {
    if (index < 0 || index >= this.queue.length) return;
    
    this.voiceEngine.stop();
    this.currentIndex = index;
    this._playNext();
  }
  
  // ✅ 재생 완료
  _onPlaybackEnd() {
    this.isPlaying = false;
    this.isPaused = false;
    
    if (this.onEnd) {
      this.onEnd({
        totalCount: this.queue.length,
        completedAt: new Date().toISOString()
      });
    }
    
    console.log('✅ 재생 완료!');
  }
  
  // ✅ 진행 상태 조회
  getStatus() {
    return {
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      current: this.currentIndex + 1,
      total: this.queue.length,
      percentage: this.queue.length > 0 
        ? Math.round(((this.currentIndex + 1) / this.queue.length) * 100)
        : 0,
      language: this.language,
      speed: this.speed
    };
  }
}

// ============================================================
// 2️⃣  APPINITIALIZER — 모든 모듈 통합 초기화
// ============================================================

class AppInitializer {
  static async initialize() {
    console.log('🚀 앱 초기화 시작 (v2.0.0)...');
    
    // 1️⃣  Storage 설정 확인
    console.log('📦 Storage 설정...');
    const storageUsage = Storage.getUsage();
    console.log(`  저장소 사용량: ${storageUsage.kb} KB`);
    
    // 2️⃣  사용자 관리 초기화
    console.log('👤 사용자 시스템 초기화...');
    const userManager = new UserManager();
    const currentUser = userManager.getCurrentUser();
    console.log(`  현재 사용자: ${currentUser.name} (${currentUser.id})`);
    
    // 3️⃣  날짜 기반 컨텐츠
    console.log('📅 날짜 기반 컨텐츠 설정...');
    const todayLabel = DailyScheduler.getTodayLabel();
    const todaysSentences = DailyScheduler.getTodaysSentences();
    console.log(`  ${todayLabel}: ${todaysSentences.length}문장`);
    
    // 4️⃣  음성 시스템 초기화
    console.log('🎙️  음성 시스템 초기화...');
    const voiceEngine = new VoiceEngine(currentUser.id);
    const enVoices = VoiceRegistry.getAvailableVoices('en');
    const koVoices = VoiceRegistry.getAvailableVoices('ko');
    console.log(`  영어: ${enVoices.length}개 음성 | 한국어: ${koVoices.length}개 음성`);
    
    // 5️⃣  연속 재생 설정
    console.log('📢 연속 재생 시스템 설정...');
    const sequentialPlayback = new SequentialPlayback(voiceEngine, DB.sentences);
    console.log(`  500문장 큐 준비 완료`);
    
    console.log('✅ 앱 초기화 완료!\n');
    
    // 모듈 객체 반환
    return {
      userManager,
      voiceEngine,
      sequentialPlayback,
      currentUser
    };
  }
}

// ============================================================
// 📝 HTML 통합 예제
// ============================================================

const HTML_INTEGRATION_GUIDE = `
<!-- ============================================================
     index.html에 추가할 내용
     ============================================================ -->

<!-- 1️⃣  모든 Phase JS 파일 로드 -->
<script src="PHASE_1_MODULES.js"></script>
<script src="PHASE_2_USER_SYSTEM.js"></script>
<script src="PHASE_3_VOICE_SYSTEM.js"></script>
<script src="PHASE_4_FINAL.js"></script>

<!-- 2️⃣  메인 앱 초기화 스크립트 -->
<script>
// 앱 시작
document.addEventListener('DOMContentLoaded', async () => {
  // 모듈 초기화
  const modules = await AppInitializer.initialize();
  
  const {
    userManager,
    voiceEngine,
    sequentialPlayback,
    currentUser
  } = modules;
  
  // 3️⃣  UI 렌더링
  renderWelcomeScreen(modules);
  renderVoicePanel(currentUser.id);
  
  // 4️⃣  이벤트 바인딩
  setupEventHandlers(modules);
  
  // 5️⃣  윈도우에 노출 (디버깅/테스트)
  window.app = modules;
  window.utils = { Utils, Storage, Config };
  window.scheduler = DailyScheduler;
});

// 환영 화면 렌더링
function renderWelcomeScreen(modules) {
  const { userManager, currentUser } = modules;
  const stats = ContentManager.getProgressStats(currentUser.id, DB.sentences);
  
  const html = \`
    <div class="welcome-screen">
      <h2>안녕하세요, \${currentUser.name}님!</h2>
      
      <div class="options">
        <button onclick="continueLastStudy()">
          📚 이어하기 (마지막 위치)
        </button>
        
        <button onclick="playTodaySequence()">
          🌟 오늘의 5문장 (\${stats.todayCompleted}/5)
        </button>
        
        <button onclick="startReview()">
          ♻️ 복습 대기 (\${stats.dueCount}개)
        </button>
        
        <button onclick="startFromBeginning()">
          🎯 전체 처음부터
        </button>
      </div>
    </div>
  \`;
  
  document.getElementById('screen-welcome').innerHTML = html;
}

// 음성 패널 렌더링
function renderVoicePanel(userId) {
  const voicePanel = new VoicePanel(userId);
  document.getElementById('voice-settings').innerHTML = voicePanel.renderPanel();
}

// 오늘의 5문장 재생
function playTodaySequence() {
  const voiceEngine = window.app.voiceEngine;
  const playback = window.app.sequentialPlayback;
  
  // 콜백 설정
  playback.onStart = (info) => {
    console.log('🎬 재생 시작:', info);
  };
  
  playback.onNext = (data) => {
    updatePlaybackUI(data);
  };
  
  playback.onEnd = () => {
    showNotification('오늘의 5문장 재생 완료! ✨');
  };
  
  // 재생 시작
  playback.playTodaySequence('both');
}

// 재생 UI 업데이트
function updatePlaybackUI(data) {
  const { ko, en, current, total, percentage } = data;
  
  document.getElementById('playback-ko').textContent = ko;
  document.getElementById('playback-en').textContent = en;
  document.getElementById('playback-progress').textContent = \`\${current}/\${total} (\${percentage}%)\`;
  document.getElementById('playback-bar').style.width = percentage + '%';
}

// 설정 패널 이벤트
function setupEventHandlers(modules) {
  // 음성 속도 슬라이더
  document.getElementById('tts-rate-slider')?.addEventListener('change', (e) => {
    const rate = parseFloat(e.target.value);
    modules.voiceEngine.setRate(rate);
  });
  
  // 재생 제어 버튼
  document.getElementById('play-btn')?.addEventListener('click', () => {
    modules.sequentialPlayback.resume();
  });
  
  document.getElementById('pause-btn')?.addEventListener('click', () => {
    modules.sequentialPlayback.pause();
  });
  
  document.getElementById('stop-btn')?.addEventListener('click', () => {
    modules.sequentialPlayback.stop();
  });
}
</script>

<!-- 3️⃣  추가할 HTML 요소 -->

<!-- 환영 화면 -->
<div id="screen-welcome"></div>

<!-- 음성 설정 패널 -->
<div id="voice-settings"></div>

<!-- 재생 화면 -->
<div id="playback-screen">
  <div id="playback-ko" class="ko-text"></div>
  <div id="playback-en" class="en-text"></div>
  <div class="playback-controls">
    <button id="play-btn">▶️ 재생</button>
    <button id="pause-btn">⏸️ 일시정지</button>
    <button id="stop-btn">⏹️ 중단</button>
  </div>
  <div class="playback-progress-bar">
    <div id="playback-bar"></div>
  </div>
  <div id="playback-progress">0/0</div>
</div>

<!-- 4️⃣  추가할 CSS -->
<style>
#playback-screen {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.ko-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
  min-height: 60px;
  word-break: keep-all;
}

.en-text {
  font-size: 18px;
  color: var(--muted);
  min-height: 50px;
  font-style: italic;
}

.playback-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.playback-controls button {
  padding: 8px 16px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.playback-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

#playback-bar {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
  width: 0%;
}

#playback-progress {
  text-align: center;
  font-size: 12px;
  color: var(--muted);
}
</style>
`;

// ============================================================
// 🎯 마이그레이션 체크리스트
// ============================================================

const MIGRATION_CHECKLIST = `
✅ Phase 1 — 구조화 (Config, Storage, Utils)
  □ Config.js: 설정 및 상수 추출
  □ Storage.js: 사용자별 데이터 격리
  □ Utils.js: 순수 헬퍼 함수
  → 기존 기능 동작 확인

✅ Phase 2 — 사용자 시스템
  □ UserManager: 사용자 생성/선택/전환
  □ DailyScheduler: KST 기반 날짜 관리
  □ ContentManager: 필터 + 통계
  → 새 사용자, 재방문 사용자 시나리오 테스트

✅ Phase 3 — 음성 시스템
  □ VoiceRegistry: 음성 목록 관리
  □ VoiceSettings: 사용자 선택 저장
  □ VoiceEngine: TTS/STT 통합
  □ VoicePanel: 음성 선택 UI
  → 한국어/영어 음성 전환 테스트

✅ Phase 4 — 연속 재생
  □ SequentialPlayback: 순차 재생
  □ AppInitializer: 모듈 통합
  □ HTML 통합: UI + 이벤트
  → 오늘의 5문장 재생 테스트

🎯 통합 테스트
  □ 첫 방문 사용자: 사용자 생성 > 환영 화면 > 오늘의 5문장
  □ 재방문 사용자: 자동 로그인 > 이어하기
  □ 음성 선택: 한국어/영어 각각 저장/로드
  □ 날짜 변경: 자정 기준 새 5문장 제공
  □ 다중 사용자: 사용자 전환 > 데이터 격리 확인

📦 배포 준비
  □ 번들 크기 확인 (550KB 이하)
  □ 성능 프로파일링 (첫 로드 < 2초)
  □ Service Worker 캐시 테스트
  □ 오프라인 동작 확인
  □ v2.0.0 CHANGELOG 작성
`;

// ✅ Phase 4 & 최종 통합 완료
console.log('✅ Phase 4 & 최종 통합 완료!');
console.log(HTML_INTEGRATION_GUIDE);
console.log(MIGRATION_CHECKLIST);
