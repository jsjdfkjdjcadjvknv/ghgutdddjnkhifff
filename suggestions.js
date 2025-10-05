window.addEventListener('DOMContentLoaded', () => {

    const SUPABASE_URL = 'https://gsifcmkfoaayngpuipzc.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzaWZjbWtmb2FheW5ncHVpcHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyOTk1OTksImV4cCI6MjA3MTg3NTU5OX0.JLj0KAYd4882zaIlOGrzWxLAVwUhY2LGA4ggVLbhbv4';
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userInfo = document.getElementById('user-info');
    const suggestionFormContainer = document.getElementById('suggestion-form-container');
    const suggestionForm = document.getElementById('suggestion-form');
    const suggestionInput = document.getElementById('suggestion-input');
    const suggestionsList = document.getElementById('suggestions-list');

    loginBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) alert(error.message);
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.reload();
    });

    supabase.auth.onAuthStateChange(async (event, session) => {
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

    suggestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const suggestionText = suggestionInput.value.trim();
        if (!suggestionText) return;

        const { data: { user } } = await supabase.auth.getUser();
        const { data: { session } } = await supabase.auth.getSession();
        const userData = session?.user;

        if (!userData) return;

        const { error } = await supabase
            .from('suggestions')
            .insert([{
                user_id: userData.id,
                name: userData.user_metadata?.full_name || userData.email,
                email: userData.email,
                suggestion: suggestionText,
                likes: 0
            }]);

        if (error) alert(error.message);
        else {
            suggestionInput.value = '';
            fetchSuggestions();
        }
    });

    async function fetchSuggestions() {
        const { data, error } = await supabase
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
                    ${item.user_id === supabase.auth.getUser()?.data?.user?.id ? `<button class="btn small delete-btn" data-id="${item.id}">Delete</button>` : ''}
                </div>
            `;
            suggestionsList.appendChild(card);
        });

        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const { data: item } = await supabase
                    .from('suggestions')
                    .select('likes')
                    .eq('id', id)
                    .single();
                
                await supabase
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
                await supabase.from('suggestions').delete().eq('id', id);
                fetchSuggestions();
            });
        });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) fetchSuggestions();
    });
});
