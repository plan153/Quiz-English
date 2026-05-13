/* ============================================================
   PHASE 3 — 음성 시스템 완전 개선
   ============================================================
   
   이전 파일 (PHASE_1, PHASE_2) 이후 추가하면 됨
   
   담당 기능:
   1. VoiceRegistry: 음성 목록 관리 (한국어/영어, 플랫폼별)
   2. VoiceSettings: 사용자 음성 선택 저장/로드
   3. VoiceEngine: TTS/STT 통합 (Web Speech API + Google Cloud)
   4. VoicePanel: 음성 선택 UI 렌더링
   
============================================================ */

// ============================================================
// 1️⃣  VOICEREGISTRY — 음성 목록 관리
// ============================================================

class VoiceRegistry {
  // ✅ 사전 정의된 음성 메타데이터 (모든 플랫폼)
  static VOICES = {
    en: [
      {
        id: 'system-default',
        name: 'System Default',
        badge: '📱',
        description: '기기 기본 음성',
        quality: 'basic',
        provider: 'system',
        lang: 'en-US'
      },
      {
        id: 'ava',
        name: 'Ava',
        badge: '⭐',
        description: '자연스러운 여성음',
        quality: 'premium',
        provider: 'ios',
        lang: 'en-US'
      },
      {
        id: 'samantha',
        name: 'Samantha',
        badge: '⭐',
        description: '명확한 여성음',
        quality: 'premium',
        provider: 'ios',
        lang: 'en-US'
      },
      {
        id: 'victoria',
        name: 'Victoria',
        badge: '⭐',
        description: '영국 영어',
        quality: 'premium',
        provider: 'ios',
        lang: 'en-GB'
      },
      {
        id: 'daniel',
        name: 'Daniel',
        badge: '⭐',
        description: '남성음',
        quality: 'premium',
        provider: 'ios',
        lang: 'en-US'
      },
      {
        id: 'google-en',
        name: 'Google English',
        badge: '☁️',
        description: '구글 클라우드 TTS',
        quality: 'premium',
        provider: 'google',
        lang: 'en-US'
      },
      {
        id: 'google-en-uk',
        name: 'Google English (UK)',
        badge: '☁️',
        description: '구글 영국 영어',
        quality: 'premium',
        provider: 'google',
        lang: 'en-GB'
      },
      {
        id: 'chatgpt-en',
        name: 'OpenAI English',
        badge: '✨',
        description: 'ChatGPT 음성',
        quality: 'premium',
        provider: 'openai',
        lang: 'en-US'
      }
    ],
    
    ko: [
      {
        id: 'yuna',
        name: 'Yuna',
        badge: '🥇',
        description: '가장 자연스러움',
        quality: 'premium',
        provider: 'ios',
        lang: 'ko-KR'
      },
      {
        id: 'seoyeon',
        name: 'Seoyeon',
        badge: '🥈',
        description: '자연스러운 음성',
        quality: 'premium',
        provider: 'ios',
        lang: 'ko-KR'
      },
      {
        id: 'nari',
        name: 'Nari',
        badge: '🥉',
        description: '기본 음성',
        quality: 'basic',
        provider: 'system',
        lang: 'ko-KR'
      },
      {
        id: 'jinho',
        name: 'Jinho',
        badge: '👨',
        description: '남성음',
        quality: 'basic',
        provider: 'system',
        lang: 'ko-KR'
      },
      {
        id: 'google-ko',
        name: 'Google Korean',
        badge: '☁️',
        description: '구글 클라우드 한국어',
        quality: 'premium',
        provider: 'google',
        lang: 'ko-KR'
      },
      {
        id: 'chatgpt-ko',
        name: 'OpenAI Korean',
        badge: '✨',
        description: 'ChatGPT 한국어',
        quality: 'premium',
        provider: 'openai',
        lang: 'ko-KR'
      }
    ]
  };
  
