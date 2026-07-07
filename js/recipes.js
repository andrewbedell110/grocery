// ============================================================
// Recipes Module - CRUD for saved recipes
// ============================================================

const Recipes = {
  cache: [],
  categories: [],

  async loadCategories() {
    if (this.categories.length) return this.categories;
    const sb = getSupabase();
    const { data } = await sb.from('categories').select('*').order('sort_order');
    this.categories = data || [];
    return this.categories;
  },

  async loadRecipes(categoryId = null) {
    const sb = getSupabase();
    const profile = await Auth.getProfile();
    if (!profile?.household_id) return [];

    let query = sb
      .from('recipes')
      .select('*, recipe_categories(category_id), recipe_ingredients(*)')
      .eq('household_id', profile.household_id)
      .order('created_at', { ascending: false });

    const { data } = await query;
    this.cache = data || [];

    if (categoryId) {
      return this.cache.filter(r =>
        r.recipe_categories.some(rc => rc.category_id === categoryId)
      );
    }
    return this.cache;
  },

  async getRecipe(id) {
    const sb = getSupabase();
    const { data } = await sb
      .from('recipes')
      .select('*, recipe_categories(category_id, categories(name)), recipe_ingredients(*)')
      .eq('id', id)
      .single();

    // Load pairings (both directions)
    if (data) {
      const { data: pairings1 } = await sb
        .from('recipe_pairings')
        .select('paired_recipe_id, paired:recipes!recipe_pairings_paired_recipe_id_fkey(id, title)')
        .eq('recipe_id', id);
      const { data: pairings2 } = await sb
        .from('recipe_pairings')
        .select('recipe_id, recipe:recipes!recipe_pairings_recipe_id_fkey(id, title)')
        .eq('paired_recipe_id', id);

      const paired = [];
      (pairings1 || []).forEach(p => { if (p.paired) paired.push(p.paired); });
      (pairings2 || []).forEach(p => { if (p.recipe) paired.push(p.recipe); });
      data.paired_recipes = paired;
    }
    return data;
  },

  async saveRecipe({ title, instructions, image_url, servings, ingredients, categoryIds }) {
    const sb = getSupabase();
    const profile = await Auth.getProfile();
    if (!profile?.household_id) throw new Error('No household');

    const { data: recipe, error } = await sb
      .from('recipes')
      .insert({
        household_id: profile.household_id,
        title,
        instructions,
        image_url: image_url || null,
        servings: servings || 4,
        created_by: profile.id
      })
      .select()
      .single();

    if (error) throw error;

    // Insert categories
    if (categoryIds?.length) {
      await sb.from('recipe_categories').insert(
        categoryIds.map(cid => ({ recipe_id: recipe.id, category_id: cid }))
      );
    }

    // Insert ingredients
    if (ingredients?.length) {
      await sb.from('recipe_ingredients').insert(
        ingredients.map((ing, i) => ({
          recipe_id: recipe.id,
          name: ing.name,
          quantity: ing.quantity || null,
          unit: ing.unit || null,
          notes: ing.notes || null,
          sort_order: i
        }))
      );
    }

    return recipe;
  },

  async deleteRecipe(id) {
    const sb = getSupabase();
    await sb.from('recipes').delete().eq('id', id);
  },

  parseIngredientLine(line) {
    line = line.trim();
    if (!line) return null;

    // Try to parse "2 cups flour" or "1/2 lb chicken" or "3 tbsp soy sauce"
    const match = line.match(/^([\d./]+)?\s*(cups?|tbsp|tsp|oz|lb|lbs|g|kg|ml|l|cloves?|cans?|bunch|pinch|dash|slices?|pieces?|stalks?|heads?)?\s*(.+)/i);
    if (match) {
      let qty = match[1];
      if (qty && qty.includes('/')) {
        const parts = qty.split('/');
        qty = parseFloat(parts[0]) / parseFloat(parts[1]);
      } else if (qty) {
        qty = parseFloat(qty);
      }
      return {
        quantity: qty || null,
        unit: match[2]?.toLowerCase() || null,
        name: match[3]?.trim() || line
      };
    }
    return { quantity: null, unit: null, name: line };
  },

  // Render recipe cards
  renderCard(recipe, options = {}) {
    const { showAdd = false, showDelete = false } = options;
    const cats = recipe.recipe_categories || [];
    const catNames = cats
      .map(rc => rc.categories?.name || this.categories.find(c => c.id === rc.category_id)?.name)
      .filter(Boolean);

    const imgSrc = recipe.image_url || '';

    const div = document.createElement('div');
    div.className = 'bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5 flex gap-3 cursor-pointer group hover:shadow-[0_8px_32px_rgba(45,106,79,0.1)] transition-all active:scale-[0.98]';
    div.innerHTML = `
      ${imgSrc
        ? `<img class="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-surface-container-high" src="${escapeHtml(imgSrc)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-high flex items-center justify-center text-2xl\\'>🍽</div>'">`
        : `<div class="w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-high flex items-center justify-center text-2xl">🍽</div>`
      }
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start">
          <h4 class="font-semibold text-kale-deep truncate">${escapeHtml(recipe.title)}</h4>
          ${showDelete ? `<button class="delete-btn flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-berry-danger/10 hover:text-berry-danger transition-colors" title="Delete recipe"><span class="material-symbols-outlined text-lg">delete</span></button>` : ''}
        </div>
        <p class="text-xs text-on-surface-variant">${recipe.servings ? recipe.servings + ' servings' : ''}</p>
        <div class="flex flex-wrap gap-1 mt-2">
          ${catNames.map(n => `<span class="bg-herb-light text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">${escapeHtml(n)}</span>`).join('')}
        </div>
      </div>
    `;
    div.addEventListener('click', (e) => {
      if (e.target.closest('.delete-btn')) return;
      RecipeModal.open(recipe.id, showAdd);
    });
    if (showDelete) {
      div.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${recipe.title}"?`)) {
          await Recipes.deleteRecipe(recipe.id);
          div.remove();
          App.showToast('Recipe deleted', 'success');
        }
      });
    }
    return div;
  },

  renderCategoryFilters(container, onFilter) {
    container.innerHTML = '';
    const base = 'cat-filter-btn px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all';
    const active = 'bg-primary text-white';
    const inactive = 'bg-herb-light text-primary';

    // Search icon
    const searchWrap = document.createElement('div');
    searchWrap.className = 'tag-search-wrap collapsed';
    searchWrap.innerHTML = `
      <span class="material-symbols-outlined tag-search-icon text-primary text-xl p-1">search</span>
      <input type="text" class="tag-search-input bg-white border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Search tags...">
    `;
    const searchIcon = searchWrap.querySelector('.tag-search-icon');
    const searchInput = searchWrap.querySelector('.tag-search-input');

    searchIcon.addEventListener('click', () => {
      const isExpanded = searchWrap.classList.contains('expanded');
      if (isExpanded) {
        searchWrap.classList.remove('expanded');
        searchWrap.classList.add('collapsed');
        searchInput.value = '';
        // Show all cat buttons
        container.querySelectorAll('.cat-filter-btn').forEach(b => b.style.display = '');
      } else {
        searchWrap.classList.remove('collapsed');
        searchWrap.classList.add('expanded');
        setTimeout(() => searchInput.focus(), 200);
      }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      container.querySelectorAll('.cat-filter-btn').forEach(b => {
        b.style.display = b.textContent.toLowerCase().includes(q) || b.textContent === 'All' ? '' : 'none';
      });
    });

    container.appendChild(searchWrap);

    const allBtn = document.createElement('button');
    allBtn.className = `${base} ${active}`;
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => {
      container.querySelectorAll('.cat-filter-btn').forEach(t => { t.className = `${base} ${inactive}`; });
      allBtn.className = `${base} ${active}`;
      onFilter(null);
    });
    container.appendChild(allBtn);

    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `${base} ${inactive}`;
      btn.textContent = cat.name;
      btn.addEventListener('click', () => {
        container.querySelectorAll('.cat-filter-btn').forEach(t => { t.className = `${base} ${inactive}`; });
        btn.className = `${base} ${active}`;
        onFilter(cat.id);
      });
      container.appendChild(btn);
    });
  },

  renderUploadCategories(container) {
    container.innerHTML = '';
    this.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'px-3 py-1.5 rounded-full text-xs font-bold bg-herb-light text-primary transition-all';
      btn.textContent = cat.name;
      btn.dataset.id = cat.id;
      btn.addEventListener('click', () => {
        btn.classList.toggle('bg-primary');
        btn.classList.toggle('text-white');
        btn.classList.toggle('bg-herb-light');
        btn.classList.toggle('text-primary');
        btn.classList.toggle('selected');
      });
      container.appendChild(btn);
    });
  }
};

