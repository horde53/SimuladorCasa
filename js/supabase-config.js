// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_CONFIG = {
    // Replace with your Supabase project URL
    URL: 'YOUR_SUPABASE_URL_HERE',
    
    // Replace with your Supabase anon key
    ANON_KEY: 'YOUR_SUPABASE_ANON_KEY_HERE',
    
    // Enable/disable Supabase (set to false to use only local storage)
    ENABLED: false // Set to true when you have valid credentials
};

// Auto-initialize Supabase when page loads
document.addEventListener('DOMContentLoaded', async function() {
    if (SUPABASE_CONFIG.ENABLED && SUPABASE_CONFIG.URL !== 'YOUR_SUPABASE_URL_HERE') {
        console.log('Initializing Supabase...');
        const success = await window.supabaseClient.init(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
        
        if (success) {
            console.log('✅ Supabase connected successfully');
        } else {
            console.warn('⚠️ Supabase initialization failed, using local storage only');
        }
    } else {
        console.log('📱 Using local storage only (Supabase disabled)');
    }
});

// Helper function to check if Supabase is available
window.isSupabaseAvailable = function() {
    return SUPABASE_CONFIG.ENABLED && window.supabaseClient.isInitialized();
};