  // ✅ 플랫폼 감지
  static getPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows/.test(ua)) return 'windows';
    if (/mac/.test(ua)) return 'macos';
    
    return 'unknown';
  }
  
  // ✅ 현재 플랫폼에서 사용 가능한 음성
  static getAvailableVoices(lang = 'en') {
    const available = [];
    const systemVoices = window.speechSynthesis?.getVoices() || [];
    const platform = this.getPlatform();
    
    // 등록된 모든 음성 확인
    this.VOICES[lang].forEach(voiceMeta => {
      let isAvailable = false;
      
      // 1. 시스템 음성인지 확인
      if (voiceMeta.provider === 'system') {
        isAvailable = systemVoices.some(sv =>
          sv.lang.startsWith(lang === 'ko' ? 'ko' : 'en')
        );
      }
      // 2. iOS 독점 음성 (iOS에서만 사용 가능)
      else if (voiceMeta.provider === 'ios' && platform === 'ios') {
        isAvailable = systemVoices.some(sv =>
          sv.name === voiceMeta.name || sv.lang.startsWith(voiceMeta.lang.split('-')[0])
        );
      }
      // 3. Google Cloud / OpenAI는 API 활성화 시에만
      else if (['google', 'openai'].includes(voiceMeta.provider)) {
        isAvailable = true; // 나중에 API 확인
      }
      
      if (isAvailable) {
        available.push({
          ...voiceMeta,
          nativeVoice: systemVoices.find(sv =>
            sv.lang.includes(voiceMeta.lang) || sv.name === voiceMeta.name
          )
        });
      }
    });
    
    return available;
  }
  
  // ✅ 플랫폼별 기본 음성
  static getDefaultVoice(lang = 'en') {
    const available = this.getAvailableVoices(lang);
    
    if (available.length === 0) {
      console.warn(`⚠️  ${lang} 음성 없음`);
      return null;
    }
    
    // 우선순위:
    // 1. 사용자 저장값 (나중에 적용)
    // 2. Premium 품질
    // 3. 기본값
    return available.find(v => v.quality === 'premium') ||
           available.find(v => v.quality === 'basic') ||
           available[0];
  }
  
  // ✅ 음성 ID로 음성 정보 조회
  static getVoiceInfo(voiceId, lang = 'en') {
    return this.VOICES[lang].find(v => v.id === voiceId);
  }
  
  // ✅ 모든 음성 조회 (검색용)
  static searchVoices(query = '', lang = 'en') {
    const q = query.toLowerCase();
    return this.VOICES[lang].filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  }
}

// ============================================================
// 2️⃣  VOICESETTINGS — 사용자 음성 선택 저장/로드
// ============================================================

class VoiceSettings {
  // ✅ 사용자 음성 선택 저장
  static setVoice(lang, voiceId, userId) {
    const key = lang === 'ko' ? Config.STORAGE_KEYS.VOICE_KO : Config.STORAGE_KEYS.VOICE_EN;
    Storage.set(key, voiceId, userId);
    
    console.log(`✅ ${lang} 음성 저장:`, voiceId);
  }
  
  // ✅ 사용자 음성 선택 로드
  static getVoice(lang, userId) {
    const key = lang === 'ko' ? Config.STORAGE_KEYS.VOICE_KO : Config.STORAGE_KEYS.VOICE_EN;
    let voiceId = Storage.get(key, userId);
    
    // 저장된 선택이 없으면 플랫폼 기본값 사용
    if (!voiceId) {
      const defaultVoice = VoiceRegistry.getDefaultVoice(lang);
      voiceId = defaultVoice ? defaultVoice.id : 'system-default';
      this.setVoice(lang, voiceId, userId);
    }
    
    return voiceId;
  }
  
  // ✅ 사용자 음성 설정 전체 조회
  static getVoiceSettings(userId) {
    return {
      en: this.getVoice('en', userId),
      ko: this.getVoice('ko', userId)
    };
  }
  
  // ✅ 사용자 음성 설정 일괄 변경
  static setVoiceSettings(userId, voiceSettings) {
    if (voiceSettings.en) this.setVoice('en', voiceSettings.en, userId);
    if (voiceSettings.ko) this.setVoice('ko', voiceSettings.ko, userId);
  }
}

// ============================================================
// 3️⃣  VOICEENGINE — TTS/STT 통합 (Web Speech API 기반)
// ============================================================