// ============================================================
// Recipe Detail Modal
// ============================================================

const RecipeModal = {
  currentRecipe: null,
  showAddBtn: false,
  currentScale: 1,

  async open(recipeId, showAdd = false) {
    this.showAddBtn = showAdd;
    this.currentScale = 1;
    const recipe = await Recipes.getRecipe(recipeId);
    if (!recipe) return;
    this.currentRecipe = recipe;

    document.getElementById('modal-recipe-img').src = recipe.image_url || '';
    document.getElementById('modal-recipe-img').style.display = recipe.image_url ? '' : 'none';
    document.getElementById('modal-photo-label').textContent = recipe.image_url ? 'Change Photo' : 'Add Photo';
    document.getElementById('modal-tag-editor')?.classList.add('hidden');
    document.getElementById('modal-export-menu')?.classList.add('hidden');
    this._editing = false;
    // Show scale wrap again
    document.getElementById('modal-scale-wrap')?.classList.remove('hidden');
    // Reset scale buttons
    document.querySelectorAll('.scale-btn').forEach(btn => {
      if (parseInt(btn.dataset.scale) === 1) {
        btn.classList.remove('bg-herb-light', 'text-primary');
        btn.classList.add('bg-primary', 'text-white');
      } else {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-herb-light', 'text-primary');
      }
    });
    // Restore button states
    const editBtn = document.getElementById('modal-edit-btn');
    if (editBtn) {
      editBtn.textContent = 'Edit Recipe';
      editBtn.setAttribute('onclick', 'RecipeModal.openEditForm()');
      editBtn.classList.remove('bg-carrot-accent');
      editBtn.classList.add('bg-primary');
    }
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) {
      closeBtn.textContent = 'Close';
      closeBtn.setAttribute('onclick', 'RecipeModal.close()');
    }
    document.getElementById('modal-recipe-title').textContent = recipe.title;
    document.getElementById('modal-recipe-meta').textContent =
      [recipe.servings && `${recipe.servings} servings`, recipe.prep_time && `${recipe.prep_time} min prep`]
        .filter(Boolean).join(' · ');

    const tagsEl = document.getElementById('modal-recipe-tags');
    tagsEl.innerHTML = (recipe.recipe_categories || [])
      .map(rc => `<span class="bg-herb-light text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">${escapeHtml(rc.categories?.name || '')}</span>`)
      .join('');

    const ingEl = document.getElementById('modal-recipe-ingredients');
    ingEl.innerHTML = (recipe.recipe_ingredients || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => `<div class="py-2 border-b border-outline-variant/20 text-sm text-on-surface">
        ${formatQuantity(i.quantity)} ${i.unit || ''} ${escapeHtml(i.name)}
        ${i.notes ? `<span class="text-on-surface-variant">(${escapeHtml(i.notes)})</span>` : ''}
      </div>`)
      .join('');

    const instrText = recipe.instructions || 'No instructions provided.';
    const instrLines = instrText.split('\n').map(l => l.trim()).filter(Boolean);
    if (instrLines.length > 1) {
      document.getElementById('modal-recipe-instructions').innerHTML =
        '<div class="space-y-2">' + instrLines.map(line => `<p>${escapeHtml(line)}</p>`).join('') + '</div>';
    } else {
      document.getElementById('modal-recipe-instructions').innerHTML = escapeHtml(instrText);
    }

    // Render paired recipes
    const pairedSection = document.getElementById('modal-paired-recipes');
    const pairedList = document.getElementById('modal-paired-list');
    document.getElementById('modal-pair-picker')?.classList.add('hidden');

    if (recipe.paired_recipes?.length) {
      pairedSection.classList.remove('hidden');
      pairedList.innerHTML = recipe.paired_recipes.map(pr => `
        <div class="flex items-center justify-between bg-parchment-bg rounded-lg p-2">
          <button class="text-sm font-semibold text-primary hover:underline text-left flex-1" onclick="RecipeModal.open('${pr.id}', ${showAdd})">${escapeHtml(pr.title)}</button>
          <button class="w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant hover:text-berry-danger transition-colors" onclick="RecipeModal.unpair('${pr.id}')">
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      `).join('');
    } else {
      pairedSection.classList.add('hidden');
    }

    const addBtn = document.getElementById('modal-add-btn');
    addBtn.style.display = showAdd ? '' : 'none';

    document.getElementById('recipe-modal').classList.add('show');
  },

  close() {
    document.getElementById('recipe-modal').classList.remove('show');
    this.currentRecipe = null;
  },

  addToWeek() {
    if (this.currentRecipe) {
      Plan.selectRecipe(this.currentRecipe);
      this.close();
    }
  },

  triggerPhotoUpload() {
    document.getElementById('modal-photo-input').click();
  },

  async handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!this.currentRecipe) return;

    const label = document.getElementById('modal-photo-label');
    label.textContent = 'Uploading...';

    try {
      const sb = getSupabase();
      const ext = file.name.split('.').pop();
      const path = `recipe-photos/${this.currentRecipe.id}.${ext}`;

      const { error: uploadErr } = await sb.storage
        .from('recipe-images')
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = sb.storage
        .from('recipe-images')
        .getPublicUrl(path);

      // Add cache-busting param
      const imageUrl = publicUrl + '?t=' + Date.now();

      const { error: updateErr } = await sb.from('recipes')
        .update({ image_url: imageUrl })
        .eq('id', this.currentRecipe.id);

      if (updateErr) throw updateErr;

      document.getElementById('modal-recipe-img').src = imageUrl;
      document.getElementById('modal-recipe-img').style.display = '';
      label.textContent = 'Change Photo';
      App.showToast('Photo uploaded!', 'success');
      RecipeModal._refreshLists();
    } catch (err) {
      label.textContent = 'Add Photo';
      App.showToast('Photo upload failed: ' + err.message, 'error');
    }
    event.target.value = '';
  },

  async showTagEditor() {
    await Recipes.loadCategories();
    const editor = document.getElementById('modal-tag-editor');
    const options = document.getElementById('modal-tag-options');
    editor.classList.remove('hidden');

    const currentCatIds = (this.currentRecipe?.recipe_categories || []).map(rc => rc.category_id);

    options.innerHTML = Recipes.categories.map(cat => {
      const selected = currentCatIds.includes(cat.id);
      return `<button type="button" class="px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selected ? 'bg-primary text-white' : 'bg-herb-light text-primary'}" data-cat-id="${cat.id}" onclick="RecipeModal.toggleTag(this, '${cat.id}')">${escapeHtml(cat.name)}</button>`;
    }).join('');
  },

  async toggleTag(btn, categoryId) {
    if (!this.currentRecipe) return;
    const sb = getSupabase();
    const recipeId = this.currentRecipe.id;
    const isActive = btn.classList.contains('bg-primary');

    try {
      if (isActive) {
        await sb.from('recipe_categories').delete().eq('recipe_id', recipeId).eq('category_id', categoryId);
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-herb-light', 'text-primary');
      } else {
        await sb.from('recipe_categories').insert({ recipe_id: recipeId, category_id: categoryId });
        btn.classList.remove('bg-herb-light', 'text-primary');
        btn.classList.add('bg-primary', 'text-white');
      }
      // Refresh tags display
      const recipe = await Recipes.getRecipe(recipeId);
      this.currentRecipe = recipe;
      document.getElementById('modal-recipe-tags').innerHTML = (recipe.recipe_categories || [])
        .map(rc => `<span class="bg-herb-light text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">${escapeHtml(rc.categories?.name || '')}</span>`)
        .join('');
      App.showToast('Tags updated!', 'success');
      RecipeModal._refreshLists();
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  openEditForm() {
    if (!this.currentRecipe) return;
    this._editing = true;
    const r = this.currentRecipe;

    // Hide scale during edit
    document.getElementById('modal-scale-wrap')?.classList.add('hidden');

    // Replace title with input
    const titleEl = document.getElementById('modal-recipe-title');
    titleEl.innerHTML = `<input type="text" id="edit-recipe-title" value="${escapeHtml(r.title)}" class="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xl font-bold font-display text-kale-deep focus:outline-none focus:border-primary transition-colors">`;

    // Replace meta/servings with input
    const metaEl = document.getElementById('modal-recipe-meta');
    metaEl.innerHTML = `<span class="flex items-center gap-1"><span class="text-xs text-on-surface-variant">Servings:</span><input type="number" id="edit-recipe-servings" value="${r.servings || 4}" min="1" class="w-16 bg-white border border-outline-variant rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-primary transition-colors"></span>`;

    // Replace ingredients with editable rows
    const ingEl = document.getElementById('modal-recipe-ingredients');
    const ings = (r.recipe_ingredients || []).sort((a, b) => a.sort_order - b.sort_order);
    ingEl.innerHTML = `<div id="edit-ingredients-list" class="space-y-2">
      ${ings.map((ing, i) => `
        <div class="flex items-center gap-2 edit-ing-row">
          <input type="text" value="${ing.quantity || ''}" placeholder="Qty" class="w-14 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="quantity" data-idx="${i}">
          <input type="text" value="${escapeHtml(ing.unit || '')}" placeholder="Unit" class="w-16 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="unit" data-idx="${i}">
          <input type="text" value="${escapeHtml(ing.name)}" placeholder="Ingredient" class="flex-1 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="name" data-idx="${i}">
          <button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-berry-danger/10 hover:text-berry-danger transition-colors flex-shrink-0" onclick="RecipeModal.removeEditIngredient(this)"><span class="material-symbols-outlined text-lg">close</span></button>
        </div>
      `).join('')}
    </div>
    <button class="mt-2 text-sm font-semibold text-primary flex items-center gap-1 hover:text-kale-deep transition-colors" onclick="RecipeModal.addEditIngredient()">
      <span class="material-symbols-outlined text-base">add</span> Add ingredient
    </button>`;

    // Replace instructions with textarea
    const instrEl = document.getElementById('modal-recipe-instructions');
    instrEl.innerHTML = `<textarea id="edit-recipe-instructions" class="w-full bg-white border border-outline-variant rounded-lg p-3 text-sm h-40 focus:outline-none focus:border-primary transition-colors resize-none">${escapeHtml(r.instructions || '')}</textarea>`;

    // Swap buttons: Edit -> Save Changes, Close -> Cancel
    const editBtn = document.getElementById('modal-edit-btn');
    editBtn.textContent = 'Save Changes';
    editBtn.setAttribute('onclick', 'RecipeModal.saveEdit()');
    editBtn.classList.remove('bg-primary');
    editBtn.classList.add('bg-carrot-accent');

    // Change close button to cancel
    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn.textContent = 'Cancel';
    closeBtn.setAttribute('onclick', 'RecipeModal.cancelEdit()');
  },

  addEditIngredient() {
    const list = document.getElementById('edit-ingredients-list');
    if (!list) return;
    const idx = list.children.length;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 edit-ing-row';
    row.innerHTML = `
      <input type="text" value="" placeholder="Qty" class="w-14 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="quantity" data-idx="${idx}">
      <input type="text" value="" placeholder="Unit" class="w-16 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="unit" data-idx="${idx}">
      <input type="text" value="" placeholder="Ingredient" class="flex-1 bg-white border border-outline-variant rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-primary" data-field="name" data-idx="${idx}">
      <button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-berry-danger/10 hover:text-berry-danger transition-colors flex-shrink-0" onclick="RecipeModal.removeEditIngredient(this)"><span class="material-symbols-outlined text-lg">close</span></button>
    `;
    list.appendChild(row);
    row.querySelector('[data-field="name"]').focus();
  },

  removeEditIngredient(btn) {
    btn.closest('.edit-ing-row').remove();
  },

  cancelEdit() {
    this._editing = false;
    if (this.currentRecipe) {
      this.open(this.currentRecipe.id, this.showAddBtn);
    }
  },

  setScale(scale) {
    this.currentScale = scale;
    // Update scale buttons
    document.querySelectorAll('.scale-btn').forEach(btn => {
      if (parseInt(btn.dataset.scale) === scale) {
        btn.classList.remove('bg-herb-light', 'text-primary');
        btn.classList.add('bg-primary', 'text-white');
      } else {
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-herb-light', 'text-primary');
      }
    });
    // Update servings display
    if (this.currentRecipe) {
      const baseServings = this.currentRecipe.servings || 4;
      document.getElementById('modal-recipe-meta').textContent =
        [baseServings * scale && `${baseServings * scale} servings`, this.currentRecipe.prep_time && `${this.currentRecipe.prep_time} min prep`]
          .filter(Boolean).join(' \u00B7 ');
      // Update ingredients
      this.renderScaledIngredients();
    }
  },

  renderScaledIngredients() {
    const ingEl = document.getElementById('modal-recipe-ingredients');
    const scale = this.currentScale;
    ingEl.innerHTML = (this.currentRecipe.recipe_ingredients || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => {
        const scaledQty = i.quantity ? parseFloat(i.quantity) * scale : null;
        return `<div class="py-2 border-b border-outline-variant/20 text-sm text-on-surface">
          ${formatQuantity(scaledQty)} ${i.unit || ''} ${escapeHtml(i.name)}
          ${i.notes ? `<span class="text-on-surface-variant">(${escapeHtml(i.notes)})</span>` : ''}
        </div>`;
      }).join('');
  },

  async saveEdit() {
    if (!this.currentRecipe) return;
    try {
      const sb = getSupabase();
      const recipeId = this.currentRecipe.id;
      const updates = {
        title: document.getElementById('edit-recipe-title').value.trim(),
        servings: parseInt(document.getElementById('edit-recipe-servings').value) || 4,
        instructions: document.getElementById('edit-recipe-instructions').value.trim()
      };
      const { error } = await sb.from('recipes').update(updates).eq('id', recipeId);
      if (error) throw error;

      // Save ingredients: delete old, insert new
      const rows = document.querySelectorAll('#edit-ingredients-list .edit-ing-row');
      const newIngs = [];
      rows.forEach((row, i) => {
        const name = row.querySelector('[data-field="name"]').value.trim();
        if (!name) return;
        const qty = parseFloat(row.querySelector('[data-field="quantity"]').value) || null;
        const unit = row.querySelector('[data-field="unit"]').value.trim() || null;
        newIngs.push({ recipe_id: recipeId, name, quantity: qty, unit, sort_order: i });
      });

      await sb.from('recipe_ingredients').delete().eq('recipe_id', recipeId);
      if (newIngs.length) {
        await sb.from('recipe_ingredients').insert(newIngs);
      }

      App.showToast('Recipe updated!', 'success');
      this._editing = false;
      await this.open(this.currentRecipe.id, this.showAddBtn);
      RecipeModal._refreshLists();
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  showPairPicker() {
    const picker = document.getElementById('modal-pair-picker');
    picker.classList.toggle('hidden');
    if (!picker.classList.contains('hidden')) {
      document.getElementById('pair-search-input').value = '';
      document.getElementById('pair-search-input').focus();
      this.filterPairResults();
    }
  },

  async filterPairResults() {
    const q = (document.getElementById('pair-search-input')?.value || '').toLowerCase();
    const results = document.getElementById('pair-search-results');
    if (!this.currentRecipe) return;

    const recipes = await Recipes.loadRecipes();
    const currentId = this.currentRecipe.id;
    const pairedIds = new Set((this.currentRecipe.paired_recipes || []).map(p => p.id));

    const filtered = recipes
      .filter(r => r.id !== currentId && !pairedIds.has(r.id) && r.title.toLowerCase().includes(q))
      .slice(0, 8);

    results.innerHTML = filtered.length
      ? filtered.map(r => `
        <button class="w-full text-left p-2 rounded-lg hover:bg-herb-light/30 text-sm font-semibold text-kale-deep transition-colors active:scale-[0.98]" onclick="RecipeModal.pairWith('${r.id}')">
          ${escapeHtml(r.title)}
        </button>
      `).join('')
      : '<p class="text-xs text-on-surface-variant text-center py-2">No recipes found</p>';
  },

  async pairWith(pairedId) {
    if (!this.currentRecipe) return;
    try {
      const sb = getSupabase();
      await sb.from('recipe_pairings').insert({
        recipe_id: this.currentRecipe.id,
        paired_recipe_id: pairedId
      });
      App.showToast('Recipes paired!', 'success');
      document.getElementById('modal-pair-picker')?.classList.add('hidden');
      await this.open(this.currentRecipe.id, this.showAddBtn);
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  async unpair(pairedId) {
    if (!this.currentRecipe) return;
    try {
      const sb = getSupabase();
      const recipeId = this.currentRecipe.id;
      // Delete in both directions
      await sb.from('recipe_pairings').delete()
        .or(`and(recipe_id.eq.${recipeId},paired_recipe_id.eq.${pairedId}),and(recipe_id.eq.${pairedId},paired_recipe_id.eq.${recipeId})`);
      App.showToast('Pairing removed', 'success');
      await this.open(this.currentRecipe.id, this.showAddBtn);
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  showExportMenu() {
    document.getElementById('modal-export-menu')?.classList.toggle('hidden');
  },

  _getExportText() {
    const r = this.currentRecipe;
    if (!r) return '';
    const scale = this.currentScale;
    const servings = (r.servings || 4) * scale;
    const ings = (r.recipe_ingredients || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => {
        const qty = i.quantity ? formatQuantity(parseFloat(i.quantity) * scale) : '';
        return `${qty} ${i.unit || ''} ${i.name}`.trim();
      }).join('\n');
    return `${r.title}\nServings: ${servings}\n\nIngredients:\n${ings}\n\nInstructions:\n${r.instructions || 'No instructions'}`;
  },

  async exportClipboard() {
    const text = this._getExportText();
    try {
      await navigator.clipboard.writeText(text);
      App.showToast('Recipe copied to clipboard!', 'success');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      App.showToast('Recipe copied!', 'success');
    }
    document.getElementById('modal-export-menu')?.classList.add('hidden');
  },

  exportIMessage() {
    const text = this._getExportText();
    window.open(`sms:&body=${encodeURIComponent(text)}`);
    document.getElementById('modal-export-menu')?.classList.add('hidden');
  },

  exportGmail() {
    const r = this.currentRecipe;
    const text = this._getExportText();
    const subject = `Recipe: ${r?.title || 'My Recipe'}`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`);
    document.getElementById('modal-export-menu')?.classList.add('hidden');
  },

  _refreshLists() {
    // Refresh any visible recipe lists so edits appear immediately
    if (typeof RecipesPage !== 'undefined' && App.currentPage === 'recipes') {
      RecipesPage.load();
    }
    if (typeof Plan !== 'undefined') {
      const panel = document.getElementById('saved-recipes-panel');
      if (panel && !panel.classList.contains('hidden')) {
        Plan.showSavedRecipes();
      }
    }
    if (typeof MyRecipes !== 'undefined' && App.currentPage === 'myrecipes') {
      MyRecipes.load();
    }
  }
};

// Close modal on overlay click
document.getElementById('recipe-modal')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) RecipeModal.close();
});

// ============================================================
// Tag Editor
// ============================================================

const TagEditor = {
  async open() {
    await Recipes.loadCategories();
    this.render();
    document.getElementById('tag-editor-modal').classList.add('show');
  },

  close() {
    document.getElementById('tag-editor-modal').classList.remove('show');
    // Refresh category filters
    Recipes.categories = [];
    if (App.currentPage === 'plan') {
      const panel = document.getElementById('saved-recipes-panel');
      if (panel && !panel.classList.contains('hidden')) Plan.showSavedRecipes();
    }
    if (App.currentPage === 'recipes') RecipesPage.load();
    if (App.currentPage === 'myrecipes' && typeof MyRecipes !== 'undefined') MyRecipes.load();
  },

  render() {
    const list = document.getElementById('tag-editor-list');
    list.innerHTML = Recipes.categories.map(cat => `
      <div class="flex items-center justify-between bg-cream-surface rounded-lg p-3 border border-kale-deep/5">
        <span class="text-sm font-semibold text-kale-deep">${escapeHtml(cat.name)}</span>
        <button class="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-berry-danger/10 hover:text-berry-danger transition-colors" onclick="TagEditor.deleteTag('${cat.id}')">
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    `).join('');
  },

  async addTag() {
    const input = document.getElementById('tag-editor-new');
    const name = input.value.trim();
    if (!name) return;

    try {
      const sb = getSupabase();
      const maxOrder = Recipes.categories.reduce((max, c) => Math.max(max, c.sort_order || 0), 0);
      const { data, error } = await sb.from('categories').insert({ name, sort_order: maxOrder + 1 }).select().single();
      if (error) throw error;
      Recipes.categories.push(data);
      input.value = '';
      this.render();
      App.showToast('Tag added!', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  async deleteTag(id) {
    if (!confirm('Delete this tag? It will be removed from all recipes.')) return;
    try {
      const sb = getSupabase();
      await sb.from('recipe_categories').delete().eq('category_id', id);
      await sb.from('categories').delete().eq('id', id);
      Recipes.categories = Recipes.categories.filter(c => c.id !== id);
      this.render();
      App.showToast('Tag deleted!', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  }
};

document.getElementById('tag-editor-modal')?.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) TagEditor.close();
});

// ============================================================
// Helpers
// ============================================================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function toFraction(decimal) {
  if (decimal == null || isNaN(decimal)) return '';
  const num = parseFloat(decimal);
  if (Number.isInteger(num)) return String(num);

  const whole = Math.floor(num);
  const frac = num - whole;

  const fractionMap = [
    [1/8, '\u215B'], [1/4, '\u00BC'], [1/3, '\u2153'], [3/8, '\u215C'],
    [1/2, '\u00BD'], [5/8, '\u215D'], [2/3, '\u2154'], [3/4, '\u00BE'], [7/8, '\u215E']
  ];

  for (const [val, symbol] of fractionMap) {
    if (Math.abs(frac - val) < 0.03) {
      return whole > 0 ? `${whole}${symbol}` : symbol;
    }
  }
  // Not a standard cooking fraction — return as decimal
  return String(parseFloat(num.toFixed(2)));
}

function formatQuantity(qty) {
  if (qty == null) return '';
  return toFraction(parseFloat(qty));
}
