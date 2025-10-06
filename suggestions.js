// --- CONFIG: replace with your actual project values ---
var SUPABASE_URL = 'https://gsifcmkfoaayngpuipzc.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4';

// Initialize Supabase client (UMD global)
var supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM references
var loginBtn = document.getElementById('login-btn');
var logoutBtn = document.getElementById('logout-btn');
var userInfo = document.getElementById('user-info');
var suggestionFormContainer = document.getElementById('suggestion-form-container');
var suggestionForm = document.getElementById('suggestion-form');
var suggestionInput = document.getElementById('suggestion-input');
var suggestionsList = document.getElementById('suggestions-list');

// --- AUTH FLOW ---
loginBtn.addEventListener('click', function() {
  supabase.auth.signInWithOAuth({ provider: 'google' }).then(function(result) {
    if (result.error) alert(result.error.message);
  });
});

logoutBtn.addEventListener('click', function() {
  supabase.auth.signOut().then(function() {
    window.location.reload();
  });
});

// Listen for auth changes
supabase.auth.onAuthStateChange(function(_event, session) {
  updateUI(session);
});

// Initial load
supabase.auth.getSession().then(function(result) {
  var session = result.data.session;
  updateUI(session);
});

// --- UI STATE SYNC ---
function updateUI(session) {
  if (session && session.user) {
    var user = session.user;
    userInfo.textContent = 'Logged in as ' + user.email;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    suggestionFormContainer.style.display = 'block';
    fetchSuggestions();
  } else {
    userInfo.textContent = '';
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    suggestionFormContainer.style.display = 'none';
    suggestionsList.innerHTML = '';
  }
}

// --- SUBMIT NEW SUGGESTION ---
suggestionForm.addEventListener('submit', function(e) {
  e.preventDefault();
  var text = suggestionInput.value.trim();
  if (!text) return;

  supabase.auth.getUser().then(function(userResult) {
    var user = userResult.data.user;
    if (!user) {
      alert('You must be logged in to submit.');
      return;
    }

    supabase.from('suggestions').insert([{
      user_id: user.id,
      name: (user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : user.email,
      email: user.email,
      suggestion: text,
      likes: 0
    }]).then(function(insertResult) {
      if (insertResult.error) {
        console.error(insertResult.error);
        alert(insertResult.error.message);
        return;
      }
      suggestionInput.value = '';
      fetchSuggestions();
    });
  });
});

// --- FETCH & RENDER ---
function fetchSuggestions() {
  supabase.from('suggestions').select('*').order('likes', { ascending: false }).order('created_at', { ascending: false }).then(function(fetchResult) {
    if (fetchResult.error) {
      console.error(fetchResult.error);
      return;
    }

    supabase.auth.getUser().then(function(userResult) {
      var user = userResult.data.user;

      suggestionsList.innerHTML = '';
      fetchResult.data.forEach(function(item) {
        var card = document.createElement('div');
        card.classList.add('card');

        var deleteButton = '';
        if (user && item.user_id === user.id) {
          deleteButton = '<button class="btn small delete-btn" data-id="' + item.id + '">Delete</button>';
        }

        card.innerHTML = '<h3>' + item.name + '</h3>' +
                         '<p>' + item.suggestion + '</p>' +
                         '<div class="card-actions">' +
                         '<button class="btn small like-btn" data-id="' + item.id + '">👍 ' + item.likes + '</button>' +
                         deleteButton +
                         '</div>';

        suggestionsList.appendChild(card);
      });

      attachButtonEvents();
    });
  });
}

// --- BUTTON ACTIONS ---
function attachButtonEvents() {
  var likeButtons = document.querySelectorAll('.like-btn');
  likeButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.id;
      supabase.from('suggestions').select('likes').eq('id', id).single().then(function(rowResult) {
        var likes = (rowResult.data && rowResult.data.likes) ? rowResult.data.likes : 0;
        supabase.from('suggestions').update({ likes: likes + 1 }).eq('id', id).then(function() {
          fetchSuggestions();
        });
      });
    });
  });

  var deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var id = btn.dataset.id;
      supabase.from('suggestions').delete().eq('id', id).then(function() {
        fetchSuggestions();
      });
    });
  });
}
