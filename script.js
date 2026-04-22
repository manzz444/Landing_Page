// ============ GLOBAL VARIABLES ============
let projectChart = null;
let currentProjectFilter = 'all';
let currentJourneyData = [];

// ============ LIVE TIME & DATE ============
function updateLiveTime() {
    const now = new Date();
    const timeElement = document.getElementById('liveTime');
    const dateElement = document.getElementById('liveDate');
    if (timeElement) timeElement.textContent = now.toLocaleTimeString('id-ID');
    if (dateElement) dateElement.textContent = now.toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
}
setInterval(updateLiveTime, 1000);
updateLiveTime();

// ============ CALENDAR ============
function renderCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = `<div class="calendar-header">
        <span>${now.toLocaleString('id-ID', { month: 'long' })} ${year}</span>
    </div>
    <div class="calendar-weekdays">
        <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
    </div>
    <div class="calendar-days">`;
    
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startOffset; i++) html += `<div class="calendar-day"></div>`;
    
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = (d === today) ? 'today' : '';
        html += `<div class="calendar-day ${isToday}">${d}</div>`;
    }
    html += `</div>`;
    const calendarElement = document.getElementById('calendar');
    if (calendarElement) calendarElement.innerHTML = html;
}
renderCalendar();

// ============ NAVIGATION ============
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const page = btn.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) targetPage.classList.add('active');
    });
});

// ============ LOAD STATS (CONSISTENCY = 0 jika tidak ada aktivitas) ============
async function loadStats() {
    try {
        const res = await fetch('get_stats.php');
        const data = await res.json();
        
        let consistency = 0, growth = 0, progress = 0;
        
        if (data.status === 'success') {
            consistency = data.consistency || 0;
            growth = data.habit_growth || 0;
            progress = data.progress || 0;
        }
        
        // Update progress bars
        const consistencyFill = document.getElementById('consistencyFill');
        const growthFill = document.getElementById('growthFill');
        const progressFill = document.getElementById('progressFill');
        
        if (consistencyFill) {
            consistencyFill.style.width = `${consistency}%`;
            consistencyFill.style.backgroundColor = consistency === 0 ? '#ff4444' : '#f9b17a';
        }
        if (growthFill) growthFill.style.width = `${growth}%`;
        if (progressFill) progressFill.style.width = `${progress}%`;
        
        // Update value displays
        const consistencyValue = document.getElementById('consistencyValue');
        const growthValue = document.getElementById('growthValue');
        const progressValue = document.getElementById('progressValue');
        
        if (consistencyValue) consistencyValue.textContent = consistency;
        if (growthValue) growthValue.textContent = growth;
        if (progressValue) progressValue.textContent = progress;
        
        // Update circle chart
        const circle = document.getElementById('growthCircle');
        const percent = document.getElementById('growthPercent');
        if (circle && percent) {
            const radius = 45;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (growth / 100) * circumference;
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
            percent.textContent = `${growth}%`;
        }
        
        console.log(`Stats loaded: Consistency=${consistency}%, Growth=${growth}%, Progress=${progress}%`);
    } catch(e) { 
        console.error('Stats error:', e);
    }
}

// Update consistency (panggil saat ada commit project)
async function updateConsistency(value) {
    let newValue = Math.max(0, Math.min(100, parseInt(value) || 0));
    
    try {
        const response = await fetch('update_stats.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consistency: newValue })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            console.log(`Consistency updated to ${result.consistency}%`);
            loadStats();
            return true;
        }
    } catch(error) {
        console.error('Error updating consistency:', error);
    }
    return false;
}

// ============ LOAD SKILLS ============
async function loadSkills() {
    try {
        const res = await fetch('get_skills.php');
        const data = await res.json();
        const container = document.getElementById('skillTags');
        if (!container) return;
        
        if (data.status === 'success' && data.skills && data.skills.length > 0) {
            container.innerHTML = data.skills.map(s => `
                <div class="skill-tag">
                    ${s.icon || '💻'} ${escapeHtml(s.skill_name)} (${escapeHtml(s.level)})
                    <button class="delete-skill" onclick="deleteSkill(${s.id})">✕</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-data">Belum ada skill. Tambahkan sekarang!</p>';
        }
    } catch(e) { console.error('Skills error:', e); }
}

async function addSkill() {
    const name = document.getElementById('newSkillName')?.value.trim();
    const level = document.getElementById('newskillLevel')?.value;
    if (!name) {
        alert('Masukkan nama skill!');
        return;
    }
    
    try {
        await fetch('update_skill.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=add&name=${encodeURIComponent(name)}&level=${encodeURIComponent(level)}`
        });
        if (document.getElementById('newSkillName')) document.getElementById('newSkillName').value = '';
        loadSkills();
    } catch(e) { console.error('Add skill error:', e); }
}

