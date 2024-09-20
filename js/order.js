// // import {
// //   storage,
// //   ref,
// //   uploadBytesResumable,
// //   getDownloadURL,
// //   db,
// //   collection,
// //   addDoc,
// //   getDocs,
// //   serverTimestamp,
// //   doc,
// //   getDoc,
// //   updateDoc,
// //   deleteDoc
// // } from "./firebase.js";

// // console.log("Script Loaded");

// // document.addEventListener("DOMContentLoaded", () => {
// //   const placeOrder = document.getElementById("placeOrder");
  
// //   if (placeOrder) {
// //     placeOrder.addEventListener("click", async () => {
// //       console.log("Place Order Clicked");
      
// //       const cartDiv = document.getElementById("cart");
// //       const customerName = document.getElementById("customerName");
// //       const customerContact = document.getElementById("customerContact");
// //       const customerAddress = document.getElementById("customerAddress");
// //       const cart = JSON.parse(localStorage.getItem("cart")) || [];
// //       const deliveryCharges = Number(localStorage.getItem("deliveryCharges")) || 0;
// //       const sum = cart.reduce((a, b) => a + Number(b.price) * b.qty, 0);
// //       const totalAmount = sum + deliveryCharges;
// //       const closeBtn = document.getElementById("closeBtn");

// //       const orderDetails = {
// //         customerName: customerName.value,
// //         customerContact: customerContact.value,
// //         customerAddress: customerAddress.value,
// //         status: "pending",
// //         cart,
// //         timestamp: serverTimestamp(),
// //         orderAmount: sum,
// //         deliveryCharges: deliveryCharges,
// //         totalAmount: totalAmount,
// //       };

// //       try {
// //         await addDoc(collection(db, "orders"), orderDetails);
// //         Swal.fire({
// //           position: "center-center",
// //           icon: "success",
// //           title: "Your order has been placed",
// //           showConfirmButton: false,
// //           timer: 1500,
// //         });

// //         // Clear the form and localStorage
// //         customerName.value = "";
// //         customerContact.value = "";
// //         customerAddress.value = "";
// //         localStorage.removeItem("cart");
// //         localStorage.removeItem("deliveryCharges");

// //         // Clear UI elements
// //         cartDiv.innerHTML = "";
// //         document.getElementById("totalAmount").innerHTML = "";
// //         closeBtn && closeBtn.click();
// //       } catch (error) {
// //         console.error("Error placing order:", error);
// //       }
// //     });
// //   }

// //   const getAllOrders = async () => {
// //     console.log("Fetching all orders");
// //     const pageSpinner = document.getElementById("page-spinner");
// //     const mainContent = document.getElementById("main-content");
// //     const allOrders = document.getElementById("all-orders"); // Assuming this is a div container for cards
// //     const q = collection(db, "orders");

// //     try {
// //       const querySnapshot = await getDocs(q);
// //       let index = 0;
// //       querySnapshot.forEach((doc) => {
// //         index++;
// //         let status = doc.data().status;
// //         let statusColor = "";
// //         if (status === "pending") {
// //           statusColor = "badge bg-warning";
// //         }
// //         if (status === "delivered") {
// //           statusColor = "badge bg-success";
// //         }
// //         allOrders.innerHTML += `
// //           <div class="col-lg-3 col-md-4 col-sm-6 col-12" id="order-card-${doc.id}">
// //             <div class="card card-custom-margin mb-3">
// //               <div class="card-body">
// //                 <h5 class="card-title">Order #${index}</h5>
// //                 <p class="card-text"><strong>Name:</strong> ${doc.data().customerName}</p>
// //                 <p class="card-text"><strong>Contact:</strong> ${doc.data().customerContact}</p>
// //                 <p class="card-text"><strong>Address:</strong> ${doc.data().customerAddress}</p>
// //                 <p class="card-text"><strong>Status:</strong> <span style="padding: 5px 10px !important;" class="${statusColor}">${status}</span></p>
// //                 <p class="card-text"><strong>Total Amount:</strong> Rs. ${doc.data().totalAmount}</p>
// //                 <p class="card-text"><strong>Delivery Charges:</strong> Rs. ${doc.data().deliveryCharges}</p>
// //                 <div class="d-flex align-items-center justify-content-between">
// //                   <button onclick="viewOrderDetail('${doc.id}')" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
// //                       View details
// //                   </button>
// //                   <button onclick="deleteOrder('${doc.id}')" class="btn btn-danger">Delete</button>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>`;
// //       });
// //     } catch (error) {
// //       console.error("Error fetching orders:", error);
// //     }

