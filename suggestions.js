document.addEventListener("DOMContentLoaded", async () => {

  // ==================== ELEMENTS ====================
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");
  const topicSelection = document.getElementById("topic-selection");
  const topicsList = document.getElementById("topics-list");
  const suggestionFormContainer = document.getElementById("suggestion-form-container");
  const suggestionForm = document.getElementById("suggestion-form");
  const suggestionInput = document.getElementById("suggestion-input");
  const currentTopicTitle = document.getElementById("current-topic-title");
  const suggestionsList = document.getElementById("suggestions-list");
  const wordCounter = document.getElementById("word-counter");

  // ==================== TOPICS ====================
  const topics = [
    { id: 1, name: "New Game Features" },
    { id: 2, name: "Art & Visuals" },
    { id: 3, name: "Community Events" },
    { id: 4, name: "Bug Reports" }
  ];

  function showTopics() {
    if (!topicsList) return;
    topicsList.innerHTML = "";

    topics.forEach((topic) => {
      const card = document.createElement("div");
      card.classList.add("card-box", "topic-card");
      card.textContent = topic.name;
      card.dataset.topicId = topic.id;
      card.onclick = () => selectTopic(topic);
      topicsList.appendChild(card);
    });
  }

  function selectTopic(topic) {
    if (!topicSelection || !suggestionFormContainer) return;
    topicSelection.style.display = "none";
    suggestionFormContainer.style.display = "block";
    currentTopicTitle.textContent = `Topic: ${topic.name}`;
    suggestionForm.dataset.topicId = topic.id;
    fetchSuggestions(topic.id);
  }

  // ==================== WORD COUNTER ====================
  if (suggestionInput && suggestionForm) {
    suggestionInput.addEventListener("input", () => {
      const words = suggestionInput.value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCounter) wordCounter.textContent = `${words}/150 words`;

      const submitBtn = suggestionForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = words > 150;

      if (wordCounter) wordCounter.style.color = words > 150 ? "red" : "#555";
    });
  }

  // ==================== SUBMIT SUGGESTION ====================
  if (suggestionForm) {
    suggestionForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = suggestionInput?.value.trim();
      if (!text) return alert("Enter a suggestion first.");
      if (text.split(/\s+/).length > 150) return alert("Max 150 words.");

      const topicId = suggestionForm.dataset.topicId;
      if (!topicId) return;

      // TEMPORARY TEST USER
      const testUser = { id: "test-user", name: "Guest", email: "guest@example.com" };

      const res = await fetch("/.netlify/functions/create-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: testUser.id,
          name: testUser.name,
          email: testUser.email,
          suggestion: text,
          topic_id: topicId,
        }),
      });

      const result = await res.json();
      if (!result.success) return alert("Failed to submit suggestion");

      suggestionInput.value = "";
      if (wordCounter) wordCounter.textContent = "0/150 words";
      fetchSuggestions(topicId);
    });
  }

  // ==================== FETCH SUGGESTIONS ====================
  async function fetchSuggestions(topicId) {
    if (!suggestionsList) return;

    const res = await fetch(`/.netlify/functions/fetch-suggestions?topic_id=${topicId}`);
    const data = await res.json();

    suggestionsList.innerHTML = "";

    data.forEach((item) => {
      const card = document.createElement("div");
      card.classList.add("card-box");

      card.innerHTML = `
        <h3>${item.name}</h3>
        <p>${item.suggestion}</p>
        <div class="card-actions">
          <button class="btn small like-btn" data-id="${item.id}">👍 ${item.likes}</button>
          <button class="btn small delete-btn" data-id="${item.id}">🗑</button>
        </div>
      `;

      suggestionsList.appendChild(card);
    });

    attachEvents(topicId);
  }

  function attachEvents(topicId) {
    document.querySelectorAll(".like-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        await fetch("/.netlify/functions/like-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        fetchSuggestions(topicId);
      };
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this suggestion?")) return;
        await fetch("/.netlify/functions/delete-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        fetchSuggestions(topicId);
      };
    });
  }

  // ==================== INITIALIZE ====================
  if (topicSelection) {
    topicSelection.style.display = "block";
    showTopics();
  }
});
