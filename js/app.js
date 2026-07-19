// ============================================================
// App Shell - Navigation, Auth Check, Page Lifecycle
// ============================================================

const App = {
  currentPage: null,
  profile: null,

  init() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    this.setupForms();
    this.checkAuth();
  },

  async checkAuth() {
    const params = new URLSearchParams(window.location.search);

    // Handle password recovery link
    if (window.location.hash.includes('type=recovery') || params.get('type') === 'recovery') {
      window.history.replaceState({}, '', '/');
      this.navigate('login');
      this.showNewPasswordForm();
      return;
    }

    const session = await Auth.getSession();
    if (session) {
      await Auth.ensureHousehold();
      this.profile = await Auth.getProfile();
      // Load subscription status in background
      Subscription.load();
      // Handle Kroger OAuth redirect
      if (params.get('subscription') === 'success') {
        window.history.replaceState({}, '', '/');
        this.navigate('settings');
        this.showToast('Welcome to Premium!', 'success');
      } else if (params.get('kroger_connected') === 'true' || params.get('kroger_error')) {
        this.navigate('settings');
      } else {
        this.navigate('meals');
        // Show tutorial on first login
        if (!localStorage.getItem('tutorial_completed')) {
          setTimeout(() => Tutorial.start(), 500);
        }
      }
    } else {
      this.navigate('login');
    }
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.add('active');

    // Update nav active states
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const isActive = btn.dataset.page === page;
      if (isActive) {
        btn.classList.add('bg-primary-container', 'text-on-primary-container', 'rounded-full');
        btn.classList.remove('text-on-surface-variant');
        btn.querySelector('.nav-icon')?.classList.add('icon-filled');
        // Bounce animation
        btn.classList.remove('nav-bounce');
        void btn.offsetWidth; // force reflow to restart animation
        btn.classList.add('nav-bounce');
      } else {
        btn.classList.remove('bg-primary-container', 'text-on-primary-container', 'rounded-full');
        btn.classList.add('text-on-surface-variant');
        btn.querySelector('.nav-icon')?.classList.remove('icon-filled');
      }
    });

    const nav = document.getElementById('bottom-nav');
    if (nav) {
      nav.style.display = ['login', 'signup'].includes(page) ? 'none' : 'flex';
    }

    // Page lifecycle hooks
    switch (page) {
      case 'meals': Meals.load(); break;
      case 'myrecipes': MyRecipes.load(); break;
      case 'recipes': RecipesPage.load(); break;
      case 'grocery': GroceryList.load(); break;
      case 'social': Social.load(); break;
      case 'settings': Settings.load(); break;
      case 'admin': Admin.load(); break;
    }
  },

  setupForms() {
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await Auth.signIn(email, password);
        await Auth.ensureHousehold();
        this.profile = await Auth.getProfile();
        this.navigate('meals');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const household = document.getElementById('signup-household').value;
      try {
        await Auth.signUp(email, password, household);
        this.showToast('Account created! Check your email to verify.', 'success');
        this.navigate('login');
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('reset-email').value;
      try {
        await Auth.resetPassword(email);
        this.showToast('Reset link sent! Check your email.', 'success');
        this.showLoginForm();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });

    document.getElementById('new-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('new-password').value;
      const confirm = document.getElementById('new-password-confirm').value;
      if (pw !== confirm) {
        this.showToast('Passwords do not match', 'error');
        return;
      }
      try {
        await Auth.updatePassword(pw);
        this.showToast('Password updated! Please sign in.', 'success');
        this.showLoginForm();
      } catch (err) {
        this.showToast(err.message, 'error');
      }
    });
  },

  showUpgradePrompt(reason) {
    const modal = document.getElementById('upgrade-modal');
    if (reason) document.getElementById('upgrade-reason').textContent = reason;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  showResetPassword() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.remove('hidden');
    document.getElementById('new-password-form').classList.add('hidden');
    document.getElementById('auth-tabs').classList.add('hidden');
  },

  showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('new-password-form').classList.add('hidden');
    document.getElementById('auth-tabs').classList.remove('hidden');
  },

  showNewPasswordForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('reset-form').classList.add('hidden');
    document.getElementById('new-password-form').classList.remove('hidden');
    document.getElementById('auth-tabs').classList.add('hidden');
  },

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = 'toast', 3000);
  }
};

// ============================================================
// This Week's Meals Page
// ============================================================