// //     pageSpinner.style.display = "none";
// //     mainContent.style.display = "block";
// //   };

// //   // Call getAllOrders when needed to display all orders
// //   getAllOrders();
// // });


// // let updateOrderId;

// // const viewOrderDetail = async (id) => {
// //   updateOrderId = id;
// //   const cart = document.getElementById("cart");
// //   const orderStatus = document.getElementById("orderStatus");
// //   const docRef = doc(db, "orders", id);
// //   const docSnap = await getDoc(docRef);
// //   const cartItems = docSnap.data().cart;
// //   const deliveryCharges = docSnap.data().deliveryCharges || 100; // Default delivery charge
// //   const totalOrderAmount = docSnap.data().totalAmount;

// //   orderStatus.value = docSnap.data().status;
// //   cart.innerHTML = "";

// //   let itemsTotal = 0;
// //   for (var i = 0; i < cartItems.length; i++) {
// //     const itemTotal = cartItems[i].price * cartItems[i].qty;
// //     const totalAmountModal = document.getElementById('totalAmountModal')
// //     totalAmountModal.innerHTML = `
// //                 <div class="d-flex justify-content-between m-2">
// //                         <h5 class="fw-bold">Delivery charges:</h5>
// //                         <h5 class="fw-bold" id="deliveryCharges">Rs: ${deliveryCharges} /-</h5>
// //                     </div>
// //                     <div class="d-flex justify-content-between m-2">
// //                         <h5 class="fw-bold">Total amount:</h5>
// //                         <h5 class="fw-bold" id="totalAmount">Rs: ${totalOrderAmount} /-</h5>
// //                     </div>`
// //     itemsTotal += itemTotal;
    
// //     cart.innerHTML += `
// //       <div class="card dish-card w-100 mb-3">
// //         <div class="card-body">
// //           <div class="d-flex align-items-center justify-content-between">
// //             <div class="d-flex align-items-center">
// //               <img class="dish-image order-img" src="${cartItems[i].image}" />
// //               <div class="p-2">
// //                 <h5 class="card-title">${cartItems[i].name}</h5>
// //                 <h3 class="card-title">Rs: ${cartItems[i].price} /- x ${cartItems[i].qty} = Rs. ${itemTotal}</h3>
// //                 <p class="card-text">Serves ${cartItems[i].serving}</p>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     `;
// //   }

// // };

// // const updateOrder = document.getElementById("updateOrder");

// // updateOrder.addEventListener("click", async () => {
// //   const closeBtn = document.getElementById("close-btn");
// //   const orderStatus = document.getElementById("orderStatus");
// //   const docRef = doc(db, "orders", updateOrderId);
// //   await updateDoc(docRef, {
// //     status: orderStatus.value,
// //   });

// //   const orderCard = document.getElementById(`order-card-${updateOrderId}`);
// //   const statusBadge = orderCard.querySelector("span.badge");
// //   statusBadge.textContent = orderStatus.value;
  
// //   if (orderStatus.value === "pending") {
// //     statusBadge.className = "badge bg-warning";
// //   } else if (orderStatus.value === "delivered") {
// //     statusBadge.className = "badge bg-success";
// //   }

// //   closeBtn.click();
// // });

// // const deleteOrder = async (id) => {
// //   if (confirm("Are you sure you want to delete this order?")) {
// //     try {
// //       await deleteDoc(doc(db, "orders", id));
// //       const orderCard = document.getElementById(`order-card-${id}`);
// //       orderCard.remove();
// //       console.log("Order deleted successfully");
// //       updateOrderIndexes(); // Update order indexes after deletion
// //     } catch (error) {
// //       console.error("Error deleting order:", error);
// //     }
// //   }
// // };

// // // Function to update the order indexes after a deletion
// // const updateOrderIndexes = () => {
// //   const allOrders = document.querySelectorAll('[id^="order-card-"]');
// //   allOrders.forEach((orderCard, index) => {
// //     const cardTitle = orderCard.querySelector('.card-title');
// //     cardTitle.textContent = `Order #${index + 1}`;
// //   });
// // };

// // window.viewOrderDetail = viewOrderDetail;
// // window.deleteOrder = deleteOrder;


// // const updateDashboardStats = async () => {
// //   try {

// //       const pendingOrdersSnapshot = await getDocs(collection(db, "orders"));
// //       const totalPendingOrders = pendingOrdersSnapshot.docs.filter(doc => doc.data().status === "pending").length;

