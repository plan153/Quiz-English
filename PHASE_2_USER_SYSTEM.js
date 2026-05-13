/* ============================================================
   PHASE 2 — 사용자 시스템 & 날짜 기반 컨텐츠
   ============================================================
   
   이전 파일 (PHASE_1_MODULES.js) 이후 추가하면 됨
   
   담당 기능:
   1. UserManager: 사용자 생성/선택/전환
   2. DailyScheduler: KST 기반 날짜 관리, 하루 5문장
   3. ContentManager: 날짜별 컨텐츠 제공
   
============================================================ */

// ============================================================
// 1️⃣  USERMANAGER — 사용자 생성/선택/전환
// ============================================================

class UserManager {
  constructor() {
    this.currentUserId = null;
    this.initialize();
  }
  
  // ✅ 초기화 (앱 시작 시)
  initialize() {
    // 1. 설치 날짜가 없으면 설정 (첫 방문)
    if (!Storage.get(Config.STORAGE_KEYS.INSTALL_DATE)) {
      const config = new Config();
      Storage.set(Config.STORAGE_KEYS.INSTALL_DATE, config.getTodayKST());
    }
    
    // 2. 기기 ID 설정 (여러 기기 구분)
    if (!Storage.get(Config.STORAGE_KEYS.DEVICE_ID)) {
      const deviceId = Utils.generateUserId();
      Storage.set(Config.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    // 3. 현재 사용자 로드
    const currentUserId = Storage.get(Config.STORAGE_KEYS.CURRENT_USER);
    if (!currentUserId) {
      // 첫 방문: 기본 사용자 생성
      const defaultUser = this.createUser('첫방문자');
      this.currentUserId = defaultUser.id;
    } else {
      // 기존 사용자: 로드
      this.currentUserId = currentUserId;
    }
  }
  
  // ✅ 새 사용자 생성
  createUser(name, preferences = {}) {
    // 입력값 검증
    const validation = Utils.validateUsername(name);
    if (!validation.valid) {
      console.error('❌ 사용자명 오류:', validation.error);
      return null;
    }
    
    // 사용자 ID 생성
    const userId = Utils.generateUserId();
    
    // 사용자 프로필 생성
    const profile = {
      id: userId,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      deviceId: Storage.get(Config.STORAGE_KEYS.DEVICE_ID),
      
      // 사용자 선호도
      preferences: {
        ...Config.DEFAULT_USER_PREFERENCES,
        ...preferences
      },
      
      // 통계
      stats: {
        totalSentences: 0,      // 풀이한 문장 수
        correctCount: 0,        // 정답 수
        correctRate: 0,         // 정답률 (%)
        currentStreak: 0,       // 연속 학습 일수
        bestStreak: 0,          // 최고 스트릭
        xp: 0,                  // 경험치
        lastActiveAt: null      // 마지막 활동 시간
      }
    };
    
    // localStorage에 저장
    Storage.set(Config.STORAGE_KEYS.CURRENT_USER, userId);
    Storage.set('user_profile', profile, userId);
    
    // 사용자 목록 업데이트
    const userIds = Storage.get(Config.STORAGE_KEYS.USERS_LIST) || [];
    userIds.push(userId);
    Storage.set(Config.STORAGE_KEYS.USERS_LIST, userIds);
    
    // 사용자별 초기 데이터 생성
    this._initializeUserData(userId);
    
    console.log('✅ 새 사용자 생성:', name);
    return profile;
  }
  
  // ✅ 기존 사용자 선택
  selectUser(userId) {
    const profile = Storage.get('user_profile', userId);
    
    if (!profile) {
      console.error('❌ 사용자를 찾을 수 없습니다:', userId);
      return null;
    }
    
    this.currentUserId = userId;
    Storage.set(Config.STORAGE_KEYS.CURRENT_USER, userId);
    
    // 마지막 활동 시간 업데이트
    profile.stats.lastActiveAt = new Date().toISOString();
    Storage.set('user_profile', profile, userId);
    
    console.log('✅ 사용자 선택:', profile.name);
    return profile;
  }
  
  // ✅ 현재 활성 사용자 조회
  getCurrentUser() {
    if (!this.currentUserId) return null;
    
    return Storage.get('user_profile', this.currentUserId);
  }
  
  // ✅ 모든 사용자 목록 조회
  getAllUsers() {
    const userIds = Storage.get(Config.STORAGE_KEYS.USERS_LIST) || [];
    return userIds
      .map(id => Storage.get('user_profile', id))
      .filter(p => p !== null);
  }
  
  // ✅ 사용자 삭제
  deleteUser(userId) {
    // 사용자 목록에서 제거
    const userIds = Storage.get(Config.STORAGE_KEYS.USERS_LIST) || [];
    const updatedIds = userIds.filter(id => id !== userId);
    Storage.set(Config.STORAGE_KEYS.USERS_LIST, updatedIds);
    
    // 사용자 관련 모든 데이터 삭제
    Storage.clearUser(userId);
    
    // 현재 사용자가 삭제되면 다른 사용자로 전환
    if (this.currentUserId === userId) {
      const remaining = this.getAllUsers();
      if (remaining.length > 0) {
        this.selectUser(remaining[0].id);
      } else {
        // 남은 사용자가 없으면 새 사용자 생성
        const newUser = this.createUser('사용자 1');
        this.selectUser(newUser.id);
      }
    }
    
    console.log('✅ 사용자 삭제:', userId);
  }
  
  // ✅ 사용자명 변경
  renameUser(userId, newName) {
    const validation = Utils.validateUsername(newName);
    if (!validation.valid) {
      console.error('❌ 사용자명 오류:', validation.error);
      return false;
    }
    
    const profile = Storage.get('user_profile', userId);
    if (!profile) return false;
    
    profile.name = newName.trim();
    Storage.set('user_profile', profile, userId);
    
    console.log('✅ 사용자명 변경:', newName);
    return true;
  }
  
  // ✅ 사용자 설정 업데이트
  updatePreferences(userId, preferences) {
    const profile = Storage.get('user_profile', userId);
    if (!profile) return false;
    
    profile.preferences = {
      ...profile.preferences,
      ...preferences
    };
    
    Storage.set('user_profile', profile, userId);
    return true;
  }
  
  // ✅ 사용자 통계 업데이트
  updateStats(userId, statUpdates) {
    const profile = Storage.get('user_profile', userId);
    if (!profile) return false;
    
    profile.stats = {
      ...profile.stats,
      ...statUpdates,
      lastActiveAt: new Date().toISOString()
    };
    
    Storage.set('user_profile', profile, userId);
    return true;
  }
  
  // ✅ 사용자 통계 조회
  getStats(userId) {
    const profile = Storage.get('user_profile', userId);
    return profile ? profile.stats : null;
  }
  
  // ✅ 사용자별 초기 데이터 생성
  _initializeUserData(userId) {
    // SRS 데이터 초기화
    Storage.set(Config.STORAGE_KEYS.SRS, {}, userId);
    
    // 설정 초기화
    Storage.set(Config.STORAGE_KEYS.SETTINGS, Config.DEFAULT_USER_PREFERENCES, userId);
    
    // 진행도 초기화
    Storage.set(Config.STORAGE_KEYS.PROGRESS, {
      streak: 0,
      xp: 0,
      daily: {}
    }, userId);
    
    // 마지막 위치 초기화
    Storage.set(Config.STORAGE_KEYS.POSITION, {
      mode: 'quiz',
      index: 0,
      timestamp: new Date().toISOString()
    }, userId);
    
    // 학습목표 초기화
    Storage.set(Config.STORAGE_KEYS.GOALS, [], userId);
    
    console.log('✅ 사용자 데이터 초기화:', userId);
  }
  
  // ✅ 사용자 데이터 전체 내보내기 (백업)
  exportUserData(userId) {
    const profile = Storage.get('user_profile', userId);
    const data = {
      profile,
      srs: Storage.get(Config.STORAGE_KEYS.SRS, userId),
      settings: Storage.get(Config.STORAGE_KEYS.SETTINGS, userId),
      progress: Storage.get(Config.STORAGE_KEYS.PROGRESS, userId),
      position: Storage.get(Config.STORAGE_KEYS.POSITION, userId),
      goals: Storage.get(Config.STORAGE_KEYS.GOALS, userId)
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  // ✅ 사용자 데이터 전체 가져오기 (복원)
  importUserData(userId, jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      Storage.set('user_profile', data.profile, userId);
      Storage.set(Config.STORAGE_KEYS.SRS, data.srs, userId);
      Storage.set(Config.STORAGE_KEYS.SETTINGS, data.settings, userId);
      Storage.set(Config.STORAGE_KEYS.PROGRESS, data.progress, userId);
      Storage.set(Config.STORAGE_KEYS.POSITION, data.position, userId);
      Storage.set(Config.STORAGE_KEYS.GOALS, data.goals, userId);
      
      console.log('✅ 사용자 데이터 복원:', userId);
      return true;
    } catch (e) {
      console.error('❌ 복원 실패:', e);
      return false;
    }
  }
  
  // ✅ 새 기기 감지 (기기 변경 시 사용자 목록 초기화?)
  hasDeviceChanged() {
    const storedDeviceId = Storage.get(Config.STORAGE_KEYS.DEVICE_ID);
    const currentDeviceId = navigator.userAgent;
    
    return storedDeviceId !== currentDeviceId;
  }
}

// ============================================================
// 2️⃣  DAILYSCHEDULER — KST 기반 날짜 관리
// ============================================================

class DailyScheduler {
  // ✅ 오늘 (KST, YYYY-MM-DD)
  static getToday() {
    const config = new Config();
    return config.getTodayKST();
  }
  
  // ✅ 앱 설치 후 경과 일수
  static getDaysSinceInstall() {
    const installDate = Storage.get(Config.STORAGE_KEYS.INSTALL_DATE) || this.getToday();
    const today = this.getToday();
    
    const d1 = new Date(installDate + 'T00:00:00');
    const d2 = new Date(today + 'T00:00:00');
    const diffMs = d2 - d1;
    const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
    
    return Math.max(0, diffDays);
  }
  
  // ✅ 오늘의 5문장 (문장 인덱스 배열)
  static getTodaysSentences() {
    const dayIndex = this.getDaysSinceInstall();
    
    // 100일마다 반복 (500문장 / 5 = 100일)
    const cycleDay = dayIndex % 100;
    const baseIndex = cycleDay * 5;
    
    return [
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 3,
      baseIndex + 4
    ].map(i => i % 500); // 500문장 순환
  }
  
  // ✅ 이번주 문장들
  static getWeeksSentences() {
    const sentences = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toISOString().split('T')[0];
      const installDate = Storage.get(Config.STORAGE_KEYS.INSTALL_DATE);
      
      if (new Date(dateStr) < new Date(installDate)) break;
      
      // 각 날짜의 5문장
      const dayIndex = Math.floor((new Date(dateStr) - new Date(installDate)) / (1000 * 3600 * 24));
      const cycleDay = dayIndex % 100;
      const baseIndex = cycleDay * 5;
      
      for (let j = 0; j < 5; j++) {
        sentences.push((baseIndex + j) % 500);
      }
    }
    
    return [...new Set(sentences)]; // 중복 제거
  }
  
  // ✅ 오늘의 진행도 라벨
  static getTodayLabel() {
    const today = this.getToday();
    const [year, month, day] = today.split('-');
    const date = new Date(`${year}-${month}-${day}`);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()];
    
    return `오늘의 5문장 (${month}/${day} ${dayName}요일)`;
  }
  
  // ✅ 자정까지 남은 시간 (초 단위)
  static getTimeUntilMidnight() {
    const config = new Config();
    return Math.floor(config.getTimeUntilMidnight() / 1000);
  }
  
  // ✅ 내일 시작 예정 시간
  static getTomorrowStartTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tomorrow.toISOString();
  }
  
