const Auth = {
  async signUp(email, password, householdName) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { household_name: householdName } }
    });
    if (error) throw error;
    return data;
  },

  // Called after login to ensure user has a household (created on first verified login)
  async ensureHousehold() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Check if user already has a household
    const { data: profile } = await sb
      .from('profiles')
      .select('household_id')
      .eq('id', user.id)
      .single();

    if (profile?.household_id) return;

    // Create household from metadata stored during signup
    const householdName = user.user_metadata?.household_name || 'My Household';
    const { data: household, error: hErr } = await sb
      .from('households')
      .insert({ name: householdName, owner_id: user.id })
      .select()
      .single();
    if (hErr) throw hErr;

    // Link user to household
    await sb
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', user.id);
  },

  async signIn(email, password) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const sb = getSupabase();
    await sb.auth.signOut();
    App.navigate('login');
  },

  async getSession() {
    const sb = getSupabase();
    const { data: { session } } = await sb.auth.getSession();
    return session;
  },

  async resetPassword(email) {
    const sb = getSupabase();
    const { error } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/?type=recovery'
    });
    if (error) throw error;
  },

  async updatePassword(newPassword) {
    const sb = getSupabase();
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  async getProfile() {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data: profile } = await sb
      .from('profiles')
      .select('*, households!profiles_household_fk(*)')
      .eq('id', user.id)
      .single();

    return profile;
  }
};
