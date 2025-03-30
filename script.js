// Menu data
const menu = {
    noodles: [
        { name: 'Pork Noodles', price: 40 },
        { name: 'Beef Noodles', price: 50 },
        { name: 'Chicken Noodles', price: 45 },
        { name: 'Duck Noodles', price: 60 }
    ],
    soupTypes: ['Clear Soup', 'Stewed', 'Tom Yum', 'Black Soup'],
    noodleTypes: ['Thin Noodles', 'Thick Noodles', 'Rice Vermicelli', 'Noodles', 'Glass Noodles'],
    extras: [
        { name: 'Add Noodles', price: 10 },
        { name: 'Add Pork/Beef', price: 15 },
        { name: 'Add Soft-boiled Egg', price: 10 }
    ],
    drinks: [
        { name: 'Plain Water', price: 10 },
        { name: 'Soft Drinks', price: 15 },
        { name: 'Chrysanthemum tea', price: 20 },
        { name: 'Longan juice', price: 20 }
    ]
};

// Current order
let currentOrder = {
    items: [],
    total: 0,
    tableNumber: null
};

// Customization state
let customizationState = {
    baseItem: null,
    selectedItems: [],
    total: 0
};

// Socket.io connection
const socket = io('http://localhost:8000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Add connection status indicator
const connectionStatus = document.createElement('div');
connectionStatus.style.position = 'fixed';
connectionStatus.style.bottom = '10px';
connectionStatus.style.right = '10px';
connectionStatus.style.padding = '5px 10px';
connectionStatus.style.borderRadius = '5px';
connectionStatus.style.fontSize = '12px';
document.body.appendChild(connectionStatus);

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active-page');
    });
    document.getElementById(pageId).classList.add('active-page');
}

// Initialize the menu
function initializeMenu() {
    const menuContainer = document.getElementById('noodleMenu');
    
    // Noodles section
    menuContainer.innerHTML += '<h3 class="mt-3">Noodle Menu</h3>';
    menu.noodles.forEach(noodle => {
        menuContainer.innerHTML += `
            <div class="menu-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${noodle.name}</h5>
                        <span class="price">${noodle.price} baht</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="openCustomizationModal('${noodle.name}', ${noodle.price})">
                        <i class="fas fa-utensils"></i> Order
                    </button>
                </div>
            </div>
        `;
    });

    // Add divider
    menuContainer.innerHTML += '<hr class="my-4">';

    // Drinks section
    menuContainer.innerHTML += '<h3 class="mt-3"><i class="fas fa-glass-martini-alt"></i> Drinks</h3>';
    menu.drinks.forEach(drink => {
        menuContainer.innerHTML += `
            <div class="menu-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${drink.name}</h5>
                        <span class="price">${drink.price} baht</span>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="addDrinkToOrder('${drink.name}', ${drink.price})">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    });

    // Add table selection event listener
    document.getElementById('tableSelect').addEventListener('change', function(e) {
        currentOrder.tableNumber = e.target.value;
        updateOrderDisplay();
    });
}

// Open customization modal
function openCustomizationModal(name, price) {
    if (!currentOrder.tableNumber) {
        alert('Please select a table number first!');
        return;
    }

    customizationState = {
        baseItem: { name, price },
        selectedItems: [{ name, price }],
        total: price
    };
    
    // Initialize modal options
    initializeModalOptions();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('menuItemModal'));
    modal.show();
}

// Initialize modal options
function initializeModalOptions() {
    // Soup Types
    const soupTypeOptions = document.getElementById('soupTypeOptions');
    soupTypeOptions.innerHTML = menu.soupTypes.map(soup => `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="soupType" id="soup${soup.replace(/\s+/g, '')}" value="${soup}">
            <label class="form-check-label" for="soup${soup.replace(/\s+/g, '')}">
                ${soup}
            </label>
        </div>
    `).join('');

    // Noodle Types
    const noodleTypeOptions = document.getElementById('noodleTypeOptions');
    noodleTypeOptions.innerHTML = menu.noodleTypes.map(noodle => `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="noodleType" id="noodle${noodle.replace(/\s+/g, '')}" value="${noodle}">
            <label class="form-check-label" for="noodle${noodle.replace(/\s+/g, '')}">
                ${noodle}
            </label>
        </div>
    `).join('');

    // Extra Options
    const extraOptions = document.getElementById('extraOptions');
    extraOptions.innerHTML = menu.extras.map(extra => `
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="extra${extra.name.replace(/\s+/g, '')}" value="${extra.name}" data-price="${extra.price}">
            <label class="form-check-label" for="extra${extra.name.replace(/\s+/g, '')}">
                ${extra.name} (${extra.price} baht)
            </label>
        </div>
    `).join('');

    // Add event listeners
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', updateSelectedItems);
    });

    // Update initial display
    updateSelectedItems();
}

// Update selected items
function updateSelectedItems() {
    const selectedItems = [customizationState.baseItem];
    
    // Add selected soup type
    const selectedSoup = document.querySelector('input[name="soupType"]:checked');
    if (selectedSoup) {
        selectedItems.push({ name: selectedSoup.value, price: 0 });
    }
    
    // Add selected noodle type
    const selectedNoodle = document.querySelector('input[name="noodleType"]:checked');
    if (selectedNoodle) {
        selectedItems.push({ name: selectedNoodle.value, price: 0 });
    }
    
    // Add selected extras
    document.querySelectorAll('#extraOptions input[type="checkbox"]:checked').forEach(checkbox => {
        selectedItems.push({
            name: checkbox.value,
            price: parseInt(checkbox.dataset.price)
        });
    });
    
    // Update state and display
    customizationState.selectedItems = selectedItems;
    customizationState.total = selectedItems.reduce((sum, item) => sum + item.price, 0);
    
    // Update display
    const selectedItemsList = document.getElementById('selectedItemsList');
    selectedItemsList.innerHTML = selectedItems.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>${item.name}</span>
            ${item.price > 0 ? `<span class="price">${item.price} baht</span>` : ''}
        </div>
    `).join('');
    
    document.getElementById('modalTotalPrice').textContent = customizationState.total;
}

// Add customized order to current order
function addCustomizedOrder() {
    if (!currentOrder.tableNumber) {
        alert('Please select a table number first!');
        return;
    }
    
    customizationState.selectedItems.forEach(item => {
        currentOrder.items.push(item);
        currentOrder.total += item.price;
    });
    
    updateOrderDisplay();
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('menuItemModal'));
    modal.hide();
}

