const IDH_DATA_URL = 'settings/paises.json';

const feedbackElement = document.getElementById('idh-feedback');
const highestListElement = document.getElementById('highest-idh-list');
const lowestListElement = document.getElementById('lowest-idh-list');

function createFeedbackMessage(message, type = 'info') {
  if (!feedbackElement) {
    return;
  }

  feedbackElement.textContent = message;
  feedbackElement.className = 'feedback-message';
  feedbackElement.classList.add(type === 'error' ? 'feedback-error' : 'feedback-info');
}

function parseIdhValue(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    return Number(normalized);
  }

  return NaN;
}

function normalizeCountryRecord(rawRecord) {
  if (!rawRecord || typeof rawRecord !== 'object') {
    return null;
  }

  const country = String(rawRecord.pais ?? '').trim();
  const idh = parseIdhValue(rawRecord.idh);

  if (!country || Number.isNaN(idh)) {
    return null;
  }

  return {
    pais: country,
    idh,
    caminho_bandeira: String(rawRecord.caminho_bandeira ?? '').trim() || 'imgs/placeholder.png',
    pib: String(rawRecord.pib ?? 'N/A').trim(),
  };
}

function extractCountriesFromJson(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object') {
    return Object.values(data);
  }

  return [];
}

function sortByIdhDescending(countries) {
  return [...countries].sort((first, second) => second.idh - first.idh);
}

function createRankingItem(country, rank) {
  const item = document.createElement('div');
  item.className = 'ranking-item';

  item.innerHTML = `
    <span class="rank-number">#${rank}</span>
    <img src="${country.caminho_bandeira}" alt="Bandeira de ${country.pais}" class="flag-icon" />
    <div class="country-details">
      <span class="country-name">${country.pais}</span>
      <span class="country-metrics">IDH: <strong>${country.idh.toFixed(3).replace('.', ',')}</strong> <span class="divider"></span> PIB: ${country.pib}</span>
    </div>
  `;

  return item;
}

function renderCountries(container, countries) {
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!countries.length) {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'feedback-message feedback-info';
    emptyMessage.textContent = 'Nenhum país com IDH válido foi encontrado.';
    container.appendChild(emptyMessage);
    return;
  }

  countries.forEach((country, index) => {
    container.appendChild(createRankingItem(country, index + 1));
  });
}

async function loadIdhData() {
  const response = await fetch(IDH_DATA_URL, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Falha ao carregar o arquivo: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function initializeIdhPage() {
  try {

    const rawData = await loadIdhData();
    const countryRecords = extractCountriesFromJson(rawData);
    const validCountries = countryRecords
      .map(normalizeCountryRecord)
      .filter((country) => country !== null);

    if (!validCountries.length) {
      throw new Error('O arquivo JSON não contém registros válidos de países.');
    }

    const sortedCountries = sortByIdhDescending(validCountries);
    renderCountries(highestListElement, sortedCountries);
    renderCountries(lowestListElement, [...sortedCountries].reverse());
  } catch (error) {
    console.error('Erro ao inicializar a página de IDH:', error);
    createFeedbackMessage(
      'Não foi possível carregar os dados de IDH. Verifique a conexão ou o arquivo settings/paises.json.',
      'error'
    );
  }
}

initializeIdhPage();
