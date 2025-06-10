document.addEventListener('DOMContentLoaded', () => {
    // Initialiseer functionaliteit voor de Homepagina (alleen als het de index.html is)
    // Controleer of we op de index.html pagina zijn via de URL, niet alleen een element
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        fetchCountries();
    }

    // --- Slide-in Menu functionaliteit ---
    const hamburgerButton = document.getElementById('hamburger-button');
    const closeMenuButton = document.getElementById('close-menu-button');
    const sideMenu = document.getElementById('sideMenu');

    // Zorg ervoor dat de hamburgernop en het menu bestaan voordat je event listeners toevoegt
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

    // Sluit menu bij klik buiten het menu
    document.addEventListener('click', (event) => {
        if (sideMenu && !sideMenu.contains(event.target) && hamburgerButton && !hamburgerButton.contains(event.target) && sideMenu.classList.contains('translate-x-0')) {
            sideMenu.classList.remove('translate-x-0');
            sideMenu.classList.add('translate-x-full');
        }
    });
    // --- Einde Slide-in Menu functionaliteit ---


    // --- Raad het Land Spel Functionaliteit ---
    let allCountries = [];
    let correctCountry = null;
    let guessCount = 0;
    const maxGuesses = 3;

    // Elementen voor de hints
    const hint1Text = document.getElementById('hint1-text');
    const hint2Text = document.getElementById('hint2-text');
    const hint3FlagContainer = document.getElementById('hint3-flag-container');
    const countryFlagImg = document.getElementById('country-flag');

    const guessInput = document.getElementById('guess-input');
    const submitGuessButton = document.getElementById('submit-guess-button');
    const gameMessage = document.getElementById('game-message');
    const resetGameButton = document.getElementById('reset-game-button');

    // Functie om het spel te initialiseren of te resetten
    async function initializeGame() {
        guessCount = 0;
        correctCountry = null;
        gameMessage.textContent = '';
        gameMessage.classList.remove('text-green-600', 'text-red-600'); // Reset kleur
        guessInput.value = '';
        guessInput.disabled = false;
        submitGuessButton.disabled = false;
        resetGameButton.classList.add('hidden');

        // Reset hint weergave
        // Belangrijk: Wis de textContent van de individuele hints, NIET de hele container
        if (hint1Text) hint1Text.textContent = '';
        if (hint2Text) {
            hint2Text.textContent = '';
            hint2Text.classList.add('hidden'); // Verberg hint 2 initieel
        }
        if (hint3FlagContainer) {
            hint3FlagContainer.classList.add('hidden'); // Verberg vlag container initieel
        }
        if (countryFlagImg) countryFlagImg.src = ''; // Wis de vlag

        // Toon een laadtekst in de eerste hintregel
        if (hint1Text) hint1Text.textContent = 'Laden van het spel...';

        if (allCountries.length === 0) {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                allCountries = await response.json();
                console.log("Alle landen geladen voor het spel.");
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

    // Functie om een nieuw spel te starten
    function startGame() {
        if (allCountries.length === 0) {
            if (hint1Text) hint1Text.textContent = 'Geen landen beschikbaar om te raden.';
            return;
        }

        // Filter landen zonder populatie, hoofdstad, of vlag voor betere speelbaarheid
        const playableCountries = allCountries.filter(country =>
            country.population !== undefined && country.population !== null && country.population > 0 &&
            country.capital && country.capital.length > 0 &&
            country.flags && country.flags.svg
        );

        if (playableCountries.length === 0) {
            if (hint1Text) hint1Text.textContent = 'Geen speelbare landen gevonden (missen data).';
            return;
        }

        const randomIndex = Math.floor(Math.random() * playableCountries.length);
        correctCountry = playableCountries[randomIndex];
        console.log("Correct land:", correctCountry.name.common); // DEBUG: Zorg ervoor dat je dit verwijdert in productie!

        // Toon de eerste hint
        if (hint1Text) hint1Text.textContent = `Hint 1: Dit land heeft ongeveer ${correctCountry.population ? correctCountry.population.toLocaleString() : 'onbekend'} inwoners.`;
        if (hint2Text) hint2Text.classList.add('hidden'); // Zorg dat deze verborgen blijft
        if (hint3FlagContainer) hint3FlagContainer.classList.add('hidden'); // Zorg dat deze verborgen blijft
    }

    // Functie om de gok te controleren
    function checkGuess() {
        const userGuess = guessInput.value.trim();
        if (!userGuess) {
            gameMessage.textContent = "Voer een gok in!";
            gameMessage.classList.remove('text-green-600');
            gameMessage.classList.add('text-red-600');
            return;
        }

        // Normaliseer de namen voor vergelijking (bijv. "Verenigde Staten" vs "verenigde staten")
        const normalizedCorrectName = correctCountry.name.common.toLowerCase();
        const normalizedUserGuess = userGuess.toLowerCase();

        if (normalizedUserGuess === normalizedCorrectName ||
            (correctCountry.capital && correctCountry.capital.length > 0 && normalizedUserGuess === correctCountry.capital[0].toLowerCase())) {
            // Goed geraden!
            gameMessage.textContent = `🎉 Goed geraden! Het land is "${correctCountry.name.common}".`;
            gameMessage.classList.remove('text-red-600');
            gameMessage.classList.add('text-green-600');
            endGame(true);
        } else {
            // Fout geraden
            guessCount++;
            if (guessCount === 1) {
                // Tweede hint: Hoofdstad
                if (hint2Text) {
                    hint2Text.textContent = `Hint 2: De hoofdstad is "${correctCountry.capital && correctCountry.capital.length > 0 ? correctCountry.capital[0] : 'N/A'}".`;
                    hint2Text.classList.remove('hidden'); // Toon de tweede hint
                }
                gameMessage.textContent = "Nog een poging!";
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
            } else if (guessCount === 2) {
                // Derde hint: Vlag
                if (hint3FlagContainer) hint3FlagContainer.classList.remove('hidden'); // Toon de vlag container
                if (countryFlagImg) countryFlagImg.src = correctCountry.flags.svg;
                gameMessage.textContent = "Laatste kans!";
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
            } else {
                // Alle pogingen opgebruikt, spel voorbij
                gameMessage.textContent = `Helaas! Het land was "${correctCountry.name.common}".`;
                gameMessage.classList.remove('text-green-600');
                gameMessage.classList.add('text-red-600');
                endGame(false);
            }
        }
    }

    // Functie om het spel te beëindigen
    function endGame(won) {
        if (guessInput) guessInput.disabled = true;
        if (submitGuessButton) submitGuessButton.disabled = true;
        if (resetGameButton) resetGameButton.classList.remove('hidden'); // Toon de reset knop
    }

    // Event listeners toevoegen voor het spel
    // Controleer of we op de raadhetland.html pagina zijn voordat we initialiseren
    if (document.getElementById('game-container')) {
        initializeGame();
        if (submitGuessButton) submitGuessButton.addEventListener('click', checkGuess);
        if (guessInput) {
            guessInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    checkGuess();
                }
            });
        }
        if (resetGameButton) resetGameButton.addEventListener('click', initializeGame);
    }
    // --- Einde Raad het Land Spel Functionaliteit ---


    // Functies voor de Landen Informatie pagina (relevant voor index.html)
    async function fetchCountries() {
        const countryListDiv = document.getElementById('country-list');
        if (countryListDiv) { // Voeg null-check toe
            countryListDiv.innerHTML = '<p class="text-gray-600 col-span-full">Laden van landen...</p>';
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,capital,region,population');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const countries = await response.json();
                displayCountries(countries);
            } catch (error) {
                console.error('Fout bij het ophalen van landen:', error);
                countryListDiv.innerHTML = '<p class="text-red-500 col-span-full">Er is een fout opgetreden bij het laden van de landen.</p>';
            }
        }
    }

    // Functie om landen weer te geven in de UI (relevant voor index.html)
    function displayCountries(countries) {
        const countryListDiv = document.getElementById('country-list');
        if (countryListDiv) { // Voeg null-check toe
            countryListDiv.innerHTML = ''; // Maak de lijst leeg

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
                    <p class="text-gray-700 text-sm">Hoofdstad: ${country.capital && country.capital.length > 0 ? country.capital[0] : 'N/A'}</p>
                    <p class="text-gray-700 text-sm">Regio: ${country.region ? country.region : 'N/A'}</p>
                    <p class="text-gray-700 text-sm">Bevolking: ${country.population ? country.population.toLocaleString() : 'N/A'}</p>
                `;
                countryListDiv.appendChild(countryCard);
            });
        }
    }

    // Functie om een land te zoeken op naam (relevant voor index.html)
    // Moet globaal zijn of in de DOMContentLoaded scope van index.html
    // Aangezien dit in main.js staat en zowel index.html als raadhetland.html main.js gebruiken,
    // zorg ervoor dat searchCountry alleen wordt aangeroepen op index.html
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        window.searchCountry = async function() { // Maak het globaal voor onclick
            const searchInput = document.getElementById('search-input');
            const countryListDiv = document.getElementById('country-list');

            if (!searchInput || !countryListDiv) return; // Exit if elements not found

            const searchTerm = searchInput.value.trim();
            countryListDiv.innerHTML = '<p class="text-gray-600 col-span-full">Zoeken...</p>';

            if (searchTerm === '') {
                fetchCountries(); // Als zoekveld leeg is, toon alle landen weer
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
        }
    }


    // Voorbeeld van Promise.all() voor de rubric (relevant voor index.html)
    // Aangezien dit niet direct aan een UI-element gekoppeld is, en alleen logt, kan het hier blijven
    // maar het is goed om te bedenken waar dit thuishoort in een groter project.
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        fetchMultipleDataSources();
    }
    async function fetchMultipleDataSources() {
        try {
            const [countriesResponse, dummyApiResponse] = await Promise.all([
                fetch('https://restcountries.com/v3.1/all?fields=name'),
                new Promise(resolve => setTimeout(() => resolve({ message: 'Dit is dummy data van een gesimuleerde tweede API-aanroep.' }), 1000))
            ]);

            const countries = await countriesResponse.json();
            const dummyData = await dummyApiResponse.json();

            console.log("Landen data geladen via Promise.all (eerste 5):", countries.slice(0, 5));
            console.log("Dummy data geladen via Promise.all:", dummyData);

        } catch (error) {
            console.error('Fout bij het gelijktijdig ophalen van data (Promise.all):', error);
        }
    }
});