import { 
    storage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    doc,         
    deleteDoc,   
    updateDoc,   
    getDoc,
    auth,
    onAuthStateChanged,
    serverTimestamp
} from "./firebase.js";

// Initialize cart array
let cart = [];

// Function to fetch all restaurants and return a map of ID to name and image
const getRestaurantMap = async () => {
    const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantMap = {};
    restaurantSnapshot.forEach((doc) => {
        const data = doc.data();
        restaurantMap[doc.id] = {
            name: data.name,
            image: data.image || 'default-image-url.jpg' // Set a default image if restaurant doesn't have one
        };
    });
    return restaurantMap;
};

// Function to calculate the relative time
const getRelativeTime = (timestamp) => {
    const now = new Date();
    const timeDiff = now - timestamp;

    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(timeDiff / 3600000);
    const days = Math.floor(timeDiff / 86400000);


    if (seconds < 60) {
        return 'Just Now';
    } else if (minutes < 60) {
        return minutes === 1 ? '1 Minute ago' : `${minutes} Minutes ago`;
    } else if (hours < 24) {
        return hours === 1 ? '1 Hour ago' : `${hours} Hours ago`;
    } else {
        return days === 1 ? '1 Day ago' : `${days} Days ago`;
    }
};

// Function to fetch and display dishes based on search term
const showDishes = async (searchTerm = '') => {
    const showDiv = document.getElementById('show');
    if (showDiv) {
        const restaurantMap = await getRestaurantMap();
        const querySnapshot = await getDocs(collection(db, "dishes"));
        showDiv.innerHTML = '';

        let dishesFound = false;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === '') {
                dishesFound = true;

                // let discountText = '';
                // if (data.discount && data.price) {
                //     discountText = `${data.discount}% OFF`;
                // }

                let discountText = '';
                    if (data.discount && data.price && data.discount > 0) {
                        discountText = `${data.discount}% OFF`;
                    }

                let originalPriceHTML = '';
                if (data.originalPrice) {
                    originalPriceHTML = data.price ? 
                        `<p class="price">Rs. ${data.price} <span>Rs. ${data.originalPrice}</span></p>` :
                        `<p class="price">Rs. ${data.originalPrice}</p>`;
                } else if (data.price) {
                    originalPriceHTML = `<p class="price">Rs. ${data.price}</p>`;
                }

                const restaurant = restaurantMap[data.restaurant] || { name: 'Unknown Restaurant', image: 'default-image-url.jpg' };
                const createdAt = data.createdAt?.toDate();
                const relativeTime = createdAt ? getRelativeTime(createdAt) : 'Unknown time';

                showDiv.innerHTML += `
                <div class="col">
                    <div class="facebook-post-card card card-custom-margin">
                        ${discountText ? `<span class="discount">${discountText}</span>` : ''}
                        <div class="post-header">
                            <img class="post-profile-img" src=${restaurant.image} alt="Profile Image"> <!-- Use restaurant image -->
                            <div class="post-info">
                                <h5 class="post-name">Restaurant: ${restaurant.name}</h5>
                                <p class="post-time">Posted: ${relativeTime}</p>
                            </div>
                        </div>
                        <img id="dashboard-img" src="${data.image}" class="card-img-top" alt="${data.name}">
                        <div class="card-body post-body pt-3">
                            <p class="card-title"><strong>${data.name}</strong></p>
                            <p class="card-text">Serving: ${data.serving}</p>
                            ${originalPriceHTML}
                        </div>
                        <div class="post-actions">
                            <button class="btn btn-primary" data-id="${doc.id}" onclick="showDishModal('${doc.id}')">Add to Cart</button>
                        </div>
                    </div>
                </div>`;
            }
        });

        if (!dishesFound) {
            showDiv.innerHTML = `<p id="item-not-found" class="text-center">Item Not Found</p>`;
        }
    } else {
        console.log("No 'show' div found!");
    }
};


// Real-time search input listener
document.getElementById('searchInput').addEventListener('input', (event) => {
    const searchTerm = event.target.value;
    showDishes(searchTerm);
});


// // // Function to display the dish details modal
// // async function showDishModal(id) {
// //     try {
// //         const docRef = doc(db, "dishes", id);
// //         const docSnap = await getDoc(docRef);

// //         if (docSnap.exists()) {
// //             const data = docSnap.data();
// //             document.getElementById('modal-dish-image').src = data.image;
// //             document.getElementById('modal-dish-name').textContent = data.name;
// //             document.getElementById('modal-dish-price').textContent = `${data.price}`;
// //             document.getElementById('modal-dish-serving').textContent = `Serves: ${data.serving}`;
// //             document.getElementById('modal-dish-description').textContent = `Description: ${data.description || 'No description available'}`;

// //             const buyNowButton = document.getElementById('buyNowButton');
// //             buyNowButton.addEventListener('click', () => {
// //                 const qty = 1; 
// //                 addToCart(id, data.image, data.name, data.price, data.serving, qty);
// //                 $('#dishModal').modal('hide');
// //                 updateModal();
// //             });

