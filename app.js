const requirementColors = {
    "Not Required": "#9AA0A6",
    "ASRC Level III Requirement": "#E37400",
    "ASRC Level II Requirement": "#E37400",
    "SMRG Requirement": "#FBBC04",
    "VDEM Requirement": "#4285F4"
};

let cards = [];
let currentIndex = 0;
let flipped = false;
let frontMode = "name";
let loaded = false;
let randomMode = false;
let activeFilters = new Set();

fetch('cards.json')
    .then(response => response.json())
    .then(data => {
        cards = data;
        loaded = true;
        populateFilterCheckboxes();
        applyDefaultFilters();
        renderCard();
    });

function getFrontElement() {
    return document.getElementById("cardFront");
}

function getBackElement() {
    return document.getElementById("cardBack");
}

function renderCard() {
    const front = getFrontElement();
    const back = getBackElement();
    const banner = document.getElementById("requirementBanner");
    const progress = document.getElementById("progress");
    const noCardsMessage = document.getElementById("noCardsMessage");

    if (!loaded || cards.length === 0) return;

    const filteredCards = cards.filter(card => activeFilters.size === 0 || activeFilters.has(card.requirement));

    if (filteredCards.length === 0) {
        front.innerHTML = "";
        back.innerHTML = "";
        banner.style.backgroundColor = "#f8f9fa";
        banner.textContent = "";
        progress.textContent = "";
        noCardsMessage.style.display = "block";
        return;
    }

    noCardsMessage.style.display = "none";

    const card = filteredCards[currentIndex % filteredCards.length];
    const safeName = card.name || "Unknown Knot";
    const safeImage = card.image
        ? `<img src="${card.image}" alt="${safeName}" class="img-fluid rounded">`
        : '<p>No image available</p>';
    const safeDescription = card.description || "No description provided.";

    banner.textContent = card.requirement;
    banner.style.backgroundColor = requirementColors[card.requirement] || "#ddd";

    front.innerHTML = frontMode === "name"
        ? `<h2>${safeName}</h2>`
        : safeImage;

    back.innerHTML = frontMode === "name"
        ? `${safeImage}<p class="mt-2 mb-2">${safeDescription}</p>`
        : `<h2>${safeName}</h2><p class="mt-2 mb-2">${safeDescription}</p>`;

    back.innerHTML += `
      <div class="link-buttons">
        ${card.animationLink ? `<a href="${card.animationLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary">View animation</a>` : ''}
        ${card.videoLink ? `<a href="${card.videoLink}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary">Watch video</a>` : ''}
      </div>`;

    progress.textContent = `Card ${card.id} of ${cards.length}`;
    document.getElementById("prevBtn").disabled = randomMode;

    resetFlip();
}

function flipCard() {
    if (!loaded) return;
    const front = getFrontElement();
    const back = getBackElement();
    front.style.display = flipped ? "flex" : "none";
    back.style.display = flipped ? "none" : "flex";
    flipped = !flipped;
}

function resetFlip() {
    const front = getFrontElement();
    const back = getBackElement();
    flipped = false;
    front.style.display = "flex";
    back.style.display = "none";
}

function toggleCardFrontContent() {
    if (!loaded) return;
    frontMode = frontMode === "name" ? "image" : "name";
    renderCard();
}

function toggleRandomMode() {
    randomMode = !randomMode;
    renderCard();
}

function nextCard() {
    if (!loaded) return;
    const visibleCards = cards.filter(c => c.visible !== false);
    if (visibleCards.length === 0) return;

    if (randomMode) {
        let next;
        do {
            next = Math.floor(Math.random() * visibleCards.length);
        } while (next === currentIndex && visibleCards.length > 1);
        currentIndex = cards.indexOf(visibleCards[next]);
    } else {
        const current = visibleCards.indexOf(cards[currentIndex]);
        const next = (current + 1) % visibleCards.length;
        currentIndex = cards.indexOf(visibleCards[next]);
    }
    renderCard();
}

function prevCard() {
    if (!loaded || randomMode) return;
    const visibleCards = cards.filter(c => c.visible !== false);
    if (visibleCards.length === 0) return;

    const current = visibleCards.indexOf(cards[currentIndex]);
    const prev = (current - 1 + visibleCards.length) % visibleCards.length;
    currentIndex = cards.indexOf(visibleCards[prev]);
    renderCard();
}

function populateFilterCheckboxes() {
    const container = document.getElementById("filterCheckboxes");
    container.innerHTML = ""; // Clear previous

    Object.entries(requirementColors).forEach(([label, color]) => {
        const checkbox = document.createElement("div");
        checkbox.className = "form-check";

        const isChecked = label !== "Not Required";

        checkbox.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${label}" id="filter-${label}" ${isChecked ? 'checked' : ''}>
            <label class="form-check-label" for="filter-${label}" style="color: ${color}; font-weight: bold;">
                ${label}
            </label>
        `;

        container.appendChild(checkbox);
    });
}

function applyDefaultFilters() {
    activeFilters = new Set();
    Object.keys(requirementColors).forEach(key => {
        if (key !== "Not Required") {
            activeFilters.add(key);
        }
    });
    cards.forEach(card => {
        card.visible = activeFilters.has(card.requirement);
    });
}

function applyFilters() {
    const checkboxes = document.querySelectorAll("#filterCheckboxes .form-check-input");
    activeFilters = new Set();

    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            activeFilters.add(checkbox.value);
        }
    });

    if (activeFilters.size === 0) {
        cards.forEach(card => card.visible = true);
    } else {
        cards.forEach(card => {
            card.visible = activeFilters.has(card.requirement);
        });
    }

    currentIndex = 0;
    renderCard();

    const modalElement = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    if (modalElement) modalElement.hide();
}

function resetFilters() {
    const checkboxes = document.querySelectorAll("#filterCheckboxes .form-check-input");
    activeFilters = new Set();

    checkboxes.forEach(cb => {
        cb.checked = cb.value !== "Not Required";
        if (cb.checked) activeFilters.add(cb.value);
    });

    cards.forEach(card => {
        card.visible = activeFilters.has(card.requirement);
    });

    currentIndex = 0;
    renderCard();

    const modalElement = bootstrap.Modal.getInstance(document.getElementById('filterModal'));
    if (modalElement) modalElement.hide();
}

document.addEventListener("keydown", (e) => {
    if (!loaded) return;
    switch (e.key) {
        case "ArrowRight":
            nextCard();
            break;
        case "ArrowLeft":
            prevCard();
            break;
        case " ":
        case "Enter":
            flipCard();
            break;
    }
});
