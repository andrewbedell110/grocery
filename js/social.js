// ============================================================
// Social Module - Community features
// ============================================================

const Social = {
  async load() {
    const feed = document.getElementById('social-feed');
    const profileView = document.getElementById('social-profile-view');
    feed.style.display = '';
    profileView.classList.add('hidden');
    document.getElementById('social-search').value = '';

    // Show recent public profiles
    await this.loadPublicProfiles();
  },

  async loadPublicProfiles() {
    const feed = document.getElementById('social-feed');
    try {
      const sb = getSupabase();
      const currentUser = (await sb.auth.getUser()).data.user;

      const { data: profiles } = await sb
        .from('profiles')
        .select('id, email, display_name, avatar_url, is_public')
        .eq('is_public', true)
        .neq('id', currentUser?.id || '')
        .limit(20);

      if (!profiles?.length) {
        feed.innerHTML = `
          <div class="text-center py-12 text-on-surface-variant">
            <span class="material-symbols-outlined text-5xl opacity-30 block mb-3">people</span>
            <p class="text-sm">No public profiles yet. Search for users or check back later.</p>
          </div>`;
        return;
      }

      feed.innerHTML = '';
      profiles.forEach(p => feed.appendChild(this.renderProfileCard(p)));
    } catch {
      feed.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8">Could not load profiles.</p>';
    }
  },

  async searchUsers() {
    const q = document.getElementById('social-search').value.trim().toLowerCase();
    const feed = document.getElementById('social-feed');

    if (!q) {
      await this.loadPublicProfiles();
      return;
    }

    try {
      const sb = getSupabase();
      const currentUser = (await sb.auth.getUser()).data.user;

      const { data: profiles } = await sb
        .from('profiles')
        .select('id, email, display_name, avatar_url, is_public')
        .eq('is_public', true)
        .neq('id', currentUser?.id || '')
        .or(`display_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20);

      feed.innerHTML = '';
      if (!profiles?.length) {
        feed.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8">No profiles found.</p>';
        return;
      }

      profiles.forEach(p => feed.appendChild(this.renderProfileCard(p)));
    } catch {
      feed.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8">Search failed.</p>';
    }
  },

  renderProfileCard(profile) {
    const card = document.createElement('div');
    card.className = 'bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5 flex items-center gap-4 cursor-pointer hover:shadow-[0_8px_32px_rgba(45,106,79,0.1)] transition-all active:scale-[0.98]';
    card.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden flex-shrink-0 border border-kale-deep/10">
        ${profile.avatar_url
          ? `<img class="w-full h-full object-cover" src="${escapeHtml(profile.avatar_url)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display=''">`
          : ''}
        <span class="material-symbols-outlined text-2xl text-on-surface-variant" ${profile.avatar_url ? 'style="display:none"' : ''}>account_circle</span>
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold text-kale-deep truncate">${escapeHtml(profile.display_name || profile.email?.split('@')[0] || 'User')}</h4>
        <p class="text-xs text-on-surface-variant truncate">${escapeHtml(profile.email || '')}</p>
      </div>
      <span class="material-symbols-outlined text-kale-deep/20">chevron_right</span>
    `;
    card.addEventListener('click', () => this.viewProfile(profile.id));
    return card;
  },

  async viewProfile(userId) {
    const feed = document.getElementById('social-feed');
    const profileView = document.getElementById('social-profile-view');
    const header = document.getElementById('social-profile-header');
    const recipesContainer = document.getElementById('social-profile-recipes');

    feed.style.display = 'none';
    profileView.classList.remove('hidden');

    try {
      const sb = getSupabase();
      const currentUser = (await sb.auth.getUser()).data.user;

      const { data: profile } = await sb
        .from('profiles')
        .select('id, email, display_name, avatar_url, is_public')
        .eq('id', userId)
        .single();

      if (!profile) throw new Error('Profile not found');

      header.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-kale-deep/10">
            ${profile.avatar_url
              ? `<img class="w-full h-full object-cover" src="${escapeHtml(profile.avatar_url)}" alt="">`
              : `<span class="material-symbols-outlined text-3xl text-on-surface-variant">account_circle</span>`}
          </div>
          <div>
            <h3 class="font-display text-xl font-semibold text-kale-deep">${escapeHtml(profile.display_name || profile.email?.split('@')[0] || 'User')}</h3>
            <p class="text-sm text-on-surface-variant">${escapeHtml(profile.email || '')}</p>
          </div>
        </div>
      `;

      // Load their public recipes
      const { data: recipes } = await sb
        .from('recipes')
        .select('*, recipe_categories(category_id, categories(name)), recipe_ingredients(*)')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      recipesContainer.innerHTML = '';
      if (!recipes?.length) {
        recipesContainer.innerHTML = '<p class="text-sm text-on-surface-variant text-center py-8">No recipes shared yet.</p>';
        return;
      }

      recipes.forEach(r => {
        const card = this.renderSocialRecipeCard(r, currentUser?.id);
        recipesContainer.appendChild(card);
      });
    } catch (err) {
      header.innerHTML = '<p class="text-sm text-berry-danger">Could not load profile.</p>';
      recipesContainer.innerHTML = '';
    }
  },

  renderSocialRecipeCard(recipe, currentUserId) {
    const cats = recipe.recipe_categories || [];
    const catNames = cats.map(rc => rc.categories?.name).filter(Boolean);
    const imgSrc = recipe.image_url || '';

    const div = document.createElement('div');
    div.className = 'bg-cream-surface rounded-xl p-4 shadow-[0_4px_24px_rgba(45,106,79,0.06)] border border-kale-deep/5';
    div.innerHTML = `
      <div class="flex gap-3 mb-3">
        ${imgSrc
          ? `<img class="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-surface-container-high" src="${escapeHtml(imgSrc)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-high flex items-center justify-center text-2xl\\'>🍽</div>'">`
          : `<div class="w-20 h-20 rounded-lg flex-shrink-0 bg-surface-container-high flex items-center justify-center text-2xl">🍽</div>`}
        <div class="flex-1 min-w-0">
          <h4 class="font-semibold text-kale-deep truncate">${escapeHtml(recipe.title)}</h4>
          <p class="text-xs text-on-surface-variant">${recipe.servings ? recipe.servings + ' servings' : ''}</p>
          <div class="flex flex-wrap gap-1 mt-2">
            ${catNames.map(n => `<span class="bg-herb-light text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">${escapeHtml(n)}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="flex-1 py-2 bg-herb-light text-primary font-semibold text-xs rounded-full active:scale-95 transition-transform flex items-center justify-center gap-1 like-btn" onclick="Social.likeRecipe('${recipe.id}', this)">
          <span class="material-symbols-outlined text-sm">favorite</span> Like
        </button>
        <button class="flex-1 py-2 bg-carrot-accent text-white font-semibold text-xs rounded-full active:scale-95 transition-transform flex items-center justify-center gap-1" onclick="Social.saveRecipeToOwn('${recipe.id}')">
          <span class="material-symbols-outlined text-sm">bookmark_add</span> Save to Mine
        </button>
      </div>
    `;
    return div;
  },

  async likeRecipe(recipeId, btn) {
    try {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error('Not signed in');

      // Check if already liked
      const { data: existing } = await sb
        .from('recipe_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (existing) {
        await sb.from('recipe_likes').delete().eq('id', existing.id);
        btn.innerHTML = '<span class="material-symbols-outlined text-sm">favorite</span> Like';
        btn.classList.remove('bg-carrot-accent/20', 'text-carrot-accent');
        btn.classList.add('bg-herb-light', 'text-primary');
        App.showToast('Like removed', 'info');
      } else {
        await sb.from('recipe_likes').insert({ user_id: user.id, recipe_id: recipeId });
        btn.innerHTML = '<span class="material-symbols-outlined text-sm icon-filled">favorite</span> Liked';
        btn.classList.remove('bg-herb-light', 'text-primary');
        btn.classList.add('bg-carrot-accent/20', 'text-carrot-accent');
        App.showToast('Recipe liked!', 'success');
      }
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  async saveRecipeToOwn(recipeId) {
    try {
      const sb = getSupabase();
      const profile = App.profile || await Auth.getProfile();
      if (!profile?.household_id) throw new Error('No household');

      // Get the recipe details
      const { data: original } = await sb
        .from('recipes')
        .select('*, recipe_ingredients(*), recipe_categories(category_id)')
        .eq('id', recipeId)
        .single();

      if (!original) throw new Error('Recipe not found');

      // Create a copy in user's household
      const { data: newRecipe, error } = await sb
        .from('recipes')
        .insert({
          household_id: profile.household_id,
          title: original.title,
          instructions: original.instructions,
          image_url: original.image_url,
          servings: original.servings,
          prep_time: original.prep_time,
          cook_time: original.cook_time,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      // Copy ingredients
      if (original.recipe_ingredients?.length) {
        await sb.from('recipe_ingredients').insert(
          original.recipe_ingredients.map((ing, i) => ({
            recipe_id: newRecipe.id,
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
            sort_order: i
          }))
        );
      }

      // Copy categories
      if (original.recipe_categories?.length) {
        await sb.from('recipe_categories').insert(
          original.recipe_categories.map(rc => ({
            recipe_id: newRecipe.id,
            category_id: rc.category_id
          }))
        );
      }

      App.showToast('Recipe saved to your collection!', 'success');
    } catch (err) {
      App.showToast('Error: ' + err.message, 'error');
    }
  },

  backToFeed() {
    document.getElementById('social-feed').style.display = '';
    document.getElementById('social-profile-view').classList.add('hidden');
  }
};
