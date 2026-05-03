const CACHE_NAME = 'quiz-cache-v2';
const CACHE_URLS = ['./','./index.html','./manifest.json','./icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(CACHE_URLS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))
    ).then(()=>clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(res => {
        if(!res||res.status!==200||res.type==='opaque') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c=>c.put(e.request,clone));
        return res;
      });
    }).catch(() => caches.match('./index.html'))
  );
});

self.addEventListener('message', e => {
  if(e.data&&e.data.type==='SCHEDULE_NOTIFICATIONS') scheduleDaily(e.data.times);
});

function scheduleDaily(times){
  times.forEach(({delay,msg})=>{
    setTimeout(()=>{
      self.registration.showNotification('📚 영작 퀴즈 알림',{
        body:msg,icon:'./icon.png',badge:'./icon.png',
        vibrate:[200,100,200],tag:'quiz-reminder',
        requireInteraction:false,data:{url:self.registration.scope}
      });
    },delay);
  });
}

self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list=>{
      for(const c of list){if(c.url===e.notification.data.url&&'focus' in c)return c.focus();}
      if(clients.openWindow) return clients.openWindow(e.notification.data.url);
    })
  );
});