class VoiceEngine {
  constructor(userId) {
    this.userId = userId;
    this.isSpeaking = false;
    this.voiceSettings = VoiceSettings.getVoiceSettings(userId);
    
    // Web Speech API
    this.synth = window.speechSynthesis;
    this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    
    // TTS 설정
    this.synth.onvoiceschanged = () => this._loadVoices();
    this._loadVoices();
    
    // STT 설정
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }
  
  // ✅ 음성 목록 로드
  _loadVoices() {
    this.voices = this.synth.getVoices();
  }
  
  // ✅ 한국어 TTS 재생
  speakKo(text, onEnd = null) {
    if (!text) return;
    
    this.synth.cancel(); // 이전 재생 취소
    
    const voiceId = this.voiceSettings.ko;
    const voiceMeta = VoiceRegistry.getVoiceInfo(voiceId, 'ko');
    
    if (!voiceMeta) {
      console.error('❌ 한국어 음성을 찾을 수 없습니다');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 한국어 설정
    utterance.lang = voiceMeta.lang;
    
    // 네이티브 음성 설정
    if (voiceMeta.nativeVoice) {
      utterance.voice = voiceMeta.nativeVoice;
    }
    
    // 음성 속도 설정
    const ttsRate = Storage.get('tts_rate', this.userId) || 1.0;
    utterance.rate = ttsRate;
    
    // 콜백
    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('🔊 한국어 재생 시작:', text);
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (e) => {
      console.error('❌ 한국어 TTS 오류:', e);
    };
    
    // 재생
    this.synth.speak(utterance);
  }
  
  // ✅ 영어 TTS 재생
  speakEn(text, onEnd = null) {
    if (!text) return;
    
    this.synth.cancel();
    
    const voiceId = this.voiceSettings.en;
    const voiceMeta = VoiceRegistry.getVoiceInfo(voiceId, 'en');
    
    if (!voiceMeta) {
      console.error('❌ 영어 음성을 찾을 수 없습니다');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = voiceMeta.lang;
    
    if (voiceMeta.nativeVoice) {
      utterance.voice = voiceMeta.nativeVoice;
    }
    
    const ttsRate = Storage.get('tts_rate', this.userId) || 1.0;
    utterance.rate = ttsRate;
    
    utterance.onstart = () => {
      this.isSpeaking = true;
      console.log('🔊 영어 재생 시작:', text);
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };
    
    utterance.onerror = (e) => {
      console.error('❌ 영어 TTS 오류:', e);
    };
    
    this.synth.speak(utterance);
  }
  
  // ✅ 음성 일시 정지
  pause() {
    if (this.synth.speaking) {
      this.synth.pause();
    }
  }
  
  // ✅ 음성 재개
  resume() {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }
  
  // ✅ 음성 중단
  stop() {
    this.synth.cancel();
    this.isSpeaking = false;
  }
  
  // ✅ 음성 속도 설정
  setRate(rate) {
    // 0.5x ~ 1.2x
    const normalizedRate = Math.max(0.5, Math.min(1.2, rate));
    Storage.set('tts_rate', normalizedRate, this.userId);
    
    // 실행 중인 음성에는 적용 안됨 (다음부터)
    console.log('⚙️  TTS 속도:', normalizedRate);
  }
  
  // ✅ STT 시작 (영어 음성 인식)
  startRecognition(onResult = null, onEnd = null) {
    this.recognition.lang = 'en-US';
    
    let interim = '';
    let final = '';
    
    this.recognition.onstart = () => {
      console.log('🎤 음성 인식 시작');
      final = '';
      interim = '';
    };
    
    this.recognition.onresult = (event) => {
      interim = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }
      
      const result = final + interim;
      if (onResult) onResult(result, interim !== '');
    };
    
    this.recognition.onend = () => {
      console.log('✅ 음성 인식 종료:', final);
      if (onEnd) onEnd(final.trim());
    };
    
    this.recognition.onerror = (event) => {
      console.error('❌ STT 오류:', event.error);
    };
    
    this.recognition.start();
  }
  
  // ✅ STT 중단
  stopRecognition() {
    this.recognition.stop();
  }
  
  // ✅ 음성 미리 듣기 (한국어)
  previewVoiceKo(voiceId) {
    const text = '안녕하세요, 반갑습니다.';
    const voiceMeta = VoiceRegistry.getVoiceInfo(voiceId, 'ko');
    
    if (!voiceMeta) {
      console.error('❌ 음성을 찾을 수 없습니다');
      return;
    }
    
    console.log(`🔊 ${voiceMeta.name} 미리 듣기:`, text);
    
    // 임시로 음성 변경
    const originalVoice = this.voiceSettings.ko;
    this.voiceSettings.ko = voiceId;
    
    this.speakKo(text, () => {
      // 원래 음성으로 복원
      this.voiceSettings.ko = originalVoice;
    });
  }
  
  // ✅ 음성 미리 듣기 (영어)
  previewVoiceEn(voiceId) {
    const text = 'Hello, nice to meet you.';
    const voiceMeta = VoiceRegistry.getVoiceInfo(voiceId, 'en');
    
    if (!voiceMeta) {
      console.error('❌ 음성을 찾을 수 없습니다');
      return;
    }
    
    console.log(`🔊 ${voiceMeta.name} 미리 듣기:`, text);
    
    const originalVoice = this.voiceSettings.en;
    this.voiceSettings.en = voiceId;
    
    this.speakEn(text, () => {
      this.voiceSettings.en = originalVoice;
    });
  }
  
  // ✅ 사용자 선택 업데이트
  updateVoiceChoice(lang, voiceId) {
    if (lang === 'ko') {
      this.voiceSettings.ko = voiceId;
    } else {
      this.voiceSettings.en = voiceId;
    }
    
    VoiceSettings.setVoice(lang, voiceId, this.userId);
  }
}

// ============================================================
// 4️⃣  VOICEPANEL — 음성 선택 UI 렌더링
// ============================================================

class VoicePanel {
  constructor(userId) {
    this.userId = userId;
    this.voiceEngine = new VoiceEngine(userId);
  }
  
