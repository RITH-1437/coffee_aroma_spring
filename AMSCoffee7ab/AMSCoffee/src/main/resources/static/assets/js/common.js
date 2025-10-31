// Common JavaScript functions for Coffee Shop Website

// Toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Loading overlay
function showLoading() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Local storage helpers
const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            return null;
        }
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key) => {
        localStorage.removeItem(key);
    },
    clear: () => {
        localStorage.clear();
    }
};

// Authentication helpers
const auth = {
    isLoggedIn: () => storage.get('user') !== null,
    getUser: () => storage.get('user'),
    login: (user) => {
        storage.set('user', user);
        updateAuthUI();
    },
    logout: () => {
        storage.remove('user');
        storage.remove('cart');
        updateAuthUI();
        window.location.href = 'index.html';
    },
    logoutWithConfirmation: () => {
        showLogoutModal();
    },
    isAdmin: () => {
        const user = storage.get('user');
        return user && (user.role === 'admin' || user.role === 'administrator');
    }
};

// Update authentication UI
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (auth.isLoggedIn() && authButtons && userMenu) {
        const user = auth.getUser();
        authButtons.style.display = 'none';
        userMenu.style.display = 'flex';
        userMenu.querySelector('.user-name').textContent = user.name;
        
        // Add admin dashboard link if user is admin
        updateAdminAccess(userMenu, user);
    } else if (authButtons && userMenu) {
        authButtons.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

// Update admin access in navigation
function updateAdminAccess(userMenu, user) {
    // Remove existing admin link if any
    const existingAdminLink = userMenu.querySelector('.admin-dashboard-link');
    if (existingAdminLink) {
        existingAdminLink.remove();
    }
    
    // Add admin dashboard link if user is admin
    if (auth.isAdmin()) {
        const adminLink = document.createElement('a');
        adminLink.href = 'admin/dashboard.html';
        adminLink.className = 'admin-dashboard-link text-coffee-brown hover:text-coffee-dark text-sm font-medium bg-coffee-light px-3 py-1 rounded';
        adminLink.innerHTML = '<i class="fas fa-tachometer-alt mr-1"></i>Admin Dashboard';
        
        // Insert before the logout button
        const logoutButton = userMenu.querySelector('button');
        if (logoutButton) {
            userMenu.insertBefore(adminLink, logoutButton);
        } else {
            userMenu.appendChild(adminLink);
        }
    }
}

// Shopping cart functionality
const cart = {
    get: () => storage.get('cart') || [],
    add: (product) => {
        const currentCart = cart.get();
        const existingItem = currentCart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            currentCart.push({ ...product, quantity: 1 });
        }
        
        storage.set('cart', currentCart);
        updateCartUI();
        showToast('Item added to cart!', 'success');
    },
    remove: (productId) => {
        const currentCart = cart.get();
        const updatedCart = currentCart.filter(item => item.id !== productId);
        storage.set('cart', updatedCart);
        updateCartUI();
        showToast('Item removed from cart!', 'info');
    },
    updateQuantity: (productId, quantity) => {
        const currentCart = cart.get();
        const item = currentCart.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                cart.remove(productId);
            } else {
                item.quantity = quantity;
                storage.set('cart', currentCart);
                updateCartUI();
            }
        }
    },
    clear: () => {
        storage.remove('cart');
        updateCartUI();
    },
    getTotal: () => {
        return cart.get().reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    getItemCount: () => {
        return cart.get().reduce((count, item) => count + item.quantity, 0);
    }
};

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    const itemCount = cart.getItemCount();
    const total = cart.getTotal();
    
    if (cartCount) {
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'inline' : 'none';
    }
    
    if (cartItems) {
        displayCartItems();
    }
    
    if (cartTotal) {
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }
}

// Display cart items
function displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;
    
    const cartData = cart.get();
    
    if (cartData.length === 0) {
        cartContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Your cart is empty</p>';
        return;
    }
    
    cartContainer.innerHTML = cartData.map(item => `
        <div class="flex items-center justify-between p-4 border-b">
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                <div>
                    <h4 class="font-semibold">${item.name}</h4>
                    <p class="text-coffee-brown">$${item.price}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})" 
                        class="bg-gray-200 px-2 py-1 rounded">-</button>
                <span class="px-3">${item.quantity}</span>
                <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})" 
                        class="bg-gray-200 px-2 py-1 rounded">+</button>
                <button onclick="cart.remove(${item.id})" 
                        class="text-red-500 ml-4">Remove</button>
            </div>
        </div>
    `).join('');
}

