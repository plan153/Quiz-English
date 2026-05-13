/* ============================================================
   PHASE 1 — 구조화 & 모듈화 (v2.0.0 기초)
   ============================================================
   
   이 코드를 index.html의 <script> 섹션에 추가하면 됨
   (기존 코드와 충돌 없음 — 새 클래스만 정의)
   
   사용법:
   const config = new Config();
   const storage = new Storage();
   const utils = new Utils();
   
============================================================ */

// ============================================================
// 1️⃣  CONFIG — 설정 및 상수 관리
// ============================================================

class Config {
  // 앱 정보
  static APP_NAME = '기본동사 영작퀴즈';
  static APP_VERSION = '2.0.0';
  static APP_ID = 'quiz-english-v2';
  
  // 타임존 설정 (KST = UTC+9)
  static TIMEZONE = 'Asia/Seoul';
  static UTC_OFFSET = 9;
  
  // 학습 설정
  static DAILY_GOAL = 5; // 하루 5문장
  static LEVEL_NAMES = {
    L1: '초보',
    L2: '초급',
    L3: '중하',
    L4: '중급'
  };
  
  // SRS 설정 (SM-2 알고리즘)
  static SRS_INTERVALS = {
    new: 1,        // 새로운 문제: 1일
    repeat: 3,     // 틀린 것: 3일
    easy: 7,       // 쉬운 것: 7일
    medium: 14,    // 중간: 14일
    hard: 30       // 어려운 것: 30일
  };
  
  static SRS_EASE_FACTORS = {
    min: 1.3,      // 최소 쉬움 계수
    default: 2.5,  // 기본값
    max: 4.0       // 최대값
  };
  
  // 음성 설정
  static VOICE_LANGS = {
    ko: ['ko-KR', 'ko'],
    en: ['en-US', 'en-GB', 'en']
  };
  
  // localStorage 키 (사용자별/전역 구분)
  static STORAGE_KEYS = {
    // 사용자별 (format: "key:{userId}")
    SRS: 'srs_v2',
    SETTINGS: 'settings_v1',
    PROGRESS: 'progress_v1',
    POSITION: 'last_position_v1',
    VOICE_EN: 'voice_en_name',
    VOICE_KO: 'voice_ko_name',
    GOALS: 'study_goals_v2',
    
    // 전역 (사용자별 아님)
    USERS_LIST: 'users_list',
    CURRENT_USER: 'current_user',
    DEVICE_ID: 'device_id',
    INSTALL_DATE: 'install_date'
  };
  
  // 음성 시스템 설정
  static VOICE_SETTINGS = {
    en: {
      default: { name: 'System Default', quality: 'basic', badge: '📱' },
      ava: { name: 'Ava', quality: 'premium', badge: '⭐', lang: 'en-US' },
      samantha: { name: 'Samantha', quality: 'premium', badge: '⭐', lang: 'en-US' },
      victoria: { name: 'Victoria', quality: 'premium', badge: '⭐', lang: 'en-AU' }
    },
    ko: {
      yuna: { name: 'Yuna', quality: 'premium', badge: '🥇' },
      seoyeon: { name: 'Seoyeon', quality: 'basic', badge: '🥈' },
      nari: { name: 'Nari', quality: 'basic', badge: '🥉' }
    }
  };
  
  // 기본 사용자 설정
  static DEFAULT_USER_PREFERENCES = {
    lang_ko: true,         // 한국어 보기
    auto_ko: false,        // 한국어 자동 음성
    auto_en: true,         // 영어 자동 음성
    show_hint: true,       // 힌트 표시
    wrong_count_effect: true, // 정답 보기 = 오답 처리
    voice_en: 'default',
    voice_ko: 'yuna',
    tts_rate: 1.0,
    theme: 'dark'
  };
  
  // UI 색상 상수
  static COLORS = {
    bg: '#0A0A12',
    card: '#14141C',
    border: '#1E1E2E',
    text: '#E8E6FF',
    muted: '#6E6D85',
    accent: '#7B6EF6',
    ok: '#3EC98A',
    ng: '#F05C6E',
    gold: '#F5C842'
  };
  