const Meals = {
  editing: false,
  currentPlan: null,

  async load() {
    this.editing = false;
    const editBtn = document.getElementById('edit-week-btn');

    const sb = getSupabase();
    const profile = App.profile || await Auth.getProfile();
    if (!profile?.household_id) return;

    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const weekStart = sunday.toISOString().split('T')[0];

    const { data: plan } = await sb
      .from('weekly_plans')
      .select('*, weekly_plan_recipes(*, recipes(*, recipe_categories(category_id, categories(name)), recipe_ingredients(*)))')
      .eq('household_id', profile.household_id)
      .eq('week_start', weekStart)
      .single();

    this.currentPlan = plan;

    const container = document.getElementById('meals-list');
    const empty = document.getElementById('meals-empty');

    const clearBtn = document.getElementById('clear-week-btn');
    const refreshBtn = document.getElementById('refresh-week-btn');

    if (!plan || !plan.weekly_plan_recipes?.length) {
      container.innerHTML = '';
      container.appendChild(empty);
      empty.style.display = '';
      if (editBtn) editBtn.classList.add('hidden');
      if (clearBtn) clearBtn.classList.add('hidden');
      if (refreshBtn) refreshBtn.classList.add('hidden');
      return;
    }

    empty.style.display = 'none';
    if (editBtn) { editBtn.classList.remove('hidden'); editBtn.textContent = 'Edit'; }
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (refreshBtn) refreshBtn.classList.remove('hidden');
    this.renderMeals(plan);
  },

  renderMeals(plan) {
    const container = document.getElementById('meals-list');
    container.innerHTML = '';

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay(); // 0=Sun..6=Sat
    const recipes = plan.weekly_plan_recipes.sort((a, b) => (a.day_of_week ?? a.sort_order) - (b.day_of_week ?? b.sort_order));

    recipes.forEach((pr, i) => {
      const recipe = pr.recipes;
      if (!recipe) return;

      const isToday = (pr.day_of_week ?? i) === today;
      const isWide = i === 0 || i === 3;
      const card = document.createElement('article');
      card.className = `${isWide ? 'md:col-span-8' : 'md:col-span-4'} bg-cream-surface rounded-xl overflow-hidden floating-paper transition-all hover:-translate-y-1 group cursor-pointer relative ${isToday ? 'ring-2 ring-carrot-accent ring-offset-2 ring-offset-parchment-bg' : ''}`;

      const prepTime = recipe.prep_time || recipe.cook_time;
      const metaParts = [];
      if (prepTime) metaParts.push(`<span class="material-symbols-outlined text-sm">schedule</span><span class="text-xs font-semibold">${prepTime} min</span>`);
      if (recipe.servings) metaParts.push(`<span class="material-symbols-outlined text-sm">group</span><span class="text-xs font-semibold">${recipe.servings} servings</span>`);

      card.innerHTML = `
        ${this.editing ? `<button class="remove-meal-btn absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-berry-danger text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform" data-pr-id="${pr.id}"><span class="material-symbols-outlined text-lg">close</span></button>` : ''}
        <div class="relative ${isWide ? 'aspect-[16/9]' : 'aspect-[4/3]'} overflow-hidden">
          ${recipe.image_url
            ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="${escapeHtml(recipe.image_url)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full bg-surface-container-high flex items-center justify-center text-6xl\\'>🍽</div>'">`
            : `<div class="w-full h-full bg-surface-container-high flex items-center justify-center text-6xl">🍽</div>`
          }
        </div>
        <div class="p-4">
          <span class="text-xs font-bold ${isToday ? 'text-white bg-carrot-accent' : 'text-primary bg-herb-light'} uppercase tracking-widest px-2 py-0.5 rounded">${escapeHtml(days[(pr.day_of_week ?? i) % 7] || 'Meal ' + (i+1))}${isToday ? ' — TODAY' : ''}</span>
          <h3 class="font-display text-xl font-semibold text-kale-deep mt-2">${escapeHtml(recipe.title)}</h3>
          <div class="flex items-center gap-3 text-on-surface-variant mt-2">
            ${metaParts.map(p => `<div class="flex items-center gap-1">${p}</div>`).join('')}
          </div>
        </div>
      `;

      if (this.editing) {
        card.querySelector('.remove-meal-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeMeal(pr.id, card);
        });
      }

      card.addEventListener('click', (e) => {
        if (e.target.closest('.remove-meal-btn')) return;
        RecipeModal.open(recipe.id, false);
      });
      container.appendChild(card);
    });
  },

  toggleEdit() {
    this.editing = !this.editing;
    const editBtn = document.getElementById('edit-week-btn');
    if (editBtn) editBtn.textContent = this.editing ? 'Done' : 'Edit';
    if (this.currentPlan) this.renderMeals(this.currentPlan);
  },

  async refresh() {
    const btn = document.getElementById('refresh-week-btn');
    if (btn) { btn.textContent = '...'; btn.disabled = true; }
    App.profile = await Auth.getProfile();
    await this.load();
    if (btn) { btn.textContent = 'Refresh'; btn.disabled = false; }
    App.showToast('Week refreshed!', 'success');
  },

  async clearWeek() {
    if (!confirm('Clear all meals for this week?')) return;
    try {
      const sb = getSupabase();
      if (!this.currentPlan) return;
      await sb.from('weekly_plan_recipes').delete().eq('plan_id', this.currentPlan.id);
      await sb.from('shopping_list_items').delete().eq('plan_id', this.currentPlan.id);
      this.currentPlan = null;
      App.showToast('Week cleared!', 'success');
      await this.load();
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  async removeMeal(planRecipeId, cardEl) {
    try {
      const sb = getSupabase();
      await sb.from('weekly_plan_recipes').delete().eq('id', planRecipeId);
      // Remove from local data
      if (this.currentPlan) {
        this.currentPlan.weekly_plan_recipes = this.currentPlan.weekly_plan_recipes.filter(pr => pr.id !== planRecipeId);
      }
      cardEl.style.transform = 'scale(0.9)';
      cardEl.style.opacity = '0';
      setTimeout(() => {
        cardEl.remove();
        if (!this.currentPlan?.weekly_plan_recipes?.length) this.load();
      }, 200);
      App.showToast('Meal removed', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  }
};

// ============================================================
// My Recipes Page
// ============================================================

const MyRecipes = {
  async load() {
    await Recipes.loadCategories();
    const filters = document.getElementById('myrecipes-filters');
    const listContainer = document.getElementById('myrecipes-list');

    Recipes.renderCategoryFilters(filters, async (catId) => {
      const recipes = await Recipes.loadRecipes(catId);
      this.render(listContainer, recipes);
    });

    const recipes = await Recipes.loadRecipes();
    this.render(listContainer, recipes);
  },

  render(container, recipes) {
    container.innerHTML = '';
    if (!recipes.length) {
      container.innerHTML = '<div class="text-center py-8 text-on-surface-variant"><p class="text-sm">No recipes yet. Add some!</p></div>';
      return;
    }
    recipes.forEach(r => container.appendChild(Recipes.renderCard(r, { showDelete: true })));
  }
};

// ============================================================
// Recipes Page (Browse All)
// ============================================================

const RecipesPage = {
  async load() {
    await Recipes.loadCategories();
    const container = document.getElementById('all-recipes-list');
    const filters = document.getElementById('all-category-filters');

    Recipes.renderCategoryFilters(filters, async (catId) => {
      const recipes = await Recipes.loadRecipes(catId);
      this.render(container, recipes);
    });

    const recipes = await Recipes.loadRecipes();
    this.render(container, recipes);
  },

  render(container, recipes) {
    container.innerHTML = '';
    if (!recipes.length) {
      container.innerHTML = '<div class="empty-state"><p>No recipes yet. Add some!</p></div>';
      return;
    }
    recipes.forEach(r => container.appendChild(Recipes.renderCard(r, { showDelete: true })));
  }
};

// ============================================================
// Grocery List Page
// ============================================================

const GroceryList = {
  items: [],    // { name, quantity, unit, have }
  planId: null,

  async load() {
    const sb = getSupabase();
    const profile = App.profile || await Auth.getProfile();
    if (!profile?.household_id) return;

    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - now.getDay());
    const weekStart = sunday.toISOString().split('T')[0];

    const { data: plan } = await sb
      .from('weekly_plans')
      .select('*, weekly_plan_recipes(*, recipes(*, recipe_ingredients(*)))')
      .eq('household_id', profile.household_id)
      .eq('week_start', weekStart)
      .single();

    const container = document.getElementById('grocery-list-content');

    if (!plan || !plan.weekly_plan_recipes?.length) {
      container.innerHTML = `<div class="text-center py-16 text-on-surface-variant">
        <span class="material-symbols-outlined text-6xl opacity-30 mb-4 block">shopping_cart</span>
        <p class="text-base mb-4">No ingredients yet. Plan some meals first!</p>
        <button class="btn-animate bg-carrot-accent text-white font-semibold text-sm py-3 px-6 rounded-full shadow-lg active:scale-95 transition-transform" onclick="triggerSweep(this); App.navigate('plan')">Start Planning</button>
      </div>`;
      return;
    }

    this.planId = plan.id;

    // Aggregate all ingredients from the week's recipes
    const merged = {};
    plan.weekly_plan_recipes.forEach(pr => {
      const recipe = pr.recipes;
      if (!recipe) return;
      (recipe.recipe_ingredients || []).forEach(ing => {
        const key = ing.name.toLowerCase().trim();
        if (merged[key]) {
          if (merged[key].unit === ing.unit && merged[key].quantity && ing.quantity) {
            merged[key].quantity += parseFloat(ing.quantity);
          }
        } else {
          merged[key] = {
            name: ing.name,
            quantity: ing.quantity ? parseFloat(ing.quantity) : null,
            unit: ing.unit,
            have: false
          };
        }
      });
    });

    this.items = Object.values(merged);

    // Load saved "have" state from shopping_list_items
    const { data: savedItems } = await sb
      .from('shopping_list_items')
      .select('ingredient_name, already_have')
      .eq('plan_id', plan.id);

    if (savedItems) {
      const haveSet = new Set(savedItems.filter(i => i.already_have).map(i => i.ingredient_name.toLowerCase().trim()));
      this.items.forEach(item => {
        if (haveSet.has(item.name.toLowerCase().trim())) item.have = true;
      });

      // Add manual items (in DB but not from recipes)
      const recipeKeys = new Set(this.items.map(i => i.name.toLowerCase().trim()));
      savedItems.forEach(si => {
        const key = si.ingredient_name.toLowerCase().trim();
        if (!recipeKeys.has(key)) {
          this.items.push({
            name: si.ingredient_name,
            quantity: null,
            unit: null,
            have: si.already_have,
            manual: true
          });
        }
      });
    }

    this.render();
  },

  render() {
    const container = document.getElementById('grocery-list-content');
    const need = this.items.filter(i => !i.have);
    const have = this.items.filter(i => i.have);

    let html = '';

    // Need section
    html += `<div class="mb-6">
      <h3 class="text-xs font-bold text-kale-deep uppercase tracking-wider mb-3">Need (${need.length})</h3>`;
    if (need.length) {
      html += `<div class="bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5 space-y-1">`;
      need.forEach((item, i) => {
        const id = `grocery-need-${i}`;
        html += `
          <div class="relative">
            <input type="checkbox" class="pantry-check hidden" id="${id}">
            <label for="${id}" class="flex items-center gap-4 p-3 rounded-lg bg-parchment-bg hover:bg-herb-light/30 transition-all cursor-pointer">
              <div class="circle-box w-6 h-6 rounded-full border-2 border-outline flex items-center justify-center transition-colors flex-shrink-0">
                <span class="material-symbols-outlined check-icon text-white text-[16px] opacity-0 scale-50 transition-all">check</span>
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-base text-on-surface ingredient-name">${escapeHtml(item.name)}</span>
                <span class="text-xs text-on-surface-variant italic">${formatQuantity(item.quantity)} ${item.unit || ''}</span>
              </div>
            </label>
          </div>`;
      });
      html += `</div>`;
    } else {
      html += `<p class="text-sm text-on-surface-variant text-center py-4">All done! Everything checked off.</p>`;
    }
    html += `</div>`;

    // Have section
    html += `<div>
      <h3 class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Have (${have.length})</h3>`;
    if (have.length) {
      html += `<div class="bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5 space-y-1 opacity-60">`;
      have.forEach((item, i) => {
        const id = `grocery-have-${i}`;
        html += `
          <div class="relative">
            <input type="checkbox" class="pantry-check hidden" id="${id}" checked>
            <label for="${id}" class="flex items-center gap-4 p-3 rounded-lg bg-parchment-bg hover:bg-herb-light/30 transition-all cursor-pointer">
              <div class="circle-box w-6 h-6 rounded-full border-2 border-outline flex items-center justify-center transition-colors flex-shrink-0">
                <span class="material-symbols-outlined check-icon text-white text-[16px] opacity-0 scale-50 transition-all">check</span>
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-base text-on-surface ingredient-name">${escapeHtml(item.name)}</span>
                <span class="text-xs text-on-surface-variant italic">${formatQuantity(item.quantity)} ${item.unit || ''}</span>
              </div>
            </label>
          </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;

    container.innerHTML = html;

    // Attach event listeners for need items (with cross-off animation)
    need.forEach((item, i) => {
      const cb = document.getElementById(`grocery-need-${i}`);
      cb?.addEventListener('change', () => {
        // Show strikethrough on ingredient name briefly before moving to Have
        const label = cb.nextElementSibling;
        if (label) {
          label.style.opacity = '0.45';
          label.style.transition = 'opacity 0.15s';
          const nameSpan = label.querySelector('.ingredient-name');
          if (nameSpan) nameSpan.style.textDecoration = 'line-through';
        }
        item.have = true;
        this.saveItemState(item);
        setTimeout(() => this.render(), 200);
      });
    });

    // Attach event listeners for have items (uncheck = move back to need)
    have.forEach((item, i) => {
      const cb = document.getElementById(`grocery-have-${i}`);
      cb?.addEventListener('change', () => {
        item.have = false;
        this.saveItemState(item);
        this.render();
      });
    });
  },

  async saveItemState(item) {
    if (!this.planId) return;
    try {
      const sb = getSupabase();
      // Upsert shopping_list_items
      const { data: existing } = await sb
        .from('shopping_list_items')
        .select('id')
        .eq('plan_id', this.planId)
        .ilike('ingredient_name', item.name)
        .maybeSingle();

      if (existing) {
        await sb.from('shopping_list_items')
          .update({ already_have: item.have })
          .eq('id', existing.id);
      } else {
        await sb.from('shopping_list_items').insert({
          plan_id: this.planId,
          ingredient_name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          already_have: item.have
        });
      }
    } catch {
      // Best-effort save
    }
  },

  showAddItem() {
    const panel = document.getElementById('grocery-add-item');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) {
      document.getElementById('grocery-manual-name').focus();
    }
  },

  async addManualItem() {
    const nameInput = document.getElementById('grocery-manual-name');
    const name = nameInput.value.trim();
    if (!name) return;

    const item = { name, quantity: null, unit: null, have: false, manual: true };
    this.items.push(item);
    await this.saveItemState(item);
    nameInput.value = '';
    this.render();
    App.showToast('Item added!', 'success');
  },

  async refresh() {
    App.showToast('Refreshing...', 'info');
    await this.load();
    App.showToast('Grocery list refreshed!', 'success');
  }
};

