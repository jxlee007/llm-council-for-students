/* =========================================
   LLM Council - Mobile-First JavaScript
   ========================================= */

// ========== State Management ==========
const state = {
    swipePosition: 'center', // 'left', 'center', 'right'
    selectedModels: ['gemini', 'deepseek'],
    currentMode: 'council', // 'council', 'prime', 'free'
    currentHistoryTab: 'threads', // 'threads', 'spaces'
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
    prevTranslate: 0
};

// ========== Swipe Navigation ==========
function initSwipeNavigation() {
    const container = document.getElementById('swipe-container');
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function handleTouchStart(e) {
    state.startX = e.touches[0].clientX;
    state.startTime = Date.now();
    state.isDragging = true;
    state.prevTranslate = getCurrentTranslateX();

    const container = document.getElementById('swipe-container');
    container.classList.add('swiping');
}

function handleTouchMove(e) {
    if (!state.isDragging) return;

    state.currentX = e.touches[0].clientX;
    const deltaX = state.currentX - state.startX;
    const containerWidth = window.innerWidth;

    let newTranslate = state.prevTranslate + deltaX;

    // Add resistance at edges
    const maxTranslate = 0;
    const minTranslate = -containerWidth * 2;

    if (newTranslate > maxTranslate) {
        const overflow = newTranslate - maxTranslate;
        newTranslate = maxTranslate + overflow * 0.2;
    } else if (newTranslate < minTranslate) {
        const overflow = minTranslate - newTranslate;
        newTranslate = minTranslate - overflow * 0.2;
    }

    setTranslateX(newTranslate);
}

function handleTouchEnd() {
    if (!state.isDragging) return;

    state.isDragging = false;
    const container = document.getElementById('swipe-container');
    container.classList.remove('swiping');

    const deltaX = state.currentX - state.startX;
    const deltaTime = Date.now() - state.startTime;
    const velocity = Math.abs(deltaX / deltaTime);

    const threshold = window.innerWidth * 0.2;
    const isQuickSwipe = velocity > 0.5 && Math.abs(deltaX) > 30;
    const isLongSwipe = Math.abs(deltaX) > threshold;

    if (isQuickSwipe || isLongSwipe) {
        if (deltaX > 0) {
            // Swipe right - go to previous
            if (state.swipePosition === 'center') {
                snapToPosition('left');
            } else if (state.swipePosition === 'right') {
                snapToPosition('center');
            } else {
                snapToPosition(state.swipePosition);
            }
        } else {
            // Swipe left - go to next
            if (state.swipePosition === 'center') {
                snapToPosition('right');
            } else if (state.swipePosition === 'left') {
                snapToPosition('center');
            } else {
                snapToPosition(state.swipePosition);
            }
        }
    } else {
        // Snap back
        snapToPosition(state.swipePosition);
    }
}

function getCurrentTranslateX() {
    const positions = {
        'left': 0,
        'center': -window.innerWidth,
        'right': -window.innerWidth * 2
    };
    return positions[state.swipePosition];
}

function setTranslateX(value) {
    const container = document.getElementById('swipe-container');
    if (container) {
        container.style.transform = `translateX(${value}px)`;
    }
}

function snapToPosition(position) {
    const container = document.getElementById('swipe-container');
    if (!container) return;

    state.swipePosition = position;
    triggerHaptic('light');

    // Remove inline transform and use CSS classes
    container.style.transform = '';
    container.classList.remove('position-left', 'position-center', 'position-right');
    container.classList.add(`position-${position}`);

    updateSwipeIndicators();
}

function updateSwipeIndicators() {
    const indicators = document.querySelectorAll('.swipe-indicator');
    const posIndex = { 'left': 0, 'center': 1, 'right': 2 };

    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === posIndex[state.swipePosition]);
    });
}

// ========== Bottom Sheets ==========
function openSourcesSheet() {
    triggerHaptic();
    document.getElementById('sources-sheet').classList.add('open');
}

function closeSourcesSheet() {
    document.getElementById('sources-sheet').classList.remove('open');
}

function openModeSheet() {
    triggerHaptic();
    document.getElementById('mode-sheet').classList.add('open');
}

function closeModeSheet() {
    document.getElementById('mode-sheet').classList.remove('open');
}

function openCouncilSheet() {
    triggerHaptic();
    closeModeSheet();
    document.getElementById('council-sheet').classList.add('open');
}