// //             $('#dishModal').modal('show');
// //         } else {
// //             console.log("No such dish!");
// //         }
// //     } catch (error) {
// //         console.error("Error fetching dish details:", error);
// //     }
// }

// async function showDishModal(id) {
//     try {
//         const docRef = doc(db, "dishes", id);
//         const docSnap = await getDoc(docRef);

//         if (docSnap.exists()) {
//             const data = docSnap.data();
//             document.getElementById('modal-dish-image').src = data.image;
//             document.getElementById('modal-dish-name').textContent = data.name;
//             document.getElementById('modal-dish-price').textContent = `${data.price}`;
//             document.getElementById('modal-dish-serving').textContent = `Serves: ${data.serving}`;
//             document.getElementById('modal-dish-description').textContent = `Description: ${data.description || 'No description available'}`;

//             const buyNowButton = document.getElementById('buyNowButton');

//             // Remove previous event listener (if any) to prevent duplication
//             const newButton = buyNowButton.cloneNode(true);
//             buyNowButton.replaceWith(newButton);

//             newButton.addEventListener('click', () => {
//                 const qty = 1; 
//                 addToCart(id, data.image, data.name, data.price, data.serving, qty);
//                 $('#dishModal').modal('hide');
//                 updateModal();
//             });

//             $('#dishModal').modal('show');
//         } else {
//             console.log("No such dish!");
//         }
//     } catch (error) {
//         console.error("Error fetching dish details:", error);
//     }
// }


async function showDishModal(id) {
    try {
        const docRef = doc(db, "dishes", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const modalDishImage = document.getElementById('modal-dish-image');
            const modalDishDescription = document.getElementById('modal-dish-description');
            const readMoreButton = document.getElementById('readMoreButton');

            document.getElementById('modal-dish-image').src = data.image;
            document.getElementById('modal-dish-name').textContent = data.name;
            document.getElementById('modal-dish-price').textContent = `${data.price}`;
            document.getElementById('modal-dish-serving').textContent = `Serves: ${data.serving}`;
            
            // Set the full description, but initially show a limited portion
            const fullDescription = data.description || 'No description available';
            const maxDescriptionLength = 100; // Adjust the length as needed

            if (fullDescription.length > maxDescriptionLength) {
                modalDishDescription.textContent = fullDescription.substring(0, maxDescriptionLength) + '...';
                readMoreButton.style.display = 'inline'; // Show the "Read More" button
            } else {
                modalDishDescription.textContent = fullDescription;
                readMoreButton.style.display = 'none'; // Hide the "Read More" button if not needed
            }

            // Read More / See Less toggle functionality
            readMoreButton.textContent = 'Read More';
            readMoreButton.onclick = function () {
                if (readMoreButton.textContent === 'Read More') {
                    modalDishDescription.textContent = fullDescription; // Show the full description
                    modalDishImage.style.width = '500px'; // Increase image size
                    readMoreButton.textContent = 'See Less';
                } else {
                    modalDishDescription.textContent = fullDescription.substring(0, maxDescriptionLength) + '...'; // Show truncated description
                    modalDishImage.style.width = '300px'; // Reset image size
                    readMoreButton.textContent = 'Read More';
                }
            };

            const buyNowButton = document.getElementById('buyNowButton');

            // Remove previous event listener (if any) to prevent duplication
            const newButton = buyNowButton.cloneNode(true);
            buyNowButton.replaceWith(newButton);

            newButton.addEventListener('click', () => {
                const qty = 1; 
                addToCart(id, data.image, data.name, data.price, data.serving, qty);
                $('#dishModal').modal('hide');
                updateModal();
            });

            $('#dishModal').modal('show');
        } else {
            console.log("No such dish!");
        }
    } catch (error) {
        console.error("Error fetching dish details:", error);
    }
}


// Add functions to the global scope for use in HTML attributes
window.updateQty = updateQty;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateModal = updateModal;
window.showDishModal = showDishModal;

// Function to update dashboard statistics
const updateDashboardStats = async () => {
    try {
        const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
        const totalRestaurants = restaurantSnapshot.size;
        
        const dishSnapshot = await getDocs(collection(db, "dishes"));
        const totalDishes = dishSnapshot.size;

        const pendingOrdersSnapshot = await getDocs(collection(db, "orders"));
        const totalPendingOrders = pendingOrdersSnapshot.docs.filter(doc => doc.data().status === "pending").length;

        const deliveredOrdersSnapshot = await getDocs(collection(db, "orders"));
        const totalDeliveredOrders = deliveredOrdersSnapshot.docs.filter(doc => doc.data().status === "delivered").length;

        const usersSnapshot = await getDocs(collection(db, "users"));
        const totalUsers = usersSnapshot.size;

        document.getElementById('total-restaurants').textContent = totalRestaurants;
        document.getElementById('total-dishes').textContent = totalDishes;
        document.getElementById('total-orders-pending').textContent = totalPendingOrders;
        document.getElementById('total-orders-delivered').textContent = totalDeliveredOrders;
        document.getElementById('total-users').textContent = totalUsers;

    } catch (error) {
        console.error("Error updating dashboard statistics:", error);
    }
}


