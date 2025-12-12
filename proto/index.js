/* =========================================
   LLM Council - Mobile-First JavaScript
   ========================================= */

// ========== State Management ==========
const state = {
    swipePosition: 'center', // 'left', 'center', 'right'
    selectedModels: ['gemini', 'deepseek'],
    currentMode: 'council', // 'council', 'prime', 'orfree'
    premiumMode: 'orfree', // 'orfree' or 'prime'
    isSubscribed: false, // User subscription status
    currentHistoryTab: 'threads', // 'threads', 'collects'
    currentOpenCollectId: null,
    isDragging: false,
    startX: 0,
    currentX: 0,
    startTime: 0,
    prevTranslate: 0,
    modelsData: null // Will hold loaded model data
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

    const options = document.querySelectorAll('.mode-option');
    options.forEach(opt => opt.classList.remove('selected'));

    if (mode === 'council') {
        const councilOption = document.querySelector('.mode-option[onclick*="council"]');
        if (councilOption) councilOption.classList.add('selected');
        state.currentMode = 'council';
    } else {
        // For premium modes, just show selected state on container
        const premiumOption = document.querySelector('.premium-mode-container');
        if (premiumOption) premiumOption.classList.add('selected');
        state.currentMode = state.premiumMode; // Use current premium mode
    }

    updateModeIndicator();
    setTimeout(() => closeModeSheet(), 200);
}

function handlePremiumModeClick(event) {
    // Select this mode option
    selectMode('premium');
    // Don't close the sheet - let user choose premium sub-mode
    event.stopPropagation();
}

function selectPremiumMode(mode) {
    triggerHaptic();

    // Check if trying to select prime without subscription
    if (mode === 'prime' && !state.isSubscribed) {
        showToast('Subscribe to PRIME PRO to unlock premium models');
        triggerHaptic('error');
        return;
    }

    if (mode === 'orfree') {
        // Check if API key is configured
        const hasApiKey = localStorage.getItem('openrouter_api_key');
        if (!hasApiKey) {
            openOrFreeModal();
            return;
        }
    }

    // Update premium mode
    state.premiumMode = mode;
    state.currentMode = mode;

    // Update UI
    const orFreeTab = document.getElementById('orfree-tab');
    const primeTab = document.getElementById('prime-tab');
    const sliderTrack = document.getElementById('premium-slider-track');
    const orFreeDetail = document.getElementById('orfree-detail');
    const primeDetail = document.getElementById('prime-detail');

    if (mode === 'orfree') {
        orFreeTab.classList.add('active');
        primeTab.classList.remove('active');
        sliderTrack.classList.remove('slide-right');
        orFreeDetail.classList.add('active');
        primeDetail.classList.remove('active');
    } else {
        orFreeTab.classList.remove('active');
        primeTab.classList.add('active');
        sliderTrack.classList.add('slide-right');
        orFreeDetail.classList.remove('active');
        primeDetail.classList.add('active');
    }

    updateModeIndicator();

    // Load appropriate models
    loadModelsForMode(mode);
}

