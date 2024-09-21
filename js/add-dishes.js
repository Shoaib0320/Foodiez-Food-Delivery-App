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
    getDoc       
} from "./firebase.js";

// Function to upload files to Firebase Storage
let uploadFile = (file, name) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `dishes/${name.split(" ").join("-")}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            },
            (error) => {
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    console.log('File available at', downloadURL);
                    resolve(downloadURL);
                });
            }
        );
    });
}

// Function to get all restaurants and populate the dropdown
const populateRestaurantDropdown = async (selectElementId) => {
    try {
        const q = collection(db, "restaurants");
        const querySnapshot = await getDocs(q);
        const resSelect = document.getElementById(selectElementId);
        let restaurants = [];
        resSelect.innerHTML = `<option selected disabled>Select restaurant</option>`;
        
        querySnapshot.forEach((doc) => {
            restaurants.push({ ...doc.data(), id: doc.id });
            resSelect.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
        });
        
        return new Promise((resolve) => {
            resolve(restaurants);
        });
    } catch (err) {
        console.log("Error getting restaurants:", err);
    }
}

// / Function to get all restaurants and populate the dropdown
const getAllRestaurants = async () => {
    try {
        const q = collection(db, "restaurants");
        const querySnapshot = await getDocs(q);
        const resSelect = document.getElementById("restaurant-name");
        let index = 0;
        let restaurants = [];
        resSelect.innerHTML = `<option selected disabled>Select restaurant</option>`;
        
        querySnapshot.forEach((doc) => {
            restaurants.push({ ...doc.data(), id: doc.id });
            index++;
            resSelect.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
        });
        
        return new Promise((resolve) => {
            resolve(restaurants);
        });
    } catch (err) {
        console.log("Error getting restaurants:", err);
    }
}


// Function to fetch all restaurants and return a map of ID to restaurant details (name and image)
const getRestaurantMap = async () => {
    const restaurantSnapshot = await getDocs(collection(db, "restaurants"));
    const restaurantMap = {};
    restaurantSnapshot.forEach((doc) => {
        const data = doc.data();
        restaurantMap[doc.id] = { name: data.name, image: data.image }; // Map restaurant ID to its name and image
    });
    return restaurantMap;
};


// Function to handle deleting a dish
const handleDelete = async (event) => {
    const id = event.target.getAttribute('data-id');
    if (confirm("Are you sure you want to delete this dish?")) {
        await deleteDoc(doc(db, "dishes", id));
        getAllDishes(); // Refresh the list
    }
}

// Handle form submission for adding a dish
const addDish = document.getElementById("add-Dish");
if (addDish) {
    addDish.addEventListener('click', async () => {
        const name = document.getElementById("dish-name").value;
        const spinner = document.getElementById("dish-spinner");
        const price = document.getElementById("dish-price").value;
        const serving = document.getElementById("dish-serving").value;
        const restaurant = document.getElementById("restaurant-name").value;
        const description = document.getElementById("dish-description").value; // Get description
        const imageFile = document.getElementById("dish-image").files[0];
        let imageUrl = '';

        spinner.style.display = "flex";

        if (imageFile) {
            imageUrl = await uploadFile(imageFile, name);
        }

        // Calculate discount percentage
        const originalPrice = parseFloat(document.getElementById("dish-original-price").value);
        const priceValue = parseFloat(document.getElementById("dish-price").value);
        const discountPercentage = originalPrice ? ((originalPrice - priceValue) / originalPrice) * 100 : 0;

        // Get the current timestamp
        const createdAt = new Date();

        const dishDetail = {
            name,
            price,
            serving,
            restaurant,
            description, // Add description here
            image: imageUrl,
            discount: discountPercentage.toFixed(2), // Store discount percentage with 2 decimal places
            createdAt: createdAt // Add the timestamp here
        };

        // Store the dish data along with the timestamp in Firebase
        const docRef = await addDoc(collection(db, "dishes"), dishDetail);
        console.log("Dish Added with ID: ", docRef.id);
        spinner.style.display = "none";

        // Close the modal and refresh the dish list
        document.getElementById('close-btn').click();
        getAllDishes(); // Refresh the list
    });
}

const getAllDishes = async () => {
    const allDishesContainer = document.getElementById("all-dishes");
    if (allDishesContainer) {
        const q = collection(db, "dishes");
        const querySnapshot = await getDocs(q);
        
        // Fetch all restaurants and create a map of restaurant ID to details
        const restaurantMap = await getRestaurantMap();
        
        allDishesContainer.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Check if there's a valid discount (greater than 0)
            let discountText = '';
            if (data.discount && data.price && data.discount > 0) {
                discountText = `${data.discount}% OFF`;
            }

            // Check for original price and discounted price
            let priceHTML = '';
            if (data.originalPrice) {
                priceHTML = data.price ? 
                    `<p class="price">Rs. ${data.price} <span>Rs. ${data.originalPrice}</span></p>` :
                    `<p class="price">Rs. ${data.originalPrice}</p>`;
            } else if (data.price) {
                priceHTML = `<p class="price">Rs. ${data.price}</p>`;
            }

            // Get the restaurant details (name and image) from the map
            const restaurantDetails = restaurantMap[data.restaurant] || { name: 'Unknown Restaurant', image: 'default-image-url' };

            // Description logic
            const maxLength = 100; // Limit description to 100 characters
            let fullDescription = data.description || 'No description available';
            let shortDescription = fullDescription.length > maxLength ? fullDescription.slice(0, maxLength) + '...' : fullDescription;
            
            allDishesContainer.innerHTML += `
                <div class="col-lg-4 col-md-4 col-sm-6 col-12">
                    <div class="card card-custom-margin">
                        ${discountText ? `<span class="discount">${discountText}</span>` : ''}
                        <div class="post-header">
                            <img class="post-profile-img" src="${restaurantDetails.image}" alt="Restaurant Image">
                            <div class="post-info">
                                <h5 class="post-name">Restaurant: ${restaurantDetails.name}</h5>
                                <p class="post-time">Posted: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}</p>
                            </div>
                        </div>
                        <img id="dish-img" src="${data.image}" class="card-img-top" alt="${data.name}">
                        <div class="card-body card-color text-center">
                            <h5 class="card-title">Name: ${data.name}</h5>
                            <p class="card-text">Serving: ${data.serving}</p>
                            <p class="card-text"><strong>Description:</strong> 
                                <span class="short-description">${shortDescription}</span>
                                <span class="full-description d-none">${fullDescription}</span>
                                ${fullDescription.length > maxLength ? `<button class="btn btn-link read-more-btn">Read more</button>` : ''}
                            </p>
                            <p class="card-text"><strong>Restaurant:</strong> ${restaurantDetails.name}</p>
                            ${priceHTML}
                            ${data.createdAt ? `<p class="card-text"><strong>Created At:</strong> ${new Date(data.createdAt.seconds * 1000).toLocaleString()}</p>` : ''}
                            <button type="button" class="btn btn-info btn-sm edit-btn" data-id="${doc.id}" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${doc.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Add event listeners for the "Read more" buttons
        document.querySelectorAll('.read-more-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                const cardBody = event.target.closest('.card-body');
                const shortDesc = cardBody.querySelector('.short-description');
                const fullDesc = cardBody.querySelector('.full-description');

                if (fullDesc.classList.contains('d-none')) {
                    // Show full description
                    fullDesc.classList.remove('d-none');
                    shortDesc.classList.add('d-none');
                    event.target.textContent = 'See less';
                } else {
                    // Show short description
                    fullDesc.classList.add('d-none');
                    shortDesc.classList.remove('d-none');
                    event.target.textContent = 'Read more';
                }
            });
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    }
};