async function deleteSkill(id) {
    if (confirm('Yakin ingin menghapus skill ini?')) {
        try {
            await fetch('update_skill.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=delete&id=${id}`
            });
            loadSkills();
        } catch(e) { console.error('Delete skill error:', e); }
    }
}

// ============ LOAD PROJECTS & PIE CHART ============
async function loadProjects() {
    try {
        const res = await fetch('get_projects.php');
        const data = await res.json();
        console.log('Projects data:', data);
        
        if (data.status === 'success') {
            if (data.projects && data.projects.length > 0) {
                displayProjects(data.projects);
                updatePieChart(data.projects);
            } else {
                const grid = document.getElementById('projectsGrid');
                if (grid) grid.innerHTML = '<p class="no-data">Belum ada project. Tambahkan project baru!</p>';
                updatePieChart([]);
            }
        } else {
            console.error('Projects error:', data);
        }
    } catch(e) { console.error('Projects error:', e); }
}

function displayProjects(projects) {
    let filtered = projects;
    if (currentProjectFilter !== 'all') {
        filtered = projects.filter(p => p.category === currentProjectFilter);
    }
    
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="no-data">Tidak ada project di kategori ini.</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(p => `
        <a href="${p.link_url || '#'}" target="_blank" class="project-card-link" style="text-decoration: none; display: block;">
            <div class="project-card" data-category="${escapeHtml(p.category)}">
                <h4>${escapeHtml(p.title)}</h4>
                <div class="project-category">📁 ${escapeHtml(p.category)}</div>
                <p>${escapeHtml(p.description)}</p>
                <div class="project-tech">🛠️ ${escapeHtml(p.tech_stack)}</div>
            </div>
        </a>
    `).join('');
}

function updatePieChart(projects) {
    const categories = ['Project mandiri', 'Latihan', 'Belajar mandiri', 'Salinan tugas sekolah'];
    const counts = categories.map(cat => projects.filter(p => p.category === cat).length);
    
    const ctx = document.getElementById('projectPieChart');
    if (!ctx) {
        console.error('Canvas projectPieChart tidak ditemukan');
        return;
    }
    
    if (projectChart) projectChart.destroy();
    
    // Cek apakah semua data 0
    const hasData = counts.some(c => c > 0);
    
    if (!hasData) {
        // Tampilkan chart kosong
        projectChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Belum ada project'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#2d3250'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#e0e0e0' } },
                    tooltip: { callbacks: { label: () => 'Belum ada project' } }
                }
            }
        });
    } else {
        projectChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#f9b17a', '#4247f9', '#7676f4', '#2d3250'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#e0e0e0' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${label}: ${value} project (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Filter buttons
const filterButtons = document.querySelectorAll('.filter-btn');
if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentProjectFilter = btn.dataset.filter;
            loadProjects();
        });
    });
}