  // API 설정 (Claude API 호출)
  static API_SETTINGS = {
    MODEL: 'claude-sonnet-4-20250514',
    MAX_TOKENS: 300,
    TIMEOUT: 10000
  };
  
  constructor() {
    this.timezone = Config.TIMEZONE;
    this.version = Config.APP_VERSION;
  }
  
  // 설정 조회
  static get(key) {
    return Config[key] || null;
  }
  
  // 설정 업데이트 (런타임)
  static set(key, value) {
    Config[key] = value;
  }
  
  // 현재 KST 시간
  getCurrentKST() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: Config.TIMEZONE }));
  }
  
  // 현재 KST 날짜 (YYYY-MM-DD)
  getTodayKST() {
    const kstDate = this.getCurrentKST();
    return kstDate.toISOString().split('T')[0];
  }
  
  // 자정까지 남은 시간 (밀리초)
  getTimeUntilMidnight() {
    const now = this.getCurrentKST();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow - now;
  }
}

// ============================================================
// 2️⃣  STORAGE — 계층화된 localStorage 래퍼
// ============================================================

class Storage {
  // ✅ 기본 저장 (사용자별 또는 전역)
  static set(key, value, userId = null) {
    const fullKey = userId ? `${key}:${userId}` : key;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    try {
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (e) {
      console.error('Storage.set error:', e);
      this._handleStorageQuotaExceeded();
      return false;
    }
  }
  
  // ✅ 기본 조회
  static get(key, userId = null) {
    const fullKey = userId ? `${key}:${userId}` : key;
    const value = localStorage.getItem(fullKey);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch {
      return value; // JSON 파싱 실패시 문자열 반환
    }
  }
  
  // ✅ 삭제
  static delete(key, userId = null) {
    const fullKey = userId ? `${key}:${userId}` : key;
    localStorage.removeItem(fullKey);
  }
  
  // ✅ 전체 삭제
  static clear() {
    localStorage.clear();
  }
  
  // ✅ 특정 사용자의 모든 데이터 삭제
  static clearUser(userId) {
    const keysToDelete = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.endsWith(`:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => localStorage.removeItem(key));
  }
  
  // ✅ 키 존재 여부
  static has(key, userId = null) {
    const fullKey = userId ? `${key}:${userId}` : key;
    return localStorage.getItem(fullKey) !== null;
  }
  
  // ✅ 모든 키 조회
  static getAllKeys(prefix = null) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!prefix || key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  // ✅ 사용자별 데이터 조회
  static getUserData(userId) {
    const userData = {};
    this.getAllKeys().forEach(key => {
      if (key.endsWith(`:${userId}`)) {
        const cleanKey = key.split(':')[0];
        userData[cleanKey] = this.get(cleanKey, userId);
      }
    });
    return userData;
  }
  
  // ✅ 사용자별 데이터 설정 (대량)
  static setUserData(userId, dataObj) {
    Object.entries(dataObj).forEach(([key, value]) => {
      this.set(key, value, userId);
    });
  }
  
  // ✅ v1 → v2 마이그레이션 (역호환성)
  static migrateFromV1(defaultUserId) {
    const v1Keys = [
      'srs_v2',
      'settings_v1',
      'progress_v1',
      'last_position_v1',
      'voice_name',
      'study_goals_v2'
    ];
    
    v1Keys.forEach(key => {
      const v1Value = localStorage.getItem(key);
      if (v1Value) {
        // v1 데이터를 v2 형식으로 변환
        this.set(key, JSON.parse(v1Value), defaultUserId);
        // 구 데이터 삭제 안함 (안전을 위해 수동 삭제)
      }
    });
    
    console.log('✅ v1 → v2 마이그레이션 완료');
  }
  
  // ✅ 백업 (JSON 내보내기)
  static exportJSON(userId = null) {
    const data = {};
    
    if (userId) {
      // 사용자별 백업
      const userData = this.getUserData(userId);
      data[userId] = userData;
    } else {
      // 전체 백업
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  // ✅ 복원 (JSON 가져오기)
  static importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // userId 포함된 형식인지 확인
      const hasUserId = Object.keys(data).some(k => k.includes(':'));
      
      if (hasUserId) {
        // v2 형식: 키에 userId 포함
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      } else {
        // v1 형식: 단순 키-값
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }
      
      console.log('✅ JSON 복원 완료');
      return true;
    } catch (e) {
      console.error('❌ JSON 복원 실패:', e);
      return false;
    }
  }
  
  // ✅ 오래된 데이터 정리 (30일 이상 미접속)
  static cleanOldData(days = 30) {
    const lastActive = this.get(Config.STORAGE_KEYS.PROGRESS + ':lastActiveAt');
    if (!lastActive) return;
    
    const lastDate = new Date(lastActive);
    const now = new Date();
    const diffMs = now - lastDate;
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    
    if (diffDays > days) {
      console.warn(`⚠️  ${diffDays}일간 미접속 — 정리 대상`);
      // 자동 정리는 사용자 확인 후 수행
    }
  }
  
  // ✅ 저장소 용량 확인
  static getUsage() {
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalSize += key.length + value.length;
    }
    
    return {
      bytes: totalSize,
      kb: (totalSize / 1024).toFixed(2),
      mb: (totalSize / (1024 * 1024)).toFixed(4),
      estimate: Math.round((totalSize / (5 * 1024 * 1024)) * 100) + '% (5MB 기준)'
    };
  }
  
  // ✅ 저장소 초과 처리
  static _handleStorageQuotaExceeded() {
    console.error('❌ localStorage 저장소 부족!');
    
    // 백업 후 정리
    const backup = this.exportJSON();
    console.log('📦 백업:', backup);
    
    // 가장 오래된 복습 데이터 삭제 제안
    const srsKeys = this.getAllKeys('srs_v2');
    console.warn('💾 정리 가능:', srsKeys.length, '개 사용자 데이터');
  }
}

// ============================================================
// 3️⃣  UTILS — 순수 헬퍼 함수 모음
// ============================================================

class Utils {
  // ✅ 텍스트 정규화 (기존 코드 호환성)
  static normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:—–]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/can't/g, 'cannot')
      .replace(/won't/g, 'will not')
      .replace(/n't/g, 'not');
  }
  
  // ✅ 단어 토큰화
  static tokenize(text) {
    return this.normalize(text).split(/\s+/);
  }
  
  // ✅ 정답 채점 (기존 로직 유지)
  static isCorrect(userText, correctText, tolerance = 0.8) {
    const user = this.tokenize(userText);
    const correct = this.tokenize(correctText);
    
    // 토큰 일치율 계산
    const matches = user.filter(t => correct.includes(t)).length;
    const accuracy = matches / Math.max(user.length, correct.length);
    
    return accuracy >= tolerance;
  }
  
  // ✅ 부분 정답 판정
  static isPartialCorrect(userText, correctText) {
    const user = this.tokenize(userText);
    const correct = this.tokenize(correctText);
    const matches = user.filter(t => correct.includes(t)).length;
    
    return matches >= correct.length * 0.6 && matches < correct.length;
  }
  
  // ✅ 난이도 계산
  static calculateDifficulty(failCount) {
    if (failCount === 0) return 'easy';
    if (failCount < 3) return 'medium';
    if (failCount < 7) return 'hard';
    return 'veryhard';
  }
  
  // ✅ 오답 배지 아이콘
  static getFailBadge(failCount) {
    if (failCount === 0) return '🟢';
    if (failCount <= 4) return '🟡';
    if (failCount <= 9) return '🟠';
    if (failCount <= 14) return '🔴';
    return '🔴🔴';
  }
  
  // ✅ 스트릭 계산
  static calculateStreak(lastStudyDate) {
    const config = new Config();
    const today = config.getTodayKST();
    
    if (!lastStudyDate) return 0;
    
    const last = new Date(lastStudyDate);
    const now = new Date(today);
    const diffMs = now - last;
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    
    return diffDays === 0 ? 1 : (diffDays === 1 ? null : 0); // null = 스트릭 유지, 0 = 끊김
  }
  
  // ✅ 사용자 ID 생성
  static generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // ✅ 사용자명 검증
  static validateUsername(name) {
    if (!name || name.length < 1 || name.length > 20) {
      return { valid: false, error: '1~20자 입력하세요' };
    }
    if (!/^[가-힣a-zA-Z0-9 ]*$/.test(name)) {
      return { valid: false, error: '한글, 영문, 숫자만 가능합니다' };
    }
    return { valid: true };
  }
  
  // ✅ 날짜 포맷팅 (KST)
  static formatDateKST(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(`${year}-${month}-${day}`);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()];
    
    return `${month}/${day} (${dayName})`;
  }
  
  // ✅ 요일 계산
  static getDayOfWeek(dateStr) {
    const date = new Date(dateStr);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return dayNames[date.getDay()];
  }
  
  // ✅ 시간 포맷팅
  static formatTime(minutes) {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}분` : `${hours}시간`;
  }
  
  // ✅ SRS 다음 복습일 계산
  static calculateNextDueDate(failCount, easyFactor = 2.5) {
    const config = new Config();
    const intervals = config.SRS_INTERVALS;
    
    let interval = intervals.new;
    
    if (failCount === 1) interval = intervals.repeat;
    else if (failCount === 2) interval = intervals.easy;
    else if (failCount === 3) interval = intervals.medium;
    else if (failCount >= 4) interval = intervals.hard;
    
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + interval);
    
    return nextDate.toISOString().split('T')[0];
  }
  
  // ✅ 진행도 계산
  static calculateProgress(completed, total) {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
  
  // ✅ 주간 통계 (일주일 데이터)
  static getWeekStats(progressData) {
    const config = new Config();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        day: this.getDayOfWeek(dateStr),
        count: progressData[dateStr] || 0
      });
    }
    