// ============================================================
// Settings Page
// ============================================================

const Settings = {
  async load() {
    const profile = App.profile || await Auth.getProfile();
    if (!profile) return;

    document.getElementById('settings-email').textContent = profile.email;
    document.getElementById('settings-display-name').textContent =
      profile.display_name || profile.email?.split('@')[0] || 'User';
    document.getElementById('settings-household').textContent =
      profile.households?.name || 'No household';
    // Load subscription status
    Subscription.load();
    // Show admin link if admin
    this._checkAdmin();
    // Avatar
    const avatarImg = document.getElementById('settings-avatar');
    const avatarPlaceholder = document.getElementById('settings-avatar-placeholder');
    if (profile.avatar_url) {
      avatarImg.src = profile.avatar_url;
      avatarImg.classList.remove('hidden');
      avatarPlaceholder.style.display = 'none';
    } else {
      avatarImg.classList.add('hidden');
      avatarPlaceholder.style.display = '';
    }

    // Visibility toggle
    this.updateVisibilityUI(profile.is_public);

    // Check Kroger connection status + load selected store
    this.checkKrogerStatus();
    this.loadSelectedStore();

    // Handle OAuth redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('kroger_connected') === 'true') {
      App.showToast("Smith's account connected!", 'success');
      window.history.replaceState({}, '', '/');
      this.checkKrogerStatus();
    } else if (params.get('kroger_error')) {
      App.showToast("Could not connect Smith's: " + params.get('kroger_error'), 'error');
      window.history.replaceState({}, '', '/');
    }
  },

  async checkKrogerStatus() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/kroger-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token })
      });

      const statusText = document.getElementById('kroger-status-text');
      const connectLabel = document.getElementById('kroger-connect-label');

      if (res.ok) {
        statusText.textContent = 'Connected';
        statusText.classList.add('text-primary');
        connectLabel.textContent = 'Reconnect Account';
      } else {
        statusText.textContent = 'Not connected';
        statusText.classList.remove('text-primary');
        connectLabel.textContent = "Connect Smith's Account";
      }
    } catch {
      // Silently fail status check
    }
  },

  async connectKroger() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        App.showToast('Please sign in first', 'error');
        return;
      }
      // Redirect to Kroger OAuth, passing Supabase token as state
      window.location.href = `/api/kroger-auth?state=${encodeURIComponent(session.access_token)}`;
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  editHouseholdName() {
    const display = document.getElementById('household-name-display');
    const edit = document.getElementById('household-name-edit');
    const input = document.getElementById('household-name-input');
    input.value = App.profile?.households?.name || '';
    display.classList.add('hidden');
    edit.classList.remove('hidden');
    edit.classList.add('flex');
    input.focus();
  },

  cancelEditHouseholdName() {
    document.getElementById('household-name-display').classList.remove('hidden');
    const edit = document.getElementById('household-name-edit');
    edit.classList.add('hidden');
    edit.classList.remove('flex');
  },

  async saveHouseholdName() {
    const name = document.getElementById('household-name-input').value.trim();
    if (!name) return;
    try {
      const sb = getSupabase();
      const profile = App.profile || await Auth.getProfile();
      if (!profile?.household_id) throw new Error('No household');
      const { error } = await sb.from('households').update({ name }).eq('id', profile.household_id);
      if (error) throw error;
      App.profile = await Auth.getProfile();
      document.getElementById('settings-household').textContent = name;
      this.cancelEditHouseholdName();
      App.showToast('Household name updated!', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  loadSelectedStore() {
    const storeText = document.getElementById('selected-store-text');
    const searchForm = document.getElementById('store-search-form');
    const changeBtn = document.getElementById('store-change-btn');
    const savedName = localStorage.getItem('kroger_store_name');
    if (savedName) {
      storeText.textContent = savedName;
      searchForm.classList.add('hidden');
      changeBtn.classList.remove('hidden');
    } else {
      storeText.textContent = 'No store selected';
      searchForm.classList.remove('hidden');
      changeBtn.classList.add('hidden');
    }
  },

  showStoreSearch() {
    document.getElementById('store-search-form').classList.remove('hidden');
    document.getElementById('store-change-btn').classList.add('hidden');
    document.getElementById('store-zip-input').focus();
  },

  async searchStores() {
    const zip = document.getElementById('store-zip-input').value.trim();
    if (!zip || zip.length < 5) {
      App.showToast('Enter a 5-digit zip code', 'info');
      return;
    }

    const resultsEl = document.getElementById('store-results');
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-2">Searching...</p>';

    try {
      const res = await fetch(`/api/kroger-locations?zip=${encodeURIComponent(zip)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.locations?.length) {
        resultsEl.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-2">No stores found near that zip code.</p>';
        return;
      }

      resultsEl.innerHTML = data.locations.map(loc => `
        <button class="w-full text-left bg-parchment-bg rounded-lg p-3 hover:bg-herb-light/30 transition-colors active:scale-[0.98]" onclick="Settings.selectStore('${escapeHtml(loc.locationId)}', this)">
          <p class="text-sm font-semibold text-kale-deep">${escapeHtml(loc.name || "Smith's")}</p>
          <p class="text-xs text-on-surface-variant">${escapeHtml(loc.address || '')}${loc.city ? ', ' + escapeHtml(loc.city) : ''}${loc.state ? ' ' + escapeHtml(loc.state) : ''} ${escapeHtml(loc.zipCode || '')}</p>
        </button>
      `).join('');
    } catch (err) {
      resultsEl.innerHTML = `<p class="text-sm text-berry-danger text-center py-2">Error: ${escapeHtml(err.message)}</p>`;
    }
  },

  selectStore(locationId, btn) {
    const storeName = btn.querySelector('.text-kale-deep').textContent + ' \u2014 ' + btn.querySelector('.text-on-surface-variant').textContent;
    localStorage.setItem('kroger_location_id', locationId);
    localStorage.setItem('kroger_store_name', storeName);
    document.getElementById('selected-store-text').textContent = storeName;
    document.getElementById('store-results').classList.add('hidden');
    document.getElementById('store-search-form').classList.add('hidden');
    document.getElementById('store-change-btn').classList.remove('hidden');
    App.showToast('Store selected!', 'success');
  },

  changeAvatar() {
    document.getElementById('avatar-input').click();
  },

  async handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;

      const { error: upErr } = await sb.storage.from('recipe-images').upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = sb.storage.from('recipe-images').getPublicUrl(path);
      const avatarUrl = publicUrl + '?t=' + Date.now();

      await sb.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      App.profile = await Auth.getProfile();

      document.getElementById('settings-avatar').src = avatarUrl;
      document.getElementById('settings-avatar').classList.remove('hidden');
      document.getElementById('settings-avatar-placeholder').style.display = 'none';
      App.showToast('Profile picture updated!', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
    event.target.value = '';
  },

  updateVisibilityUI(isPublic) {
    const track = document.getElementById('visibility-track');
    const thumb = document.getElementById('visibility-thumb');
    const status = document.getElementById('visibility-status');
    if (isPublic) {
      track.classList.remove('bg-surface-container-high');
      track.classList.add('bg-primary');
      thumb.style.transform = 'translateX(20px)';
      status.textContent = 'Public — anyone can see your profile and recipes';
    } else {
      track.classList.remove('bg-primary');
      track.classList.add('bg-surface-container-high');
      thumb.style.transform = 'translateX(0)';
      status.textContent = 'Private — only your household can see your recipes';
    }
  },

  async toggleVisibility() {
    try {
      const sb = getSupabase();
      const profile = App.profile || await Auth.getProfile();
      const newValue = !profile.is_public;
      await sb.from('profiles').update({ is_public: newValue }).eq('id', profile.id);
      App.profile = await Auth.getProfile();
      this.updateVisibilityUI(newValue);
      App.showToast(newValue ? 'Profile set to public' : 'Profile set to private', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  async joinHousehold() {
    const code = document.getElementById('join-code').value.trim();
    if (!code) return;

    try {
      const sb = getSupabase();
      const { data: household, error } = await sb
        .from('households')
        .select('id')
        .eq('invite_code', code)
        .single();

      if (error || !household) throw new Error('Invalid invite code');

      const { data: { user } } = await sb.auth.getUser();
      await sb.from('profiles').update({ household_id: household.id }).eq('id', user.id);

      App.profile = await Auth.getProfile();
      App.showToast('Joined household!', 'success');
      this.load();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async _checkAdmin() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, action: 'dashboard' })
      });
      if (res.ok) {
        document.getElementById('admin-link')?.classList.remove('hidden');
      }
    } catch { /* not admin */ }
  },

  _feedbackType: 'bug',

  setFeedbackType(type) {
    this._feedbackType = type;
    const bugBtn = document.getElementById('feedback-type-bug');
    const featureBtn = document.getElementById('feedback-type-feature');
    if (type === 'bug') {
      bugBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-primary text-white transition-all';
      featureBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-surface-container-high text-kale-deep transition-all';
    } else {
      featureBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-primary text-white transition-all';
      bugBtn.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-surface-container-high text-kale-deep transition-all';
    }
  },

  async submitFeedback() {
    const text = document.getElementById('feedback-text').value.trim();
    if (!text) {
      App.showToast('Please enter your feedback', 'info');
      return;
    }
    try {
      const sb = getSupabase();
      const { error } = await sb.from('feedback').insert({
        type: this._feedbackType,
        message: text
      });
      if (error) throw error;
      document.getElementById('feedback-text').value = '';
      App.showToast('Thanks for your feedback!', 'success');
    } catch (err) {
      App.showToast('Failed to send: ' + err.message, 'error');
    }
  }
};

// ============================================================
// Subscription - Freemium management
// ============================================================
const Subscription = {
  status: null,

  async load() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/subscription-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token })
      });
      const data = await res.json();
      if (data.error) return;

      this.status = data;
      this.renderSettings(data);
    } catch { /* silent */ }
  },

  renderSettings(data) {
    const planLabel = document.getElementById('sub-plan-label');
    const statusText = document.getElementById('sub-status-text');
    const icon = document.getElementById('sub-icon');
    const upgradeBtn = document.getElementById('sub-upgrade-btn');
    const usageBars = document.getElementById('sub-usage-bars');

    if (data.plan === 'premium') {
      planLabel.textContent = 'Premium Plan';
      statusText.textContent = data.expiresAt ? `Active until ${new Date(data.expiresAt).toLocaleDateString()}` : 'Active subscription';
      icon.textContent = 'workspace_premium';
      icon.classList.add('text-carrot-accent');
      upgradeBtn.classList.add('hidden');
      usageBars.classList.add('hidden');
    } else {
      planLabel.textContent = 'Free Plan';
      statusText.textContent = `${data.recipeCount}/20 recipes, ${data.aiQueriesUsed}/20 AI queries`;

      // Recipe bar
      const recipePct = Math.min((data.recipeCount / 20) * 100, 100);
      document.getElementById('sub-recipe-count').textContent = `${data.recipeCount} / 20`;
      document.getElementById('sub-recipe-bar').style.width = `${recipePct}%`;
      if (recipePct >= 90) document.getElementById('sub-recipe-bar').classList.add('bg-red-500');

      // AI bar
      const aiPct = Math.min((data.aiQueriesUsed / 20) * 100, 100);
      document.getElementById('sub-ai-count').textContent = `${data.aiQueriesUsed} / 20`;
      document.getElementById('sub-ai-bar').style.width = `${aiPct}%`;
      if (aiPct >= 90) document.getElementById('sub-ai-bar').classList.add('bg-red-500');

      upgradeBtn.classList.remove('hidden');
      usageBars.classList.remove('hidden');
    }
  },

  canAddRecipe() {
    if (!this.status || this.status.plan === 'premium') return true;
    return this.status.recipeCount < 20;
  },

  async applyDiscount() {
    const code = document.getElementById('discount-code-input').value.trim();
    if (!code) return;
    const statusEl = document.getElementById('discount-status');
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, discountCode: code })
      });
      const data = await res.json();
      if (data.error) {
        statusEl.textContent = data.error;
        statusEl.className = 'text-xs text-red-500';
        statusEl.classList.remove('hidden');
        return;
      }
      if (data.free) {
        statusEl.textContent = data.message;
        statusEl.className = 'text-xs text-primary font-semibold';
        statusEl.classList.remove('hidden');
        document.getElementById('upgrade-modal').classList.add('hidden');
        App.showToast(data.message, 'success');
        this.load();
        return;
      }
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err) {
      statusEl.textContent = 'Error applying code';
      statusEl.className = 'text-xs text-red-500';
      statusEl.classList.remove('hidden');
    }
  },

  async checkout() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      const code = document.getElementById('discount-code-input').value.trim();
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, discountCode: code || undefined })
      });
      const data = await res.json();
      if (data.error) {
        App.showToast(data.error, 'error');
        return;
      }
      if (data.free) {
        document.getElementById('upgrade-modal').classList.add('hidden');
        App.showToast(data.message, 'success');
        this.load();
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      App.showToast('Payment error: ' + err.message, 'error');
    }
  }
};

// ============================================================
// Tutorial - First-time onboarding
// ============================================================
const Tutorial = {
  steps: [
    { icon: 'restaurant_menu', title: 'Welcome to GRUNDOW!', desc: 'Let\'s take a quick tour of your new meal planning app.', page: null },
    { icon: 'calendar_month', title: 'This Week', desc: 'See your planned meals for the week at a glance. Tap any day to see what\'s cooking.', page: 'meals' },
    { icon: 'menu_book', title: 'My Recipes', desc: 'Store and organize all your recipes in one place. Add tags, scale servings, and pair recipes together.', page: 'myrecipes' },
    { icon: 'auto_awesome', title: 'Plan with AI', desc: 'Let AI suggest recipes based on your mood, ingredients, or dietary needs. Import from photos or URLs too!', page: 'plan' },
    { icon: 'shopping_cart', title: 'Grocery List', desc: 'Your shopping list is auto-generated from your meal plan. Connect Smith\'s to add items directly to your cart.', page: 'grocery' },
    { icon: 'groups', title: 'Social', desc: 'Discover recipes from other users, like your favorites, and save them to your collection.', page: 'social' }
  ],
  currentStep: 0,

  start() {
    if (localStorage.getItem('tutorial_completed')) return;
    this.currentStep = 0;
    this.render();
    document.getElementById('tutorial-overlay').classList.remove('hidden');
  },

  render() {
    const step = this.steps[this.currentStep];
    document.getElementById('tutorial-icon').textContent = step.icon;
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-desc').textContent = step.desc;
    document.getElementById('tutorial-step-label').textContent = `Step ${this.currentStep + 1} of ${this.steps.length}`;
    document.getElementById('tutorial-next-btn').textContent = this.currentStep === this.steps.length - 1 ? 'Get Started!' : 'Next';

    // Render dots
    const dots = document.getElementById('tutorial-dots');
    dots.innerHTML = this.steps.map((_, i) =>
      `<div class="w-2 h-2 rounded-full ${i === this.currentStep ? 'bg-primary' : 'bg-kale-deep/20'} transition-colors"></div>`
    ).join('');

    // Navigate to the relevant page if specified
    if (step.page) App.navigate(step.page);
  },

  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.complete();
    } else {
      this.render();
    }
  },

  skip() {
    this.complete();
  },

  complete() {
    localStorage.setItem('tutorial_completed', 'true');
    document.getElementById('tutorial-overlay').classList.add('hidden');
    App.navigate('meals');
  }
};

// ============================================================
// Admin Dashboard
// ============================================================
const Admin = {
  async load() {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, action: 'dashboard' })
      });
      const data = await res.json();
      if (data.error) return;

      document.getElementById('admin-users').textContent = data.userCount;
      document.getElementById('admin-premium').textContent = data.premiumCount;
      document.getElementById('admin-recipes').textContent = data.recipeCount;

      this.renderCodes(data.discountCodes);
      this.renderFeedback(data.feedback);
    } catch (err) {
      App.showToast('Admin load error: ' + err.message, 'error');
    }
  },

  renderCodes(codes) {
    const list = document.getElementById('admin-codes-list');
    if (!codes.length) { list.innerHTML = '<p class="text-sm text-on-surface-variant">No discount codes yet.</p>'; return; }
    list.innerHTML = codes.map(c => `
      <div class="flex items-center justify-between bg-white rounded-lg p-2 border border-kale-deep/5">
        <div>
          <span class="font-mono font-bold text-sm text-kale-deep">${escapeHtml(c.code)}</span>
          <span class="text-xs text-on-surface-variant ml-2">${c.discount_percent}% off, ${c.duration_months}mo</span>
          <span class="text-xs text-on-surface-variant ml-1">(${c.current_uses}${c.max_uses ? '/' + c.max_uses : ''} used)</span>
        </div>
        <button class="text-xs font-semibold px-2 py-1 rounded ${c.active ? 'text-red-500' : 'text-primary'}" onclick="Admin.toggleCode('${c.id}', ${!c.active})">
          ${c.active ? 'Disable' : 'Enable'}
        </button>
      </div>
    `).join('');
  },

  renderFeedback(items) {
    const list = document.getElementById('admin-feedback-list');
    if (!items.length) { list.innerHTML = '<p class="text-sm text-on-surface-variant">No feedback yet.</p>'; return; }
    list.innerHTML = items.map(f => {
      const statusColors = { new: 'bg-carrot-accent', reviewed: 'bg-primary', resolved: 'bg-kale-deep/40' };
      return `
        <div class="bg-white rounded-lg p-3 border border-kale-deep/5">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${statusColors[f.status] || 'bg-gray-400'}">${f.status}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${f.type === 'bug' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}">${f.type}</span>
            <span class="text-xs text-on-surface-variant">${f.profiles?.email || 'Unknown'}</span>
            <span class="text-xs text-on-surface-variant ml-auto">${new Date(f.created_at).toLocaleDateString()}</span>
          </div>
          <p class="text-sm text-kale-deep">${escapeHtml(f.message)}</p>
          <div class="flex gap-1 mt-2">
            <button class="text-[10px] font-semibold px-2 py-1 rounded bg-herb-light text-primary" onclick="Admin.updateFeedback('${f.id}', 'reviewed')">Mark Reviewed</button>
            <button class="text-[10px] font-semibold px-2 py-1 rounded bg-herb-light text-primary" onclick="Admin.updateFeedback('${f.id}', 'resolved')">Resolve</button>
          </div>
        </div>`;
    }).join('');
  },

  async createCode() {
    const code = document.getElementById('new-code-input').value.trim();
    const months = parseInt(document.getElementById('new-code-months').value) || 1;
    const maxUses = document.getElementById('new-code-uses').value ? parseInt(document.getElementById('new-code-uses').value) : null;
    if (!code) { App.showToast('Enter a code', 'info'); return; }

    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabaseToken: session.access_token,
          action: 'create-discount',
          data: { code, discountPercent: 100, durationMonths: months, maxUses }
        })
      });
      document.getElementById('new-code-input').value = '';
      App.showToast('Code created!', 'success');
      this.load();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async toggleCode(codeId, active) {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, action: 'toggle-discount', data: { codeId, active } })
      });
      this.load();
    } catch (err) { App.showToast(err.message, 'error'); }
  },

  async updateFeedback(feedbackId, status) {
    try {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseToken: session.access_token, action: 'update-feedback', data: { feedbackId, status } })
      });
      this.load();
    } catch (err) { App.showToast(err.message, 'error'); }
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
