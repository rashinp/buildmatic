class JournalApp {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        this.currentDate = new Date().toISOString().split('T')[0];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTodaysEntry();
        this.updateDateDisplay();
        this.animateOnLoad();
    }

    setupEventListeners() {
        // Auto-save on input
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                this.autoSave();
                this.animateWriting(textarea);
            });
        });

        // Mood selection
        const moodOptions = document.querySelectorAll('.mood-option');
        moodOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMood(e.target.dataset.mood);
            });
        });

        // Navigation
        document.getElementById('prevDay').addEventListener('click', () => this.navigateDay(-1));
        document.getElementById('nextDay').addEventListener('click', () => this.navigateDay(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View toggle
        document.getElementById('viewToggle').addEventListener('click', () => this.toggleView());
    }

    updateDateDisplay() {
        const date = new Date(this.currentDate);
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = date.toLocaleDateString('en-US', options);
    }

    navigateDay(direction) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + direction);
        this.currentDate = date.toISOString().split('T')[0];
        this.updateDateDisplay();
        this.loadTodaysEntry();
        this.animatePageTransition();
    }

    goToToday() {
        this.currentDate = new Date().toISOString().split('T')[0];
        this.updateDateDisplay();
        this.loadTodaysEntry();
        this.animatePageTransition();
    }

    loadTodaysEntry() {
        const entry = this.entries.find(e => e.date === this.currentDate);
        
        if (entry) {
            document.getElementById('activities').value = entry.activities || '';
            document.getElementById('thoughts').value = entry.thoughts || '';
            document.getElementById('gratitude').value = entry.gratitude || '';
            this.selectMood(entry.mood);
        } else {
            // Clear form for new entry
            document.getElementById('activities').value = '';
            document.getElementById('thoughts').value = '';
            document.getElementById('gratitude').value = '';
            this.selectMood('');
        }
    }

    selectMood(mood) {
        const moodOptions = document.querySelectorAll('.mood-option');
        moodOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.mood === mood) {
                option.classList.add('selected');
                this.animateMoodSelection(option);
            }
        });
        this.autoSave();
    }

    autoSave() {
        const activities = document.getElementById('activities').value;
        const thoughts = document.getElementById('thoughts').value;
        const gratitude = document.getElementById('gratitude').value;
        const selectedMood = document.querySelector('.mood-option.selected');
        const mood = selectedMood ? selectedMood.dataset.mood : '';

        // Find existing entry or create new one
        let entry = this.entries.find(e => e.date === this.currentDate);
        
        if (entry) {
            entry.activities = activities;
            entry.thoughts = thoughts;
            entry.gratitude = gratitude;
            entry.mood = mood;
            entry.lastModified = new Date().toISOString();
        } else {
            entry = {
                date: this.currentDate,
                activities,
                thoughts,
                gratitude,
                mood,
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            this.entries.push(entry);
        }

        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        this.showSaveIndicator();
    }

    showSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'save-indicator';
        indicator.textContent = 'Saved ✓';
        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(indicator);
            }, 300);
        }, 1500);
    }

    toggleView() {
        const entriesView = document.getElementById('entriesView');
        const writeView = document.getElementById('writeView');
        const toggleBtn = document.getElementById('viewToggle');

        if (entriesView.classList.contains('hidden')) {
            this.showEntriesView();
            entriesView.classList.remove('hidden');
            writeView.classList.add('hidden');
            toggleBtn.innerHTML = '<span>✏️</span> Write';
        } else {
            entriesView.classList.add('hidden');
            writeView.classList.remove('hidden');
            toggleBtn.innerHTML = '<span>📚</span> Browse';
        }
    }

    showEntriesView() {
        const entriesList = document.getElementById('entriesList');
        entriesList.innerHTML = '';

        // Sort entries by date (newest first)
        const sortedEntries = [...this.entries].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedEntries.forEach(entry => {
            const entryCard = this.createEntryCard(entry);
            entriesList.appendChild(entryCard);
        });

        if (sortedEntries.length === 0) {
            entriesList.innerHTML = '<p class="no-entries">No journal entries yet. Start writing to see them here!</p>';
        }
    }

    createEntryCard(entry) {
        const card = document.createElement('div');
        card.className = 'entry-card';
        
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });

        const moodEmoji = this.getMoodEmoji(entry.mood);
        const preview = this.getEntryPreview(entry);

        card.innerHTML = `
            <div class="entry-header">
                <div class="entry-date">${formattedDate}</div>
                <div class="entry-mood">${moodEmoji}</div>
            </div>
            <div class="entry-preview">${preview}</div>
        `;

        card.addEventListener('click', () => {
            this.currentDate = entry.date;
            this.toggleView();
            this.updateDateDisplay();
            this.loadTodaysEntry();
        });

        return card;
    }

    getMoodEmoji(mood) {
        const moodMap = {
            'amazing': '🤩',
            'happy': '😊',
            'okay': '😐',
            'sad': '😔',
            'angry': '😠'
        };
        return moodMap[mood] || '•';
    }

    getEntryPreview(entry) {
        const activities = entry.activities ? entry.activities.substring(0, 80) + '...' : '';
        const thoughts = entry.thoughts ? entry.thoughts.substring(0, 80) + '...' : '';
        return activities || thoughts || 'Empty entry';
    }

    // Animation methods
    animateOnLoad() {
        const elements = document.querySelectorAll('.journal-section, .mood-selector, .navigation');
        elements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    animateWriting(textarea) {
        textarea.style.transform = 'scale(1.02)';
        setTimeout(() => {
            textarea.style.transform = 'scale(1)';
        }, 150);
    }

    animateMoodSelection(option) {
        option.style.transform = 'scale(1.1)';
        setTimeout(() => {
            option.style.transform = 'scale(1)';
        }, 200);
    }

    animatePageTransition() {
        const content = document.querySelector('.journal-container');
        content.style.opacity = '0.7';
        content.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
            content.style.opacity = '1';
            content.style.transform = 'translateX(0)';
        }, 150);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new JournalApp();
});