// //       const deliveredOrdersSnapshot = await getDocs(collection(db, "orders"));
// //       const totalDeliveredOrders = deliveredOrdersSnapshot.docs.filter(doc => doc.data().status === "delivered").length;

// //       const usersSnapshot = await getDocs(collection(db, "users"));
// //       const totalUsers = usersSnapshot.size;

// //       document.getElementById('total-orders-pending').textContent = totalPendingOrders;
// //       document.getElementById('total-orders-delivered').textContent = totalDeliveredOrders;
// //       document.getElementById('total-users').textContent = totalUsers;

// //   } catch (error) {
// //       console.error("Error updating dashboard statistics:", error);
// //   }
// // }


// // // Call the function to update dashboard statistics and load the cart from local storage when the page loads
// // document.addEventListener('DOMContentLoaded', () => {
// //   updateDashboardStats();
// // });






import {
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  db,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "./firebase.js";

console.log("Script Loaded");

document.addEventListener("DOMContentLoaded", () => {
  const placeOrder = document.getElementById("placeOrder");
  
  if (placeOrder) {
    placeOrder.addEventListener("click", async () => {
      console.log("Place Order Clicked");
      
      const cartDiv = document.getElementById("cart");
      const customerName = document.getElementById("customerName");
      const customerContact = document.getElementById("customerContact");
      const customerAddress = document.getElementById("customerAddress");
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      const deliveryCharges = Number(localStorage.getItem("deliveryCharges")) || 0;
      const sum = cart.reduce((a, b) => a + Number(b.price) * b.qty, 0);
      const totalAmount = sum + deliveryCharges;
      const closeBtn = document.getElementById("closeBtn");

      const orderDetails = {
        customerName: customerName.value,
        customerContact: customerContact.value,
        customerAddress: customerAddress.value,
        status: "pending",
        cart,
        timestamp: serverTimestamp(),
        orderAmount: sum,
        deliveryCharges: deliveryCharges,
        totalAmount: totalAmount,
      };

      try {
        await addDoc(collection(db, "orders"), orderDetails);
        Swal.fire({
          position: "center-center",
          icon: "success",
          title: "Your order has been placed",
          showConfirmButton: false,
          timer: 1500,
        });

        // Clear the form and localStorage
        customerName.value = "";
        customerContact.value = "";
        customerAddress.value = "";
        localStorage.removeItem("cart");
        localStorage.removeItem("deliveryCharges");

        // Clear UI elements
        cartDiv.innerHTML = "";
        document.getElementById("totalAmount").innerHTML = "";
        closeBtn && closeBtn.click();
      } catch (error) {
        console.error("Error placing order:", error);
      }
    });
  }

  // Function to truncate the address
  const truncateAddress = (address, length = 10) => {
    if (address.length <= length) return address;
    return `${address.substring(0, length)}...`;
  };

const getAllOrders = async () => {
  console.log("Fetching all orders");
  const pageSpinner = document.getElementById("page-spinner");
  const mainContent = document.getElementById("main-content");
  const allOrders = document.getElementById("all-orders");

  const q = collection(db, "orders");

  try {
    const querySnapshot = await getDocs(q);
    let index = 0;

    querySnapshot.forEach((doc) => {
      index++;
      const orderData = doc.data();
      const status = orderData.status;
      const statusColor = status === "pending" ? "badge bg-warning" : "badge bg-success";
      const fullAddress = orderData.customerAddress;
      const truncatedAddress = truncateAddress(fullAddress);

      // Create the card content dynamically
      allOrders.innerHTML += `
        <div class="col-lg-3 col-md-4 col-sm-6 col-12" id="order-card-${doc.id}">
          <div class="card card-custom-margin mb-3">
            <div class="card-body">
              <h5 class="card-title">Order #${index}</h5>
              <p class="card-text"><strong>Name:</strong> ${orderData.customerName}</p>
              <p class="card-text"><strong>Contact:</strong> ${orderData.customerContact}</p>
              <p class="card-text"><strong>Address:</strong> <span id="address-${doc.id}">${truncatedAddress}</span>
                ${fullAddress.length > 10 ? `<span id="more-${doc.id}" class="text-primary"><i class="fa fa-chevron-down"></i></span>` : ""}
                <span id="close-${doc.id}" class="text-primary" style="display:none;"><i class="fa fa-times"></i></span>
              </p>
              <p class="card-text"><strong>Status:</strong> <span style="padding: 5px 10px;" class="${statusColor}">${status}</span></p>
              <p class="card-text"><strong>Total Amount:</strong> Rs. ${orderData.totalAmount}</p>
              <p class="card-text"><strong>Delivery Charges:</strong> Rs. ${orderData.deliveryCharges}</p>
              <div class="d-flex align-items-center justify-content-between">
                <button onclick="viewOrderDetail('${doc.id}')" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                  View details
                </button>
                <button onclick="deleteOrder('${doc.id}')" class="btn btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>`;

      // Handle "Read more" and "Show less" functionality
      setTimeout(() => {
        if (fullAddress.length > 10) {
          const moreBtn = document.getElementById(`more-${doc.id}`);
          const closeBtn = document.getElementById(`close-${doc.id}`);
          const addressSpan = document.getElementById(`address-${doc.id}`);

          moreBtn.addEventListener("click", () => {
            addressSpan.textContent = fullAddress;
            moreBtn.style.display = "none";
            closeBtn.style.display = "inline";
          });

          closeBtn.addEventListener("click", () => {
            addressSpan.textContent = truncatedAddress;
            moreBtn.style.display = "inline";
            closeBtn.style.display = "none";
          });
        }
      }, 100); // Adding slight delay to ensure DOM is updated
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  pageSpinner.style.display = "none";
  mainContent.style.display = "block";
};

  // Call getAllOrders when needed to display all orders
  getAllOrders();
});


let updateOrderId;

const viewOrderDetail = async (id) => {
  updateOrderId = id;
  const cart = document.getElementById("cart");
  const orderStatus = document.getElementById("orderStatus");
  const docRef = doc(db, "orders", id);
  const docSnap = await getDoc(docRef);
  const cartItems = docSnap.data().cart;
  const deliveryCharges = docSnap.data().deliveryCharges || 100; // Default delivery charge
  const totalOrderAmount = docSnap.data().totalAmount;

  orderStatus.value = docSnap.data().status;
  cart.innerHTML = "";

  let itemsTotal = 0;
  for (var i = 0; i < cartItems.length; i++) {
    const itemTotal = cartItems[i].price * cartItems[i].qty;
    const totalAmountModal = document.getElementById('totalAmountModal')
    totalAmountModal.innerHTML = `
                <div class="d-flex justify-content-between m-2">
                        <h5 class="fw-bold">Delivery charges:</h5>
                        <h5 class="fw-bold" id="deliveryCharges">Rs: ${deliveryCharges} /-</h5>
                    </div>
                    <div class="d-flex justify-content-between m-2">
                        <h5 class="fw-bold">Total amount:</h5>
                        <h5 class="fw-bold" id="totalAmount">Rs: ${totalOrderAmount} /-</h5>
                    </div>`
    itemsTotal += itemTotal;
    
    cart.innerHTML += `
      <div class="card dish-card w-100 mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center">
              <img class="dish-image order-img" src="${cartItems[i].image}" />
              <div class="p-2">
                <h5 class="card-title">${cartItems[i].name}</h5>
                <h3 class="card-title">Rs: ${cartItems[i].price} /- x ${cartItems[i].qty} = Rs. ${itemTotal}</h3>
                <p class="card-text">Serves ${cartItems[i].serving}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

};

const updateOrder = document.getElementById("updateOrder");

updateOrder.addEventListener("click", async () => {
  const closeBtn = document.getElementById("close-btn");
  const orderStatus = document.getElementById("orderStatus");
  const docRef = doc(db, "orders", updateOrderId);
  await updateDoc(docRef, {
    status: orderStatus.value,
  });

  const orderCard = document.getElementById(`order-card-${updateOrderId}`);
  const statusBadge = orderCard.querySelector("span.badge");
  statusBadge.textContent = orderStatus.value;
  statusBadge.className = orderStatus.value === "pending" ? "badge bg-warning" : "badge bg-success";

  closeBtn && closeBtn.click();
});


window.viewOrderDetail = viewOrderDetail;

window.deleteOrder = async (id) => {
  Swal.fire({
    title: "Are you sure you want to delete this order?",
    showCancelButton: true,
    confirmButtonText: "Yes",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const docRef = doc(db, "orders", id);
      await deleteDoc(docRef);
      Swal.fire("Deleted!", "", "success");
      const cardToDelete = document.getElementById(`order-card-${id}`);
      cardToDelete.remove();
    }
  });
}