const handleEdit = async (event) => {
    const id = event.target.getAttribute('data-id');
    const docRef = doc(db, "dishes", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();

        // Populate the modal fields with the data
        document.getElementById("edit-dish-name").value = data.name;
        document.getElementById("edit-dish-price").value = data.price;
        document.getElementById("edit-dish-serving").value = data.serving;
        document.getElementById("edit-dish-description").value = data.description; // Set description

        const originalPriceInput = document.getElementById("edit-dish-original-price");
        const originalPriceContainer = document.getElementById("original-price-container");
        const priceInput = document.getElementById("edit-dish-price");

        if (data.originalPrice) {
            originalPriceInput.value = data.originalPrice;
            originalPriceContainer.style.display = "block"; // Show the original price input
        } else {
            originalPriceInput.value = ''; 
            originalPriceContainer.style.display = "none"; // Hide the original price input
        }

        if (data.price) {
            priceInput.value = data.price;
        } else {
            priceInput.value = ''; 
        }

        // Update image preview
        const imagePreview = document.getElementById("edit-selected-logo");
        if (imagePreview) {
            imagePreview.src = data.image; // Update the image preview src
            imagePreview.style.display = 'block'; // Ensure the image is visible
        }

        // Populate restaurant dropdown
        const restaurantSelect = document.getElementById("edit-restaurant-name");
        if (restaurantSelect) {
            await populateRestaurantDropdown('edit-restaurant-name');
            restaurantSelect.value = data.restaurant; // Preselect the restaurant
        }

        // Store the ID in a hidden input
        document.getElementById("dish-id").value = id;

        // Show the edit modal
        const editDishModal = new bootstrap.Modal(document.getElementById('exampleModal'));
        editDishModal.show();
    } else {
        console.log("No such document!");
    }
};

