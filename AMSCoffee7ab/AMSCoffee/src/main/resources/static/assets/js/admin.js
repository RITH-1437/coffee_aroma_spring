// Admin Dashboard JavaScript
{/* <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script> */}
document.addEventListener('DOMContentLoaded', function() {
    // Check admin authentication
    if (!auth.isLoggedIn() || !auth.isAdmin()) {
        window.location.href = '../login.html';
        return;
    }
    
    // Update admin name
    const user = auth.getUser();
    document.querySelector('.admin-name').textContent = user.name;
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentActivity();
    loadLowStockAlerts();
    showSection('dashboard', null);

    // Check for critical stock warnings
    setTimeout(() => {
        checkCriticalStockWarnings();
    }, 2000);
    
    // Add User Form Handler
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }
    
    // Edit User Form Handler
    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
    }
    
    // Add Product Form Handler
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // Add Category Form Handler
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
    
    // Add Testimonial Form Handler
    const testimonialForm = document.getElementById('testimonial-form');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', saveTestimonial);
    }
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
            closeAddUserModal();
            closeEditUserModal();
            closeAddProductModal();
            closeCategoryModal();
            closeTestimonialModal();
        }
    });
});

// Navigation
function showSection(sectionName, clickedElement) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName + '-section').classList.remove('hidden');
    
    // Add active class to clicked link if provided
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        // Find the link for this section and make it active
        const sectionLink = document.querySelector(`[onclick*="showSection('${sectionName}')"]`);
        if (sectionLink) {
            sectionLink.classList.add('active');
        }
    }
    
    // Load section specific data
    switch(sectionName) {
        case 'users':
            loadUsers();
            break;
        case 'products':
            loadProducts();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'contacts':
            loadContactMessages();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'testimonials':
            loadTestimonials();
            break;
        case 'ratings':
            loadRatings();
            break;
    }
}

// Profile menu toggle
function toggleProfileMenu() {
    const menu = document.getElementById('profile-menu');
    menu.classList.toggle('hidden');
}

// Mobile sidebar toggle
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const body = document.body;
    
    sidebar.classList.toggle('mobile-open');
    
    // Add/remove overlay
    if (sidebar.classList.contains('mobile-open')) {
        createMobileOverlay();
    } else {
        removeMobileOverlay();
    }
}

// Create mobile overlay
function createMobileOverlay() {
    // Remove existing overlay first
    removeMobileOverlay();
    
    const overlay = document.createElement('div');
    overlay.className = 'mobile-sidebar-overlay fixed inset-0 bg-black bg-opacity-50 z-35 md:hidden';
    overlay.onclick = closeMobileSidebar;
    document.body.appendChild(overlay);
}

// Remove mobile overlay
function removeMobileOverlay() {
    const overlay = document.querySelector('.mobile-sidebar-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Close mobile sidebar
function closeMobileSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    sidebar.classList.remove('mobile-open');
    removeMobileOverlay();
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('#profile-menu') && !e.target.closest('button[onclick="toggleProfileMenu()"]')) {
        document.getElementById('profile-menu').classList.add('hidden');
    }
});

// Admin logout
function adminLogout() {
    // Show modern logout confirmation modal
    document.getElementById('logoutModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close logout modal
function closeLogoutModal() {
    document.getElementById('logoutModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Confirm logout action
function confirmLogout() {
    storage.remove('user');
    storage.remove('cart');
    showToast('Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.href = '../login.html';
    }, 500);
}

// Load dashboard statistics
async function loadDashboardStats() {
    // If backend is configured, fetch real data
    if (window.API_BASE_URL) {
        try {
            const token = localStorage.getItem('authToken');
            
            // Fetch users from backend
            const usersResponse = await fetch(`${window.API_BASE_URL}/api/users`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                const totalUsers = Array.isArray(users) ? users.length : 0;
                document.getElementById('total-users').textContent = totalUsers;
            } else {
                document.getElementById('total-users').textContent = '0';
            }

            // Fetch categories from backend
            const categoriesResponse = await fetch(`${window.API_BASE_URL}/api/categories`);
            
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                const activeCategories = Array.isArray(categories) ? categories.filter(cat => cat.isActive !== false).length : 0;
                const totalCategoriesElement = document.getElementById('admin-total-categories');
                if (totalCategoriesElement) {
                    totalCategoriesElement.textContent = activeCategories;
                }
                console.log('📊 Dashboard: Found', categories.length, 'categories,', activeCategories, 'active');
            }
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            document.getElementById('total-users').textContent = '0';
        }
        
        // Fetch orders from backend
        try {
            const token = localStorage.getItem('authToken');
            console.log('🔍 Debug - API Base URL:', window.API_BASE_URL);
            console.log('🔍 Debug - Auth token exists:', !!token);
            console.log('🔍 Debug - Full API URL:', `${window.API_BASE_URL}/api/orders/test`);
            
            const statsResponse = await fetch(`${window.API_BASE_URL}/api/orders/stats`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('🔍 Debug - Stats response status:', statsResponse.status);
            console.log('🔍 Debug - Stats response ok:', statsResponse.ok);
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('📊 Raw stats data:', statsData);
                
                const totalOrders = statsData.totalOrders || 0;
                const totalRevenue = statsData.totalRevenue || 0;
                const completedOrders = statsData.completedOrders || 0;
                const orders = statsData.orders || [];
                
                document.getElementById('total-orders').textContent = totalOrders;
                document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
                
                console.log('📊 Dashboard Stats Updated:');
                console.log('  - Total Orders:', totalOrders);
                console.log('  - Completed Orders:', completedOrders);
                console.log('  - Total Revenue:', formatCurrency(totalRevenue));
                
                // Also update recent orders with this data
                updateRecentOrdersDisplay(orders.slice(0, 5));
            } else {
                console.error('❌ Orders API response not ok:', ordersResponse.status, ordersResponse.statusText);
                document.getElementById('total-orders').textContent = '0';
                document.getElementById('total-revenue').textContent = '$0.00';
            }
        } catch (error) {
            console.error('❌ Error loading orders stats:', error);
            document.getElementById('total-orders').textContent = '0';
            document.getElementById('total-revenue').textContent = '$0.00';
        }

        // Fetch products from backend
        try {
            const productsResponse = await fetch(`${window.API_BASE_URL}/api/products`);
            
            if (productsResponse.ok) {
                const products = await productsResponse.json();
                const totalProducts = Array.isArray(products) ? products.length : 0;
                const availableProducts = products.filter(product => product.isAvailable !== false).length;
                const featuredProducts = products.filter(product => product.isFeatured === true).length;
                
                document.getElementById('total-products').textContent = totalProducts;
                
                // Update product stats if elements exist
                const adminTotalProducts = document.getElementById('admin-total-products');
                const adminAvailableProducts = document.getElementById('admin-available-products');
                const adminFeaturedProducts = document.getElementById('admin-featured-products');
                
                if (adminTotalProducts) adminTotalProducts.textContent = totalProducts;
                if (adminAvailableProducts) adminAvailableProducts.textContent = availableProducts;
                if (adminFeaturedProducts) adminFeaturedProducts.textContent = featuredProducts;
                
                console.log('📊 Dashboard: Found', products.length, 'products,', availableProducts, 'available,', featuredProducts, 'featured');
            } else {
                document.getElementById('total-products').textContent = '0';
            }
        } catch (error) {
            console.error('Error loading products stats:', error);
            document.getElementById('total-products').textContent = '0';
        }
        
        return;
    }
    
    // Fallback: Initialize with sample users if none exist
    let users = storage.get('users') || [];
    if (users.length === 0) {
        users = [
            {
                id: 1,
                firstName: 'John',
                lastName: 'Doe',
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1 (555) 123-4567',
                role: 'customer',
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                firstName: 'Admin',
                lastName: 'User',
                name: 'Admin User',
                email: 'admin@cafearoma.com',
                phone: '+1 (555) 987-6543',
                role: 'administrator',
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        storage.set('users', users);
    }
    
    const orders = storage.get('orders') || [];
    const products = getSampleProducts();
    
    // Calculate stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalUsers = users.length;
    const totalProducts = products.length;
    
    // Update UI
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-products').textContent = totalProducts;
}

// Update recent orders display with provided data
function updateRecentOrdersDisplay(orders) {
    const container = document.getElementById('recent-orders');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">No recent orders</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
                <p class="font-medium">${order.orderNumber || 'N/A'}</p>
                <p class="text-sm text-gray-600">${order.customerName || 'Anonymous'}</p>
            </div>
            <div class="text-right">
                <p class="font-medium">${formatCurrency(order.totalAmount || 0)}</p>
                <p class="text-sm text-gray-600">${order.status || 'pending'}</p>
            </div>
        </div>
    `).join('');
    
    console.log('📋 Recent orders display updated with', orders.length, 'orders');
}

// Load recent activity
function loadRecentActivity() {
    loadRecentOrders();
    loadRecentUsers();
}

async function loadRecentOrders() {
    // Check if recent orders are already loaded by dashboard stats
    const recentOrdersContainer = document.getElementById('recent-orders');
    if (recentOrdersContainer && recentOrdersContainer.innerHTML && !recentOrdersContainer.innerHTML.includes('No recent orders')) {
        console.log('📋 Recent orders already loaded by dashboard stats');
        return;
    }
    
    // If backend is configured, fetch from API
    if (window.API_BASE_URL) {
        try {
            const statsResponse = await fetch(`${window.API_BASE_URL}/api/orders/stats`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                const orders = statsData.orders || [];
                const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
                
                updateRecentOrdersDisplay(recentOrders);
                return;
            }
        } catch (error) {
            console.error('❌ Error loading recent orders from API:', error);
        }
    }
    
    // Fallback to localStorage
    const orders = storage.get('orders') || [];
    const recentOrders = orders.slice(-5).reverse();
    
    const container = document.getElementById('recent-orders');
    
    if (recentOrders.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">No recent orders</p>';
        return;
    }
    
    container.innerHTML = recentOrders.map(order => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
                <p class="font-medium">${order.orderNumber || 'N/A'}</p>
                <p class="text-sm text-gray-600">${order.customerName || 'Anonymous'}</p>
            </div>
            <div class="text-right">
                <p class="font-medium">${formatCurrency(order.total || 0)}</p>
                <p class="text-sm text-gray-600">${order.status || 'pending'}</p>
            </div>
        </div>
    `).join('');
}

function loadRecentUsers() {
    // If backend is configured, fetch from there
    if (window.API_BASE_URL) {
        loadRecentUsersFromBackend();
        return;
    }
    
    // Fallback to localStorage
    const users = storage.get('users') || [];
    const recentUsers = users.slice(-5).reverse();
    
    const container = document.getElementById('recent-users');
    
    if (recentUsers.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center">No recent users</p>';
        return;
    }
    
    container.innerHTML = recentUsers.map(user => `
        <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded">
            <div class="bg-coffee-brown text-white w-10 h-10 rounded-full flex items-center justify-center">
                ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
                <p class="font-medium">${user.name || 'Unknown'}</p>
                <p class="text-sm text-gray-600">${user.email || 'No email'}</p>
            </div>
        </div>
    `).join('');
}

async function loadRecentUsersFromBackend() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${window.API_BASE_URL}/api/users`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
            console.error('Failed to fetch users for recent display');
            return;
        }
        
        const users = await response.json();
        const recentUsers = Array.isArray(users) ? users.slice(-5).reverse() : [];
        
        const container = document.getElementById('recent-users');
        
        if (recentUsers.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">No recent users</p>';
            return;
        }
        
        container.innerHTML = recentUsers.map(user => `
            <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                <div class="bg-coffee-brown text-white w-10 h-10 rounded-full flex items-center justify-center">
                    ${user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <p class="font-medium">${(user.firstName || '') + ' ' + (user.lastName || '')}</p>
                    <p class="text-sm text-gray-600">${user.email || 'No email'}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent users:', error);
        const container = document.getElementById('recent-users');
        container.innerHTML = '<p class="text-red-500 text-center">Error loading users</p>';
    }
}

// Contact Management Functions
let allContacts = [];
let filteredContacts = [];
let selectedContacts = new Set();
let currentView = 'list'; // 'list' or 'grid'
let searchTimeout;

// Load contacts from backend or localStorage
async function loadContacts() {
    if (window.API_BASE_URL) {
        await fetchContactsFromBackend();
    } else {
        loadContactsFromLocalStorage();
    }
}

// Fetch contacts from backend API
async function fetchContactsFromBackend() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${window.API_BASE_URL}/api/contacts`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contacts = await response.json();
        allContacts = Array.isArray(contacts) ? contacts : [];
        filteredContacts = [...allContacts];

        console.log('📧 Loaded contacts from backend:', allContacts.length);
        updateContactStats();
        renderContacts();

    } catch (error) {
        console.error('❌ Error loading contacts:', error);
        showToast('Failed to load contacts', 'error');
        loadContactsFromLocalStorage();
    }
}

// Fallback to localStorage
function loadContactsFromLocalStorage() {
    const contacts = storage.get('contacts') || [];
    allContacts = contacts;
    filteredContacts = [...allContacts];
    updateContactStats();
    renderContacts();
}

// Update contact statistics
function updateContactStats() {
    const total = allContacts.length;
    const newContacts = allContacts.filter(c => c.status === 'NEW').length;
    const inProgress = allContacts.filter(c => c.status === 'IN_PROGRESS').length;
    const resolved = allContacts.filter(c => c.status === 'RESOLVED').length;

    document.getElementById('total-contacts').textContent = total;
    document.getElementById('new-contacts').textContent = newContacts;
    document.getElementById('progress-contacts').textContent = inProgress;
    document.getElementById('resolved-contacts').textContent = resolved;

    // Update progress bars
    updateProgressBars(total, newContacts, inProgress, resolved);
}

// Update progress bars in statistics cards
function updateProgressBars(total, newContacts, inProgress, resolved) {
    const totalBar = document.querySelector('#total-contacts').closest('.modern-stat-card').querySelector('.bg-white');
    const newBar = document.querySelector('#new-contacts').closest('.modern-stat-card').querySelector('.bg-white');
    const progressBar = document.querySelector('#progress-contacts').closest('.modern-stat-card').querySelector('.bg-white');
    const resolvedBar = document.querySelector('#resolved-contacts').closest('.modern-stat-card').querySelector('.bg-white');

    if (totalBar) totalBar.style.width = total > 0 ? '85%' : '0%';
    if (newBar) newBar.style.width = total > 0 ? `${(newContacts / total) * 100}%` : '0%';
    if (progressBar) progressBar.style.width = total > 0 ? `${(inProgress / total) * 100}%` : '0%';
    if (resolvedBar) resolvedBar.style.width = total > 0 ? `${(resolved / total) * 100}%` : '0%';
}

// Render contacts based on current view
function renderContacts() {
    if (currentView === 'grid') {
        renderContactsGrid();
    } else {
        renderContactsList();
    }
    updateContactsCount();
}

// Render contacts in list view
function renderContactsList() {
    const container = document.getElementById('contacts-list-view');
    if (!container) return;

    if (filteredContacts.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-gray-500">
                <i class="fas fa-envelope text-4xl mb-4 text-gray-300"></i>
                <h3 class="text-lg font-semibold mb-2">No messages found</h3>
                <p>Messages matching your criteria will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredContacts.map(contact => createContactListItem(contact)).join('');

    // Add checkbox event listeners
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleContactSelection);
    });
}

// Render contacts in grid view
function renderContactsGrid() {
    const container = document.getElementById('contacts-grid');
    const emptyState = document.getElementById('contacts-grid-empty');

    if (filteredContacts.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    container.innerHTML = filteredContacts.map(contact => createContactCard(contact)).join('');

    // Add checkbox event listeners
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleContactSelection);
    });
}

// Create contact list item
function createContactListItem(contact) {
    const statusClass = getStatusClass(contact.status);
    const statusText = getStatusText(contact.status);
    const priorityClass = contact.status === 'NEW' ? 'border-l-red-500' : contact.status === 'IN_PROGRESS' ? 'border-l-yellow-500' : 'border-l-green-500';

    return `
        <div class="p-6 border-l-4 ${priorityClass} bg-white hover:bg-gray-50 transition-colors">
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <input type="checkbox" class="contact-checkbox mt-1" value="${contact.id}" onchange="handleContactSelection(event)">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h4 class="font-semibold text-gray-900">${contact.name || 'Anonymous'}</h4>
                            <span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span>
                            <span class="text-sm text-gray-500">${formatDate(contact.createdAt)}</span>
                        </div>
                        <p class="text-gray-700 mb-2">${contact.email || 'No email'}</p>
                        <p class="text-gray-600 text-sm line-clamp-2">${contact.message || 'No message'}</p>
                        ${contact.phone ? `<p class="text-gray-500 text-sm mt-1"><i class="fas fa-phone mr-1"></i>${contact.phone}</p>` : ''}
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="viewContact(${contact.id})" class="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
                        <i class="fas fa-eye mr-1"></i>View
                    </button>
                    <button onclick="replyToContact(${contact.id})" class="px-3 py-1 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                        <i class="fas fa-reply mr-1"></i>Reply
                    </button>
                    <button onclick="updateContactStatus(${contact.id}, 'RESOLVED')" class="px-3 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded transition-colors">
                        <i class="fas fa-check mr-1"></i>Resolve
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Create contact card for grid view
function createContactCard(contact) {
    const statusClass = getStatusClass(contact.status);
    const statusText = getStatusText(contact.status);
    const priorityClass = contact.status === 'NEW' ? 'border-red-200' : contact.status === 'IN_PROGRESS' ? 'border-yellow-200' : 'border-green-200';

    return `
        <div class="bg-white rounded-lg shadow-md border-2 ${priorityClass} hover:shadow-lg transition-shadow p-6">
            <div class="flex items-start justify-between mb-4">
                <input type="checkbox" class="contact-checkbox" value="${contact.id}" onchange="handleContactSelection(event)">
                <span class="px-2 py-1 text-xs rounded-full ${statusClass}">${statusText}</span>
            </div>

            <div class="mb-4">
                <h4 class="font-semibold text-gray-900 mb-1">${contact.name || 'Anonymous'}</h4>
                <p class="text-gray-600 text-sm mb-2">${contact.email || 'No email'}</p>
                <p class="text-gray-500 text-xs">${formatDate(contact.createdAt)}</p>
            </div>

            <p class="text-gray-700 text-sm mb-4 line-clamp-3">${contact.message || 'No message'}</p>

            <div class="flex space-x-2">
                <button onclick="viewContact(${contact.id})" class="flex-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="replyToContact(${contact.id})" class="flex-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors">
                    <i class="fas fa-reply mr-1"></i>Reply
                </button>
            </div>
        </div>
    `;
}

// Utility functions for status
function getStatusClass(status) {
    switch (status) {
        case 'NEW': return 'bg-red-100 text-red-800';
        case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
        case 'RESOLVED': return 'bg-green-100 text-green-800';
        case 'CLOSED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'NEW': return 'New';
        case 'IN_PROGRESS': return 'In Progress';
        case 'RESOLVED': return 'Resolved';
        case 'CLOSED': return 'Closed';
        default: return 'Unknown';
    }
}

// Handle contact selection for bulk actions
function handleContactSelection(event) {
    const contactId = event.target.value;
    if (event.target.checked) {
        selectedContacts.add(contactId);
    } else {
        selectedContacts.delete(contactId);
    }
    updateBulkActionsVisibility();
}

// Update bulk actions visibility
function updateBulkActionsVisibility() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    const bulkActionsBtn = document.getElementById('bulk-actions-btn');

    if (selectedContacts.size > 0) {
        bulkActionsBar.classList.remove('hidden');
        bulkActionsBtn.classList.remove('hidden');
        document.getElementById('selected-count').textContent = `${selectedContacts.size} message${selectedContacts.size > 1 ? 's' : ''} selected`;
    } else {
        bulkActionsBar.classList.add('hidden');
        bulkActionsBtn.classList.add('hidden');
    }
}

// Toggle between list and grid view
function toggleContactView() {
    const toggleBtn = document.getElementById('view-toggle-btn');
    const listView = document.getElementById('contacts-list-view');
    const gridView = document.getElementById('contacts-grid-view');

    if (currentView === 'list') {
        currentView = 'grid';
        listView.classList.add('hidden');
        gridView.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-list mr-2"></i><span>List View</span>';
    } else {
        currentView = 'list';
        gridView.classList.add('hidden');
        listView.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-th mr-2"></i><span>Grid View</span>';
    }

    renderContacts();
}

// Debounced search function
function debouncedSearchContacts() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchContacts, 300);
}

// Search contacts
function searchContacts() {
    const searchTerm = document.getElementById('contact-search').value.toLowerCase().trim();

    if (!searchTerm) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
            (contact.message && contact.message.toLowerCase().includes(searchTerm)) ||
            (contact.phone && contact.phone.toLowerCase().includes(searchTerm))
        );
    }

    renderContacts();
}

// Filter contacts by status
function filterContactsByStatus() {
    const statusFilter = document.getElementById('contact-status-filter').value;

    if (!statusFilter) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact => contact.status === statusFilter);
    }

    renderContacts();
}

// Filter contacts by date range
function filterContactsByDate() {
    const dateFilter = document.getElementById('contact-date-filter').value;
    const now = new Date();

    if (!dateFilter) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact => {
            const contactDate = new Date(contact.createdAt);
            switch (dateFilter) {
                case 'today':
                    return contactDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return contactDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                    return contactDate >= monthAgo;
                case 'quarter':
                    const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                    return contactDate >= quarterAgo;
                default:
                    return true;
            }
        });
    }

    renderContacts();
}

// Sort contacts
function sortContacts() {
    const sortBy = document.getElementById('contact-sort-filter').value;

    filteredContacts.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);

        switch (sortBy) {
            case 'newest':
                return dateB - dateA;
            case 'oldest':
                return dateA - dateB;
            case 'priority':
                const priorityOrder = { 'NEW': 0, 'IN_PROGRESS': 1, 'RESOLVED': 2, 'CLOSED': 3 };
                const priorityA = priorityOrder[a.status] || 99;
                const priorityB = priorityOrder[b.status] || 99;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return dateB - dateA;
            default:
                return dateB - dateA;
        }
    });

    renderContacts();
}

// Clear all filters
function clearFilters() {
    document.getElementById('contact-search').value = '';
    document.getElementById('contact-status-filter').value = '';
    document.getElementById('contact-date-filter').value = '';
    document.getElementById('contact-sort-filter').value = 'newest';

    filteredContacts = [...allContacts];
    renderContacts();
}

// Update contacts count display
function updateContactsCount() {
    const countElement = document.getElementById('contacts-count');
    if (countElement) {
        countElement.textContent = `${filteredContacts.length} message${filteredContacts.length !== 1 ? 's' : ''}`;
    }
}

// Bulk actions functions
function showBulkActions() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    bulkActionsBar.classList.toggle('hidden');
}

async function bulkUpdateStatus(newStatus) {
    if (selectedContacts.size === 0) {
        showToast('No messages selected', 'warning');
        return;
    }

    const statusText = getStatusText(newStatus);
    const result = await Swal.fire({
        title: `Update ${selectedContacts.size} Message${selectedContacts.size > 1 ? 's' : ''} to ${statusText}?`,
        text: `Are you sure you want to change the status of ${selectedContacts.size} contact message${selectedContacts.size > 1 ? 's' : ''} to ${statusText}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#6c757d',
        confirmButtonText: `Yes, Update ${selectedContacts.size > 1 ? 'Them' : 'It'}`,
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        const count = selectedContacts.size;

        // Show loading state
        Swal.fire({
            title: 'Updating...',
            text: 'Please wait while we update the contact messages.',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Update all selected contacts
            const updatePromises = Array.from(selectedContacts).map(contactId => {
                if (window.API_BASE_URL) {
                    return updateContactStatusBackend(contactId, newStatus);
                } else {
                    updateContactStatusLocal(contactId, newStatus);
                    return Promise.resolve();
                }
            });

            await Promise.all(updatePromises);

            // Update local arrays
            selectedContacts.forEach(contactId => {
                const contact = allContacts.find(c => c.id == contactId);
                if (contact) {
                    contact.status = newStatus;
                }
            });

            // Update statistics
            updateContactStats();

            selectedContacts.clear();
            updateBulkActionsVisibility();

            // Close loading and show success
            Swal.fire({
                title: "Updated!",
                text: `Successfully updated ${count} contact message${count > 1 ? 's' : ''} to ${statusText}.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh the contact list
            renderContacts();

        } catch (error) {
            console.error('Error updating contacts:', error);
            Swal.fire({
                title: "Error!",
                text: "Failed to update some contact messages. Please try again.",
                icon: "error"
            });
        }
    }
}

