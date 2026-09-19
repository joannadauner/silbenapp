// ------------------------------------
// GRUNDEINSTELLUNGEN
// ------------------------------------

const SESSION_LENGTH = 15;
const MAX_SESSION_LENGTH = 20;

let currentPosition = 0;
let sessionQueue = [];
let weeks = [];
let currentWeekIndex = 0;


// ------------------------------------
// BILDSCHIRME WECHSELN
// ------------------------------------

function showScreen(screenId) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    document
        .getElementById(screenId)
        .classList.add("active");
}


// ------------------------------------
// WOCHEN LADEN UND SPEICHERN
// ------------------------------------

function loadWeeks() {

    const savedWeeks =
        localStorage.getItem("readingWeeks");

    if (savedWeeks) {

        weeks = JSON.parse(savedWeeks);

    } else {

        weeks = [
            ["ma", "mi", "mo", "mu"]
        ];

    }

    const savedCurrentWeek = localStorage.getItem("readingCurrentWeek");
    const savedIndex = Number(savedCurrentWeek);
    currentWeekIndex = savedCurrentWeek !== null &&
        Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < weeks.length
        ? savedIndex
        : Math.max(0, weeks.length - 1);
}


function saveWeeks() {

    localStorage.setItem(
        "readingWeeks",
        JSON.stringify(weeks)
    );

    localStorage.setItem("readingCurrentWeek", String(currentWeekIndex));
}


// ------------------------------------
// WOCHEN ANZEIGEN
// ------------------------------------

function renderWeeks() {

    const container =
        document.getElementById("weeks-container");

    container.innerHTML = "";

    weeks.forEach((week, index) => {

        const div =
            document.createElement("div");

        div.className = "week";

        div.innerHTML = `
            <label>
                Woche ${index + 1}
            </label>

            <input
                type="text"
                value="${week.join(", ")}"
                data-week="${index}"
                placeholder="ma, mi, mo, mu"
            >
        `;

        container.appendChild(div);

    });

    const currentWeekSelect = document.getElementById("current-week");
    currentWeekSelect.innerHTML = "";
    weeks.forEach((week, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = `Woche ${index + 1}`;
        currentWeekSelect.appendChild(option);
    });
    currentWeekSelect.value = String(currentWeekIndex);
}


// ------------------------------------
// NEUE WOCHE
// ------------------------------------

function addWeek() {

    readWeeksFromForm();

    weeks.push([]);

    renderWeeks();
}


// ------------------------------------
// EINGABEN AUSLESEN
// ------------------------------------

function readWeeksFromForm() {

    currentWeekIndex = Number(document.getElementById("current-week").value);

    const inputs =
        document.querySelectorAll(
            "#weeks-container input"
        );

    weeks = Array.from(inputs).map(input => {

        return input.value
            .split(",")
            .map(
                syllable =>
                    syllable
                        .trim()
                        .toLowerCase()
            )
            .filter(
                syllable =>
                    syllable.length > 0
            );

    });
}


// ------------------------------------
// ZUFÄLLIGES ELEMENT
// ------------------------------------

function randomItem(array) {

    return array[
        Math.floor(
            Math.random() * array.length
        )
    ];
}


// ------------------------------------
// SCHREIBWEISE FESTLEGEN
// ------------------------------------

function formatSyllable(syllable) {

    const useCapitalLetter =
        Math.random() < 0.5;

    if (useCapitalLetter) {

        return (
            syllable.charAt(0).toUpperCase() +
            syllable.slice(1).toLowerCase()
        );

    }

    return syllable.toLowerCase();
}


// ------------------------------------
// ÜBUNGSRUNDE ERZEUGEN
// ------------------------------------

