class JournalApp {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('journalEntries')) || [];
        this.selectedMood = null;
        this.selectedActivities = new Set();
        
        this.init();
    }
    
    init() {
        this.updateDate();
        this.setupEventListeners();
        this.displayEntries();
        this.setupMoodDescriptions();
    }
    
    updateDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    }
    
    setupMoodDescriptions() {
        this.moodDescriptions = {
            radiant: "Feeling absolutely wonderful and full of energy! ✨",
            happy: "In a great mood, everything feels bright and positive! 😊",
            content: "Peaceful and satisfied with how things are going 😌",
            neutral: "Feeling balanced, neither particularly up nor down 😐",
            anxious: "A bit worried or stressed about things 😰",
            sad: "Feeling down or melancholy today 😢",
            overwhelmed: "Too much going on, feeling scattered 😵"
        };
    }
    
    setupEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectMood(e.target.dataset.mood, e.target);
            });
        });
        
        // Activity selection
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.toggleActivity(e.target.dataset.activity, e.target);
            });
        });
        
        // Save entry
        document.getElementById('saveEntry').addEventListener('click', () => {
            this.saveEntry();
        });
        
        // Auto-resize textarea
        const textarea = document.getElementById('reflection');
        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        });
        
        // Gratitude inputs animation
        document.querySelectorAll('.gratitude-input').forEach(input => {
            input.addEventListener('focus', (e) => {
                e.target.style.transform = 'scale(1.02)';
            });
            
            input.addEventListener('blur', (e) => {
                e.target.style.transform = 'scale(1)';
            });
        });
    }
    
    selectMood(mood, element) {
        // Remove previous selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked element
        element.classList.add('selected');
        this.selectedMood = mood;
        
        // Update mood description
        const moodDescription = document.getElementById('moodDescription');
        moodDescription.textContent = this.moodDescriptions[mood];
        moodDescription.style.opacity = '0';
        
        setTimeout(() => {
            moodDescription.style.opacity = '1';
        }, 100);
        
        // Add subtle animation
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'pulse 0.6s ease';
    }
    
    toggleActivity(activity, element) {
        if (this.selectedActivities.has(activity)) {
            this.selectedActivities.delete(activity);
            element.classList.remove('selected');
        } else {
            this.selectedActivities.add(activity);
            element.classList.add('selected');
        }
        
        // Add feedback animation
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
    
    saveEntry() {
        const reflection = document.getElementById('reflection').value.trim();
        const gratitudeInputs = document.querySelectorAll('.gratitude-input');
        const gratitude = Array.from(gratitudeInputs)
            .map(input => input.value.trim())
            .filter(value => value.length > 0);
        
        // Validation
        if (!this.selectedMood) {
            this.showFeedback('Please select your mood for today', 'warning');
            return;
        }
        
        if (!reflection) {
            this.showFeedback('Please write a reflection for today', 'warning');
            return;
        }
        
        const entry = {
            id: Date.now(),
            date: new Date().toISOString(),
            mood: this.selectedMood,
            activities: Array.from(this.selectedActivities),
            reflection: reflection,
            gratitude: gratitude
        };
        
        // Check if there's already an entry for today
        const today = new Date().toDateString();
        const existingEntryIndex = this.entries.findIndex(entry => {
            return new Date(entry.date).toDateString() === today;
        });
        
        if (existingEntryIndex !== -1) {
            this.entries[existingEntryIndex] = entry;
            this.showFeedback('Today\'s entry has been updated! 📝', 'success');
        } else {
            this.entries.unshift(entry);
            this.showFeedback('Entry saved successfully! 🌟', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('journalEntries', JSON.stringify(this.entries));
        
        // Reset form
        this.resetForm();
        
        // Update display
        this.displayEntries();
        
        // Smooth scroll to history
        setTimeout(() => {
            document.getElementById('entriesHistory').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 1000);
    }
    
    resetForm() {
        // Reset mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedMood = null;
        document.getElementById('moodDescription').textContent = '';
        
        // Reset activity selection
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.selectedActivities.clear();
        
        // Clear text inputs
        document.getElementById('reflection').value = '';
        document.querySelectorAll('.gratitude-input').forEach(input => {
            input.value = '';
        });
        
        // Reset textarea height
        const textarea = document.getElementById('reflection');
        textarea.style.height = 'auto';
    }
    
    showFeedback(message, type) {
        // Create feedback element if it doesn't exist
        let feedback = document.getElementById('feedback');
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'feedback';
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                font-weight: 500;
                z-index: 1000;
                transform: translateX(100%);
                transition: all 0.3s ease;
                font-family: 'Crimson Text', serif;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;
            document.body.appendChild(feedback);
        }
        
        // Set color based on type
        const colors = {
            success: { bg: 'var(--sage)', text: 'white' },
            warning: { bg: 'var(--terracotta)', text: 'white' },
            error: { bg: '#e74c3c', text: 'white' }
        };
        
        const color = colors[type] || colors.success;
        feedback.style.backgroundColor = color.bg;
        feedback.style.color = color.text;
        feedback.textContent = message;
        
        // Show feedback
        feedback.style.transform = 'translateX(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            feedback.style.transform = 'translateX(100%)';
        }, 3000);
    }
    
    displayEntries() {
        const container = document.getElementById('entriesContainer');
        
        if (this.entries.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    Your journal entries will appear here once you start writing. 
                    Begin your mindfulness journey today!
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.entries.map(entry => this.createEntryCard(entry)).join('');
    }
    
    createEntryCard(entry) {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const moodEmoji = {
            radiant: '✨',
            happy: '😊',
            content: '😌',
            neutral: '😐',
            anxious: '😰',
            sad: '😢',
            overwhelmed: '😵'
        };
        
        const activitiesHtml = entry.activities.map(activity => 
            `<span class="activity-tag">${activity}</span>`
        ).join('');
        
        const gratitudeHtml = entry.gratitude.length > 0 
            ? `<div class="entry-gratitude">
                <h4 style="color: var(--deep-terracotta); margin-bottom: 0.5rem; font-family: 'Playfair Display', serif;">Grateful for:</h4>
                <ul class="gratitude-list">
                    ${entry.gratitude.map(item => `<li>${item}</li>`).join('')}
                </ul>
               </div>`
            : '';
        
        return `
            <div class="entry-card">
                <div class="entry-date">${formattedDate}</div>
                <div class="entry-mood">${moodEmoji[entry.mood] || '😐'} ${this.moodDescriptions[entry.mood] || 'Feeling neutral'}</div>
                ${entry.activities.length > 0 ? `<div class="entry-activities">${activitiesHtml}</div>` : ''}
                <div class="entry-reflection">"${entry.reflection}"</div>
                ${gratitudeHtml}
            </div>
        `;
    }
    
    // Export/Import functionality for future enhancement
    exportEntries() {
        const dataStr = JSON.stringify(this.entries, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `journal-entries-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Add CSS for pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.15); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JournalApp();
});

// Add some delightful interactions
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    if (!cursor) {
        const newCursor = document.createElement('div');
        newCursor.className = 'custom-cursor';
        newCursor.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: radial-gradient(circle, var(--sage), transparent);
            pointer-events: none;
            z-index: 9999;
            opacity: 0.6;
            transition: all 0.1s ease;
            mix-blend-mode: multiply;
        `;
        document.body.appendChild(newCursor);
    }
});

// Add gentle page transitions
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0.8';
    document.body.style.transform = 'scale(0.98)';
});