  // ✅ 완료 여부 확인 (오늘의 5문장)
  static isTodayCompleted(srsData) {
    const todaysSentences = this.getTodaysSentences();
    const completed = todaysSentences.filter(id => {
      const record = srsData[id];
      return record && record.lastReviewedAt === this.getToday();
    });
    
    return completed.length === todaysSentences.length;
  }
}

// ============================================================
// 3️⃣  CONTENTMANAGER — 날짜별 컨텐츠 제공
// ============================================================

class ContentManager {
  // ✅ 필터 적용된 문장 조회
  static getFilteredSentences(sentences, level = 'all', tab = 'all', userId = null) {
    let filtered = sentences;
    
    // 1. 레벨 필터
    if (level !== 'all') {
      filtered = filtered.filter(s => s.level === level);
    }
    
    // 2. 탭 필터
    switch (tab) {
      case 'today': {
        // 오늘의 5문장 + SRS 복습 대기
        const todaysSentences = DailyScheduler.getTodaysSentences();
        const srsData = userId ? Storage.get(Config.STORAGE_KEYS.SRS, userId) : {};
        const dueIds = Object.entries(srsData || {})
          .filter(([_, record]) => {
            const dueDate = record.dueDate || DailyScheduler.getToday();
            return new Date(dueDate) <= new Date(DailyScheduler.getToday());
          })
          .map(([id]) => parseInt(id));
        
        filtered = filtered.filter(s => 
          todaysSentences.includes(s.id) || dueIds.includes(s.id)
        );
        break;
      }
      
      case 'wrong': {
        // 틀린 문장만
        const srsData = userId ? Storage.get(Config.STORAGE_KEYS.SRS, userId) : {};
        filtered = filtered.filter(s => {
          const record = srsData[s.id];
          return record && record.failCount > 0;
        });
        break;
      }
      
      case 'due': {
        // SRS 복습 대기 중
        const srsData = userId ? Storage.get(Config.STORAGE_KEYS.SRS, userId) : {};
        filtered = filtered.filter(s => {
          const record = srsData[s.id];
          if (!record) return false;
          const dueDate = record.dueDate || DailyScheduler.getToday();
          return new Date(dueDate) <= new Date(DailyScheduler.getToday());
        });
        break;
      }
    }
    
    return filtered;
  }
  