// Handle form submission for updating a dish
const updateDish = document.getElementById("update-dish");
if (updateDish) {
    updateDish.addEventListener('click', async () => {
        const id = document.getElementById("dish-id").value;
        const name = document.getElementById("edit-dish-name").value;
        const price = document.getElementById("edit-dish-price").value;
        const serving = document.getElementById("edit-dish-serving").value;
        const description = document.getElementById("edit-dish-description").value; // Get description
        const restaurant = document.getElementById("edit-restaurant-name").value;
        const imageFile = document.getElementById("edit-dish-image").files[0];
        let imageUrl = '';

        if (imageFile) {
            imageUrl = await uploadFile(imageFile, name);
        }

        // Calculate discount percentage
        const originalPrice = parseFloat(document.getElementById("edit-dish-original-price").value);
        const priceValue = parseFloat(document.getElementById("edit-dish-price").value);
        const discountPercentage = originalPrice ? ((originalPrice - priceValue) / originalPrice) * 100 : 0;

        const dishDetail = {
            name,
            price,
            serving,
            restaurant,
            description, // Include description in the update
            image: imageUrl || document.getElementById("edit-selected-logo").src, // Keep existing image if not updated
            discount: discountPercentage.toFixed(2) // Store discount percentage with 2 decimal places
        };

        await updateDoc(doc(db, "dishes", id), dishDetail);
        const editDishModal = bootstrap.Modal.getInstance(document.getElementById('exampleModal'));
        editDishModal.hide(); // Hide the modal
        getAllDishes(); // Refresh the list
        location.reload(); // Refresh the page
    });
}



// Function to filter dishes based on search input
const filterDishes = async (searchTerm) => {
    const allDishesContainer = document.getElementById("all-dishes");
    if (allDishesContainer) {
        const q = collection(db, "dishes");
        const querySnapshot = await getDocs(q);

        // Fetch all restaurants and create a map of restaurant ID to details
        const restaurantMap = await getRestaurantMap();

        allDishesContainer.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const data = doc.data();

            // Convert search term and dish properties to lowercase for case-insensitive search
            const searchLower = searchTerm.toLowerCase();
            const dishNameLower = data.name.toLowerCase();
            const dishDescriptionLower = data.description ? data.description.toLowerCase() : ''; // Check if description exists
            const restaurantNameLower = restaurantMap[data.restaurant]?.name.toLowerCase() || '';

            // Check if the search term matches any of the dish properties (name, description, or restaurant)
            if (
                dishNameLower.includes(searchLower) ||
                dishDescriptionLower.includes(searchLower) ||
                restaurantNameLower.includes(searchLower)
            ) {

                let discountText = '';
                    if (data.discount && data.price && data.discount > 0) {
                        discountText = `${data.discount}% OFF`;
                    }

                let priceHTML = '';
                if (data.originalPrice) {
                    priceHTML = data.price ? 
                        `<p class="price">Rs. ${data.price} <span>Rs. ${data.originalPrice}</span></p>` :
                        `<p class="price">Rs. ${data.originalPrice}</p>`;
                } else if (data.price) {
                    priceHTML = `<p class="price">Rs. ${data.price}</p>`;
                }

                // Get the restaurant details (name and image) from the map
                const restaurantDetails = restaurantMap[data.restaurant] || { name: 'Unknown Restaurant', image: 'default-image-url' };

                allDishesContainer.innerHTML += `
                    <div class="col-lg-4 col-md-4 col-sm-6 col-12">
                        <div class="card card-custom-margin">
                            ${discountText ? `<span class="discount">${discountText}</span>` : ''}
                            <div class="post-header">
                                <img class="post-profile-img" src="${restaurantDetails.image}" alt="Restaurant Image">
                                <div class="post-info">
                                    <h5 class="post-name">Restaurant: ${restaurantDetails.name}</h5>
                                    <p class="post-time">Posted: ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}</p>
                                </div>
                            </div>
                            <img id="dish-img" src="${data.image}" class="card-img-top" alt="${data.name}">
                            <div class="card-body card-color text-center">
                                <h5 class="card-title">Name: ${data.name}</h5>
                                <p class="card-text">Serving: ${data.serving}</p>
                                <p class="card-text"><strong>Description:</strong> ${data.description || 'No description available'};</p> <!-- Display description -->
                                <p class="card-text"><strong>Restaurant:</strong> ${restaurantDetails.name}</p>
                                ${priceHTML}
                                ${data.createdAt ? `<p class="card-text"><strong>Created At:</strong> ${new Date(data.createdAt.seconds * 1000).toLocaleString()}</p>` : ''}
                                <button type="button" class="btn btn-info btn-sm edit-btn" data-id="${doc.id}" data-bs-toggle="modal" data-bs-target="#exampleModal">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button class="btn btn-danger btn-sm delete-btn" data-id="${doc.id}">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    }
};


// Add event listener for the search input field to detect changes in real-time
const searchInputField = document.getElementById("searchInput");
if (searchInputField) {
    searchInputField.addEventListener('input', () => {
        const searchInput = searchInputField.value;
        filterDishes(searchInput); // Call the filter function on each input change
    });
}

// Get all dishes and restaurants when the page loads
window.onload = async () => {
    await getAllRestaurants();
    await getAllDishes();
}


let updateDishCloseBtn = document.getElementById("update-dish-close-btn")
updateDishCloseBtn.addEventListener('click',()=>{
    window.location.reload()
})