// Import Firebase functions (adjust import paths as needed)
import {
  auth,
  collection,
  getDocs,
  db,
  where,
  query,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

const urlParams = new URLSearchParams(window.location.search);
const pageSpinner = document.getElementById("page-spinner");
const mainContent = document.getElementById("main-content");
const cartElement = document.getElementById("cart");
const deliveryChargesElement = document.getElementById("deliveryCharges");
const totalAmountElement = document.getElementById("totalAmount");

let deliveryCharges = 0; // Initialize delivery charges
let cart = JSON.parse(localStorage.getItem("cart")) || []; // Initialize cart from localStorage
let dishes = []; // Initialize dishes array

// Ensure cart is an array
if (!Array.isArray(cart)) {
  cart = [];
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Fetch restaurant details and display them
const getRestaurantDetail = async () => {
  try {
    const docRef = doc(db, "restaurants", urlParams.get("restaurant"));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      document.getElementById("res-name").innerHTML = docSnap.data().name;
      document.getElementById("res-address").innerHTML = docSnap.data().address;
      document.getElementById("res-image").src = docSnap.data().image;

      await getAllDishesAsBadges(docRef.id);

    } else {
      console.error("No such document!");
    }
  } catch (error) {
    console.error("Error fetching restaurant details:", error);
  }
};

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


// Function to fetch and display dishes as badges
const getAllDishesAsBadges = async (restaurantId) => {
try {
const badgesContainer = document.getElementById('badges-container');
const q = query(
  collection(db, "dishes"),
  where("restaurant", "==", restaurantId)
);
const querySnapshot = await getDocs(q);

// Clear existing badges
badgesContainer.innerHTML = '';

querySnapshot.forEach((doc) => {
  const data = doc.data();
  const badge = document.createElement('span');
  badge.className = 'badge rounded-pill text-bg-primary';
  badge.innerText = data.name;
  badgesContainer.appendChild(badge);
  badge.style.margin = "0px 10px"
  badge.style.padding = "7px 14px"


});

if (querySnapshot.empty) {
  badgesContainer.innerHTML = '<p>No dishes found for this restaurant.</p>';
}
} catch (error) {
console.error("Error fetching dishes as badges:", error);
}
};


const getAllDishes = async (searchTerm = '') => {
  try {
    const showDiv = document.getElementById('all-dishes');
    const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantMap = {};
    restaurantSnapshot.forEach((doc) => {
      const data = doc.data();
      restaurantMap[doc.id] = {
        name: data.name,
        image: data.image || 'default-image-url.jpg' // Set a default image if restaurant doesn't have one
      };
    });

    const q = query(
      collection(db, "dishes"),
      where("restaurant", "==", urlParams.get("restaurant"))
    );
    const querySnapshot = await getDocs(q);

    mainContent.style.display = "block";
    showDiv.innerHTML = '';

    let dishesFound = false;
    dishes = []; // Reset dishes array

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === '') {
        dishesFound = true;

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

        const restaurantData = restaurantMap[data.restaurant] || { name: 'Unknown Restaurant', image: 'default-image-url.jpg' };
        const createdAt = data.createdAt?.toDate();
        const relativeTime = createdAt ? getRelativeTime(createdAt) : 'Unknown time';

        dishes.push({ id: doc.id, ...data, restaurantData }); // Include restaurantData in dishes array

        // Render the dish card with the restaurant image in the profile section
        showDiv.innerHTML += `
          <div class="col">
            <div class="card card-custom-margin">
              ${discountText ? `<span class="discount">${discountText}</span>` : ''}
              <div class="post-header">
                <img class="post-profile-img" src="${restaurantData.image}" alt="Profile Image"> <!-- Use restaurant image -->
                <div class="post-info">
                  <h5 class="post-name">Restaurant: ${restaurantData.name}</h5>
                  <p class="post-time">Posted: ${relativeTime}</p>
                </div>
              </div>
              <img id="dish-img" src="${data.image}" class="card-img-top" alt="${data.name}">
              <div class="card-body card-color">
                <h5 class="card-title">Name: ${data.name}</h5>
                <p class="card-text">Restaurant: ${restaurantData.name}</p>
                <p class="card-text">Serving: ${data.serving}</p>
                ${originalPriceHTML}
                <p class="card-text">Created: ${relativeTime}</p>
                <div class="d-flex align-items-center gap-2 w-100 justify-content-between">
                    <a href="#" class="btn btn-primary" onclick="showDishModal('${doc.id}')">Add to cart</a>
                </div>
              </div>
            </div>
          </div>`;
      }
    });

    if (!dishesFound) {
      showDiv.innerHTML = `<p id="item-not-found" class="text-center">Item Not Found</p>`;
    }
  } catch (error) {
    console.error("Error fetching dishes:", error);
  }

  generateRandomDeliveryCharges(); // Generate and display random delivery charges
};