// API helpers (mock for frontend-only version)
const api = {
    baseUrl: 'http://localhost:8080/api', // Spring Boot backend URL
    
    // Generic request method
    request: async (endpoint, options = {}) => {
        try {
            showLoading();
            
            // Get auth token if available
            const token = localStorage.getItem('authToken');
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            // Add auth header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch(`${api.baseUrl}${endpoint}`, {
                headers: headers,
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Try to parse as JSON, fallback to text
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Re-throw to handle in calling function
        } finally {
            hideLoading();
        }
    },
    
    // Products
    getProducts: async () => {
        const data = await api.request('/products');
        return data || getSampleProducts();
    },
    
    getCategories: async () => {
        const data = await api.request('/categories');
        return data || getSampleCategories();
    },
    
    // Orders
    createOrder: async (orderData) => {
        // Transform frontend order data to backend format
        const backendOrderData = {
            customerName: orderData.customerName || `${orderData.firstName} ${orderData.lastName}`,
            customerEmail: orderData.customerEmail || orderData.email,
            customerPhone: orderData.customerPhone || orderData.phone,
            orderType: orderData.orderType, // 'delivery', 'pickup', 'dine_in'
            status: 'pending',
            subtotal: orderData.subtotal || 0,
            taxAmount: orderData.tax || 0,
            deliveryFee: orderData.deliveryFee || 0,
            totalAmount: orderData.total || 0,
            paymentStatus: 'pending',
            paymentMethod: orderData.paymentMethod || 'card',
            specialInstructions: orderData.specialInstructions || '',
            deliveryAddress: orderData.deliveryAddress || ''
        };
        
        console.log('🛒 Sending order to backend:', backendOrderData);
        
        return await api.request('/orders', {
            method: 'POST',
            body: JSON.stringify(backendOrderData)
        });
    },
    
    // Users
    register: async (userData) => {
        // Map frontend data to backend expected format
        const backendData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone,
            role: userData.role || 'customer',
            passwordHash: userData.password, // Map password to passwordHash
            birthDate: userData.birthDate,
            newsletterSubscribed: userData.newsletter
        };
        
        try {
            const result = await api.request('/users/register', {
                method: 'POST',
                body: JSON.stringify(backendData)
            });
            return result;
        } catch (error) {
            console.error('Registration API error:', error);
            throw error;
        }
    },
    
    login: async (credentials) => {
        // For demo purposes, return immediately without backend call
        // In production, this would make a real API request
        return null; // This will make the frontend handle authentication locally
    },
    
    // Contact
    submitContact: async (contactData) => {
        return await api.request('/api/contacts', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
    }
};

// Sample data for frontend testing
function getSampleProducts() {
    return [
        { id: 1, name: 'Classic Espresso', price: 3.50, category: 'Coffee', image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop&auto=format', stockQuantity: 25, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 2, name: 'Cappuccino', price: 4.50, category: 'Coffee', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop&auto=format', stockQuantity: 15, categoryId: 1, isAvailable: true, isFeatured: true },
        { id: 3, name: 'Caramel Latte', price: 5.00, category: 'Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&auto=format', stockQuantity: 8, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 4, name: 'Americano', price: 3.25, category: 'Coffee', image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&h=300&fit=crop&auto=format', stockQuantity: 35, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 5, name: 'Mocha', price: 5.25, category: 'Coffee', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format', stockQuantity: 12, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 6, name: 'Macchiato', price: 4.25, category: 'Coffee', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop&auto=format', stockQuantity: 22, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 7, name: 'Flat White', price: 4.75, category: 'Coffee', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop&auto=format', stockQuantity: 18, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 8, name: 'Iced Coffee', price: 3.75, category: 'Coffee', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop&auto=format', stockQuantity: 28, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 9, name: 'Frappé', price: 5.50, category: 'Coffee', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=300&fit=crop&auto=format', stockQuantity: 6, categoryId: 1, isAvailable: true, isFeatured: false },
        { id: 10, name: 'Croissant', price: 3.50, category: 'Pastry', image: '/images/croissant.webp', stockQuantity: 45, categoryId: 2, isAvailable: true, isFeatured: true },
        { id: 11, name: 'Blueberry Muffin', price: 3.25, category: 'Pastry', image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400&h=300&fit=crop&auto=format', stockQuantity: 32, categoryId: 2, isAvailable: true, isFeatured: false },
        { id: 12, name: 'Danish', price: 4.00, category: 'Pastry', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&auto=format', stockQuantity: 14, categoryId: 2, isAvailable: true, isFeatured: false }
    ];
}

function getSampleCategories() {
    return [
        { id: 1, name: 'Coffee' },
        { id: 2, name: 'Pastry' },
        { id: 3, name: 'Cold Drinks' }
    ];
}

// Form validation
function validateForm(formData, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
        const value = formData[field];
        const rule = rules[field];
        
        // Create user-friendly field names
        const fieldName = field === 'email' ? 'Email' : 
                         field === 'password' ? 'Password' : 
                         field === 'role' ? 'Role' : 
                         field.charAt(0).toUpperCase() + field.slice(1);
        
        if (rule.required && (!value || value.trim() === '')) {
            errors[field] = `${fieldName} is required`;
        }
        
        if (rule.email && value && !/\S+@\S+\.\S+/.test(value)) {
            errors[field] = 'Please enter a valid email address';
        }
        
        if (rule.minLength && value && value.length < rule.minLength) {
            errors[field] = `${fieldName} must be at least ${rule.minLength} characters`;
        }
        
        if (rule.match && value !== formData[rule.match]) {
            errors[field] = 'Passwords do not match';
        }
    });
    
    return Object.keys(errors).length === 0 ? null : errors;
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Modern confirmation modal functionality
function showModernConfirm(message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Remove existing modal if any
        const existingModal = document.getElementById('modern-confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'modern-confirm-modal';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-orange-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">${title}</h3>
                    <p class="text-gray-600 text-center mb-6">${message}</p>
                    <div class="flex space-x-3">
                        <button id="confirm-cancel" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                            ${cancelText}
                        </button>
                        <button id="confirm-ok" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
                            ${confirmText}
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
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                resolve(false);
            }, 300);
        });

        document.getElementById('confirm-ok').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                resolve(true);
            }, 300);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    resolve(false);
                }, 300);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    resolve(false);
                }, 300);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    });
}

