// ======= FULL script.js (robust subtotal/total fix) =======

// Helpers for localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}
function clearCart() {
  localStorage.removeItem("cart");
  updateCartCount();
}
function updateCartCount() {
  const totalQty = getCart().reduce((sum, item) => sum + (item.qty || 1), 0);
  let badge = document.getElementById("cart-count");
  if (!badge) {
    const bag = document.getElementById("lg-bag");
    if (bag) {
      badge = document.createElement("span");
      badge.id = "cart-count";
      badge.style.cssText =
        "background:#088178;color:white;border-radius:50%;padding:2px 6px;margin-left:4px;font-size:12px;";
      bag.appendChild(badge);
    }
  }
  if (badge) badge.textContent = totalQty;
}

// Add-to-cart
document.querySelectorAll(".cart").forEach((icon) => {
  icon.addEventListener("click", (e) => {
    e.preventDefault();
    const pro = icon.closest(".pro");
    if (!pro) return alert("Product not found!");

    const titleEl = pro.querySelector(".des h5");
    const priceEl = pro.querySelector(".des h4");
    if (!titleEl || !priceEl) return alert("Product markup missing title/price");

    const title = titleEl.innerText;
    const price = parseFloat(priceEl.innerText.replace(/[^0-9.]/g, ""));
    const img = pro.querySelector("img")?.src || "";
    const id = pro.getAttribute("data-id") || title;

    const cart = getCart();
    const existing = cart.find((p) => p.id === id);
    if (existing) existing.qty++;
    else cart.push({ id, title, price, img, qty: 1 });

    saveCart(cart);
    alert(`${title} added to cart`);
    // If on cart page, re-render
    if (document.getElementById("cart")) renderCart();
  });
});

// Render cart page
if (document.getElementById("cart")) renderCart();

function renderCart() {
  const cart = getCart();
  const tbody = document.querySelector("#cart tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align:center;padding:20px;">Your cart is empty.</td></tr>';
  } else {
    cart.forEach((item) => {
      const row = document.createElement("tr");
      const sub = (item.price || 0) * (item.qty || 1);
      row.innerHTML = `
        <td><a href="#" class="remove" data-id="${item.id}"><i class="far fa-times-circle"></i></a></td>
        <td><img src="${item.img}" width="60" alt=""></td>
        <td>${item.title}</td>
        <td>$${(item.price||0).toFixed(2)}</td>
        <td>${item.qty}</td>
        <td>$${sub.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
      total += sub;
    });
  }

  // update subtotal/total UI using robust lookup
  updateSubtotalBox(total);

  // remove handlers
  document.querySelectorAll(".remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.getAttribute("data-id");
      const newCart = cart.filter((p) => p.id !== id);
      saveCart(newCart);
      renderCart();
    });
  });

  updateCartCount();
}

// Robust find: locate row by label text in first cell, return the second td (create if needed)
function findSecondCellByLabel(label) {
  const table = document.querySelector("#subtotal table");
  if (!table) return null;
  const rows = Array.from(table.querySelectorAll("tr"));
  const lbl = (label || "").toString().trim().toLowerCase();
  for (const r of rows) {
    const firstCell = r.querySelector("td, th");
    if (!firstCell) continue;
    const text = (firstCell.innerText || "").toString().trim().toLowerCase();
    if (text.includes(lbl)) {
      let tds = r.querySelectorAll("td");
      if (tds.length >= 2) return tds[1];
      // create second td if missing
      const td = document.createElement("td");
      r.appendChild(td);
      return td;
    }
  }
  return null;
}

// Update subtotal and total — writes HTML <strong> into the second cell to ensure visibility
function updateSubtotalBox(total = null) {
  if (total === null) {
    total = getCart().reduce(
      (sum, it) => sum + Number(it.price || 0) * Number(it.qty || 1),
      0
    );
  }

  const subCell = findSecondCellByLabel("Cart Subtotal");
  if (subCell) subCell.innerHTML = "<strong>$ " + total.toFixed(2) + "</strong>";

  const shipCell = findSecondCellByLabel("Shipping");
  // Keep existing text (e.g., "Free") if present; otherwise set "Free"
  if (shipCell && (!shipCell.innerText || shipCell.innerText.trim() === "")) {
    shipCell.textContent = "Free";
  }

  const totalCell = findSecondCellByLabel("Total");
  if (totalCell) totalCell.innerHTML = "<strong>$ " + total.toFixed(2) + "</strong>";
}

// Checkout button
const checkoutBtn = document.querySelector("#subtotal .normal");
if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) return alert("Your cart is empty!");
    alert("Order placed successfully!");
    clearCart();
    renderCart();
    updateSubtotalBox(0);
  });
}

// Signup
const signupBtn = document.getElementById("newsletter-btn");
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = document.getElementById("newsletter-email").value.trim();
    if (!email) return alert("Please enter your email");
    alert("Signed up successfully!");
    localStorage.setItem("userEmail", email);
    const user = document.getElementById("header-user");
    if (user) user.textContent = "Signed in: " + email;
  });
}


// listen for storage changes (other tab)
window.addEventListener("storage", (e) => {
  if (e.key === "cart") {
    if (document.getElementById("cart")) renderCart();
    updateSubtotalBox();
  }
});

// init badge
updateCartCount();
