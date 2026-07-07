const Auth = {
  async signUp(email, password, householdName) {
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;

    // Create household
    const { data: household, error: hErr } = await sb
      .from('households')
      .insert({ name: householdName, owner_id: data.user.id })
      .select()
      .single();
    if (hErr) throw hErr;

    // Link user to household
    await sb
      .from('profiles')
      .update({ household_id: household.id })
      .eq('id', data.user.id);

    return data;
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