// ============ LOAD SARAN ============
async function loadSaran() {
    try {
        const res = await fetch('ambil_data.php');
        const data = await res.json();
        const container = document.getElementById('saranList');
        if (!container) return;
        
        if (data.status === 'success' && data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(s => `
                <div class="saran-card">
                    <strong>${escapeHtml(s.nama)}</strong> 
                    <small>(${escapeHtml(s.email)}) - ${s.created_at}</small>
                    <p>${escapeHtml(s.pesan)}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p>Belum ada saran. Jadilah yang pertama!</p>';
        }
    } catch(e) { console.error('Saran error:', e); }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Submit saran
const saranForm = document.getElementById('saranForm');
if (saranForm) {
    saranForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = document.getElementById('nama')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const pesan = document.getElementById('pesan')?.value.trim();
        
        const statusDiv = document.getElementById('statusMsg');
        if (!nama || !email || !pesan) {
            if (statusDiv) statusDiv.innerHTML = '<span style="color:#ff6b6b">Semua field harus diisi!</span>';
            return;
        }
        
        try {
            const res = await fetch('proses_simpan.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `nama=${encodeURIComponent(nama)}&email=${encodeURIComponent(email)}&pesan=${encodeURIComponent(pesan)}`
            });
            const result = await res.json();
            if (statusDiv) {
                if (result.status === 'success') {
                    statusDiv.innerHTML = '<span style="color:#6bcb77">✅ Saran terkirim! +2 Consistency!</span>';
                    saranForm.reset();
                    loadSaran();
                    loadStats();
                } else {
                    statusDiv.innerHTML = '<span style="color:#ff6b6b">❌ Gagal mengirim saran.</span>';
                }
            }
        } catch(e) { 
            if (statusDiv) statusDiv.innerHTML = '<span style="color:#ff6b6b">❌ Error koneksi.</span>';
        }
    });
}

// ============ LOAD JOURNEY ============
async function loadJourney() {
    try {
        console.log('Loading journey...');
        const res = await fetch('get_journey.php');
        const data = await res.json();
        console.log('Journey response:', data);
        
        const container = document.getElementById('timeline');
        if (!container) {
            console.error('Element timeline tidak ditemukan!');
            return;
        }
        
        if (data.status === 'success') {
            currentJourneyData = data.journey || [];
            console.log('Jumlah journey:', currentJourneyData.length);
            
            if (currentJourneyData.length > 0) {
                // Tampilkan data
                container.innerHTML = currentJourneyData.map(j => `
                    <div class="timeline-item" data-id="${j.id}">
                        <div class="timeline-date">${j.year}</div>
                        <div class="timeline-content">
                            <h4>${escapeHtml(j.title)}</h4>
                            <p>${escapeHtml(j.description)}</p>
                        </div>
                        <div class="timeline-actions">
                            <button class="btn-edit" onclick="openEditJourneyWithPassword(${j.id})">✏️ Edit</button>
                            <button class="btn-delete" onclick="deleteJourneyWithPassword(${j.id})">🗑️ Hapus</button>
                        </div>
                    </div>
                `).join('');
                console.log('Journey berhasil ditampilkan!');
            } else {
                container.innerHTML = '<p>Belum ada perjalanan. Tambahkan sekarang!</p>';
                console.log('Tidak ada journey data');
            }
        } else {
            container.innerHTML = '<p>Error: ' + (data.message || 'Gagal memuat data') + '</p>';
            console.error('Status error:', data);
        }
    } catch(e) { 
        console.error('Journey error:', e);
        const container = document.getElementById('timeline');
        if (container) container.innerHTML = '<p>Gagal memuat data journey. Error: ' + e.message + '</p>';
    }
}

// ============ JOURNEY MANAGEMENT ============
let pendingAction = null;
let pendingData = null;

function showPasswordModal(callback, data) {
    pendingAction = callback;
    pendingData = data;
    
    const modal = document.getElementById('passwordModal');
    const input = document.getElementById('passwordInput');
    if (input) input.value = '';
    if (modal) modal.style.display = 'flex';
}

async function verifyPassword() {
    const password = document.getElementById('passwordInput')?.value || '';
    const errorDiv = document.getElementById('passwordError');
    
    try {
        const res = await fetch('verify_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `password=${encodeURIComponent(password)}`
        });
        const data = await res.json();
        
        if (data.success) {
            const modal = document.getElementById('passwordModal');
            if (modal) modal.style.display = 'none';
            if (errorDiv) errorDiv.textContent = '';
            
            if (pendingAction && pendingData !== undefined) {
                await pendingAction(pendingData);
            }
            loadJourney();
        } else {
            if (errorDiv) errorDiv.textContent = 'Password salah!';
        }
    } catch(e) {
        if (errorDiv) errorDiv.textContent = 'Error verifikasi';
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'none';
    pendingAction = null;
    pendingData = null;
}

const journeyModal = document.getElementById('journeyModal');
const modalTitle = document.getElementById('modalTitle');
const editId = document.getElementById('editId');
const journeyYear = document.getElementById('journeyYear');
const journeyTitle = document.getElementById('journeyTitle');
const journeyDesc = document.getElementById('journeyDesc');

function openEditJourneyWithPassword(id) {
    const item = currentJourneyData.find(j => j.id === id);
    if (item) {
        showPasswordModal(async () => {
            if (modalTitle) modalTitle.textContent = 'Edit Perjalanan';
            if (editId) editId.value = item.id;
            if (journeyYear) journeyYear.value = item.year;
            if (journeyTitle) journeyTitle.value = item.title;
            if (journeyDesc) journeyDesc.value = item.description;
            if (journeyModal) journeyModal.style.display = 'flex';
        }, { id: id });
    }
}

function deleteJourneyWithPassword(id) {
    if (confirm('Yakin ingin menghapus perjalanan ini?')) {
        showPasswordModal(async () => {
            await fetch('update_journey.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=delete&id=${id}`
            });
        }, { id: id });
    }
}