function updateModeIndicator() {
    const badge = document.querySelector('.mode-badge');
    const models = document.querySelector('.mode-models');

    if (badge) {
        badge.className = 'mode-badge ' + state.currentMode;
        const modeNames = {
            'council': 'Council Config',
            'prime': 'PRIME PRO',
            'orfree': 'OR-FREE'
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

// ========== Model Loading from JSON ==========
async function loadModelsData() {
    try {
        const response = await fetch('model.json');
        state.modelsData = await response.json();
        console.log('Models data loaded:', state.modelsData);
    } catch (error) {
        console.error('Failed to load models data:', error);
        showToast('Failed to load model configuration');
    }
}

function loadModelsForMode(mode) {
    if (!state.modelsData) {
        console.warn('Models data not loaded yet');
        return;
    }

    const modelType = mode === 'prime' ? 'paid' : 'free';
    const availableModels = state.modelsData[modelType];

    console.log(`Loading ${modelType} models for ${mode} mode:`, availableModels);
    showToast(`Loaded ${modelType} models`);

    // You can update the UI to show available models here
    // For now, just logging to demonstrate the functionality
}

// Enable PRIME PRO for subscribed users
function updateSubscriptionStatus(isSubscribed) {
    state.isSubscribed = isSubscribed;
    const primeTab = document.getElementById('prime-tab');

    if (primeTab) {
        if (isSubscribed) {
            primeTab.classList.remove('disabled');
            primeTab.disabled = false;
        } else {
            primeTab.classList.add('disabled');
            primeTab.disabled = true;
        }
    }
}

// ========== Council Config ==========
const councilState = {
    members: ['gemini', 'deepseek', null, null], // 4 slots
    chairman: 'gemini'
};

function openCouncilConfig() {
    openCouncilSheet();
}

function addToCouncil(modelId) {
    triggerHaptic();

    // Check if already selected
    const modelIndex = councilState.members.indexOf(modelId);

    if (modelIndex !== -1) {
        // Remove from council
        councilState.members[modelIndex] = null;

        // Remove tick mark
        const modelItem = document.querySelector(`#council-models-list .model-item[data-model="${modelId}"]`);
        if (modelItem) {
            modelItem.classList.remove('selected');
            const checkIcon = modelItem.querySelector('.check-icon');
            if (checkIcon) checkIcon.remove();
        }

        updateCouncilPreview();
        autoSaveCouncil();
        showToast(`${getModelName(modelId)} removed`);
        return;
    }

    // Find first empty slot
    const emptySlotIndex = councilState.members.findIndex(m => m === null);

    if (emptySlotIndex === -1) {
        showToast('All 4 council slots are full');
        return;
    }

    // Add model to slot
    councilState.members[emptySlotIndex] = modelId;

    // Add tick mark
    const modelItem = document.querySelector(`#council-models-list .model-item[data-model="${modelId}"]`);
    if (modelItem) {
        modelItem.classList.add('selected');
        if (!modelItem.querySelector('.check-icon')) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-check check-icon';
            modelItem.appendChild(icon);
        }
    }

    // Update UI
    updateCouncilPreview();
    updateCouncilModels();
    autoSaveCouncil();

    showToast(`${getModelName(modelId)} added`);
}

function removeFromCouncil(slotIndex) {
    triggerHaptic();

    if (councilState.members[slotIndex] === null) return;

    const modelId = councilState.members[slotIndex];
    councilState.members[slotIndex] = null;


    // Update UI
    updateCouncilPreview();
    updateCouncilModels();
    updateCouncilModePreview();
    autoSaveCouncil();

    showToast(`${getModelName(modelId)} removed from slot`);
}

function selectChairman(modelId) {
    triggerHaptic();

    councilState.chairman = modelId;

    // Update UI
    document.querySelectorAll('#chairman-models-list .model-item').forEach(item => {
        item.classList.remove('selected');
        const checkIcon = item.querySelector('.check-icon');
        if (checkIcon) checkIcon.remove();
    });

    const selectedItem = document.querySelector(`#chairman-models-list .model-item[data-model="${modelId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        if (!selectedItem.querySelector('.check-icon')) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-check check-icon';
            selectedItem.appendChild(icon);
        }
    }


    // Update chairman name
    const chairmanName = document.getElementById('chairman-name');
    if (chairmanName) {
        chairmanName.textContent = getModelName(modelId);
    }

    // Update chairman preview in mode selection
    updateCouncilModePreview();

    autoSaveCouncil();

    showToast(`Chairman: ${getModelName(modelId)}`);
}

function updateCouncilPreview() {
    councilState.members.forEach((modelId, index) => {
        const slot = document.getElementById(`member-slot-${index + 1}`);
        if (slot) {
            const nameSpan = slot.querySelector('.slot-name');
            if (nameSpan) {
                nameSpan.textContent = modelId ? getModelName(modelId) : 'Empty';
            }

            // Update border color
            if (modelId) {
                slot.style.borderColor = 'var(--accent-cyan)';
                slot.style.background = 'rgba(32, 201, 151, 0.05)';
            } else {
                slot.style.borderColor = 'var(--border-color)';
                slot.style.background = 'var(--bg-card)';
            }
        }
    });
}

function updateCouncilModePreview() {
    // Update council members preview bar
    const councilPreview = document.getElementById('council-preview-models');
    if (councilPreview && state.modelsData) {
        const selectedModels = councilState.members
            .filter(id => id !== null)
            .map(id => {
                const model = state.modelsData.find(m => m.id === id);
                return model ? model.shortName : id;
            });

        if (selectedModels.length > 0) {
            councilPreview.innerHTML = selectedModels
                .map(name => `<span class="preview-model">${name}</span>`)
                .join('');
        } else {
            councilPreview.innerHTML = '<span class="preview-model">None</span>';
        }
    }

    // Update chairman preview
    const chairmanPreview = document.getElementById('chairman-preview-name');
    if (chairmanPreview && state.modelsData && councilState.chairman) {
        const chairmanModel = state.modelsData.find(m => m.id === councilState.chairman);
        chairmanPreview.textContent = chairmanModel ? chairmanModel.shortName : councilState.chairman;
    }
}

function updateCouncilModels() {
    // Re-render model lists with updated selection states
    if (appData) {
        renderModels('council-models-list', 'council');
        renderModels('chairman-models-list', 'chairman');
    }
    console.log('Council members:', councilState.members);
}

function getModelName(modelId) {
    const modelNames = {
        'gemini': 'Gemini',
        'deepseek': 'DeepSeek',
        'qwen': 'Qwen',
        'llama': 'Llama',
        'mistral': 'Mistral',
        'grok': 'Grok',
        'gpt4': 'GPT-4',
        'claude': 'C-Sonnet',
        'claude-opus': 'C-Opus'
    };
    return modelNames[modelId] || modelId;
}

// Auto-save function
function autoSaveCouncil() {
    // Save to localStorage
    localStorage.setItem('council_config', JSON.stringify(councilState));
    console.log('✅ Council auto-saved:', councilState);
}

// Custom Model Functions
function openCustomModelInput() {
    triggerHaptic('light');
    const input = document.getElementById('custom-model-input');
    if (input) {
        input.style.display = 'flex';
        document.getElementById('custom-model-code').focus();
    }
}

function closeCustomModelInput() {
    triggerHaptic('light');
    const input = document.getElementById('custom-model-input');
    if (input) {
        input.style.display = 'none';
        document.getElementById('custom-model-code').value = '';
    }
}

function addCustomModel() {
    const codeInput = document.getElementById('custom-model-code');
    const modelCode = codeInput.value.trim();

    if (!modelCode) {
        showToast('Please enter a model code');
        triggerHaptic('error');
        return;
    }

    // Basic validation for OpenRouter format (provider/model)
    if (!modelCode.includes('/')) {
        showToast('Invalid format. Use: provider/model-name');
        triggerHaptic('error');
        return;
    }

    triggerHaptic('success');

    // Extract model name from code
    const modelName = modelCode.split('/')[1]?.replace(/-/g, ' ') || modelCode;
    const modelId = modelCode.replace(/\//g, '-').toLowerCase();

    // Add to models list
    const modelsList = document.getElementById('council-models-list');
    const newModel = document.createElement('div');
    newModel.className = 'model-item';
    newModel.dataset.model = modelId;
    newModel.onclick = () => addToCouncil(modelId);
    newModel.innerHTML = `
        <span class="model-emoji">🔷</span>
        <div class="model-details">
            <span class="model-name">${modelName}</span>
            <span class="model-spec">${modelCode}</span>
        </div>
    `;

    // Insert before locked models or at end
    const firstLocked = modelsList.querySelector('.model-item.locked');
    if (firstLocked) {
        modelsList.insertBefore(newModel, firstLocked);
    } else {
        modelsList.appendChild(newModel);
    }

    showToast(`Added ${modelName} to list`);
    closeCustomModelInput();
}

function saveCouncilConfig() {
    const filledSlots = councilState.members.filter(m => m !== null).length;

    if (filledSlots === 0) {
        showToast('Please select at least one council member');
        triggerHaptic('error');
        return;
    }

    triggerHaptic('success');
    showToast(`Council saved: ${filledSlots} members + ${getModelName(councilState.chairman)} as chairman`);
    console.log('Council config:', councilState);
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

    // Save API key to localStorage
    localStorage.setItem('openrouter_api_key', key);

    triggerHaptic('success');
    showToast('API key validated!');

    // Switch to OR-FREE mode
    selectPremiumMode('orfree');

    closeOrFreeModal();
}

function toggleApiInfo() {
    const dropdown = document.querySelector('.api-info-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('expanded');
        triggerHaptic('light');
    }
}


function validateApiKeyInline() {
    const input = document.getElementById('api-key-input-inline');
    const key = input.value.trim();

    if (!key.startsWith('sk-or-')) {
        showToast('Invalid API key format');
        input.classList.add('error');
        setTimeout(() => input.classList.remove('error'), 400);
        triggerHaptic('error');
        return;
    }

    // Save API key to localStorage
    localStorage.setItem('openrouter_api_key', key);

    triggerHaptic('success');
    showToast('✅ API key saved successfully!');



    // Clear input
    input.value = '';

    // Update mode indicator
    selectPremiumMode('orfree');
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
    const collects = {
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

    const space = collects[spaceId];
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
    if (state.currentHistoryTab === 'collects') {
        // Open new collect modal
        openNewCollectModal();
    } else {
        // Navigate to center (new chat)
        snapToPosition('center');
    }
}

function switchHistoryTab(tab) {
    triggerHaptic();

    const threadsView = document.getElementById('threads-view');
    const collectsView = document.getElementById('collects-view');
    const threadsTab = document.getElementById('threads-tab');
    const collectsTab = document.getElementById('collects-tab');
    const slider = document.getElementById('tab-slider');
    const fabIcon = document.getElementById('fab-icon');

    if (tab === 'threads') {
        threadsView.style.display = 'block';
        collectsView.style.display = 'none';
        threadsTab.classList.add('active');
        collectsTab.classList.remove('active');
        slider.classList.remove('slide-right');

        // Update FAB to pen icon
        fabIcon.className = 'fas fa-pen';
    } else if (tab === 'collects') {
        threadsView.style.display = 'none';
        collectsView.style.display = 'grid';
        threadsTab.classList.remove('active');
        collectsTab.classList.add('active');
        slider.classList.add('slide-right');

        // Update FAB to plus icon
        fabIcon.className = 'fas fa-plus';
    }

    // Store current tab in state
    state.currentHistoryTab = tab;
}

function openCollect(collectId) {
    triggerHaptic();

    const detailView = document.getElementById('collect-detail-view');
    const iconEl = document.getElementById('collect-detail-icon');
    const nameEl = document.getElementById('collect-detail-name');
    const threadsContainer = document.getElementById('collect-threads');

    // Collect data - In a real app this would come from appData or API
    // keeping hardcoded for fallback/demo purposes but using appData format
    const collects = {
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

    // Try to find in appData first if available
    let collect = null;
    if (typeof appData !== 'undefined' && appData.collects) {
        collect = appData.collects.find(c => c.id === collectId);
    }

    // Fallback to local hardcoded data if not found or no appData
    if (!collect && collects[collectId]) {
        collect = collects[collectId];
    }

    if (!collect) return;

    // Update header
    iconEl.textContent = collect.icon;
    nameEl.textContent = collect.title || collect.name; // Handle both title (json) and name (hardcoded)

    // Load threads (mock threads for now if not in collect object)
    // Load threads (mock threads for now if not in collect object)
    const threads = collect.threads || [];
    threadsContainer.innerHTML = threads.map(thread => `
        <div class="collect-thread-item" onclick="openThread('${collectId}')">
            <h3 class="collect-thread-title">${thread.title}</h3>
            <p class="collect-thread-preview">${thread.preview}</p>
            <div class="collect-thread-meta">
                <span><i class="far fa-clock"></i> ${thread.time}</span>
            </div>
            <button class="icon-btn" style="margin-left:auto" onclick="openThreadMenu(event, '${thread.id || "mock"}')">
                <i class="fas fa-ellipsis-v" style="font-size: 14px; opacity: 0.7;"></i>
            </button>
        </div>
    `).join('');

    // Update state
    state.currentOpenCollectId = collectId;

    // Show detail view
    detailView.classList.add('active');
}

function closeCollectDetail() {
    triggerHaptic();
    const detailView = document.getElementById('collect-detail-view');
    detailView.classList.remove('active');
}

// ========== New Collect Modal ==========
function openNewCollectModal() {
    triggerHaptic();
    document.getElementById('new-collect-modal').classList.add('open');
}

function closeNewCollectModal() {
    document.getElementById('new-collect-modal').classList.remove('open');
}

function openEmojiPicker() {
    showToast('Emoji picker coming soon!');
}

function createNewCollect() {
    const title = document.getElementById('collect-title-input').value.trim();

    if (!title) {
        showToast('Please enter a collect title');
        return;
    }

    triggerHaptic('success');
    showToast('Collect created successfully!');
    closeNewCollectModal();

    // Clear form
    document.getElementById('collect-title-input').value = '';
    document.getElementById('collect-description-input').value = '';
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

    // Load model data from JSON
    loadModelsData();

    // Initialize premium mode slider with OR-FREE as default
    selectPremiumMode('orfree');

    // Check if user has API key saved
    const hasApiKey = localStorage.getItem('openrouter_api_key');
    if (hasApiKey) {
        console.log('✅ OpenRouter API key found');
    }

    // For demo: You can simulate subscription by calling:
    // updateSubscriptionStatus(true);
});

// ========== Dynamic Data Loading & Rendering ==========
let appData = null;

async function loadAppData() {
    try {
        const response = await fetch('data.json');
        appData = await response.json();
        console.log('✅ App data loaded:', appData);

        // Render all dynamic content
        renderThreads();
        renderCollects();
        renderSources();
        renderModels('council-models-list', 'council');
        renderModels('chairman-models-list', 'chairman');
    } catch (error) {
        console.error('❌ Failed to load app data:', error);
    }
}

function renderThreads() {
    const container = document.getElementById('threads-view');
    const emptyState = document.getElementById('threads-empty-state');
    const incognitoState = document.getElementById('threads-incognito-state');

    if (!container) return;

    // Check if incognito mode is active
    const isIncognito = document.getElementById('incognito-mode')?.checked || false;

    if (isIncognito) {
        // Show incognito state
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (incognitoState) incognitoState.style.display = 'flex';
        return;
    }

    // Check if there are threads
    if (!appData?.threads || appData.threads.length === 0) {
        // Show empty state
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        if (incognitoState) incognitoState.style.display = 'none';
        return;
    }

    // Show threads
    container.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    if (incognitoState) incognitoState.style.display = 'none';

    container.innerHTML = appData.threads.map(thread => `
        <div class="thread-item" onclick="openThread('${thread.id}')">
            <div class="thread-content">
                <h3 class="thread-title">${thread.title}</h3>
                <p class="thread-preview">${thread.preview}</p>
                <div class="thread-meta">
                    <span><i class="far fa-clock"></i> ${thread.time}</span>
                    ${thread.bookmarked ? '<span class="bookmark-tag"><i class="fas fa-bookmark"></i> Bookmarks</span>' : ''}
                </div>
            </div>
            <button class="thread-menu" onclick="openThreadMenu(event, '${thread.id}')"><i class="fas fa-ellipsis-v"></i></button>
        </div>
    `).join('');
}

function renderCollects() {
    const container = document.getElementById('collects-view');
    const emptyState = document.getElementById('collects-empty-state');

    if (!container) return;

    // Check if there are collects
    if (!appData?.collects || appData.collects.length === 0) {
        // Show empty state
        container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    // Show collects
    container.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = appData.collects.map(collect => `
        <div class="collect-card" onclick="openCollect('${collect.id}')">
            <div class="collect-icon">${collect.icon}</div>
            <div class="collect-info">
                <h3 class="collect-title">${collect.title}</h3>
                <div class="collect-meta">
                    <span><i class="far fa-clock"></i> ${collect.time}</span>
                    <span><i class="fas fa-${collect.privacy === 'public' ? 'globe' : 'lock'}"></i> ${collect.privacy === 'public' ? 'Public' : 'Private'}</span>
                </div>
            </div>
            <button class="collect-avatar"><i class="far fa-user"></i></button>
        </div>
    `).join('');
}

function renderSources() {
    const container = document.getElementById('source-toggles');
    if (!container || !appData?.sources) return;

    // Separate Web from specialized sources
    const webSource = appData.sources.find(s => s.id === 'web');
    const specializedSources = appData.sources.filter(s => ['academic', 'finance', 'code'].includes(s.id));

    let html = '';

    // Render Web toggle
    if (webSource) {
        html += `
            <label class="source-toggle ${webSource.checked ? 'active' : ''}">
                <div class="toggle-info">
                    <i class="fas ${webSource.icon}"></i>
                    <div>
                        <span class="toggle-name">${webSource.name}</span>
                        <p class="toggle-hint">${webSource.hint}</p>
                    </div>
                </div>
                <div class="toggle-switch">
                    <input type="checkbox" ${webSource.checked ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </div>
            </label>
        `;
    }

    // Render specialized sources as tab slider
    if (specializedSources.length > 0) {
        html += `
            <div class="source-slider-section">
                <h4 class="slider-section-title">Discussion Context</h4>
                <div class="source-tabs">
                    <div class="source-tab-slider" id="source-tab-slider"></div>
                    ${specializedSources.map((source, index) => `
                        <button class="source-tab ${source.checked ? 'active' : ''}" 
                                data-source="${source.id}"
                                onclick="selectSourceTab('${source.id}')">
                            <i class="fas ${source.icon}"></i>
                            <span>${source.name}</span>
                        </button>
                    `).join('')}
                </div>
                <p class="source-tab-hint" id="source-tab-hint">${specializedSources.find(s => s.checked)?.hint || specializedSources[0].hint}</p>
            </div>
        `;
    }

    container.innerHTML = html;

    // Position slider if there's an active tab
    const activeIndex = specializedSources.findIndex(s => s.checked);
    if (activeIndex >= 0) {
        updateSourceSliderPosition(activeIndex);
    }
}

function selectSourceTab(sourceId) {
    triggerHaptic('light');

    // Update data
    if (appData?.sources) {
        appData.sources.forEach(s => {
            if (['academic', 'finance', 'code'].includes(s.id)) {
                s.checked = s.id === sourceId;
            }
        });
    }

    // Update UI
    document.querySelectorAll('.source-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.source === sourceId);
    });

    // Update hint text
    const source = appData.sources.find(s => s.id === sourceId);
    const hintEl = document.getElementById('source-tab-hint');
    if (hintEl && source) {
        hintEl.textContent = source.hint;
    }

    // Update slider position
    const tabs = Array.from(document.querySelectorAll('.source-tab'));
    const activeIndex = tabs.findIndex(tab => tab.dataset.source === sourceId);
    updateSourceSliderPosition(activeIndex);
}

function updateSourceSliderPosition(index) {
    const slider = document.getElementById('source-tab-slider');
    if (slider) {
        slider.style.transform = `translateX(${index * 100}%)`;
    }
}

function renderModels(containerId, type) {
    const container = document.getElementById(containerId);
    if (!container || !appData?.models) return;

    // Filter models based on type (chairman only shows non-locked)
    const models = type === 'chairman'
        ? appData.models.filter(m => !m.locked)
        : appData.models;

    container.innerHTML = models.map(model => {
        const isSelected = type === 'council'
            ? councilState.members.includes(model.id)
            : councilState.chairman === model.id;

        const onclick = type === 'council'
            ? `addToCouncil('${model.id}')`
            : `selectChairman('${model.id}')`;

        const lockedClass = model.locked ? 'locked' : '';
        const selectedClass = isSelected ? 'selected' : '';

        return `
            <div class="model-item ${selectedClass} ${lockedClass}" data-model="${model.id}" 
                ${!model.locked ? `onclick="${onclick}"` : ''}>
                <span class="model-emoji">${model.emoji}</span>
                <div class="model-details">
                    <span class="model-name">${model.name}</span>
                    <span class="model-spec">${model.spec}</span>
                </div>
                ${isSelected ? '<i class="fas fa-check check-icon"></i>' : ''}
            </div>
        `;
    }).join('');
}

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAppData();
    initSwipeNavigation();

    // Listen for incognito mode changes
    const incognitoToggle = document.getElementById('incognito-mode');
    if (incognitoToggle) {
        incognitoToggle.addEventListener('change', () => {
            renderThreads();
            triggerHaptic('light');
        });
    }
});

// Help Accordion Toggle
function toggleHelp(helpId) {
    triggerHaptic('light');

    const content = document.getElementById(helpId);
    const iconId = helpId.replace('help-', 'help-icon-');
    const icon = document.getElementById(iconId);

    if (!content || !icon) return;

    const isOpen = content.classList.contains('open');

    // Close all help items
    document.querySelectorAll('.help-content').forEach(item => {
        item.classList.remove('open');
    });
    document.querySelectorAll('.help-icon').forEach(ic => {
        ic.classList.remove('rotated');
    });

    // Toggle clicked item
    if (!isOpen) {
        content.classList.add('open');
        icon.classList.add('rotated');
    }
}

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
window.handlePremiumModeClick = handlePremiumModeClick;
window.selectPremiumMode = selectPremiumMode;
window.updateSubscriptionStatus = updateSubscriptionStatus;
window.saveCouncilConfig = saveCouncilConfig;
window.addToCouncil = addToCouncil;
window.selectChairman = selectChairman;
window.openCustomModelInput = openCustomModelInput;
window.closeCustomModelInput = closeCustomModelInput;
window.addCustomModel = addCustomModel;
window.validateApiKey = validateApiKey;
window.toggleApiInfo = toggleApiInfo;
window.validateApiKeyInline = validateApiKeyInline;
window.openThread = openThread;
window.handleFabClick = handleFabClick;
window.switchHistoryTab = switchHistoryTab;
window.openCollect = openCollect;
window.closeCollectDetail = closeCollectDetail;
window.openNewCollectModal = openNewCollectModal;
window.closeNewCollectModal = closeNewCollectModal;
window.openEmojiPicker = openEmojiPicker;
window.createNewCollect = createNewCollect;
window.openSettings = openSettings;
window.sendMessage = sendMessage;
window.autoResizeTextarea = autoResizeTextarea;
window.triggerFileUpload = triggerFileUpload;
window.removeFile = removeFile;
window.switchResponseTab = switchResponseTab;
window.toggleHelp = toggleHelp;

// ========== Dynamic Dropdown System ==========
function showDropdown(event, items) {
    const dropdown = document.getElementById('global-dropdown');
    const backdrop = document.getElementById('dropdown-backdrop');

    // Build items
    dropdown.innerHTML = items.map((item, index) => `
        <button class="dropdown-item ${item.danger ? 'danger' : ''}" onclick="handleDropdownAction(${index})">
            <i class="${item.icon}"></i>
            <span>${item.text}</span>
        </button>
    `).join('');

    // Store callbacks directly on the element
    dropdown.actions = items.map(i => i.action);

    // Position
    const rect = event.currentTarget.getBoundingClientRect();
    const isRightAligned = rect.left > window.innerWidth / 2;

    dropdown.style.top = `${rect.bottom + 8}px`;
    if (isRightAligned) {
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.left = 'auto';
        dropdown.style.transformOrigin = 'top right';
    } else {
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.right = 'auto';
        dropdown.style.transformOrigin = 'top left';
    }

    // Show
    dropdown.classList.add('active');
    backdrop.classList.add('active');
    triggerHaptic('light');
}

function closeDropdown() {
    const dropdown = document.getElementById('global-dropdown');
    const backdrop = document.getElementById('dropdown-backdrop');
    if (dropdown) dropdown.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
}

function handleDropdownAction(index) {
    const dropdown = document.getElementById('global-dropdown');
    if (dropdown.actions && dropdown.actions[index]) {
        dropdown.actions[index]();
    }
    closeDropdown();
}

// ========== Context Menus ==========
function openThreadMenu(event, threadId) {
    event.stopPropagation();
    const items = [
        { icon: 'fas fa-plus-circle', text: 'Add to collect', action: () => openAddToCollectModal(threadId) },
        { icon: 'far fa-trash-alt', text: 'Delete thread', danger: true, action: () => deleteThread(threadId) }
    ];
    showDropdown(event, items);
}

function openCollectMenu(event) {
    event.stopPropagation();
    const collectId = state.currentOpenCollectId;
    if (!collectId) return;

    const items = [
        { icon: 'far fa-edit', text: 'Edit collect', action: () => { showToast('Edit mode'); openNewCollectModal(); } },
        { icon: 'far fa-eye', text: 'View details', action: () => showToast('Read-only view active') },
        { icon: 'far fa-trash-alt', text: 'Delete collect', danger: true, action: () => { closeCollectDetail(); showToast('Collect deleted'); } }
    ];
    showDropdown(event, items);
}

// Mock Actions
function deleteThread(id) {
    showToast(`Thread deleted`);
    triggerHaptic('success');
}

function openAddToCollectModal(id) {
    showToast(`Add to collect options...`);
    triggerHaptic('light');
}

// Global exports
window.showDropdown = showDropdown;
window.closeDropdown = closeDropdown;
window.handleDropdownAction = handleDropdownAction;
window.openThreadMenu = openThreadMenu;
window.openCollectMenu = openCollectMenu;
window.selectSourceTab = selectSourceTab;