// Modern alert modal functionality
function showModernAlert(message, type = 'info', title = null) {
    // Remove existing alert if any
    const existingAlert = document.getElementById('modern-alert-modal');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Set default title based on type
    if (!title) {
        switch (type) {
            case 'success':
                title = 'Success!';
                break;
            case 'error':
                title = 'Error!';
                break;
            case 'warning':
                title = 'Warning!';
                break;
            default:
                title = 'Notice';
        }
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'modern-alert-modal';

    // Set icon and colors based on type
    let iconClass = 'fas fa-info-circle';
    let iconBgColor = 'bg-blue-100';
    let iconColor = 'text-blue-600';
    let buttonColor = 'bg-blue-600 hover:bg-blue-700';

    switch (type) {
        case 'success':
            iconClass = 'fas fa-check-circle';
            iconBgColor = 'bg-green-100';
            iconColor = 'text-green-600';
            buttonColor = 'bg-green-600 hover:bg-green-700';
            break;
        case 'error':
            iconClass = 'fas fa-exclamation-circle';
            iconBgColor = 'bg-red-100';
            iconColor = 'text-red-600';
            buttonColor = 'bg-red-600 hover:bg-red-700';
            break;
        case 'warning':
            iconClass = 'fas fa-exclamation-triangle';
            iconBgColor = 'bg-yellow-100';
            iconColor = 'text-yellow-600';
            buttonColor = 'bg-yellow-600 hover:bg-yellow-700';
            break;
    }

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in">
            <div class="p-6">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-16 h-16 ${iconBgColor} rounded-full flex items-center justify-center">
                        <i class="${iconClass} ${iconColor} text-2xl"></i>
                    </div>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">${title}</h3>
                <p class="text-gray-600 text-center mb-6">${message}</p>
                <div class="flex justify-center">
                    <button id="alert-ok-button" class="px-6 py-2 ${buttonColor} text-white rounded-lg transition-colors duration-200">
                        OK
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

    // Event listener
    document.getElementById('alert-ok-button').addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
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
}

// Modern confirmation modal functionality
function showModernConfirm(message, title = 'Confirm Action', confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Remove existing modal if any
        const existingModal = document.getElementById('modern-confirm-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.id = 'modern-confirm-modal';

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <i class="fas fa-question-circle text-orange-600 text-2xl"></i>
                        </div>
                    </div>
                    <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">${title}</h3>
                    <p class="text-gray-600 text-center mb-6">${message}</p>
                    <div class="flex space-x-3">
                        <button id="confirm-cancel" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                            ${cancelText}
                        </button>
                        <button id="confirm-ok" class="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors duration-200">
                            ${confirmText}
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
        document.getElementById('confirm-cancel').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                resolve(false);
            }, 300);
        });

        document.getElementById('confirm-ok').addEventListener('click', () => {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.remove();
                resolve(true);
            }, 300);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    resolve(false);
                }, 300);
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                modal.classList.add('opacity-0');
                setTimeout(() => {
                    modal.remove();
                    resolve(false);
                }, 300);
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    });
}

// Modern logout modal functionality
function showLogoutModal() {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.id = 'logout-modal';

    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-95 animate-in">
            <div class="p-6">
                <div class="flex items-center justify-center mb-4">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg>
                    </div>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 text-center mb-2">Confirm Logout</h3>
                <p class="text-gray-600 text-center mb-6">Are you sure you want to logout? Your cart will be cleared and you'll need to log in again to continue shopping.</p>
                <div class="flex space-x-3">
                    <button id="cancel-logout" class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                        Cancel
                    </button>
                    <button id="confirm-logout" class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200">
                        Logout
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
    document.getElementById('cancel-logout').addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 300);
    });

    document.getElementById('confirm-logout').addEventListener('click', () => {
        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.remove();
            auth.logout();
        }, 300);
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
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    updateCartUI();

    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add fade-in animation to elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
});