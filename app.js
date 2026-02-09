// Load items from localStorage
let items = JSON.parse(localStorage.getItem("items")) || [];

// Ensure existing items have default fields
items = items.map(item => {
    if (item.type === "line" || item.type === "spacer") return item;
    return {
        name: item.name || "",
        location: item.location || "",
        quantity: item.quantity ?? 0,
        category: item.category || ""
    };
});

// Initial render after DOM ready
window.addEventListener("DOMContentLoaded", () => {
    render(items);
});

localStorage.setItem("items", JSON.stringify(items));

let editMode = false;

// Quantity inputs
const qtyInput = document.getElementById("quantity");
document.getElementById("qty-plus").addEventListener("click", () => {
    qtyInput.value = parseInt(qtyInput.value || 0) + 1;
});
document.getElementById("qty-minus").addEventListener("click", () => {
    qtyInput.value = Math.max(0, parseInt(qtyInput.value || 0) - 1);
});

// ===== Helper: insert after last normal item in category =====
function insertAfterLastRealItem(newItem, category) {
    // Find the last real item in this category
    let lastRealIndex = -1;
    for (let i = items.length - 1; i >= 0; i--) {
        if ((items[i].category || "") === category && !items[i].type) {
            lastRealIndex = i;
            break;
        }
    }

    // If there is a real item, insert **right after it**, before any following lines/spacers in the same category
    if (lastRealIndex !== -1) {
        let insertIndex = lastRealIndex + 1;
        // Move insertIndex forward until we hit a different category
        while (
            insertIndex < items.length &&
            (items[insertIndex].category || "") === category &&
            items[insertIndex].type
        ) {
            insertIndex++;
        }
        items.splice(insertIndex, 0, newItem);
    } else {
        // No real item: insert at the end of category or push at end
        let lastIndex = -1;
        for (let i = items.length - 1; i >= 0; i--) {
            if ((items[i].category || "") === category) {
                lastIndex = i;
                break;
            }
        }
        if (lastIndex === -1) {
            items.push(newItem);
        } else {
            items.splice(lastIndex + 1, 0, newItem);
        }
    }
}


// ===== Save new item =====
function save(e) {
    if (e) e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const location = document.getElementById("location").value.trim();
    const quantity = parseInt(document.getElementById("quantity").value);
    const category = document.getElementById("category")?.value.trim() || "";

    if (!name || !location || quantity < 0 || isNaN(quantity)) {
        alert("Please enter name, location, and a valid quantity (0 or more).");
        return;
    }

    const newItem = { 
                     id: Date.now().toString() + Math.random().toString(16).slice(2),
                     name,
                     location,
                     quantity,
                     category };

    console.log("=== Saving New Item ===");
    console.log("New item:", newItem);

    // Find the last real item in this category
    let lastRealIndex = -1;
    for (let i = items.length - 1; i >= 0; i--) {
        if ((items[i].category || "") === category && !items[i].type) {
            lastRealIndex = i;
            break;
        }
    }
    console.log("Last real item index in category:", lastRealIndex);

    let insertIndex;
    if (lastRealIndex !== -1) {
        insertIndex = lastRealIndex + 1;
        // Move insertIndex forward until we hit a different category
        while (
            insertIndex < items.length &&
            (items[insertIndex].category || "") === category &&
            items[insertIndex].type
        ) {
            insertIndex++;
        }
    } else {
        // No real item: insert at the end of category or push at end
        insertIndex = -1;
        for (let i = items.length - 1; i >= 0; i--) {
            if ((items[i].category || "") === category) {
                insertIndex = i + 1;
                break;
            }
        }
        if (insertIndex === -1) insertIndex = items.length;
    }

    console.log("Calculated insertIndex:", insertIndex);

    items.splice(insertIndex, 0, newItem);

    console.log("Items array after insert:");
    console.table(items.map((it, idx) => ({ idx, name: it.name, type: it.type, category: it.category })));

    localStorage.setItem("items", JSON.stringify(items));

    document.getElementById("name").value = "";
    document.getElementById("location").value = "";
    document.getElementById("quantity").value = 0;
    document.getElementById("category").value = "";

    render(items);
}


// ===== Search items =====
function search() {
    const query = document.getElementById("search").value.toLowerCase();
    const filtered = items.filter(item => item.name.toLowerCase().includes(query));
    render(filtered);
}

// ===== Name editing =====
function bindNameEditing() {
    document.querySelectorAll(".editable-name").forEach(el => {
        el.addEventListener("blur", () => {
            const index = parseInt(el.dataset.index);
            if (isNaN(index) || !items[index]) return;

            // Get cleaned text
            const text = el.innerText.replace(/\s+/g, " ").trim();

            // Split by dash
            const parts = text.split("–");

            const newName = parts[0]?.trim() || "";
            const newLocation = parts[1]?.trim() || "";

            items[index].name = newName;
            items[index].location = newLocation;

            saveItems();
            render(items);
        });

        // ENTER = save, ESC = cancel
        el.addEventListener("keydown", e => {
            if (e.key === "Enter") {
                e.preventDefault();
                el.blur();
            }
            if (e.key === "Escape") {
                render(items);
            }
        });
    });
}