window.showDishModal = async (dishId) => {
  const dishData = dishes.find(dish => dish.id === dishId);
  if (dishData) {
    try {
      const restaurantDoc = await getDoc(doc(db, "restaurants", dishData.restaurant));
      const restaurantData = restaurantDoc.data();

      // Update modal with dish data
      document.getElementById('modal-dish-image').src = dishData.image;
      document.getElementById('modal-dish-name').innerText = dishData.name;
      document.getElementById('modal-dish-restaurant').innerText = `Restaurant: ${restaurantData?.name || 'Unknown Restaurant'}`;
      document.getElementById('modal-dish-serving').innerText = `Serving: ${dishData.serving}`;
      document.getElementById('modal-dish-price').innerText = `Price: Rs ${dishData.price}`;
      document.getElementById('modal-dish-original-price').innerText = dishData.originalPrice ? `Original Price: Rs ${dishData.originalPrice}` : '';
      
      // Display description in the modal
      document.getElementById('modal-dish-description').textContent = `Description: ${dishData.description || 'No description available'}`;

      // Show modal
      const myModal = new bootstrap.Modal(document.getElementById('dishModal'));
      myModal.show();

      document.getElementById('buy-now-btn').onclick = () => {
                addToCart(dishId);
        // Close the current dish detail modal
        const myModal = bootstrap.Modal.getInstance(document.getElementById('dishModal'));
        if (myModal) {
          myModal.hide(); // Close the current modal
        }
      
        // Show the "Add to Cart" modal
        const addToCartModal = new bootstrap.Modal(document.getElementById('AddToCart'));
        addToCartModal.show(); // Open the Add to Cart modal
      
        // Set the dish ID in hidden input field
        document.getElementById('modal-dish-id').value = dishId;
      
        // Optionally update cart display and total amount (if needed)
        getCartItems();
        updateTotalAmount();
      };
      
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
    }
  } else {
    console.error(`Dish with ID ${dishId} not found in dishes array.`);
  }
};



// Update dish quantity in modal
window.updateModalQty = (type) => {
  const qtyElement = document.getElementById('modal-dish-qty');
  let qty = Number(qtyElement.innerText);
  if (type === '+' && qty < 99) { // Set a maximum limit if needed
    qty++;
  } else if (type === '-' && qty > 1) {
    qty--;
  }
  qtyElement.innerText = qty;
};

// Function to save cart to localStorage
function saveCartToLocalStorage() {
  if (Array.isArray(cart)) {
    localStorage.setItem('cart', JSON.stringify(cart));
  } else {
    console.error("Cart is not an array:", cart);
  }
}

// Function to generate random delivery charges
const generateRandomDeliveryCharges = () => {
  deliveryCharges = Math.floor(Math.random() * 2051) + 50;
  deliveryChargesElement.innerText = `Rs ${deliveryCharges} /-`;
  updateTotalAmount();
  localStorage.setItem("deliveryCharges", deliveryCharges); // Save delivery charges to localStorage
};

// Function to update total amount
const updateTotalAmount = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const sum = cartItems.reduce((a, b) => a + Number(b.price) * b.qty, 0);
  totalAmountElement.innerHTML = `Rs ${sum + deliveryCharges} /-`;
};

// Function to get and display cart items
const getCartItems = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  cartElement.innerHTML = "";
  if (cartItems.length > 0) {
    cartItems.forEach((item, index) => {
      cartElement.innerHTML += `
        <div class="card dish-card w-100 mb-3">
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center">
                <img class="dish-cart-image" src="${item.image}" alt="${item.name}" />
                <div class="p-2">
                  <h5 class="card-title">${item.name}</h5>
                  <h3 class="card-title">Rs: ${item.price} /- x ${item.qty} = ${item.price * item.qty}</h3>
                  <p class="card-text">Serves ${item.serving}</p>
                </div>
              </div>
              <a href="#" onclick="deleteCartItem('${index}')" class="btn btn-primary">
                <i class="fa-solid fa-trash"></i>
              </a>
            </div>
          </div>
        </div>`;
    });
  } else {
    cartElement.innerHTML = "<p>Your cart is empty.</p>";
  }
};

