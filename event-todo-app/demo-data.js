// Demo data for EventMaster Pro
// Run this script in browser console to populate with sample tasks

function loadDemoData() {
    const demoTasks = [
        {
            id: 1,
            title: "Confirm venue booking for Johnson wedding",
            eventName: "Johnson Wedding Reception",
            category: "venue",
            priority: "urgent",
            dueDate: "2024-01-15T14:00:00",
            assignee: "Sarah Mitchell",
            status: "pending",
            createdAt: "2024-01-08T09:00:00.000Z",
            completedAt: null
        },
        {
            id: 2,
            title: "Finalize catering menu and dietary requirements",
            eventName: "Johnson Wedding Reception",
            category: "catering",
            priority: "high",
            dueDate: "2024-01-20T12:00:00",
            assignee: "Mark Rodriguez",
            status: "in-progress",
            createdAt: "2024-01-07T14:30:00.000Z",
            completedAt: null
        },
        {
            id: 3,
            title: "Book DJ and sound equipment",
            eventName: "Corporate Annual Gala",
            category: "entertainment",
            priority: "medium",
            dueDate: "2024-01-25T16:00:00",
            assignee: "Lisa Chen",
            status: "completed",
            createdAt: "2024-01-05T11:15:00.000Z",
            completedAt: "2024-01-08T15:45:00.000Z"
        },
        {
            id: 4,
            title: "Design and print event invitations",
            eventName: "Tech Conference 2024",
            category: "marketing",
            priority: "high",
            dueDate: "2024-01-18T10:00:00",
            assignee: "Emma Thompson",
            status: "pending",
            createdAt: "2024-01-06T16:20:00.000Z",
            completedAt: null
        },
        {
            id: 5,
            title: "Coordinate transportation for VIP guests",
            eventName: "Corporate Annual Gala",
            category: "logistics",
            priority: "medium",
            dueDate: "2024-02-01T09:00:00",
            assignee: "James Wilson",
            status: "pending",
            createdAt: "2024-01-07T13:45:00.000Z",
            completedAt: null
        },
        {
            id: 6,
            title: "Set up lighting and AV equipment",
            eventName: "Tech Conference 2024",
            category: "technical",
            priority: "urgent",
            dueDate: "2024-01-22T08:00:00",
            assignee: "Alex Kumar",
            status: "in-progress",
            createdAt: "2024-01-08T10:30:00.000Z",
            completedAt: null
        },
        {
            id: 7,
            title: "Client final approval meeting",
            eventName: "Johnson Wedding Reception",
            category: "client",
            priority: "high",
            dueDate: "2024-01-16T15:00:00",
            assignee: "Sarah Mitchell",
            status: "pending",
            createdAt: "2024-01-08T12:00:00.000Z",
            completedAt: null
        },
        {
            id: 8,
            title: "Coordinate with florist for centerpieces",
            eventName: "Corporate Annual Gala",
            category: "vendor",
            priority: "medium",
            dueDate: "2024-01-28T11:00:00",
            assignee: "Emma Thompson",
            status: "completed",
            createdAt: "2024-01-04T09:20:00.000Z",
            completedAt: "2024-01-07T14:15:00.000Z"
        }
    ];

    // Save to localStorage
    localStorage.setItem('eventTasks', JSON.stringify(demoTasks));
    
    // Reload the page to reflect changes
    window.location.reload();
}

// Auto-load demo data if no tasks exist
if (window.taskManager && window.taskManager.tasks.length === 0) {
    console.log('Loading demo data...');
    loadDemoData();
}

console.log('Demo data script loaded. Run loadDemoData() to populate with sample tasks.');