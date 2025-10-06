window.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://gsifcmkfoaayngpuipzc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

    // ✅ Correct initialization
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const suggestionFormContainer = document.getElementById('suggestion-form-container');
    const suggestionForm = document.getElementById('suggestion-form');
    const suggestionInput = document.getElementById('suggestion-input');
    const suggestionsList = document.getElementById('suggestions-list');

    // --- Login with Google ---
    loginBtn.addEventListener('click', async () => {
        const { error } = await client.auth.signInWithOAuth({ provider: 'google' });
        if (error) alert(error.message);
    });

    // --- Logout ---
    logoutBtn.addEventListener('click', async () => {
        await client.auth.signOut();
        window.location.reload();
    });

    // --- Auth state changes ---
    client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            const user = session.user;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            userInfo.textContent = `Logged in as ${user.email}`;
            suggestionFormContainer.style.display = 'block';
            fetchSuggestions();
        } else {
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            userInfo.textContent = '';
            suggestionFormContainer.style.display = 'none';
            suggestionsList.innerHTML = '';
        }
    });

    // --- Submit suggestion ---
    suggestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const suggestionText = suggestionInput.value.trim();
        if (!suggestionText) return;

        const { data: { session } } = await client.auth.getSession();
        const user = session?.user;
        if (!user) return alert('Please log in first.');

        const { error } = await client
            .from('suggestions')
            .insert([{
                user_id: user.id,
                name: user.user_metadata?.full_name || user.email,
                email: user.email,
                suggestion: suggestionText,
                likes: 0
            }]);

        if (error) alert(error.message);
        else {
            suggestionInput.value = '';
            fetchSuggestions();
        }
    });

    // --- Fetch suggestions ---
    async function fetchSuggestions() {
        const { data, error } = await client
            .from('suggestions')
            .select('*')
            .order('likes', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) return console.error(error);

        suggestionsList.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.suggestion}</p>
                <div class="card-actions">
                    <button class="btn small like-btn" data-id="${item.id}">👍 ${item.likes}</button>
                    ${item.user_id === client.auth.getUser()?.data?.user?.id ? `<button class="btn small delete-btn" data-id="${item.id}">Delete</button>` : ''}
                </div>
            `;
            suggestionsList.appendChild(card);
        });

        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const { data: item } = await client
                    .from('suggestions')
                    .select('likes')
                    .eq('id', id)
                    .single();
                
                await client
                    .from('suggestions')
                    .update({ likes: item.likes + 1 })
                    .eq('id', id);

                fetchSuggestions();
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await client.from('suggestions').delete().eq('id', id);
                fetchSuggestions();
            });
        });
    }

    // --- Initial session check ---
    client.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchSuggestions();
    });
});
