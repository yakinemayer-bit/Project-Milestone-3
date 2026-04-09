// ====== CONFIG ======
const TMDB_API_KEY = 'b6820c2c194286755bb49fe79e9227b'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w200';

const RESULTS_PER_VIEW = 10; // 10 items per page view
const MAX_RESULTS = 50;      // first 50 results

// State for search
let searchState = {
  query: '',
  page: 1,           // TMDB page index
  viewPage: 1,       // 1–5 within our 50 results
  totalResults: 0,
  movies: []         // up to 50 movies
};

// State for collection
let collectionState = {
  page: 1,
  totalResults: 0,
  movies: []
};

$(document).ready(function () {
  // Navigation
  $('#nav-search').on('click', function () {
    setNav('search');
  });

  $('#nav-collection').on('click', function () {
    setNav('collection');
    if (!collectionState.movies.length) {
      loadCollection(1);
    }
  });

  // Search events
  $('#btnSearch').on('click', function () {
    const term = $('#searchTerm').val().trim();
    if (!term) {
      $('#search-results').html('<p>Please enter a movie title.</p>');
      $('#search-pagination').hide();
      return;
    }
    searchMovies(term, 1);
  });

  $('#search-prev').on('click', function () {
    changeSearchViewPage(searchState.viewPage - 1);
  });

  $('#search-next').on('click', function () {
    changeSearchViewPage(searchState.viewPage + 1);
  });

  // Collection pagination
  $('#collection-prev').on('click', function () {
    changeCollectionPage(collectionState.page - 1);
  });

  $('#collection-next').on('click', function () {
    changeCollectionPage(collectionState.page + 1);
  });

  // Event delegation for clicking movie cards (both search + collection)
  $('#search-results').on('click', '.movie-card', function () {
    const id = $(this).data('id');
    loadDetails(id);
  });

  $('#collection-results').on('click', '.movie-card', function () {
    const id = $(this).data('id');
    loadDetails(id);
  });
});

// ====== Navigation handling ======
function setNav(section) {
  if (section === 'search') {
    $('#search-section').show();
    $('#collection-section').hide();
    $('#nav-search').addClass('active');
    $('#nav-collection').removeClass('active');
  } else {
    $('#search-section').hide();
    $('#collection-section').show();
    $('#nav-search').removeClass('active');
    $('#nav-collection').addClass('active');
  }
}

// ====== Search movies ======
function searchMovies(query, page) {
  searchState.query = query;
  searchState.page = page;
  searchState.viewPage = 1;

  const url = `${TMDB_BASE_URL}/search/movie`;
  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY,
      query: query,
      page: page,
      include_adult: false
    }
  }).done(function (data) {
    // data.results is up to 20 per TMDB page. We need first 50 overall.
    const results = data.results || [];
    searchState.totalResults = Math.min(data.total_results || 0, MAX_RESULTS);
    searchState.movies = results.slice(0, MAX_RESULTS); // for 1 page we're ok

    renderSearchPageView();
  }).fail(function () {
    $('#search-results').html('<p>Error loading search results.</p>');
    $('#search-pagination').hide();
  });
}

function changeSearchViewPage(newViewPage) {
  if (newViewPage < 1 || newViewPage > 5) return;
  searchState.viewPage = newViewPage;
  renderSearchPageView();
}

// Show 10 results per viewPage, up to 5 pages = 50 results
function renderSearchPageView() {
  const $container = $('#search-results');
  $container.empty();

  if (!searchState.movies.length) {
    $container.html('<p>No results found.</p>');
    $('#search-pagination').hide();
    return;
  }

  const startIndex = (searchState.viewPage - 1) * RESULTS_PER_VIEW;
  const endIndex = startIndex + RESULTS_PER_VIEW;
  const slice = searchState.movies.slice(startIndex, endIndex);

  slice.forEach(movie => {
    const title = movie.title || 'No title';
    const posterPath = movie.poster_path
      ? TMDB_IMG_BASE + movie.poster_path
      : '';
    const card = `
      <div class="movie-card" data-id="${movie.id}">
        ${
          posterPath
            ? `<img src="${posterPath}" alt="${title} poster" />`
            : ''
        }
        <div class="movie-card-title">${title}</div>
      </div>
    `;
    $container.append(card);
  });

  $('#search-pagination').show();
  $('#search-page-info').text(`Page ${searchState.viewPage} of 5`);

  $('#search-prev').prop('disabled', searchState.viewPage === 1);
  $('#search-next').prop('disabled', searchState.viewPage === 5);
}

// Collection (Popular Movies)
function loadCollection(page) {
  const url = `${TMDB_BASE_URL}/movie/popular`; // popular movies endpoint[web:32]

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY,
      page: page
    }
  }).done(function (data) {
    collectionState.page = data.page || 1;
    collectionState.totalResults = data.total_results || 0;
    collectionState.movies = (data.results || []).slice(0, RESULTS_PER_VIEW);
    renderCollection();
  }).fail(function () {
    $('#collection-results').html('<p>Error loading popular movies.</p>');
    $('#collection-pagination').hide();
  });
}

function changeCollectionPage(newPage) {
  if (newPage < 1) return;
  loadCollection(newPage);
}

function renderCollection() {
  const $container = $('#collection-results');
  $container.empty();

  if (!collectionState.movies.length) {
    $container.html('<p>No movies found.</p>');
    $('#collection-pagination').hide();
    return;
  }

  collectionState.movies.forEach(movie => {
    const title = movie.title || 'No title';
    const posterPath = movie.poster_path
      ? TMDB_IMG_BASE + movie.poster_path
      : '';
    const card = `
      <div class="movie-card" data-id="${movie.id}">
        ${
          posterPath
            ? `<img src="${posterPath}" alt="${title} poster" />`
            : ''
        }
        <div class="movie-card-title">${title}</div>
      </div>
    `;
    $container.append(card);
  });

  $('#collection-pagination').show();
  $('#collection-page-info').text(`TMDB page ${collectionState.page}`);

  $('#collection-prev').prop('disabled', collectionState.page === 1);
  $('#collection-next').prop('disabled', false);
}

// ====== Movie details ======
function loadDetails(movieId) {
  const url = `${TMDB_BASE_URL}/movie/${movieId}`; // movie details endpoint[web:28][web:33]

  $.ajax({
    url: url,
    method: 'GET',
    data: {
      api_key: TMDB_API_KEY
    }
  }).done(function (data) {
    renderDetails(data);
  }).fail(function () {
    $('#details-content').html('<p>Error loading movie details.</p>');
  });
}

function renderDetails(movie) {
  const title = movie.title || 'No title';
  const overview = movie.overview || 'No overview available.';
  const release = movie.release_date || 'Unknown';
  const rating =
    typeof movie.vote_average === 'number'
      ? movie.vote_average.toFixed(1)
      : 'N/A';
  const posterPath = movie.poster_path
    ? TMDB_IMG_BASE + movie.poster_path
    : '';

  const html = `
    ${posterPath ? `<img src="${posterPath}" alt="${title} poster" />` : ''}
    <h3>${title}</h3>
    <p><strong>Release Date:</strong> ${release}</p>
    <p><strong>Rating:</strong> ${rating}</p>
    <p><strong>Overview:</strong></p>
    <p>${overview}</p>
  `;

  $('#details-content').html(html);
}
