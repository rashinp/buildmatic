// EventMaster Pro - Advanced Task Management System
class EventTaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('eventTasks')) || [];
        this.currentFilter = 'all';
        this.currentView = 'cards';
        this.taskIdCounter = Math.max(...this.tasks.map(t => t.id), 0) + 1;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
        this.setupAnimations();
    }

    bindEvents() {
        // Form submission
        const taskForm = document.getElementById('taskForm');
        taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // View toggle
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewChange(e));
        });

        // Modal close
        const modalClose = document.getElementById('modalClose');
        const modalOverlay = document.getElementById('taskModal');
        modalClose.addEventListener('click', () => this.closeModal());
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) this.closeModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const taskData = {
            id: this.taskIdCounter++,
            title: document.getElementById('taskTitle').value,
            eventName: document.getElementById('eventName').value,
            category: document.getElementById('category').value,
            priority: document.getElementById('priority').value,
            dueDate: document.getElementById('dueDate').value,
            assignee: document.getElementById('assignee').value,
            status: 'pending',
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Validate required fields
        if (!taskData.title.trim()) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        this.tasks.unshift(taskData);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // Reset form with animation
        e.target.reset();
        this.showNotification('Task created successfully!', 'success');
        
        // Animate the new task
        setTimeout(() => {
            const newTaskCard = document.querySelector('.task-card');
            if (newTaskCard) {
                newTaskCard.style.animation = 'taskSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }
        }, 100);
    }

    handleFilterChange(e) {
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentFilter = e.target.dataset.filter;
        this.renderTasks();
    }

    handleViewChange(e) {
        // Update active view button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        this.currentView = e.target.dataset.view;
        const container = document.getElementById('tasksContainer');
        
        if (this.currentView === 'list') {
            container.classList.add('list-view');
        } else {
            container.classList.remove('list-view');
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N for new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('taskTitle').focus();
        }
        
        // Escape to close modal
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }
        
        emptyState.classList.remove('show');
        
        container.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
        
        // Bind task-specific events
        this.bindTaskEvents();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        switch (this.currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => task.status === 'pending');
                break;
            case 'in-progress':
                filtered = filtered.filter(task => task.status === 'in-progress');
                break;
            case 'completed':
                filtered = filtered.filter(task => task.status === 'completed');
                break;
            case 'urgent':
                filtered = filtered.filter(task => task.priority === 'urgent');
                break;
        }
        
        // Sort by priority and due date
        return filtered.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    createTaskCard(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
        const dueDateFormatted = dueDate ? this.formatDate(dueDate) : 'No due date';
        
        return `
            <div class="task-card ${task.status}" data-task-id="${task.id}" style="animation-delay: ${Math.random() * 0.1}s">
                <div class="task-header">
                    <div>
                        <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                        ${task.eventName ? `<div class="meta-value" style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">📅 ${this.escapeHtml(task.eventName)}</div>` : ''}
                    </div>
                    <span class="priority-badge priority-${task.priority}">${task.priority.replace('-', ' ')}</span>
                </div>
                
                <div class="task-meta">
                    <div class="meta-item">
                        <span class="meta-label">Category</span>
                        <span class="meta-value">${this.formatCategory(task.category)}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Due Date</span>
                        <span class="meta-value ${isOverdue ? 'overdue' : ''}">${dueDateFormatted}</span>
                    </div>
                    ${task.assignee ? `
                        <div class="meta-item">
                            <span class="meta-label">Assignee</span>
                            <span class="meta-value">👤 ${this.escapeHtml(task.assignee)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-label">Status</span>
                        <span class="meta-value status-${task.status}">${this.formatStatus(task.status)}</span>
                    </div>
                </div>
                
                <div class="task-actions">
                    ${task.status !== 'completed' ? `
                        <button class="action-btn toggle-status" data-task-id="${task.id}">
                            ${task.status === 'pending' ? 'Start Task' : 'Complete'}
                        </button>
                    ` : `
                        <button class="action-btn toggle-status" data-task-id="${task.id}">
                            Reopen
                        </button>
                    `}
                    <button class="action-btn view-details" data-task-id="${task.id}">View Details</button>
                    <button class="action-btn delete" data-task-id="${task.id}">Delete</button>
                </div>
            </div>
        `;
    }

    bindTaskEvents() {
        // Toggle task status
        document.querySelectorAll('.toggle-status').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                this.toggleTaskStatus(taskId);
            });
        });

        // Delete task
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                this.deleteTask(taskId);
            });
        });

        // View details
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                this.showTaskDetails(taskId);
            });
        });

        // Click to view details
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('action-btn')) {
                    const taskId = parseInt(card.dataset.taskId);
                    this.showTaskDetails(taskId);
                }
            });
        });
    }

    toggleTaskStatus(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        if (task.status === 'pending') {
            task.status = 'in-progress';
        } else if (task.status === 'in-progress') {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
        } else if (task.status === 'completed') {
            task.status = 'pending';
            task.completedAt = null;
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        this.showNotification(`Task ${task.status.replace('-', ' ')}!`, 'success');
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully', 'success');
        }
    }

    showTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('taskModal');
        const modalBody = document.getElementById('modalBody');
        
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && task.status !== 'completed';
        
        modalBody.innerHTML = `
            <div class="task-detail-content">
                <div class="detail-section">
                    <h4>Task Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Title</span>
                            <span class="detail-value">${this.escapeHtml(task.title)}</span>
                        </div>
                        ${task.eventName ? `
                            <div class="detail-item">
                                <span class="detail-label">Event</span>
                                <span class="detail-value">${this.escapeHtml(task.eventName)}</span>
                            </div>
                        ` : ''}
                        <div class="detail-item">
                            <span class="detail-label">Category</span>
                            <span class="detail-value">${this.formatCategory(task.category)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Priority</span>
                            <span class="detail-value priority-${task.priority}">${task.priority.replace('-', ' ').toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status</span>
                            <span class="detail-value status-${task.status}">${this.formatStatus(task.status)}</span>
                        </div>
                        ${task.assignee ? `
                            <div class="detail-item">
                                <span class="detail-label">Assignee</span>
                                <span class="detail-value">${this.escapeHtml(task.assignee)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Timeline</h4>
                    <div class="timeline-item">
                        <span class="timeline-label">Created</span>
                        <span class="timeline-value">${this.formatDate(new Date(task.createdAt))}</span>
                    </div>
                    ${task.dueDate ? `
                        <div class="timeline-item">
                            <span class="timeline-label">Due Date</span>
                            <span class="timeline-value ${isOverdue ? 'overdue' : ''}">${this.formatDate(dueDate)}</span>
                        </div>
                    ` : ''}
                    ${task.completedAt ? `
                        <div class="timeline-item">
                            <span class="timeline-label">Completed</span>
                            <span class="timeline-value">${this.formatDate(new Date(task.completedAt))}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="detail-actions">
                    <button class="action-btn toggle-status" data-task-id="${task.id}">
                        ${task.status === 'completed' ? 'Reopen Task' : task.status === 'pending' ? 'Start Task' : 'Complete Task'}
                    </button>
                    <button class="action-btn delete" data-task-id="${task.id}">Delete Task</button>
                </div>
            </div>
        `;
        
        // Add styles for modal content
        if (!document.querySelector('#modal-styles')) {
            const modalStyles = document.createElement('style');
            modalStyles.id = 'modal-styles';
            modalStyles.textContent = `
                .detail-section { margin-bottom: 2rem; }
                .detail-section h4 { font-family: var(--font-display); font-size: 1.3rem; margin-bottom: 1rem; color: var(--text-primary); }
                .detail-grid { display: grid; gap: 1rem; }
                .detail-item, .timeline-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-light); }
                .detail-label, .timeline-label { font-weight: 500; color: var(--text-secondary); }
                .detail-value, .timeline-value { color: var(--text-primary); font-weight: 500; }
                .detail-value.overdue, .timeline-value.overdue { color: var(--status-urgent); }
                .detail-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
            `;
            document.head.appendChild(modalStyles);
        }
        
        modal.classList.add('show');
        
        // Rebind events for modal buttons
        modalBody.querySelectorAll('.action-btn').forEach(btn => {
            if (btn.classList.contains('toggle-status')) {
                btn.addEventListener('click', () => {
                    this.toggleTaskStatus(task.id);
                    this.closeModal();
                });
            } else if (btn.classList.contains('delete')) {
                btn.addEventListener('click', () => {
                    this.deleteTask(task.id);
                    this.closeModal();
                });
            }
        });
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('show');
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.status === 'completed').length;
        const urgentTasks = this.tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('urgentTasks').textContent = urgentTasks;
    }

    setupAnimations() {
        // Stagger task card animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.animation = 'fadeInUp 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both';
                    }, index * 100);
                    observer.unobserve(entry.target);
                }
            });
        });

        // Observe existing task cards
        document.querySelectorAll('.task-card').forEach(card => {
            observer.observe(card);
        });
    }

    saveTasks() {
        localStorage.setItem('eventTasks', JSON.stringify(this.tasks));
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add notification styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const notificationStyles = document.createElement('style');
            notificationStyles.id = 'notification-styles';
            notificationStyles.textContent = `
                .notification {
                    position: fixed;
                    top: 2rem;
                    right: 2rem;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    animation: notificationSlide 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    box-shadow: var(--shadow-strong);
                }
                .notification.success { background: var(--status-completed); }
                .notification.error { background: var(--status-urgent); }
                .notification.info { background: var(--status-progress); }
                @keyframes notificationSlide {
                    from { opacity: 0; transform: translateX(100px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `;
            document.head.appendChild(notificationStyles);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'notificationSlide 0.3s reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatCategory(category) {
        const categories = {
            'venue': '🏛️ Venue & Location',
            'catering': '🍽️ Catering & Food',
            'entertainment': '🎭 Entertainment',
            'logistics': '📋 Logistics',
            'marketing': '📢 Marketing & PR',
            'client': '👥 Client Communication',
            'vendor': '🤝 Vendor Management',
            'technical': '⚙️ Technical Setup'
        };
        return categories[category] || category;
    }

    formatStatus(status) {
        const statuses = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'completed': 'Completed'
        };
        return statuses[status] || status;
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new EventTaskManager();
});

// Service Worker for offline functionality (optional enhancement)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, but app still works
    });
}