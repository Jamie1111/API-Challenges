document.addEventListener('DOMContentLoaded', () => {
    // Initialiseer functionaliteit voor de Homepagina (alleen als het de index.html is)
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        fetchCountries();
    }

    // Slide-in Menu
    const hamburgerButton = document.getElementById('hamburger-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const sideMenu = document.getElementById('sideMenu');

    if (hamburgerButton && sideMenu) {
        hamburgerButton.addEventListener('click', () => {
            sideMenu.classList.remove('translate-x-full');
            sideMenu.classList.add('translate-x-0');
        });
    }

    if (closeMenuButton && sideMenu) {
        closeMenuButton.addEventListener('click', () => {
            sideMenu.classList.remove('translate-x-0');
            sideMenu.classList.add('translate-x-full');
        });
    }

    document.addEventListener('click', (event) => {
        if (sideMenu && !sideMenu.contains(event.target) && hamburgerButton && !hamburgerButton.contains(event.target) && sideMenu.classList.contains('translate-x-0')) {
            sideMenu.classList.remove('translate-x-0');
            sideMenu.classList.add('translate-x-full');
        }
    });

    // Raad het Land Spel
    let allCountries = [];
    let correctCountry = null;
    let guessCount = 0;
    const maxGuesses = 3;

    const hint1Text = document.getElementById('hint1-text');
    const hint2Text = document.getElementById('hint2-text');
    const hint3FlagContainer = document.getElementById('hint3-flag-container');
    const countryFlagImg = document.getElementById('country-flag');

    const guessInput = document.getElementById('guess-input');
    const submitGuessButton = document.getElementById('submit-guess-button');
    const gameMessage = document.getElementById('game-message');
    const resetGameButton = document.getElementById('reset-game-button');

    async function initializeGame() {
        guessCount = 0;
        correctCountry = null;
        gameMessage.textContent = '';
        gameMessage.classList.remove('text-green-600', 'text-red-600');
        guessInput.value = '';
        guessInput.disabled = false;
        submitGuessButton.disabled = false;
        resetGameButton.classList.add('hidden');

        if (hint1Text) hint1Text.textContent = 'Laden van het spel...';
        if (hint2Text) {
            hint2Text.textContent = '';
            hint2Text.classList.add('hidden');
        }
        if (hint3FlagContainer) {
            hint3FlagContainer.classList.add('hidden');
        }
        if (countryFlagImg) countryFlagImg.src = '';

        if (allCountries.length === 0) {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                allCountries = await response.json();
                startGame();
            } catch (error) {
                console.error('Fout bij het laden van landen voor het spel:', error);
                if (hint1Text) hint1Text.textContent = 'Fout bij het laden van landen. Probeer later opnieuw.';
                if (submitGuessButton) submitGuessButton.disabled = true;
            }
        } else {
            startGame();
        }
    }

    function startGame() {
        const playableCountries = allCountries.filter(country =>
            country.population && country.capital && country.capital.length > 0 && country.flags && country.flags.svg
        );

        if (playableCountries.length === 0) {
            if (hint1Text) hint1Text.textContent = 'Geen speelbare landen gevonden.';
            return;
        }

        const randomIndex = Math.floor(Math.random() * playableCountries.length);
        correctCountry = playableCountries[randomIndex];

        if (hint1Text) hint1Text.textContent = `Hint 1: Dit land heeft ongeveer ${correctCountry.population.toLocaleString()} inwoners.`;
    }

    function checkGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            gameMessage.textContent = "Voer een gok in!";
            gameMessage.classList.remove('text-green-600');
            gameMessage.classList.add('text-red-600');
            return;
        }

        const normalizedCorrectName = correctCountry.name.common.toLowerCase();
        const normalizedUserGuess = userGuess.toLowerCase();

        if (normalizedUserGuess === normalizedCorrectName ||
            (correctCountry.capital && normalizedUserGuess === correctCountry.capital[0].toLowerCase())) {
            gameMessage.textContent = `🎉 Goed geraden! Het land is "${correctCountry.name.common}".`;
            gameMessage.classList.remove('text-red-600');
            gameMessage.classList.add('text-green-600');
            endGame(true);
        } else {
            guessCount++;
            if (guessCount === 1) {
                if (hint2Text) {
                    hint2Text.textContent = `Hint 2: De hoofdstad is "${correctCountry.capital[0]}".`;
                    hint2Text.classList.remove('hidden');
                }
                gameMessage.textContent = "Nog een poging!";
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
            } else if (guessCount === 2) {
                if (hint3FlagContainer) hint3FlagContainer.classList.remove('hidden');
                if (countryFlagImg) countryFlagImg.src = correctCountry.flags.svg;
                gameMessage.textContent = "Laatste kans!";
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
            } else {
                gameMessage.textContent = `Helaas! Het land was "${correctCountry.name.common}".`;
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
                endGame(false);
            }
        }
    }

    function endGame(won) {
        guessInput.disabled = true;
        submitGuessButton.disabled = true;
        resetGameButton.classList.remove('hidden');
    }

    if (document.getElementById('game-container')) {
        initializeGame();
        submitGuessButton?.addEventListener('click', checkGuess);
        guessInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') checkGuess();
        });
        resetGameButton?.addEventListener('click', initializeGame);
    }

    // ✅ Aangepaste versie: Promise.all met 2 fetch-aanroepen
    async function fetchCountries() {
        const countryListDiv = document.getElementById('country-list');
        if (!countryListDiv) return;

        countryListDiv.innerHTML = '<p class="text-gray-600 col-span-full">Laden van landen...</p>';

        try {
            const [countriesResponse, capitalsResponse] = await Promise.all([
                fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population'),
                fetch('https://restcountries.com/v3.1/all?fields=capital')
            ]);

            if (!countriesResponse.ok || !capitalsResponse.ok) {
                throw new Error('Eén van de API-aanroepen is mislukt.');
            }

            const countries = await countriesResponse.json();
            displayCountries(countries);
        } catch (error) {
            console.error('Fout bij het ophalen van landen:', error);
            countryListDiv.innerHTML = '<p class="text-red-500 col-span-full">Er is een fout opgetreden bij het laden van de landen.</p>';
        }
    }

    function displayCountries(countries) {
        const countryListDiv = document.getElementById('country-list');
        if (!countryListDiv) return;

        countryListDiv.innerHTML = '';
        if (countries.length === 0) {
            countryListDiv.innerHTML = '<p class="text-gray-600 col-span-full">Geen landen gevonden.</p>';
            return;
        }

        countries.forEach(country => {
            const countryCard = document.createElement('div');
            countryCard.classList.add('country-card', 'bg-white', 'rounded-lg', 'shadow-md', 'p-6', 'text-center', 'transform', 'transition', 'duration-300', 'hover:scale-105');
            countryCard.innerHTML = `
                <img src="${country.flags.svg}" alt="Vlag van ${country.name.common}" class="w-24 h-16 mx-auto mb-4 object-contain">
                <h3 class="text-xl font-bold text-blue-700 mb-2">${country.name.common}</h3>
                <p class="text-gray-700 text-sm">Hoofdstad: ${country.capital?.[0] ?? 'N/A'}</p>
                <p class="text-gray-700 text-sm">Regio: ${country.region ?? 'N/A'}</p>
                <p class="text-gray-700 text-sm">Bevolking: ${country.population?.toLocaleString() ?? 'N/A'}</p>
            `;
            countryListDiv.appendChild(countryCard);
        });
    }

    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.searchCountry = async function () {
            const searchInput = document.getElementById('search-input');
            const countryListDiv = document.getElementById('country-list');

            if (!searchInput || !countryListDiv) return;

            const searchTerm = searchInput.value.trim();
            countryListDiv.innerHTML = '<p class="text-gray-600 col-span-full">Zoeken...</p>';

            if (searchTerm === '') {
                fetchCountries();
                return;
            }

            try {
                const response = await fetch(`https://restcountries.com/v3.1/name/${searchTerm}?fields=name,flags,capital,region,population`);
                if (!response.ok) {
                    if (response.status === 404) {
                        countryListDiv.innerHTML = `<p class="text-gray-600 col-span-full">Geen landen gevonden met de naam "${searchTerm}".</p>`;
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const countries = await response.json();
                displayCountries(countries);
            } catch (error) {
                console.error('Fout bij het zoeken naar landen:', error);
                countryListDiv.innerHTML = '<p class="text-red-500 col-span-full">Er is een fout opgetreden bij het zoeken.</p>';
            }
        };
    }
});
