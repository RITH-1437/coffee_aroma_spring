// Order page JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    updateOrderPage();
    setupFormValidation();
    setupCardFormatting();
    populateUserInfo();
});

// Update order page display
function updateOrderPage() {
    displayCartItems();
    updateOrderSummary();
    updateCheckoutButton();
}

// Update cart items display
function displayCartItems() {
    const cartContainer = document.getElementById('cart-items');
    const cartData = cart.get();
    
    if (cartData.length === 0) {
        cartContainer.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl text-gray-500 mb-4">Your cart is empty</h3>
                <p class="text-gray-400 mb-6">Add some delicious items to get started!</p>
                <a href="products.html" class="btn-coffee">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    cartContainer.innerHTML = cartData.map(item => `
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg">
                <div>
                    <h4 class="font-semibold text-gray-900">${item.name}</h4>
                    <p class="text-sm text-gray-500">${item.category}</p>
                    <p class="text-coffee-brown font-medium">$${item.price.toFixed(2)} each</p>
                </div>
            </div>
            
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2 bg-gray-100 rounded-lg">
                    <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})" 
                            class="px-3 py-2 hover:bg-gray-200 rounded-l-lg ${item.quantity <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <span class="px-4 py-2 font-medium">${item.quantity}</span>
                    <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})" 
                            class="px-3 py-2 hover:bg-gray-200 rounded-r-lg">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
                
                <div class="text-right">
                    <p class="font-semibold text-gray-900">$${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                
                <button onclick="cart.remove(${item.id})" 
                        class="text-red-500 hover:text-red-700 p-2">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Update order summary
function updateOrderSummary() {
    const cartData = cart.get();
    const subtotal = cart.getTotal();
    const taxRate = 0.085; // 8.5%
    const tax = subtotal * taxRate;
    const deliveryFee = subtotal > 0 ? 2.99 : 0;

    // Calculate discount if promo code is applied
    let discount = 0;
    let discountDisplay = '';
    if (appliedPromoCode) {
        if (typeof appliedPromoCode.discount === 'number' && appliedPromoCode.discount < 1) {
            // Percentage discount
            discount = subtotal * appliedPromoCode.discount;
            discountDisplay = `-${formatCurrency(discount)} (${(appliedPromoCode.discount * 100).toFixed(0)}%)`;
        } else {
            // Fixed amount discount
            discount = Math.min(appliedPromoCode.discount, subtotal); // Don't exceed subtotal
            discountDisplay = `-${formatCurrency(discount)}`;
        }
    }

    const total = subtotal + tax + deliveryFee - discount;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('delivery-fee').textContent = formatCurrency(deliveryFee);

    // Update total display
    document.getElementById('total').textContent = formatCurrency(total);

    // Add discount row if promo is applied
    const orderSummaryDiv = document.querySelector('.space-y-3');
    const existingDiscountRow = document.getElementById('discount-row');

    if (appliedPromoCode && discount > 0) {
        if (!existingDiscountRow) {
            const discountRow = document.createElement('div');
            discountRow.id = 'discount-row';
            discountRow.className = 'flex justify-between text-green-600';
            discountRow.innerHTML = `
                <span>Discount (${appliedPromoCode.description}):</span>
                <span id="discount-amount">${discountDisplay}</span>
            `;
            // Insert before the border-t div within the orderSummaryDiv
            const borderDiv = orderSummaryDiv.querySelector('.border-t');
            if (borderDiv) {
                orderSummaryDiv.insertBefore(discountRow, borderDiv);
            } else {
                // Fallback: append to the end if border-t not found
                orderSummaryDiv.appendChild(discountRow);
            }
        } else {
            document.getElementById('discount-amount').textContent = discountDisplay;
        }
    } else if (existingDiscountRow) {
        existingDiscountRow.remove();
    }
}

// Update checkout button state
function updateCheckoutButton() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const cartData = cart.get();
    
    if (cartData.length === 0) {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Cart is Empty';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="fas fa-arrow-right mr-2"></i>Proceed to Checkout';
    }
}

// Add quick item to cart
function addQuickItem(productId) {
    const products = getSampleProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.add(product);
        updateOrderPage();
    }
}

// Global variable to store applied promo code
let appliedPromoCode = null;

// Apply promo code
function applyPromoCode() {
    const promoInput = document.getElementById('promo-code');
    const promoMessage = document.getElementById('promo-message');
    const promoCode = promoInput.value.trim().toUpperCase();

    const validPromoCodes = {
        'WELCOME10': { discount: 0.10, description: '10% off your order', code: 'WELCOME10' },
        'COFFEE5': { discount: 5, description: '$5 off your order', code: 'COFFEE5' },
        'STUDENT': { discount: 0.15, description: '15% student discount', code: 'STUDENT' },
        'BEK SONGSA' : { discount: 0.20, description: '20% off for Bek Songsa fans', code: 'BEK SONGSA' }
    };

    if (validPromoCodes[promoCode]) {
        const promo = validPromoCodes[promoCode];
        promoMessage.innerHTML = `<span class="text-green-600"><i class="fas fa-check mr-1"></i>${promo.description} applied!</span>`;
        appliedPromoCode = promo; // Store the applied promo
        updateOrderSummary(); // Recalculate totals with discount
        showToast('Promo code applied successfully!', 'success');
    } else if (promoCode) {
        promoMessage.innerHTML = `<span class="text-red-600"><i class="fas fa-times mr-1"></i>Invalid promo code</span>`;
        appliedPromoCode = null; // Clear any applied promo
        updateOrderSummary(); // Recalculate without discount
    } else {
        promoMessage.innerHTML = '';
        appliedPromoCode = null; // Clear any applied promo
        updateOrderSummary(); // Recalculate without discount
    }
}

// Proceed to checkout
function proceedToCheckout() {
    if (!auth.isLoggedIn()) {
        showToast('Please login to continue with checkout', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=order.html';
        }, 2000);
        return;
    }
    
    updateStepIndicator(2);
    document.getElementById('checkout-form').classList.remove('hidden');
    document.querySelector('.lg\\:col-span-2').style.display = 'none';
    document.querySelector('.lg\\:col-span-1').style.display = 'none';
    
    // Smooth scroll to checkout form
    document.getElementById('checkout-form').scrollIntoView({ behavior: 'smooth' });
}

// Go back to cart
function goBackToCart() {
    updateStepIndicator(1);
    document.getElementById('checkout-form').classList.add('hidden');
    document.querySelector('.lg\\:col-span-2').style.display = 'block';
    document.querySelector('.lg\\:col-span-1').style.display = 'block';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle delivery fields
function toggleDeliveryFields() {
    const deliveryFields = document.getElementById('delivery-fields');
    const isDelivery = document.querySelector('input[name="order-type"]:checked').value === 'delivery';
    const deliveryFeeElement = document.getElementById('delivery-fee');
    
    if (isDelivery) {
        deliveryFields.style.display = 'block';
        deliveryFeeElement.textContent = '$2.99';
    } else {
        deliveryFields.style.display = 'none';
        deliveryFeeElement.textContent = '$0.00';
    }
    
    updateOrderSummary();
}

// Update step indicator
function updateStepIndicator(step) {
    const indicators = document.querySelectorAll('.step-indicator');
    const circles = document.querySelectorAll('.step-circle');
    const lines = document.querySelectorAll('.step-line');
    
    indicators.forEach((indicator, index) => {
        if (index + 1 <= step) {
            indicator.classList.add('active');
            circles[index].classList.remove('bg-gray-300', 'text-gray-600');
            circles[index].classList.add('bg-coffee-brown', 'text-white');
            indicator.querySelector('span').classList.remove('text-gray-600');
            indicator.querySelector('span').classList.add('text-coffee-brown');
        } else {
            indicator.classList.remove('active');
            circles[index].classList.remove('bg-coffee-brown', 'text-white');
            circles[index].classList.add('bg-gray-300', 'text-gray-600');
            indicator.querySelector('span').classList.remove('text-coffee-brown');
            indicator.querySelector('span').classList.add('text-gray-600');
        }
    });
    
    lines.forEach((line, index) => {
        if (index + 1 < step) {
            line.classList.remove('bg-gray-300');
            line.classList.add('bg-coffee-brown');
        } else {
            line.classList.remove('bg-coffee-brown');
            line.classList.add('bg-gray-300');
        }
    });
}

// Setup form validation
function setupFormValidation() {
    const form = document.getElementById('order-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            customerName: document.getElementById('customer-name').value,
            customerEmail: document.getElementById('customer-email').value,
            customerPhone: document.getElementById('customer-phone').value,
            orderType: document.querySelector('input[name="order-type"]:checked').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            zipcode: document.getElementById('zipcode').value,
            cardNumber: document.getElementById('card-number').value,
            cardExpiry: document.getElementById('card-expiry').value,
            cardCvc: document.getElementById('card-cvc').value,
            cardName: document.getElementById('card-name').value,
            specialInstructions: document.getElementById('special-instructions').value
        };
        
        // Validate form
        const validationRules = {
            customerName: { required: true },
            customerEmail: { required: true, email: true },
            customerPhone: { required: true },
            cardNumber: { required: true, minLength: 15 },
            cardExpiry: { required: true },
            cardCvc: { required: true, minLength: 3 },
            cardName: { required: true }
        };
        
        // Add address validation for delivery
        if (formData.orderType === 'delivery') {
            validationRules.address = { required: true };
            validationRules.city = { required: true };
            validationRules.zipcode = { required: true };
        }
        
        const errors = validateForm(formData, validationRules);
        
        if (errors) {
            // Display first error
            const firstError = Object.keys(errors)[0];
            showToast(errors[firstError], 'error');
            document.getElementById(firstError.replace(/([A-Z])/g, '-$1').toLowerCase()).focus();
            return;
        }
        
        // Process order
        processOrder(formData);
    });
}

// Setup card number formatting
function setupCardFormatting() {
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    
    cardNumberInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        e.target.value = value;
    });
    
    cardExpiryInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}

// Populate user info if logged in
function populateUserInfo() {
    if (auth.isLoggedIn()) {
        const user = auth.getUser();
        document.getElementById('customer-name').value = user.name || '';
        document.getElementById('customer-email').value = user.email || '';
        document.getElementById('customer-phone').value = user.phone || '';
    }
}

// Process order
async function processOrder(formData) {
    showLoading();

    try {
        const cartData = cart.get();
        const subtotal = cart.getTotal();
        const taxAmount = subtotal * 0.085;
        const deliveryFee = formData.orderType === 'delivery' ? 2.99 : 0;

        // Calculate discount if promo code is applied
        let discount = 0;
        if (appliedPromoCode) {
            if (typeof appliedPromoCode.discount === 'number' && appliedPromoCode.discount < 1) {
                // Percentage discount
                discount = subtotal * appliedPromoCode.discount;
            } else {
                // Fixed amount discount
                discount = Math.min(appliedPromoCode.discount, subtotal); // Don't exceed subtotal
            }
        }

        const totalAmount = subtotal + taxAmount + deliveryFee - discount;

        const orderData = {
            ...formData,
            items: cartData,
            subtotal: subtotal,
            tax: taxAmount,
            deliveryFee: deliveryFee,
            discount: discount,
            promoCode: appliedPromoCode ? appliedPromoCode.code : null,
            total: totalAmount,
            orderDate: new Date().toISOString()
        };
        
        console.log('📝 Processing order:', orderData);
        
        // Send order to backend
        const response = await api.createOrder(orderData);
        
        console.log('✅ Order created successfully:', response);
        
        hideLoading();
        
        // Clear cart after successful order
        cart.clear();
        
        // Show confirmation with actual order data from backend
        showOrderConfirmation({
            ...orderData,
            orderNumber: response.orderNumber || ('ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase()),
            id: response.id
        });
        
    } catch (error) {
        hideLoading();
        console.error('❌ Order processing error:', error);
        
        // Show error message to user
        showToast('Failed to create order. Please try again.', 'error');
        
        // Optional: Still show confirmation for testing purposes
        if (error.message.includes('401') || error.message.includes('403')) {
            showToast('Please login to place an order.', 'error');
        } else {
            // For demo purposes, still create a local order
            console.log('📝 Creating fallback local order for demo...');
            const cartData = cart.get();
            const subtotal = cart.getTotal();
            const taxAmount = subtotal * 0.085;
            const deliveryFee = formData.orderType === 'delivery' ? 2.99 : 0;

            // Calculate discount if promo code is applied
            let discount = 0;
            if (appliedPromoCode) {
                if (typeof appliedPromoCode.discount === 'number' && appliedPromoCode.discount < 1) {
                    // Percentage discount
                    discount = subtotal * appliedPromoCode.discount;
                } else {
                    // Fixed amount discount
                    discount = Math.min(appliedPromoCode.discount, subtotal); // Don't exceed subtotal
                }
            }

            const totalAmount = subtotal + taxAmount + deliveryFee - discount;

            const localOrderData = {
                ...formData,
                items: cartData,
                subtotal: subtotal,
                tax: taxAmount,
                deliveryFee: deliveryFee,
                discount: discount,
                promoCode: appliedPromoCode ? appliedPromoCode.code : null,
                total: totalAmount,
                orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                orderDate: new Date().toISOString()
            };
            
            cart.clear();
            showOrderConfirmation(localOrderData);
            showToast('Order created locally (backend connection failed)', 'warning');
        }
    }
}

// Show order confirmation
function showOrderConfirmation(orderData) {
    updateStepIndicator(3);
    
    // Hide checkout form
    document.getElementById('checkout-form').classList.add('hidden');
    
    // Generate order number
    const orderNumber = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Calculate estimated time
    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const baseTime = 15;
    const additionalTime = itemCount * 2;
    const estimatedTime = baseTime + additionalTime;
    
    // Update confirmation details
    document.getElementById('order-number').textContent = '#' + orderNumber;
    document.getElementById('estimated-time').textContent = `${estimatedTime}-${estimatedTime + 5} minutes`;
    document.getElementById('confirmation-total').textContent = formatCurrency(orderData.total);
    
    // Show confirmation
    document.getElementById('order-confirmation').classList.remove('hidden');
    
    // Clear cart
    cart.clear();
    
    // Scroll to confirmation
    document.getElementById('order-confirmation').scrollIntoView({ behavior: 'smooth' });
    
    // Show success toast
    showToast('Order placed successfully!', 'success');
    
    // Store order in local storage for history
    const orders = storage.get('orders') || [];
    orders.push({
        orderNumber,
        ...orderData,
        status: 'preparing'
    });
    storage.set('orders', orders);
}

// Override cart update to refresh page
const originalUpdateCartUI = updateCartUI;
updateCartUI = function() {
    originalUpdateCartUI();
    if (document.getElementById('cart-items')) {
        updateOrderPage();
    }
};