  // ✅ 진행 통계
  static getProgressStats(userId, sentences) {
    if (!userId) return null;
    
    const srsData = Storage.get(Config.STORAGE_KEYS.SRS, userId) || {};
    const today = DailyScheduler.getToday();
    
    const stats = {
      total: sentences.length,
      completed: Object.values(srsData).length,
      
      todayCompleted: 0,
      todayRequired: DailyScheduler.getTodaysSentences().length,
      
      wrongCount: 0,
      dueCount: 0,
      correctRate: 0
    };
    
    // 오늘 완료 수
    DailyScheduler.getTodaysSentences().forEach(id => {
      const record = srsData[id];
      if (record && record.lastReviewedAt === today) {
        stats.todayCompleted++;
      }
    });
    
    // 틀린 수 + 복습 대기
    Object.entries(srsData).forEach(([_, record]) => {
      if (record.failCount > 0) stats.wrongCount++;
      
      const dueDate = record.dueDate || today;
      if (new Date(dueDate) <= new Date(today)) {
        stats.dueCount++;
      }
    });
    
    // 정답률
    const totalAttempts = Object.values(srsData).reduce((sum, r) => sum + (r.attemptCount || 0), 0);
    const totalCorrect = Object.values(srsData).reduce((sum, r) => sum + ((r.attemptCount || 0) - (r.failCount || 0)), 0);
    stats.correctRate = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    
    return stats;
  }
  