// Call the function to update dashboard statistics and load the cart from local storage when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    loadCartFromLocalStorage();
});

let checkoutButton = document.getElementById('checkoutBtn')
checkoutButton.addEventListener('click', () => {
    location.href = "./dishes.html";
});




// Function to update the cart count badge
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.qty, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

// Call the function to load the cart from local storage and update the cart count when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDashboardStats();
    loadCartFromLocalStorage();
    updateCartCount();  // Ensure the count is correct on page load
});

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in");

        // Clear the current cart and load the cart for the new logged-in user
        cart = [];
        loadCartFromLocalStorage(user.uid);  // Load cart for this user
        showDishes();  // Display dishes after the user is confirmed to be logged in
    } else {
        console.log("User not logged in");

        // Clear the cart and save an empty cart in local storage
        cart = [];  
        saveCartToLocalStorage();  // Save empty cart
        location.href = "index.html"; // Redirect to login page
    }
});

function saveCartToLocalStorage(uid) {
    if (uid) {
        localStorage.setItem(`cart-${uid}`, JSON.stringify(cart));
    }
}

function loadCartFromLocalStorage(uid) {
    if (uid) {
        const savedCart = localStorage.getItem(`cart-${uid}`);
        if (savedCart) {
            cart = JSON.parse(savedCart);
        } else {
            cart = [];
        }
        updateModal();
        updateCartCount();
    }
}

// Function to add items to the cart
function addToCart(id, image, name, price, serving, qty = 1) {
    // Check if the item is already in the cart
    const existingItem = cart.find(item => item.id === id);
    
    if (existingItem) {
        existingItem.qty += qty;
        // Do nothing to the quantity if the item already exists
        console.log(`${name} is already in the cart with quantity ${existingItem.qty}`);
    } else {
        // Add the new item to the cart
        cart.push({ id, image, name, price, serving, qty });
        console.log(`Added ${name} to the cart with quantity ${qty}`);
    }

    // Save the cart to local storage using the current user's UID
    const user = auth.currentUser;
    if (user) {
        saveCartToLocalStorage(user.uid);  // Save the cart for this user's UID
    }

    // Update the modal and cart count
    updateModal();
    updateCartCount();
}


// Function to remove an item from the cart
function removeFromCart(id) {
    // Filter out the item from the cart
    cart = cart.filter(item => item.id !== id);

    // Save the updated cart to local storage using the current user's UID
    const user = auth.currentUser;
    if (user) {
        saveCartToLocalStorage(user.uid);  // Save the updated cart for this user's UID
    }

    // Update the modal and cart count
    updateModal();
    updateCartCount();
}


function updateQty(operation, id) {
    const qtyElement = document.getElementById(`qty-${id}`);
    let currentQty = parseInt(qtyElement.textContent);

    if (operation === '+') {
        currentQty += 1;
    } else if (operation === '-' && currentQty > 1) {
        currentQty -= 1;
    }

    qtyElement.textContent = currentQty;

    const item = cart.find(item => item.id === id);
    if (item) {
        item.qty = currentQty;
    }

    const user = auth.currentUser;
    if (user) {
        saveCartToLocalStorage(user.uid);
    }

    updateModal();
}

function updateModal() {
    const modalBody = document.getElementById('getvalue');
    const totalAmountElement = document.getElementById('totalAmount');
    let totalAmount = 0;

    modalBody.innerHTML = ''; 

    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalAmount += itemTotal;

        modalBody.innerHTML += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <img width="200" class="img-fluid rounded-start" src="${item.image}" alt="${item.name}" />
                        </div>
                        <div class="p-2">
                            <h5 class="card-title">${item.name}</h5>
                            <h6 class="card-title">Rs: ${item.price} /-</h6>
                            <p class="card-text">Serves ${item.serving}</p>
                            <p class="card-text d-flex align-items-center">
                                Quantity:
                            <div class="d-flex align-items-center m-2"> 
                                <button class="qty-btn btn btn-sm btn-outline-secondary" onclick="updateQty('-', '${item.id}')">
                                    <i class="fa-solid fa-minus"></i>
                                </button>
                                <span class="fw-bold m-2" id="qty-${item.id}">${item.qty}</span>
                                <button class="qty-btn btn btn-sm btn-outline-secondary" onclick="updateQty('+', '${item.id}')">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                            </p>
                            <p class="card-text">Total: Rs: ${itemTotal} /-</p>
                            <a onclick='removeFromCart("${item.id}")' class='btn btn-danger btn-sm ms-2'>Delete</a>
                        </div>
                    </div>
                </div>
            </div>`;
    });

    totalAmountElement.textContent = `Total: PKR ${totalAmount.toFixed(2)}`;
}
