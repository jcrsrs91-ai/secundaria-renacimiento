let cart = [];
let pausedSales = [];
let products = [];
let kits = [];
let currentKitItems = [];
let labelsQueue = [];

// ==========================================
// UI & Modals Logic
// ==========================================
const ui = {
    openModal: (id) => {
        const modal = document.getElementById(id);
        const overlay = document.getElementById('modalOverlay');
        // Ocultar todos primero usando children para evitar errores de selectores en navegadores viejos
        Array.from(overlay.children).forEach(m => m.classList.add('hidden'));
        
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        modal.classList.remove('hidden');
        // Trigger reflow for animation
        void modal.offsetWidth; 
        modal.classList.add('modal-content-active');
        
        if (id === 'addProductModal') {
            app.editingProductId = null;
            const titleEl = document.getElementById('addProductModalTitle');
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus-circle mr-2"></i>Nuevo Producto';
            
            const btnDelete = document.getElementById('btnDeleteProduct');
            if (btnDelete) btnDelete.classList.add('hidden');
            
            document.getElementById('productForm').reset();
            document.getElementById('p_margin').value = 52; // Default to 52% margin
            
            // Reset package calc
            document.getElementById('p_is_package').checked = false;
            document.getElementById('package_calc_area').classList.add('hidden');
            document.getElementById('p_package_cost').value = '';
            document.getElementById('p_package_units').value = '';
            document.getElementById('p_package_total_price').value = '';
            document.getElementById('p_wholesale_price').value = '0';
            document.getElementById('p_cost').readOnly = false;
            document.getElementById('p_cost').classList.remove('bg-gray-100');
        }
    },
    
    closeModal: () => {
        const overlay = document.getElementById('modalOverlay');
        const modals = Array.from(overlay.children);
        modals.forEach(m => {
            m.classList.remove('modal-content-active');
            setTimeout(() => m.classList.add('hidden'), 200);
        });
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }, 200);
        scanner.stop();
    },

    handleImageUpload: (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const base64 = canvas.toDataURL('image/jpeg', 0.8); // Compress to JPEG 80%
                    document.getElementById('imageBase64').value = base64;
                    document.getElementById('imagePreview').innerHTML = `<img src="${base64}" class="w-full h-full object-cover rounded-2xl">`;
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file); 
        }
    },

    toggleMobileCart: () => {
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar.classList.contains('translate-x-full')) {
            sidebar.classList.remove('translate-x-full');
        } else {
            sidebar.classList.add('translate-x-full');
        }
    }
};

