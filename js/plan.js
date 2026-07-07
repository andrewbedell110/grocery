// ============================================================
// Plan Module - 3-Step Meal Planning Wizard
// ============================================================

const Plan = {
  currentStep: 1,
  selectedRecipes: [],   // array of recipe objects
  ingredients: [],       // aggregated ingredient list
  shoppingList: [],      // filtered (items user doesn't have)
  _aiRecipes: [],        // stored AI recipe data (avoids HTML attribute escaping issues)

  formatInstructions(text) {
    if (!text) return '<p>No instructions provided.</p>';
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length <= 1) return `<p>${escapeHtml(text)}</p>`;
    return lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
  },

  // ---- Step Navigation ----
  goToStep(step) {
    this.currentStep = step;

    // Update progress bar
    const pct = Math.round((step / 3) * 100);
    const bar = document.getElementById('progress-bar');
    if (bar) {
      bar.style.width = pct + '%';
      if (step === 3) bar.classList.replace('bg-primary', 'bg-carrot-accent') || bar.classList.add('bg-carrot-accent');
      else { bar.classList.remove('bg-carrot-accent'); bar.classList.add('bg-primary'); }
    }
    const stepLabel = document.getElementById('step-label');
    const stepName = document.getElementById('step-name');
    if (stepLabel) stepLabel.textContent = `Step ${step} of 3`;
    if (stepName) stepName.textContent = ['', 'Discovery', 'Pantry Check', 'Grocery Review'][step];

    document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`plan-step-${step}`).classList.add('active');

    // Hide selected meals bar on steps 2 & 3
    const bar2 = document.getElementById('selected-meals-bar');
    if (bar2) bar2.style.display = step === 1 && this.selectedRecipes.length > 0 ? '' : 'none';

    if (step === 2) this.buildIngredientList();
    if (step === 3) this.buildShoppingList();
  },

  // ---- Step 1: Choose Meals ----
  closePanels() {
    // Hide all sub-panels
    document.getElementById('saved-recipes-panel')?.classList.add('hidden');
    document.getElementById('random-recipe-panel')?.classList.add('hidden');
    document.getElementById('questionnaire-panel')?.classList.add('hidden');
    document.getElementById('upload-recipe-panel')?.classList.add('hidden');
    document.getElementById('manual-options-panel')?.classList.add('hidden');
    document.getElementById('photo-import-panel')?.classList.add('hidden');
    document.getElementById('link-import-panel')?.classList.add('hidden');
    document.getElementById('ai-chat-panel')?.classList.add('hidden');
    // Show browse-saved card back
    document.getElementById('browse-saved-card')?.classList.remove('hidden');
    // Show meal-options grid
    document.querySelector('.meal-options')?.classList.remove('hidden');
  },

  showManualOptions() {
    this.openPanel('manual-options-panel');
  },

  openPanel(id) {
    this.closePanels();
    if (id === 'saved-recipes-panel') {
      // Saved recipes replaces the browse-saved card inline within the grid
      const browseCard = document.getElementById('browse-saved-card');
      if (browseCard) browseCard.classList.add('hidden');
    } else {
      // All other panels hide the meal-options grid
      document.querySelector('.meal-options')?.classList.add('hidden');
    }
    document.getElementById(id).classList.remove('hidden');
  },

  _savedRecipesAll: [],
  _savedRecipesShown: 0,
  _savedPageSize: 10,

  async showSavedRecipes() {
    this.openPanel('saved-recipes-panel');
    await Recipes.loadCategories();
    const container = document.getElementById('saved-recipes-list');
    const filters = document.getElementById('category-filters');

    Recipes.renderCategoryFilters(filters, async (catId) => {
      const recipes = await Recipes.loadRecipes(catId);
      this._savedRecipesAll = recipes;
      this._savedRecipesShown = 0;
      container.innerHTML = '';
      this.loadMoreSavedRecipes();
    });

    const recipes = await Recipes.loadRecipes();
    this._savedRecipesAll = recipes;
    this._savedRecipesShown = 0;
    container.innerHTML = '';
    this.loadMoreSavedRecipes();
  },

  loadMoreSavedRecipes() {
    const container = document.getElementById('saved-recipes-list');
    const loadMoreBtn = document.getElementById('saved-recipes-load-more');

    if (!this._savedRecipesAll.length && this._savedRecipesShown === 0) {
      container.innerHTML = '<div class="empty-state"><p>No recipes saved yet.</p></div>';
      loadMoreBtn?.classList.add('hidden');
      return;
    }

    const nextBatch = this._savedRecipesAll.slice(this._savedRecipesShown, this._savedRecipesShown + this._savedPageSize);
    nextBatch.forEach(r => container.appendChild(Recipes.renderCard(r, { showAdd: true, showDelete: true })));
    this._savedRecipesShown += nextBatch.length;

    if (this._savedRecipesShown < this._savedRecipesAll.length) {
      loadMoreBtn?.classList.remove('hidden');
    } else {
      loadMoreBtn?.classList.add('hidden');
    }
  },

  async getRandomRecipe() {
    this.openPanel('random-recipe-panel');
    const result = document.getElementById('random-recipe-result');
    result.innerHTML = '<div class="text-center py-8"><span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span><p class="text-sm text-on-surface-variant mt-3">Finding a trending recipe...</p></div>';

    try {
      const res = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'random' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.renderAIRecipe(result, data);
    } catch (err) {
      result.innerHTML = `<div class="card"><p class="text-muted">Could not find a recipe. ${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm mt-12" onclick="Plan.getRandomRecipe()">Try Again</button></div>`;
    }
  },

  async startQuestionnaire() {
    this.openPanel('questionnaire-panel');
    const content = document.getElementById('questionnaire-content');
    const answers = {};

    const questions = [
      { key: 'meal', text: 'What meal is this for?', options: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
      { key: 'weight', text: 'How hearty?', options: ['Light', 'Medium', 'Filling'] },
      { key: 'vibe', text: 'What vibe?', options: ['Healthy', 'Comfort food', 'Quick & easy', 'Fancy'] },
      { key: 'cuisine', text: 'Any cuisine preference?', options: ['American', 'Mexican', 'Italian', 'Chinese', 'Indian', 'Thai', 'Surprise me', 'Other'] },
      { key: 'extra', text: 'Any other preferences?', freeText: true, placeholder: 'e.g. no dairy, kid-friendly, under 30 min...' }
    ];

    let qi = 0;

    const renderQuestion = () => {
      if (qi >= questions.length) {
        this.submitQuestionnaire(content, answers);
        return;
      }
      const q = questions[qi];

      if (q.freeText) {
        // Free text question
        content.innerHTML = `
          <div class="text-center py-6">
            <h3 class="font-display text-xl font-semibold text-kale-deep mb-6">${q.text}</h3>
            <textarea id="qt-freetext" class="w-full bg-cream-surface border-2 border-outline-variant/30 rounded-xl p-4 text-base text-on-surface focus:border-primary outline-none transition-all resize-none h-28" placeholder="${q.placeholder || ''}"></textarea>
            <div class="flex gap-3 mt-4">
              <button class="qt-skip flex-1 py-4 bg-surface-container-high rounded-xl text-base font-semibold text-on-surface-variant active:scale-[0.98] transition-all">Skip</button>
              <button class="qt-submit flex-1 py-4 bg-carrot-accent text-white rounded-xl text-base font-semibold active:scale-[0.98] transition-all">Next</button>
            </div>
          </div>`;
        content.querySelector('.qt-skip').addEventListener('click', () => { qi++; renderQuestion(); });
        content.querySelector('.qt-submit').addEventListener('click', () => {
          answers[q.key] = document.getElementById('qt-freetext').value.trim();
          qi++;
          renderQuestion();
        });
      } else {
        // Multiple choice question
        const hasOther = q.options.includes('Other');
        const regularOpts = q.options.filter(o => o !== 'Other');

        content.innerHTML = `
          <div class="text-center py-6">
            <h3 class="font-display text-xl font-semibold text-kale-deep mb-6">${q.text}</h3>
            <div class="flex flex-col gap-3">
              ${regularOpts.map(opt => `<button class="question-option w-full py-4 bg-cream-surface border-2 border-transparent rounded-xl text-base font-semibold text-on-surface hover:border-primary/30 active:scale-[0.98] transition-all" data-val="${opt}">${opt}</button>`).join('')}
              ${hasOther ? `
                <div class="flex gap-2">
                  <input type="text" id="qt-other-input" class="flex-1 py-4 px-4 bg-cream-surface border-2 border-outline-variant/30 rounded-xl text-base text-on-surface focus:border-primary outline-none transition-all" placeholder="Type your own...">
                  <button class="qt-other-btn px-6 py-4 bg-carrot-accent text-white rounded-xl text-base font-semibold active:scale-[0.98] transition-all">Go</button>
                </div>
              ` : ''}
            </div>
          </div>`;
        content.querySelectorAll('.question-option').forEach(btn => {
          btn.addEventListener('click', () => {
            answers[q.key] = btn.dataset.val;
            qi++;
            renderQuestion();
          });
        });
        if (hasOther) {
          content.querySelector('.qt-other-btn').addEventListener('click', () => {
            const val = document.getElementById('qt-other-input').value.trim();
            if (val) { answers[q.key] = val; qi++; renderQuestion(); }
          });
        }
      }
    };

    renderQuestion();
  },

  async submitQuestionnaire(container, answers) {
    container.innerHTML = '<div class="text-center py-8"><span class="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span><p class="text-sm text-on-surface-variant mt-3">Searching for the perfect recipe...</p></div>';

    try {
      const res = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'questionnaire', answers })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      this.renderAIRecipe(container, data);
    } catch (err) {
      container.innerHTML = `<div class="card"><p class="text-muted">Could not find a recipe. ${escapeHtml(err.message)}</p>
        <button class="btn btn-secondary btn-sm mt-12" onclick="Plan.startQuestionnaire()">Try Again</button></div>`;
    }
  },

  renderAIRecipe(container, data) {
    const idx = this._aiRecipes.length;
    this._aiRecipes.push(data);

    container.innerHTML = `
      <div class="bg-cream-surface rounded-xl p-6 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5">
        ${data.image_url ? `<img src="${escapeHtml(data.image_url)}" class="w-full h-44 object-cover rounded-lg mb-4" alt="" onerror="this.style.display='none'">` : '<div class="w-full h-44 bg-surface-container-high flex items-center justify-center text-6xl rounded-lg mb-4">🍽</div>'}
        <h3 class="font-display text-lg font-bold text-kale-deep">${escapeHtml(data.title)}</h3>
        <p class="text-sm text-on-surface-variant mt-1 mb-4">${escapeHtml(data.description || '')}</p>
        <p class="text-xs font-bold text-kale-deep/60 uppercase tracking-wider mb-2">Ingredients</p>
        <ul class="pl-5 mb-4 text-sm text-on-surface-variant space-y-1">
          ${(data.ingredients || []).map(i => `<li>${escapeHtml(typeof i === 'string' ? i : `${i.quantity || ''} ${i.unit || ''} ${i.name}`)}</li>`).join('')}
        </ul>
        <p class="text-xs font-bold text-kale-deep/60 uppercase tracking-wider mb-2">Instructions</p>
        <div class="text-sm text-on-surface-variant leading-relaxed space-y-2">${Plan.formatInstructions(data.instructions || '')}</div>
        <div class="flex gap-3 mt-6">
          <button class="flex-1 py-3 bg-primary text-white font-semibold text-sm rounded-full active:scale-95 transition-transform" onclick="Plan.saveOnlyAI(${idx})">Save</button>
          <button class="flex-1 py-3 bg-surface-container-high text-kale-deep font-semibold text-sm rounded-full active:scale-95 transition-transform" onclick="Plan.saveAndEditAI(${idx})">Edit</button>
          <button class="flex-1 py-3 bg-carrot-accent text-white font-semibold text-sm rounded-full active:scale-95 transition-transform" onclick="Plan.saveAndSelectAI(${idx})">Add to Week</button>
        </div>
      </div>`;
  },

  async _saveAIRecipe(idx) {
    const data = this._aiRecipes[idx];
    const ingredients = (data.ingredients || []).map(i => {
      if (typeof i === 'string') return Recipes.parseIngredientLine(i);
      return i;
    }).filter(Boolean);

    const recipe = await Recipes.saveRecipe({
      title: data.title,
      instructions: data.instructions,
      image_url: data.image_url,
      servings: data.servings || 4,
      ingredients,
      categoryIds: []
    });

    return await Recipes.getRecipe(recipe.id);
  },

  async saveOnlyAI(idx) {
    try {
      const full = await this._saveAIRecipe(idx);
      this.closePanels();
      App.showToast('Recipe saved!', 'success');
      RecipeModal.open(full.id, false);
    } catch (err) {
      App.showToast('Error saving recipe: ' + err.message, 'error');
    }
  },

  async saveAndEditAI(idx) {
    try {
      const full = await this._saveAIRecipe(idx);
      this.closePanels();
      App.showToast('Recipe saved!', 'success');
      await RecipeModal.open(full.id, false);
      RecipeModal.openEditForm();
    } catch (err) {
      App.showToast('Error saving recipe: ' + err.message, 'error');
    }
  },

  async saveAndSelectAI(idx) {
    try {
      const full = await this._saveAIRecipe(idx);
      this.selectRecipe(full);
      this.closePanels();
      App.showToast('Recipe saved & added!', 'success');
    } catch (err) {
      App.showToast('Error saving recipe: ' + err.message, 'error');
    }
  },

  showPlanComplete() {
    document.querySelectorAll('.wizard-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('plan-complete').classList.add('active');
    const bar = document.getElementById('progress-bar');
    if (bar) { bar.style.width = '100%'; bar.classList.add('bg-carrot-accent'); bar.classList.remove('bg-primary'); }
    const stepLabel = document.getElementById('step-label');
    const stepName = document.getElementById('step-name');
    if (stepLabel) stepLabel.textContent = 'Complete';
    if (stepName) stepName.textContent = 'Done!';
  },

  restartPlan() {
    this.selectedRecipes = [];
    this.ingredients = [];
    this.shoppingList = [];
    this.goToStep(1);
  },

  showAIChat() {
    this.openPanel('ai-chat-panel');
    const messages = document.getElementById('ai-chat-messages');
    // Reset to initial greeting
    messages.innerHTML = `
      <div class="flex gap-2">
        <div class="w-7 h-7 rounded-full bg-carrot-accent/10 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-carrot-accent text-sm">auto_awesome</span>
        </div>
        <div class="bg-parchment-bg rounded-xl rounded-tl-sm p-3 text-sm text-on-surface max-w-[85%]">
          Hi! I can help you find recipes. Try asking things like "find me a recipe for eggs" or "quick dinner ideas with chicken".
        </div>
      </div>`;
    document.getElementById('ai-chat-input').value = '';
    document.getElementById('ai-chat-input').focus();
  },

  async sendAIChat() {
    const input = document.getElementById('ai-chat-input');
    const q = input.value.trim();
    if (!q) return;

    const messages = document.getElementById('ai-chat-messages');

    // Add user message
    messages.innerHTML += `
      <div class="flex gap-2 justify-end">
        <div class="bg-primary text-white rounded-xl rounded-tr-sm p-3 text-sm max-w-[85%]">${escapeHtml(q)}</div>
      </div>`;
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Add loading indicator
    const loadingId = 'ai-loading-' + Date.now();
    messages.innerHTML += `
      <div class="flex gap-2" id="${loadingId}">
        <div class="w-7 h-7 rounded-full bg-carrot-accent/10 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-carrot-accent text-sm animate-spin">progress_activity</span>
        </div>
        <div class="bg-parchment-bg rounded-xl rounded-tl-sm p-3 text-sm text-on-surface-variant">Thinking...</div>
      </div>`;
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch('/api/ai-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', message: q })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Remove loading
      document.getElementById(loadingId)?.remove();

      // Add AI response with recipe
      const recipeHtml = `
        <div class="flex gap-2">
          <div class="w-7 h-7 rounded-full bg-carrot-accent/10 flex items-center justify-center flex-shrink-0 mt-1">
            <span class="material-symbols-outlined text-carrot-accent text-sm">auto_awesome</span>
          </div>
          <div class="flex-1 max-w-[85%]">
            <div class="bg-parchment-bg rounded-xl rounded-tl-sm p-3 text-sm text-on-surface mb-2">${escapeHtml(data.description || 'Here\'s a recipe I found!')}</div>
            <div id="ai-chat-recipe-${Date.now()}"></div>
          </div>
        </div>`;
      messages.innerHTML += recipeHtml;
      const resultContainer = messages.querySelector('[id^="ai-chat-recipe"]:last-of-type');
      this.renderAIRecipe(resultContainer, data);
      messages.scrollTop = messages.scrollHeight;
    } catch (err) {
      document.getElementById(loadingId)?.remove();
      messages.innerHTML += `
        <div class="flex gap-2">
          <div class="w-7 h-7 rounded-full bg-carrot-accent/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-carrot-accent text-sm">auto_awesome</span>
          </div>
          <div class="bg-error-container rounded-xl rounded-tl-sm p-3 text-sm text-berry-danger max-w-[85%]">Sorry, I couldn't find a recipe. ${escapeHtml(err.message)}</div>
        </div>`;
      messages.scrollTop = messages.scrollHeight;
    }
  },

  showUploadForm() {
    this.openPanel('upload-recipe-panel');
    _uploadPhotoFile = null;
    document.getElementById('upload-photo-preview')?.classList.add('hidden');
    document.getElementById('upload-photo-dropzone')?.classList.remove('hidden');
    const photoInput = document.getElementById('upload-photo-input');
    if (photoInput) photoInput.value = '';
    Recipes.loadCategories().then(() => {
      Recipes.renderUploadCategories(document.getElementById('upload-categories'));
    });
  },

  // ---- Photo Import ----
  _photoBase64: null,
  _photoMediaType: null,

  showPhotoImport() {
    this.openPanel('photo-import-panel');
    this._photoBase64 = null;
    this._photoMediaType = null;
    document.getElementById('photo-import-preview')?.classList.add('hidden');
    document.getElementById('photo-import-btn').disabled = true;
    document.getElementById('photo-import-result').innerHTML = '';
    document.getElementById('photo-import-input').value = '';
  },

  handlePhotoImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      document.getElementById('photo-import-img').src = dataUrl;
      document.getElementById('photo-import-preview').classList.remove('hidden');
      document.getElementById('photo-import-dropzone').classList.add('hidden');

      // Extract base64 and media type
      const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        this._photoMediaType = match[1];
        this._photoBase64 = match[2];
        document.getElementById('photo-import-btn').disabled = false;
      }
    };
    reader.readAsDataURL(file);
  },

  async processPhotoImport() {
    if (!this._photoBase64) return;

    const resultEl = document.getElementById('photo-import-result');
    const btn = document.getElementById('photo-import-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Analyzing image...';
    resultEl.innerHTML = '';

    try {
      const res = await fetch('/api/ai-recipe-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: this._photoBase64,
          mediaType: this._photoMediaType
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.renderAIRecipe(resultEl, data);
      btn.innerHTML = '<span class="material-symbols-outlined text-lg">auto_awesome</span> Extract Recipe with AI';
      btn.disabled = false;
    } catch (err) {
      resultEl.innerHTML = `<p class="text-sm text-berry-danger mt-2">Could not extract recipe: ${escapeHtml(err.message)}</p>`;
      btn.innerHTML = '<span class="material-symbols-outlined text-lg">auto_awesome</span> Try Again';
      btn.disabled = false;
    }
  },

  // ---- Link Import ----
  showLinkImport() {
    this.openPanel('link-import-panel');
    document.getElementById('link-import-url').value = '';
    document.getElementById('link-import-result').innerHTML = '';
  },

  async processLinkImport() {
    const url = document.getElementById('link-import-url').value.trim();
    if (!url) {
      App.showToast('Please enter a URL', 'info');
      return;
    }

    const resultEl = document.getElementById('link-import-result');
    const btn = document.getElementById('link-import-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Importing recipe...';
    resultEl.innerHTML = '';

    try {
      const res = await fetch('/api/ai-recipe-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      this.renderAIRecipe(resultEl, data);
      btn.innerHTML = '<span class="material-symbols-outlined text-lg">auto_awesome</span> Import Recipe with AI';
      btn.disabled = false;
    } catch (err) {
      resultEl.innerHTML = `<p class="text-sm text-berry-danger mt-2">Could not import recipe: ${escapeHtml(err.message)}</p>`;
      btn.innerHTML = '<span class="material-symbols-outlined text-lg">auto_awesome</span> Try Again';
      btn.disabled = false;
    }
  },

  selectRecipe(recipe) {
    if (this.selectedRecipes.find(r => r.id === recipe.id)) {
      App.showToast('Already added!', 'info');
      return;
    }
    this.showDayPicker(recipe);
  },

  showDayPicker(recipe) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/60 z-[300] flex items-end justify-center';
    overlay.id = 'day-picker-overlay';
    overlay.innerHTML = `
      <div class="bg-parchment-bg w-full max-w-md rounded-t-2xl p-5 pb-8 slide-up">
        <div class="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-4"></div>
        <h3 class="font-display text-lg font-bold text-kale-deep mb-1">Which day?</h3>
        <p class="text-sm text-on-surface-variant mb-4">Assign <strong>${escapeHtml(recipe.title)}</strong> to a day.</p>
        <div class="grid grid-cols-2 gap-2">
          ${days.map((d, i) => `<button class="day-pick-btn py-3 bg-cream-surface border-2 border-transparent rounded-xl text-sm font-semibold text-on-surface hover:border-primary/30 active:scale-[0.98] transition-all" data-day="${i}">${d}</button>`).join('')}
        </div>
        <button class="w-full mt-3 py-3 bg-surface-container-high text-kale-deep font-semibold text-sm rounded-full active:scale-95 transition-transform" id="day-pick-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.day-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        recipe._assignedDay = parseInt(btn.dataset.day);
        this.selectedRecipes.push(recipe);
        this.updateSelectedBar();
        overlay.remove();
        App.showToast(`${recipe.title} → ${days[recipe._assignedDay]}`, 'success');
      });
    });

    overlay.querySelector('#day-pick-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  removeRecipe(recipeId) {
    this.selectedRecipes = this.selectedRecipes.filter(r => r.id !== recipeId);
    this.updateSelectedBar();
  },

  updateSelectedBar() {
    const bar = document.getElementById('selected-meals-bar');
    const count = this.selectedRecipes.length;
    document.getElementById('selected-count').textContent = count;
    document.getElementById('selected-meals-text').innerHTML =
      `<span class="text-carrot-accent" id="selected-count">${count}</span> meal${count !== 1 ? 's' : ''} selected`;
    bar.style.display = count > 0 ? '' : 'none';
    document.getElementById('btn-next-step2').disabled = count === 0;

    // Render selected meal chips with remove buttons
    let chipsEl = document.getElementById('selected-chips');
    if (!chipsEl) {
      chipsEl = document.createElement('div');
      chipsEl.id = 'selected-chips';
      chipsEl.className = 'flex flex-wrap gap-2 mt-2';
      bar.querySelector('.max-w-2xl')?.appendChild(chipsEl);
    }
    const dayAbbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    chipsEl.innerHTML = this.selectedRecipes.map(r => `
      <span class="inline-flex items-center gap-1 bg-herb-light text-primary pl-3 pr-1 py-1 rounded-full text-xs font-bold">
        ${r._assignedDay != null ? `<span class="text-carrot-accent">${dayAbbr[r._assignedDay]}</span> ` : ''}${escapeHtml(r.title.length > 20 ? r.title.slice(0, 20) + '...' : r.title)}
        <button class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20" onclick="event.stopPropagation(); Plan.removeRecipe('${r.id}')">
          <span class="material-symbols-outlined text-[14px]">close</span>
        </button>
      </span>
    `).join('');
  },

  // ---- Step 2: Ingredient Checklist ----
  buildIngredientList() {
    const merged = {};

    this.selectedRecipes.forEach(recipe => {
      (recipe.recipe_ingredients || []).forEach(ing => {
        const key = ing.name.toLowerCase().trim();
        if (merged[key]) {
          // Combine quantities if same unit
          if (merged[key].unit === ing.unit && merged[key].quantity && ing.quantity) {
            merged[key].quantity += parseFloat(ing.quantity);
          }
        } else {
          merged[key] = {
            name: ing.name,
            quantity: ing.quantity ? parseFloat(ing.quantity) : null,
            unit: ing.unit,
            checked: false
          };
        }
      });
    });

    this.ingredients = Object.values(merged);
    this.renderChecklist();
  },

  renderChecklist() {
    const container = document.getElementById('ingredient-checklist');
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5 space-y-1';

    this.ingredients.forEach((ing, i) => {
      const id = `pantry-${i}`;
      const div = document.createElement('div');
      div.className = 'relative';
      div.innerHTML = `
        <input type="checkbox" class="pantry-check hidden" id="${id}" ${ing.checked ? 'checked' : ''}>
        <label for="${id}" class="flex items-center gap-4 p-3 rounded-lg bg-parchment-bg hover:bg-herb-light/30 transition-all cursor-pointer">
          <div class="circle-box w-6 h-6 rounded-full border-2 border-outline flex items-center justify-center transition-colors flex-shrink-0">
            <span class="material-symbols-outlined check-icon text-white text-[16px] opacity-0 scale-50 transition-all">check</span>
          </div>
          <div class="flex flex-col flex-1">
            <span class="text-base text-on-surface ingredient-name">${escapeHtml(ing.name)}</span>
            <span class="text-xs text-on-surface-variant italic">${formatQuantity(ing.quantity)} ${ing.unit || ''}</span>
          </div>
        </label>
      `;
      const checkbox = div.querySelector('input');
      checkbox.addEventListener('change', () => {
        ing.checked = checkbox.checked;
      });
      wrapper.appendChild(div);
    });
    container.appendChild(wrapper);
  },

  // ---- Step 3: Shopping List ----
  buildShoppingList() {
    this.shoppingList = this.ingredients.filter(i => !i.checked);
    const container = document.getElementById('shopping-list');
    container.innerHTML = '';

    if (!this.shoppingList.length) {
      container.innerHTML = '<div class="text-center py-12 text-on-surface-variant"><span class="material-symbols-outlined text-5xl opacity-30 block mb-3">check_circle</span><p>You have everything! No shopping needed.</p></div>';
      document.getElementById('kroger-section').classList.add('hidden');
      return;
    }

    document.getElementById('kroger-section').classList.remove('hidden');

    const header = document.createElement('h3');
    header.className = 'text-xs font-bold text-kale-deep uppercase tracking-wider mb-3';
    header.textContent = `${this.shoppingList.length} items to buy`;
    container.appendChild(header);

    this.shoppingList.forEach(item => {
      const div = document.createElement('div');
      div.className = 'bg-cream-surface rounded-xl p-4 shadow-sm border border-kale-deep/5 flex items-center gap-4 mb-2';
      div.innerHTML = `
        <div class="w-10 h-10 rounded-lg bg-herb-light flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-primary text-xl">grocery</span>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-sm text-kale-deep">${escapeHtml(item.name)}</p>
          <p class="text-xs text-on-surface-variant">${formatQuantity(item.quantity)} ${item.unit || ''}</p>
        </div>
      `;
      container.appendChild(div);
    });
  },

  // ---- Finalize ----
  async finalizePlan() {
    try {
      const sb = getSupabase();
      const profile = await Auth.getProfile();
      if (!profile?.household_id) throw new Error('No household');

      // Get current week's Sunday
      const now = new Date();
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      const weekStart = sunday.toISOString().split('T')[0];

      // Upsert weekly plan
      const { data: plan, error: planErr } = await sb
        .from('weekly_plans')
        .upsert({
          household_id: profile.household_id,
          week_start: weekStart,
          created_by: profile.id
        }, { onConflict: 'household_id,week_start' })
        .select()
        .single();

      if (planErr) throw planErr;

      // Append new recipes (don't delete existing ones)
      await sb.from('weekly_plan_recipes').insert(
        this.selectedRecipes.map((r, i) => ({
          plan_id: plan.id,
          recipe_id: r.id,
          day_of_week: r._assignedDay != null ? r._assignedDay : i % 7,
          sort_order: r._assignedDay != null ? r._assignedDay : i
        }))
      );

      // Save all ingredients (both need and have) to shopping_list_items
      const allItems = this.ingredients.map(item => ({
        plan_id: plan.id,
        ingredient_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        already_have: item.checked
      }));
      if (allItems.length) {
        await sb.from('shopping_list_items').insert(allItems);
      }

      App.showToast('Plan saved!', 'success');
      this.selectedRecipes = [];
      this.updateSelectedBar();
      this.showPlanComplete();
      Meals.load();
    } catch (err) {
      App.showToast('Error saving plan: ' + err.message, 'error');
    }
  }
};

// ---- Upload Photo Handler ----
let _uploadPhotoFile = null;
document.getElementById('upload-photo-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  _uploadPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('upload-photo-img').src = ev.target.result;
    document.getElementById('upload-photo-preview').classList.remove('hidden');
    document.getElementById('upload-photo-dropzone').classList.add('hidden');
  };
  reader.readAsDataURL(file);
});

// ---- Upload Recipe Form Handler ----
// Track which submit button was clicked
let _uploadFormAction = 'save';
document.getElementById('upload-recipe-form')?.addEventListener('click', (e) => {
  const btn = e.target.closest('button[name="action"]');
  if (btn) _uploadFormAction = btn.value;
});

document.getElementById('upload-recipe-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('upload-title').value.trim();
  const servings = parseInt(document.getElementById('upload-servings').value) || 4;
  const ingredientText = document.getElementById('upload-ingredients').value;
  const instructions = document.getElementById('upload-instructions').value.trim();

  const categoryIds = Array.from(document.querySelectorAll('#upload-categories .selected'))
    .map(t => t.dataset.id);

  const ingredients = ingredientText.split('\n')
    .map(line => Recipes.parseIngredientLine(line))
    .filter(Boolean);

  try {
    let imageUrl = null;
    // Upload photo if selected
    if (_uploadPhotoFile) {
      const sb = getSupabase();
      const ext = _uploadPhotoFile.name.split('.').pop();
      const path = `recipe-photos/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await sb.storage.from('recipe-images').upload(path, _uploadPhotoFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = sb.storage.from('recipe-images').getPublicUrl(path);
      imageUrl = publicUrl + '?t=' + Date.now();
      _uploadPhotoFile = null;
    }

    const recipe = await Recipes.saveRecipe({ title, instructions, image_url: imageUrl, servings, ingredients, categoryIds });

    if (_uploadFormAction === 'add') {
      const full = await Recipes.getRecipe(recipe.id);
      Plan.selectRecipe(full);
      App.showToast('Recipe saved & added!', 'success');
    } else if (_uploadFormAction === 'edit') {
      App.showToast('Recipe saved!', 'success');
      e.target.reset();
      Plan.closePanels();
      await RecipeModal.open(recipe.id, false);
      RecipeModal.openEditForm();
      return;
    } else {
      App.showToast('Recipe saved!', 'success');
      e.target.reset();
      Plan.closePanels();
      RecipeModal.open(recipe.id, false);
      return;
    }
    e.target.reset();
    Plan.closePanels();
  } catch (err) {
    App.showToast('Error: ' + err.message, 'error');
  }
});
