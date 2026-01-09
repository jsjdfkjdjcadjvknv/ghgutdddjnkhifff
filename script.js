// ==================== MAIN.JS ====================

document.addEventListener("DOMContentLoaded", async () => {
  try {

    // ==================== SUPABASE SETUP ====================
    if (!window.supabase) {
      console.error("Supabase not loaded");
      return;
    }

    const supabaseUrl = "https://gsifcmkfoaayngpuipzc.supabase.co";
    const supabaseKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4";

    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    // ==================== ELEMENT SELECTORS ====================
    const menuBtn = document.querySelector(".menu-btn");
    const mobileNav = document.querySelector(".nav-mobile");

    const wrapper = document.querySelector(".events-wrapper");
    const cards = document.querySelectorAll(".card");

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

    const modal = document.getElementById("instructions-modal");
    const modalCloseBtn = document.getElementById("modal-close-btn");

    // ==================== CAROUSEL (INDEX PAGE ONLY) ====================
    if (wrapper && cards.length) {
      let index = 0;
      const nextBtn = document.querySelector(".next");
      const prevBtn = document.querySelector(".prev");

      const updateCarousel = () => {
        wrapper.style.transform = `translateX(-${index * 100}vw)`;
      };

      if (nextBtn) nextBtn.onclick = () => {
        index = (index + 1) % cards.length;
        updateCarousel();
      };

      if (prevBtn) prevBtn.onclick = () => {
        index = (index - 1 + cards.length) % cards.length;
        updateCarousel();
      };

      setInterval(() => {
        index = (index + 1) % cards.length;
        updateCarousel();
      }, 5000);
    }

    // ==================== MOBILE MENU ====================
    if (menuBtn && mobileNav) {
      menuBtn.onclick = () => mobileNav.classList.toggle("active");
    }

    // ==================== INSTRUCTION MODAL ====================
    if (modal) {
      modal.style.display = "block";

      if (modalCloseBtn) {
        modalCloseBtn.onclick = () => (modal.style.display = "none");
      }

      window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }

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

    // ==================== AUTH ====================
    if (loginBtn) {
      loginBtn.onclick = async () => {
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.href }
        });
      };
    }

    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await supabase.auth.signOut();
        location.reload();
      };
    }

    supabase.auth.onAuthStateChange((_e, session) => updateUI(session));

    let session = null;
    try {
      const res = await supabase.auth.getSession();
      session = res?.data?.session ?? null;
    } catch (e) {
      console.error(e);
    }

    updateUI(session);

    function updateUI(session) {
      if (session?.user) {
        const user = session.user;
        if (userInfo) userInfo.textContent = `Logged in as ${user.email}`;
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";
        if (topicSelection) {
          topicSelection.style.display = "block";
          showTopics();
        }
      } else {
        if (userInfo) userInfo.textContent = "";
        if (loginBtn) loginBtn.style.display = "inline-block";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (topicSelection) topicSelection.style.display = "none";
        if (suggestionFormContainer) suggestionFormContainer.style.display = "none";
        if (suggestionsList) suggestionsList.innerHTML = "";
      }
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

        if (text.split(/\s+/).length > 150) {
          return alert("Max 150 words.");
        }

        const { data } = await supabase.auth.getUser();
        if (!data?.user) return alert("Please login first.");

        const topicId = suggestionForm.dataset.topicId;
        if (!topicId) return;

        const { error } = await supabase.from("suggestions").insert({
          user_id: data.user.id,
          name: data.user.user_metadata.full_name || data.user.email,
          email: data.user.email,
          suggestion: text,
          topic_id: topicId,
          likes: 0
        });

        if (error) return alert(error.message);

        suggestionInput.value = "";
        if (wordCounter) wordCounter.textContent = "0/150 words";
        fetchSuggestions(topicId);
      });
    }

    // ==================== FETCH SUGGESTIONS ====================
    async function fetchSuggestions(topicId) {
      if (!suggestionsList) return;

      const { data, error } = await supabase
        .from("suggestions")
        .select("*")
        .eq("topic_id", topicId)
        .order("likes", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        suggestionsList.innerHTML = `<p style="color:red;">Failed to load suggestions.</p>`;
        return;
      }

      const userRes = await supabase.auth.getUser();
      const user = userRes?.data?.user;

      suggestionsList.innerHTML = "";

      data.forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("card-box");

        card.innerHTML = `
          <h3>${item.name}</h3>
          <p>${item.suggestion}</p>
          <div class="card-actions">
            <button class="btn small like-btn" data-id="${item.id}">👍 ${item.likes}</button>
            ${user && item.user_id === user.id
              ? `<button class="btn small delete-btn" data-id="${item.id}">🗑</button>`
              : ""}
          </div>
        `;

        suggestionsList.appendChild(card);
      });

      attachEvents();
    }

    function attachEvents() {
      document.querySelectorAll(".like-btn").forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          const res = await supabase.from("suggestions").select("likes").eq("id", id).single();
          if (!res.data) return;
          await supabase.from("suggestions").update({ likes: res.data.likes + 1 }).eq("id", id);
          fetchSuggestions(suggestionForm.dataset.topicId);
        };
      });

      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          if (!confirm("Delete this suggestion?")) return;
          await supabase.from("suggestions").delete().eq("id", id);
          fetchSuggestions(suggestionForm.dataset.topicId);
        };
      });
    }

  } catch (err) {
    alert("JS crashed: " + err.message);
    console.error(err);
  }
});
