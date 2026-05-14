document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // 0) Repair broken nested menu-card HTML in MIX/EXTRAS
    // =========================
    function normalizeNestedMenuCards() {
      let nestedCards = document.querySelectorAll(".menu-category .menu-card .menu-card");
  
      while (nestedCards.length) {
        nestedCards.forEach((innerCard) => {
          const outerCard = innerCard.parentElement;
          if (!outerCard) return;
  
          while (innerCard.firstChild) {
            outerCard.insertBefore(innerCard.firstChild, innerCard);
          }
          innerCard.remove();
        });
  
        nestedCards = document.querySelectorAll(".menu-category .menu-card .menu-card");
      }
    }
  
    normalizeNestedMenuCards();
  
    // =========================
    // 1) Helpers
    // =========================
    function getOuterMenuCard(element) {
      let card = element.closest(".menu-card");
      if (!card) return null;
  
      while (card.parentElement && card.parentElement.closest(".menu-card")) {
        card = card.parentElement.closest(".menu-card");
      }
  
      return card;
    }
  
    function getCardName(card) {
      const h3 = card.querySelector("h3");
      return h3 ? h3.innerText.trim() : "Item";
    }
  
    function getCardId(card) {
      return card.dataset.id || getCardName(card);
    }
  
    function getBasePrice(card) {
      const priceEl = card.querySelector(".price");
      if (!priceEl) return 0;
  
      const parsed = parseInt(priceEl.innerText, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  
    function getOptionsContainer(card) {
      return card.querySelector(".mix-options") || card.querySelector(".item-options");
    }
  
    function getSelectedOptions(card) {
      const container = getOptionsContainer(card);
      if (!container) return [];
    
      return Array.from(container.querySelectorAll("input:checked")).map((opt) =>
        opt.parentElement.textContent.trim()
      );
    }
  
    // =========================
    // 2) Tabs
    // =========================
    const tabs = document.querySelectorAll(".tab-btn");
    const categories = document.querySelectorAll(".menu-category");
  
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
  
        categories.forEach((cat) => cat.classList.remove("active"));
  
        const target = btn.getAttribute("data-category");
        const targetCategory = document.getElementById(target);
        if (targetCategory) targetCategory.classList.add("active");
      });
    });
  
// =========================
// 3) View More / View Less
// =========================