async function bulkDeleteContacts() {
    if (selectedContacts.size === 0) {
        showToast('No messages selected', 'warning');
        return;
    }

    const result = await Swal.fire({
        title: `Delete ${selectedContacts.size} Message${selectedContacts.size > 1 ? 's' : ''}?`,
        text: `Are you sure you want to permanently delete ${selectedContacts.size} contact message${selectedContacts.size > 1 ? 's' : ''}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: `Yes, Delete ${selectedContacts.size > 1 ? 'Them' : 'It'}`,
        cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
        const count = selectedContacts.size;

        // Show loading state
        Swal.fire({
            title: 'Deleting...',
            text: 'Please wait while we delete the contact messages.',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Delete all selected contacts
            const deletePromises = Array.from(selectedContacts).map(contactId => {
                if (window.API_BASE_URL) {
                    return deleteContactBackend(contactId);
                } else {
                    deleteContactLocal(contactId);
                    return Promise.resolve();
                }
            });

            await Promise.all(deletePromises);

            // Update local arrays
            allContacts = allContacts.filter(c => !selectedContacts.has(c.id));
            filteredContacts = filteredContacts.filter(c => !selectedContacts.has(c.id));

            // Update statistics
            updateContactStats();

            selectedContacts.clear();
            updateBulkActionsVisibility();

            // Close loading and show success
            Swal.fire({
                title: "Deleted!",
                text: `Successfully deleted ${count} contact message${count > 1 ? 's' : ''}.`,
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh the contact list
            renderContacts();

        } catch (error) {
            console.error('Error deleting contacts:', error);
            Swal.fire({
                title: "Error!",
                text: "Failed to delete some contact messages. Please try again.",
                icon: "error"
            });
        }
    }
}

function clearSelection() {
    selectedContacts.clear();
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateBulkActionsVisibility();
}

// Individual contact actions
function viewContact(contactId) {
    const contact = allContacts.find(c => c.id == contactId);
    if (!contact) return;

    // Create a simple modal to view contact details
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-lg font-semibold">Contact Details</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Name</label>
                        <p class="text-gray-900">${contact.name || 'Anonymous'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Email</label>
                        <p class="text-gray-900">${contact.email || 'No email'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Phone</label>
                        <p class="text-gray-900">${contact.phone || 'No phone'}</p>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Status</label>
                        <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(contact.status)}">${getStatusText(contact.status)}</span>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <p class="text-gray-900 whitespace-pre-wrap">${contact.message || 'No message'}</p>
                    </div>
                </div>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>Received: ${formatDate(contact.createdAt)}</span>
                    <div class="flex space-x-2">
                        <button onclick="replyToContact(${contact.id}); this.closest('.fixed').remove()" class="px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded">
                            <i class="fas fa-reply mr-1"></i>Reply
                        </button>
                        <button onclick="updateContactStatus(${contact.id}, 'RESOLVED'); this.closest('.fixed').remove()" class="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded">
                            <i class="fas fa-check mr-1"></i>Resolve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function replyToContact(contactId) {
    const contact = allContacts.find(c => c.id == contactId);
    if (!contact) return;

    // Populate reply modal
    document.getElementById('contact-details').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">From</label>
                <p class="text-gray-900">${contact.name || 'Anonymous'}</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Email</label>
                <p class="text-gray-900">${contact.email || 'No email'}</p>
            </div>
        </div>
        <div class="mt-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Original Message</label>
            <div class="bg-gray-50 p-4 rounded-lg max-h-32 overflow-y-auto">
                <p class="text-gray-900 whitespace-pre-wrap text-sm">${contact.message || 'No message'}</p>
            </div>
        </div>
    `;

    document.getElementById('contact-status').value = contact.status;
    document.getElementById('contactReplyModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function updateContactStatus(contactId, newStatus) {
    // Update in backend or localStorage
    if (window.API_BASE_URL) {
        updateContactStatusBackend(contactId, newStatus);
    } else {
        updateContactStatusLocal(contactId, newStatus);
    }
}

async function updateContactStatusBackend(contactId, newStatus) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast(`Contact status updated to ${getStatusText(newStatus)}`, 'success');
            loadContacts(); // Refresh the list
        } else {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating contact status:', error);
        showToast('Failed to update contact status', 'error');
    }
}

function updateContactStatusLocal(contactId, newStatus) {
    const contacts = storage.get('contacts') || [];
    const contactIndex = contacts.findIndex(c => c.id == contactId);

    if (contactIndex !== -1) {
        contacts[contactIndex].status = newStatus;
        storage.set('contacts', contacts);
        showToast(`Contact status updated to ${getStatusText(newStatus)}`, 'success');
        loadContacts(); // Refresh the list
    }
}

async function deleteContact(contactId) {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this! This will permanently delete the contact message.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
        try {
            // Show loading state
            Swal.fire({
                title: 'Deleting...',
                text: 'Please wait while we delete the contact message.',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading();
                }
            });

            // Perform the actual deletion
            if (window.API_BASE_URL) {
                await deleteContactBackend(contactId);
            } else {
                deleteContactLocal(contactId);
            }

            // Update local arrays
            allContacts = allContacts.filter(c => c.id != contactId);
            filteredContacts = filteredContacts.filter(c => c.id != contactId);

            // Update statistics
            updateContactStats();

            // Close loading and show success
            Swal.fire({
                title: "Deleted!",
                text: "The contact message has been deleted successfully.",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh the contact list
            renderContacts();

        } catch (error) {
            console.error('Error deleting contact:', error);
            Swal.fire({
                title: "Error!",
                text: "Failed to delete the contact message. Please try again.",
                icon: "error"
            });
        }
    }
}

async function deleteContactBackend(contactId) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showToast('Contact deleted successfully', 'success');
        } else {
            throw new Error('Failed to delete contact');
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Failed to delete contact', 'error');
    }
}

function deleteContactLocal(contactId) {
    const contacts = storage.get('contacts') || [];
    const filteredContacts = contacts.filter(c => c.id != contactId);
    storage.set('contacts', filteredContacts);
    showToast('Contact deleted successfully', 'success');
}

