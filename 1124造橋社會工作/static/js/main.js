(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Mobile navigation
  const menuToggle = $('.menu-toggle');
  menuToggle?.addEventListener('click', () => {
    const open = $('.main-nav').classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('.main-nav a').forEach(link => link.addEventListener('click', () => $('.main-nav').classList.remove('open')));

  // Dual audience mode highlights the relevant service area.
  const modeTargets = { youth: ['#return', '#community'], visitor: ['#archive', '#routes'] };
  function setMode(mode, scroll = false) {
    $$('.mode-btn').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    $$('.mode-highlight').forEach(el => el.classList.remove('mode-highlight'));
    (modeTargets[mode] || []).forEach(selector => $(selector)?.classList.add('mode-highlight'));
    if (scroll && modeTargets[mode]?.[0]) $(modeTargets[mode][0]).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $$('.mode-btn').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $$('[data-focus]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.focus)));

  // Four business model tabs.
  const cases = {
    pumpkin: { tag: '循環農業 · 農創案例', title: '南瓜聯合國<br>把農業副產物，變成生長的養分。', text: '酪農二代陳琦芳投入十五年栽培百種南瓜，將乳牛廢棄物轉化為有機堆肥，並打造百米南瓜隧道，讓農業、景觀與體驗彼此支持。', facts: [['15年','栽培累積'],['百種','南瓜品系'],['循環','農牧共好']], icon: '◉', color: '#a2a778' },
    餐坊: { tag: '社區餐飲 · 婦女共創', title: '田媽媽牛奶故鄉餐坊<br>把家政手藝，變成地方款待。', text: '家政班班長張淑枝帶領八位婦女，將苗翔牧場轉型為體驗餐飲與鮮乳冰品場域，串起在地農產、乳業與社區協作。', facts: [['8位','婦女夥伴'],['鮮乳','在地風味'],['體驗','餐飲服務']], icon: '❋', color: '#d5a86c' },
    阿賢: { tag: '友善食農 · 轉職實踐', title: '阿賢農場<br>從科技業走進田間的食農課。', text: '科技業轉型農夫何慶賢與陳秋月於朝陽村推廣苗栗特用作物丹參，規劃220米南瓜棚架與地瓜焢窯，讓農事成為可親近的體驗。', facts: [['丹參','在地特作'],['220米','南瓜棚架'],['焢窯','食農體驗']], icon: '⌁', color: '#77906e' },
    小舖: { tag: '社區共好 · 地產地銷', title: '地產地銷社區小舖<br>讓小農好物被更多人看見。', text: '造橋鄉農會自民國106年成立農村社區小舖，串聯小農與青農，透過共同展售縮短產地與消費者的距離。', facts: [['106年','成立起點'],['小農','產地串聯'],['共售','社區通路']], icon: '✳', color: '#b47f5b' }
  };
  $$('.business-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.business-tab').forEach(item => item.classList.toggle('active', item === tab));
    const item = cases[tab.dataset.tab];
    $('#business-panel').innerHTML = `<div class="panel-visual" style="background:${item.color}"><span class="panel-sun"></span><span class="pumpkin">${item.icon}</span><span class="panel-caption">FROM SOIL TO TABLE</span></div><div class="panel-copy"><span class="tag">${item.tag}</span><h3>${item.title}</h3><p>${item.text}</p><div class="case-facts">${item.facts.map(([a,b]) => `<span><b>${a}</b>${b}</span>`).join('')}</div></div>`;
  }));

  // Rent subsidy estimate, based on the criteria supplied for this project.
  const income = $('#income'), type = $('#tenant-type'), bonus = $('#family-bonus'), result = $('#calc-result');
  function calculateRent() {
    const value = Number(income.value);
    if (!income.value) { result.textContent = '輸入所得後，即時查看試算結果。'; return; }
    const incomeLimit = bonus.checked ? 54303 : 46545;
    if (value >= incomeLimit) { result.textContent = `依115年度苗栗縣門檻，${bonus.checked ? '婚育家庭' : '一般家庭'}每人每月所得需低於 ${incomeLimit.toLocaleString()} 元；目前試算為不符合。`; return; }
    const amount = Math.round(Number(type.value) * (bonus.checked ? 1.5 : 1));
    result.innerHTML = `初步試算符合所得門檻，預估每月補貼上限 <strong>NT$ ${amount.toLocaleString()}</strong>${bonus.checked ? '（以 1.5 倍簡易試算）' : ''}。`;
  }
  [income, type, bonus].forEach(el => {
    el.addEventListener('input', calculateRent);
    el.addEventListener('change', calculateRent);
  });

  // Filter jobs from Flask API.
  $('#industry-filter').addEventListener('change', async event => {
    const body = $('#jobs-body'); body.innerHTML = '<tr><td colspan="4">讀取職缺中…</td></tr>';
    try {
      const response = await fetch(`/api/jobs${event.target.value ? `?industry=${encodeURIComponent(event.target.value)}` : ''}`);
      const jobs = await response.json();
      body.innerHTML = jobs.length ? jobs.map(job => `<tr><td data-label="企業／單位">${escapeHtml(job.company)}</td><td data-label="產業類別"><span class="industry-chip">${escapeHtml(job.industry)}</span></td><td data-label="職缺內容">${escapeHtml(job.positions)}</td><td data-label="薪資資訊">${escapeHtml(job.salary)}</td></tr>`).join('') : '<tr><td colspan="4">目前沒有符合的職缺。</td></tr>';
    } catch { body.innerHTML = '<tr><td colspan="4">職缺暫時無法載入，請稍後再試。</td></tr>'; }
  });

  // Leaflet map and local points.
  if (window.L && $('#map')) {
    const map = L.map('map', { scrollWheelZoom: false }).setView([24.6415, 120.8655], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    const places = [
      ['造橋車站日式宿舍群','百年鐵道聚落與1938年台灣檜木日式站長宿舍。','造橋車站步行可達；建議依現場開放資訊參訪。',24.6415,120.8655],
      ['談文車站','海線車站與花海走讀的起點。','可搭乘台鐵至談文站，請事先查詢班次。',24.6647,120.8668],
      ['龍昇湖（大潭埤）','里山埤塘風景與農村生態走讀據點。','建議自造橋市區安排接駁或自行開車前往。',24.6375,120.9090],
      ['木頭窯陶藝工坊','大西村徐連斌老師的木頭窯生活陶藝場域。','建議預約體驗並事先確認交通方式。',24.6650,120.8890],
      ['火炭谷休閒農場','認識造橋炭鄉記憶、養生木炭與炭泉體驗。','採預約參訪，依農場提供的交通資訊前往。',24.6525,120.8870],
      ['阿賢農場','丹參、南瓜棚架與地瓜焢窯食農體驗。','朝陽村場域，建議預約後依主辦方指引前往。',24.6320,120.8810]
    ];
    places.forEach(([name, intro, travel, lat, lng]) => {
      L.marker([lat, lng]).addTo(map).bindPopup(`<strong>${escapeHtml(name)}</strong><br>${escapeHtml(intro)}<br><small>交通：${escapeHtml(travel)}</small>`);
    });
  }

  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]); }

  // Booking submit and public demonstration records view.
  const bookingForm = $('#booking-form'), bookingMessage = $('#booking-message');
  bookingForm.addEventListener('submit', async event => {
    event.preventDefault(); bookingMessage.textContent = '正在送出預約…';
    const payload = Object.fromEntries(new FormData(bookingForm).entries());
    try {
      const response = await fetch('/api/bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '送出失敗，請檢查欄位後重試。');
      bookingMessage.textContent = `${data.message} 預約編號：#${data.booking_id}`; bookingForm.reset();
    } catch (error) { bookingMessage.textContent = error.message; }
  });
  const modal = $('#bookings-modal');
  $('#show-bookings').addEventListener('click', async () => {
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); $('#booking-records').textContent = '讀取中…';
    try {
      const response = await fetch('/api/bookings'); const records = await response.json();
      $('#booking-records').innerHTML = records.length ? records.map(item => `<div class="record-item"><b>#${item.id} · ${escapeHtml(item.name)}</b>　${escapeHtml(item.booking_date)}　${escapeHtml(item.people)} 人<small>${escapeHtml(item.organization)}｜${escapeHtml(item.experience)}｜${escapeHtml(item.phone)}</small>${item.notes ? `<small>備註：${escapeHtml(item.notes)}</small>` : ''}</div>`).join('') : '<p>目前尚無預約紀錄。</p>';
    } catch { $('#booking-records').textContent = '預約紀錄暫時無法載入。'; }
  });
  $$('[data-close]').forEach(el => el.addEventListener('click', () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); } });

  // Local compliance inquiry is confirmed in the browser; this demo does not transmit contact data.
  $('#consult-form').addEventListener('submit', event => {
    event.preventDefault(); const topic = new FormData(event.currentTarget).get('topic');
    $('#consult-message').textContent = `已記下「${topic}」諮詢需求。這是前端示範確認，尚未送至服務單位。`;
    event.currentTarget.reset();
  });
})();