function closeCouncilSheet() {
    document.getElementById('council-sheet').classList.remove('open');
}

function openOrFreeModal() {
    triggerHaptic();
    closeModeSheet();
    document.getElementById('orfree-modal').classList.add('open');
}

function closeOrFreeModal() {
    document.getElementById('orfree-modal').classList.remove('open');
}

// ========== Mode Selection ==========
function selectMode(mode) {
    triggerHaptic();

    if (mode === 'free') {
        openOrFreeModal();
        return;
    }

    const options = document.querySelectorAll('.mode-option');
    options.forEach(opt => opt.classList.remove('selected'));

    const selectedOption = document.querySelector(`.mode-option[onclick*="${mode}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    state.currentMode = mode;
    updateModeIndicator();

    setTimeout(() => closeModeSheet(), 200);
}

function updateModeIndicator() {
    const badge = document.querySelector('.mode-badge');
    const models = document.querySelector('.mode-models');

    if (badge) {
        badge.className = 'mode-badge ' + state.currentMode;
        const modeNames = {
            'council': 'Council Config',
            'prime': 'PRIME PRO',
            'free': 'OR-FREE'
        };
        badge.textContent = modeNames[state.currentMode] || 'Council Config';
    }

    if (models) {
        if (state.currentMode === 'council') {
            models.textContent = `${state.selectedModels.length} models selected`;
        } else {
            models.textContent = '';
        }
    }
}

// ========== Council Config ==========
function openCouncilConfig() {
    openCouncilSheet();
}

function initModelSelection() {
    const cards = document.querySelectorAll('.model-card:not(.locked)');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const modelId = card.dataset.model;
            if (!modelId) return;

            triggerHaptic();

            if (card.classList.contains('selected')) {
                if (state.selectedModels.length > 2) {
                    card.classList.remove('selected');
                    state.selectedModels = state.selectedModels.filter(m => m !== modelId);
                } else {
                    showToast('Minimum 2 models required');
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 400);
                }
            } else {
                if (state.selectedModels.length >= 4) {
                    showToast('Maximum 4 models allowed');
                    card.classList.add('shake');
                    setTimeout(() => card.classList.remove('shake'), 400);
                } else {
                    card.classList.add('selected');
                    state.selectedModels.push(modelId);
                }
            }

            updateModelCount();
        });
    });
}

function updateModelCount() {
    const countEl = document.querySelector('.selection-count');
    if (countEl) {
        countEl.textContent = `${state.selectedModels.length}/4 models selected`;
    }
    updateModeIndicator();
}

function saveCouncilConfig() {
    triggerHaptic('success');
    showToast('Council configuration saved!');
    closeCouncilSheet();
}

// ========== API Key Validation ==========
function validateApiKey() {
    const input = document.getElementById('api-key-input');
    const key = input.value.trim();

    if (!key.startsWith('sk-or-')) {
        showToast('Invalid API key format');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
        return;
    }

    triggerHaptic('success');
    showToast('API key validated!');
    state.currentMode = 'free';
    updateModeIndicator();
    closeOrFreeModal();
}

// ========== Thread Actions ==========
function openThread(threadId) {
    triggerHaptic();
    showToast(`Opening thread ${threadId}...`);
    snapToPosition('center');
    // In real app, would load thread content
    const iconEl = document.getElementById('space-detail-icon');
    const nameEl = document.getElementById('space-detail-name');
    const threadsContainer = document.getElementById('space-threads');

    // Space data
    const spaces = {
        'bookmarks': {
            icon: '📌', name: 'Bookmarks', threads: [
                { title: 'BIOBIZ - largest producer of PLA in india ??', preview: 'No, BIOBIZ is not the largest producer of PLA (polylactic acid) in India...', time: '46m' },
                { title: 'INVEST FUNDS - Research on groww.in/corporate-bonds...', preview: 'Edelweiss Financial Services\' latest NCD issue offers coupon rates...', time: '9h' },
                { title: 'LEARN MUSIC PROD - Im a no brainer...', preview: 'The roadmap in your image is a solid skeleton: it covers DAW setup...', time: '3d' },
                { title: 'sikh tadi artist', preview: 'Dhadi artists, also known as Dhadis, are traditional Punjabi performers...', time: '4d' }
            ]
        },
        'business': {
            icon: '💼', name: 'BUSINESS', threads: [
                { title: 'Business Strategy Q1 2025', preview: 'Planning for the first quarter with focus on expansion...', time: '2d' }
            ]
        },
        'finance': {
            icon: '💰', name: 'PERSONAL FINANCE', threads: [
                { title: 'Investment Portfolio Review', preview: 'Monthly review of all investment allocations...', time: '1w' }
            ]
        },
        'buffet': {
            icon: '🧓', name: 'What would Buffet say?', threads: [
                { title: 'Value Investing Discussion', preview: 'Exploring Buffett\'s principles of value investing...', time: '2w' }
            ]
        },
        'code': {
            icon: '💻', name: 'CODE', threads: [
                { title: 'React Native Mobile App', preview: 'Building a cross-platform mobile application...', time: '3d' }
            ]
        },
        'art': {
            icon: '🎨', name: 'WRITE & ART', threads: [
                { title: 'Creative Writing Ideas', preview: 'Brainstorming new story concepts...', time: '1w' }
            ]
        },
        'imp': {
            icon: '❗', name: 'IMP', threads: [
                { title: 'Important Reminders', preview: 'Critical tasks and deadlines...', time: '5d' }
            ]
        },
        'games': {
            icon: '🎮', name: 'GAMES', threads: [
                { title: 'Gaming Setup Guide', preview: 'Building the perfect gaming rig...', time: '2w' }
            ]
        }
    };

    const space = spaces[spaceId];
    if (!space) return;

    // Update header
    iconEl.textContent = space.icon;
    nameEl.textContent = space.name;

    // Load threads
    threadsContainer.innerHTML = space.threads.map(thread => `
        <div class="space-thread-item" onclick="openThread('${spaceId}')">
            <h3 class="space-thread-title">${thread.title}</h3>
            <p class="space-thread-preview">${thread.preview}</p>
            <div class="space-thread-meta">
                <span><i class="far fa-clock"></i> ${thread.time}</span>
            </div>
        </div>
    `).join('');

    // Show detail view
    detailView.classList.add('active');
}

function closeSpaceDetail() {
    triggerHaptic();
    const detailView = document.getElementById('space-detail-view');
    detailView.classList.remove('active');
}

// ========== Dynamic FAB ==========
function handleFabClick() {
    if (state.currentHistoryTab === 'spaces') {
        // Open new space modal
        openNewSpaceModal();
    } else {
        // Navigate to center (new chat)
        snapToPosition('center');
    }
}

function switchHistoryTab(tab) {
    triggerHaptic();

    const threadsView = document.getElementById('threads-view');
    const spacesView = document.getElementById('spaces-view');
    const threadsTab = document.getElementById('threads-tab');
    const spacesTab = document.getElementById('spaces-tab');
    const slider = document.getElementById('tab-slider');
    const fabIcon = document.getElementById('fab-icon');

    if (tab === 'threads') {
        threadsView.style.display = 'block';
        spacesView.style.display = 'none';
        threadsTab.classList.add('active');
        spacesTab.classList.remove('active');
        slider.classList.remove('slide-right');

        // Update FAB to pen icon
        fabIcon.className = 'fas fa-pen';
    } else if (tab === 'spaces') {
        threadsView.style.display = 'none';
        spacesView.style.display = 'grid';
        threadsTab.classList.remove('active');
        spacesTab.classList.add('active');
        slider.classList.add('slide-right');

        // Update FAB to plus icon
        fabIcon.className = 'fas fa-plus';
    }

    // Store current tab in state
    state.currentHistoryTab = tab;
}

function openSpace(spaceId) {
    triggerHaptic();

    const detailView = document.getElementById('space-detail-view');
    const iconEl = document.getElementById('space-detail-icon');
    const nameEl = document.getElementById('space-detail-name');
    const threadsContainer = document.getElementById('space-threads');

    // Space data
    const spaces = {
        'bookmarks': {
            icon: '📌', name: 'Bookmarks', threads: [
                { title: 'BIOBIZ - largest producer of PLA in india ??', preview: 'No, BIOBIZ is not the largest producer of PLA (polylactic acid) in India...', time: '46m' },
                { title: 'INVEST FUNDS - Research on groww.in/corporate-bonds...', preview: 'Edelweiss Financial Services\' latest NCD issue offers coupon rates...', time: '9h' },
                { title: 'LEARN MUSIC PROD - Im a no brainer...', preview: 'The roadmap in your image is a solid skeleton: it covers DAW setup...', time: '3d' },
                { title: 'sikh tadi artist', preview: 'Dhadi artists, also known as Dhadis, are traditional Punjabi performers...', time: '4d' }
            ]
        },
        'business': {
            icon: '💼', name: 'BUSINESS', threads: [
                { title: 'Business Strategy Q1 2025', preview: 'Planning for the first quarter with focus on expansion...', time: '2d' }
            ]
        },
        'finance': {
            icon: '💰', name: 'PERSONAL FINANCE', threads: [
                { title: 'Investment Portfolio Review', preview: 'Monthly review of all investment allocations...', time: '1w' }
            ]
        }
    };

    const space = spaces[spaceId];
    if (!space) return;

    // Update header
    iconEl.textContent = space.icon;
    nameEl.textContent = space.name;

    // Load threads
    threadsContainer.innerHTML = space.threads.map(thread => `
        <div class="space-thread-item" onclick="openThread('${spaceId}')">
            <h3 class="space-thread-title">${thread.title}</h3>
            <p class="space-thread-preview">${thread.preview}</p>
            <div class="space-thread-meta">
                <span><i class="far fa-clock"></i> ${thread.time}</span>
            </div>
        </div>
    `).join('');

    // Show detail view
    detailView.classList.add('active');
}

// ========== New Space Modal ==========
function openNewSpaceModal() {
    triggerHaptic();
    document.getElementById('new-space-modal').classList.add('open');
}

function closeNewSpaceModal() {
    document.getElementById('new-space-modal').classList.remove('open');
}

function openEmojiPicker() {
    showToast('Emoji picker coming soon!');
}

function createNewSpace() {
    const title = document.getElementById('space-title-input').value.trim();

    if (!title) {
        showToast('Please enter a space title');
        return;
    }

    triggerHaptic('success');
    showToast('Space created successfully!');
    closeNewSpaceModal();

    // Clear form
    document.getElementById('space-title-input').value = '';
    document.getElementById('space-description-input').value = '';
    document.getElementById('space-prompt-input').value = '';
}

// ========== Settings Navigation ==========
function openSettings() {
    snapToPosition('right');
}

// ========== Textarea Auto-Resize ==========
function autoResizeTextarea(textarea) {
    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (max 120px as defined in CSS)
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
}

// ========== File Upload Handling ==========
const uploadedFiles = [];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];

function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

function triggerFileUpload() {
    document.getElementById('file-input').click();
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);

    files.forEach(file => {
        if (validateFileType(file)) {
            uploadedFiles.push(file);
            renderFilePreview(file, uploadedFiles.length - 1);
        } else {
            showToast(`Invalid file type: ${file.name}`);
        }
    });

    // Reset input
    e.target.value = '';
    updateFileAttachmentsVisibility();
}

function validateFileType(file) {
    return ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_DOC_TYPES.includes(file.type);
}

function renderFilePreview(file, index) {
    const container = document.getElementById('file-attachments');

    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        // Image thumbnail
        const thumb = document.createElement('div');
        thumb.className = 'image-thumb';
        thumb.dataset.index = index;

        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeFile(index);

        thumb.appendChild(img);
        thumb.appendChild(removeBtn);
        container.appendChild(thumb);
    } else {
        // File pill for PDFs
        const pill = document.createElement('div');
        pill.className = 'file-pill';
        pill.dataset.index = index;
        pill.innerHTML = `
            <i class="fas fa-file-pdf"></i>
            <span class="file-name">${file.name}</span>
            <button class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(pill);
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    refreshFilePreview();
    triggerHaptic();
}

function refreshFilePreview() {
    const container = document.getElementById('file-attachments');
    container.innerHTML = '';
    uploadedFiles.forEach((file, index) => {
        renderFilePreview(file, index);
    });
    updateFileAttachmentsVisibility();
}

function updateFileAttachmentsVisibility() {
    const container = document.getElementById('file-attachments');
    container.style.display = uploadedFiles.length > 0 ? 'flex' : 'none';
}

function clearUploadedFiles() {
    uploadedFiles.length = 0;
    refreshFilePreview();
}

// ========== Chat Actions ==========
function sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message && uploadedFiles.length === 0) return;

    triggerHaptic();

    // Show chat area
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('messages-container').style.display = 'flex';

    // Render user message with attachments
    renderUserMessage(message, [...uploadedFiles]);

    // Clear input and files
    input.value = '';
    input.style.height = 'auto';
    clearUploadedFiles();

    // Start mock chat flow
    runMockChatFlow(message);
}