function createSession() {

    const currentWeek =
        weeks[currentWeekIndex] || [];

    const olderWeeks =
        weeks
            .slice(0, currentWeekIndex)
            .flat();

    const allSyllables =
        weeks.slice(0, currentWeekIndex + 1).flat();

    if (allSyllables.length === 0) {

        alert(
            "Bitte zuerst Silben eintragen."
        );

        return false;
    }

    sessionQueue = [];

    let lastSyllable = null;

    for (
        let i = 0;
        i < SESSION_LENGTH;
        i++
    ) {

        let pool;

        const chooseCurrentWeek =
            Math.random() < 0.6;

        if (
            chooseCurrentWeek &&
            currentWeek.length > 0
        ) {

            pool = currentWeek;

        } else if (
            olderWeeks.length > 0
        ) {

            pool = olderWeeks;

        } else {

            pool = allSyllables;

        }

        let syllable =
            randomItem(pool);

        let attempts = 0;

        while (
            syllable === lastSyllable &&
            pool.length > 1 &&
            attempts < 10
        ) {

            syllable =
                randomItem(pool);

            attempts++;

        }

        const formattedSyllable =
            formatSyllable(syllable);

        sessionQueue.push(
            formattedSyllable
        );

        lastSyllable = syllable;
    }

    currentPosition = 0;

    return true;
}


// ------------------------------------
// AKTUELLE SILBE ANZEIGEN
// ------------------------------------

function showCurrentSyllable() {

    const syllable =
        sessionQueue[currentPosition];

    document
        .getElementById("syllable-card")
        .textContent =
            syllable;

    document
        .getElementById("progress")
        .textContent =
            `Aufgabe ${currentPosition + 1} / max. ${MAX_SESSION_LENGTH}`;
}


// ------------------------------------
// RICHTIG
// ------------------------------------

function answerCorrect() {

    currentPosition++;

    continueSession();
}


// ------------------------------------
// SPÄTER NOCH EINMAL
// ------------------------------------

function repeatLater() {

    const syllable =
        sessionQueue[currentPosition];

    const distance =
        Math.floor(
            Math.random() * 3
        ) + 3;

    const newPosition =
        Math.min(
            currentPosition + distance + 1,
            sessionQueue.length
        );

    // Die bereits formatierte Silbe unverändert wiederholen.
    sessionQueue.splice(
        newPosition,
        0,
        syllable
    );

    currentPosition++;

    continueSession();
}


// ------------------------------------
// RUNDE FORTSETZEN
// ------------------------------------

function continueSession() {

    if (
        currentPosition >= sessionQueue.length ||
        currentPosition >= MAX_SESSION_LENGTH
    ) {

        showScreen(
            "finish-screen"
        );

        return;
    }

    showCurrentSyllable();
}


// ------------------------------------
// ÜBUNG STARTEN
// ------------------------------------

function startPractice() {

    readWeeksFromForm();

    saveWeeks();

    const success =
        createSession();

    if (!success) {
        return;
    }

    showScreen(
        "practice-screen"
    );

    showCurrentSyllable();
}


// ------------------------------------
// BUTTONS
// ------------------------------------

document
    .getElementById("start-button")
    .addEventListener(
        "click",
        startPractice
    );


document
    .getElementById("settings-button")
    .addEventListener(
        "click",
        () => {

            renderWeeks();

            showScreen(
                "settings-screen"
            );

        }
    );


document
    .getElementById("add-week-button")
    .addEventListener(
        "click",
        addWeek
    );


document
    .getElementById("save-settings-button")
    .addEventListener(
        "click",
        () => {

            readWeeksFromForm();

            saveWeeks();

            showScreen(
                "start-screen"
            );

        }
    );


document
    .getElementById("back-button")
    .addEventListener(
        "click",
        () => {

            showScreen(
                "start-screen"
            );

        }
    );


document
    .getElementById("correct-button")
    .addEventListener(
        "click",
        answerCorrect
    );


document
    .getElementById("again-button")
    .addEventListener(
        "click",
        repeatLater
    );


document
    .getElementById("dont-know-button")
    .addEventListener(
        "click",
        repeatLater
    );


document
    .getElementById("restart-button")
    .addEventListener(
        "click",
        startPractice
    );


document
    .getElementById("finish-home-button")
    .addEventListener(
        "click",
        () => {

            showScreen(
                "start-screen"
            );

        }
    );


// ------------------------------------
// APP STARTEN
// ------------------------------------

loadWeeks();
renderWeeks();