// ===== Render =====
function render(list) {
    const results = document.getElementById("results");
    const categorizedItems = list.filter(i => i.category && i.category.trim() !== "");
    const uncategorizedItems = list.filter(i => !i.category || i.category.trim() === "");
    let html = "";
    let realItemCounter = 0;

    // Categorized
    const categories = [...new Set(categorizedItems.map(i => i.category))];
    categories.forEach(category => {
        html += `<h4>${category}</h4>`;
        categorizedItems
            .filter(item => item.category === category)
            .forEach(item => {
                const itemIndex = items.indexOf(item);
                const editableAttr = editMode ? 'contenteditable="true"' : '';

                if (item.type === "spacer") {
                    html += `
                    <div class="item-row spacer-row">
                        <span class="item-number"></span>
                        <div class="item-content" style="height:${item.lines * 20}px;"></div>
                        ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
                    </div>`;
                    return;
                }

                if (item.type === "line") {
                    html += `
                    <div class="item-row">
                        <span class="item-number"></span>
                        <hr style="flex:1; border-top:1px solid #aaa;">
                        ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
                    </div>`;
                    return;
                }

                // normal item
                realItemCounter++;
                html += `
                <div class="item-row">
                    <span class="item-number">${realItemCounter}.</span>
                    <div class="item-content">
                        <span
                            class="item-info editable-name"
                            ${editableAttr}
                            data-index="${itemIndex}"
                        >
                            ${item.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;–&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${item.location}
                        </span>
                        ${item.quantity !== null ? `<span class="item-quantity"><b>Stk</b>: ${item.quantity}</span>` : ''}
                    </div>
                    ${editMode && item.quantity !== null ? `<button class="plus" data-index="${itemIndex}">+</button>` : ''}
                    ${editMode && item.quantity !== null ? `<button class="minus" data-index="${itemIndex}">-</button>` : ''}
                    ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
                </div>`;
            });
    });

    // Uncategorized
    uncategorizedItems.forEach(item => {
        const itemIndex = items.indexOf(item);
        const editableAttr = editMode ? 'contenteditable="true"' : '';

        if (item.type === "spacer") {
            html += `
            <div class="item-row spacer-row">
                <span class="item-number"></span>
                <div class="item-content" style="height:${item.lines * 20}px;"></div>
                ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
            </div>`;
            return;
        }

        if (item.type === "line") {
            html += `
            <div class="item-row">
                <span class="item-number"></span>
                <hr style="flex:1; border-top:1px solid #aaa;">
                ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
            </div>`;
            return;
        }

        realItemCounter++;
        html += `
        <div class="item-row">
            <span class="item-number">${realItemCounter}.</span>
            <div class="item-content">
                <span
                    class="item-info editable-name"
                    ${editableAttr}
                    data-index="${itemIndex}"
                >
                    ${item.name}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;–&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${item.location}
                </span>
                ${item.quantity !== null ? `<span class="item-quantity"><b>Stk</b>: ${item.quantity}</span>` : ''}
            </div>
            ${editMode && item.quantity !== null ? `<button class="plus" data-index="${itemIndex}">+</button>` : ''}
            ${editMode && item.quantity !== null ? `<button class="minus" data-index="${itemIndex}">-</button>` : ''}
            ${editMode ? `<button class="delete" data-index="${itemIndex}">Delete</button>` : ''}
        </div>`;
    });

    results.innerHTML = html;
    bindEditButtons();
    bindNameEditing();
}


// ===== Bind edit buttons =====
function bindEditButtons() {
    if (!editMode) return;
    document.querySelectorAll(".plus").forEach(btn => { btn.addEventListener("click", e => changeItemQuantity(e.target.dataset.index, 1)); });
    document.querySelectorAll(".minus").forEach(btn => { btn.addEventListener("click", e => changeItemQuantity(e.target.dataset.index, -1)); });
    document.querySelectorAll(".delete").forEach(btn => { btn.addEventListener("click", e => deleteItem(e.target.dataset.index)); });
}

// ===== Change quantity =====
function changeItemQuantity(index, delta) {
    index = parseInt(index);
    items[index].quantity += delta;
    if (items[index].quantity < 0) items[index].quantity = 0;
    localStorage.setItem("items", JSON.stringify(items));
    render(items);
}

// ===== Toggle edit mode =====
function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById("editModeBtn");
    btn.textContent = editMode? "Edit Mode ON":"Data Edit Mode";
    btn.style.backgroundColor = editMode? "#4CAF50":"";
    btn.style.color = editMode? "white":"";
    render(items);
}

// ===== Delete =====
function deleteItem(index) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    items.splice(index,1);
    localStorage.setItem("items", JSON.stringify(items));
    render(items);
}

// ===== Backup =====
function exportBackup() {
    const dataStr = JSON.stringify(items,null,2);
    const blob = new Blob([dataStr], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `items_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
function importBackup(event){
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload=function(e){
        try{
            const importedItems = JSON.parse(e.target.result);
            items = importedItems.map(item=>{
                if(item.type==="spacer"||item.type==="line") return item;
                return {
                    name:item.name||"",
                    location:item.location||"",
                    quantity:item.quantity??0,
                    category:item.category??""
                };
            });
            localStorage.setItem("items", JSON.stringify(items));
            render(items);
            alert("Backup loaded successfully!");
        }catch(err){
            alert("Failed to load backup: "+err.message);
        }
    };
    reader.readAsText(file);
}

// ===== Add line =====
function addLine() {
    const category = document.getElementById("category")?.value.trim() || "";
    const lineItem = { type: "line", category };
    insertAfterLastRealItem(lineItem, category);
    localStorage.setItem("items", JSON.stringify(items));
    render(items);
}

// ===== Add spacer =====
function addSpacer(lines = 1) {
    const category = document.getElementById("category")?.value.trim() || "";
    const spacerItem = { type: "spacer", category, lines };
    insertAfterLastRealItem(spacerItem, category);
    localStorage.setItem("items", JSON.stringify(items));
    render(items);
}

// ===== Initial render =====
render(items);
