// ============================================================
// Shopping Module - Kroger/Smith's Integration
// ============================================================

const Shopping = {
  krogerToken: null,

  async addToKrogerCart() {
    const statusEl = document.getElementById('kroger-status');
    const resultsEl = document.getElementById('kroger-results');
    const btn = document.getElementById('btn-kroger-cart');

    statusEl.classList.remove('hidden');
    resultsEl.innerHTML = '';
    btn.disabled = true;

    try {
      // Step 1: Search for products
      statusEl.innerHTML = '<div class="spinner"></div><p class="loading-text">Finding the best prices at Smith\'s...</p>';

      const items = Plan.shoppingList.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit
      }));

      const locationId = localStorage.getItem('kroger_location_id') || null;
      const res = await fetch('/api/kroger-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, locationId })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Step 2: Display results
      statusEl.classList.add('hidden');
      let totalPrice = 0;

      resultsEl.innerHTML = '<p class="section-title" style="margin-top:0;">Matched Products</p>';

      (data.matches || []).forEach(match => {
        const price = match.price || 0;
        totalPrice += price;

        const div = document.createElement('div');
        div.style.cssText = 'padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);';
        div.innerHTML = `
          <div class="flex-between">
            <div>
              <p style="font-weight:600;font-size:14px;">${escapeHtml(match.ingredient)}</p>
              <p class="text-muted" style="font-size:12px;">${escapeHtml(match.product_name || 'No match found')}</p>
              ${match.size ? `<p class="text-muted" style="font-size:11px;">${escapeHtml(match.size)}</p>` : ''}
            </div>
            <p style="font-weight:700;color:var(--success);">$${price.toFixed(2)}</p>
          </div>
        `;
        resultsEl.appendChild(div);
      });

      // Total
      const totalDiv = document.createElement('div');
      totalDiv.className = 'flex-between mt-12';
      totalDiv.innerHTML = `
        <p style="font-weight:800;font-size:18px;">Estimated Total</p>
        <p style="font-weight:800;font-size:22px;color:var(--success);">$${totalPrice.toFixed(2)}</p>
      `;
      resultsEl.appendChild(totalDiv);

      // Add to cart button
      if (data.matches?.length) {
        const cartBtn = document.createElement('button');
        cartBtn.className = 'btn-animate w-full py-3 bg-carrot-accent text-white font-semibold text-sm rounded-full shadow-lg active:scale-95 transition-transform mt-4';
        cartBtn.textContent = 'Add All to Smith\'s Cart';
        cartBtn.addEventListener('click', () => { triggerSweep(cartBtn); this.confirmAddToCart(data.matches); });
        resultsEl.appendChild(cartBtn);
      }

      if (data.unmatched?.length) {
        const unmatchedDiv = document.createElement('div');
        unmatchedDiv.className = 'mt-12';
        unmatchedDiv.innerHTML = `<p class="section-title">Could Not Match</p>` +
          data.unmatched.map(u => `<p class="text-muted" style="font-size:13px;padding:4px 0;">${escapeHtml(u)}</p>`).join('');
        resultsEl.appendChild(unmatchedDiv);
      }

    } catch (err) {
      statusEl.classList.add('hidden');
      resultsEl.innerHTML = `<div class="card">
        <p class="text-muted">Could not search Smith's. ${escapeHtml(err.message)}</p>
        <p class="text-muted" style="font-size:12px;margin-top:8px;">Make sure you've connected your Kroger account in Settings.</p>
      </div>`;
    }

    btn.disabled = false;
  },

  async getKrogerToken() {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw new Error('Not signed in');

    const res = await fetch('/api/kroger-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseToken: session.access_token })
    });

    const data = await res.json();
    if (!res.ok) {
      if (data.needsAuth) {
        App.showToast("Please connect your Smith's account in Settings first.", 'error');
        App.navigate('settings');
        throw new Error('Kroger account not connected');
      }
      throw new Error(data.error || 'Could not get Kroger token');
    }
    return data.accessToken;
  },

  _cartDebounce: false,

  async confirmAddToCart(matches) {
    if (this._cartDebounce) return;
    this._cartDebounce = true;

    const cartBtn = document.querySelector('[onclick*="confirmAddToCart"]') ||
      document.querySelector('.btn-primary:last-child');

    // Animate the button
    if (cartBtn) {
      cartBtn.classList.add('animate-pulse-btn');
      cartBtn.textContent = 'Opening Smith\'s...';
    }

    try {
      const krogerAccessToken = await this.getKrogerToken();

      const productIds = matches
        .filter(m => m.product_id)
        .map(m => ({ productId: m.product_id, quantity: 1 }));

      if (!productIds.length) {
        App.showToast('No products to add', 'info');
        this._cartDebounce = false;
        return;
      }

      const res = await fetch('/api/kroger-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: productIds, krogerAccessToken })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      App.showToast(`${productIds.length} items added! Opening Smith's...`, 'success');

      // Delay 1s then open Smith's cart
      setTimeout(() => {
        window.open('https://www.smithsfoodanddrug.com/cart', '_blank');
        this._cartDebounce = false;
        if (cartBtn) {
          cartBtn.classList.remove('animate-pulse-btn');
          cartBtn.textContent = "Add All to Smith's Cart";
        }
      }, 1000);
    } catch (err) {
      this._cartDebounce = false;
      if (cartBtn) {
        cartBtn.classList.remove('animate-pulse-btn');
        cartBtn.textContent = "Add All to Smith's Cart";
      }
      if (err.message !== 'Kroger account not connected') {
        App.showToast('Error adding to cart: ' + err.message, 'error');
      }
    }
  }
};