// ==========================================
// Core App Logic
// ==========================================
const app = {
    editingProductId: null,
    
    setupSSE: () => {
        const eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'products_updated') {
                    app.loadProducts();
                } else if (data.type === 'sales_updated') {
                    // Update sales if history or cut modal is open
                    if (!document.getElementById('historyModal').classList.contains('hidden')) {
                        app.loadReport();
                    }
                    if (!document.getElementById('registerCutModal').classList.contains('hidden')) {
                        app.loadRegisterCut();
                    }
                }
            } catch (e) {
                console.error("SSE Error:", e);
            }
        };
        eventSource.onerror = () => {
            console.log("SSE disconnected, reconnecting...");
        };
    },

    init: async () => {
        app.setupSSE();
        await app.loadProducts();
        
        // Search listener
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', (e) => {
            app.loadProducts(e.target.value);
        });

        // Escáner físico (pistola láser) o presionar Enter manualmente
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                const searchVal = e.target.value.trim();
                // Check if search matches a barcode exactly
                const match = products.find(p => p.barcode === searchVal || p.id.toString() === searchVal);
                if (match) {
                    app.addToCart(match.id);
                    e.target.value = ''; // clear input
                    app.loadProducts(''); // reload all
                }
            }
        });

        // Mobile cart toggle
        document.getElementById('mobile-cart-btn').addEventListener('click', ui.toggleMobileCart);
        document.getElementById('closeCartBtn').addEventListener('click', ui.toggleMobileCart);
    },

    loadProducts: async (search = '') => {
        try {
            products = await api.getProducts(search);
            app.renderProducts();
            app.checkLowStock();
        } catch (error) {
            console.error('Error loading products', error);
        }
    },
    
    checkLowStock: () => {
        const lowStockItems = products.filter(p => p.stock <= 5);
        const mobileBadge = document.getElementById('mobile-alert-badge');
        const desktopBadge = document.getElementById('desktop-alert-badge');
        const listContainer = document.getElementById('lowStockList');
        const emptyState = document.getElementById('lowStockEmpty');
        
        if (lowStockItems.length > 0) {
            mobileBadge.classList.remove('hidden');
            mobileBadge.innerText = lowStockItems.length;
            desktopBadge.classList.remove('hidden');
            desktopBadge.innerText = lowStockItems.length;
            
            emptyState.classList.add('hidden');
            listContainer.innerHTML = lowStockItems.map(p => `
                <div class="bg-white p-3 rounded-xl shadow-sm border border-red-100 flex justify-between items-center cursor-pointer hover:bg-red-50 transition-colors" onclick="ui.closeModal(); app.editProduct(${p.id})">
                    <div class="flex items-center gap-3">
                        ${p.image_base64 
                            ? `<img src="${p.image_base64}" class="w-10 h-10 object-cover rounded-lg border border-gray-100">`
                            : `<div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><i class="fa-solid fa-box"></i></div>`
                        }
                        <div>
                            <p class="font-bold text-gray-800 text-sm">${p.name}</p>
                            <p class="text-xs text-gray-500">${p.barcode ? '<i class="fa-solid fa-barcode mr-1"></i>'+p.barcode : 'Sin código'}</p>
                        </div>
                    </div>
                    <div class="text-center bg-red-100 text-red-700 px-3 py-1 rounded-lg">
                        <p class="text-xs font-bold uppercase">Quedan</p>
                        <p class="text-lg font-black leading-none">${p.stock}</p>
                    </div>
                </div>
            `).join('');
        } else {
            mobileBadge.classList.add('hidden');
            desktopBadge.classList.add('hidden');
            listContainer.innerHTML = '';
            emptyState.classList.remove('hidden');
        }
    },

    renderProducts: () => {
        const grid = document.getElementById('productsGrid');
        const favoritesGrid = document.getElementById('favoritesGrid');
        const favoritesContainer = document.getElementById('favoritesContainer');
        
        grid.innerHTML = '';
        favoritesGrid.innerHTML = '';
        
        const favorites = products.filter(p => p.is_favorite);
        
        if (favorites.length > 0) {
            favoritesContainer.classList.remove('hidden');
            favoritesContainer.classList.add('flex');
            
            favorites.forEach(p => {
                const imgHtml = p.image_base64 
                    ? `<img src="${p.image_base64}" alt="${p.name}">`
                    : `<i class="fa-solid fa-star text-3xl text-yellow-200"></i>`;
                    
                favoritesGrid.innerHTML += `
                    <div class="bg-brand-light/20 rounded-lg p-1.5 shadow-sm border border-brand-light/50 cursor-pointer flex flex-col items-center justify-between h-full relative hover:bg-brand-light/30 transition-colors" onclick="app.addToCart(${p.id})">
                        <button onclick="event.stopPropagation(); app.editProduct(${p.id})" class="absolute top-0 right-0 w-4 h-4 bg-white/90 rounded-bl-lg flex items-center justify-center text-gray-400 hover:text-brand shadow-sm z-10"><i class="fa-solid fa-pencil text-[8px]"></i></button>
                        <div class="w-10 h-10 mb-1 rounded-md overflow-hidden bg-white flex items-center justify-center flex-shrink-0">
                            ${p.image_base64 ? `<img src="${p.image_base64}" alt="${p.name}" class="w-full h-full object-cover">` : `<i class="fa-solid fa-star text-lg text-yellow-300"></i>`}
                        </div>
                        <div class="w-full text-center flex flex-col justify-end">
                            <h3 class="font-bold text-gray-700 leading-none mb-0.5 text-[9px] line-clamp-2">${p.name}</h3>
                            <span class="text-brand-dark font-black text-[10px] block leading-none">$${p.price.toFixed(2)}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            favoritesContainer.classList.add('hidden');
            favoritesContainer.classList.remove('flex');
        }
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-400 mt-10"><i class="fa-solid fa-box-open text-4xl mb-2"></i><p>No se encontraron productos</p></div>';
            return;
        }

        products.forEach(p => {
            const imgHtml = p.image_base64 
                ? `<img src="${p.image_base64}" alt="${p.name}">`
                : `<i class="fa-solid fa-box text-3xl text-gray-300"></i>`;
                
            grid.innerHTML += `
                <div class="product-card bg-white rounded-xl p-2 shadow-sm border border-gray-100 cursor-pointer flex flex-col h-full relative" onclick="app.addToCart(${p.id})">
                    <button onclick="event.stopPropagation(); app.editProduct(${p.id})" class="absolute top-1 right-1 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center text-gray-500 hover:text-brand shadow-sm z-10"><i class="fa-solid fa-pencil text-[10px]"></i></button>
                    <div class="product-image-container mb-2 shadow-sm rounded-lg overflow-hidden">
                        ${imgHtml}
                    </div>
                    <div class="flex-1 flex flex-col justify-between">
                        <h3 class="font-bold text-gray-800 leading-tight mb-1 text-[11px] md:text-xs line-clamp-2">${p.name}</h3>
                        <div class="flex justify-between items-end mt-1">
                            <span class="text-brand font-black text-sm md:text-base">$${p.price.toFixed(2)}</span>
                            <span class="text-[9px] ${p.stock > 5 ? 'text-green-500' : 'text-red-500'} font-bold bg-gray-50 px-1 py-0.5 rounded">S: ${p.stock}</span>
                        </div>
                        ${p.wholesale_min_qty > 0 && p.wholesale_price > 0 ? 
                        `<button onclick="event.stopPropagation(); app.addToCart(${p.id}, ${p.wholesale_min_qty})" class="mt-2 bg-brand-light/30 hover:bg-brand text-brand-dark hover:text-white text-xs font-bold py-1.5 px-2 rounded transition-colors w-full flex items-center justify-center gap-1">
                            <i class="fa-solid fa-box-open"></i> Paquete de ${p.wholesale_min_qty} por $${(p.wholesale_price * p.wholesale_min_qty).toFixed(2)}
                        </button>` : ''}
                    </div>
                </div>
            `;
        });
    },

    togglePackageMode: () => {
        const isPackage = document.getElementById('p_is_package').checked;
        const calcArea = document.getElementById('package_calc_area');
        const costInput = document.getElementById('p_cost');
        
        if (isPackage) {
            calcArea.classList.remove('hidden');
            costInput.readOnly = true;
            costInput.classList.add('bg-gray-100');
        } else {
            calcArea.classList.add('hidden');
            costInput.readOnly = false;
            costInput.classList.remove('bg-gray-100');
        }
        app.calculatePrice();
    },

    // IVA Calculation: Cost + 16% IVA + Margin%
    calculatePrice: () => {
        try {
            const isPackage = document.getElementById('p_is_package').checked;
            const costInput = document.getElementById('p_cost');
            
            if (isPackage) {
                const pkgCostStr = document.getElementById('p_package_cost').value;
                const pkgUnitsStr = document.getElementById('p_package_units').value;
                if (pkgCostStr && pkgUnitsStr) {
                    const pkgCost = parseFloat(pkgCostStr);
                    const pkgUnits = parseFloat(pkgUnitsStr);
                    if (pkgUnits > 0) {
                        costInput.value = (pkgCost / pkgUnits).toFixed(2);
                    }
                }
            }
            
            const costStr = costInput.value;
            const marginStr = document.getElementById('p_margin').value;
            
            if (!costStr) {
                document.getElementById('p_final_price').value = '';
                return;
            }
            
            const cost = parseFloat(costStr);
            const margin = parseFloat(marginStr) || 0;
            
            // 1. Costo con IVA
            const costWithIva = cost * 1.16;
            
            // 2. Precio final = Costo con IVA + (Costo con IVA * margen / 100)
            let finalPrice = costWithIva * (1 + (margin / 100));
            finalPrice = Math.round(finalPrice);
            
            document.getElementById('p_final_price').value = finalPrice.toFixed(2);
            
            // 3. Auto-calculate package price based on margin and package config
            const wMinQtyStr = document.getElementById('p_package_units').value;
            if (wMinQtyStr && isPackage) {
                const wMinQty = parseInt(wMinQtyStr, 10);
                if (wMinQty > 0) {
                    let defaultPkgPrice = 0;
                    
                    // Calculate exact package public price from package cost to avoid rounding errors
                    const pkgCostStr = document.getElementById('p_package_cost').value;
                    const pkgCost = parseFloat(pkgCostStr) || 0;
                    if (pkgCost > 0) {
                        const pkgCostWithIva = pkgCost * 1.16;
                        defaultPkgPrice = pkgCostWithIva * (1 + (margin / 100));
                    } else {
                        defaultPkgPrice = finalPrice * wMinQty;
                    }
                    
                    defaultPkgPrice = Math.round(defaultPkgPrice);
                    document.getElementById('p_package_total_price').value = defaultPkgPrice.toFixed(2);
                    app.calculateWholesaleFromTotal(true); 
                } else {
                    document.getElementById('p_package_total_price').value = '';
                    document.getElementById('p_wholesale_price').value = '0';
                }
            } else {
                document.getElementById('p_package_total_price').value = '';
                document.getElementById('p_wholesale_price').value = '0';
            }
        } catch (e) {
            console.error(e);
            alert("Error calculando precio: " + e.message);
        }
    },

    calculateMarginFromPrice: () => {
        const costStr = document.getElementById('p_cost').value;
        const finalPriceStr = document.getElementById('p_final_price').value;
        
        if (!costStr || !finalPriceStr) return;
        
        const cost = parseFloat(costStr);
        const finalPrice = parseFloat(finalPriceStr);
        
        if (cost <= 0) return;
        
        const costWithIva = cost * 1.16;
        let margin = ((finalPrice / costWithIva) - 1) * 100;
        
        document.getElementById('p_margin').value = margin.toFixed(2);
    },

    calculateWholesaleFromTotal: (skipMarginRecalc = false) => {
        const minQtyStr = document.getElementById('p_package_units').value;
        const totalPriceStr = document.getElementById('p_package_total_price').value;
        
        if (!minQtyStr || !totalPriceStr) {
            document.getElementById('p_wholesale_price').value = "0";
            return;
        }
        
        const minQty = parseInt(minQtyStr, 10);
        const totalPrice = parseFloat(totalPriceStr);
        
        if (minQty > 0) {
            const pricePerItem = totalPrice / minQty;
            document.getElementById('p_wholesale_price').value = pricePerItem.toFixed(2);
        } else {
            document.getElementById('p_wholesale_price').value = "0";
        }
    },

    editProduct: (id) => {
        const product = products.find(p => p.id === id);
        if (!product) return;
        
        ui.openModal('addProductModal');
        
        app.editingProductId = id;
        const titleEl = document.getElementById('addProductModalTitle');
        if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pencil mr-2"></i>Editar Producto';
        
        const btnDelete = document.getElementById('btnDeleteProduct');
        if (btnDelete) btnDelete.classList.remove('hidden');
        
        document.getElementById('p_name').value = product.name;
        document.getElementById('p_barcode').value = product.barcode || '';
        document.getElementById('p_cost').value = product.cost;
        document.getElementById('p_margin').value = product.margin;
        document.getElementById('p_stock').value = product.stock;
        
        document.getElementById('p_package_units').value = product.wholesale_min_qty || '';
        document.getElementById('p_wholesale_price').value = product.wholesale_price || 0;
        document.getElementById('p_package_total_price').value = ((product.wholesale_min_qty || 0) * (product.wholesale_price || 0)).toFixed(2) || '';
        
        if (product.wholesale_min_qty > 0) {
            document.getElementById('p_is_package').checked = true;
            document.getElementById('package_calc_area').classList.remove('hidden');
        } else {
            document.getElementById('p_is_package').checked = false;
            document.getElementById('package_calc_area').classList.add('hidden');
        }
        
        document.getElementById('p_is_favorite').checked = !!product.is_favorite;
        
        app.calculateWholesaleFromTotal(true);
        
        document.getElementById('imageBase64').value = product.image_base64 || '';
        
        if (product.image_base64) {
            document.getElementById('imagePreview').innerHTML = `<img src="${product.image_base64}" class="w-full h-full object-cover">`;
        } else {
            document.getElementById('imagePreview').innerHTML = '<i class="fa-solid fa-camera text-3xl text-gray-400"></i>';
        }
        
        app.calculatePrice();
    },

    addQuickSale: (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('qs_name');
        const amountInput = document.getElementById('qs_amount');
        const qtyInput = document.getElementById('qs_qty');
        
        const amount = parseFloat(amountInput.value);
        const qty = parseInt(qtyInput.value, 10) || 1;
        
        if (isNaN(amount) || amount <= 0 || qty <= 0) return;

        const quickProduct = {
            id: 'qs_' + Date.now(),
            name: nameInput.value || 'Venta Rápida',
            price: amount,
            original_price: amount,
            cost: amount / (1.16 * 1.52),
            stock: 99999,
            isQuickSale: true
        };

        cart.push({ ...quickProduct, quantity: qty });
        app.renderCart();
        
        // Limpiar formulario antes de cerrar
        nameInput.value = '';
        amountInput.value = '';
        if (qtyInput) qtyInput.value = '1';
        
        ui.closeModal();
        if (window.innerWidth < 768) {
            ui.toggleMobileCart();
        }
    },
    
    recognizeProduct: async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // También establecer esta imagen como la foto del producto
        ui.handleImageUpload(event);

        const btn = document.getElementById('aiWandBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result;
                
                const response = await fetch(`${API_URL}/recognize-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 })
                });

                const data = await response.json();
                
                if (response.ok && data.name) {
                    if (data.name !== 'Producto desconocido') {
                        document.getElementById('p_name').value = data.name;
                        if (data.barcode) {
                            document.getElementById('p_barcode').value = data.barcode;
                        }
                        // Focus on price or barcode to continue flow
                        if (!data.barcode) {
                            document.getElementById('p_barcode').focus();
                        } else {
                            document.getElementById('p_cost').focus();
                        }
                    } else {
                        alert('La IA no pudo reconocer el producto. Por favor, escríbelo manualmente.');
                    }
                } else {
                    alert(data.error || 'Error al conectar con la IA.');
                }
                
                btn.innerHTML = originalHtml;
                btn.disabled = false;
                event.target.value = ''; // reset input
            };
            reader.onerror = () => {
                alert('Error al leer la imagen.');
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            };
        } catch (error) {
            console.error(error);
            alert('Error al analizar la imagen.');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    },

    saveProduct: async (e) => {
        e.preventDefault();
        
        const priceStr = document.getElementById('p_final_price').value;
        if (!priceStr || parseFloat(priceStr) <= 0) {
            alert("Calcula un precio válido primero");
            return;
        }

        const product = {
            name: document.getElementById('p_name').value,
            barcode: document.getElementById('p_barcode').value,
            cost: parseFloat(document.getElementById('p_cost').value),
            margin: parseFloat(document.getElementById('p_margin').value),
            price: parseFloat(priceStr),
            stock: parseInt(document.getElementById('p_stock').value, 10) || 0,
            image_base64: document.getElementById('imageBase64').value,
            wholesale_min_qty: document.getElementById('p_is_package').checked ? (Number(document.getElementById('p_package_units').value) || 0) : 0,
            wholesale_price: document.getElementById('p_is_package').checked ? (Number(document.getElementById('p_wholesale_price').value) || 0) : 0,
            is_favorite: document.getElementById('p_is_favorite').checked
        };
        
        if (app.editingProductId) {
            product.id = app.editingProductId;
        }

        try {
            await api.saveProduct(product);
            ui.closeModal();
            app.editingProductId = null;
            app.loadProducts();
            // Show success toast or animation
        } catch (error) {
            alert(error.message);
        }
    },

    deleteProduct: async () => {
        if (!app.editingProductId) return;
        
        if (confirm("¿Estás seguro de que deseas eliminar este producto permanentemente?")) {
            try {
                await api.deleteProduct(app.editingProductId);
                ui.closeModal();
                app.editingProductId = null;
                app.loadProducts();
            } catch (error) {
                alert(error.message);
            }
        }
    },

    handleBarcodeScan: async (barcode) => {
        // Find in local products first for speed
        const p = products.find(prod => prod.barcode === barcode);
        if (p) {
            app.addToCart(p.id);
        } else {
            // Or fetch from API
            try {
                const prod = await api.getProductByBarcode(barcode);
                if (prod) {
                    app.addToCart(prod.id);
                }
            } catch (error) {
                alert("Producto no encontrado");
            }
        }
    },

    checkWholesalePrompt: (item) => {
        if (item.wholesale_min_qty > 0 && item.quantity >= item.wholesale_min_qty && item.wholesale_price > 0) {
            if (item.prompted_for_wholesale !== true) {
                const wantsDiscount = confirm(`Has agregado ${item.quantity} piezas de ${item.name}.\n\n¿Deseas aplicar el precio especial de paquete ($${(item.wholesale_price * item.wholesale_min_qty).toFixed(2)} por cada ${item.wholesale_min_qty} piezas)?`);
                if (wantsDiscount) {
                    item.is_wholesale = true;
                    item.price = item.wholesale_price;
                } else {
                    item.is_wholesale = false;
                    item.price = item.original_price;
                }
                item.prompted_for_wholesale = true;
            }
        } else {
            item.prompted_for_wholesale = false;
            item.is_wholesale = false;
            if (item.original_price) {
                item.price = item.original_price;
            }
        }
    },

    // Cart Logic
    addToCart: (productId, qty = 1) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (product.stock <= 0) {
            alert("No hay stock disponible");
            return;
        }

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            if (existingItem.quantity + qty > product.stock) {
                alert(`Solo hay ${product.stock} en stock`);
                return;
            }
            existingItem.quantity += qty;
            app.checkWholesalePrompt(existingItem);
        } else {
            if (qty > product.stock) {
                alert(`Solo hay ${product.stock} en stock`);
                return;
            }
            const newItem = { 
                ...product, 
                quantity: qty, 
                original_price: product.price,
                is_wholesale: false
            };
            app.checkWholesalePrompt(newItem);
            cart.push(newItem);
        }
        
        app.renderCart();
    },

    updateCartQuantity: (productId, delta) => {
        const item = cart.find(i => String(i.id) === String(productId));
        if (!item) return;
        
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => String(i.id) !== String(productId));
        } else {
             const product = products.find(p => String(p.id) === String(productId));
             const stockLimit = product ? product.stock : (item.isQuickSale ? 99999 : 0);
             item.quantity = item.quantity > stockLimit ? stockLimit : item.quantity;
             app.checkWholesalePrompt(item);
        }
        app.renderCart();
    },

    setCartQuantity: (productId) => {
        const item = cart.find(i => String(i.id) === String(productId));
        if (!item) return;
        
        const newQtyStr = prompt(`Cantidad para ${item.name}:`, item.quantity);
        if (newQtyStr !== null) {
            const newQty = parseInt(newQtyStr, 10);
            if (!isNaN(newQty) && newQty >= 0) {
                if (newQty === 0) {
                    app.removeFromCart(productId);
                } else {
                    const product = products.find(p => String(p.id) === String(productId));
                    const stockLimit = product ? product.stock : (item.isQuickSale ? 99999 : 0);
                    item.quantity = newQty > stockLimit ? stockLimit : newQty;
                    app.checkWholesalePrompt(item);
                    app.renderCart();
                }
            }
        }
    },

    renderCart: () => {
        const cartContainer = document.getElementById('cartItems');
        const badge = document.getElementById('mobile-cart-badge');
        
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div class="text-center text-gray-400 mt-10"><i class="fa-solid fa-basket-shopping text-4xl mb-2"></i><p>El carrito está vacío</p></div>';
            document.getElementById('cartTotal').innerText = '$0.00';
            badge.innerText = '0';
            return;
        }

        let total = 0;
        let count = 0;
        cartContainer.innerHTML = '';
        
        cart.forEach(item => {
            count += item.quantity;
            total += item.price * item.quantity;
            
            cartContainer.innerHTML += `
                <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center justify-between animate-pop">
                    <div class="flex-1">
                        <h4 class="font-bold text-sm text-gray-800 line-clamp-1">${item.name}</h4>
                        <div class="flex items-center gap-2">
                            <span class="text-brand font-semibold text-sm">$${item.price.toFixed(2)}</span>
                            ${item.is_wholesale ? '<span class="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">MAYOREO</span>' : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                            <button onclick="app.updateCartQuantity('${item.id}', -1)" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-brand bg-white rounded shadow-sm"><i class="fa-solid fa-minus text-xs"></i></button>
                            <span class="w-8 text-center font-bold text-sm cursor-pointer hover:bg-gray-200 rounded py-1 transition-colors" onclick="app.setCartQuantity('${item.id}')" title="Clic para cambiar cantidad">${item.quantity}</span>
                            <button onclick="app.updateCartQuantity('${item.id}', 1)" class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-brand bg-white rounded shadow-sm"><i class="fa-solid fa-plus text-xs"></i></button>
                        </div>
                        <button onclick="app.removeFromCart('${item.id}')" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><i class="fa-solid fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
        });
        
        document.getElementById('cartTotal').innerText = `$${total.toFixed(2)}`;
        badge.innerText = count;
    },

    clearCart: () => {
        cart = [];
        app.renderCart();
    },

    pauseSale: () => {
        if (cart.length === 0) {
            alert("No hay productos en el ticket para pausar.");
            return;
        }
        
        // Add to paused sales
        const saleData = {
            id: Date.now(),
            items: [...cart],
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        };
        
        pausedSales.push(saleData);
        
        // Clear current cart
        cart = [];
        app.renderCart();
        app.renderPausedSales();
        
        // Cierra el carrito en móvil
        if (window.innerWidth < 768) {
            document.getElementById('cartSidebar').classList.add('translate-x-full');
        }
        
        alert("Venta en espera guardada.");
    },
    
    resumeSale: (id) => {
        const saleIndex = pausedSales.findIndex(s => s.id === id);
        if (saleIndex !== -1) {
            // Si el ticket actual tiene cosas, avisar
            if (cart.length > 0) {
                if(!confirm("Tienes productos en tu ticket actual. ¿Deseas reemplazar el ticket actual?")) {
                    return;
                }
            }
            
            // Cargar productos
            cart = [...pausedSales[saleIndex].items];
            
            // Eliminar de pausados
            pausedSales.splice(saleIndex, 1);
            
            app.renderCart();
            app.renderPausedSales();
            ui.closeModal();
            
            // Abrir carrito en móvil
            if (window.innerWidth < 768) {
                ui.toggleMobileCart();
            }
        }
    },
    
    deletePausedSale: (id) => {
        if (confirm("¿Estás seguro de eliminar esta venta en espera?")) {
            pausedSales = pausedSales.filter(s => s.id !== id);
            app.renderPausedSales();
        }
    },
    
    renderPausedSales: () => {
        const container = document.getElementById('pausedSalesList');
        const badgeDesktop = document.getElementById('pausedSalesBadgeDesktop');
        const badgeMobile = document.getElementById('pausedSalesBadgeMobile');
        
        // Actualizar badges
        if (pausedSales.length > 0) {
            badgeDesktop.innerText = pausedSales.length;
            badgeDesktop.classList.remove('hidden');
            badgeMobile.innerText = pausedSales.length;
            badgeMobile.classList.remove('hidden');
        } else {
            badgeDesktop.classList.add('hidden');
            badgeMobile.classList.add('hidden');
        }
        
        if (!container) return;
        
        if (pausedSales.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 mt-6 mb-6">
                    <i class="fa-solid fa-clipboard-check text-3xl mb-2"></i>
                    <p>No hay ventas en espera</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        pausedSales.forEach(sale => {
            container.innerHTML += `
                <div class="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="font-bold text-gray-800 text-sm">Ticket ${sale.time}</p>
                        <p class="text-xs text-gray-500">${sale.items.length} artículos - <span class="font-bold text-brand">$${sale.total.toFixed(2)}</span></p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="app.resumeSale(${sale.id})" class="bg-brand text-white w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-dark transition-colors" title="Retomar Ticket"><i class="fa-solid fa-play"></i></button>
                        <button onclick="app.deletePausedSale(${sale.id})" class="bg-red-50 text-red-500 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    },

    removeFromCart: (productId) => {
        cart = cart.filter(i => String(i.id) !== String(productId));
        app.renderCart();
    },

    openCheckoutModal: () => {
        if (cart.length === 0) {
            alert("El carrito está vacío");
            return;
        }
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('checkoutTotalDisplay').innerText = `$${total.toFixed(2)}`;
        
        const cashInput = document.getElementById('checkoutCash');
        cashInput.value = '';
        document.getElementById('checkoutChangeDisplay').innerText = '$0.00';
        document.getElementById('checkoutChangeDisplay').className = 'text-2xl font-bold text-gray-400';
        document.getElementById('confirmCheckoutBtn').disabled = true;
        document.getElementById('confirmCheckoutBtn').classList.add('opacity-50', 'cursor-not-allowed');
        
        ui.openModal('checkoutModal');
        setTimeout(() => cashInput.focus(), 100);
    },

    calculateChange: () => {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cash = parseFloat(document.getElementById('checkoutCash').value) || 0;
        const changeDisplay = document.getElementById('checkoutChangeDisplay');
        const btn = document.getElementById('confirmCheckoutBtn');
        
        if (cash >= total) {
            const change = cash - total;
            changeDisplay.innerText = `$${change.toFixed(2)}`;
            changeDisplay.className = 'text-2xl font-bold text-green-600';
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        } else {
            changeDisplay.innerText = 'Falta dinero';
            changeDisplay.className = 'text-lg font-bold text-red-500';
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    },

    confirmCheckout: async (e) => {
        if (e) e.preventDefault();
        if (cart.length === 0) return;
        
        try {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await api.saveSale(cart, total);
            cart = [];
            app.renderCart();
            app.loadProducts(); // Refresh stock
            ui.closeModal();
            alert("Venta registrada exitosamente");
            if (window.innerWidth < 768) {
                ui.toggleMobileCart();
            }
        } catch (error) {
            alert(error.message);
        }
    },

    loadRegisterCut: async () => {
        try {
            const data = await api.getTodaySales();
            
            const total = data.total || 0;
            const totalCost = data.total_cost || 0;
            const transCount = data.sales ? data.sales.length : 0;
            
            // Cálculos para SAT
            const subtotal = total / 1.16;
            const iva = total - subtotal;
            const profit = subtotal - totalCost;
            const isr = subtotal * 0.01; // 1% RESICO sobre ingresos (subtotal)
            
            document.getElementById('cutTotalDisplay').innerText = `$${total.toFixed(2)}`;
            document.getElementById('cutCountDisplay').innerText = transCount;
            document.getElementById('cutSubtotalDisplay').innerText = `$${subtotal.toFixed(2)}`;
            document.getElementById('cutIvaDisplay').innerText = `$${iva.toFixed(2)}`;
            document.getElementById('cutCostDisplay').innerText = `-$${totalCost.toFixed(2)}`;
            document.getElementById('cutProfitDisplay').innerText = `$${profit.toFixed(2)}`;
            document.getElementById('cutIsrDisplay').innerText = `$${isr.toFixed(2)}`;
            
            // Renderizar lista de tickets
            const list = document.getElementById('cutSalesList');
            list.innerHTML = '';
            if (data.sales && data.sales.length > 0) {
                data.sales.forEach(sale => {
                    const date = new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    list.innerHTML += `
                        <div onclick="app.viewSale(${sale.id})" class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:bg-brand-light/10 transition-colors">
                            <div>
                                <p class="font-bold text-gray-800 text-sm">Ticket #${sale.id}</p>
                                <p class="text-xs text-gray-500">${date}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="font-black text-brand">$${sale.total.toFixed(2)}</span>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                        </div>
                    `;
                });
            } else {
                list.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No hay ventas registradas hoy</p>';
            }
            
        } catch (error) {
            console.error('Error loading register cut', error);
        }
    },

    loadReport: async (e) => {
        if (e) e.preventDefault();
        
        const start = document.getElementById('rep_start').value;
        const end = document.getElementById('rep_end').value;
        if (!start || !end) return;

        try {
            const data = await api.getReport(start, end);
            
            const total = data.total || 0;
            const totalCost = data.total_cost || 0;
            const transCount = data.sales ? data.sales.length : 0;
            
            // Cálculos para SAT
            const subtotal = total / 1.16;
            const iva = total - subtotal;
            const profit = subtotal - totalCost;
            const isr = subtotal * 0.01; // 1% RESICO
            
            document.getElementById('repTotalDisplay').innerText = `$${total.toFixed(2)}`;
            document.getElementById('repCountDisplay').innerText = transCount;
            document.getElementById('repSubtotalDisplay').innerText = `$${subtotal.toFixed(2)}`;
            document.getElementById('repIvaDisplay').innerText = `$${iva.toFixed(2)}`;
            document.getElementById('repCostDisplay').innerText = `-$${totalCost.toFixed(2)}`;
            document.getElementById('repProfitDisplay').innerText = `$${profit.toFixed(2)}`;
            document.getElementById('repIsrDisplay').innerText = `$${isr.toFixed(2)}`;

            // Renderizar lista de tickets
            const list = document.getElementById('repSalesList');
            list.innerHTML = '';
            if (data.sales && data.sales.length > 0) {
                data.sales.forEach(sale => {
                    const dateObj = new Date(sale.date);
                    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    list.innerHTML += `
                        <div onclick="app.viewSale(${sale.id})" class="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:bg-brand-light/10 transition-colors">
                            <div>
                                <p class="font-bold text-gray-800 text-sm">Ticket #${sale.id}</p>
                                <p class="text-xs text-gray-500">${dateStr}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="font-black text-brand">$${sale.total.toFixed(2)}</span>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                            </div>
                        </div>
                    `;
                });
            } else {
                list.innerHTML = '<p class="text-center text-gray-400 text-sm py-4">No hay ventas en este periodo</p>';
            }
        } catch (error) {
            alert(error.message);
        }
    }
};

// Auto update register cut when opening modal
document.querySelector('[onclick="ui.openModal(\'registerCutModal\')"]').addEventListener('click', app.loadRegisterCut);
const mobileCutBtn = document.querySelectorAll('[onclick="ui.openModal(\'registerCutModal\')"]')[1];
if (mobileCutBtn) mobileCutBtn.addEventListener('click', app.loadRegisterCut);

// ==========================================
// Ticket View & Print Logic
// ==========================================
let currentViewedSale = null;

app.viewSale = async (saleId) => {
    try {
        const sale = await api.getSaleDetails(saleId);
        currentViewedSale = sale;
        
        const dateObj = new Date(sale.date);
        const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
        
        document.getElementById('saleDetailTitle').innerText = `Ticket #${sale.id}`;
        document.getElementById('saleDetailDate').innerText = dateStr;
        document.getElementById('saleDetailTotal').innerText = `$${sale.total.toFixed(2)}`;
        
        const list = document.getElementById('saleDetailItems');
        list.innerHTML = '';
        
        sale.items.forEach(item => {
            const subtotal = item.price * item.quantity;
            const itemName = item.name || 'Venta Rápida / Artículo Eliminado';
            list.innerHTML += `
                <tr>
                    <td class="py-3 px-2 md:px-3">
                        <p class="font-bold text-gray-800 line-clamp-1">${itemName}</p>
                        <p class="text-[10px] text-gray-500">$${item.price.toFixed(2)} c/u</p>
                    </td>
                    <td class="py-3 px-2 md:px-3 text-center font-bold">${item.quantity}</td>
                    <td class="py-3 px-2 md:px-3 text-right font-bold text-brand">$${subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        ui.openModal('saleDetailModal');
    } catch (error) {
        alert(error.message);
    }
};

app.printTicket = () => {
    if (!currentViewedSale) return;
    const sale = currentViewedSale;
    
    const printWindow = window.open('', '_blank');
    const dateObj = new Date(sale.date);
    const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString();
    
    let itemsHtml = '';
    sale.items.forEach(item => {
        const subtotal = item.price * item.quantity;
        const itemName = item.name || 'Venta Rápida / Artículo Eliminado';
        itemsHtml += `
            <div class="item">
                <div>${itemName}</div>
                <div class="item-details">
                    <span>${item.quantity} x $${item.price.toFixed(2)}</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
            </div>
        `;
    });

    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Ticket #${sale.id}</title>
        <style>
            body { font-family: monospace; margin: 0; padding: 10px; width: 300px; font-size: 14px; color: #000; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .mb-2 { margin-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .item { margin-bottom: 5px; }
            .item-details { display: flex; justify-content: space-between; padding-left: 10px; }
            .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; margin-top: 10px; }
            @media print {
                body { padding: 0; width: 100%; margin: 0; }
            }
        </style>
    </head>
    <body>
        <div class="text-center font-bold mb-2" style="font-size: 18px;">Papelería Renacimiento</div>
        <div class="text-center mb-2">Gracias por su compra</div>
        <div class="divider"></div>
        <div>Ticket: #${sale.id}</div>
        <div>Fecha: ${dateStr}</div>
        <div class="divider"></div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        <div class="total-row">
            <span>TOTAL:</span>
            <span>$${sale.total.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="text-center mt-2" style="font-size: 12px;">¡Vuelva pronto!</div>
        
        <script>
            window.onload = () => { setTimeout(() => { window.print(); }, 500); };
        </script>
    </body>
    </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
};

// ==========================================
// Kits Logic
// ==========================================

app.openKitsModal = () => {
    ui.openModal('kitsModal');
    app.loadKits();
    app.switchKitTab('vender');
};

app.switchKitTab = (tab) => {
    const btnVender = document.getElementById('tabVenderKit');
    const btnCrear = document.getElementById('tabCrearKit');
    const areaList = document.getElementById('kitsListArea');
    const areaCreate = document.getElementById('kitsCreateArea');
    
    if (tab === 'vender') {
        btnVender.className = 'flex-1 py-3 font-bold text-brand border-b-2 border-brand transition-colors';
        btnCrear.className = 'flex-1 py-3 font-semibold text-gray-500 hover:text-brand transition-colors';
        areaList.classList.remove('hidden');
        areaCreate.classList.add('hidden');
    } else {
        btnCrear.className = 'flex-1 py-3 font-bold text-brand border-b-2 border-brand transition-colors';
        btnVender.className = 'flex-1 py-3 font-semibold text-gray-500 hover:text-brand transition-colors';
        areaCreate.classList.remove('hidden');
        areaCreate.classList.add('flex', 'flex-col');
        areaList.classList.add('hidden');
        
        // Reset form
        document.getElementById('kitForm').reset();
        currentKitItems = [];
        app.renderKitItems();
    }
};

app.loadKits = async () => {
    try {
        kits = await api.getKits();
        app.renderKitsList();
    } catch (error) {
        console.error("Error al cargar kits:", error);
    }
};

app.renderKitsList = () => {
    const container = document.getElementById('kitsGridContainer');
    const emptyMsg = document.getElementById('emptyKitsMsg');
    
    if (kits.length === 0) {
        container.classList.add('hidden');
        emptyMsg.classList.remove('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    emptyMsg.classList.add('hidden');
    container.innerHTML = '';
    
    kits.forEach(kit => {
        container.innerHTML += `
            <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:border-brand transition-colors" onclick="app.sellKit(${kit.id})">
                <h4 class="font-bold text-gray-800 text-lg">${kit.name}</h4>
                <p class="text-sm text-gray-500 mb-3">${kit.items.reduce((s, i) => s + i.quantity, 0)} artículos</p>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-brand font-black text-xl">$${kit.price.toFixed(2)}</span>
                    <button class="bg-brand text-white text-sm font-bold py-1 px-3 rounded shadow-sm hover:bg-brand-dark">Vender</button>
                </div>
            </div>
        `;
    });
};

app.sellKit = (kitId) => {
    const kit = kits.find(k => k.id === kitId);
    if (!kit) return;
    
    const originalTotal = kit.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountFactor = originalTotal > 0 ? (kit.price / originalTotal) : 1;
    
    kit.items.forEach(item => {
        const discountedPrice = item.price * discountFactor;
        
        const existingItem = cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        } else {
            cart.push({
                id: item.id,
                name: item.name,
                price: discountedPrice,
                original_price: discountedPrice, // We lock in the discounted price
                cost: item.cost,
                quantity: item.quantity,
                is_wholesale: false,
                wholesale_min_qty: 0 
            });
        }
    });
    
    app.renderCart();
    ui.closeModal();
    alert(`Lista "${kit.name}" agregada al ticket.`);
    
    if (window.innerWidth < 768) {
        ui.toggleMobileCart();
    }
};

app.openProductSelectorForKit = () => {
    ui.openModal('productSelectorModal');
    app.filterProductSelector();
};

app.filterProductSelector = () => {
    const query = document.getElementById('kitProductSearch').value.toLowerCase();
    const container = document.getElementById('productSelectorList');
    container.innerHTML = '';
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query)));
    
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer" onclick="app.addProductToKit(${p.id})">
                <div>
                    <p class="text-sm font-bold text-gray-800">${p.name}</p>
                    <p class="text-xs text-brand">$${p.price.toFixed(2)}</p>
                </div>
                <button class="bg-gray-200 text-gray-600 rounded p-1 w-6 h-6 flex items-center justify-center hover:bg-brand hover:text-white"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>
        `;
    });
};

app.addProductToKit = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = currentKitItems.find(i => i.product_id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        currentKitItems.push({
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    app.renderKitItems();
};

app.removeProductFromKit = (productId) => {
    currentKitItems = currentKitItems.filter(i => i.product_id !== productId);
    app.renderKitItems();
};

app.updateKitItemQuantity = (productId, delta) => {
    const item = currentKitItems.find(i => i.product_id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        app.removeProductFromKit(productId);
    } else {
        app.renderKitItems();
    }
};

app.renderKitItems = () => {
    const container = document.getElementById('kitItemsList');
    const emptyMsg = document.getElementById('emptyKitItemsMsg');
    const suggestedPriceEl = document.getElementById('kitSuggestedPrice');
    const finalPriceInput = document.getElementById('k_price');
    
    if (currentKitItems.length === 0) {
        container.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        suggestedPriceEl.innerText = '$0.00';
        return;
    }
    
    emptyMsg.classList.add('hidden');
    container.innerHTML = '';
    
    let suggestedPrice = 0;
    
    currentKitItems.forEach(item => {
        suggestedPrice += item.price * item.quantity;
        container.innerHTML += `
            <div class="bg-white p-2 rounded border border-gray-200 flex justify-between items-center shadow-sm">
                <div class="flex-1">
                    <p class="text-xs font-bold text-gray-800 line-clamp-1">${item.name}</p>
                    <p class="text-[10px] text-brand">$${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="flex items-center gap-1 bg-gray-100 rounded px-1 ml-2">
                    <button type="button" onclick="app.updateKitItemQuantity(${item.product_id}, -1)" class="w-5 h-5 flex justify-center items-center text-gray-500 hover:text-brand"><i class="fa-solid fa-minus text-[10px]"></i></button>
                    <span class="text-xs font-bold w-4 text-center">${item.quantity}</span>
                    <button type="button" onclick="app.updateKitItemQuantity(${item.product_id}, 1)" class="w-5 h-5 flex justify-center items-center text-gray-500 hover:text-brand"><i class="fa-solid fa-plus text-[10px]"></i></button>
                </div>
                <button type="button" onclick="app.removeProductFromKit(${item.product_id})" class="ml-2 text-red-400 hover:text-red-600"><i class="fa-solid fa-times"></i></button>
            </div>
        `;
    });
    
    suggestedPriceEl.innerText = `$${suggestedPrice.toFixed(2)}`;
    
    if (!finalPriceInput.value || parseFloat(finalPriceInput.value) === 0) {
        finalPriceInput.value = suggestedPrice.toFixed(2);
    }
};

app.saveKit = async (e) => {
    e.preventDefault();
    
    if (currentKitItems.length === 0) {
        alert("Agrega al menos un artículo a la lista.");
        return;
    }
    
    const kit = {
        name: document.getElementById('k_name').value,
        price: parseFloat(document.getElementById('k_price').value),
        items: currentKitItems
    };
    
    try {
        await api.saveKit(kit);
        alert("Lista escolar creada exitosamente");
        app.switchKitTab('vender');
        app.loadKits();
    } catch (error) {
        alert("Error al guardar kit: " + error.message);
    }
};

// ==========================================
// Labels Logic
// ==========================================

app.filterLabelSelector = () => {
    const query = document.getElementById('labelProductSearch').value.toLowerCase();
    const container = document.getElementById('labelSelectorList');
    container.innerHTML = '';
    
    // Solo productos que tengan código de barras (aunque podemos generarlo si está vacío, es mejor usar los que tienen)
    const filtered = products.filter(p => (p.name.toLowerCase().includes(query) || (p.barcode && p.barcode.includes(query))) && p.barcode);
    
    filtered.forEach(p => {
        container.innerHTML += `
            <div class="flex justify-between items-center p-2 hover:bg-gray-50 border-b border-gray-100 cursor-pointer" onclick="app.addLabelToQueue(${p.id})">
                <div>
                    <p class="text-sm font-bold text-gray-800">${p.name}</p>
                    <p class="text-xs text-brand">$${p.price.toFixed(2)} | <i class="fa-solid fa-barcode mr-1"></i>${p.barcode}</p>
                </div>
                <button class="bg-blue-100 text-blue-600 rounded p-1 w-6 h-6 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><i class="fa-solid fa-plus text-xs"></i></button>
            </div>
        `;
    });
};

app.addLabelToQueue = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.barcode) {
        alert("El producto debe tener un código de barras");
        return;
    }
    
    const existing = labelsQueue.find(i => i.id === productId);
    if (existing) {
        existing.quantity++;
    } else {
        labelsQueue.push({
            id: product.id,
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            quantity: 1
        });
    }
    
    app.renderLabelsQueue();
};

app.removeLabelFromQueue = (productId) => {
    labelsQueue = labelsQueue.filter(i => i.id !== productId);
    app.renderLabelsQueue();
};

app.updateLabelQuantity = (productId, delta) => {
    const item = labelsQueue.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        app.removeLabelFromQueue(productId);
    } else {
        app.renderLabelsQueue();
    }
};

app.renderLabelsQueue = () => {
    const container = document.getElementById('labelsQueue');
    const emptyMsg = document.getElementById('emptyLabelsMsg');
    
    if (labelsQueue.length === 0) {
        container.innerHTML = '';
        container.appendChild(emptyMsg);
        emptyMsg.classList.remove('hidden');
        return;
    }
    
    emptyMsg.classList.add('hidden');
    container.innerHTML = '';
    
    labelsQueue.forEach(item => {
        container.innerHTML += `
            <div class="bg-white p-2 rounded border border-gray-200 flex justify-between items-center shadow-sm mb-2">
                <div class="flex-1">
                    <p class="text-xs font-bold text-gray-800 line-clamp-1">${item.name}</p>
                    <p class="text-[10px] text-gray-500">${item.barcode}</p>
                </div>
                <div class="flex items-center gap-1 bg-gray-100 rounded px-1 ml-2">
                    <button onclick="app.updateLabelQuantity(${item.id}, -1)" class="w-6 h-6 flex justify-center items-center text-gray-500 hover:text-blue-600"><i class="fa-solid fa-minus text-xs"></i></button>
                    <span class="text-sm font-bold w-6 text-center">${item.quantity}</span>
                    <button onclick="app.updateLabelQuantity(${item.id}, 1)" class="w-6 h-6 flex justify-center items-center text-gray-500 hover:text-blue-600"><i class="fa-solid fa-plus text-xs"></i></button>
                </div>
                <button onclick="app.removeLabelFromQueue(${item.id})" class="ml-2 text-red-400 hover:text-red-600 p-1"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
};

app.printLabels = () => {
    if (labelsQueue.length === 0) {
        alert("Agrega productos para imprimir etiquetas");
        return;
    }
    
    // Crear ventana para imprimir
    const printWindow = window.open('', '_blank');
    
    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Impresión de Etiquetas</title>
        <style>
            body { font-family: sans-serif; margin: 0; padding: 10px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
            .label { border: 1px dashed #ccc; padding: 10px; text-align: center; page-break-inside: avoid; }
            .name { font-size: 12px; font-weight: bold; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .price { font-size: 14px; font-weight: 900; margin-bottom: 5px; }
            svg { max-width: 100%; height: auto; }
            @media print {
                body { padding: 0; }
                .label { border: 1px solid #000; }
            }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
        <div class="grid">
    `;
    
    // Generar SVG placeholders
    let barcodeIndex = 0;
    const barcodeData = [];
    
    labelsQueue.forEach(item => {
        for(let i=0; i<item.quantity; i++) {
            html += `
            <div class="label">
                <div class="name">${item.name}</div>
                <div class="price">$${item.price.toFixed(2)}</div>
                <svg id="barcode-${barcodeIndex}"></svg>
            </div>
            `;
            barcodeData.push({ index: barcodeIndex, barcode: item.barcode });
            barcodeIndex++;
        }
    });
    
    html += `
        </div>
        <script>
            window.onload = () => {
                const barcodes = ${JSON.stringify(barcodeData)};
                barcodes.forEach(b => {
                    JsBarcode("#barcode-" + b.index, b.barcode, {
                        format: "CODE128",
                        width: 1.5,
                        height: 40,
                        displayValue: true,
                        fontSize: 12,
                        margin: 0
                    });
                });
                setTimeout(() => {
                    window.print();
                }, 500);
            };
        </script>
    </body>
    </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
};

// Configurar fechas iniciales del reporte histórico
const setupHistoryDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    document.getElementById('rep_start').value = firstDay;
    document.getElementById('rep_end').value = lastDay;
};

document.querySelector('[onclick="ui.openModal(\'historyModal\')"]').addEventListener('click', () => {
    if (!document.getElementById('rep_start').value) setupHistoryDates();
    app.loadReport();
});
const mobileHistoryBtn = document.querySelectorAll('[onclick="ui.openModal(\'historyModal\')"]')[1];
if (mobileHistoryBtn) {
    mobileHistoryBtn.addEventListener('click', () => {
        if (!document.getElementById('rep_start').value) setupHistoryDates();
        app.loadReport();
    });
}

// ==========================================
// Keyboard Shortcuts
// ==========================================
document.addEventListener('keydown', (e) => {
    // Si el usuario está escribiendo en un campo de texto, solo permitimos Ctrl+Enter para cobrar
    const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';
    
    // Ctrl + Enter para cobrar
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        app.openCheckoutModal();
        return;
    }

    if (isInput) return; // Ignorar otras teclas si está en un input
    
    const key = e.key.toLowerCase();
    
    switch (key) {
        case 'b': // Buscar
            e.preventDefault();
            document.getElementById('searchInput').focus();
            break;
        case 'v': // Venta Rápida
            e.preventDefault();
            ui.openModal('quickSaleModal');
            setTimeout(() => document.getElementById('qs_name').focus(), 100);
            break;
        case 'p': // Productos
            e.preventDefault();
            ui.openModal('addProductModal');
            setTimeout(() => document.getElementById('p_name').focus(), 100);
            break;
        case 'k': // Kits
            e.preventDefault();
            app.openKitsModal();
            break;
        case 'e': // Espera
            e.preventDefault();
            ui.openModal('pausedSalesModal');
            break;
        case 't': // Etiquetas
            e.preventDefault();
            ui.openModal('labelsModal');
            setTimeout(() => document.getElementById('labelProductSearch').focus(), 100);
            break;
        case 'c': // Corte
            e.preventDefault();
            ui.openModal('registerCutModal');
            app.loadRegisterCut();
            break;
        case 'h': // Historial
            e.preventDefault();
            ui.openModal('historyModal');
            if (!document.getElementById('rep_start').value) setupHistoryDates();
            app.loadReport();
            break;
        case 'enter': // Cobrar (si no está en input, Enter funciona como Ctrl+Enter)
            e.preventDefault();
            app.openCheckoutModal();
            break;
    }
});

// Init App
document.addEventListener('DOMContentLoaded', app.init);
