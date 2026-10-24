// global
const API_URL = 'https://akabab.github.io/superhero-api/api/all.json';
let allHeroes = [];
let filteredHeroes = [];
let currentPage = 1;
const itemsPerPage = 20;

// DOM 
const heroesGrid = document.getElementById('heroes-grid');
const resultsCount = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const orderSelect = document.getElementById('order-select');
const genderSelect = document.getElementById('gender-select');
const publisherSelect = document.getElementById('publisher-select');

// paginas
const btnFirst = document.getElementById('btn-first');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnLast = document.getElementById('btn-last');
const pageIndicator = document.getElementById('page-indicator');


const heroModal = document.getElementById('hero-modal');
const modalContent = document.getElementById('modal-content');
const modalBackdrop = document.getElementById('modal-backdrop');

// api
async function fetchHeroes() {
  try {
    if (resultsCount) resultsCount.textContent = 'Loading multiverses...';

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    allHeroes = await response.json();
    filteredHeroes = [...allHeroes];

    setupEventListeners();
    applyFilters();
  } catch (error) {
    console.error('Fetch error:', error);
    if (resultsCount) {
      resultsCount.textContent = 'Error loading superheroes. Please try again.';
    }
  }
}

// 2 filtros
function applyFilters() {
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const selectedGender = genderSelect ? genderSelect.value : 'all';
  const selectedPublisher = publisherSelect ? publisherSelect.value : 'all';
  const sortOrder = orderSelect ? orderSelect.value : 'asc';

  filteredHeroes = allHeroes.filter(hero => {
    const heroName = (hero.name || '').toLowerCase();
    const matchesName = heroName.includes(searchTerm);

    const heroGender = hero.appearance?.gender || '-';
    let matchesGender = true;
    if (selectedGender === 'Female') {
      matchesGender = (heroGender === 'Female');
    } else if (selectedGender === 'Male') {
      matchesGender = (heroGender === 'Male');
    }

    const heroPublisher = hero.biography?.publisher || 'Other';
    let matchesPublisher = true;
    if (selectedPublisher === 'Marvel Comics' || selectedPublisher === 'DC Comics' || selectedPublisher === 'Dark Horse Comics') {
      matchesPublisher = (heroPublisher === selectedPublisher);
    } else if (selectedPublisher === 'Other') {
      matchesPublisher = (heroPublisher !== 'Marvel Comics' && heroPublisher !== 'DC Comics' && heroPublisher !== 'Dark Horse Comics');
    }

    return matchesName && matchesGender && matchesPublisher;
  });

  filteredHeroes.sort((a, b) => {
    const nameA = (a.name || '').trim().toLowerCase();
    const nameB = (b.name || '').trim().toLowerCase();
    return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(a.name);
  });

  currentPage = 1;
  updatePagination();
  renderCurrentPage();
}