    return days;
  }
  
  // ✅ 색상 밝기 계산 (RGB → 밝기)
  static getColorBrightness(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  // ✅ 안전한 JSON 파싱
  static safeParse(jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.warn('JSON 파싱 실패:', e);
      return defaultValue;
    }
  }
  
  // ✅ 깊은 복사 (깊이 3단계까지)
  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  // ✅ 음성 미리 듣기 (더미)
  static previewVoice(text, voiceId) {
    console.log(`🔊 ${voiceId}로 재생: "${text}"`);
    // 실제 TTS는 VoiceEngine에서 처리
  }
  
  // ✅ 성능 측정
  static measurePerformance(name, fn) {
    const t0 = performance.now();
    const result = fn();
    const t1 = performance.now();
    
    console.log(`⏱️  ${name}: ${(t1 - t0).toFixed(2)}ms`);
    return result;
  }
}

// ============================================================
// 🎯 초기화 예제
// ============================================================

/*
// 앱 시작 시 실행

// 1. 설정 로드
const config = new Config();
console.log('오늘:', config.getTodayKST());
console.log('자정까지:', config.getTimeUntilMidnight() / 1000, '초');

// 2. Storage 확인
console.log('저장소 사용량:', Storage.getUsage());

// 3. 사용자 데이터 조회
const currentUserId = Storage.get(Config.STORAGE_KEYS.CURRENT_USER);
if (currentUserId) {
  const userData = Storage.getUserData(currentUserId);
  console.log('사용자 데이터:', userData);
}

// 4. 유틸리티 테스트
console.log('채점 테스트:', Utils.isCorrect('i go to school', 'I go to school'));
console.log('진행도:', Utils.calculateProgress(120, 500) + '%');
*/

// ✅ Phase 1 완료
// 다음: Phase 2 — UserManager + UserProfile