  // ✅ 음성 패널 HTML 생성
  renderPanel() {
    const enVoices = VoiceRegistry.getAvailableVoices('en');
    const koVoices = VoiceRegistry.getAvailableVoices('ko');
    
    const currentEnVoice = VoiceSettings.getVoice('en', this.userId);
    const currentKoVoice = VoiceSettings.getVoice('ko', this.userId);
    
    return `
      <div class="voice-panel">
        <!-- 🇺🇸 영어 음성 섹션 -->
        <section class="voice-section">
          <h3>🇺🇸 영어 음성</h3>
          <p class="section-desc">모범 발음 청취</p>
          
          <div class="voice-options">
            ${enVoices.slice(0, 3).map(voice => `
              <div class="voice-option ${voice.id === currentEnVoice ? 'selected' : ''}">
                <label class="voice-label">
                  <input 
                    type="radio" 
                    name="voice-en" 
                    value="${voice.id}"
                    ${voice.id === currentEnVoice ? 'checked' : ''}
                    onchange="window._selectVoice('en', '${voice.id}')"
                  >
                  <span class="voice-name">
                    <span class="badge">${voice.badge}</span>
                    <span class="name">${voice.name}</span>
                  </span>
                  <span class="desc">${voice.description}</span>
                </label>
                <button class="preview-btn" onclick="window._previewVoice('en', '${voice.id}')">
                  🔊
                </button>
              </div>
            `).join('')}
          </div>
          
          <button class="expand-btn" onclick="window._expandVoices('en')">
            + ${enVoices.length - 3}개 더 보기 (영어 음성 전체)
          </button>
        </section>
        
        <!-- 🇰🇷 한국어 음성 섹션 -->
        <section class="voice-section">
          <h3>🇰🇷 한국어 음성</h3>
          <p class="section-desc">문제 청취</p>
          
          <div class="voice-options">
            ${koVoices.slice(0, 3).map(voice => `
              <div class="voice-option ${voice.id === currentKoVoice ? 'selected' : ''}">
                <label class="voice-label">
                  <input 
                    type="radio" 
                    name="voice-ko" 
                    value="${voice.id}"
                    ${voice.id === currentKoVoice ? 'checked' : ''}
                    onchange="window._selectVoice('ko', '${voice.id}')"
                  >
                  <span class="voice-name">
                    <span class="badge">${voice.badge}</span>
                    <span class="name">${voice.name}</span>
                  </span>
                  <span class="desc">${voice.description}</span>
                </label>
                <button class="preview-btn" onclick="window._previewVoice('ko', '${voice.id}')">
                  🔊
                </button>
              </div>
            `).join('')}
          </div>
          
          <button class="expand-btn" onclick="window._expandVoices('ko')">
            + ${koVoices.length - 3}개 더 보기 (한국어 음성 전체)
          </button>
        </section>
      </div>
    `;
  }
  