  // ✅ 오늘의 5문장 라벨
  static getTodayLabel() {
    return DailyScheduler.getTodayLabel();
  }
  
  // ✅ 진행도 바 정보
  static getProgressBarInfo(userId, sentences) {
    const stats = this.getProgressStats(userId, sentences);
    
    if (!stats) return null;
    
    return {
      label: '오늘',
      current: stats.todayCompleted,
      total: stats.todayRequired,
      percentage: Math.round((stats.todayCompleted / stats.todayRequired) * 100)
    };
  }
  
  // ✅ 다음 문장까지 남은 시간
  static getTimeUntilNextSentence() {
    const secondsUntilMidnight = DailyScheduler.getTimeUntilMidnight();
    return Utils.formatTime(Math.ceil(secondsUntilMidnight / 60));
  }
  
  // ✅ 컨텐츠 잠금 해제 여부 (시간 기반)
  static isContentUnlocked(sentenceDay) {
    const daysSinceInstall = DailyScheduler.getDaysSinceInstall();
    return daysSinceInstall >= sentenceDay;
  }
}

// ============================================================
// 🎯 사용 예제
// ============================================================

/*
// 앱 초기화
const userManager = new UserManager();

// 사용자 생성 (첫 방문)
const newUser = userManager.createUser('김영어');
console.log('새 사용자:', newUser.name);

// 사용자 조회
const currentUser = userManager.getCurrentUser();
console.log('현재 사용자:', currentUser.name);

// 통계 업데이트
userManager.updateStats(currentUser.id, {
  totalSentences: 100,
  correctCount: 85,
  correctRate: 85
});

// 날짜 기반 컨텐츠
console.log('오늘의 5문장:', DailyScheduler.getTodaysSentences());
console.log('오늘의 라벨:', DailyScheduler.getTodayLabel());
console.log('경과 일수:', DailyScheduler.getDaysSinceInstall());

// 진행 통계
const stats = ContentManager.getProgressStats(currentUser.id, DB.sentences);
console.log('진행도:', stats);

// 필터링된 문장
const todaysSentences = ContentManager.getFilteredSentences(
  DB.sentences,
  'L1',      // L1 초보자만
  'today',   // 오늘의 문장만
  currentUser.id
);
console.log('오늘 풀어야 할 문장:', todaysSentences.length);
*/

// ✅ Phase 2 완료
// 다음: Phase 3 — VoiceRegistry + VoiceSettings
