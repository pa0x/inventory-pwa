// Load existing items from localStorage or start empty
let items = JSON.parse(localStorage.getItem("items")) || [];
// edit mode
let editMode = false;
// adding beginning items
const qtyInput = document.getElementById("quantity");

document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = parseInt(qtyInput.value || 1) + 1;
});

document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(1, parseInt(qtyInput.value || 1) - 1);
});

// Save a new item
function save() {
    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const quantity = parseInt(document.getElementById("quantity").value);

    if (!name || !location || !quantity || quantity < 1) {
        alert("Please enter name, location, and a valid quantity.");
        return;
    }

    const item = { name, location, quantity };
    items.push(item);
    localStorage.setItem("items", JSON.stringify(items));

    // Clear input fields
    document.getElementById("name").value = "";
    document.getElementById("location").value = "";
    document.getElementById("quantity").value = 1;

    render(items);
}

// Search items by name
function search() {
    const query = document.getElementById("search").value.toLowerCase();
    const filtered = items.filter(item => item.name.toLowerCase().includes(query));
    render(filtered);
}

            //<button onclick="changeItemQuantity(${index},1)">+</button>
            //<button onclick="changeItemQuantity(${index},-1)">-</button>


// Render items to the results div //
function render(list) {
    const results = document.getElementById("results");
    
  results.innerHTML = list.map(item => {
    const idx = items.indexOf(item);
    return `
    <div class="item-row">
        <span class="item-number">${idx + 1}.</span>
        <div class="item-content">
            <span class="item-info">${item.name} – ${item.location}</span>
            <span class="item-quantity">Stk: ${item.quantity}</span>
        </div>
        ${editMode ? `<button class="plus" data-index="${idx}">+</button>` : ''}
        ${editMode ? `<button class="minus" data-index="${idx}">-</button>` : ''}
        ${editMode ? `<button class="delete" data-index="${idx}">Delete</button>` : ''}
    </div>
    `;
}).join("");

    if (editMode) {
        // Bind + buttons
        document.querySelectorAll('.plus').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                changeItemQuantity(idx, 1);
            });
        });
        // Bind - buttons
        document.querySelectorAll('.minus').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                changeItemQuantity(idx, -1);
            });
        });
        // Bind delete buttons
        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index);
                deleteItem(idx);
            });
        });
    }
}

function changeItemQuantity(index, delta) {
    index = parseInt(index); // ensure it’s a number
    items[index].quantity += delta;
    if (items[index].quantity < 1) items[index].quantity = 1;
    localStorage.setItem("items", JSON.stringify(items));
    render(items); // update display
}

function changeItemQuantity(index, delta) {
    items[index].quantity += delta;

    if (items[index].quantity < 1) {
        items[index].quantity = 1; // prevent negative quantities
    }

    // Save updated array to localStorage
    localStorage.setItem("items", JSON.stringify(items));

    // Re-render results
    render(items);
}

function toggleDelMode() {
    delMode = !delMode;
    render(items);
}

function toggleEditMode() {
    editMode = !editMode;
    
     // Update button color
    const btn = document.getElementById("editModeBtn");
     if (editMode) {
       // btn.style.backgroundColor = "#4CAF50"; // green when active
       // btn.style.color = "white";
        btn.textContent = "Edit Mode ON";
    } else {
      //  btn.style.backgroundColor = ""; // default color
      //  btn.style.color = "";
        btn.textContent = "Enable Edit Mode";
    } 
    
    render(items);
}

function deleteItem(index) {
    index = parseInt(index);
    if (!confirm("Are you sure you want to delete this item?")) return;
    items.splice(index, 1);
    localStorage.setItem("items", JSON.stringify(items));
    render(items);
}

// Initial render
render(items);