function renderUserMessage(text, files) {
    const container = document.getElementById('messages-container');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    let attachmentsHTML = '';
    if (files.length > 0) {
        attachmentsHTML = '<div class="message-attachments">';
        files.forEach(file => {
            if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
                attachmentsHTML += `<div class="image-thumb"><img src="${URL.createObjectURL(file)}"></div>`;
            } else {
                attachmentsHTML += `<div class="file-pill"><i class="fas fa-file-pdf"></i><span class="file-name">${file.name}</span></div>`;
            }
        });
        attachmentsHTML += '</div>';
    }

    const messageHTML = `
        <div class="message user-message">
            ${attachmentsHTML}
            <div class="message-bubble">${text}</div>
            <span class="message-time">${timeStr}</span>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

// ========== Mock Chat Flow ==========
async function runMockChatFlow(query) {
    const container = document.getElementById('messages-container');

    // Stage 1: Loading
    await delay(300);
    const loadingEl = addElement(container, `
        <div class="loading-indicator" id="loading-indicator">
            <span class="loading-dot"></span>
            <span>Consulting council members...</span>
        </div>
    `);
    scrollToBottom();

    // Stage 2: Stage Progress
    await delay(1000);
    loadingEl.remove();
    const stageEl = addElement(container, `
        <div class="stage-progress" id="stage-progress">
            <div class="stage active" id="stage-1">
                <span>Stage 1</span>
                <small>Responses</small>
            </div>
            <div class="stage-line" id="line-1"></div>
            <div class="stage" id="stage-2">
                <span>Stage 2</span>
                <small>Rankings</small>
            </div>
            <div class="stage-line" id="line-2"></div>
            <div class="stage" id="stage-3">
                <span>Stage 3</span>
                <small>Synthesis</small>
            </div>
        </div>
    `);
    scrollToBottom();

    // Stage 3: Responses Modal with Tabs
    await delay(800);
    const responsesModal = addElement(container, `
        <div class="responses-modal" id="responses-modal">
            <div class="responses-tabs">
                <button class="response-tab active" data-model="gemini" onclick="switchResponseTab('gemini')">
                    Gemini <span class="tab-status" id="status-gemini"></span>
                </button>
                <button class="response-tab" data-model="qwen" onclick="switchResponseTab('qwen')">
                    Qwen <span class="tab-status" id="status-qwen"></span>
                </button>
                <button class="response-tab" data-model="deepseek" onclick="switchResponseTab('deepseek')">
                    DeepSeek <span class="tab-status" id="status-deepseek"></span>
                </button>
            </div>
            <div class="responses-content">
                <div class="response-panel active" id="panel-gemini">
                    <div class="response-loading">
                        <span class="loading-dot"></span>
                        <span>Fetching response...</span>
                    </div>
                </div>
                <div class="response-panel" id="panel-qwen">
                    <div class="response-loading">
                        <span class="loading-dot"></span>
                        <span>Fetching response...</span>
                    </div>
                </div>
                <div class="response-panel" id="panel-deepseek">
                    <div class="response-loading">
                        <span class="loading-dot"></span>
                        <span>Fetching response...</span>
                    </div>
                </div>
            </div>
        </div>
    `);
    scrollToBottom();

    // Simulate responses arriving one by one
    await delay(800);
    updateModelResponse('gemini', 'Response A - Database Query Optimization',
        'Use indexing on frequently queried columns. Consider query caching and connection pooling. Profile with EXPLAIN to identify slow queries...');

    await delay(600);
    updateModelResponse('qwen', 'Response B - Performance Tuning',
        'Focus on query optimization through proper indexing strategies. Use connection pooling to reduce overhead. Consider caching frequently accessed data...');

    await delay(500);
    updateModelResponse('deepseek', 'Response C - Comprehensive Approach',
        'Implement multi-layered optimization: 1) Index high-cardinality columns 2) Use query plan analysis 3) Implement read replicas for scaling 4) Add caching layer with Redis...');

    // Update stage progress
    document.getElementById('stage-1').classList.remove('active');
    document.getElementById('stage-1').classList.add('completed');
    document.getElementById('line-1').classList.add('completed');
    document.getElementById('stage-2').classList.add('active');

    // Stage 5: Peer Rankings
    await delay(1500);
    addElement(container, `
        <div class="peer-rankings">
            <div class="rankings-title">Stage 2: Peer Rankings</div>
            <div class="ranking-item first">
                <span class="rank">1st</span>
                <span class="rank-text">Response C - Most comprehensive with examples</span>
                <span class="avg-score">Avg: 1.0</span>
            </div>
            <div class="ranking-item second">
                <span class="rank">2nd</span>
                <span class="rank-text">Response A - Good but less detailed</span>
                <span class="avg-score">Avg: 2.0</span>
            </div>
            <div class="ranking-item third">
                <span class="rank">3rd</span>
                <span class="rank-text">Response B - Missing context</span>
                <span class="avg-score">Avg: 3.0</span>
            </div>
        </div>
    `);
    scrollToBottom();

    // Update stage progress
    document.getElementById('stage-2').classList.remove('active');
    document.getElementById('stage-2').classList.add('completed');
    document.getElementById('line-2').classList.add('completed');
    document.getElementById('stage-3').classList.add('active');

    // Stage 6: Final Answer
    await delay(1500);
    document.getElementById('stage-3').classList.remove('active');
    document.getElementById('stage-3').classList.add('completed');

    addElement(container, `
        <div class="final-answer">
            <div class="final-header">
                <span class="star-icon">⭐</span>
                <h4>Final Answer (Chairman: Gemini 2.0)</h4>
            </div>
            <p>After careful consideration, the council recommends a multi-layered approach: First, implement strategic indexing on high-cardinality columns and foreign keys. Second, use query caching for repeated queries. Third, leverage connection pooling and batch processing where possible...</p>
        </div>
    `);
    scrollToBottom();
    triggerHaptic('success');
}

function addElement(container, html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();
    const el = wrapper.firstChild;
    container.appendChild(el);
    return el;
}

function switchResponseTab(model) {
    triggerHaptic();

    // Update tab active states
    document.querySelectorAll('.response-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.model === model);
    });

    // Update panel visibility
    document.querySelectorAll('.response-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`panel-${model}`).classList.add('active');
}

function updateModelResponse(model, title, content) {
    // Update the status indicator to checkmark
    const status = document.getElementById(`status-${model}`);
    if (status) {
        status.classList.add('complete');
        status.textContent = '✓';
    }

    // Update the panel content
    const panel = document.getElementById(`panel-${model}`);
    if (panel) {
        panel.innerHTML = `
            <h4>${title}</h4>
            <p>${content}</p>
        `;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== Haptic Feedback ==========
function triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
        const patterns = {
            'light': 10,
            'medium': 20,
            'success': [10, 50, 10],
            'error': [30, 50, 30]
        };
        navigator.vibrate(patterns[type] || 10);
    }
}

// ========== Toast Notifications ==========
function showToast(message, duration = 2000) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.9);
        color: #1a1f26;
        padding: 12px 20px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        animation: bounce-in 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎓 LLM Council loaded');

    initSwipeNavigation();
    initModelSelection();
    initFileUpload();
    updateSwipeIndicators();
    updateModeIndicator();
});

// Global function access
window.snapToPosition = snapToPosition;
window.openSourcesSheet = openSourcesSheet;
window.closeSourcesSheet = closeSourcesSheet;
window.openModeSheet = openModeSheet;
window.closeModeSheet = closeModeSheet;
window.openCouncilSheet = openCouncilSheet;
window.closeCouncilSheet = closeCouncilSheet;
window.openCouncilConfig = openCouncilConfig;
window.openOrFreeModal = openOrFreeModal;
window.closeOrFreeModal = closeOrFreeModal;
window.selectMode = selectMode;
window.saveCouncilConfig = saveCouncilConfig;
window.validateApiKey = validateApiKey;
window.openThread = openThread;
window.handleFabClick = handleFabClick;
window.switchHistoryTab = switchHistoryTab;
window.openSpace = openSpace;
window.closeSpaceDetail = closeSpaceDetail;
window.openNewSpaceModal = openNewSpaceModal;
window.closeNewSpaceModal = closeNewSpaceModal;
window.openEmojiPicker = openEmojiPicker;
window.createNewSpace = createNewSpace;
window.openSettings = openSettings;
window.sendMessage = sendMessage;
window.autoResizeTextarea = autoResizeTextarea;
window.triggerFileUpload = triggerFileUpload;
window.removeFile = removeFile;
window.switchResponseTab = switchResponseTab;
