<script type="module">
  // Import Supabase client (ESM version)
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  // --- CONFIG: replace with your actual project values ---
  const SUPABASE_URL = 'https://gsifcmkfoaayngpuipzc.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4';
  // --------------------------------------------------------

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // DOM references
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const suggestionFormContainer = document.getElementById('suggestion-form-container');
  const suggestionForm = document.getElementById('suggestion-form');
  const suggestionInput = document.getElementById('suggestion-input');
  const suggestionsList = document.getElementById('suggestions-list');

  // Utility log helper
  const log = (...args) => console.log('[Supabase]', ...args);

  // --- AUTH FLOW ---
  loginBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert(error.message);
  });

  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.reload();
  });

  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    updateUI(session);
  });

  // Initial load
  const { data: { session } } = await supabase.auth.getSession();
  updateUI(session);

  // --- UI STATE SYNC ---
  async function updateUI(session) {
    if (session?.user) {
      const user = session.user;
      userInfo.textContent = `Logged in as ${user.email}`;
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      suggestionFormContainer.style.display = 'block';
      await fetchSuggestions();
    } else {
      userInfo.textContent = '';
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      suggestionFormContainer.style.display = 'none';
      suggestionsList.innerHTML = '';
    }
  }

  // --- SUBMIT NEW SUGGESTION ---
  suggestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = suggestionInput.value.trim();
    if (!text) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('You must be logged in to submit.');

    const { error } = await supabase
      .from('suggestions')
      .insert([{
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email,
        email: user.email,
        suggestion: text,
        likes: 0
      }]);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    suggestionInput.value = '';
    await fetchSuggestions();
  });

  // --- FETCH & RENDER ---
  async function fetchSuggestions() {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    suggestionsList.innerHTML = '';
    for (const item of data) {
      const card = document.createElement('div');
      card.classList.add('card');
      card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.suggestion}</p>
        <div class="card-actions">
          <button class="btn small like-btn" data-id="${item.id}">👍 ${item.likes}</button>
          ${item.user_id === user?.id ? `<button class="btn small delete-btn" data-id="${item.id}">Delete</button>` : ''}
        </div>
      `;
      suggestionsList.appendChild(card);
    }

    attachButtonEvents();
  }

  // --- BUTTON ACTIONS ---
  function attachButtonEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const { data: row } = await supabase
          .from('suggestions')
          .select('likes')
          .eq('id', id)
          .single();

        await supabase
          .from('suggestions')
          .update({ likes: (row.likes || 0) + 1 })
          .eq('id', id);

        fetchSuggestions();
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await supabase.from('suggestions').delete().eq('id', id);
        fetchSuggestions();
      });
    });
  }
</script>