document.querySelectorAll(".menu-category").forEach((category) => {

  const cards = category.querySelectorAll(".menu-card");
  const button = category.querySelector(".view-more");

  // عدد الكروت اللي تظهر في البداية
  const visibleCards = 4;

  // لو أقل من أو يساوي 4 نخفي الزرار
  if (cards.length <= visibleCards) {
    if (button) button.style.display = "none";
    return;
  }

  // نخفي الكروت بعد أول 4
  cards.forEach((card, index) => {
    if (index >= visibleCards) {
      card.style.display = "none";
    }
  });

  // حالة الزرار
  let expanded = false;

  button.addEventListener("click", () => {

    expanded = !expanded;

    cards.forEach((card, index) => {

      if (index >= visibleCards) {
        card.style.display = expanded ? "flex" : "none";
      }

    });

    button.textContent = expanded
      ? "عرض أقل ↑"
      : "رؤية المزيد ←";

  });

});
    // =========================
    // 4) Options logic
    // =========================
    document.addEventListener("change", function (e) {
      // mix-options: اختيار واحد فقط
      if (e.target.closest(".mix-options")) {
        const mixContainer = e.target.closest(".mix-options");
        if (e.target.checked) {
          mixContainer.querySelectorAll("input").forEach((cb) => {
            if (cb !== e.target) cb.checked = false;
          });
        }
        return;
      }
  
      
      if (e.target.closest(".item-options")) {
        const optionsContainer = e.target.closest(".item-options");
        const clickedCheckbox = e.target;
        const labelText = clickedCheckbox.parentElement.textContent || "";
        const isSada = labelText.includes("سادة");
  
        if (clickedCheckbox.checked) {
          if (isSada) {
            optionsContainer.querySelectorAll("input").forEach((cb) => {
              if (cb !== clickedCheckbox) cb.checked = false;
            });
          } else {
            optionsContainer.querySelectorAll("input").forEach((cb) => {
              const cbText = cb.parentElement.textContent || "";
              if (cbText.includes("سادة")) cb.checked = false;
            });
          }
        }
      }
    });
  
    // =========================
    // 5) Cart state
    // =========================
    let cart = [];
    let hasOpenedOnce = false;
  
    function openCart() {
      const sidebar = document.getElementById("cartSidebar");
      if (sidebar) sidebar.classList.add("active");
    }
  
    function closeCart() {
      const sidebar = document.getElementById("cartSidebar");
      if (sidebar) sidebar.classList.remove("active");
    }
  
    function updateCartCount() {
      const countElement = document.querySelector(".cart-count");
      if (!countElement) return;
  
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      countElement.innerText = totalItems;
      countElement.style.display = totalItems > 0 ? "flex" : "none";
    }
  
    function updateMenuCounter(card, qty) {
      if (!card) return;
  
      const addBtn = card.querySelector(".add-to-cart-btn");
      const counter = card.querySelector(".counter");
      const countDisplay = card.querySelector(".count");
  
      if (!addBtn || !counter) return;
  
      if (qty > 0) {
        addBtn.style.display = "none";
        counter.style.display = "flex";
        if (countDisplay) countDisplay.innerText = qty;
      } else {
        addBtn.style.display = "block";
        counter.style.display = "none";
      }
    }
  
    function addToCart(name, basePrice, btnElement) {
      const card = getOuterMenuCard(btnElement);
      if (!card) return;
  
      const cardId = getCardId(card);
      const selectedOptions = getSelectedOptions(card);
  
      let extraCharge = 0;
      const isMix = !!card.querySelector(".mix-options");
  
      if (isMix) {
        // السعر في الميكس من الاختيار الوحيد فقط
        if (selectedOptions.length > 0) {
          const selected = selectedOptions[0];
          const priceMatch = selected.match(/\d+/);
          extraCharge = priceMatch ? parseInt(priceMatch[0], 10) : 0;
        }
      } else {
        // الساندوتشات / الإضافات
        if (!name.includes("بطاطس") && !name.includes("طعمية")) {
          extraCharge = selectedOptions.filter((opt) => !opt.includes("سادة")).length;
        }
      }
  
      const finalPrice = basePrice + extraCharge;
      const imgEl = card.querySelector(".food-layer");
      const imgSource = imgEl ? imgEl.src : "";
  
      const itemKey = cardId + "|" + selectedOptions.slice().sort().join(",");
  
      const existing = cart.find((item) => item.key === itemKey);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({
          key: itemKey,
          cardId: cardId,
          name: name,
          options: selectedOptions,
          pricePerUnit: finalPrice,
          quantity: 1,
          image: imgSource,
        });
      }
  
      renderCart();
      updateCartCount();
  
      const totalQty = cart
        .filter((i) => i.cardId === cardId)
        .reduce((sum, i) => sum + i.quantity, 0);
  
      updateMenuCounter(card, totalQty);
  
      if (!hasOpenedOnce) {
        openCart();
        hasOpenedOnce = true;
      }
    }
  
    function removeFromCartLogic(card) {
      const cardId = getCardId(card);
      const itemIndex = cart.findLastIndex((item) => item.cardId === cardId);
  
      if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
          cart[itemIndex].quantity -= 1;
        } else {
          cart.splice(itemIndex, 1);
        }
      }
  
      renderCart();
      updateCartCount();
  
      const totalQty = cart
        .filter((i) => i.cardId === cardId)
        .reduce((sum, i) => sum + i.quantity, 0);
  
      updateMenuCounter(card, totalQty);
    }
  
    function deleteFromCart(index) {
      const item = cart[index];
      if (!item) return;
  
      const cardId = item.cardId;
      cart.splice(index, 1);
  
      renderCart();
      updateCartCount();
  
      const card = Array.from(document.querySelectorAll(".menu-card")).find((c) => getCardId(c) === cardId);
      const totalQty = cart
        .filter((i) => i.cardId === cardId)
        .reduce((sum, i) => sum + i.quantity, 0);
  
      updateMenuCounter(card, totalQty);
    }
  
    function editItem(cardId) {
      closeCart();
  
      const card = Array.from(document.querySelectorAll(".menu-card")).find((c) => getCardId(c) === cardId);
      if (!card) return;
  
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.style.outline = "3px solid #DD9E59";
      setTimeout(() => (card.style.outline = "none"), 2000);
    }
  
    function renderCart() {
      const cartItemsDiv = document.getElementById("cartItems");
      const totalPriceSpan = document.getElementById("totalPrice");
  
      if (!cartItemsDiv || !totalPriceSpan) return;
  
      cartItemsDiv.innerHTML = "";
      let total = 0;
  
      cart.forEach((item, index) => {
        const itemTotal = item.pricePerUnit * item.quantity;
        total += itemTotal;
  
        cartItemsDiv.innerHTML += `
          <div class="cart-item-card">
            <div class="cart-item-img"><img src="${item.image}"></div>
            <div class="cart-item-info">
              <h4>${item.name}</h4>
<p>
  ${
    item.options.length > 0
      ? item.options
          .map(opt => opt.replace(/\d+\s*ج\.م/g, "").trim())
          .join(" - ")
      : ""
  }
</p>
              <div class="edit-del-btns">
                <button onclick="deleteFromCart(${index})"><i class="fas fa-trash"></i> حذف</button>
                <button onclick="editItem('${item.cardId}')"><i class="fas fa-edit"></i> تعديل</button>
              </div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-circle">${item.quantity}</div>
              <span>${itemTotal} ج.م</span>
            </div>
          </div>`;
      });
  
      totalPriceSpan.innerText = total;
  
      if (cart.length > 0 && !document.querySelector(".checkout-form")) {
        cartItemsDiv.insertAdjacentHTML(
          "beforeend",
          `
          <div class="checkout-form">
            <input type="text" id="userName" placeholder="الاسم">
            <small class="error-msg" id="nameError"></small>
  
            <input type="tel" id="userPhone" placeholder="رقم الموبايل">
            <small class="error-msg" id="phoneError"></small>
  
            <input type="text" id="userAddress" placeholder="العنوان بالتفصيل">
            <small class="error-msg" id="addressError"></small>
          </div>`
        );
      }
    }
  
    // expose for inline onclick in generated cart items
    window.openCart = openCart;
    window.closeCart = closeCart;
    window.deleteFromCart = deleteFromCart;
    window.editItem = editItem;
  
    // =========================
    // 6) Global click handling for plus/minus/add buttons
    // =========================
    document.addEventListener("click", function (e) {
      const plusBtn = e.target.closest(".plus");
      const minusBtn = e.target.closest(".minus");
      const mainAddBtn = e.target.closest(".add-to-cart-btn");
  
      if (plusBtn || mainAddBtn) {
        const controlBtn = plusBtn || mainAddBtn;
        const card = getOuterMenuCard(controlBtn);
        if (!card) return;
  
        const itemName = getCardName(card);
        const basePrice = getBasePrice(card);
  
        addToCart(itemName, basePrice, controlBtn);
      }
  
      if (minusBtn) {
        const card = getOuterMenuCard(minusBtn);
        if (!card) return;
  
        removeFromCartLogic(card);
      }
    });
  
    // =========================
    // 7) Validation / confirm order
    // =========================
    function setState(input, messageElement, message, type) {
      if (!input || !messageElement) return;
  
      input.classList.remove("error", "success");
      messageElement.classList.remove("success-msg");
  
      messageElement.innerText = message;
  
      if (type === "error") {
        input.classList.add("error");
      } else if (type === "success") {
        input.classList.add("success");
        messageElement.classList.add("success-msg");
      }
    }
  
    document.addEventListener("input", function (e) {
      if (e.target.id === "userName") {
        const name = e.target;
        const error = document.getElementById("nameError");
        const regex = /^[a-zA-Z\u0600-\u06FF\s]+$/;
  
        if (!name.value.trim()) {
          setState(name, error, "ادخلي الاسم", "error");
        } else if (!regex.test(name.value)) {
          setState(name, error, "الاسم حروف بس", "error");
        } else {
          setState(name, error, "✔ الاسم صحيح", "success");
        }
      }
  
      if (e.target.id === "userPhone") {
        const phone = e.target;
        const error = document.getElementById("phoneError");
        const regex = /^01[0-9]{9}$/;
  
        if (!phone.value.trim()) {
          setState(phone, error, "ادخلي رقم الموبايل", "error");
        } else if (!regex.test(phone.value)) {
          setState(phone, error, "رقم غير صحيح", "error");
        } else {
          setState(phone, error, "✔ رقم صحيح", "success");
        }
      }
  
      if (e.target.id === "userAddress") {
        const addr = e.target;
        const error = document.getElementById("addressError");
  
        if (!addr.value.trim()) {
          setState(addr, error, "ادخلي العنوان", "error");
        } else {
          setState(addr, error, "✔ تمام", "success");
        }
      }
    });
  
    const confirmBtn = document.querySelector(".confirm-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (cart.length === 0) return alert("السلة فارغة!");
  
        const nameInput = document.getElementById("userName");
        const phoneInput = document.getElementById("userPhone");
        const addrInput = document.getElementById("userAddress");
  
        const nameError = document.getElementById("nameError");
        const phoneError = document.getElementById("phoneError");
        const addressError = document.getElementById("addressError");
  
        if (!nameInput || !phoneInput || !addrInput || !nameError || !phoneError || !addressError) return;
  
        nameError.innerText = "";
        phoneError.innerText = "";
        addressError.innerText = "";
  
        nameInput.classList.remove("error");
        phoneInput.classList.remove("error");
        addrInput.classList.remove("error");
  
        let isValid = true;
  
        const nameRegex = /^[a-zA-Z\u0600-\u06FF\s]+$/;
        const phoneRegex = /^01[0-9]{9}$/;
  
        if (!nameInput.value.trim()) {
          nameError.innerText = "من فضلك ادخل الاسم";
          nameInput.classList.add("error");
          isValid = false;
        } else if (!nameRegex.test(nameInput.value)) {
          nameError.innerText = "يجب ادخال الاسم بدون أرقام أو رموز";
          nameInput.classList.add("error");
          isValid = false;
        } else {
          nameError.innerText = "✔ الاسم صحيح";
          nameError.classList.add("success-msg");
          nameInput.classList.add("success");
        }
  
        if (!phoneInput.value.trim()) {
          phoneError.innerText = "من فضلك ادخل رقم الموبايل";
          phoneInput.classList.add("error");
          isValid = false;
        } else if (!phoneRegex.test(phoneInput.value)) {
          phoneError.innerText = "يجب ادخال الرقم يبدأ ب 01 ومكون من 11 رقم";
          phoneInput.classList.add("error");
          isValid = false;
        } else {
          phoneError.innerText = "✔ رقم صحيح";
          phoneError.classList.add("success-msg");
          phoneInput.classList.add("success");
        }
  
        if (!addrInput.value.trim()) {
          addressError.innerText = "من فضلك ادخل العنوان";
          addrInput.classList.add("error");
          isValid = false;
        } else {
          addressError.innerText = "✔ تمام";
          addressError.classList.add("success-msg");
          addrInput.classList.add("success");
        }
  
        if (!isValid) return;
  
        let msg = `طلب جديد من: ${nameInput.value}\nالموبايل: ${phoneInput.value}\nالعنوان: ${addrInput.value}\n------------------\n`;
  
        cart.forEach((i) => {
          msg += `• ${i.name} (${i.options.join(",") || "سادة"}) × ${i.quantity} = ${i.pricePerUnit * i.quantity}ج\n`;
        });
  
        msg += `------------------\nالإجمالي: ${document.getElementById("totalPrice").innerText} ج.م`;
  
        window.open(`https://wa.me/201017158284?text=${encodeURIComponent(msg)}`);
      });
    }
  });
