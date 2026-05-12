/**
 * Look Book Vault - Local Database Engine
 * Handles persistence for users, attire inventory, and ratings.
 */

const VaultDB = (function() {
    const DB_KEY = 'midnight_vault_data';

    // Default starting data
    const DEFAULT_DATA = {
        users: [
            { id: 'admin_1', username: 'admin123@attire.com', password: '12345678', role: 'admin' }
        ],
        attires: [
            {
                id: '1',
                name: 'Velvet Prime Blazer',
                brand: 'Luxe Tailors',
                image: 'https://images.unsplash.com/photo-1594932224010-74f43a1835ff?auto=format&fit=crop&w=800&q=80',
                gender: 'male', occasion: 'party', season: 'winter',
                recommendedShirt: 'Silk Dress Shirt', recommendedPant: 'Slim Fit Black Trousers',
                skinTones: ['fair', 'medium', 'deep'], bodyType: 'athletic', heightRange: [170, 195], waistRange: [30, 36],
                aiFitting: 'ai_fitting_blazer_1778565293870.png'
            },
            {
                id: '2',
                name: 'Silk Evening Gown',
                brand: 'Aura Couture',
                image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
                gender: 'female', occasion: 'wedding', season: 'summer',
                recommendedShirt: 'N/A', recommendedPant: 'N/A',
                skinTones: ['fair', 'olive', 'tan', 'deep'], bodyType: 'slim', heightRange: [155, 175], waistRange: [24, 30],
                aiFitting: 'ai_fitting_gown_1778565366060.png'
            },
            {
                id: '3',
                name: 'Modern Charcoal Suit',
                brand: 'Urban Elite',
                image: 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?auto=format&fit=crop&w=800&q=80',
                gender: 'male', occasion: 'interview', season: 'winter',
                recommendedShirt: 'White Poplin Shirt', recommendedPant: 'Matching Charcoal Trousers',
                skinTones: ['fair', 'medium', 'deep'], bodyType: 'regular', heightRange: [165, 185], waistRange: [32, 38],
                aiFitting: 'ai_fitting_suit_1778565380810.png'
            },
            {
                id: '4',
                name: 'Azure Summer Linen',
                brand: 'Coastal Luxe',
                image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
                gender: 'male', occasion: 'casual', season: 'summer',
                recommendedShirt: 'Linen Tee', recommendedPant: 'Chino Shorts',
                skinTones: ['tan', 'medium', 'deep'], bodyType: 'slim', heightRange: [160, 190], waistRange: [28, 34],
                aiFitting: 'ai_fitting_linen_1778565479645.png'
            }
        ],
        ratings: [],
        settings: {
            theme: 'lookbook'
        }
    };

    let data = null;

    // Core Methods
    function init() {
        const stored = localStorage.getItem(DB_KEY);
        if (stored) {
            try {
                data = JSON.parse(stored);
                // Migrate or fill missing keys if schema updated
                if (!data.ratings) data.ratings = [];
                if (!data.users) data.users = DEFAULT_DATA.users;
            } catch (e) {
                console.error("Vault DB Corrupted, resetting...", e);
                data = DEFAULT_DATA;
            }
        } else {
            data = DEFAULT_DATA;
            save();
        }
    }

    function save() {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    }

    return {
        init,
        
        // Users
        getUsers: () => data.users,
        addUser: (user) => {
            data.users.push(user);
            save();
        },
        authenticate: (username, password) => {
            return data.users.find(u => u.username === username && u.password === password);
        },

        // Attires
        getAttires: () => data.attires,
        saveAttires: (attires) => {
            data.attires = attires;
            save();
        },
        addAttire: (item) => {
            data.attires.unshift(item);
            save();
        },
        deleteAttire: (id) => {
            data.attires = data.attires.filter(a => a.id !== id);
            data.ratings = data.ratings.filter(r => r.attireId !== id);
            save();
        },

        // Ratings
        getRatings: (attireId) => {
            return data.ratings.filter(r => r.attireId === attireId);
        },
        getAverageRating: (attireId) => {
            const r = data.ratings.filter(r => r.attireId === attireId);
            if (r.length === 0) return 0;
            const sum = r.reduce((acc, curr) => acc + curr.rating, 0);
            return (sum / r.length).toFixed(1);
        },
        addRating: (attireId, username, rating) => {
            // Remove existing rating from same user for this item
            data.ratings = data.ratings.filter(r => !(r.attireId === attireId && r.username === username));
            data.ratings.push({ attireId, username, rating, timestamp: Date.now() });
            save();
        },

        // Direct Data Access (for legacy compatibility if needed)
        get raw() { return data; }
    };
})();

// Auto-init on load
VaultDB.init();
