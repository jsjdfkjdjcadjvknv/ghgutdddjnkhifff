// ==================== SUGGESTIONS.JS ====================

document.addEventListener("DOMContentLoaded", async () => {

  // ==================== SUPABASE ====================
  const SUPABASE_URL = "https://gsifcmkfoaayngpuipzc.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  let currentUser = null;
  let currentTopicId = null;

  // ==================== ELEMENTS ====================
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");

  const topicSelection = document.getElementById("topic-selection");
  const topicsList = document.getElementById("topics-list");

  const formContainer = document.getElementById("suggestion-form-container");
  const suggestionForm = document.getElementById("suggestion-form");
  const suggestionInput = document.getElementById("suggestion-input");
  const wordCounter = document.getElementById("word-counter");
  const topicTitle = document.getElementById("current-topic-title");
  const suggestionsList = document.getElementById("suggestions-list");

  // ==================== TOPICS ====================
  const TOPICS = [
    { id: 1, name: "New Game Features" },
    { id: 2, name: "Art & Visuals" },
    { id: 3, name: "Community Events" },
    { id: 4, name: "Bug Reports" }
  ];

  // ==================== AUTH ====================
  loginBtn.onclick = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/suggestions.html`
      }
    });
  };

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
  };

  const { data: { session } } = await supabase.auth.getSession();
  currentUser = session?.user || null;
  updateAuthUI();

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
  });

  function updateAuthUI() {
    if (currentUser) {
      userInfo.textContent = `Logged in as ${currentUser.email}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      topicSelection.style.display = "block";
      renderTopics();
    } else {
      userInfo.textContent = "";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      topicSelection.style.display = "none";
      formContainer.style.display = "none";
      suggestionsList.innerHTML = "";
    }
  }

  // ==================== TOPIC UI ====================
  function renderTopics() {
    topicsList.innerHTML = "";
    TOPICS.forEach(topic => {
      const card = document.createElement("div");
      card.className = "card-box topic-card";
      card.textContent = topic.name;
      card.onclick = () => selectTopic(topic);
      topicsList.appendChild(card);
    });
  }

  function selectTopic(topic) {
    currentTopicId = topic.id;
    topicSelection.style.display = "none";
    formContainer.style.display = "block";
    topicTitle.textContent = `Topic: ${topic.name}`;
    loadSuggestions();
  }

  // ==================== WORD COUNTER ====================
  suggestionInput.addEventListener("input", () => {
    const words = suggestionInput.value.trim().split(/\s+/).filter(Boolean).length;
    wordCounter.textContent = `${words}/150 words`;
    wordCounter.style.color = words > 150 ? "red" : "#555";
    suggestionForm.querySelector("button").disabled = words > 150;
  });

  // ==================== SUBMIT ====================
  suggestionForm.addEventListener("submit", async e => {
    e.preventDefault();

    const text = suggestionInput.value.trim();
    if (!text) return alert("Enter a suggestion.");
    if (text.split(/\s+/).length > 150) return alert("Max 150 words.");

    const { error } = await supabase.from("suggestions").insert({
      user_id: currentUser.id,
      name: currentUser.user_metadata.full_name || currentUser.email,
      email: currentUser.email,
      suggestion: text,
      topic_id: currentTopicId,
      likes: 0
    });

    if (error) return alert(error.message);

    suggestionInput.value = "";
    wordCounter.textContent = "0/150 words";
    loadSuggestions();
  });

  // ==================== LOAD SUGGESTIONS ====================
  async function loadSuggestions() {
    const { data, error } = await supabase
      .from("suggestions")
      .select("*")
      .eq("topic_id", currentTopicId)
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      suggestionsList.innerHTML = "<p>Error loading suggestions.</p>";
      return;
    }

    suggestionsList.innerHTML = "";
    data.forEach(item => renderSuggestion(item));
  }

  // ==================== RENDER CARD ====================
  function renderSuggestion(item) {
    const card = document.createElement("div");
    card.className = "card-box";

    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.suggestion}</p>
      <div class="card-actions">
        <button class="btn small like-btn">👍 ${item.likes}</button>
        ${item.user_id === currentUser.id ? `<button class="btn small delete-btn">🗑</button>` : ""}
      </div>
    `;

    card.querySelector(".like-btn").onclick = async () => {
      await supabase
        .from("suggestions")
        .update({ likes: item.likes + 1 })
        .eq("id", item.id);
      loadSuggestions();
    };

    const deleteBtn = card.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.onclick = async () => {
        if (!confirm("Delete this suggestion?")) return;
        await supabase.from("suggestions").delete().eq("id", item.id);
        loadSuggestions();
      };
    }

    suggestionsList.appendChild(card);
  }

});