// Update order display
function updateOrderDisplay() {
    const orderContainer = document.getElementById('currentOrder');
    orderContainer.innerHTML = '';
    
    // Display order ID and table number
    const orderId = Date.now();
    orderContainer.innerHTML += `
        <div class="order-header mb-3">
            <div class="d-flex justify-content-between align-items-center">
                <strong class="text-primary">Order #${orderId}</strong>
                <span class="badge bg-warning text-dark">Table ${currentOrder.tableNumber || 'Not Assigned'}</span>
            </div>
        </div>
    `;

    // Group items by category
    const groupedItems = {
        mainDish: [],
        soupType: [],
        noodleType: [],
        extras: [],
        drinks: []
    };

    currentOrder.items.forEach((item, index) => {
        // Categorize items
        if (menu.noodles.some(n => n.name === item.name)) {
            groupedItems.mainDish.push({...item, index});
        } else if (menu.soupTypes.includes(item.name)) {
            groupedItems.soupType.push({...item, index});
        } else if (menu.noodleTypes.includes(item.name)) {
            groupedItems.noodleType.push({...item, index});
        } else if (menu.extras.some(e => e.name === item.name)) {
            groupedItems.extras.push({...item, index});
        } else if (menu.drinks.some(d => d.name === item.name)) {
            groupedItems.drinks.push({...item, index});
        }
    });

    // Display main dish with its customizations
    if (groupedItems.mainDish.length > 0) {
        orderContainer.innerHTML += `<div class="order-section mb-3">`;
        groupedItems.mainDish.forEach(item => {
            orderContainer.innerHTML += `
                <div class="main-dish-item">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span class="fw-bold">${item.name}</span>
                            <span class="price ms-2">${item.price} baht</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="removeFromOrder(${item.index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    
                    <!-- Show related soup type -->
                    ${groupedItems.soupType.map(soup => `
                        <div class="ms-3 mb-1 customization-item">
                            <small>• ${soup.name}</small>
                            <button class="btn btn-danger btn-sm btn-xs ms-2" onclick="removeFromOrder(${soup.index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                    
                    <!-- Show related noodle type -->
                    ${groupedItems.noodleType.map(noodle => `
                        <div class="ms-3 mb-1 customization-item">
                            <small>• ${noodle.name}</small>
                            <button class="btn btn-danger btn-sm btn-xs ms-2" onclick="removeFromOrder(${noodle.index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        orderContainer.innerHTML += `</div>`;
    }

    // Display extras
    if (groupedItems.extras.length > 0) {
        orderContainer.innerHTML += `
            <div class="order-section mb-3">
                <div class="section-title mb-2">Extras:</div>
                ${groupedItems.extras.map(item => `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <span>${item.name}</span>
                            <span class="price ms-2">${item.price} baht</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="removeFromOrder(${item.index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Display drinks
    if (groupedItems.drinks.length > 0) {
        orderContainer.innerHTML += `
            <div class="order-section mb-3">
                <div class="section-title mb-2">Drinks:</div>
                ${groupedItems.drinks.map(item => `
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <span>${item.name}</span>
                            <span class="price ms-2">${item.price} baht</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="removeFromOrder(${item.index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Display total
    orderContainer.innerHTML += `
        <div class="mt-3 pt-2 border-top">
            <strong>Total: <span class="price">${currentOrder.total} baht</span></strong>
        </div>
    `;
}

// Remove item from order
function removeFromOrder(index) {
    currentOrder.total -= currentOrder.items[index].price;
    currentOrder.items.splice(index, 1);
    updateOrderDisplay();
}

// Submit order
function submitOrder() {
    if (!currentOrder.tableNumber) {
        alert('Please select a table number first!');
        return;
    }

    if (currentOrder.items.length === 0) {
        alert('Please add items to your order first!');
        return;
    }

    const order = {
        id: Date.now().toString(),
        items: currentOrder.items,
        total: currentOrder.total,
        tableNumber: currentOrder.tableNumber,
        status: 'pending',
        orderTime: new Date().toLocaleTimeString()
    };

    socket.emit('newOrder', order);
    
    // Clear current order
    currentOrder = {
        items: [],
        total: 0,
        tableNumber: null
    };
    
    document.getElementById('tableSelect').value = '';
    updateOrderDisplay();
    
    alert('Order submitted successfully!');
}

// Socket.io event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    connectionStatus.textContent = 'Connected to server';
    connectionStatus.style.backgroundColor = '#28a745';
    connectionStatus.style.color = 'white';
    // Immediately fetch orders when connected
    updateOrdersDisplay();
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    connectionStatus.textContent = 'Disconnected from server';
    connectionStatus.style.backgroundColor = '#dc3545';
    connectionStatus.style.color = 'white';
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    connectionStatus.textContent = 'Connection error';
    connectionStatus.style.backgroundColor = '#ffc107';
    connectionStatus.style.color = 'black';
});

socket.on('orderStatusUpdate', (order) => {
    console.log('Order status updated:', order);
    updateOrdersDisplay();
});

socket.on('newOrder', (order) => {
    console.log('New order received:', order);
    updateOrdersDisplay();
});

// Update orders display for chef and cashier
function updateOrdersDisplay() {
    console.log('Updating orders display');
    
    // Update pending orders for chef
    const pendingOrders = document.getElementById('pendingOrders');
    if (pendingOrders) {
        socket.emit('getPendingOrders', (orders) => {
            console.log('Received pending orders:', orders);
            if (!orders) return; // Guard against undefined orders
            
            pendingOrders.innerHTML = orders.map(order => `
                <div class="chef-order-card">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <strong class="text-primary">Order #${order.id}</strong>
                            <small class="text-muted ms-2">Ordered at: ${order.orderTime}</small>
                        </div>
                        <span class="badge bg-warning text-dark">Table ${order.tableNumber}</span>
                    </div>
                    <div class="chef-order-items">
                        ${order.items.map(item => `
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <span class="fw-bold">${item.name}</span>
                                    ${item.price > 0 ? `<span class="price ms-2">${item.price} baht</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-3 pt-2 border-top">
                        <strong>Total: <span class="price">${order.total} baht</span></strong>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-success w-100" onclick="markOrderComplete('${order.id}')">
                            <i class="fas fa-check"></i> Mark Complete
                        </button>
                    </div>
                </div>
            `).join('');
        });
    }

    // Update completed orders for cashier
    const completedOrders = document.getElementById('completedOrders');
    if (completedOrders) {
        socket.emit('getCompletedOrders', (orders) => {
            console.log('Received completed orders:', orders);
            if (!orders) return; // Guard against undefined orders
            
            completedOrders.innerHTML = orders.map(order => `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <strong class="text-primary">Order #${order.id}</strong>
                                <small class="text-muted ms-2">Ordered at: ${order.orderTime}</small>
                            </div>
                            <span class="badge bg-warning text-dark">Table ${order.tableNumber}</span>
                        </div>
                        <div class="order-items">
                            ${order.items.map(item => `
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <span class="fw-bold">${item.name}</span>
                                        ${item.price > 0 ? `<span class="price ms-2">${item.price} baht</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="mt-3 pt-2 border-top">
                            <strong>Total: <span class="price">${order.total} baht</span></strong>
                        </div>
                        <button class="btn btn-danger w-100 mt-3" onclick="deleteOrder('${order.id}')">
                            <i class="fas fa-trash"></i> Delete Order
                        </button>
                    </div>
                </div>
            `).join('');
        });
    }
}

// Auto-refresh orders every 30 seconds
setInterval(updateOrdersDisplay, 30000);

// Mark order as complete
function markOrderComplete(orderId) {
    socket.emit('markOrderComplete', orderId);
}

// Delete order
function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        socket.emit('deleteOrder', orderId);
    }
}

// Add drink directly to order
function addDrinkToOrder(name, price) {
    if (!currentOrder.tableNumber) {
        alert('Please select a table number first!');
        return;
    }
    
    currentOrder.items.push({
        name,
        price
    });
    currentOrder.total += price;
    
    updateOrderDisplay();
}

// Add extra to order
function addExtraToOrder(name, price) {
    if (!currentOrder.tableNumber) {
        alert('Please select a table first');
        return;
    }
    
    const extra = {
        name: name,
        price: price,
        timeAdded: new Date().toLocaleTimeString()
    };
    
    currentOrder.items.push(extra);
    currentOrder.total += price;
    updateOrderDisplay();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    updateOrdersDisplay();
});