let circularProgress = document.querySelector(".circular-progress"),
          progressValue = document.querySelector(".progress-value");

      let progressStartValue = 0,    
          progressEndValue = 90,    
          speed = 12;
          
      let progress = setInterval(() => {
          progressStartValue++;

          progressValue.textContent = `${progressStartValue}%`
          circularProgress.style.background = `conic-gradient(#7d2ae8 ${progressStartValue * 3.6}deg, #ededed 0deg)`

          if(progressStartValue == progressEndValue){
              clearInterval(progress);
              circularProgress.style.display = "none"
              mainContent.style.display = "block";

          }    
      }, speed);



// Function to update delivery charges based on address
const updateDeliveryCharges = () => {
  const address = document.getElementById("customerAddress").value.trim(); // Get the address input value
  const numChars = address.length; // Count the number of characters

  // Assuming a base charge of Rs 50 and Rs 2 per character
  deliveryCharges = 350 + (numChars * 2);
  
  deliveryChargesElement.innerText = `Rs ${deliveryCharges} /-`;
  updateTotalAmount();
  localStorage.setItem("deliveryCharges", deliveryCharges); // Save delivery charges to localStorage
};

// Event listener for address input field
document.getElementById("customerAddress").addEventListener("input", updateDeliveryCharges);

// Call updateDeliveryCharges on page load to initialize the delivery charges
document.addEventListener("DOMContentLoaded", updateDeliveryCharges);

// Function to update cart count badge
const updateCartCount = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cartItems.reduce((total, item) => total + item.qty, 0); // Calculate total items in the cart

  // Update the cart count in the badge
  const cartCountBadge = document.querySelector('.cart-count');
  cartCountBadge.innerText = totalItems;
};

// Save cart to Firestore for the current user
const saveCartToFirestore = async (userId) => {
  try {
    await setDoc(doc(db, "carts", userId), { cart });
    console.log("Cart saved to Firestore.");
  } catch (error) {
    console.error("Error saving cart to Firestore:", error);
  }
};

// Fetch cart from Firestore for the current user
const fetchCartFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, "carts", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      cart = docSnap.data().cart || [];
      saveCartToLocalStorage(); // Save the cart in local storage as well
      getCartItems();
      updateTotalAmount();
      updateCartCount();
      console.log("Cart fetched from Firestore.");
    } else {
      console.log("No cart found for this user.");
      cart = [];
      saveCartToLocalStorage();
    }
  } catch (error) {
    console.error("Error fetching cart from Firestore:", error);
  }
};

window.addToCart = (dishId) => {
  const qty = Number(document.getElementById('modal-dish-qty').innerText);
  const dishData = dishes.find(dish => dish.id === dishId);
  const userId = auth.currentUser?.uid; // Get current logged-in user's ID
  if (dishData && userId) {
    const existingItemIndex = cart.findIndex(item => item.id === dishId);
    if (existingItemIndex !== -1) {
      cart[existingItemIndex].qty += qty;
    } else {
      cart.push({ ...dishData, qty });
    }
    saveCartToLocalStorage();
    saveCartToFirestore(userId); // Save cart to Firestore
    getCartItems();
    updateTotalAmount();
    updateCartCount(); // Update cart count after adding items
  } else {
    console.error(`Dish with ID ${dishId} not found in dishes array.`);
  }
};


// // Call this function wherever cart is modified, e.g., when adding or deleting items.
// window.addToCart = (dishId) => {
//   const qty = Number(document.getElementById('modal-dish-qty').innerText);
//   const dishData = dishes.find(dish => dish.id === dishId);
//   if (dishData) {
//     const existingItemIndex = cart.findIndex(item => item.id === dishId);
//     if (existingItemIndex !== -1) {
//       cart[existingItemIndex].qty += qty;
//     } else {
//       cart.push({ ...dishData, qty });
//     }
//     saveCartToLocalStorage();
//     getCartItems();
//     updateTotalAmount();
//     updateCartCount(); // Update cart count after adding items
//   } else {
//     console.error(`Dish with ID ${dishId} not found in dishes array.`);
//   }
// };


window.deleteCartItem = (index) => {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  if (index > -1 && index < cartItems.length) {
    cartItems.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cartItems));
    cart = cartItems; // Update the cart variable
    getCartItems();
    updateTotalAmount();
    updateCartCount(); // Update cart count after deleting items
  }
};

const clearCartOnLogout = () => {
  cart = [];
  localStorage.removeItem("cart");
  getCartItems();
  updateTotalAmount();
  updateCartCount();
};


// Initialization
const init = () => {
  getRestaurantDetail();
  getAllDishes();
  getCartItems();
  updateCartCount(); // Update cart count on page load
};

// Run initialization
init();

auth.onAuthStateChanged((user) => {
  if (user) {
    // User is logged in, fetch their cart
    fetchCartFromFirestore(user.uid);
  } else {
    // User is logged out, clear cart
    clearCartOnLogout();
  }
});