  // ✅ 음성 선택 처리
  selectVoice(lang, voiceId) {
    this.voiceEngine.updateVoiceChoice(lang, voiceId);
    console.log(`✅ ${lang} 음성 선택: ${voiceId}`);
  }
  
  // ✅ 음성 미리 듣기
  previewVoice(lang, voiceId) {
    if (lang === 'ko') {
      this.voiceEngine.previewVoiceKo(voiceId);
    } else {
      this.voiceEngine.previewVoiceEn(voiceId);
    }
  }
  
  // ✅ 모든 음성 표시
  expandVoices(lang) {
    const voices = VoiceRegistry.getAvailableVoices(lang);
    const langLabel = lang === 'ko' ? '한국어' : '영어';
    
    console.log(`📊 ${langLabel} 음성 전체 (${voices.length}개):`);
    voices.forEach(v => {
      console.log(`  - ${v.badge} ${v.name}: ${v.description}`);
    });
    
    // 모달이나 확장 UI로 표시 (나중에 구현)
  }
}

// ============================================================
// 🎯 전역 함수 (HTML onclick 호출용)
// ============================================================

let _voicePanel = null;

function initVoicePanel(userId) {
  _voicePanel = new VoicePanel(userId);
  return _voicePanel;
}

function _selectVoice(lang, voiceId) {
  if (_voicePanel) {
    _voicePanel.selectVoice(lang, voiceId);
  }
}

function _previewVoice(lang, voiceId) {
  if (_voicePanel) {
    _voicePanel.previewVoice(lang, voiceId);
  }
}

function _expandVoices(lang) {
  if (_voicePanel) {
    _voicePanel.expandVoices(lang);
  }
}

// ============================================================
// 📝 CSS (index.html <style>에 추가)
// ============================================================

const VOICE_PANEL_CSS = `
.voice-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px;
}

.voice-section {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  background: var(--card);
}

.voice-section h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text);
}

.section-desc {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 12px;
}

.voice-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.voice-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.voice-option:hover {
  background: var(--adim);
  border-color: var(--accent);
}

.voice-option.selected {
  background: var(--adim);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(123,110,246,.1);
}

.voice-option label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.voice-option input[type="radio"] {
  display: none;
}

.voice-label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.voice-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--text);
  font-size: 14px;
}

.badge {
  font-size: 14px;
  min-width: 20px;
}

.desc {
  font-size: 12px;
  color: var(--muted);
}

.preview-btn {
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-btn:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.expand-btn {
  width: 100%;
  padding: 8px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  font-size: 13px;
}

.expand-btn:active {
  opacity: 0.8;
}
`;

// ============================================================
// 🎯 사용 예제
// ============================================================

/*
// 앱 초기화 시
const userId = userManager.getCurrentUser().id;
const voicePanel = initVoicePanel(userId);

// HTML에 렌더링
document.getElementById('voice-container').innerHTML = voicePanel.renderPanel();

// 또는 프로그래밍으로 사용
const voiceEngine = new VoiceEngine(userId);

// 한국어 재생
voiceEngine.speakKo('안녕하세요!');

// 영어 재생
voiceEngine.speakEn('Hello, world!');

// 음성 인식
voiceEngine.startRecognition(
  (result, isInterim) => {
    console.log('인식 중:', result);
  },
  (finalResult) => {
    console.log('최종 결과:', finalResult);
  }
);

// 음성 속도 변경
voiceEngine.setRate(0.8);
*/

// ✅ Phase 3 완료
// 다음: Phase 4 — SequentialPlayback (날짜별 연속 재생)