// 3 cajas
function renderCurrentPage() {
  if (!heroesGrid) return;
  heroesGrid.innerHTML = '';

  const totalResults = filteredHeroes.length;
  if (resultsCount) {
    resultsCount.textContent = `Total results: ${totalResults}`;
  }

  if (totalResults === 0) {
    heroesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: #f1e4ff;">
        <h2>No heroes found in this reality</h2>
        <p style="margin-top: 0.5rem; color: #d8b4fe;">Try adjusting your search terms or filters.</p>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const heroesToShow = filteredHeroes.slice(startIndex, startIndex + itemsPerPage);

  heroesToShow.forEach(hero => {
    const card = document.createElement('article');
    card.className = 'hero-card';

    const imageUrl = hero.images?.md || hero.images?.sm || 'https://via.placeholder.com/300x400?text=No+Image';
    const publisherName = hero.biography?.publisher || 'Independent';
    const alignment = (hero.biography?.alignment || 'neutral').toUpperCase();

    card.innerHTML = `
      <div class="hero-card__img-wrapper">
        <img src="${imageUrl}" alt="${hero.name}" loading="lazy">
        <span class="hero-card__badge">${alignment}</span>
      </div>
      <div class="hero-card__info">
        <h3 class="hero-card__title">${hero.name}</h3>
        <span class="hero-card__publisher">${publisherName}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      openHeroDetails(hero);
    });

    heroesGrid.appendChild(card);
  });
}

// 4 paginas
function updatePagination() {
  const totalPages = Math.ceil(filteredHeroes.length / itemsPerPage) || 1;

  if (pageIndicator) {
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
  }

  if (btnFirst) btnFirst.disabled = (currentPage === 1);
  if (btnPrev) btnPrev.disabled = (currentPage === 1);
  if (btnNext) btnNext.disabled = (currentPage === totalPages);
  if (btnLast) btnLast.disabled = (currentPage === totalPages);
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredHeroes.length / itemsPerPage) || 1;
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  updatePagination();
  renderCurrentPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5 detalles
function openHeroDetails(hero) {
  const modal = document.getElementById('hero-modal');
  const target = document.getElementById('modal-content');
  if (!modal || !target) return;

  const stats = hero.powerstats || {};
  const bio = hero.biography || {};
  const appearance = hero.appearance || {};
  const work = hero.work || {};
  const connections = hero.connections || {};

  const renderStatBar = (label, value) => {
    const numericValue = parseInt(value, 10);
    const percentage = isNaN(numericValue) ? 0 : Math.min(Math.max(numericValue, 0), 100);
    const displayValue = isNaN(numericValue) ? 'N/A' : numericValue;

    return `
      <div class="stat-row">
        <span class="stat-row__label">${label}</span>
        <div class="stat-row__track">
          <div class="stat-row__fill" style="width: ${percentage}%;"></div>
        </div>
        <span class="stat-row__value">${displayValue}</span>
      </div>
    `;
  };

  target.innerHTML = `
    <button type="button" class="modal__close" id="modal-close" aria-label="Close modal">&times;</button>
    
    <div class="hero-dossier">
      <div class="hero-dossier__bio">
        <h2 class="hero-dossier__title">${hero.name}</h2>
        <div class="hero-dossier__field">
          <strong>Real Name:</strong>
          <span>${bio.fullName && bio.fullName.trim() !== '' ? bio.fullName : 'Classified'}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Publisher:</strong>
          <span>${bio.publisher || 'Independent'}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Alignment:</strong>
          <span class="badge-status">${(bio.alignment || 'neutral').toUpperCase()}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Height / Weight:</strong>
          <span>${appearance.height?.[1] || '-'} / ${appearance.weight?.[1] || '-'}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Place of Birth:</strong>
          <span>${bio.placeOfBirth || 'Unknown'}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Occupation:</strong>
          <span>${work.occupation || 'Unknown'}</span>
        </div>
        <div class="hero-dossier__field">
          <strong>Affiliations:</strong>
          <span>${connections.groupAffiliation || 'None registered'}</span>
        </div>
      </div>

      <div class="hero-dossier__stats">
        <div class="hero-dossier__avatar-wrapper">
          <img src="${hero.images?.lg || hero.images?.md || hero.images?.sm}" alt="${hero.name}">
        </div>

        <div class="stats-container">
          <h4 class="stats-container__heading">Power Level Metrics</h4>
          ${renderStatBar('Intelligence', stats.intelligence)}
          ${renderStatBar('Strength', stats.strength)}
          ${renderStatBar('Speed', stats.speed)}
          ${renderStatBar('Durability', stats.durability)}
          ${renderStatBar('Power', stats.power)}
          ${renderStatBar('Combat', stats.combat)}
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  
  const closeBtn = document.getElementById('modal-close');
  if (closeBtn) {
    closeBtn.onclick = closeHeroModal;
  }
}

function closeHeroModal() {
  const modal = document.getElementById('hero-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}


function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') applyFilters();
    });
  }

  if (btnSearch) btnSearch.addEventListener('click', applyFilters);
  if (orderSelect) orderSelect.addEventListener('change', applyFilters);
  if (genderSelect) genderSelect.addEventListener('change', applyFilters);
  if (publisherSelect) publisherSelect.addEventListener('change', applyFilters);

  if (btnFirst) btnFirst.addEventListener('click', () => goToPage(1));
  if (btnPrev) btnPrev.addEventListener('click', () => goToPage(currentPage - 1));
  if (btnNext) btnNext.addEventListener('click', () => goToPage(currentPage + 1));
  if (btnLast) btnLast.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredHeroes.length / itemsPerPage) || 1;
    goToPage(totalPages);
  });

  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeHeroModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHeroModal();
  });
}

document.addEventListener('DOMContentLoaded', fetchHeroes);