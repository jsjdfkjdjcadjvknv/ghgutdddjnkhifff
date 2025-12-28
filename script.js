// ==================== MAIN.JS ====================

// Wrap everything in DOMContentLoaded
document.addEventListener('DOMContentLoaded', async () => {

  // ==================== SUPABASE SETUP ====================
  const supabaseUrl = 'https://gsifcmkfoaayngpuipzc.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  // ==================== ELEMENT SELECTORS ====================
  const menuBtn = document.querySelector('.menu-btn');
  const mobileNav = document.querySelector('.nav-mobile');

  const wrapper = document.querySelector('.events-wrapper');
  const cards = document.querySelectorAll('.card');

  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');

  const topicSelection = document.getElementById('topic-selection');
  const topicsList = document.getElementById('topics-list');

  const suggestionFormContainer = document.getElementById('suggestion-form-container');
  const suggestionForm = document.getElementById('suggestion-form');
  const suggestionInput = document.getElementById('suggestion-input');
  const currentTopicTitle = document.getElementById('current-topic-title');
  const suggestionsList = document.getElementById('suggestions-list');
  const wordCounter = document.getElementById('word-counter');

  const modal = document.getElementById('instructions-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // ==================== CAROUSEL (INDEX PAGE ONLY) ====================
  if (wrapper && cards.length) {
    let index = 0;
    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');

    const updateCarousel = () => {
      wrapper.style.transform = `translateX(-${index * 100}vw)`;
    };

    if (nextBtn) nextBtn.onclick = () => { index = (index + 1) % cards.length; updateCarousel(); };
    if (prevBtn) prevBtn.onclick = () => { index = (index - 1 + cards.length) % cards.length; updateCarousel(); };

    setInterval(() => { index = (index + 1) % cards.length; updateCarousel(); }, 5000);
  }

  // ==================== MOBILE MENU ====================
  if (menuBtn && mobileNav) {
    menuBtn.onclick = () => mobileNav.classList.toggle('active');
  }

  // ==================== INSTRUCTION MODAL ====================
  if (modal) {
    window.onload = () => { modal.style.display = 'block'; };
    if (modalCloseBtn) modalCloseBtn.onclick = () => { modal.style.display = 'none'; };
    window.onclick = (event) => { if (event.target === modal) modal.style.display = 'none'; };
  }

  // ==================== TOPICS ====================
  const topics = [
    { id: 1, name: "New Game Features" },
    { id: 2, name: "Art & Visuals" },
    { id: 3, name: "Community Events" },
    { id: 4, name: "Bug Reports" }
  ];

  const showTopics = () => {
    if (!topicsList) return;
    topicsList.innerHTML = '';
    topics.forEach(topic => {
      const card = document.createElement('div');
      card.classList.add('card-box', 'topic-card');
      card.textContent = topic.name;
      card.dataset.topicId = topic.id;
      card.onclick = () => selectTopic(topic);
      topicsList.appendChild(card);
    });
  };

  const selectTopic = (topic) => {
    topicSelection.style.display = 'none';
    suggestionFormContainer.style.display = 'block';
    currentTopicTitle.textContent = `Topic: ${topic.name}`;
    suggestionForm.dataset.topicId = topic.id;
    fetchSuggestions(topic.id);
  };

  // ==================== AUTH ====================
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      });
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.reload();
    });
  }

  supabase.auth.onAuthStateChange((_event, session) => updateUI(session));
  const { data: { session } } = await supabase.auth.getSession();
  updateUI(session);

  async function updateUI(session) {
    if (session?.user) {
      const user = session.user;
      if (userInfo) userInfo.textContent = `Logged in as ${user.email}`;
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
      if (topicSelection) { topicSelection.style.display = 'block'; showTopics(); }
    } else {
      if (userInfo) userInfo.textContent = '';
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (topicSelection) topicSelection.style.display = 'none';
      if (suggestionFormContainer) suggestionFormContainer.style.display = 'none';
      if (suggestionsList) suggestionsList.innerHTML = '';
    }
  }

  // ==================== WORD COUNTER ====================
  if (suggestionInput) {
    suggestionInput.addEventListener('input', () => {
      const words = suggestionInput.value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCounter) wordCounter.textContent = `${words}/150 words`;
      suggestionForm.querySelector('button[type="submit"]').disabled = words > 150;
      if (wordCounter) wordCounter.style.color = words > 150 ? 'red' : '#555';
    });
  }

  // ==================== SUBMIT SUGGESTION ====================
  if (suggestionForm) {
    suggestionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = suggestionInput.value.trim();
      if (!text) return alert('Enter a suggestion first.');
      if (text.split(/\s+/).filter(Boolean).length > 150) return alert('Max 150 words.');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Please login first.');

      const topicId = suggestionForm.dataset.topicId;

      const { error } = await supabase.from('suggestions').insert({
        user_id: user.id,
        name: user.user_metadata.full_name || user.email,
        email: user.email,
        suggestion: text,
        topic_id: topicId,
        likes: 0
      });

      if (error) return alert('Failed to submit: ' + error.message);

      suggestionInput.value = '';
      if (wordCounter) wordCounter.textContent = '0/150 words';
      fetchSuggestions(topicId);
    });
  }

  // ==================== FETCH SUGGESTIONS ====================
  async function fetchSuggestions(topicId) {
    const { data: suggestions, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('topic_id', topicId)
      .order('likes', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      if (suggestionsList) suggestionsList.innerHTML = `<p style="color:red;">Failed to load suggestions.</p>`;
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!suggestionsList) return;
    suggestionsList.innerHTML = '';

    suggestions.forEach(item => {
      const card = document.createElement('div');
      card.classList.add('card-box');
      card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.suggestion}</p>
        <div class="card-actions">
          <button class="btn small like-btn" data-id="${item.id}">👍 ${item.likes}</button>
          ${user && item.user_id === user.id ? `<button class="btn small delete-btn" data-id="${item.id}">🗑</button>` : ''}
        </div>
      `;
      suggestionsList.appendChild(card);
    });

    attachEvents();
  }

  function attachEvents() {
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        const { data, error } = await supabase.from('suggestions').select('likes').eq('id', id).single();
        if (error) return alert('Failed to fetch like count');
        await supabase.from('suggestions').update({ likes: data.likes + 1 }).eq('id', id);
        const topicId = suggestionForm.dataset.topicId;
        fetchSuggestions(topicId);
      };
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm('Delete this suggestion?')) return;
        await supabase.from('suggestions').delete().eq('id', id);
        const topicId = suggestionForm.dataset.topicId;
        fetchSuggestions(topicId);
      };
    });
  }

});