const btnSaveJourney = document.getElementById('btnSaveJourney');
if (btnSaveJourney) {
    btnSaveJourney.addEventListener('click', async () => {
        const id = editId?.value || '';
        const year = journeyYear?.value || '';
        const title = journeyTitle?.value.trim() || '';
        const desc = journeyDesc?.value.trim() || '';
        
        if (!year || !title || !desc) {
            alert('Semua field harus diisi!');
            return;
        }
        
        const action = id ? 'edit' : 'add';
        let body = `action=${action}&year=${encodeURIComponent(year)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(desc)}`;
        if (id) body += `&id=${id}`;
        
        showPasswordModal(async () => {
            await fetch('update_journey.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body
            });
            if (journeyModal) journeyModal.style.display = 'none';
            if (editId) editId.value = '';
            if (journeyYear) journeyYear.value = '';
            if (journeyTitle) journeyTitle.value = '';
            if (journeyDesc) journeyDesc.value = '';
            loadJourney();
        }, {});
    });
}

const btnTambahJourney = document.getElementById('btnTambahJourney');
if (btnTambahJourney) {
    btnTambahJourney.addEventListener('click', () => {
        showPasswordModal(async () => {
            if (modalTitle) modalTitle.textContent = 'Tambah Perjalanan';
            if (editId) editId.value = '';
            if (journeyYear) journeyYear.value = '';
            if (journeyTitle) journeyTitle.value = '';
            if (journeyDesc) journeyDesc.value = '';
            if (journeyModal) journeyModal.style.display = 'flex';
        }, {});
    });
}

document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        const modal = closeBtn.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

