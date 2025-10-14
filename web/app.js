// Configuration
const API_URL = '/api';

// State
let allMemories = [];
let displayedMemories = [];
let allTags = new Map();
let selectedTag = null;
let dbStats = null;

// Initialize
async function init() {
    await loadMemories();
    setupEventListeners();
}

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('clearBtn').addEventListener('click', handleClear);
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

async function loadMemories() {
    try {
        document.getElementById('loading').style.display = 'block';
        
        // Fetch stats
        const statsRes = await fetch(API_URL + '/stats');
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        dbStats = await statsRes.json();
        
        // Fetch all memories
        const memoriesRes = await fetch(API_URL + '/memories?limit=1000');
        if (!memoriesRes.ok) throw new Error('Failed to fetch memories');
        const data = await memoriesRes.json();
        
        allMemories = data.memories || [];
        displayedMemories = allMemories;
        
        extractTags();
        renderMemories();
        renderTagCloud();
        updateStats();
        
        // Clear any previous errors
        document.getElementById('error').style.display = 'none';
        
    } catch (error) {
        showError(`Error loading memories: ${error.message}`);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

function extractTags() {
    allTags.clear();
    allMemories.forEach(memory => {
        memory.tags.forEach(tag => {
            allTags.set(tag, (allTags.get(tag) || 0) + 1);
        });
    });
}

function renderTagCloud() {
    const tagCloud = document.getElementById('tagCloud');
    const sortedTags = Array.from(allTags.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);

    tagCloud.innerHTML = sortedTags.map(([tag, count]) => `
        <span class="tag ${selectedTag === tag ? 'active' : ''}" onclick="filterByTag('${tag}')">
            ${tag} (${count})
        </span>
    `).join('');
}

function renderMemories() {
    const grid = document.getElementById('memoriesGrid');
    
    if (displayedMemories.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>No memories found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = displayedMemories.map(memory => `
        <div class="memory-card" onclick="showMemoryModal(${memory.id})">
            <div class="memory-meta">
                <span>ID: ${memory.id}</span>
                <span>${formatDate(memory.createdAt)}</span>
            </div>
            <div class="memory-content">
                ${escapeHtml(memory.content)}
            </div>
            <div class="memory-meta" style="margin-top: 12px; font-size: 10px; color: #959da5;">
                <span>Hash: ${memory.hash}</span>
            </div>
            <div class="memory-tags">
                ${memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function showMemoryModal(id) {
    const memory = allMemories.find(m => m.id === id);
    if (!memory) return;

    document.getElementById('modalMeta').innerHTML = `
        <span>ID: ${memory.id}</span>
        <span>${formatDate(memory.createdAt)}</span>
        <span>Hash: ${memory.hash}</span>
    `;
    
    document.getElementById('modalTags').innerHTML = 
        memory.tags.map(tag => `<span class="memory-tag">${tag}</span>`).join('');
    
    document.getElementById('modalBody').textContent = memory.content;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        displayedMemories = allMemories;
    } else {
        displayedMemories = allMemories.filter(m => 
            m.content.toLowerCase().includes(query) ||
            m.tags.some(t => t.includes(query))
        );
    }
    selectedTag = null;
    renderMemories();
    renderTagCloud();
    updateStats();
}

function handleClear() {
    document.getElementById('searchInput').value = '';
    selectedTag = null;
    displayedMemories = allMemories;
    renderMemories();
    renderTagCloud();
    updateStats();
}

function filterByTag(tag) {
    if (selectedTag === tag) {
        selectedTag = null;
        displayedMemories = allMemories;
    } else {
        selectedTag = tag;
        displayedMemories = allMemories.filter(m => m.tags.includes(tag));
    }
    renderMemories();
    renderTagCloud();
    updateStats();
}

function updateStats() {
    document.getElementById('totalCount').textContent = allMemories.length;
    document.getElementById('displayedCount').textContent = displayedMemories.length;
    if (dbStats) {
        document.getElementById('dbPath').textContent = `${dbStats.totalMemories} memories, ${dbStats.dbSize}`;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// Initialize on load
init();