// Export contacts functionality
function exportContacts() {
    if (filteredContacts.length === 0) {
        showToast('No contacts to export', 'warning');
        return;
    }

    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Message', 'Status', 'Created At'];
    const csvContent = [
        headers.join(','),
        ...filteredContacts.map(contact => [
            contact.id,
            `"${contact.name || ''}"`,
            `"${contact.email || ''}"`,
            `"${contact.phone || ''}"`,
            `"${(contact.message || '').replace(/"/g, '""')}"`,
            contact.status,
            contact.createdAt
        ].join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast(`Exported ${filteredContacts.length} contacts`, 'success');
}

// Contact Management Functions

// Debounced search function
function debouncedSearchContacts() {
    clearTimeout(window.contactSearchTimeout);
    window.contactSearchTimeout = setTimeout(searchContacts, 300);
}

// Load contacts from backend or localStorage
async function loadContacts() {
    if (window.API_BASE_URL) {
        await fetchContactsFromBackend();
    } else {
        loadContactsFromLocalStorage();
    }
}

// Fetch contacts from backend API
async function fetchContactsFromBackend() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/contacts`);
        if (!response.ok) {
            throw new Error('Failed to fetch contacts');
        }

        const contacts = await response.json();
        allContacts = Array.isArray(contacts) ? contacts : [];
        filteredContacts = [...allContacts];

        updateContactStats();
        renderContacts();
        showToast(`Loaded ${allContacts.length} contact messages`, 'success');
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Failed to load contacts', 'error');
        loadContactsFromLocalStorage();
    }
}

// Load contacts from localStorage (fallback)
function loadContactsFromLocalStorage() {
    const contacts = storage.get('contacts') || [];
    allContacts = contacts;
    filteredContacts = [...allContacts];

    updateContactStats();
    renderContacts();
}

// Update contact statistics
function updateContactStats() {
    const total = allContacts.length;
    const newContacts = allContacts.filter(c => c.status === 'NEW').length;
    const inProgress = allContacts.filter(c => c.status === 'IN_PROGRESS').length;
    const resolved = allContacts.filter(c => c.status === 'RESOLVED').length;

    document.getElementById('total-contacts').textContent = total;
    document.getElementById('new-contacts').textContent = newContacts;
    document.getElementById('progress-contacts').textContent = inProgress;
    document.getElementById('resolved-contacts').textContent = resolved;
}

// Render contacts based on current view
function renderContacts() {
    if (currentView === 'grid') {
        renderContactsGrid();
    } else {
        renderContactsList();
    }
    updateContactsCount();
}

// Render contacts in list view
function renderContactsList() {
    const container = document.getElementById('contacts-list-view');
    const gridView = document.getElementById('contacts-grid-view');

    // Hide grid view, show list view
    gridView.classList.add('hidden');
    container.classList.remove('hidden');

    if (filteredContacts.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16">
                <i class="fas fa-envelope text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">No messages found</h3>
                <p class="text-gray-500">Try adjusting your filters or check back later for new messages.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredContacts.map(contact => createContactListItem(contact)).join('');
}

// Render contacts in grid view
function renderContactsGrid() {
    const container = document.getElementById('contacts-grid');
    const listView = document.getElementById('contacts-list-view');
    const emptyState = document.getElementById('contacts-grid-empty');

    // Hide list view, show grid view
    listView.classList.add('hidden');
    document.getElementById('contacts-grid-view').classList.remove('hidden');

    if (filteredContacts.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    container.innerHTML = filteredContacts.map(contact => createContactCard(contact)).join('');
}

// Create contact list item
function createContactListItem(contact) {
    const statusClass = getStatusClass(contact.status);
    const statusText = getStatusText(contact.status);
    const priorityClass = contact.status === 'NEW' ? 'border-l-yellow-400' : 'border-l-gray-300';
    const isSelected = selectedContacts.has(contact.id);

    return `
        <div class="bg-white rounded-lg shadow-sm border-l-4 ${priorityClass} hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}" data-contact-id="${contact.id}" onclick="toggleContactSelection(${contact.id})">
            <div class="p-6">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <input type="checkbox" ${isSelected ? 'checked' : ''} class="contact-checkbox" data-id="${contact.id}" onchange="toggleContactSelection(${contact.id})">
                            <h4 class="text-lg font-semibold text-gray-900">${contact.name || 'Anonymous'}</h4>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                                ${statusText}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-envelope mr-2 text-gray-400"></i>
                                ${contact.email || 'No email'}
                            </div>
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-phone mr-2 text-gray-400"></i>
                                ${contact.phone || 'No phone'}
                            </div>
                            <div class="flex items-center text-sm text-gray-600">
                                <i class="fas fa-calendar mr-2 text-gray-400"></i>
                                ${formatDate(contact.createdAt)}
                            </div>
                        </div>

                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-1">Subject:</h5>
                            <p class="text-gray-900">${contact.subject || 'No subject'}</p>
                        </div>

                        <div class="mb-4">
                            <h5 class="text-sm font-medium text-gray-700 mb-1">Message:</h5>
                            <p class="text-gray-600 line-clamp-3">${contact.message || 'No message'}</p>
                        </div>

                        ${contact.adminNotes ? `
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <h5 class="text-sm font-medium text-blue-800 mb-1">Admin Notes:</h5>
                                <p class="text-blue-700 text-sm">${contact.adminNotes}</p>
                            </div>
                        ` : ''}
                    </div>

                    <div class="flex flex-col space-y-2 ml-4">
                        <button onclick="event.stopPropagation(); openContactReplyModal(${contact.id})" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                            <i class="fas fa-reply mr-1"></i>Reply
                        </button>
                        <button onclick="event.stopPropagation(); updateContactStatus(${contact.id}, 'IN_PROGRESS')" class="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-sm transition-colors">
                            <i class="fas fa-clock mr-1"></i>In Progress
                        </button>
                        <button onclick="event.stopPropagation(); updateContactStatus(${contact.id}, 'RESOLVED')" class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">
                            <i class="fas fa-check mr-1"></i>Resolve
                        </button>
                        <button onclick="event.stopPropagation(); deleteContact(${contact.id})" class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors">
                            <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Create contact card for grid view
function createContactCard(contact) {
    const statusClass = getStatusClass(contact.status);
    const statusText = getStatusText(contact.status);
    const priorityClass = contact.status === 'NEW' ? 'border-yellow-400' : 'border-gray-300';
    const isSelected = selectedContacts.has(contact.id);

    return `
        <div class="bg-white rounded-lg shadow-sm border-2 ${priorityClass} hover:shadow-md transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500' : ''}" data-contact-id="${contact.id}" onclick="toggleContactSelection(${contact.id})">
            <div class="p-4">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} class="contact-checkbox" data-id="${contact.id}" onchange="toggleContactSelection(${contact.id})">
                        <h4 class="text-lg font-semibold text-gray-900 truncate">${contact.name || 'Anonymous'}</h4>
                    </div>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
                        ${statusText}
                    </span>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-envelope mr-2 text-gray-400"></i>
                        <span class="truncate">${contact.email || 'No email'}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-calendar mr-2 text-gray-400"></i>
                        ${formatDate(contact.createdAt)}
                    </div>
                </div>

                <div class="mb-4">
                    <h5 class="text-sm font-medium text-gray-700 mb-1">Subject:</h5>
                    <p class="text-gray-900 text-sm line-clamp-2">${contact.subject || 'No subject'}</p>
                </div>

                <div class="mb-4">
                    <h5 class="text-sm font-medium text-gray-700 mb-1">Message:</h5>
                    <p class="text-gray-600 text-sm line-clamp-3">${contact.message || 'No message'}</p>
                </div>

                <div class="flex space-x-2">
                    <button onclick="event.stopPropagation(); openContactReplyModal(${contact.id})" class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                        <i class="fas fa-reply mr-1"></i>Reply
                    </button>
                    <button onclick="event.stopPropagation(); updateContactStatus(${contact.id}, 'RESOLVED')" class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors">
                        <i class="fas fa-check mr-1"></i>Resolve
                    </button>
                    <button onclick="event.stopPropagation(); confirmDeleteContact(${contact.id}, '${contact.name || 'this contact'}')" class="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Helper functions for status
function getStatusClass(status) {
    switch (status) {
        case 'NEW': return 'bg-yellow-100 text-yellow-800';
        case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
        case 'RESOLVED': return 'bg-green-100 text-green-800';
        case 'CLOSED': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getStatusText(status) {
    switch (status) {
        case 'NEW': return 'New';
        case 'IN_PROGRESS': return 'In Progress';
        case 'RESOLVED': return 'Resolved';
        case 'CLOSED': return 'Closed';
        default: return 'Unknown';
    }
}

// Toggle contact selection
function toggleContactSelection(contactId) {
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }
    updateBulkActionsVisibility();
    renderContacts(); // Re-render to show selection state
}

// Update bulk actions visibility
function updateBulkActionsVisibility() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    const selectedCount = document.getElementById('selected-count');

    if (selectedContacts.size > 0) {
        bulkActionsBar.classList.remove('hidden');
        selectedCount.textContent = `${selectedContacts.size} message${selectedContacts.size > 1 ? 's' : ''} selected`;
    } else {
        bulkActionsBar.classList.add('hidden');
    }
}

// Clear selection
function clearSelection() {
    selectedContacts.clear();
    updateBulkActionsVisibility();
    renderContacts();
}

// Show bulk actions modal
function showBulkActions() {
    // Implementation for bulk actions modal
    showToast('Bulk actions feature coming soon!', 'info');
}

// Bulk update status
function bulkUpdateStatus(status) {
    selectedContacts.forEach(contactId => {
        updateContactStatus(contactId, status);
    });
    clearSelection();
    showToast(`Updated ${selectedContacts.size} contacts to ${getStatusText(status)}`, 'success');
}

// Bulk delete contacts
function bulkDeleteContacts() {
    if (confirm(`Are you sure you want to delete ${selectedContacts.size} contact message(s)? This action cannot be undone.`)) {
        selectedContacts.forEach(contactId => {
            deleteContact(contactId);
        });
        clearSelection();
        loadContacts();
        showToast(`Deleted ${selectedContacts.size} contact messages`, 'success');
    }
}

// Update contact status
async function updateContactStatus(contactId, status) {
    try {
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update contact status');
            }
        } else {
            // Update in localStorage
            const contacts = storage.get('contacts') || [];
            const contactIndex = contacts.findIndex(c => c.id == contactId);
            if (contactIndex !== -1) {
                contacts[contactIndex].status = status;
                storage.set('contacts', contacts);
            }
        }

        // Update local arrays
        const contact = allContacts.find(c => c.id == contactId);
        if (contact) {
            contact.status = status;
        }

        updateContactStats();
        renderContacts();
        showToast(`Contact status updated to ${getStatusText(status)}`, 'success');
    } catch (error) {
        console.error('Error updating contact status:', error);
        showToast('Failed to update contact status', 'error');
    }
}

// Delete contact
async function deleteContact(contactId) {
    try {
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete contact');
            }
        } else {
            // Delete from localStorage
            const contacts = storage.get('contacts') || [];
            const filteredContacts = contacts.filter(c => c.id != contactId);
            storage.set('contacts', filteredContacts);
        }

        // Update local arrays
        allContacts = allContacts.filter(c => c.id != contactId);
        filteredContacts = filteredContacts.filter(c => c.id != contactId);

        updateContactStats();
        renderContacts();
    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Failed to delete contact', 'error');
    }
}

// Search contacts
function searchContacts() {
    const searchTerm = document.getElementById('contact-search').value.toLowerCase().trim();

    if (!searchTerm) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact =>
            (contact.name && contact.name.toLowerCase().includes(searchTerm)) ||
            (contact.email && contact.email.toLowerCase().includes(searchTerm)) ||
            (contact.subject && contact.subject.toLowerCase().includes(searchTerm)) ||
            (contact.message && contact.message.toLowerCase().includes(searchTerm))
        );
    }

    renderContacts();
}

// Filter contacts by status
function filterContactsByStatus(status) {
    // Update active filter button
    document.querySelectorAll('.admin-filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (!status) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact => contact.status === status);
    }

    renderContacts();
}

// Filter contacts by date
function filterContactsByDate() {
    const dateFilter = document.getElementById('contact-date-filter').value;
    const now = new Date();

    if (!dateFilter) {
        filteredContacts = [...allContacts];
    } else {
        filteredContacts = allContacts.filter(contact => {
            const contactDate = new Date(contact.createdAt);
            const diffTime = now - contactDate;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            switch (dateFilter) {
                case 'today': return diffDays < 1;
                case 'week': return diffDays <= 7;
                case 'month': return diffDays <= 30;
                case 'quarter': return diffDays <= 90;
                default: return true;
            }
        });
    }

    renderContacts();
}

// Sort contacts
function sortContacts() {
    const sortBy = document.getElementById('contact-sort-filter').value;

    filteredContacts.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'priority':
                const priorityOrder = { 'NEW': 0, 'IN_PROGRESS': 1, 'RESOLVED': 2, 'CLOSED': 3 };
                return priorityOrder[a.status] - priorityOrder[b.status];
            default:
                return 0;
        }
    });

    renderContacts();
}

// Clear all filters
function clearFilters() {
    document.getElementById('contact-search').value = '';
    document.getElementById('contact-status-filter').value = '';
    document.getElementById('contact-date-filter').value = '';
    document.getElementById('contact-sort-filter').value = 'newest';

    // Reset active filter button
    document.querySelectorAll('.admin-filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.admin-filter-btn').classList.add('active');

    filteredContacts = [...allContacts];
    renderContacts();
    showToast('Filters cleared', 'info');
}

// Toggle view between list and grid
function toggleContactView() {
    const toggleBtn = document.getElementById('view-toggle-btn');
    const icon = toggleBtn.querySelector('i');
    const span = toggleBtn.querySelector('span');

    if (currentView === 'list') {
        currentView = 'grid';
        icon.className = 'fas fa-list mr-2';
        span.textContent = 'List View';
    } else {
        currentView = 'list';
        icon.className = 'fas fa-th mr-2';
        span.textContent = 'Grid View';
    }

    renderContacts();
}

// Update contacts count display
function updateContactsCount() {
    const countElement = document.getElementById('contacts-count');
    const total = allContacts.length;
    const filtered = filteredContacts.length;

    if (filtered === total) {
        countElement.textContent = `${total} message${total !== 1 ? 's' : ''}`;
    } else {
        countElement.textContent = `${filtered} of ${total} message${total !== 1 ? 's' : ''}`;
    }
}

// Open contact reply modal
function openContactReplyModal(contactId) {
    const contact = allContacts.find(c => c.id == contactId);
    if (!contact) return;

    // Populate modal with contact details
    document.getElementById('contact-details').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <h4 class="font-semibold text-gray-900">From: ${contact.name || 'Anonymous'}</h4>
                <p class="text-sm text-gray-600">Email: ${contact.email || 'No email'}</p>
                <p class="text-sm text-gray-600">Phone: ${contact.phone || 'No phone'}</p>
            </div>
            <div>
                <p class="text-sm text-gray-600">Status: <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(contact.status)}">${getStatusText(contact.status)}</span></p>
                <p class="text-sm text-gray-600">Date: ${formatDate(contact.createdAt)}</p>
            </div>
        </div>
        <div class="mt-4">
            <h5 class="font-semibold text-gray-900">Subject: ${contact.subject || 'No subject'}</h5>
            <p class="text-gray-700 mt-2">${contact.message || 'No message'}</p>
        </div>
    `;

    // Set current status
    document.getElementById('contact-status').value = contact.status;

    // Store contact ID for reply
    document.getElementById('contactReplyModal').dataset.contactId = contactId;

    // Show modal
    document.getElementById('contactReplyModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close contact reply modal
function closeContactReplyModal() {
    document.getElementById('contactReplyModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Handle contact reply form submission
document.addEventListener('DOMContentLoaded', function() {
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const contactId = document.getElementById('contactReplyModal').dataset.contactId;
            const adminReply = document.getElementById('admin-reply').value.trim();
            const adminNotes = document.getElementById('admin-notes').value.trim();
            const status = document.getElementById('contact-status').value;

            if (!adminReply) {
                showToast('Please enter a reply message', 'error');
                return;
            }

            try {
                // Update contact with reply and status
                const updateData = {
                    adminReply,
                    adminNotes,
                    status,
                    repliedAt: new Date().toISOString()
                };

                if (window.API_BASE_URL) {
                    const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}/reply`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(updateData)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send reply');
                    }
                } else {
                    // Update in localStorage
                    const contacts = storage.get('contacts') || [];
                    const contactIndex = contacts.findIndex(c => c.id == contactId);
                    if (contactIndex !== -1) {
                        contacts[contactIndex] = { ...contacts[contactIndex], ...updateData };
                        storage.set('contacts', contacts);
                    }
                }

                // Update local arrays
                const contact = allContacts.find(c => c.id == contactId);
                if (contact) {
                    Object.assign(contact, updateData);
                }

                updateContactStats();
                renderContacts();

                showToast('Reply sent successfully!', 'success');
                closeContactReplyModal();

            } catch (error) {
                console.error('Error sending reply:', error);
                showToast('Failed to send reply', 'error');
            }
        });
    }
});

// Delete Contact Functions
function confirmDeleteContact(contactId, contactName) {
    // Show modern modal window
    document.getElementById('deleteContactModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Update modal content
    document.getElementById('delete-contact-name').textContent = contactName;

    // Store contact info for deletion
    window.contactToDelete = {
        id: contactId,
        name: contactName
    };
}

// Handle delete confirmation
function confirmDeleteContact() {
    if (window.contactToDelete) {
        performDeleteContact(window.contactToDelete.id, window.contactToDelete.name);
    }
}

// Perform the actual deletion
async function performDeleteContact(contactId, contactName) {
    try {
        // Show loading state
        const deleteBtn = document.querySelector('#deleteContactModal button[onclick="confirmDeleteContact()"]');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
        deleteBtn.disabled = true;

        // Perform deletion
        await deleteContact(contactId);

        // Show success message
        showToast(`Contact message from ${contactName} has been permanently deleted`, 'success');

        // Close modal
        closeDeleteContactModal();

        // Refresh contacts list
        loadContacts();

    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast('Failed to delete contact message', 'error');

        // Reset button state
        const deleteBtn = document.querySelector('#deleteContactModal button[onclick="confirmDeleteContact()"]');
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i>Delete Permanently';
        deleteBtn.disabled = false;
    }
}

// Close delete contact modal
function closeDeleteContactModal() {
    document.getElementById('deleteContactModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Enhanced deleteContact function with animations
async function deleteContact(contactId) {
    try {
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/contacts/${contactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete contact');
            }
        } else {
            // Delete from localStorage
            const contacts = storage.get('contacts') || [];
            const filteredContacts = contacts.filter(c => c.id != contactId);
            storage.set('contacts', filteredContacts);
        }

        // Update local arrays with animation
        const contactElement = document.querySelector(`[data-contact-id="${contactId}"]`);
        if (contactElement) {
            // Add fade out animation
            contactElement.style.transition = 'all 0.3s ease-out';
            contactElement.style.opacity = '0';
            contactElement.style.transform = 'translateX(-20px)';

            // Remove element after animation
            setTimeout(() => {
                contactElement.remove();
            }, 300);
        }

        // Update local arrays
        allContacts = allContacts.filter(c => c.id != contactId);
        filteredContacts = filteredContacts.filter(c => c.id != contactId);

        // Update statistics
        updateContactStats();

    } catch (error) {
        console.error('Error deleting contact:', error);
        throw error;
    }
}

// Export contacts functionality
async function exportContacts() {
    if (filteredContacts.length === 0) {
        showToast('No contacts to export', 'warning');
        return;
    }

    try {
        // Prepare CSV data
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Created At', 'Admin Reply', 'Admin Notes'];
        const csvData = [headers];

        filteredContacts.forEach(contact => {
            csvData.push([
                contact.id || '',
                contact.name || '',
                contact.email || '',
                contact.phone || '',
                contact.subject || '',
                contact.message || '',
                contact.status || '',
                formatDate(contact.createdAt) || '',
                contact.adminReply || '',
                contact.adminNotes || ''
            ]);
        });

        // Convert to CSV string
        const csvString = csvData.map(row =>
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        // Download CSV file
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showToast(`Exported ${filteredContacts.length} contacts successfully!`, 'success');

    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export contacts', 'error');
    }
}

// Users Management
function loadUsers() {
    // If API_BASE_URL is configured, fetch users from backend; otherwise use local storage
    if (window.API_BASE_URL) {
        fetchUsersFromBackend();
        return;
    }

    const users = storage.get('users') || [];
    allUsers = users; // Store all users for filtering
    const tableBody = document.getElementById('users-table');

    console.log('Loading users:', users.length, 'users found');
    console.log('Users data:', users);

    // Use the same render function as backend for consistency
    renderUsersTable(users);
}

// Products Management
async function loadProducts() {
    if (window.API_BASE_URL) {
        await fetchProductsFromBackend();
    } else {
        // Fallback to local storage
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        
        const container = document.getElementById('products-grid');
        const emptyState = document.getElementById('products-empty-state');
        
        // Update stats
        updateProductStats(products);
        
        if (products.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        container.innerHTML = products.map(product => createAdminProductCard(product)).join('');
    }
}

// Fetch products from backend API
async function fetchProductsFromBackend() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/products`);
        
        if (!response.ok) {
            console.error('Failed to fetch products:', response.status);
            showToast('Failed to load products', 'error');
            return;
        }

        const products = await response.json();
        console.log('🛍️ Loaded products from backend:', products.length);
        
        const container = document.getElementById('products-grid');
        const emptyState = document.getElementById('products-empty-state');
        
        // Update stats
        updateProductStats(products);
        
        if (products.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }
        
        container.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        container.innerHTML = products.map(product => createAdminProductCard(product)).join('');
        
    } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Network error while loading products', 'error');
        // Fallback to local data
        const products = getSampleProducts();
        const container = document.getElementById('products-grid');
        const emptyState = document.getElementById('products-empty-state');
        
        updateProductStats(products);
        
        if (products.length === 0) {
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            container.classList.remove('hidden');
            emptyState.classList.add('hidden');
            container.innerHTML = products.map(product => createAdminProductCard(product)).join('');
        }
    }
}

function createAdminProductCard(product) {
    // Handle both backend and frontend data structures
    const isAvailable = product.isAvailable !== false;
    const isFeatured = product.isFeatured === true;
    const statusClass = isAvailable ? 'available' : 'unavailable';
    const statusText = isAvailable ? 'Available' : 'Unavailable';
    const categoryName = getCategoryName(product.categoryId) || product.category || 'Unknown';
    const stockQuantity = product.stockQuantity || 0;
    const isLowStock = stockQuantity < 30 && stockQuantity > 0;

    return `
        <div class="admin-elegant-product-card" data-category="${categoryName}" data-status="${statusClass}">
            <div class="admin-product-image-container">
                <img src="${product.image || product.imageUrl}"
                     alt="${product.name}"
                     class="admin-product-image"
                     onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format'">

                <div class="admin-price-badge">
                    ${formatCurrency(product.price)}
                </div>

                <div class="admin-product-status-badge ${statusClass}">
                    ${statusText}
                </div>

                ${isFeatured ? '<div class="admin-product-status-badge featured" style="top: 52px; left: 12px;">Featured</div>' : ''}
                ${isLowStock ? '<div class="admin-product-status-badge low-stock" style="top: 52px; right: 12px; background: #f59e0b;">Low Stock</div>' : ''}
            </div>

            <div class="admin-product-content">
                <div class="admin-product-category">${categoryName}</div>

                <h4 class="admin-product-title">${product.name}</h4>

                <p class="admin-product-description">
                    ${product.description || 'No description available'}
                </p>

                <div class="admin-product-meta">
                    <div class="admin-product-meta-item">
                        <div class="admin-product-meta-label">Stock</div>
                        <div class="admin-product-meta-value ${stockQuantity <= 10 ? 'text-red-600 font-bold' : stockQuantity < 30 ? 'text-orange-600 font-semibold' : ''}">${stockQuantity}</div>
                    </div>
                    <div class="admin-product-meta-item">
                        <div class="admin-product-meta-label">Prep Time</div>
                        <div class="admin-product-meta-value">${product.preparationTime || 5}m</div>
                    </div>
                    <div class="admin-product-meta-item">
                        <div class="admin-product-meta-label">Calories</div>
                        <div class="admin-product-meta-value">${product.calories || 'N/A'}</div>
                    </div>
                </div>

                <div class="admin-product-actions">
                    <button onclick="editProduct(${product.id})" class="admin-action-btn admin-edit-btn" title="Edit Product">
                        <i class="fas fa-edit"></i>
                        <span>Edit</span>
                    </button>
                    <button onclick="toggleProductAvailability(${product.id})" class="admin-action-btn admin-toggle-btn" title="Toggle Availability">
                        <i class="fas fa-${isAvailable ? 'eye-slash' : 'eye'}"></i>
                        <span>${isAvailable ? 'Hide' : 'Show'}</span>
                    </button>
                    ${isLowStock ? `
                        <button onclick="quickRestock(${product.id}, ${stockQuantity <= 10 ? 50 : 30})" class="admin-action-btn admin-restock-btn" title="Restock Product" style="background: #10b981; color: white;">
                            <i class="fas fa-plus"></i>
                            <span>Restock</span>
                        </button>
                    ` : ''}
                    <button onclick="deleteProduct(${product.id})" class="admin-action-btn admin-delete-btn" title="Delete Product">
                        <i class="fas fa-trash"></i>
                        <span>Delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}



function updateProductStats(products) {
    const totalProducts = products.length;
    const availableProducts = products.filter(p => p.isAvailable).length;
    const featuredProducts = products.filter(p => p.isFeatured).length;
    
    const totalEl = document.getElementById('admin-total-products');
    const availableEl = document.getElementById('admin-available-products');
    const featuredEl = document.getElementById('admin-featured-products');
    
    if (totalEl) totalEl.textContent = totalProducts;
    if (availableEl) availableEl.textContent = availableProducts;
    if (featuredEl) featuredEl.textContent = featuredProducts;
}

// Product filtering functions
function filterAdminProducts(category) {
    const products = document.querySelectorAll('.admin-elegant-product-card');
    const filterBtns = document.querySelectorAll('.admin-filter-btn');
    
    // Update active button
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    products.forEach(product => {
        if (category === 'all' || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Product search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearchInput');
    const statusFilter = document.getElementById('productStatusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterProductsBySearch();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterProductsBySearch();
        });
    }
});

function filterProductsBySearch() {
    const searchTerm = document.getElementById('productSearchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('productStatusFilter')?.value || 'all';
    const products = document.querySelectorAll('.admin-elegant-product-card');
    
    products.forEach(product => {
        const productName = product.querySelector('.admin-product-title')?.textContent.toLowerCase() || '';
        const productCategory = product.querySelector('.admin-product-category')?.textContent.toLowerCase() || '';
        const productStatus = product.dataset.status || '';
        
        const matchesSearch = productName.includes(searchTerm) || productCategory.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'available' && productStatus === 'available') ||
                            (statusFilter === 'unavailable' && productStatus === 'unavailable') ||
                            (statusFilter === 'featured' && product.querySelector('.admin-product-status-badge.featured'));
        
        if (matchesSearch && matchesStatus) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

// Toggle product availability
async function toggleProductAvailability(productId) {
    // If backend is configured, use API
    if (window.API_BASE_URL) {
        await toggleProductAvailabilityBackend(productId);
        return;
    }

    // Fallback to localStorage
    let products = storage.get('products') || [];
    if (products.length === 0) {
        products = getSampleProducts();
    }

    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        const currentStatus = products[productIndex].isAvailable;
        products[productIndex].isAvailable = !currentStatus;
        storage.set('products', products);

        const statusText = products[productIndex].isAvailable ? 'available' : 'unavailable';
        showToast(`Product is now ${statusText}`, 'success');
        loadProducts();
        loadDashboardStats();
    }
}

// Toggle product availability via backend API
async function toggleProductAvailabilityBackend(productId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        // First, get the current product to know its status
        const getResponse = await fetch(`${window.API_BASE_URL}/api/products/${productId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!getResponse.ok) {
            showToast('Failed to get product status', 'error');
            return;
        }

        const product = await getResponse.json();
        const newAvailability = !product.isAvailable;

        // Update the product availability
        const updateResponse = await fetch(`${window.API_BASE_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                ...product,
                isAvailable: newAvailability
            })
        });

        if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            showToast(errorText || 'Failed to update product availability', 'error');
            return;
        }

        const statusText = newAvailability ? 'available' : 'unavailable';
        showToast(`Product is now ${statusText}`, 'success');
        await loadProducts(); // Refresh products list
        loadDashboardStats();

    } catch (error) {
        console.error('Error toggling product availability:', error);
        showToast('Network error while updating product', 'error');
    }
}

// Orders Management
async function loadOrders() {
    console.log('🔄 Loading orders...');
    try {
        // Temporarily bypass authentication for testing
        const token = localStorage.getItem('authToken') || 'test-token';
        
        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/all` : '/api/orders/all';
        console.log('🌐 Making API call to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 API response status:', response.status);
        
        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const orders = await response.json();
        console.log('📋 Received orders:', orders);
        
        displayOrdersInTable(orders);
        
    } catch (error) {
        console.error('❌ Error loading orders:', error);
        showToast('Failed to load orders. Please try again.', 'error');
        
        const tableBody = document.getElementById('orders-table');
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                    Failed to load orders. Please refresh the page.
                </td>
            </tr>
        `;
    }
}



// Helper functions for orders

// Display orders in the table
function displayOrdersInTable(orders) {
    console.log('🎯 Displaying', orders.length, 'orders in table');
    const tableBody = document.getElementById('orders-table');
    
    if (!tableBody) {
        console.error('❌ orders-table element not found!');
        return;
    }
    
    if (orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No orders found
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = orders.map(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }) : 'N/A';
        
        return `
            <tr class="border-b border-gray-200 hover:bg-gray-50" data-order-id="${order.id}">
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">#${order.orderNumber || order.id}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${order.customerName || 'N/A'}</td>
                <td class="px-6 py-4 text-sm text-gray-500">${order.customerEmail || 'N/A'}</td>
                <td class="px-6 py-4 text-sm text-gray-900 font-medium">$${(order.totalAmount || 0).toFixed(2)}</td>
                <td class="px-6 py-4">
                    <select onchange="updateOrderStatus(${order.id}, this.value)" 
                            class="text-sm border rounded px-2 py-1 ${getStatusBadgeClass(order.status)}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${orderDate}</td>
                <td class="px-6 py-4 text-sm font-medium">
                    <button onclick="viewOrderDetails(${order.id})" class="text-blue-600 hover:text-blue-900 mr-2 px-2 py-1 rounded">👁️ View</button>
                    <button onclick="editOrder(${order.id})" class="text-green-600 hover:text-green-900 mr-2 px-2 py-1 rounded">📝 Edit</button>
                    <button onclick="deleteOrder(${order.id})" class="text-red-600 hover:text-red-900 px-2 py-1 rounded">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ Orders displayed successfully');
}

function getOrderTypeColor(orderType) {
    switch (orderType) {
        case 'pickup':
            return 'bg-blue-100 text-blue-800';
        case 'delivery':
            return 'bg-green-100 text-green-800';
        case 'dine_in':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function formatOrderType(orderType) {
    switch (orderType) {
        case 'pickup':
            return 'Pickup';
        case 'delivery':
            return 'Delivery';
        case 'dine_in':
            return 'Dine In';
        default:
            return orderType || 'Unknown';
    }
}

function getNextStatus(currentStatus) {
    const statusFlow = {
        'pending': 'preparing',
        'preparing': 'ready',
        'ready': 'completed',
        'completed': 'completed'
    };
    return statusFlow[currentStatus] || 'pending';
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const order = await response.json();
        
        // Create order details modal
        const modalHTML = `
            <div id="orderModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
                    <div class="mt-3">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-medium text-gray-900">Order Details - #${order.orderNumber}</h3>
                            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                                <span class="sr-only">Close</span>
                                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Customer</label>
                                <p class="text-sm text-gray-900">${order.customerName}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Email</label>
                                <p class="text-sm text-gray-900">${order.customerEmail}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Phone</label>
                                <p class="text-sm text-gray-900">${order.customerPhone || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Order Type</label>
                                <p class="text-sm text-gray-900">${order.orderType}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Status</label>
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}">
                                    ${order.status.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Payment Status</label>
                                <p class="text-sm text-gray-900">${order.paymentStatus}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Subtotal</label>
                                <p class="text-sm text-gray-900">$${order.subtotal.toFixed(2)}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Total Amount</label>
                                <p class="text-sm text-gray-900 font-medium">$${order.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                        
                        ${order.specialInstructions ? `
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700">Special Instructions</label>
                                <p class="text-sm text-gray-900">${order.specialInstructions}</p>
                            </div>
                        ` : ''}
                        
                        ${order.deliveryAddress ? `
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-700">Delivery Address</label>
                                <p class="text-sm text-gray-900">${order.deliveryAddress}</p>
                            </div>
                        ` : ''}
                        
                        <div class="flex justify-end">
                            <button onclick="closeModal()" class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Close</button>
                            <button onclick="updateOrderStatusUI(${order.id}, '${order.status}')" class="bg-blue-500 text-white px-4 py-2 rounded">Edit Status</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error viewing order:', error);
        showToast('Failed to load order details', 'error');
    }
}

// Update order status with UI
async function updateOrderStatusUI(orderId, currentStatus) {
    const statusOptions = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    
    const modalHTML = `
        <div id="statusModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Update Order Status</h3>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Current Status: ${currentStatus}</label>
                        <select id="newStatus" class="w-full border border-gray-300 rounded-md px-3 py-2">
                            ${statusOptions.map(status => 
                                `<option value="${status}" ${status === currentStatus ? 'selected' : ''}>${status.toUpperCase()}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="flex justify-end">
                        <button onclick="closeStatusModal()" class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                        <button onclick="saveOrderStatus(${orderId})" class="bg-green-500 text-white px-4 py-2 rounded">Update</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Save the updated order status
async function saveOrderStatus(orderId) {
    const newStatus = document.getElementById('newStatus').value;
    
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        closeStatusModal();
        showToast('Order status updated successfully', 'success');
        loadOrders(); // Reload the orders table
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Failed to update order status', 'error');
    }
}

// Confirm delete order
function confirmDeleteOrder(orderId) {
    const modalHTML = `
        <div id="deleteModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Delete Order</h3>
                    <p class="text-sm text-gray-600 mb-4">Are you sure you want to delete this order? This action cannot be undone.</p>
                    
                    <div class="flex justify-end">
                        <button onclick="closeDeleteModal()" class="bg-gray-500 text-white px-4 py-2 rounded mr-2">Cancel</button>
                        <button onclick="executeDeleteOrder(${orderId})" class="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Execute order deletion
async function executeDeleteOrder(orderId) {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        closeDeleteModal();
        showToast('Order deleted successfully', 'success');
        loadOrders(); // Reload the orders table
        
    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Failed to delete order', 'error');
    }
}

// Modal helper functions
function closeModal() {
    const modal = document.getElementById('orderModal');
    if (modal) modal.remove();
}

function closeStatusModal() {
    const modal = document.getElementById('statusModal');
    if (modal) modal.remove();
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    if (modal) modal.remove();
}

function getStatusColor(status) {
    switch (status) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'confirmed':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'preparing':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'ready':
            return 'bg-green-100 text-green-800 border-green-200';
        case 'completed':
            return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'cancelled':
            return 'bg-red-100 text-red-800 border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
}

// Update order status via API
async function updateOrderStatus(orderId, newStatus) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/${orderId}/status` : `/api/orders/${orderId}/status`;
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to update order status', 'error');
            return;
        }

        const updatedOrder = await response.json();
        showToast('Order status updated successfully!', 'success');
        await loadOrders(); // Refresh orders list

    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Network error while updating order status', 'error');
    }
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('authToken') || 'test-token';

        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/${orderId}` : `/api/orders/${orderId}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            showToast('Failed to load order details', 'error');
            return;
        }

        const order = await response.json();
        
        // Display order details in a modal or alert
        let details = `Order Details:\n\n`;
        details += `Order Number: ${order.orderNumber}\n`;
        details += `Customer: ${order.customerName}\n`;
        details += `Email: ${order.customerEmail}\n`;
        details += `Phone: ${order.customerPhone || 'N/A'}\n`;
        details += `Order Type: ${order.orderType}\n`;
        details += `Status: ${order.status}\n`;
        details += `Total Amount: $${order.totalAmount}\n`;
        details += `Payment Status: ${order.paymentStatus}\n`;
        details += `Payment Method: ${order.paymentMethod || 'N/A'}\n`;
        details += `Created: ${new Date(order.createdAt).toLocaleString()}\n`;
        if (order.specialInstructions) {
            details += `Special Instructions: ${order.specialInstructions}\n`;
        }
        if (order.deliveryAddress) {
            details += `Delivery Address: ${order.deliveryAddress}\n`;
        }
        
        alert(details);

    } catch (error) {
        console.error('Error viewing order details:', error);
        showToast('Network error while loading order details', 'error');
    }
}

// Show order details in a modal
function showOrderDetailsModal(order) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-lg font-semibold">Order Details - ${order.orderNumber}</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Customer Information</h4>
                        <p><strong>Name:</strong> ${order.customerName}</p>
                        <p><strong>Email:</strong> ${order.customerEmail}</p>
                        ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Order Information</h4>
                        <p><strong>Type:</strong> ${formatOrderType(order.orderType)}</p>
                        <p><strong>Status:</strong> <span class="px-2 py-1 rounded text-sm ${getStatusColor(order.status)}">${order.status}</span></p>
                        <p><strong>Payment:</strong> ${order.paymentStatus} (${order.paymentMethod || 'N/A'})</p>
                    </div>
                </div>
                
                ${order.deliveryAddress ? `
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Delivery Address</h4>
                        <p>${order.deliveryAddress}</p>
                    </div>
                ` : ''}
                
                ${order.specialInstructions ? `
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-2">Special Instructions</h4>
                        <p>${order.specialInstructions}</p>
                    </div>
                ` : ''}
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Order Summary</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(order.subtotal || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span>Tax:</span>
                            <span>${formatCurrency(order.taxAmount || 0)}</span>
                        </div>
                        ${order.deliveryFee > 0 ? `
                            <div class="flex justify-between">
                                <span>Delivery Fee:</span>
                                <span>${formatCurrency(order.deliveryFee)}</span>
                            </div>
                        ` : ''}
                        <div class="flex justify-between font-bold border-t pt-2">
                            <span>Total:</span>
                            <span>${formatCurrency(order.totalAmount || 0)}</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-gray-900 mb-2">Order Date</h4>
                    <p>${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 p-6 border-t">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Edit order function - opens a modern status update modal
async function editOrder(orderId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        // Get current order details
        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/${orderId}` : `/api/orders/${orderId}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            showToast('Failed to load order details', 'error');
            return;
        }

        const order = await response.json();

        // Create modern status update modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'edit-order-modal';

        const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-edit text-blue-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Update Order Status</h3>
                    <p class="text-gray-600 text-center mb-6">Order #${order.orderNumber || order.id}</p>

                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                        <div class="px-3 py-2 bg-gray-100 rounded-lg text-center font-medium text-gray-700">
                            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                    </div>

                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                        <select id="new-order-status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            ${statusOptions.map(status =>
                                `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="flex space-x-3">
                        <button id="cancel-edit-order" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                            Cancel
                        </button>
                        <button id="confirm-edit-order" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                            Update Status
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add animation
        setTimeout(() => {
            modal.querySelector('.animate-in').classList.remove('scale-95');
            modal.querySelector('.animate-in').classList.add('scale-100');
        }, 10);

        // Event listeners
        document.getElementById('cancel-edit-order').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.remove(), 300);
        });

        document.getElementById('confirm-edit-order').addEventListener('click', async () => {
            const newStatus = document.getElementById('new-order-status').value;
            if (newStatus !== order.status) {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    updateOrderStatus(orderId, newStatus);
                }, 300);
            } else {
                modal.classList.add('opacity-0');
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('opacity-0');
                setTimeout(() => modal.remove(), 300);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.classList.add('opacity-0');
                setTimeout(() => modal.remove(), 300);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

    } catch (error) {
        console.error('Error editing order:', error);
        showToast('Network error while loading order details', 'error');
    }
}

// Delete order
async function deleteOrder(orderId) {
    // Use modern confirmation modal instead of browser confirm
    const confirmed = await showModernConfirm(
        'Are you sure you want to delete this order? This action cannot be undone and will permanently remove the order and all associated data.',
        'Delete Order',
        'Delete Order',
        'Cancel'
    );

    if (!confirmed) return;

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/${orderId}` : `/api/orders/${orderId}`;
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to delete order', 'error');
            return;
        }

        showToast('Order deleted successfully!', 'success');
        await loadOrders(); // Refresh orders list
        loadDashboardStats(); // Update dashboard stats

    } catch (error) {
        console.error('Error deleting order:', error);
        showToast('Network error while deleting order', 'error');
    }
}

// Contact Messages - Enhanced Backend Integration
let currentContactId = null;

async function loadContacts() {
    try {
        // Load contact statistics with enhanced error handling
        try {
            const statsResponse = await fetch('http://localhost:8080/api/contacts/stats');
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                updateContactStats(stats);
            } else {
                console.warn('Could not load contact stats, using fallback');
                updateContactStats({ total: 0, new: 0, inProgress: 0, resolved: 0 });
            }
        } catch (statsError) {
            console.warn('Stats loading failed:', statsError);
            updateContactStats({ total: 0, new: 0, inProgress: 0, resolved: 0 });
        }

        // Load all contacts
        const contactsResponse = await fetch('http://localhost:8080/api/contacts');
        const contacts = await contactsResponse.json();

        if (contactsResponse.ok) {
            allContacts = contacts;
            filteredContacts = [...allContacts]; // Initialize filtered contacts

            // Apply initial sorting (newest first)
            sortContacts();

            // Clear any selections when loading new data
            clearSelection();

            console.log(`📧 Loaded ${contacts.length} contact messages`);
        } else {
            throw new Error('Failed to load contacts');
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Failed to load contacts', 'error');

        // Show error state in both views
        const listView = document.getElementById('contacts-list-view');
        const gridView = document.getElementById('contacts-grid-view');
        const gridContainer = document.getElementById('contacts-grid');
        const emptyState = document.getElementById('contacts-grid-empty');

        if (currentContactView === 'grid') {
            gridContainer.classList.add('hidden');
            emptyState.classList.remove('hidden');
            emptyState.innerHTML = `
                <i class="fas fa-exclamation-triangle text-red-400 text-6xl mb-4"></i>
                <h3 class="text-xl font-semibold text-red-600 mb-2">Failed to load messages</h3>
                <p class="text-red-500 mb-4">Unable to connect to the server. Please try again.</p>
                <button onclick="loadContacts()" class="btn-coffee">
                    <i class="fas fa-refresh mr-2"></i>Retry
                </button>
            `;
        } else {
            listView.innerHTML = `
                <div class="p-6 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h3 class="text-xl font-semibold mb-2">Failed to load messages</h3>
                    <p class="mb-4">Unable to connect to the server. Please try again.</p>
                    <button onclick="loadContacts()" class="btn-coffee">
                        <i class="fas fa-refresh mr-2"></i>Retry
                    </button>
                </div>
            `;
        }
    }
}

// Enhanced statistics update function
function updateContactStats(stats) {
    const elements = {
        'total-contacts': stats.total || 0,
        'new-contacts': stats.new || 0,
        'progress-contacts': stats.inProgress || 0,
        'resolved-contacts': stats.resolved || 0
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;

            // Add visual indicators for changes
            if (value > 0) {
                element.classList.add('font-bold');
                // Add a subtle animation
                element.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    element.style.animation = '';
                }, 500);
            }
        }
    });

    console.log('📊 Contact stats updated:', stats);
}

// Global variables for contact management
let currentContactView = 'list'; // 'list' or 'grid'
let currentContactStatusFilter = ''; // Current status filter

// Toggle between list and grid view
function toggleContactView() {
    const gridView = document.getElementById('contacts-grid-view');
    const listView = document.getElementById('contacts-list-view');
    const toggleBtn = document.getElementById('view-toggle-btn');
    const toggleIcon = toggleBtn.querySelector('i');
    const toggleText = toggleBtn.querySelector('span');

    if (currentContactView === 'list') {
        // Switch to grid view
        currentContactView = 'grid';
        gridView.classList.remove('hidden');
        listView.classList.add('hidden');
        toggleIcon.className = 'fas fa-list mr-2';
        toggleText.textContent = 'List View';
    } else {
        // Switch to list view
        currentContactView = 'list';
        gridView.classList.add('hidden');
        listView.classList.remove('hidden');
        toggleIcon.className = 'fas fa-th mr-2';
        toggleText.textContent = 'Grid View';
    }

    // Re-render current contacts in new view
    if (filteredContacts.length > 0) {
        displayContacts(filteredContacts);
    }
}

// Enhanced contact filtering functions
function filterContactsByStatus(status) {
    // Update active filter button
    document.querySelectorAll('.contact-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filter contacts
    if (status === '') {
        filteredContacts = allContacts;
    } else {
        filteredContacts = allContacts.filter(contact => contact.status === status);
    }

    displayContacts(filteredContacts);
    updateContactsCount();
}

// Search contacts
function searchContacts() {
    const searchTerm = document.getElementById('contact-search').value.toLowerCase().trim();

    if (!searchTerm) {
        filteredContacts = allContacts;
    } else {
        filteredContacts = allContacts.filter(contact =>
            contact.name.toLowerCase().includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm) ||
            contact.subject.toLowerCase().includes(searchTerm) ||
            contact.message.toLowerCase().includes(searchTerm)
        );
    }

    displayContacts(filteredContacts);
    updateContactsCount();
}

// Sort contacts
function sortContacts() {
    const sortBy = document.getElementById('contact-sort-filter').value;

    filteredContacts.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'priority':
                // Priority: NEW > IN_PROGRESS > RESOLVED > CLOSED
                const priorityOrder = { 'NEW': 4, 'IN_PROGRESS': 3, 'RESOLVED': 2, 'CLOSED': 1 };
                return (priorityOrder[b.status] || 0) - (priorityOrder[a.status] || 0);
            default:
                return 0;
        }
    });

    displayContacts(filteredContacts);
}

// Update contacts count display
function updateContactsCount() {
    const countElement = document.getElementById('contacts-count');
    if (countElement) {
        countElement.textContent = `${filteredContacts.length} message${filteredContacts.length !== 1 ? 's' : ''}`;
    }
}

// Enhanced displayContacts function with grid and list views
function displayContacts(contacts) {
    filteredContacts = contacts || allContacts;

    // Update count
    updateContactsCount();

    if (currentContactView === 'grid') {
        displayContactsGrid(filteredContacts);
    } else {
        displayContactsList(filteredContacts);
    }
}

// Display contacts in grid view
function displayContactsGrid(contacts) {
    const gridContainer = document.getElementById('contacts-grid');
    const emptyState = document.getElementById('contacts-grid-empty');

    if (contacts.length === 0) {
        gridContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    gridContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    gridContainer.innerHTML = contacts.map(contact => `
        <div class="contact-card-modern bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 overflow-hidden">
            <!-- Card Header -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-coffee-brown to-coffee-dark rounded-full flex items-center justify-center text-white font-bold text-lg">
                            ${contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-lg text-gray-900">${contact.name}</h4>
                            <p class="text-sm text-gray-600">${contact.email}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" class="contact-checkbox w-4 h-4 text-coffee-brown border-gray-300 rounded focus:ring-coffee-brown"
                               data-contact-id="${contact.id}" onchange="toggleContactSelection(${contact.id})">
                        <span class="px-3 py-1 text-xs font-semibold rounded-full ${getContactStatusColor(contact.status)}">
                            ${contact.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                <div class="space-y-2">
                    <div class="flex items-center text-sm text-gray-600">
                        <i class="fas fa-tag mr-2 text-coffee-brown"></i>
                        <span class="font-medium">Subject:</span>
                        <span class="ml-1">${contact.subject}</span>
                    </div>
                    ${contact.phone ? `
                        <div class="flex items-center text-sm text-gray-600">
                            <i class="fas fa-phone mr-2 text-coffee-brown"></i>
                            <span>${contact.phone}</span>
                        </div>
                    ` : ''}
                    <div class="flex items-center text-sm text-gray-500">
                        <i class="fas fa-calendar mr-2"></i>
                        <span>${new Date(contact.createdAt).toLocaleDateString()}</span>
                        <span class="mx-2">•</span>
                        <span>${new Date(contact.createdAt).toLocaleTimeString()}</span>
                    </div>
                </div>
            </div>

            <!-- Card Body -->
            <div class="p-6">
                <div class="mb-4">
                    <p class="text-gray-700 line-clamp-3">${contact.message}</p>
                </div>

                ${contact.adminReply ? `
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-reply text-blue-600 mr-2"></i>
                            <span class="font-medium text-blue-800 text-sm">Admin Reply</span>
                        </div>
                        <p class="text-blue-700 text-sm">${contact.adminReply}</p>
                    </div>
                ` : ''}

                ${contact.adminNotes ? `
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-sticky-note text-yellow-600 mr-2"></i>
                            <span class="font-medium text-yellow-800 text-sm">Admin Notes</span>
                        </div>
                        <p class="text-yellow-700 text-sm">${contact.adminNotes}</p>
                    </div>
                ` : ''}
            </div>

            <!-- Card Actions -->
            <div class="px-6 pb-6">
                <div class="flex flex-wrap gap-2">
                    <button onclick="openContactReplyModal(${contact.id})"
                            class="flex-1 min-w-0 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                        <i class="fas fa-reply mr-1"></i>
                        <span class="hidden sm:inline">Reply</span>
                    </button>
                    <button onclick="updateContactStatus(${contact.id}, 'IN_PROGRESS')"
                            class="flex-1 min-w-0 px-3 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center">
                        <i class="fas fa-clock mr-1"></i>
                        <span class="hidden sm:inline">Progress</span>
                    </button>
                    <button onclick="updateContactStatus(${contact.id}, 'RESOLVED')"
                            class="flex-1 min-w-0 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center">
                        <i class="fas fa-check mr-1"></i>
                        <span class="hidden sm:inline">Resolve</span>
                    </button>
                    <button onclick="deleteContact(${contact.id})"
                            class="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Display contacts in list view (enhanced)
function displayContactsList(contacts) {
    const container = document.getElementById('contacts-list-view');

    if (contacts.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
                <p class="text-lg font-medium mb-2">No contact messages found</p>
                <p class="text-sm">Messages matching your criteria will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = contacts.map(contact => `
        <div class="p-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-start space-x-4 flex-1">
                    <input type="checkbox" class="contact-checkbox mt-1 w-4 h-4 text-coffee-brown border-gray-300 rounded focus:ring-coffee-brown"
                           data-contact-id="${contact.id}" onchange="toggleContactSelection(${contact.id})">

                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-3">
                                <h4 class="font-bold text-xl text-gray-900">${contact.name}</h4>
                                <span class="px-3 py-1 text-xs font-semibold rounded-full ${getContactStatusColor(contact.status)}">
                                    ${contact.status.replace('_', ' ')}
                                </span>
                                ${contact.status === 'NEW' ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><i class="fas fa-exclamation-circle mr-1"></i>NEW</span>' : ''}
                            </div>
                            <div class="text-right text-sm text-gray-500">
                                <p class="font-medium">${new Date(contact.createdAt).toLocaleDateString()}</p>
                                <p>${new Date(contact.createdAt).toLocaleTimeString()}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div class="space-y-1">
                                <p class="text-sm text-gray-600">
                                    <i class="fas fa-envelope mr-2 text-coffee-brown"></i>
                                    <span class="font-medium">Email:</span> ${contact.email}
                                </p>
                                ${contact.phone ? `
                                    <p class="text-sm text-gray-600">
                                        <i class="fas fa-phone mr-2 text-coffee-brown"></i>
                                        <span class="font-medium">Phone:</span> ${contact.phone}
                                    </p>
                                ` : ''}
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">
                                    <i class="fas fa-tag mr-2 text-coffee-brown"></i>
                                    <span class="font-medium">Subject:</span> ${contact.subject}
                                </p>
                            </div>
                        </div>

                        <div class="mb-4">
                            <p class="text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-coffee-brown">${contact.message}</p>
                        </div>

                        ${contact.adminReply ? `
                            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-3 rounded-r-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-reply text-blue-600 mr-2"></i>
                                    <span class="font-semibold text-blue-800">Admin Reply</span>
                                    <span class="ml-2 text-sm text-gray-600">by ${contact.repliedBy || 'Admin'}</span>
                                    <span class="ml-auto text-xs text-blue-600">
                                        ${new Date(contact.repliedAt).toLocaleString()}
                                    </span>
                                </div>
                                <p class="text-blue-700">${contact.adminReply}</p>
                            </div>
                        ` : ''}

                        ${contact.adminNotes ? `
                            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-3 rounded-r-lg">
                                <div class="flex items-center mb-2">
                                    <i class="fas fa-sticky-note text-yellow-600 mr-2"></i>
                                    <span class="font-semibold text-yellow-800">Admin Notes</span>
                                </div>
                                <p class="text-yellow-700">${contact.adminNotes}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap gap-3 ml-8">
                <button onclick="openContactReplyModal(${contact.id})"
                        class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <i class="fas fa-reply mr-2"></i>Reply
                </button>
                <button onclick="updateContactStatus(${contact.id}, 'IN_PROGRESS')"
                        class="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-colors flex items-center">
                    <i class="fas fa-clock mr-2"></i>In Progress
                </button>
                <button onclick="updateContactStatus(${contact.id}, 'RESOLVED')"
                        class="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors flex items-center">
                    <i class="fas fa-check mr-2"></i>Resolve
                </button>
                <button onclick="deleteContact(${contact.id})"
                        class="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center">
                    <i class="fas fa-trash mr-2"></i>Delete
                </button>
            </div>
        </div>
    `).join('');
}

function getContactStatusColor(status) {
    switch(status) {
        case 'NEW': return 'text-yellow-700 bg-yellow-100';
        case 'IN_PROGRESS': return 'text-blue-700 bg-blue-100';
        case 'RESOLVED': return 'text-green-700 bg-green-100';
        case 'CLOSED': return 'text-gray-700 bg-gray-100';
        default: return 'text-gray-700 bg-gray-100';
    }
}

// Bulk selection functions
function toggleContactSelection(contactId) {
    if (selectedContacts.has(contactId)) {
        selectedContacts.delete(contactId);
    } else {
        selectedContacts.add(contactId);
    }

    updateBulkActionsBar();
    updateContactCheckboxes();
}

function clearSelection() {
    selectedContacts.clear();
    updateBulkActionsBar();
    updateContactCheckboxes();
}

function updateBulkActionsBar() {
    const bulkActionsBar = document.getElementById('bulk-actions-bar');
    const selectedCount = document.getElementById('selected-count');

    if (selectedContacts.size > 0) {
        bulkActionsBar.classList.remove('hidden');
        selectedCount.textContent = `${selectedContacts.size} message${selectedContacts.size !== 1 ? 's' : ''} selected`;
    } else {
        bulkActionsBar.classList.add('hidden');
    }
}

function updateContactCheckboxes() {
    document.querySelectorAll('.contact-checkbox').forEach(checkbox => {
        const contactId = parseInt(checkbox.dataset.contactId);
        checkbox.checked = selectedContacts.has(contactId);
    });
}

// Bulk actions
async function bulkUpdateStatus(status) {
    if (selectedContacts.size === 0) return;

    const confirmed = await showModernConfirm(
        `Are you sure you want to update ${selectedContacts.size} message${selectedContacts.size !== 1 ? 's' : ''} to "${status.replace('_', ' ')}" status?`,
        'Bulk Status Update',
        'Update Status',
        'Cancel'
    );

    if (!confirmed) return;

    try {
        const promises = Array.from(selectedContacts).map(contactId =>
            updateContactStatus(contactId, status)
        );

        await Promise.all(promises);
        showToast(`Successfully updated ${selectedContacts.size} message${selectedContacts.size !== 1 ? 's' : ''}`, 'success');
        clearSelection();
        loadContacts(); // Refresh the list
    } catch (error) {
        console.error('Error in bulk status update:', error);
        showToast('Some updates failed. Please try again.', 'error');
    }
}

async function bulkDeleteContacts() {
    if (selectedContacts.size === 0) return;

    const confirmed = await showModernConfirm(
        `Are you sure you want to delete ${selectedContacts.size} message${selectedContacts.size !== 1 ? 's' : ''}? This action cannot be undone.`,
        'Bulk Delete',
        'Delete Messages',
        'Cancel'
    );

    if (!confirmed) return;

    try {
        const promises = Array.from(selectedContacts).map(contactId =>
            deleteContact(contactId)
        );

        await Promise.all(promises);
        showToast(`Successfully deleted ${selectedContacts.size} message${selectedContacts.size !== 1 ? 's' : ''}`, 'success');
        clearSelection();
        loadContacts(); // Refresh the list
    } catch (error) {
        console.error('Error in bulk delete:', error);
        showToast('Some deletions failed. Please try again.', 'error');
    }
}

// Enhanced filter function (keeping for backward compatibility)
function filterContacts() {
    const statusFilter = document.getElementById('contact-status-filter').value;
    let filteredContacts = allContacts;

    if (statusFilter) {
        filteredContacts = allContacts.filter(contact => contact.status === statusFilter);
    }

    displayContacts(filteredContacts);
}

async function updateContactStatus(contactId, status) {
    try {
        const response = await fetch(`http://localhost:8080/api/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        });

        const result = await response.json();
        
        if (result.success) {
            showToast(`Contact status updated to ${status}`, 'success');
            loadContacts(); // Reload contacts
        } else {
            showToast(result.message || 'Failed to update contact status', 'error');
        }
    } catch (error) {
        console.error('Error updating contact status:', error);
        showToast('Failed to update contact status', 'error');
    }
}

async function deleteContact(contactId) {
    if (confirm('Are you sure you want to delete this contact message?')) {
        try {
            const response = await fetch(`http://localhost:8080/api/contacts/${contactId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                showToast('Contact deleted successfully', 'success');
                loadContacts(); // Reload contacts
            } else {
                showToast(result.message || 'Failed to delete contact', 'error');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            showToast('Failed to delete contact', 'error');
        }
    }
}

// Contact Reply Modal Functions
function openContactReplyModal(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (!contact) return;
    
    currentContactId = contactId;
    
    // Populate contact details
    document.getElementById('contact-details').innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <strong>Name:</strong> ${contact.name}<br>
                <strong>Email:</strong> ${contact.email}<br>
                ${contact.phone ? `<strong>Phone:</strong> ${contact.phone}<br>` : ''}
                <strong>Subject:</strong> ${contact.subject}
            </div>
            <div>
                <strong>Status:</strong> ${contact.status}<br>
                <strong>Submitted:</strong> ${new Date(contact.createdAt).toLocaleString()}<br>
                ${contact.repliedAt ? `<strong>Last Reply:</strong> ${new Date(contact.repliedAt).toLocaleString()}` : ''}
            </div>
        </div>
        <div class="mt-4">
            <strong>Message:</strong><br>
            <p class="mt-2 p-3 bg-gray-100 rounded">${contact.message}</p>
        </div>
    `;
    
    // Pre-fill form
    document.getElementById('admin-reply').value = contact.adminReply || '';
    document.getElementById('admin-notes').value = contact.adminNotes || '';
    document.getElementById('contact-status').value = contact.status;
    
    document.getElementById('contactReplyModal').classList.remove('hidden');
}

function closeContactReplyModal() {
    document.getElementById('contactReplyModal').classList.add('hidden');
    currentContactId = null;
    document.getElementById('reply-form').reset();
}

// Handle reply form submission
document.addEventListener('DOMContentLoaded', function() {
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
        replyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentContactId) return;
            
            const adminReply = document.getElementById('admin-reply').value;
            const adminNotes = document.getElementById('admin-notes').value;
            const status = document.getElementById('contact-status').value;
            
            try {
                // Send reply if provided
                if (adminReply.trim()) {
                    const replyResponse = await fetch(`http://localhost:8080/api/contacts/${currentContactId}/reply`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            reply: adminReply,
                            repliedBy: 'Admin' // You can get this from user session
                        })
                    });
                    
                    if (!replyResponse.ok) {
                        throw new Error('Failed to send reply');
                    }
                }
                
                // Update contact with notes and status
                const updateResponse = await fetch(`http://localhost:8080/api/contacts/${currentContactId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        adminNotes: adminNotes,
                        status: status
                    })
                });
                
                const result = await updateResponse.json();
                
                if (result.success) {
                    showToast('Reply sent and contact updated successfully', 'success');
                    closeContactReplyModal();
                    loadContacts(); // Reload contacts
                } else {
                    showToast(result.message || 'Failed to update contact', 'error');
                }
            } catch (error) {
                console.error('Error processing reply:', error);
                showToast('Failed to process reply', 'error');
            }
        });
    }
});

// Legacy function name for compatibility
function loadContactMessages() {
    loadContacts();
}

// Helper Functions
function getStatusColor(status) {
    switch(status) {
        case 'pending': return 'text-yellow-700 bg-yellow-100';
        case 'preparing': return 'text-blue-700 bg-blue-100';
        case 'ready': return 'text-green-700 bg-green-100';
        case 'completed': return 'text-gray-700 bg-gray-100';
        case 'cancelled': return 'text-red-700 bg-red-100';
        default: return 'text-gray-700 bg-gray-100';
    }
}



async function deleteUser(userId) {
    // Use modern confirmation modal instead of browser confirm
    const confirmed = await showModernConfirm(
        'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data including their order history and account information.',
        'Delete User',
        'Delete User',
        'Cancel'
    );

    if (!confirmed) return;

    // If backend is configured, delegate to backend delete
    if (window.API_BASE_URL) {
        deleteUserFromBackend(userId);
        return;
    }

    // Fallback to localStorage
    const users = storage.get('users') || [];
    const filteredUsers = users.filter(u => u.id !== userId);
    storage.set('users', filteredUsers);
    loadUsers();
    loadDashboardStats();
    showToast('User deleted successfully', 'success');
}

function editUser(userId) {
    // If backend is configured, fetch user from server
    if (window.API_BASE_URL) {
        (async () => {
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });

                if (!res.ok) {
                    showToast('Failed to load user from server', 'error');
                    return;
                }

                const user = await res.json();
                // Populate form
                document.getElementById('editUserId').value = user.id;
                document.getElementById('editUserFirstName').value = user.firstName || '';
                document.getElementById('editUserLastName').value = user.lastName || '';
                document.getElementById('editUserEmail').value = user.email || '';
                document.getElementById('editUserPhone').value = user.phone || '';
                document.getElementById('editUserRole').value = user.role || 'customer';
                document.getElementById('editUserActive').checked = user.isActive !== false;
                document.getElementById('editUserPassword').value = '';
                showEditUserModal();
            } catch (err) {
                console.error('Error loading user:', err);
                showToast('Network error while loading user', 'error');
            }
        })();
        return;
    }

    const users = storage.get('users') || [];
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        showToast('User not found', 'error');
        return;
    }
    
    // Populate the edit form with user data
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserFirstName').value = user.firstName || '';
    document.getElementById('editUserLastName').value = user.lastName || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserPhone').value = user.phone || '';
    document.getElementById('editUserRole').value = user.role || 'customer';
    document.getElementById('editUserActive').checked = user.isActive !== false;
    
    // Clear password field (for security)
    document.getElementById('editUserPassword').value = '';
    
    // Show the modal
    showEditUserModal();
}

async function editProduct(productId) {
    // If backend is configured, fetch from API
    if (window.API_BASE_URL) {
        await editProductFromBackend(productId);
        return;
    }
    
    // Fallback to localStorage
    let products = storage.get('products') || [];
    if (products.length === 0) {
        products = getSampleProducts();
    }
    
    const product = products.find(p => p.id === productId);
    if (product) {
        showToast(`Edit functionality for "${product.name}" coming soon`, 'info');
        // TODO: Implement edit modal similar to add product modal
    }
}

// Edit product from backend
async function editProductFromBackend(productId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`);
        
        if (!response.ok) {
            showToast('Failed to load product', 'error');
            return;
        }

        const product = await response.json();
        console.log('Loaded product for editing:', product);
        await populateProductForm(product);

    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Network error while loading product', 'error');
    }
}

// Populate product form with data
async function populateProductForm(product) {
    // Load categories first
    await loadCategoriesInProductForm();
    
    // Show the modal first - use the correct modal ID
    const modal = document.getElementById('addProductModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    // Fill form fields
    if (document.getElementById('productId')) {
        document.getElementById('productId').value = product.id || product.productId || '';
    }
    if (document.getElementById('productName')) {
        document.getElementById('productName').value = product.name || product.productName || '';
    }
    if (document.getElementById('productDescription')) {
        document.getElementById('productDescription').value = product.description || '';
    }
    if (document.getElementById('productPrice')) {
        document.getElementById('productPrice').value = product.price || '';
    }
    if (document.getElementById('productCategory')) {
        document.getElementById('productCategory').value = product.categoryId || product.category_id || '';
    }
    if (document.getElementById('productImageUrl')) {
        document.getElementById('productImageUrl').value = product.imageUrl || product.image_url || '';
    }
    if (document.getElementById('productStock')) {
        document.getElementById('productStock').value = product.stockQuantity || product.stock || 0;
    }
    if (document.getElementById('productPrepTime')) {
        document.getElementById('productPrepTime').value = product.preparationTime || product.prep_time || 5;
    }
    if (document.getElementById('productCalories')) {
        document.getElementById('productCalories').value = product.calories || '';
    }
    if (document.getElementById('productIngredients')) {
        document.getElementById('productIngredients').value = product.ingredients || '';
    }
    if (document.getElementById('productAllergens')) {
        document.getElementById('productAllergens').value = product.allergens || '';
    }
    if (document.getElementById('productAvailable')) {
        document.getElementById('productAvailable').checked = product.isAvailable !== false;
    }
    if (document.getElementById('productFeatured')) {
        document.getElementById('productFeatured').checked = product.isFeatured === true;
    }
    
    // Update form title for editing
    const modalTitle = document.querySelector('#addProductModal h3');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Product';
    }
}

async function deleteProduct(productId) {
    // Use modern confirmation modal instead of browser confirm
    const confirmed = await showModernConfirm(
        'Are you sure you want to delete this product? This action cannot be undone and will permanently remove the product from your menu.',
        'Delete Product',
        'Delete Product',
        'Cancel'
    );

    if (!confirmed) return;

    // If backend is configured, use API
    if (window.API_BASE_URL) {
        await deleteProductFromBackend(productId);
        return;
    }

    // Fallback to localStorage
    let products = storage.get('products') || [];
    if (products.length === 0) {
        products = getSampleProducts();
    }

    const filteredProducts = products.filter(p => p.id !== productId);
    storage.set('products', filteredProducts);

    showToast('Product deleted successfully', 'success');
    loadProducts();
    loadDashboardStats();
}

// Delete product from backend
async function deleteProductFromBackend(productId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to delete product', 'error');
            return;
        }

        showToast('Product deleted successfully', 'success');
        await loadProducts(); // Refresh products list
        loadDashboardStats();

    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Network error while deleting product', 'error');
    }
}

// View order details
async function viewOrderDetails(orderId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        const apiUrl = window.API_BASE_URL ? `${window.API_BASE_URL}/api/orders/${orderId}` : `/api/orders/${orderId}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '../login.html';
            return;
        }

        if (!response.ok) {
            showToast('Failed to load order details', 'error');
            return;
        }

        const order = await response.json();

        // Create modern order details modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'view-order-modal';

        // Format order data
        const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A';
        const statusColor = getStatusColor(order.status);
        const orderTypeIcon = order.orderType === 'delivery' ? 'fas fa-truck' :
                             order.orderType === 'pickup' ? 'fas fa-store' : 'fas fa-utensils';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto transform transition-all duration-300 scale-95 animate-in">
                <div class="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-receipt text-blue-600 text-xl"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900">Order Details</h3>
                            <p class="text-blue-600 font-medium">Order #${order.orderNumber || order.id}</p>
                        </div>
                    </div>
                    <button onclick="closeOrderDetailsModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <div class="p-6">
                    <!-- Order Status & Basic Info -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium text-gray-600">Status</span>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                                    ${order.status.toUpperCase()}
                                </span>
                            </div>
                            <p class="text-lg font-semibold text-gray-900 capitalize">${order.status}</p>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center mb-2">
                                <i class="${orderTypeIcon} text-blue-600 mr-2"></i>
                                <span class="text-sm font-medium text-gray-600">Order Type</span>
                            </div>
                            <p class="text-lg font-semibold text-gray-900 capitalize">${order.orderType || 'N/A'}</p>
                        </div>

                        <div class="bg-white border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-calendar text-green-600 mr-2"></i>
                                <span class="text-sm font-medium text-gray-600">Order Date</span>
                            </div>
                            <p class="text-sm font-semibold text-gray-900">${orderDate}</p>
                        </div>
                    </div>

                    <!-- Customer Information -->
                    <div class="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-user text-blue-600 mr-2"></i>
                            Customer Information
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Name</label>
                                <p class="text-gray-900 font-medium">${order.customerName || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <p class="text-gray-900">${order.customerEmail || 'N/A'}</p>
                            </div>
                            ${order.customerPhone ? `
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                                    <p class="text-gray-900">${order.customerPhone}</p>
                                </div>
                            ` : ''}
                            ${order.deliveryAddress ? `
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Delivery Address</label>
                                    <p class="text-gray-900">${order.deliveryAddress}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Order Items -->
                    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-shopping-cart text-green-600 mr-2"></i>
                            Order Items
                        </h4>
                        <div class="space-y-4">
                            <!-- Order items would be populated here if available -->
                            <div class="text-center text-gray-500 py-8">
                                <i class="fas fa-coffee text-4xl mb-2 text-gray-300"></i>
                                <p>Order items details not available in current API response</p>
                                <p class="text-sm">This can be enhanced when order items are included in the API</p>
                            </div>
                        </div>
                    </div>

                    <!-- Order Summary -->
                    <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-calculator text-green-600 mr-2"></i>
                            Order Summary
                        </h4>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Subtotal</span>
                                <span class="font-medium">$${order.subtotal ? order.subtotal.toFixed(2) : '0.00'}</span>
                            </div>
                            ${order.taxAmount ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Tax</span>
                                    <span class="font-medium">$${order.taxAmount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${order.deliveryFee ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Delivery Fee</span>
                                    <span class="font-medium">$${order.deliveryFee.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            <div class="border-t border-green-300 pt-3 flex justify-between">
                                <span class="text-lg font-semibold text-gray-900">Total Amount</span>
                                <span class="text-lg font-bold text-green-600">$${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Special Instructions -->
                    ${order.specialInstructions ? `
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
                            <h4 class="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                                <i class="fas fa-sticky-note text-yellow-600 mr-2"></i>
                                Special Instructions
                            </h4>
                            <p class="text-gray-700">${order.specialInstructions}</p>
                        </div>
                    ` : ''}

                    <!-- Payment Information -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-credit-card text-blue-600 mr-2"></i>
                            Payment Information
                        </h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-600 mb-1">Payment Status</label>
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                                    ${order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING'}
                                </span>
                            </div>
                            ${order.paymentMethod ? `
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                                    <p class="text-gray-900 capitalize">${order.paymentMethod}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button onclick="closeOrderDetailsModal()" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">
                        Close
                    </button>
                    <button onclick="editOrder(${order.id})" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-edit mr-2"></i>Edit Status
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add animation
        setTimeout(() => {
            modal.querySelector('.animate-in').classList.remove('scale-95');
            modal.querySelector('.animate-in').classList.add('scale-100');
        }, 10);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeOrderDetailsModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeOrderDetailsModal();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

    } catch (error) {
        console.error('Error viewing order details:', error);
        showToast('Network error while loading order details', 'error');
    }
}

// Close order details modal
function closeOrderDetailsModal() {
    const modal = document.getElementById('view-order-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    }
}

// Modal Management Functions
function showAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Reset form
    document.getElementById('addUserForm').reset();
    console.log('Add user modal opened');
}

function closeAddUserModal() {
    document.getElementById('addUserModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    console.log('Add user modal closed');
}

function showEditUserModal() {
    document.getElementById('editUserModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    console.log('Edit user modal opened');
}

function closeEditUserModal() {
    document.getElementById('editUserModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    console.log('Edit user modal closed');
}

function showAddProductModal() {
    const modal = document.getElementById('addProductModal') || document.getElementById('productModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    // Reset form for new product
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();
    }
    
    // Reset hidden product ID field
    const productIdField = document.getElementById('productId');
    if (productIdField) {
        productIdField.value = '';
    }
    
    // Update form title for adding
    const modalTitle = document.querySelector('#addProductModal .modal-title, #productModal .modal-title, #addProductModal h3, #productModal h3');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Product';
    }
    
    // Load categories in the dropdown
    loadCategoriesInProductForm();
}

// Load categories in product form dropdown
async function loadCategoriesInProductForm() {
    const categorySelect = document.getElementById('productCategory');
    if (!categorySelect) return;
    
    try {
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/categories`);
            if (response.ok) {
                const categories = await response.json();
                
                // Clear existing options except the first one
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                
                // Add categories from backend
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function closeAddProductModal() {
    const modal = document.getElementById('addProductModal') || document.getElementById('productModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Form Submission Handlers

// Add User Handler
function handleAddUser(e) {
    e.preventDefault();
    
    console.log('Add user form submitted');
    
    const formData = new FormData(e.target);
    const userData = {
        id: Date.now(), // Simple ID generation
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        role: formData.get('role'),
        isActive: formData.get('isActive') === 'on',
        createdAt: new Date().toISOString(),
        name: `${formData.get('firstName')} ${formData.get('lastName')}`
    };
    
    console.log('User data created:', userData);
    
    // Validation
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (userData.password.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Check if email already exists
    const existingUsers = storage.get('users') || [];
    if (existingUsers.some(user => user.email === userData.email)) {
        showToast('Email already exists', 'error');
        return;
    }
    
    console.log('Validation passed, adding user locally');
    
    // For backend integration (when ready)
    if (window.API_BASE_URL) {
        addUserToBackend(userData);
    } else {
        // Local storage for now
        addUserLocally(userData);
    }
}

function addUserLocally(userData) {
    const users = storage.get('users') || [];
    users.push(userData);
    storage.set('users', users);
    
    console.log('User added:', userData);
    console.log('Total users now:', users.length);
    
    showToast('User added successfully!', 'success');
    closeAddUserModal();
    
    // Always refresh users list to ensure it shows new data
    loadUsers();
    loadDashboardStats();
}

// Fetch users from backend and render
// Store all users for filtering
let allUsers = [];

async function fetchUsersFromBackend() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${window.API_BASE_URL}/api/users`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!res.ok) {
            console.error('Failed fetching users from backend', res.status);
            showToast('Failed to load users from server', 'error');
            return;
        }

        const users = await res.json();
        allUsers = users; // Store all users for filtering
        renderUsersTable(users);
        // update dashboard stat
        const totalEl = document.getElementById('total-users');
        if (totalEl) totalEl.textContent = Array.isArray(users) ? users.length : '0';
    } catch (err) {
        console.error('Error fetching users:', err);
        showToast('Network error while loading users', 'error');
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table');
    if (!Array.isArray(users) || users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No users found
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map(user => {
        // Handle both local storage format (user.name) and backend format (user.firstName, user.lastName)
        const displayName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown';
        const firstLetter = user.firstName ? user.firstName.charAt(0).toUpperCase() : 
                           user.name ? user.name.charAt(0).toUpperCase() : 'U';
        
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="bg-coffee-brown text-white w-10 h-10 rounded-full flex items-center justify-center mr-3">
                        ${firstLetter}
                    </div>
                    <div>
                        <p class="font-medium">${displayName}</p>
                        <p class="text-sm text-gray-600">${user.phone || 'No phone'}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">${user.email || 'No email'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${(user.role === 'admin' || user.role === 'administrator') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                    ${user.role || 'customer'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">
                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </td>
            <td class="px-6 py-4">
                <div class="flex space-x-2">
                    <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800" title="Edit user">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-800" title="Delete user">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Filter users based on search and role
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase().trim();
    const roleFilter = document.getElementById('role-filter').value.toLowerCase();
    
    console.log('Filtering users with search:', searchTerm, 'role:', roleFilter);
    
    if (!allUsers || allUsers.length === 0) {
        console.log('No users to filter');
        return;
    }
    
    let filteredUsers = allUsers;
    
    // Filter by search term (name, email, phone)
    if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => {
            // Handle both local storage format (user.name) and backend format (user.firstName, user.lastName)
            const fullName = user.name ? user.name.toLowerCase() : 
                           `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();
            const phone = (user.phone || '').toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   phone.includes(searchTerm);
        });
    }
    
    // Filter by role
    if (roleFilter) {
        filteredUsers = filteredUsers.filter(user => {
            const userRole = (user.role || '').toLowerCase();
            if (roleFilter === 'customer') {
                return userRole === 'customer' || userRole === 'user' || userRole === '';
            } else if (roleFilter === 'admin') {
                return userRole === 'admin' || userRole === 'administrator';
            }
            return true; // for "all roles"
        });
    }
    
    console.log('Filtered users:', filteredUsers.length, 'out of', allUsers.length);
    
    // Render filtered results
    renderUsersTable(filteredUsers);
}

// Reset user filters
function resetUserFilters() {
    document.getElementById('user-search').value = '';
    document.getElementById('role-filter').value = '';
    renderUsersTable(allUsers);
}

// Add user to backend
async function addUserToBackend(userData) {
    try {
        const token = localStorage.getItem('authToken');
        const payload = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash: userData.password, // server expects passwordHash field currently
            phone: userData.phone,
            role: userData.role,
            isActive: userData.isActive
        };

        const res = await fetch(`${window.API_BASE_URL}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('User added successfully!', 'success');
            closeAddUserModal();
            fetchUsersFromBackend();
        } else {
            const text = await res.text();
            showToast(text || 'Failed to add user', 'error');
        }
    } catch (err) {
        console.error('Error adding user to backend:', err);
        showToast('Network error. Please try again.', 'error');
    }
}

// Update user in backend
async function updateUserToBackend(userId, userData) {
    try {
        const token = localStorage.getItem('authToken');
        const payload = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            passwordHash: userData.password || userData.existingPassword || '',
            phone: userData.phone,
            role: userData.role,
            isActive: userData.isActive
        };

        const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            showToast('User updated successfully!', 'success');
            closeEditUserModal();
            fetchUsersFromBackend();
        } else {
            const text = await res.text();
            showToast(text || 'Failed to update user', 'error');
        }
    } catch (err) {
        console.error('Error updating user:', err);
        showToast('Network error. Please try again.', 'error');
    }
}

// Delete user in backend
async function deleteUserFromBackend(userId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (res.ok) {
            showToast('User deleted successfully', 'success');
            fetchUsersFromBackend();
            loadDashboardStats();
        } else {
            const text = await res.text();
            showToast(text || 'Failed to delete user', 'error');
        }
    } catch (err) {
        console.error('Error deleting user:', err);
        showToast('Network error. Please try again.', 'error');
    }
}

// Edit User Handler
async function handleEditUser(e) {
    e.preventDefault();
    
    console.log('Edit user form submitted');
    
    const formData = new FormData(e.target);
    const userId = parseInt(formData.get('userId'));
    
    const userData = {
        id: userId,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        passwordHash: formData.get('password'), // Backend expects passwordHash
        phone: formData.get('phone'),
        role: formData.get('role'),
        isActive: formData.get('isActive') === 'on',
        name: `${formData.get('firstName')} ${formData.get('lastName')}`
    };
    
    console.log('Edit user data:', userData);
    
    // Validation
    if (!userData.firstName || !userData.lastName || !userData.email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (userData.passwordHash && userData.passwordHash.length < 6) {
        showToast('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // If backend is configured, call the API
    if (window.API_BASE_URL) {
        try {
            const token = localStorage.getItem('authToken');
            
            // Prepare the update payload
            const updatePayload = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                role: userData.role,
                isActive: userData.isActive
            };
            
            // Only include passwordHash if a password was provided
            if (userData.passwordHash && userData.passwordHash.trim() !== '') {
                updatePayload.passwordHash = userData.passwordHash;
            }
            
            console.log('Sending update to backend:', updatePayload);
            
            const response = await fetch(`${window.API_BASE_URL}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatePayload)
            });
            
            const result = await response.text();
            console.log('Backend response:', result);
            
            if (response.ok) {
                showToast('User updated successfully!', 'success');
                closeEditUserModal();
                fetchUsersFromBackend(); // Refresh the users list
                loadDashboardStats();
            } else {
                showToast(result || 'Failed to update user', 'error');
            }
            
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Network error while updating user', 'error');
        }
        return;
    }
    
    // Fallback to localStorage for local development
    const users = storage.get('users') || [];
    const userIndex = users.findIndex(u => u.id == userId);
    
    if (userIndex === -1) {
        showToast('User not found', 'error');
        return;
    }
    
    // Check if email already exists for other users
    const emailExists = users.some(user => user.email === userData.email && user.id != userId);
    if (emailExists) {
        showToast('Email already exists for another user', 'error');
        return;
    }
    
    // Update user data, preserving existing data
    const existingUser = users[userIndex];
    const updatedUser = {
        ...existingUser,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.isActive,
        updatedAt: new Date().toISOString()
    };
    
    // Only update password if a new one was provided
    if (userData.passwordHash && userData.passwordHash.trim() !== '') {
        updatedUser.password = userData.passwordHash;
    }
    
    // Update the user in the array
    users[userIndex] = updatedUser;
    storage.set('users', users);
    
    console.log('User updated:', updatedUser);
    
    showToast('User updated successfully!', 'success');
    closeEditUserModal();
    
    // Refresh users list
    loadUsers();
    loadDashboardStats();
}

// Add Product Handler
function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const productData = {
        id: Date.now(), // Simple ID generation
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        categoryId: parseInt(formData.get('categoryId')),
        category: getCategoryName(formData.get('categoryId')),
        imageUrl: formData.get('imageUrl') || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format',
        image: formData.get('imageUrl') || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop&auto=format',
        stockQuantity: parseInt(formData.get('stockQuantity')) || 100,
        preparationTime: parseInt(formData.get('preparationTime')) || 5,
        calories: parseInt(formData.get('calories')) || null,
        ingredients: formData.get('ingredients'),
        allergens: formData.get('allergens'),
        isAvailable: formData.get('isAvailable') === 'on',
        isFeatured: formData.get('isFeatured') === 'on',
        createdAt: new Date().toISOString()
    };
    
    // Validation
    if (!productData.name || !productData.price || !productData.categoryId) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (productData.price <= 0) {
        showToast('Price must be greater than 0', 'error');
        return;
    }
    
    // Check if this is an edit operation
    const productId = document.getElementById('productId')?.value;
    const isEditing = productId && productId !== '';
    
    if (window.API_BASE_URL) {
        if (isEditing) {
            updateProductToBackend(parseInt(productId), productData);
        } else {
            addProductToBackend(productData);
        }
    } else {
        // Local storage for now
        if (isEditing) {
            updateProductLocally(parseInt(productId), productData);
        } else {
            addProductLocally(productData);
        }
    }
}

function addProductLocally(productData) {
    const products = storage.get('products') || [];
    products.push(productData);
    storage.set('products', products);
    
    showToast('Product added successfully!', 'success');
    closeAddProductModal();
    
    // Refresh products list if on products section
    if (!document.getElementById('products-section').classList.contains('hidden')) {
        loadProducts();
    }
    loadDashboardStats();
}

// Add product to backend
async function addProductToBackend(productData) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        // Map frontend data to backend format
        const backendProductData = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            categoryId: productData.categoryId,
            imageUrl: productData.imageUrl || productData.image,
            stockQuantity: productData.stockQuantity || 100,
            preparationTime: productData.preparationTime || 5,
            calories: productData.calories || null,
            ingredients: productData.ingredients || null,
            allergens: productData.allergens || null,
            isAvailable: productData.isAvailable !== false,
            isFeatured: productData.isFeatured === true
        };

        const response = await fetch(`${window.API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendProductData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to add product', 'error');
            return;
        }

        showToast('Product added successfully!', 'success');
        closeAddProductModal();
        await loadProducts(); // Refresh products list
        loadDashboardStats();

    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Network error while adding product', 'error');
    }
}

// Update product in backend
async function updateProductToBackend(productId, productData) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        // Map frontend data to backend format
        const backendProductData = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            categoryId: productData.categoryId,
            imageUrl: productData.imageUrl || productData.image,
            stockQuantity: productData.stockQuantity || 100,
            preparationTime: productData.preparationTime || 5,
            calories: productData.calories || null,
            ingredients: productData.ingredients || null,
            allergens: productData.allergens || null,
            isAvailable: productData.isAvailable !== false,
            isFeatured: productData.isFeatured === true
        };

        const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backendProductData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to update product', 'error');
            return;
        }

        showToast('Product updated successfully!', 'success');
        closeAddProductModal();
        await loadProducts(); // Refresh products list
        loadDashboardStats();
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Network error while updating product', 'error');
    }
}

// Update product locally
function updateProductLocally(productId, productData) {
    let products = storage.get('products') || [];
    if (products.length === 0) {
        products = getSampleProducts();
    }
    
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
        products[productIndex] = { ...products[productIndex], ...productData, id: productId };
        storage.set('products', products);
        
        showToast('Product updated successfully!', 'success');
        closeAddProductModal();
        
        // Refresh products list if on products section
        if (!document.getElementById('products-section').classList.contains('hidden')) {
            loadProducts();
        }
        loadDashboardStats();
    } else {
        showToast('Product not found', 'error');
    }
}

// Helper function to get category name
function getCategoryName(categoryId) {
    // Try to get from stored backend categories first
    const backendCategories = window.cachedCategories || [];
    let category = backendCategories.find(cat => cat.id == categoryId);
    
    if (category) {
        return category.name;
    }
    
    // Fallback to local categories
    const localCategories = getCategories();
    category = localCategories.find(cat => cat.id == categoryId);
    
    if (category) {
        return category.name;
    }
    
    // Default mapping for common categories
    const defaultMapping = {
        1: 'Coffee',
        2: 'Pastries', 
        3: 'Cold Drinks',
        4: 'Snacks'
    };
    
    return defaultMapping[categoryId] || 'Unknown';
}

// ==================== CATEGORIES MANAGEMENT ====================

// Load categories data
async function loadCategories() {
    if (window.API_BASE_URL) {
        await fetchCategoriesFromBackend();
    } else {
        const categories = getCategories();
        displayCategoriesGrid(categories);
        displayCategoriesTable(categories);
        updateCategoriesStats();
    }
}

// Fetch categories from backend API
async function fetchCategoriesFromBackend() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/categories`);
        
        if (!response.ok) {
            console.error('Failed to fetch categories:', response.status);
            showToast('Failed to load categories', 'error');
            return;
        }

        const categories = await response.json();
        console.log('📂 Loaded categories from backend:', categories.length);
        
        // Cache categories globally for use by products
        window.cachedCategories = categories;
        
        displayCategoriesGrid(categories);
        displayCategoriesTable(categories);
        updateCategoriesStats(categories);
        
    } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Network error while loading categories', 'error');
        // Fallback to local data
        const categories = getCategories();
        displayCategoriesGrid(categories);
        displayCategoriesTable(categories);
        updateCategoriesStats(categories);
    }
}

// Get categories from storage or default data
function getCategories() {
    const stored = storage.get('categories');
    if (stored && stored.length > 0) {
        return stored;
    }
    
    // Default categories
    const defaultCategories = [
        {
            id: '1',
            name: 'Coffee',
            description: 'Hot and specialty coffee drinks',
            icon: 'fas fa-coffee',
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: '2', 
            name: 'Pastry',
            description: 'Fresh baked pastries and sweet treats',
            icon: 'fas fa-cookie-bite',
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            name: 'Cold Drinks',
            description: 'Refreshing iced beverages and smoothies',
            icon: 'fas fa-glass-whiskey',
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    storage.set('categories', defaultCategories);
    return defaultCategories;
}

// Display categories in grid format
function displayCategoriesGrid(categories) {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    
    grid.innerHTML = categories.map(category => {
        // Handle both backend (isActive) and frontend (icon) data
        const isActive = category.isActive !== false; // Default to true if undefined
        const categoryIcon = category.icon || getCategoryIcon(category.name);
        
        return `
            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <i class="${categoryIcon} text-coffee-brown text-2xl mr-3"></i>
                        <h3 class="text-lg font-semibold text-gray-900">${category.name}</h3>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p class="text-gray-600 mb-4">${category.description || 'No description'}</p>
                <div class="w-full h-32 bg-gray-200 rounded mb-4 flex items-center justify-center overflow-hidden">
                    ${category.imageUrl ? `<img src="${category.imageUrl}" alt="${category.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="flex flex-col items-center justify-center text-gray-400 ${category.imageUrl ? 'hidden' : ''}">
                        <i class="${categoryIcon} text-3xl mb-2"></i>
                        <span class="text-sm">No Image</span>
                    </div>
                </div>
                <div class="text-sm text-gray-500 mb-4">
                    Sort Order: ${category.sortOrder || 0} | Created: ${category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div class="flex space-x-2">
                    <button onclick="editCategory(${category.id})"
                        class="flex-1 bg-coffee-brown text-white px-3 py-2 rounded text-sm hover:bg-coffee-dark transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteCategory(${category.id})"
                        class="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to get icon based on category name
function getCategoryIcon(name) {
    const iconMap = {
        'Coffee': 'fas fa-coffee',
        'Pastries': 'fas fa-cookie-bite', 
        'Cold Drinks': 'fas fa-glass-whiskey',
        'Snacks': 'fas fa-apple-alt',
        'Tea': 'fas fa-leaf',
        'Desserts': 'fas fa-birthday-cake'
    };
    return iconMap[name] || 'fas fa-utensils';
}

// Display categories in table format
function displayCategoriesTable(categories) {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = categories.map(category => {
        const isActive = category.isActive !== false;
        const categoryIcon = category.icon || getCategoryIcon(category.name);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <i class="${categoryIcon} text-coffee-brown text-lg mr-3"></i>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${category.name}</div>
                            <div class="text-sm text-gray-500">ID: ${category.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${category.description || 'No description'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Order: ${category.sortOrder || 0}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editCategory(${category.id})" 
                        class="text-coffee-brown hover:text-coffee-dark mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="deleteCategory(${category.id})" 
                        class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get product count for a category
function getProductCountByCategory(categoryId) {
    const products = getSampleProducts();
    return products.filter(product => product.categoryId === categoryId).length;
}

// Update categories statistics in dashboard
function updateCategoriesStats(categories = null) {
    if (!categories) {
        if (window.API_BASE_URL) {
            // Categories will be updated by fetchCategoriesFromBackend
            return;
        }
        categories = getCategories();
    }
    
    const activeCategories = categories.filter(cat => cat.isActive !== false).length;
    const totalElement = document.getElementById('admin-total-categories');
    if (totalElement) {
        totalElement.textContent = activeCategories;
    }
}

// Open add category modal
function openAddCategoryModal() {
    document.getElementById('category-modal-title').textContent = 'Add New Category';
    document.getElementById('category-submit-btn').innerHTML = '<i class="fas fa-plus mr-2"></i>Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('addCategoryModal').classList.remove('hidden');
}

// Open edit category modal
async function editCategory(categoryId) {
    // If backend is configured, fetch from API
    if (window.API_BASE_URL) {
        await editCategoryFromBackend(categoryId);
        return;
    }
    
    // Fallback to localStorage
    const categories = getCategories();
    const category = categories.find(cat => cat.id == categoryId);
    
    if (!category) {
        showToast('Category not found', 'error');
        return;
    }
    
    populateCategoryForm(category);
}

// Edit category from backend
async function editCategoryFromBackend(categoryId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/categories/${categoryId}`);
        
        if (!response.ok) {
            showToast('Failed to load category', 'error');
            return;
        }

        const category = await response.json();
        console.log('Loaded category for editing:', category);
        populateCategoryForm(category);

    } catch (error) {
        console.error('Error loading category:', error);
        showToast('Network error while loading category', 'error');
    }
}

// Populate category form with data
function populateCategoryForm(category) {
    console.log('Populating form with category:', category);

    // Update modal title and button
    const modalTitle = document.getElementById('category-modal-title');
    const submitBtn = document.getElementById('category-submit-btn');

    if (modalTitle) {
        modalTitle.textContent = 'Edit Category';
    }
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Category';
    }

    // Populate form fields (only if they exist)
    const categoryIdField = document.getElementById('categoryId');
    const categoryNameField = document.getElementById('categoryName');
    const categoryDescField = document.getElementById('categoryDescription');
    const categoryIconField = document.getElementById('categoryIcon');
    const categoryImageFileField = document.getElementById('categoryImageFile');
    const categoryActiveField = document.getElementById('categoryActive');
    const currentImagePreview = document.getElementById('currentImagePreview');
    const currentImage = document.getElementById('currentImage');

    if (categoryIdField) categoryIdField.value = category.id || '';
    if (categoryNameField) categoryNameField.value = category.name || '';
    if (categoryDescField) categoryDescField.value = category.description || '';
    if (categoryImageFileField) {
        // Clear file input for editing (can't pre-populate file inputs)
        categoryImageFileField.value = '';
    }
    if (categoryActiveField) categoryActiveField.checked = category.isActive !== false;

    // Set icon if available
    if (categoryIconField) {
        const icon = category.icon || getCategoryIcon(category.name);
        categoryIconField.value = icon;
    }

    // Show current image if exists
    if (currentImagePreview && currentImage && category.imageUrl) {
        currentImage.src = category.imageUrl;
        currentImagePreview.classList.remove('hidden');
    } else if (currentImagePreview) {
        currentImagePreview.classList.add('hidden');
    }

    // Show the modal
    const modal = document.getElementById('addCategoryModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

// Close category modal
function closeCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    const form = document.getElementById('categoryForm');
    const modalTitle = document.getElementById('category-modal-title');
    const submitBtn = document.getElementById('category-submit-btn');
    
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
    
    if (form) {
        form.reset();
    }
    
    // Reset to "Add" mode
    if (modalTitle) {
        modalTitle.textContent = 'Add New Category';
    }
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Category';
    }
    
    // Clear the hidden categoryId field
    const categoryIdField = document.getElementById('categoryId');
    if (categoryIdField) {
        categoryIdField.value = '';
    }
}

// Handle category form submission
async function handleCategorySubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const imageFile = formData.get('imageFile');

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
        // Upload image file and get URL
        imageUrl = await uploadCategoryImage(imageFile);
    }

    const categoryData = {
        name: formData.get('name').trim(),
        description: formData.get('description').trim(),
        icon: formData.get('icon') || 'fas fa-utensils',
        imageUrl: formData.get('imageUrl') || imageUrl,
        isActive: formData.get('isActive') === 'on',
        sortOrder: parseInt(formData.get('sortOrder')) || 0
    };
    
    console.log('Category form data:', categoryData);
    
    // Validation
    if (!categoryData.name) {
        showToast('Category name is required', 'error');
        return;
    }
    
    const categoryId = formData.get('categoryId');
    
    // If backend is configured, use API
    if (window.API_BASE_URL) {
        await handleCategoryBackendSubmit(categoryId, categoryData);
        return;
    }
    
    // Fallback to localStorage
    const categories = getCategories();
    
    if (categoryId) {
        // Update existing category
        const index = categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...categoryData,
                updatedAt: new Date().toISOString()
            };
            storage.set('categories', categories);
            showToast('Category updated successfully', 'success');
        }
    } else {
        // Check for duplicate names
        if (categories.some(cat => cat.name.toLowerCase() === categoryData.name.toLowerCase())) {
            showToast('Category name already exists', 'error');
            return;
        }
        
        // Add new category
        const newCategory = {
            id: Date.now().toString(),
            ...categoryData,
            createdAt: new Date().toISOString()
        };
        
        categories.push(newCategory);
        storage.set('categories', categories);
        showToast('Category added successfully', 'success');
    }
    
    closeCategoryModal();
    loadCategories();
}

// Handle category submission to backend
async function handleCategoryBackendSubmit(categoryId, categoryData) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        const url = categoryId 
            ? `${window.API_BASE_URL}/api/categories/${categoryId}`
            : `${window.API_BASE_URL}/api/categories`;
        
        const method = categoryId ? 'PUT' : 'POST';
        
        console.log(`${method} category:`, categoryData);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to save category', 'error');
            return;
        }

        const result = await response.json();
        console.log('Category saved:', result);
        
        showToast(categoryId ? 'Category updated successfully!' : 'Category created successfully!', 'success');
        closeCategoryModal();
        loadCategories();

    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Network error while saving category', 'error');
    }
}

// Delete category
async function deleteCategory(categoryId) {
    // Show modern confirmation modal instead of browser confirm
    const confirmed = await showModernConfirm(
        'Are you sure you want to delete this category? This action cannot be undone and will permanently remove the category and all associated products from the menu.',
        'Delete Category',
        'Delete Category',
        'Cancel'
    );

    if (!confirmed) return;
    
    // If backend is configured, use API
    if (window.API_BASE_URL) {
        await deleteCategoryFromBackend(categoryId);
        return;
    }
    
    // Fallback to localStorage
    const categories = getCategories();
    const updatedCategories = categories.filter(cat => cat.id != categoryId);
    storage.set('categories', updatedCategories);
    
    showToast('Category deleted successfully', 'success');
    loadCategories();
}

// Upload category image
async function uploadCategoryImage(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'categories');

        const token = localStorage.getItem('authToken');
        const response = await fetch(`${window.API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const result = await response.json();
        return result.url || result.imageUrl;
    } catch (error) {
        console.error('Error uploading category image:', error);
        showToast('Failed to upload image', 'error');
        return null;
    }
}

// Delete category from backend
async function deleteCategoryFromBackend(categoryId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            showToast('Authentication required', 'error');
            return;
        }

        console.log('Deleting category:', categoryId);

        const response = await fetch(`${window.API_BASE_URL}/api/categories/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to delete category', 'error');
            return;
        }

        console.log('Category deleted successfully');
        showToast('Category deleted successfully!', 'success');
        loadCategories();

    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Network error while deleting category', 'error');
    }
}

// Helper function to show toast notifications
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ==================== TESTIMONIALS MANAGEMENT ====================

// Sample testimonials data (in a real app, this would come from a database)
let testimonialsData = [
    {
        id: 1,
        customerName: 'Emma Thompson',
        customerImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
        rating: 5,
        message: 'Café Aroma has become my second home. The coffee is exceptional, and the staff always remembers my order. It\'s the perfect place to work and relax.',
        status: 'published',
        date: '2024-01-15'
    },
    {
        id: 2,
        customerName: 'Michael Chen',
        customerImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
        rating: 5,
        message: 'Best coffee in town! The attention to detail in every cup is remarkable. Their sustainability practices make me feel good about my daily coffee habit.',
        status: 'published',
        date: '2024-01-20'
    },
    {
        id: 3,
        customerName: 'Lisa Rodriguez',
        customerImage: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=60&h=60&fit=crop&crop=face',
        rating: 5,
        message: 'The atmosphere is cozy and welcoming. Great place for meetings or just catching up with friends. The pastries are absolutely delicious too!',
        status: 'published',
        date: '2024-02-01'
    },
    {
        id: 4,
        customerName: 'David Wilson',
        customerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
        rating: 4,
        message: 'Good coffee and friendly service. The WiFi is reliable which makes it perfect for remote work. Could use more variety in snacks.',
        status: 'pending',
        date: '2024-02-10'
    },
    {
        id: 5,
        customerName: 'Sarah Johnson',
        customerImage: 'https://imgs.search.brave.com/g0bZhZDqh0ugxfELNzMhHxHWxSwCzin9oa2elbfD050/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9yYWxl/c2NlbnRlci5ob3Br/aW5zY2hpbGRyZW5z/Lm9yZy93cC1jb250/ZW50L3VwbG9hZHMv/YmZpX3RodW1iL3N0/YWZmLXNfam9obnNv/bi02MDB4NjAwLTM2/MHgzNjAtcDNzODh5/OHQ2bGF4YXZtd3I3/MWI3MDdteDRtbjJj/M3g1ZWJpdmdyYTR3/LmpwZw',
        rating: 5,
        message: 'Amazing experience every time! The baristas are true artists. Love the seasonal specials and the cozy reading corner.',
        status: 'hidden',
        date: '2024-02-15'
    }
];

function loadTestimonials() {
    updateTestimonialsStats();
    displayTestimonials();
}

function updateTestimonialsStats() {
    const total = testimonialsData.length;
    const published = testimonialsData.filter(t => t.status === 'published').length;
    const pending = testimonialsData.filter(t => t.status === 'pending').length;
    const averageRating = total > 0 ? (testimonialsData.reduce((sum, t) => sum + t.rating, 0) / total).toFixed(1) : '0.0';

    document.getElementById('total-testimonials').textContent = total;
    document.getElementById('published-testimonials').textContent = published;
    document.getElementById('pending-testimonials').textContent = pending;
    document.getElementById('average-rating').textContent = averageRating;
}

function displayTestimonials(filteredData = null) {
    const data = filteredData || testimonialsData;
    const tbody = document.getElementById('testimonials-table-body');
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <i class="fas fa-comments text-4xl mb-4 text-gray-300"></i>
                    <p class="text-lg">No testimonials found</p>
                    <p class="text-sm">Add your first testimonial to get started</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(testimonial => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <img class="h-10 w-10 rounded-full object-cover" 
                         src="${testimonial.customerImage || 'https://via.placeholder.com/40'}" 
                         alt="${testimonial.customerName}">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${testimonial.customerName}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    ${generateStarRating(testimonial.rating)}
                    <span class="ml-2 text-sm text-gray-600">(${testimonial.rating}/5)</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-xs truncate" title="${testimonial.message}">
                    ${testimonial.message}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(testimonial.status)}">
                    ${capitalizeFirst(testimonial.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(testimonial.date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex space-x-2">
                    <button onclick="editTestimonial(${testimonial.id})" 
                        class="text-coffee-brown hover:text-coffee-dark" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleTestimonialStatus(${testimonial.id})" 
                        class="text-blue-600 hover:text-blue-900" title="Change Status">
                        <i class="fas fa-eye${testimonial.status === 'published' ? '-slash' : ''}"></i>
                    </button>
                    <button onclick="deleteTestimonial(${testimonial.id})" 
                        class="text-red-600 hover:text-red-900" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}"></i>`;
    }
    return stars;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'published': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'hidden': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function openTestimonialModal(testimonialId = null) {
    const modal = document.getElementById('addTestimonialModal');
    const form = document.getElementById('testimonial-form');
    const title = document.getElementById('testimonial-modal-title');
    const submitBtn = document.getElementById('testimonial-submit-btn');
    
    form.reset();
    document.getElementById('testimonial-id').value = '';
    
    if (testimonialId) {
        const testimonial = testimonialsData.find(t => t.id === testimonialId);
        if (testimonial) {
            title.textContent = 'Edit Testimonial';
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Testimonial';
            
            document.getElementById('testimonial-id').value = testimonial.id;
            document.getElementById('customer-name').value = testimonial.customerName;
            document.getElementById('customer-image').value = testimonial.customerImage || '';
            document.getElementById('testimonial-message').value = testimonial.message;
            document.getElementById('testimonial-status').value = testimonial.status;
            document.getElementById('testimonial-date').value = testimonial.date;
            
            setRating(testimonial.rating);
        }
    } else {
        title.textContent = 'Add New Testimonial';
        submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Testimonial';
        
        // Set today's date by default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('testimonial-date').value = today;
    }
    
    modal.classList.remove('hidden');
}

function closeTestimonialModal() {
    document.getElementById('addTestimonialModal').classList.add('hidden');
}

function setRating(rating) {
    document.getElementById('testimonial-rating-value').value = rating;
    
    const stars = document.querySelectorAll('.rating-star');
    const ratingText = document.getElementById('rating-text');
    
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.remove('text-gray-300');
            star.classList.add('text-yellow-500');
        } else {
            star.classList.remove('text-yellow-500');
            star.classList.add('text-gray-300');
        }
    });
    
    const ratingTexts = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    ratingText.textContent = ratingTexts[rating] || 'Click to rate';
}

function saveTestimonial(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const testimonialId = document.getElementById('testimonial-id').value;
    
    const testimonialData = {
        customerName: formData.get('customerName'),
        customerImage: formData.get('customerImage') || 'https://via.placeholder.com/60',
        rating: parseInt(formData.get('rating')),
        message: formData.get('message'),
        status: formData.get('status'),
        date: formData.get('date')
    };
    
    if (testimonialId) {
        // Update existing testimonial
        const index = testimonialsData.findIndex(t => t.id === parseInt(testimonialId));
        if (index !== -1) {
            testimonialsData[index] = { ...testimonialsData[index], ...testimonialData };
            showToast('Testimonial updated successfully!', 'success');
        }
    } else {
        // Add new testimonial
        const newId = Math.max(...testimonialsData.map(t => t.id), 0) + 1;
        testimonialsData.push({ id: newId, ...testimonialData });
        showToast('Testimonial added successfully!', 'success');
    }
    
    closeTestimonialModal();
    loadTestimonials();
}

function editTestimonial(id) {
    openTestimonialModal(id);
}

function toggleTestimonialStatus(id) {
    const testimonial = testimonialsData.find(t => t.id === id);
    if (testimonial) {
        const statusOrder = ['published', 'pending', 'hidden'];
        const currentIndex = statusOrder.indexOf(testimonial.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        testimonial.status = statusOrder[nextIndex];
        
        showToast(`Testimonial status changed to ${testimonial.status}`, 'success');
        loadTestimonials();
    }
}

function deleteTestimonial(id) {
    if (confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
        testimonialsData = testimonialsData.filter(t => t.id !== id);
        showToast('Testimonial deleted successfully!', 'success');
        loadTestimonials();
    }
}

function filterTestimonials() {
    const statusFilter = document.getElementById('testimonial-status-filter').value;
    const searchTerm = document.getElementById('testimonial-search').value.toLowerCase();
    
    let filtered = testimonialsData;
    
    if (statusFilter) {
        filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.customerName.toLowerCase().includes(searchTerm) ||
            t.message.toLowerCase().includes(searchTerm)
        );
    }
    
    displayTestimonials(filtered);
}

function searchTestimonials() {
    filterTestimonials();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ========== RATINGS MANAGEMENT ==========

let allRatings = [];
let filteredRatings = [];

async function loadRatings() {
    try {
        // Try to load from backend API first
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/reviews`);

        if (response.ok) {
            const reviews = await response.json();
            console.log('✅ Loaded reviews from backend:', reviews.length);

            // Get products for product names
            const productsResponse = await fetch(`${API_BASE_URL}/api/products`);
            const products = productsResponse.ok ? await productsResponse.json() : [];

            // Convert reviews to ratings format
            allRatings = reviews.map(review => {
                const product = products.find(p => p.id == review.productId);
                return {
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.createdAt,
                    user: review.userId ? `User ${review.userId}` : 'Anonymous',
                    userId: review.userId,
                    productId: review.productId,
                    productName: product ? product.name : `Product ${review.productId}`,
                    productImage: product ? product.imageUrl : 'https://via.placeholder.com/60',
                    isApproved: review.isApproved
                };
            });

            // Update overview stats
            updateRatingStats();

            // Populate product filter dropdown
            populateProductFilter(products);

            // Display ratings
            filteredRatings = [...allRatings];
            displayRatings();

            return;
        }
    } catch (apiError) {
        console.log('Backend API not available for ratings, using localStorage fallback');
    }

    // Fallback to localStorage
    const ratingsData = JSON.parse(localStorage.getItem('productRatings') || '{}');
    const products = JSON.parse(localStorage.getItem('products') || '[]');

    // Convert ratings object to array for easier manipulation
    allRatings = [];
    Object.keys(ratingsData).forEach(productId => {
        const productRatings = ratingsData[productId];
        const product = products.find(p => p.id == productId);

        if (product && productRatings.ratings) {
            productRatings.ratings.forEach(rating => {
                allRatings.push({
                    ...rating,
                    productId: productId,
                    productName: product.name,
                    productImage: product.image
                });
            });
        }
    });

    // Update overview stats
    updateRatingStats();

    // Populate product filter dropdown
    populateProductFilter(products);

    // Display ratings
    filteredRatings = [...allRatings];
    displayRatings();
}

function updateRatingStats() {
    const totalReviews = allRatings.length;
    const fiveStarReviews = allRatings.filter(r => r.rating === 5).length;
    const lowRatings = allRatings.filter(r => r.rating <= 2).length;
    
    let averageRating = 0;
    if (totalReviews > 0) {
        averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
    }
    
    document.getElementById('average-rating').textContent = averageRating.toFixed(1);
    document.getElementById('total-reviews').textContent = totalReviews;
    document.getElementById('five-star-reviews').textContent = fiveStarReviews;
    document.getElementById('low-ratings').textContent = lowRatings;
}

function populateProductFilter(products) {
    const select = document.getElementById('rating-product-filter');
    
    // Clear existing options except "All Products"
    select.innerHTML = '<option value="">All Products</option>';
    
    // Add products that have ratings
    const productsWithRatings = products.filter(product => 
        allRatings.some(rating => rating.productId == product.id)
    );
    
    productsWithRatings.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        select.appendChild(option);
    });
}

function filterRatings() {
    const productFilter = document.getElementById('rating-product-filter').value;
    const starFilter = document.getElementById('rating-star-filter').value;
    const sortFilter = document.getElementById('rating-sort-filter').value;
    
    // Filter ratings
    filteredRatings = allRatings.filter(rating => {
        let matches = true;
        
        if (productFilter && rating.productId != productFilter) {
            matches = false;
        }
        
        if (starFilter && rating.rating != parseInt(starFilter)) {
            matches = false;
        }
        
        return matches;
    });
    
    // Sort ratings
    filteredRatings.sort((a, b) => {
        switch (sortFilter) {
            case 'newest':
                return new Date(b.date) - new Date(a.date);
            case 'oldest':
                return new Date(a.date) - new Date(b.date);
            case 'highest':
                return b.rating - a.rating;
            case 'lowest':
                return a.rating - b.rating;
            default:
                return new Date(b.date) - new Date(a.date);
        }
    });
    
    displayRatings();
}

function displayRatings() {
    const container = document.getElementById('ratings-list');
    
    if (filteredRatings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-star text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl text-gray-500 mb-2">No ratings found</h3>
                <p class="text-gray-400">No customer reviews match your current filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredRatings.map(rating => `
        <div class="border-b border-gray-200 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
            <div class="flex items-start space-x-4">
                <img src="${rating.productImage}" alt="${rating.productName}"
                      class="w-16 h-16 object-cover rounded-lg">

                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h3 class="font-semibold text-gray-900">${rating.productName}</h3>
                            <div class="flex items-center space-x-2 mt-1">
                                <div class="star-rating">
                                    ${generateStarDisplay(rating.rating)}
                                </div>
                                <span class="text-sm text-gray-500">
                                    ${rating.rating}/5 stars
                                </span>
                                ${rating.isApproved ? `
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <i class="fas fa-check mr-1"></i>
                                        Approved
                                    </span>
                                ` : `
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        <i class="fas fa-clock mr-1"></i>
                                        Pending
                                    </span>
                                `}
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm text-gray-500">
                                ${formatDate(rating.date)}
                            </p>
                            <p class="text-sm font-medium text-gray-700">
                                ${rating.user}
                            </p>
                        </div>
                    </div>

                    ${rating.comment ? `
                        <div class="bg-gray-50 rounded-lg p-3 mt-3">
                            <p class="text-gray-700">${rating.comment}</p>
                        </div>
                    ` : ''}

                    <div class="flex items-center space-x-4 mt-3">
                        ${!rating.isApproved ? `
                            <button onclick="approveReview('${rating.id}')"
                                    class="text-green-600 hover:text-green-800 text-sm">
                                <i class="fas fa-check mr-1"></i>
                                Approve
                            </button>
                            <button onclick="rejectReview('${rating.id}')"
                                    class="text-orange-600 hover:text-orange-800 text-sm">
                                <i class="fas fa-times mr-1"></i>
                                Reject
                            </button>
                        ` : `
                            <button onclick="rejectReview('${rating.id}')"
                                    class="text-orange-600 hover:text-orange-800 text-sm">
                                <i class="fas fa-ban mr-1"></i>
                                Unapprove
                            </button>
                        `}
                        <button onclick="deleteRating('${rating.id}', '${rating.productId}')"
                                class="text-red-600 hover:text-red-800 text-sm">
                            <i class="fas fa-trash mr-1"></i>
                            Delete
                        </button>
                        <div class="text-xs text-gray-500 mt-1">
                            by ${rating.userName || 'Anonymous'}
                        </div>
                        ${rating.rating <= 2 ? `
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                Low Rating
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStarDisplay(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star star filled"></i>';
        } else {
            stars += '<i class="far fa-star star"></i>';
        }
    }
    return stars;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function deleteRating(reviewId, productId) {
    // Show modern confirmation modal instead of browser confirm
    await showDeleteRatingModal(reviewId, productId);
}

async function showDeleteRatingModal(reviewId, productId) {
    return new Promise((resolve) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'delete-rating-modal';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-95 animate-in">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-trash-alt text-red-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Delete Review</h3>
                    <p class="text-gray-600 text-center mb-6">
                        Are you sure you want to delete this review? This action cannot be undone and will permanently remove the review from the system.
                    </p>
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                            <div>
                                <p class="text-sm font-medium text-red-800">Warning</p>
                                <p class="text-sm text-red-700">This will affect the product's average rating calculation.</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="closeDeleteRatingModal(); resolveDelete(false);"
                                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                            Cancel
                        </button>
                        <button onclick="closeDeleteRatingModal(); resolveDelete(true, '${reviewId}', '${productId}');"
                                class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
                            <i class="fas fa-trash-alt mr-2"></i>
                            Delete Review
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modal);

        // Add animation
        setTimeout(() => {
            modal.querySelector('.animate-in').classList.remove('scale-95');
            modal.querySelector('.animate-in').classList.add('scale-100');
        }, 10);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeDeleteRatingModal();
                resolve(false);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeDeleteRatingModal();
                resolve(false);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

        // Store resolve function for later use
        window.deleteRatingResolve = resolve;
    });
}

function closeDeleteRatingModal() {
    const modal = document.getElementById('delete-rating-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    }
}

async function resolveDelete(confirmed, reviewId, productId) {
    if (window.deleteRatingResolve) {
        window.deleteRatingResolve(confirmed);
        delete window.deleteRatingResolve;
    }

    if (confirmed) {
        await performDeleteRating(reviewId, productId);
    }
}

async function performDeleteRating(reviewId, productId) {
    try {
        // Try to delete from backend API first
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('Review deleted successfully!', 'success');
            loadRatings();
            return;
        }
    } catch (apiError) {
        console.log('Backend API not available, using localStorage fallback');
    }

    // Fallback to localStorage
    let ratingsData = JSON.parse(localStorage.getItem('productRatings') || '{}');

    if (ratingsData[productId] && ratingsData[productId].ratings) {
        // Remove the specific rating by finding it in the array
        ratingsData[productId].ratings = ratingsData[productId].ratings.filter(
            rating => rating.id !== reviewId
        );

        // Recalculate average if there are remaining ratings
        if (ratingsData[productId].ratings.length > 0) {
            const ratings = ratingsData[productId].ratings;
            const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            ratingsData[productId].average = average;
            ratingsData[productId].count = ratings.length;
        } else {
            // No ratings left, remove the product entry
            delete ratingsData[productId];
        }

        // Update localStorage
        localStorage.setItem('productRatings', JSON.stringify(ratingsData));

        // Update products array
        let products = JSON.parse(localStorage.getItem('products') || '[]');
        const productIndex = products.findIndex(p => p.id == productId);
        if (productIndex !== -1) {
            if (ratingsData[productId]) {
                products[productIndex].rating = ratingsData[productId].average;
                products[productIndex].ratingCount = ratingsData[productId].count;
            } else {
                delete products[productIndex].rating;
                delete products[productIndex].ratingCount;
            }
        }
        localStorage.setItem('products', JSON.stringify(products));

        // Reload ratings display
        loadRatings();

        showToast('Rating deleted successfully!', 'success');
    }
}

async function approveReview(reviewId) {
    try {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/approve`, {
            method: 'PUT'
        });

        if (response.ok) {
            showToast('Review approved successfully!', 'success');
            loadRatings();
        } else {
            showToast('Failed to approve review', 'error');
        }
    } catch (error) {
        console.error('Error approving review:', error);
        showToast('Network error while approving review', 'error');
    }
}

async function rejectReview(reviewId) {
    try {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
        const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/reject`, {
            method: 'PUT'
        });

        if (response.ok) {
            showToast('Review rejected!', 'success');
            loadRatings();
        } else {
            showToast('Failed to reject review', 'error');
        }
    } catch (error) {
        console.error('Error rejecting review:', error);
        showToast('Network error while rejecting review', 'error');
    }
}

function respondToRating(productId, ratingDate) {
    const response = prompt('Enter your response to this review:');
    if (response && response.trim()) {
        // You can implement response functionality here
        // For now, just show a success message
        showToast('Response saved! (This feature can be expanded to store responses)', 'success');
    }
}

async function exportRatings() {
    if (filteredRatings.length === 0) {
        showModernAlert('No ratings to export!', 'warning', 'Export Failed');
        return;
    }

    // Show modern export modal
    await showExportRatingsModal();
}

async function showExportRatingsModal() {
    return new Promise((resolve) => {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'export-ratings-modal';

        // Get export statistics
        const totalRatings = filteredRatings.length;
        const approvedRatings = filteredRatings.filter(r => r.isApproved).length;
        const pendingRatings = totalRatings - approvedRatings;
        const averageRating = totalRatings > 0 ?
            (filteredRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1) : '0.0';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-lg w-full transform transition-all duration-300 scale-95 animate-in">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-file-export text-green-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Export Product Ratings</h3>
                    <p class="text-gray-600 text-center mb-6">
                        Export your product ratings data to a CSV file for analysis or backup.
                    </p>

                    <!-- Export Summary -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 class="font-medium text-blue-900 mb-3">Export Summary</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-blue-700">Total Ratings:</span>
                                <span class="font-semibold text-blue-900 ml-1">${totalRatings}</span>
                            </div>
                            <div>
                                <span class="text-blue-700">Approved:</span>
                                <span class="font-semibold text-green-600 ml-1">${approvedRatings}</span>
                            </div>
                            <div>
                                <span class="text-blue-700">Pending:</span>
                                <span class="font-semibold text-yellow-600 ml-1">${pendingRatings}</span>
                            </div>
                            <div>
                                <span class="text-blue-700">Avg Rating:</span>
                                <span class="font-semibold text-blue-900 ml-1">${averageRating} ⭐</span>
                            </div>
                        </div>
                    </div>

                    <!-- Export Options -->
                    <div class="space-y-3 mb-6">
                        <label class="flex items-center">
                            <input type="radio" name="exportFormat" value="csv" checked
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                            <span class="ml-2 text-gray-700">CSV Format (Excel compatible)</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="exportFormat" value="json"
                                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300">
                            <span class="ml-2 text-gray-700">JSON Format (for developers)</span>
                        </label>
                    </div>

                    <!-- Export Scope -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Export Scope</label>
                        <select id="exportScope" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="filtered">Current filtered results (${totalRatings} ratings)</option>
                            <option value="all">All ratings (unfiltered)</option>
                        </select>
                    </div>

                    <div class="flex space-x-3">
                        <button onclick="closeExportRatingsModal(); resolveExport(false);"
                                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                            Cancel
                        </button>
                        <button onclick="closeExportRatingsModal(); resolveExport(true);"
                                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200">
                            <i class="fas fa-download mr-2"></i>
                            Export Data
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.appendChild(modal);

        // Add animation
        setTimeout(() => {
            modal.querySelector('.animate-in').classList.remove('scale-95');
            modal.querySelector('.animate-in').classList.add('scale-100');
        }, 10);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeExportRatingsModal();
                resolve(false);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                closeExportRatingsModal();
                resolve(false);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });

        // Store resolve function for later use
        window.exportRatingsResolve = resolve;
    });
}

function closeExportRatingsModal() {
    const modal = document.getElementById('export-ratings-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    }
}

async function resolveExport(confirmed) {
    if (window.exportRatingsResolve) {
        window.exportRatingsResolve(confirmed);
        delete window.exportRatingsResolve;
    }

    if (confirmed) {
        await performExportRatings();
    }
}

async function performExportRatings() {
    const exportFormat = document.querySelector('input[name="exportFormat"]:checked').value;
    const exportScope = document.getElementById('exportScope').value;

    // Determine which ratings to export
    let ratingsToExport = filteredRatings;
    if (exportScope === 'all') {
        // Load all ratings if scope is 'all'
        try {
            const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8080';
            const response = await fetch(`${API_BASE_URL}/api/reviews`);

            if (response.ok) {
                const allReviews = await response.json();
                const productsResponse = await fetch(`${API_BASE_URL}/api/products`);
                const products = productsResponse.ok ? await productsResponse.json() : [];

                ratingsToExport = allReviews.map(review => {
                    const product = products.find(p => p.id == review.productId);
                    return {
                        id: review.id,
                        rating: review.rating,
                        comment: review.comment,
                        date: review.createdAt,
                        user: review.userId ? `User ${review.userId}` : 'Anonymous',
                        userId: review.userId,
                        productId: review.productId,
                        productName: product ? product.name : `Product ${review.productId}`,
                        productImage: product ? product.imageUrl : 'https://via.placeholder.com/60',
                        isApproved: review.isApproved
                    };
                });
            }
        } catch (error) {
            console.log('Could not load all ratings, using filtered results');
        }
    }

    if (ratingsToExport.length === 0) {
        showModernAlert('No ratings to export!', 'warning', 'Export Failed');
        return;
    }

    try {
        if (exportFormat === 'csv') {
            exportRatingsAsCSV(ratingsToExport);
        } else {
            exportRatingsAsJSON(ratingsToExport);
        }

        showModernAlert(`Successfully exported ${ratingsToExport.length} ratings!`, 'success', 'Export Complete');
    } catch (error) {
        console.error('Export error:', error);
        showModernAlert('Failed to export ratings. Please try again.', 'error', 'Export Failed');
    }
}

function exportRatingsAsCSV(ratings) {
    // Prepare CSV data with more comprehensive fields
    const headers = [
        'Review ID',
        'Product Name',
        'Product ID',
        'Rating',
        'Review Comment',
        'Customer',
        'Customer ID',
        'Date Submitted',
        'Status',
        'Approval Status'
    ];

    const csvData = [headers];

    ratings.forEach(rating => {
        csvData.push([
            rating.id || '',
            rating.productName || '',
            rating.productId || '',
            rating.rating || '',
            rating.comment || '',
            rating.user || '',
            rating.userId || '',
            formatDate(rating.date) || '',
            rating.isApproved ? 'Approved' : 'Pending',
            rating.isApproved ? 'Published' : 'Under Review'
        ]);
    });

    // Convert to CSV string
    const csvString = csvData.map(row =>
        row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Download CSV file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-ratings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

function exportRatingsAsJSON(ratings) {
    // Prepare JSON data with metadata
    const exportData = {
        exportInfo: {
            exportedAt: new Date().toISOString(),
            totalRatings: ratings.length,
            approvedRatings: ratings.filter(r => r.isApproved).length,
            averageRating: ratings.length > 0 ?
                (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(2) : 0,
            exportedBy: 'Admin Dashboard'
        },
        ratings: ratings.map(rating => ({
            id: rating.id,
            productId: rating.productId,
            productName: rating.productName,
            rating: rating.rating,
            comment: rating.comment,
            customerId: rating.userId,
            customerName: rating.user,
            submittedAt: rating.date,
            isApproved: rating.isApproved,
            status: rating.isApproved ? 'approved' : 'pending'
        }))
    };

    // Download JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product-ratings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

// Profile Settings Functions
function openProfileSettings() {
    document.getElementById('profileSettingsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Load current user data
    const user = auth.getUser();
    if (user) {
        document.getElementById('profileFirstName').value = user.firstName || '';
        document.getElementById('profileLastName').value = user.lastName || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileBio').value = user.bio || '';
    }
}

function closeProfileSettingsModal() {
    document.getElementById('profileSettingsModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function saveProfileSettings() {
    const formData = {
        firstName: document.getElementById('profileFirstName').value.trim(),
        lastName: document.getElementById('profileLastName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        phone: document.getElementById('profilePhone').value.trim(),
        bio: document.getElementById('profileBio').value.trim()
    };

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
        showModernAlert('Please fill in all required fields.', 'error', 'Validation Error');
        return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
        showModernAlert('Please enter a valid email address.', 'error', 'Validation Error');
        return;
    }

    // Update user data in localStorage
    const user = auth.getUser();
    const updatedUser = { ...user, ...formData };
    storage.set('user', updatedUser);

    // Update admin name display
    document.querySelector('.admin-name').textContent = `${formData.firstName} ${formData.lastName}`;

    showModernAlert('Profile settings saved successfully!', 'success', 'Settings Updated');
    closeProfileSettingsModal();
}

// System Settings Functions
function openSystemSettings() {
    document.getElementById('systemSettingsModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Load current settings from localStorage
    loadSystemSettings();
}

function closeSystemSettingsModal() {
    document.getElementById('systemSettingsModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function loadSystemSettings() {
    const settings = storage.get('systemSettings') || {
        siteName: 'Café Aroma',
        siteDescription: 'Welcome to Café Aroma, where every cup tells a story.',
        contactEmail: 'hello@cafearoma.com',
        businessStart: '06:00',
        businessEnd: '22:00',
        maintenanceMode: false,
        emailNotifications: true,
        autoSave: true,
        defaultCurrency: 'USD',
        itemsPerPage: '25',
        timezone: 'Asia/Bangkok'
    };

    // Populate form fields
    Object.keys(settings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = settings[key];
            } else {
                element.value = settings[key];
            }
        }
    });
}

function saveSystemSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value.trim(),
        siteDescription: document.getElementById('siteDescription').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        businessStart: document.getElementById('businessStart').value,
        businessEnd: document.getElementById('businessEnd').value,
        maintenanceMode: document.getElementById('maintenanceMode').checked,
        emailNotifications: document.getElementById('emailNotifications').checked,
        autoSave: document.getElementById('autoSave').checked,
        defaultCurrency: document.getElementById('defaultCurrency').value,
        itemsPerPage: document.getElementById('itemsPerPage').value,
        timezone: document.getElementById('timezone').value
    };

    // Basic validation
    if (!settings.siteName || !settings.contactEmail) {
        showModernAlert('Please fill in all required fields.', 'error', 'Validation Error');
        return;
    }

    if (!/\S+@\S+\.\S+/.test(settings.contactEmail)) {
        showModernAlert('Please enter a valid contact email address.', 'error', 'Validation Error');
        return;
    }

    // Save to localStorage
    storage.set('systemSettings', settings);

    showModernAlert('System settings saved successfully!', 'success', 'Settings Updated');
    closeSystemSettingsModal();

    // Apply settings that affect the UI immediately
    applySystemSettings(settings);
}

function resetSystemSettings() {
    const defaultSettings = {
        siteName: 'Café Aroma',
        siteDescription: 'Welcome to Café Aroma, where every cup tells a story.',
        contactEmail: 'hello@cafearoma.com',
        businessStart: '06:00',
        businessEnd: '22:00',
        maintenanceMode: false,
        emailNotifications: true,
        autoSave: true,
        defaultCurrency: 'USD',
        itemsPerPage: '25',
        timezone: 'Asia/Bangkok'
    };

    // Populate form with defaults
    Object.keys(defaultSettings).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = defaultSettings[key];
            } else {
                element.value = defaultSettings[key];
            }
        }
    });

    showModernAlert('Settings reset to defaults. Click "Save Settings" to apply.', 'info', 'Settings Reset');
}

function applySystemSettings(settings) {
    // Apply settings that affect the UI
    if (settings.siteName) {
        // Update page title or site name displays if they exist
        const titleElements = document.querySelectorAll('.site-name, .brand-name');
        titleElements.forEach(el => el.textContent = settings.siteName);
    }

    // Show maintenance mode warning if enabled
    if (settings.maintenanceMode) {
        showModernAlert('Maintenance mode is enabled. The site may not function normally for regular users.', 'warning', 'Maintenance Mode');
    }
}

// Change Password Functions
function openChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Reset form
    document.getElementById('changePasswordForm').reset();
    resetPasswordValidation();

    // Focus on current password field
    setTimeout(() => {
        document.getElementById('currentPassword').focus();
    }, 100);
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showModernAlert('Please fill in all password fields.', 'error', 'Validation Error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showModernAlert('New passwords do not match.', 'error', 'Password Mismatch');
        return;
    }

    if (newPassword.length < 8) {
        showModernAlert('New password must be at least 8 characters long.', 'error', 'Password Too Short');
        return;
    }

    // Check password strength
    const strength = checkPasswordStrength(newPassword);
    if (strength < 60) {
        showModernAlert('Please choose a stronger password. Include uppercase, lowercase, numbers, and special characters.', 'warning', 'Weak Password');
        return;
    }

    // Here you would typically send the password change request to the backend
    // For now, we'll simulate a successful password change
    showModernAlert('Password changed successfully! You will be logged out and need to log in with your new password.', 'success', 'Password Updated');

    // Close modal and logout after a delay
    setTimeout(() => {
        closeChangePasswordModal();
        setTimeout(() => {
            adminLogout();
        }, 1000);
    }, 2000);
}

function checkPasswordStrength(password) {
    let score = 0;

    // Length check
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 15; // lowercase
    if (/[A-Z]/.test(password)) score += 15; // uppercase
    if (/[0-9]/.test(password)) score += 15; // numbers
    if (/[^A-Za-z0-9]/.test(password)) score += 15; // special characters

    // Complexity bonus
    if (password.length >= 16 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        score += 10;
    }

    return Math.min(score, 100);
}

function updatePasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strength = checkPasswordStrength(password);

    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    const strengthPercent = document.getElementById('strengthPercent');

    // Update progress bar
    strengthBar.style.width = strength + '%';

    // Update color based on strength
    if (strength < 40) {
        strengthBar.style.backgroundColor = '#ef4444'; // red
        strengthText.textContent = 'Weak';
        strengthText.style.color = '#ef4444';
    } else if (strength < 70) {
        strengthBar.style.backgroundColor = '#f59e0b'; // yellow
        strengthText.textContent = 'Fair';
        strengthText.style.color = '#f59e0b';
    } else if (strength < 90) {
        strengthBar.style.backgroundColor = '#3b82f6'; // blue
        strengthText.textContent = 'Good';
        strengthText.style.color = '#3b82f6';
    } else {
        strengthBar.style.backgroundColor = '#10b981'; // green
        strengthText.textContent = 'Strong';
        strengthText.style.color = '#10b981';
    }

    strengthPercent.textContent = strength + '%';

    // Update requirement indicators
    updatePasswordRequirements(password);
}

function updatePasswordRequirements(password) {
    // Length requirement
    const lengthReq = document.getElementById('req-length');
    if (password.length >= 8) {
        lengthReq.className = 'fas fa-check text-green-500';
    } else {
        lengthReq.className = 'fas fa-times text-red-500';
    }

    // Uppercase requirement
    const upperReq = document.getElementById('req-uppercase');
    if (/[A-Z]/.test(password)) {
        upperReq.className = 'fas fa-check text-green-500';
    } else {
        upperReq.className = 'fas fa-times text-red-500';
    }

    // Lowercase requirement
    const lowerReq = document.getElementById('req-lowercase');
    if (/[a-z]/.test(password)) {
        lowerReq.className = 'fas fa-check text-green-500';
    } else {
        lowerReq.className = 'fas fa-times text-red-500';
    }

    // Number requirement
    const numberReq = document.getElementById('req-number');
    if (/[0-9]/.test(password)) {
        numberReq.className = 'fas fa-check text-green-500';
    } else {
        numberReq.className = 'fas fa-times text-red-500';
    }

    // Special character requirement
    const specialReq = document.getElementById('req-special');
    if (/[^A-Za-z0-9]/.test(password)) {
        specialReq.className = 'fas fa-check text-green-500';
    } else {
        specialReq.className = 'fas fa-times text-red-500';
    }
}

function resetPasswordValidation() {
    // Reset strength indicator
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('strengthText');
    const strengthPercent = document.getElementById('strengthPercent');

    strengthBar.style.width = '0%';
    strengthText.textContent = 'Very Weak';
    strengthText.style.color = '#6b7280';
    strengthPercent.textContent = '0%';

    // Reset all requirement indicators
    const requirements = ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'];
    requirements.forEach(req => {
        document.getElementById(req).className = 'fas fa-times text-red-500';
    });
}

// Add event listener for password strength checking
document.addEventListener('DOMContentLoaded', function() {
    const newPasswordField = document.getElementById('newPassword');
    if (newPasswordField) {
        newPasswordField.addEventListener('input', updatePasswordStrength);
    }
});

function backupSystem() {
    showModernAlert('System backup initiated. This would create a backup of all data.', 'success', 'Backup Started');
    // Implement actual backup logic here
}

function clearCache() {
    // Clear localStorage cache
    const keysToKeep = ['user', 'authToken']; // Keep essential data
    const allKeys = Object.keys(localStorage);

    allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
        }
    });

    showModernAlert('Cache cleared successfully! Page will reload.', 'success', 'Cache Cleared');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Contact featured toggle functionality
let showFeaturedContacts = false;

function toggleFeaturedContacts() {
    showFeaturedContacts = !showFeaturedContacts;
    const button = document.getElementById('featured-toggle-btn');

    if (showFeaturedContacts) {
        button.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        button.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        button.innerHTML = '<i class="fas fa-star-half-alt mr-2"></i><span>Show All</span>';
        showToast('Showing only featured contacts', 'info');
    } else {
        button.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
        button.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        button.innerHTML = '<i class="fas fa-star mr-2"></i><span>Show Featured</span>';
        showToast('Showing all contacts', 'info');
    }

    // Re-filter contacts
    filterContactsByStatus(currentContactStatusFilter);
}

// Initialize system settings on page load
document.addEventListener('DOMContentLoaded', function() {
    const settings = storage.get('systemSettings');
    if (settings) {
        applySystemSettings(settings);
    }
});

// Load low stock alerts
async function loadLowStockAlerts() {
    try {
        // If backend is configured, fetch from API
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/products`);

            if (response.ok) {
                const products = await response.json();
                const lowStockProducts = Array.isArray(products) ?
                    products.filter(product => product.stockQuantity < 30 && product.stockQuantity > 0) : [];
                const criticalStockProducts = Array.isArray(products) ?
                    products.filter(product => product.stockQuantity <= 10 && product.stockQuantity > 0) : [];

                displayLowStockAlerts(lowStockProducts);
                // Trigger critical stock notifications if any critical items
                if (criticalStockProducts.length > 0) {
                    checkCriticalStockWarnings();
                }
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        const lowStockProducts = products.filter(product => product.stockQuantity < 30 && product.stockQuantity > 0);
        const criticalStockProducts = products.filter(product => product.stockQuantity <= 10 && product.stockQuantity > 0);

        displayLowStockAlerts(lowStockProducts);
        // Trigger critical stock notifications if any critical items
        if (criticalStockProducts.length > 0) {
            checkCriticalStockWarnings();
        }

    } catch (error) {
        console.error('Error loading low stock alerts:', error);
        displayLowStockAlerts([]);
    }


    try {
        const response = await fetch(`http://localhost:8080/api/products/${productId}/stock`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                stockQuantity: amount,
                operation: "add"
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        const result = await response.json();
        console.log("✅ Restocked:", result);
        alert(`Restocked product ${result.name} (new stock: ${result.stockQuantity})`);

        // Reload your product list
        loadProducts();
    } catch (error) {
        console.error("❌ Error restocking:", error);
        alert("Failed to restock product: " + error.message);
    }
}

// Display low stock alerts
function displayLowStockAlerts(products) {
    const container = document.getElementById('low-stock-alerts');
    const countElement = document.getElementById('low-stock-count');

    if (!container || !countElement) return;

    // Update count
    countElement.textContent = `${products.length} item${products.length !== 1 ? 's' : ''}`;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                <p>All products are well-stocked!</p>
            </div>
        `;
        return;
    }

    // Sort products by stock level (most critical first)
    products.sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));

    container.innerHTML = products.map(product => {
        const stockLevel = product.stockQuantity || 0;
        const isCritical = stockLevel <= 10;
        const urgencyClass = isCritical ? 'bg-red-50 border-red-300' :
                            stockLevel <= 20 ? 'bg-orange-50 border-orange-300' :
                            'bg-yellow-50 border-yellow-300';
        const urgencyText = isCritical ? 'Critical' :
                          stockLevel <= 20 ? 'Low Stock' : 'Warning';
        const urgencyColor = isCritical ? 'text-red-600' :
                            stockLevel <= 20 ? 'text-orange-600' : 'text-yellow-600';
        const restockBtnClass = isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700';

        return `
            <div class="flex items-center justify-between p-4 ${urgencyClass} border-2 rounded-lg hover:bg-opacity-75 transition-all duration-200 animate-fade-in">
                <div class="flex items-center space-x-3">
                    <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <i class="fas fa-exclamation-triangle ${urgencyColor} text-lg"></i>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-900">${product.name || 'Unknown Product'}</h4>
                        <p class="text-sm text-gray-600">Stock: ${stockLevel} units remaining</p>
                        ${isCritical ? '<p class="text-xs text-red-700 font-bold">🚨 CRITICAL: Immediate restocking required!</p>' : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-3 py-1 ${isCritical ? 'bg-red-100 text-red-800' : stockLevel <= 20 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'} text-xs font-bold rounded-full border">
                        ${urgencyText}
                    </span>
                    <button onclick="showProductDetails(${product.id})"
                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                        <i class="fas fa-eye mr-1"></i>Details
                    </button>
                </div>
            </div>
        `;
    }).join('');

    console.log('📊 Low stock alerts displayed:', products.length, 'products');
}

// Show product details modal for low stock alerts
function showProductDetails(productId) {
    // If backend is configured, fetch from API
    if (window.API_BASE_URL) {
        fetchProductDetailsFromAPI(productId);
    } else {
        showProductDetailsFromLocal(productId);
    }
}

// Fetch product details from backend API
async function fetchProductDetailsFromAPI(productId) {
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch product details');
        }

        const product = await response.json();
        displayProductDetailsModal(product);

    } catch (error) {
        console.error('Error fetching product details:', error);
        showToast('Failed to load product details', 'error');
    }
}

// Show product details from localStorage
function showProductDetailsFromLocal(productId) {
    let products = storage.get('products') || [];
    if (products.length === 0) {
        products = getSampleProducts();
    }
    const product = products.find(p => p.id == productId);

    if (!product) {
        showToast('Product not found', 'error');
        return;
    }

    displayProductDetailsModal(product);
}

// Display product details modal
function displayProductDetailsModal(product) {
    const stockLevel = product.stockQuantity || 0;
    const isLowStock = stockLevel < 30;
    const urgencyClass = stockLevel <= 10 ? 'bg-red-100 border-red-300' :
                       stockLevel <= 20 ? 'bg-orange-100 border-orange-300' :
                       'bg-yellow-100 border-yellow-300';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'product-details-modal';

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">Product Details</h3>
                <button onclick="closeProductDetailsModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <div class="flex items-start space-x-4 mb-6">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/100'}" alt="${product.name}"
                         class="w-24 h-24 object-cover rounded-lg border">
                    <div class="flex-1">
                        <h4 class="text-2xl font-bold text-gray-900 mb-2">${product.name || 'Unknown Product'}</h4>
                        <p class="text-gray-600 mb-3">${product.description || 'No description available'}</p>

                        ${isLowStock ? `
                            <div class="p-3 ${urgencyClass} border rounded-lg mb-4">
                                <div class="flex items-center">
                                    <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
                                    <div>
                                        <p class="font-medium text-gray-900">Low Stock Alert</p>
                                        <p class="text-sm text-gray-700">Only ${stockLevel} units remaining</p>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Price:</span>
                            <span class="font-semibold">${formatCurrency(product.price || 0)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Stock Quantity:</span>
                            <span class="font-semibold ${stockLevel <= 10 ? 'text-red-600' : stockLevel <= 20 ? 'text-orange-600' : 'text-gray-900'}">
                                ${stockLevel} units
                            </span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Category:</span>
                            <span class="font-semibold">${product.categoryName || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Status:</span>
                            <span class="font-semibold ${product.isAvailable ? 'text-green-600' : 'text-red-600'}">
                                ${product.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600">Prep Time:</span>
                            <span class="font-semibold">${product.preparationTime || 0} min</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Calories:</span>
                            <span class="font-semibold">${product.calories || 'N/A'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">Featured:</span>
                            <span class="font-semibold ${product.isFeatured ? 'text-green-600' : 'text-gray-600'}">
                                ${product.isFeatured ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>

                ${product.ingredients ? `
                    <div class="mb-4">
                        <h5 class="font-medium text-gray-900 mb-2">Ingredients:</h5>
                        <p class="text-gray-700 text-sm">${product.ingredients}</p>
                    </div>
                ` : ''}

                ${product.allergens ? `
                    <div class="mb-6">
                        <h5 class="font-medium text-gray-900 mb-2">Allergens:</h5>
                        <p class="text-red-700 text-sm">${product.allergens}</p>
                    </div>
                ` : ''}

                <div class="flex justify-end space-x-3 pt-4 border-t">
                    <button onclick="closeProductDetailsModal()"
                        class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Close
                    </button>
                    <button onclick="editProduct(${product.id})"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-edit mr-2"></i>Edit Product
                    </button>
                    ${isLowStock ? `
                
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add animation
    setTimeout(() => {
        modal.querySelector('.shadow-xl').classList.add('scale-100');
    }, 10);
}

// Close product details modal
function closeProductDetailsModal() {
    const modal = document.getElementById('product-details-modal');
    if (modal) {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    }
}

// Restock product function
function restockProduct(productId) {
    // Create a restock modal instead of simple prompt
    showRestockModal(productId);
}

// Show restock modal
function showRestockModal(productId) {
    // Get current product data
    let currentProduct = null;

    if (window.API_BASE_URL) {
        // Fetch from API
        fetch(`${window.API_BASE_URL}/api/products/${productId}`)
            .then(response => response.ok ? response.json() : null)
            .then(product => {
                if (product) {
                    currentProduct = product;
                    createRestockModal(product);
                }
            })
            .catch(() => {
                // Fallback to localStorage
                let products = storage.get('products') || [];
                if (products.length === 0) {
                    products = getSampleProducts();
                }
                currentProduct = products.find(p => p.id == productId);
                if (currentProduct) {
                    createRestockModal(currentProduct);
                }
            });
    } else {
        // LocalStorage fallback
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        currentProduct = products.find(p => p.id == productId);
        if (currentProduct) {
            createRestockModal(currentProduct);
        }
    }
}

// Create and show restock modal
function createRestockModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'restock-modal';

    const currentStock = product.stockQuantity || 0;
    const suggestedRestock = Math.max(50, 100 - currentStock); // Suggest enough to reach 100 or at least 50

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">Restock Product</h3>
                <button onclick="closeRestockModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <div class="mb-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name || 'Unknown Product'}</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Current Stock:</span>
                            <span class="font-medium ${currentStock <= 10 ? 'text-red-600' : currentStock <= 20 ? 'text-orange-600' : 'text-gray-900'}">${currentStock} units</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gradient-to-r ${currentStock <= 10 ? 'from-red-500 to-red-600' : currentStock <= 20 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} h-2 rounded-full" style="width: ${Math.min((currentStock / 100) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Restock Quantity</label>
                    <input type="number" id="restock-quantity" min="1" value="${suggestedRestock}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Suggested: ${suggestedRestock} units (to reach healthy stock level)</p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Total Stock</label>
                    <div class="text-lg font-semibold text-gray-900" id="new-total-stock">${currentStock + suggestedRestock}</div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button onclick="closeRestockModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onclick="confirmRestock(${product.id})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Restock
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update new total when quantity changes
    const quantityInput = modal.querySelector('#restock-quantity');
    const totalDisplay = modal.querySelector('#new-total-stock');

    quantityInput.addEventListener('input', function() {
        const newQty = parseInt(this.value) || 0;
        totalDisplay.textContent = currentStock + newQty;
    });
}

// Close restock modal
function closeRestockModal() {
    const modal = document.getElementById('restock-modal');
    if (modal) {
        modal.remove();
    }
}

// Confirm restock action
async function confirmRestock(productId) {
    const quantityInput = document.getElementById('restock-quantity');
    const quantity = parseInt(quantityInput.value);

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    showToast(`Restocking ${quantity} units...`, 'info');

    try {
        if (window.API_BASE_URL) {
            // Update via API
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ stockQuantity: quantity, operation: 'add' })
            });

            if (response.ok) {
                showToast(`Successfully restocked ${quantity} units!`, 'success');
                closeRestockModal();
                closeProductDetailsModal();
                loadLowStockAlerts();
                loadProducts(); // Refresh product list to show updated stock
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        const productIndex = products.findIndex(p => p.id == productId);

        if (productIndex !== -1) {
            products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + quantity;
            storage.set('products', products);

            showToast(`Successfully restocked ${quantity} units!`, 'success');
            closeRestockModal();
            closeProductDetailsModal();
            loadLowStockAlerts();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error restocking product:', error);
        showToast('Failed to restock product. Please try again.', 'error');
    }
}

// Show restock modal
function showRestockModal(productId) {
    // Get current product data
    let currentProduct = null;

    if (window.API_BASE_URL) {
        // Fetch from API
        fetch(`${window.API_BASE_URL}/api/products/${productId}`)
            .then(response => response.ok ? response.json() : null)
            .then(product => {
                if (product) {
                    currentProduct = product;
                    createRestockModal(product);
                }
            })
            .catch(() => {
                // Fallback to localStorage
                let products = storage.get('products') || [];
                if (products.length === 0) {
                    products = getSampleProducts();
                }
                currentProduct = products.find(p => p.id == productId);
                if (currentProduct) {
                    createRestockModal(currentProduct);
                }
            });
    } else {
        // LocalStorage fallback
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        currentProduct = products.find(p => p.id == productId);
        if (currentProduct) {
            createRestockModal(currentProduct);
        }
    }
}

// Create and show restock modal
function createRestockModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'restock-modal';

    const currentStock = product.stockQuantity || 0;
    const suggestedRestock = Math.max(50, 100 - currentStock); // Suggest enough to reach 100 or at least 50

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">Restock Product</h3>
                <button onclick="closeRestockModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <div class="mb-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name || 'Unknown Product'}</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Current Stock:</span>
                            <span class="font-medium ${currentStock <= 10 ? 'text-red-600' : currentStock <= 20 ? 'text-orange-600' : 'text-gray-900'}">${currentStock} units</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gradient-to-r ${currentStock <= 10 ? 'from-red-500 to-red-600' : currentStock <= 20 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} h-2 rounded-full" style="width: ${Math.min((currentStock / 100) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Restock Quantity</label>
                    <input type="number" id="restock-quantity" min="1" value="${suggestedRestock}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Suggested: ${suggestedRestock} units (to reach healthy stock level)</p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Total Stock</label>
                    <div class="text-lg font-semibold text-gray-900" id="new-total-stock">${currentStock + suggestedRestock}</div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button onclick="closeRestockModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onclick="confirmRestock(${product.id})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Restock
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update new total when quantity changes
    const quantityInput = modal.querySelector('#restock-quantity');
    const totalDisplay = modal.querySelector('#new-total-stock');

    quantityInput.addEventListener('input', function() {
        const newQty = parseInt(this.value) || 0;
        totalDisplay.textContent = currentStock + newQty;
    });
}

// Close restock modal
function closeRestockModal() {
    const modal = document.getElementById('restock-modal');
    if (modal) {
        modal.remove();
    }
}

// Quick restock function for alerts
async function quickRestock(productId, suggestedQuantity = 30) {
    const productName = await getProductName(productId);
    const confirmed = await showQuickRestockConfirm(productName, suggestedQuantity);

    if (!confirmed) return;

    showToast(`Restocking ${suggestedQuantity} units...`, 'info');

    try {
        if (window.API_BASE_URL) {
            // Update via API
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ stockQuantity: suggestedQuantity, operation: 'add' })
            });

            if (response.ok) {
                showToast(`Successfully restocked ${suggestedQuantity} units of ${productName}!`, 'success');
                loadLowStockAlerts();
                loadDashboardStats();
                loadProducts(); // Refresh product list to show updated stock
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];

        // If no products in localStorage, initialize with sample products
        if (products.length === 0) {
            products = getSampleProducts();
        }

        const productIndex = products.findIndex(p => p.id == productId);

        if (productIndex !== -1) {
            products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + suggestedQuantity;
            storage.set('products', products);

            showToast(`Successfully restocked ${suggestedQuantity} units of ${productName}!`, 'success');
            loadLowStockAlerts();
            loadDashboardStats();
        } else {
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error quick restocking product:', error);
        showToast('Failed to restock product. Please try again.', 'error');
    }
}

// Get product name for confirmation
async function getProductName(productId) {
    try {
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`);
            if (response.ok) {
                const product = await response.json();
                return product.name || 'Unknown Product';
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        const product = products.find(p => p.id == productId);
        return product ? product.name : 'Unknown Product';
    } catch (error) {
        return 'Unknown Product';
    }
}

// Show quick restock confirmation
function showQuickRestockConfirm(productName, quantity) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'quick-restock-confirm';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-plus text-green-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Quick Restock</h3>
                    <p class="text-gray-600 text-center mb-4">
                        Add <span class="font-bold text-green-600">${quantity} units</span> to <span class="font-medium">${productName}</span>?
                    </p>
                    <div class="flex space-x-3">
                        <button onclick="resolveQuickRestock(false);"
                                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onclick="resolveQuickRestock(true);"
                                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-check mr-2"></i>Confirm
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Store resolve function
        window.quickRestockResolve = resolve;
    });
}

// Resolve quick restock confirmation
function resolveQuickRestock(confirmed) {
    const modal = document.getElementById('quick-restock-confirm');
    if (modal) modal.remove();

    if (window.quickRestockResolve) {
        window.quickRestockResolve(confirmed);
        delete window.quickRestockResolve;
    }
}

// Confirm restock action
async function confirmRestock(productId) {
    const quantityInput = document.getElementById('restock-quantity');
    const quantity = parseInt(quantityInput.value);

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    showToast(`Restocking ${quantity} units...`, 'info');

    try {
        if (window.API_BASE_URL) {
            // Update via API
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ stockQuantity: quantity, operation: 'add' })
            });

            if (response.ok) {
                showToast(`Successfully restocked ${quantity} units!`, 'success');
                closeRestockModal();
                closeProductDetailsModal();
                loadLowStockAlerts();
                loadDashboardStats();
                loadProducts(); // Refresh product list to show updated stock
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];

        // If no products in localStorage, initialize with sample products
        if (products.length === 0) {
            products = getSampleProducts();
        }

        const productIndex = products.findIndex(p => p.id == productId);

        if (productIndex !== -1) {
            products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + quantity;
            storage.set('products', products);

            showToast(`Successfully restocked ${quantity} units!`, 'success');
            closeRestockModal();
            closeProductDetailsModal();
            loadLowStockAlerts();
            loadDashboardStats();
        } else {
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error restocking product:', error);
        showToast('Failed to restock product. Please try again.', 'error');
    }
}

// Show restock modal
function showRestockModal(productId) {
    // Get current product data
    let currentProduct = null;

    if (window.API_BASE_URL) {
        // Fetch from API
        fetch(`${window.API_BASE_URL}/api/products/${productId}`)
            .then(response => response.ok ? response.json() : null)
            .then(product => {
                if (product) {
                    currentProduct = product;
                    createRestockModal(product);
                }
            })
            .catch(() => {
                // Fallback to localStorage
                let products = storage.get('products') || [];
                if (products.length === 0) {
                    products = getSampleProducts();
                }
                currentProduct = products.find(p => p.id == productId);
                if (currentProduct) {
                    createRestockModal(currentProduct);
                }
            });
    } else {
        // LocalStorage fallback
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        currentProduct = products.find(p => p.id == productId);
        if (currentProduct) {
            createRestockModal(currentProduct);
        }
    }
}

// Create and show restock modal
function createRestockModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'restock-modal';

    const currentStock = product.stockQuantity || 0;
    const suggestedRestock = Math.max(50, 100 - currentStock); // Suggest enough to reach 100 or at least 50

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">Restock Product</h3>
                <button onclick="closeRestockModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <div class="mb-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name || 'Unknown Product'}</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Current Stock:</span>
                            <span class="font-medium ${currentStock <= 10 ? 'text-red-600' : currentStock <= 20 ? 'text-orange-600' : 'text-gray-900'}">${currentStock} units</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gradient-to-r ${currentStock <= 10 ? 'from-red-500 to-red-600' : currentStock <= 20 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} h-2 rounded-full" style="width: ${Math.min((currentStock / 100) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Restock Quantity</label>
                    <input type="number" id="restock-quantity" min="1" value="${suggestedRestock}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Suggested: ${suggestedRestock} units (to reach healthy stock level)</p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Total Stock</label>
                    <div class="text-lg font-semibold text-gray-900" id="new-total-stock">${currentStock + suggestedRestock}</div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button onclick="closeRestockModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onclick="confirmRestock(${product.id})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Restock
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update new total when quantity changes
    const quantityInput = modal.querySelector('#restock-quantity');
    const totalDisplay = modal.querySelector('#new-total-stock');

    quantityInput.addEventListener('input', function() {
        const newQty = parseInt(this.value) || 0;
        totalDisplay.textContent = currentStock + newQty;
    });
}

// Close restock modal
function closeRestockModal() {
    const modal = document.getElementById('restock-modal');
    if (modal) {
        modal.remove();
    }
}

// Confirm restock action
async function confirmRestock(productId) {
    const quantityInput = document.getElementById('restock-quantity');
    const quantity = parseInt(quantityInput.value);

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    showToast(`Restocking ${quantity} units...`, 'info');

    try {
        if (window.API_BASE_URL) {
            // Update via API
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ stockQuantity: quantity, operation: 'add' })
            });

            if (response.ok) {
                showToast(`Successfully restocked ${quantity} units!`, 'success');
                closeRestockModal();
                closeProductDetailsModal();
                loadLowStockAlerts();
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];

        // If no products in localStorage, initialize with sample products
        if (products.length === 0) {
            products = getSampleProducts();
        }

        const productIndex = products.findIndex(p => p.id == productId);

        if (productIndex !== -1) {
            products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + quantity;
            storage.set('products', products);

            showToast(`Successfully restocked ${quantity} units!`, 'success');
            closeRestockModal();
            closeProductDetailsModal();
            loadLowStockAlerts();
        } else {
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error restocking product:', error);
        showToast('Failed to restock product. Please try again.', 'error');
    }
}


// Show restock modal
function showRestockModal(productId) {
    // Get current product data
    let currentProduct = null;

    if (window.API_BASE_URL) {
        // Fetch from API
        fetch(`${window.API_BASE_URL}/api/products/${productId}`)
            .then(response => response.ok ? response.json() : null)
            .then(product => {
                if (product) {
                    currentProduct = product;
                    createRestockModal(product);
                }
            })
            .catch(() => {
                // Fallback to localStorage
                const products = storage.get('products') || [];
                currentProduct = products.find(p => p.id == productId);
                if (currentProduct) {
                    createRestockModal(currentProduct);
                }
            });
    } else {
        // LocalStorage fallback
        const products = storage.get('products') || [];
        currentProduct = products.find(p => p.id == productId);
        if (currentProduct) {
            createRestockModal(currentProduct);
        }
    }
}

// Create and show restock modal
function createRestockModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'restock-modal';

    const currentStock = product.stockQuantity || 0;
    const suggestedRestock = Math.max(50, 100 - currentStock); // Suggest enough to reach 100 or at least 50

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div class="flex justify-between items-center p-6 border-b">
                <h3 class="text-xl font-semibold text-gray-900">Restock Product</h3>
                <button onclick="closeRestockModal()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="p-6">
                <div class="mb-4">
                    <h4 class="font-medium text-gray-900 mb-2">${product.name || 'Unknown Product'}</h4>
                    <div class="bg-gray-50 p-3 rounded-lg">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-600">Current Stock:</span>
                            <span class="font-medium ${currentStock <= 10 ? 'text-red-600' : currentStock <= 20 ? 'text-orange-600' : 'text-gray-900'}">${currentStock} units</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gradient-to-r ${currentStock <= 10 ? 'from-red-500 to-red-600' : currentStock <= 20 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} h-2 rounded-full" style="width: ${Math.min((currentStock / 100) * 100, 100)}%"></div>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Restock Quantity</label>
                    <input type="number" id="restock-quantity" min="1" value="${suggestedRestock}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <p class="text-xs text-gray-500 mt-1">Suggested: ${suggestedRestock} units (to reach healthy stock level)</p>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">New Total Stock</label>
                    <div class="text-lg font-semibold text-gray-900" id="new-total-stock">${currentStock + suggestedRestock}</div>
                </div>

                <div class="flex justify-end space-x-3">
                    <button onclick="closeRestockModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                    </button>
                    <button onclick="confirmRestock(${product.id})" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>Restock
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update new total when quantity changes
    const quantityInput = modal.querySelector('#restock-quantity');
    const totalDisplay = modal.querySelector('#new-total-stock');

    quantityInput.addEventListener('input', function() {
        const newQty = parseInt(this.value) || 0;
        totalDisplay.textContent = currentStock + newQty;
    });
}

// Close restock modal
function closeRestockModal() {
    const modal = document.getElementById('restock-modal');
    if (modal) {
        modal.remove();
    }
}

// Confirm restock action
async function confirmRestock(productId) {
    const quantityInput = document.getElementById('restock-quantity');
    const quantity = parseInt(quantityInput.value);

    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }

    showToast(`Restocking ${quantity} units...`, 'info');

    try {
        if (window.API_BASE_URL) {
            // Update via API
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ stockQuantity: quantity, operation: 'add' })
            });

            if (response.ok) {
                showToast(`Successfully restocked ${quantity} units!`, 'success');
                closeRestockModal();
                closeProductDetailsModal();
                loadLowStockAlerts();
                return;
            }
        }

        // Fallback to localStorage
        let products = storage.get('products') || [];
        if (products.length === 0) {
            products = getSampleProducts();
        }
        const productIndex = products.findIndex(p => p.id == productId);

        if (productIndex !== -1) {
            products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + quantity;
            storage.set('products', products);

            showToast(`Successfully restocked ${quantity} units!`, 'success');
            closeRestockModal();
            closeProductDetailsModal();
            loadLowStockAlerts();
        } else {
            throw new Error('Product not found');
        }

    } catch (error) {
        console.error('Error restocking product:', error);
        showToast('Failed to restock product. Please try again.', 'error');
    }
}

// Check for critical stock warnings and show notifications
async function checkCriticalStockWarnings() {
    try {
        let products = [];

        // Fetch products from backend or localStorage
        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/products`);
            if (response.ok) {
                products = await response.json();
            }
        } else {
            products = storage.get('products') || [];
        }

        const criticalStock = products.filter(p => (p.stockQuantity || 0) <= 10 && (p.stockQuantity || 0) > 0);
        const lowStock = products.filter(p => (p.stockQuantity || 0) < 30 && (p.stockQuantity || 0) > 10);

        // Show critical stock warnings (most urgent)
        if (criticalStock.length > 0) {
            showCriticalStockNotification(criticalStock);
        }

        // Show low stock warnings (less intrusive) only if no critical alerts
        if (lowStock.length > 0 && criticalStock.length === 0) {
            showLowStockNotification(lowStock);
        }

    } catch (error) {
        console.error('Error checking stock warnings:', error);
    }
}

// Show critical stock notification
function showCriticalStockNotification(products) {
    // Don't show if notification already exists
    if (document.getElementById('critical-stock-notification')) return;

    const productNames = products.map(p => p.name).join(', ');

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-lg shadow-xl z-50 max-w-md animate-slide-in border-2 border-red-700';
    notification.id = 'critical-stock-notification';

    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl animate-pulse"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-bold text-lg mb-1">🚨 Critical Stock Alert!</h4>
                <p class="text-red-100 mb-3">${products.length} product${products.length > 1 ? 's' : ''} critically low on stock:</p>
                <p class="text-sm font-medium mb-3 bg-red-700 px-2 py-1 rounded">${productNames}</p>
                <div class="flex space-x-2">
                    <button onclick="viewLowStockAlerts()" class="bg-white text-red-600 hover:bg-gray-100 px-3 py-2 rounded text-sm font-medium transition-colors place-content-center">
                        View Details
                    </button>
                </div>
            </div>
            <button onclick="dismissCriticalNotification()" class="text-red-200 hover:text-white ml-2">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-dismiss after 15 seconds for critical alerts
    setTimeout(() => {
        dismissCriticalNotification();
    }, 15000);
}

// Show low stock notification (less intrusive)
function showLowStockNotification(products) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md animate-slide-in';
    notification.id = 'low-stock-notification';

    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
                <i class="fas fa-exclamation-circle text-xl"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-bold mb-1">Low Stock Warning</h4>
                <p class="text-orange-100 text-sm mb-2">${products.length} product${products.length > 1 ? 's' : ''} running low on stock</p>
                <button onclick="viewLowStockAlerts(); dismissLowNotification()" class="bg-orange-600 hover:bg-orange-700 px-3 py-1 rounded text-sm font-medium transition-colors">
                    View Alerts
                </button>
            </div>
            <button onclick="dismissLowNotification()" class="text-orange-200 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
        dismissLowNotification();
    }, 8000);
}

// Dismiss critical stock notification
function dismissCriticalNotification() {
    const notification = document.getElementById('critical-stock-notification');
    if (notification) {
        notification.classList.add('animate-slide-out');
        setTimeout(() => notification.remove(), 300);
    }
}

// Dismiss low stock notification
function dismissLowNotification() {
    const notification = document.getElementById('low-stock-notification');
    if (notification) {
        notification.classList.add('animate-slide-out');
        setTimeout(() => notification.remove(), 300);
    }
}

// Edit product function
function editProduct(productId) {
    // Close current modal first
    closeProductDetailsModal();

    // Populate the add product modal with existing data
    populateEditProductModal(productId);
}

// Populate edit product modal with existing data
async function populateEditProductModal(productId) {
    try {
        let product = null;

        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`);
            if (response.ok) {
                product = await response.json();
            }
        }

        if (!product) {
            // Fallback to localStorage
            let products = storage.get('products') || [];
            if (products.length === 0) {
                products = getSampleProducts();
            }
            product = products.find(p => p.id == productId);
        }

        if (!product) {
            showToast('Product not found', 'error');
            return;
        }

        // Populate the add product modal (reuse existing modal)
        document.getElementById('productId').value = product.id || '';
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.categoryId || product.category || '';
        document.getElementById('productStock').value = product.stockQuantity || 100;
        document.getElementById('productImageUrl').value = product.imageUrl || '';
        document.getElementById('productPrepTime').value = product.preparationTime || 5;
        document.getElementById('productCalories').value = product.calories || '';
        document.getElementById('productIngredients').value = product.ingredients || '';
        document.getElementById('productAllergens').value = product.allergens || '';
        document.getElementById('productAvailable').checked = product.isAvailable !== false;
        document.getElementById('productFeatured').checked = product.isFeatured === true;

        // Update modal title and button
        const modalTitle = document.querySelector('#addProductModal h3');
        const submitBtn = document.querySelector('#addProductModal button[type="submit"]');

        if (modalTitle) modalTitle.textContent = 'Edit Product';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Product';
        }

        // Show the modal
        document.getElementById('addProductModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading product for editing:', error);
        showToast('Failed to load product data', 'error');
    }
}


// Populate edit product modal with existing data
async function populateEditProductModal(productId) {
    try {
        let product = null;

        if (window.API_BASE_URL) {
            const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}`);
            if (response.ok) {
                product = await response.json();
            }
        }

        if (!product) {
            // Fallback to localStorage
            let products = storage.get('products') || [];
            if (products.length === 0) {
                products = getSampleProducts();
            }
            product = products.find(p => p.id == productId);
        }

        if (!product) {
            showToast('Product not found', 'error');
            return;
        }

        // Populate the add product modal (reuse existing modal)
        document.getElementById('productId').value = product.id || '';
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productCategory').value = product.categoryId || product.category || '';
        document.getElementById('productStock').value = product.stockQuantity || 100;
        document.getElementById('productImageUrl').value = product.imageUrl || '';
        document.getElementById('productPrepTime').value = product.preparationTime || 5;
        document.getElementById('productCalories').value = product.calories || '';
        document.getElementById('productIngredients').value = product.ingredients || '';
        document.getElementById('productAllergens').value = product.allergens || '';
        document.getElementById('productAvailable').checked = product.isAvailable !== false;
        document.getElementById('productFeatured').checked = product.isFeatured === true;

        // Update modal title and button
        const modalTitle = document.querySelector('#addProductModal h3');
        const submitBtn = document.querySelector('#addProductModal button[type="submit"]');

        if (modalTitle) modalTitle.textContent = 'Edit Product';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Product';
        }

        // Show the modal
        document.getElementById('addProductModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading product for editing:', error);
        showToast('Failed to load product data', 'error');
    }
}

// Bulk restock critical items
async function bulkRestockCritical(productIds) {
    if (!Array.isArray(productIds) || productIds.length === 0) return;

    const confirmed = await showBulkRestockConfirm(productIds.length);
    if (!confirmed) return;

    dismissCriticalNotification();
    showToast(`Restocking ${productIds.length} critical items...`, 'info');

    let successCount = 0;
    let failCount = 0;

    for (const productId of productIds) {
        try {
            if (window.API_BASE_URL) {
                const response = await fetch(`${window.API_BASE_URL}/api/products/${productId}/stock`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify({ stockQuantity: 50, operation: 'add' })
                });

                if (response.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } else {
                // Fallback to localStorage
                let products = storage.get('products') || [];
                if (products.length === 0) {
                    products = getSampleProducts();
                }
                const productIndex = products.findIndex(p => p.id == productId);

                if (productIndex !== -1) {
                    products[productIndex].stockQuantity = (products[productIndex].stockQuantity || 0) + 50;
                    storage.set('products', products);
                    successCount++;
                } else {
                    failCount++;
                }
            }
        } catch (error) {
            console.error(`Error restocking product ${productId}:`, error);
            failCount++;
        }
    }

    // Show results
    if (successCount > 0) {
        showToast(`Successfully restocked ${successCount} critical items!`, 'success');
    }
    if (failCount > 0) {
        showToast(`Failed to restock ${failCount} items. Please check manually.`, 'warning');
    }

    // Refresh alerts and stats
    loadLowStockAlerts();
    loadDashboardStats();
    loadProducts(); // Refresh product list to show updated stock
}

// Show bulk restock confirmation
function showBulkRestockConfirm(itemCount) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.id = 'bulk-restock-confirm';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-sm w-full">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 text-center mb-2">Bulk Restock Critical Items</h3>
                    <p class="text-gray-600 text-center mb-4">
                        Add <span class="font-bold text-red-600">50 units each</span> to all <span class="font-bold">${itemCount} critical items</span>?
                    </p>
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p class="text-sm text-yellow-800">
                            <i class="fas fa-info-circle mr-1"></i>
                            This will help resolve critical stock shortages quickly.
                        </p>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="resolveBulkRestock(false);"
                                class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                            Cancel
                        </button>
                        <button onclick="resolveBulkRestock(true);"
                                class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>Restock All
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Store resolve function
        window.bulkRestockResolve = resolve;
    });
}

// Resolve bulk restock confirmation
function resolveBulkRestock(confirmed) {
    const modal = document.getElementById('bulk-restock-confirm');
    if (modal) modal.remove();

    if (window.bulkRestockResolve) {
        window.bulkRestockResolve(confirmed);
        delete window.bulkRestockResolve;
    }
}

// View low stock alerts (scroll to alerts section)
function viewLowStockAlerts() {
    const alertsSection = document.getElementById('low-stock-alerts');
    if (alertsSection) {
        alertsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        alertsSection.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-50');
        setTimeout(() => {
            alertsSection.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-50');
        }, 3000);
    }
}

// Auto-refresh dashboard stats every 30 seconds
setInterval(() => {
    if (!document.getElementById('dashboard-section').classList.contains('hidden')) {
        loadDashboardStats();
        loadRecentActivity();
        loadLowStockAlerts();
    }
}, 30000);