window.onclick = function(event) {
    if (event.target.classList && event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Tambahkan fungsi test di console
window.testJourney = async function() {
    try {
        const res = await fetch('get_journey.php');
        const text = await res.text();
        console.log('Raw response:', text);
        const data = JSON.parse(text);
        console.log('Parsed data:', data);
        
        const container = document.getElementById('timeline');
        if (container && data.journey && data.journey.length > 0) {
            container.innerHTML = data.journey.map(j => `
                <div class="timeline-item">
                    <div class="timeline-date">${j.year}</div>
                    <div class="timeline-content">
                        <h4>${j.title}</h4>
                        <p>${j.description}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('Test error:', e);
    }
};

// Tambahkan fungsi untuk menampilkan info stats
function displayStatsInfo(consistency, growth, progress) {
    const container = document.querySelector('.tracker-card');
    if (container && !document.getElementById('statsInfo')) {
        const info = document.createElement('div');
        info.id = 'statsInfo';
        info.style.marginTop = '10px';
        info.style.fontSize = '0.7rem';
        info.style.color = '#888';
        info.style.borderTop = '1px solid #2a2a3e';
        info.style.paddingTop = '10px';
        info.innerHTML = `
            <small>📊 Consistency: dari project baru</small><br>
            <small>📈 Habit Growth: dari kualitas tech stack</small><br>
            <small>🎯 Progress: rata-rata Consistency & Habit</small>
        `;
        container.appendChild(info);
    }
}

// Panggil di loadStats
async function loadStats() {
    try {
        const res = await fetch('get_stats.php');
        const data = await res.json();
        
        let consistency = 0, growth = 0, progress = 0;
        
        if (data.status === 'success') {
            consistency = data.consistency || 0;
            growth = data.habit_growth || 0;
            progress = data.progress || 0;
            
            // Tampilkan pesan jika ada
            if (data.message && data.message.includes('Tidak ada project baru')) {
                console.log(data.message);
            }
        }
        
        // Update UI...
        // (kode yang sudah ada)
        
        displayStatsInfo(consistency, growth, progress);
        
    } catch(e) { 
        console.error('Stats error:', e);
    }
}

// ============ MODAL TAMBAH PROJECT ============
const projectModal = document.getElementById('projectModal');
const btnTambahProject = document.getElementById('btnTambahProject');
const tambahProjectForm = document.getElementById('tambahProjectForm');

// Buka modal
if (btnTambahProject) {
    btnTambahProject.addEventListener('click', () => {
        console.log('Tombol tambah project diklik');
        if (tambahProjectForm) tambahProjectForm.reset();
        const msgDiv = document.getElementById('projectMsg');
        if (msgDiv) msgDiv.innerHTML = '';
        if (projectModal) projectModal.style.display = 'flex';
    });
}

// Preview quality score
const projectTechInput = document.getElementById('projectTech');
const qualityPreview = document.getElementById('qualityPreview');

if (projectTechInput) {
    projectTechInput.addEventListener('input', function() {
        const tech = this.value;
        if (tech.length > 0) {
            let score = 0;
            const techs = tech.toLowerCase().split(',');
            techs.forEach(t => {
                if (t.includes('react') || t.includes('laravel') || t.includes('vue')) score += 25;
                else if (t.includes('javascript') || t.includes('php') || t.includes('mysql')) score += 15;
                else if (t.includes('html') || t.includes('css')) score += 5;
                else if (t.trim().length > 0) score += 10;
            });
            if (techs.length >= 3) score += 10;
            if (techs.length >= 5) score += 15;
            score = Math.min(100, score);
            qualityPreview.innerHTML = `📊 Estimasi Quality Score: ${score}% (akan menambah Habit Growth)`;
        } else {
            qualityPreview.innerHTML = '';
        }
    });
}

// Submit form tambah project
if (tambahProjectForm) {
    tambahProjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Form submit dimulai...');
        
        const title = document.getElementById('projectTitle')?.value.trim();
        const category = document.getElementById('projectCategory')?.value;
        const description = document.getElementById('projectDesc')?.value.trim();
        const tech_stack = document.getElementById('projectTech')?.value.trim();
        const link_url = document.getElementById('projectLink')?.value.trim();
        const password = document.getElementById('adminPassword')?.value;
        
        const msgDiv = document.getElementById('projectMsg');
        
        if (!title) {
            msgDiv.innerHTML = '<span style="color:#ff6b6b">⚠️ Nama project harus diisi!</span>';
            return;
        }
        if (!category) {
            msgDiv.innerHTML = '<span style="color:#ff6b6b">⚠️ Kategori harus dipilih!</span>';
            return;
        }
        if (!description) {
            msgDiv.innerHTML = '<span style="color:#ff6b6b">⚠️ Deskripsi harus diisi!</span>';
            return;
        }
        if (!password) {
            msgDiv.innerHTML = '<span style="color:#ff6b6b">⚠️ Password admin harus diisi!</span>';
            return;
        }
        
        msgDiv.innerHTML = '<span style="color:#f9b17a">⏳ Menambahkan project...</span>';
        
        try {
            // Kirim data ke tambah_project.php
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('tech_stack', tech_stack || '');
            formData.append('link_url', link_url || '#');
            
            console.log('Mengirim data:', title, category);
            
            const res = await fetch('tambah_project.php', {
                method: 'POST',
                body: formData
            });
            
            const text = await res.text();
            console.log('Response:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch(e) {
                msgDiv.innerHTML = '<span style="color:#ff6b6b">❌ Error response: ' + text.substring(0, 100) + '</span>';
                return;
            }
            
            if (data.status === 'success') {
                msgDiv.innerHTML = `<span style="color:#6bcb77">✅ ${data.message}</span>`;
                if (data.stats) {
                    msgDiv.innerHTML += `<br><small>📈 +${data.stats.consistency_added} Consistency, +${data.stats.habit_added} Habit Growth</small>`;
                }
                // Tutup modal setelah 2 detik
                setTimeout(() => {
                    if (projectModal) projectModal.style.display = 'none';
                    loadProjects();
                    loadStats();
                }, 2000);
                tambahProjectForm.reset();
            } else {
                msgDiv.innerHTML = `<span style="color:#ff6b6b">❌ ${data.message}</span>`;
            }
        } catch(e) {
            console.error('Error:', e);
            msgDiv.innerHTML = '<span style="color:#ff6b6b">❌ Error koneksi: ' + e.message + '</span>';
        }
    });
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.style.display = 'none';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) modal.style.display = 'none';
}

// ========== INIT ALL ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, initializing...');
    loadStats();
    loadSkills();
    loadProjects();
    loadSaran();
    loadJourney();
});

setInterval(loadStats, 30000);