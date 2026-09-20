// ------------------------------------
// GRUNDEINSTELLUNGEN
// ------------------------------------

const SESSION_LENGTH = 15;
const MAX_SESSION_LENGTH = 20;
const MAX_CARRIED_REPEATS = 5;
const ANSWER_FEEDBACK_MS = 1000;

let pendingRepeats = new Set();
let sessionActive = false;
let answerFeedbackTimer = null;
let hadUncertainAnswer = false;
let sessionUnresolved = new Set();

let currentPosition = 0;
let sessionProgress = 0;
let sessionQueue = [];
let weeks = [];
let currentWeekIndex = 0;
let selectedWeeks = [];


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

    alignTextToNotebook();
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

    // Bisherige Auswahl einmalig in Checkboxen übernehmen.
    let savedSelection = null;
    try {
        savedSelection = JSON.parse(localStorage.getItem("readingSelectedWeeks"));
    } catch {
        // Bei ungültigen Daten die bisher freigegebenen Wochen verwenden.
    }
    selectedWeeks = Array.isArray(savedSelection)
        ? [...new Set(savedSelection.filter(index =>
            Number.isInteger(index) && index >= 0 && index < weeks.length
        ))].sort((a, b) => a - b)
        : weeks.map((week, index) => index).filter(index => index <= currentWeekIndex);

}


function saveWeeks() {

    localStorage.setItem(
        "readingWeeks",
        JSON.stringify(weeks)
    );

    localStorage.setItem("readingSelectedWeeks", JSON.stringify(selectedWeeks));
}


// Offene Aufträge bleiben bis zu einer richtigen Antwort lokal gespeichert.
function loadPendingRepeats() {
    try {
        const saved = JSON.parse(localStorage.getItem("readingPendingRepeats") || "[]");
        pendingRepeats = new Set(Array.isArray(saved)
            ? saved.filter(value => typeof value === "string" && value.length > 0)
            : []);
    } catch {
        pendingRepeats = new Set();
    }
}

function savePendingRepeats() {
    localStorage.setItem("readingPendingRepeats", JSON.stringify([...pendingRepeats]));
}

function removeQueuedRepeat(syllable) {
    sessionQueue = sessionQueue.filter((task, index) =>
        index <= currentPosition || !task.isRepeat || task.syllable !== syllable
    );
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

        const selectionLabel = document.createElement("label");
        selectionLabel.className = "week-selection";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.week = String(index);
        checkbox.checked = selectedWeeks.includes(index);
        selectionLabel.appendChild(checkbox);

        const title = document.createElement("span");
        title.textContent = `Woche ${index + 1} üben`;
        selectionLabel.appendChild(title);
        div.appendChild(selectionLabel);

        const input = document.createElement("input");
        input.type = "text";
        input.value = week.join(", ");
        input.dataset.week = String(index);
        input.placeholder = "ma, mi, O-mi, Mo-mo";
        input.setAttribute("aria-label", `Silben und Wörter für Woche ${index + 1}`);
        div.appendChild(input);

        container.appendChild(div);

    });

    alignTextToNotebook();
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

    selectedWeeks = Array.from(document.querySelectorAll(
        '#weeks-container input[type="checkbox"]:checked'
    )).map(input => Number(input.dataset.week));

    const inputs =
        document.querySelectorAll(
            '#weeks-container input[type="text"]'
        );

    weeks = Array.from(inputs).map(input => {

        return input.value
            .split(",")
            .map(
                syllable =>
                    syllable
                        .trim()
                        .replace(/\s*-\s*/g, "-")
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

    const selectedWeekData = weeks.filter((week, index) => selectedWeeks.includes(index));
    const currentWeek = selectedWeekData[selectedWeekData.length - 1] || [];
    const olderWeeks = selectedWeekData.slice(0, -1).flat();
    const allSyllables = selectedWeekData.flat();

    if (allSyllables.length === 0) {

        alert(
            "Bitte mindestens eine Woche mit Silben zum Üben auswählen."
        );

        return false;
    }

    // Entfernte Silben verwerfen, abgewählte Wochen aber behalten.
    const knownSyllables = new Set(weeks.flat().map(value => value.toLowerCase()));
    pendingRepeats = new Set([...pendingRepeats].filter(value =>
        knownSyllables.has(value.toLowerCase())
    ));
    savePendingRepeats();

    const eligibleSyllables = new Set(allSyllables.map(value => value.toLowerCase()));
    const carriedRepeats = [...pendingRepeats]
        .filter(value => eligibleSyllables.has(value.toLowerCase()))
        .slice(0, MAX_CARRIED_REPEATS);

    sessionQueue = [];

    let lastSyllable = null;

    for (
        let i = 0;
        i < SESSION_LENGTH - carriedRepeats.length;
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
            { syllable: formattedSyllable, isRepeat: false }
        );

        lastSyllable = syllable;
    }

    carriedRepeats.forEach((syllable, index) => {
        sessionQueue.splice(1 + index * 3, 0, { syllable, isRepeat: true });
    });

    currentPosition = 0;
    sessionProgress = 0;
    renderProgress();
    resetAnswerFeedback();
    hadUncertainAnswer = false;
    sessionUnresolved = new Set();
    sessionActive = true;

    return true;
}


// ------------------------------------
// AKTUELLE SILBE ANZEIGEN
// ------------------------------------

function showCurrentSyllable() {

    const syllable =
        sessionQueue[currentPosition].syllable;

    const card = document.getElementById("syllable-card");
    const parts = syllable.split("-");
    const isWord = parts.length === 2 && parts.every(part => part.length > 0);

    card.classList.toggle("two-syllable-word", isWord);
    card.textContent = "";
    if (isWord) {
        parts.forEach((part, index) => {
            const span = document.createElement("span");
            span.className = index === 0 ? "first-syllable" : "second-syllable";
            span.textContent = part;
            card.appendChild(span);
        });
    } else {
        card.textContent = syllable;
    }
    card.setAttribute("aria-label", isWord ? parts.join("") : syllable);

    // Ein leeres Inline-Element markiert die tatsächliche Schriftgrundlinie.
    const baseline = document.createElement("span");
    baseline.className = "baseline-marker";
    baseline.setAttribute("aria-hidden", "true");
    card.appendChild(baseline);

    renderProgress();

    alignTextToNotebook();
}

function alignTextToNotebook() {
    const spacing = parseFloat(getComputedStyle(document.body)
        .getPropertyValue("--notebook-line-spacing"));
    const lineCenter = spacing - 0.5;
    const targets = document.querySelectorAll(
        '.screen.active h1, .screen.active h2, .screen.active p, ' +
        '.screen.active #syllable-card, ' +
        '.screen.active .week-selection > span, .screen.active .week input[type="text"]'
    );

    // Transformationen ändern den Textfluss nicht. Erst alle alten Versätze löschen.
    targets.forEach(target => target.style.setProperty("--line-offset", "0px"));
    targets.forEach(target => {
        let baselineY;
        if (target.matches('input')) {
            // Eingabefelder erlauben keine Kindelemente: gleiche Schrift separat messen.
            const style = getComputedStyle(target);
            const probe = document.createElement("div");
            probe.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;";
            probe.style.font = style.font;
            probe.style.lineHeight = style.lineHeight;
            const marker = document.createElement("span");
            marker.className = "baseline-marker";
            probe.appendChild(marker);
            document.body.appendChild(probe);
            baselineY = target.getBoundingClientRect().top + window.scrollY
                + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop)
                + marker.getBoundingClientRect().top;
            probe.remove();
        } else {
            let marker = target.querySelector(".baseline-marker");
            if (!marker) {
                marker = document.createElement("span");
                marker.className = "baseline-marker";
                marker.setAttribute("aria-hidden", "true");
                target.appendChild(marker);
            }
            baselineY = marker.getBoundingClientRect().top + window.scrollY;
        }
        const nearestLine = Math.round((baselineY - lineCenter) / spacing)
            * spacing + lineCenter;
        target.style.setProperty("--line-offset", `${nearestLine - baselineY}px`);
        if (target.id === "syllable-card") {
            target.parentElement.style.setProperty(
                "--syllable-line-offset", `${nearestLine - baselineY}px`
            );
        }
    });
}


// ------------------------------------
// RICHTIG
// ------------------------------------

function resetAnswerFeedback() {
    clearTimeout(answerFeedbackTimer);
    answerFeedbackTimer = null;
    document.querySelectorAll("[data-answer-feedback]").forEach(symbol => {
        symbol.hidden = true;
    });
    document.getElementById("answer-feedback-text").textContent = "";
    document.querySelectorAll(".answer-buttons button").forEach(button => {
        button.disabled = false;
    });
}

function renderProgress() {
    const percent = Math.min(100, Math.max(0, sessionProgress * 100));
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("progress").setAttribute("aria-valuenow", String(Math.round(percent)));
}

function showAnswerFeedback(result) {
    // Fortschritt bleibt bei Wiederholungen stehen und geht nie zurück.
    if (result === "correct") {
        const remaining = sessionQueue.length - currentPosition;
        sessionProgress += (1 - sessionProgress) / remaining;
    }
    // Die letzte Rückmeldung zeigt bereits den vollen Balken vor dem Abschluss.
    if (currentPosition + 1 >= Math.min(sessionQueue.length, MAX_SESSION_LENGTH)) {
        sessionProgress = 1;
    }
    renderProgress();

    document.querySelectorAll("[data-answer-feedback]").forEach(symbol => {
        symbol.hidden = symbol.dataset.answerFeedback !== result;
    });
    document.getElementById("answer-feedback-text").textContent =
        result === "correct" ? "Richtig!" : "Das üben wir noch einmal.";
    document.querySelectorAll(".answer-buttons button").forEach(button => {
        button.disabled = true;
    });

    answerFeedbackTimer = setTimeout(() => {
        resetAnswerFeedback();
        currentPosition++;
        continueSession();
    }, ANSWER_FEEDBACK_MS);
}

function answerCorrect() {

    if (!sessionActive || answerFeedbackTimer !== null) return;

    const syllable = sessionQueue[currentPosition].syllable;
    sessionUnresolved.delete(syllable);
    pendingRepeats.delete(syllable);
    removeQueuedRepeat(syllable);
    savePendingRepeats();

    showAnswerFeedback("correct");
}


// ------------------------------------
// SPÄTER NOCH EINMAL
// ------------------------------------

function repeatLater() {

    if (!sessionActive || answerFeedbackTimer !== null) return;

    const syllable = sessionQueue[currentPosition].syllable;
    hadUncertainAnswer = true;
    sessionUnresolved.add(syllable);

    // Ein Auftrag je Schreibweise; erneut unsichere Silben hinten anstellen.
    pendingRepeats.delete(syllable);
    pendingRepeats.add(syllable);
    savePendingRepeats();
    removeQueuedRepeat(syllable);

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
        { syllable, isRepeat: true }
    );

    showAnswerFeedback("repeat");
}


// ------------------------------------
// RUNDE FORTSETZEN
// ------------------------------------

function showSessionFeedback() {
    // Nur Antworten dieser Runde zählen, nicht der gespeicherte Vorrat.
    const award = !hadUncertainAnswer ? "trophy"
        : sessionUnresolved.size === 0 ? "star" : "check";
    const messages = {
        trophy: "Alles direkt geschafft!",
        star: "Mit Übung geschafft!",
        check: "Für heute geschafft!"
    };

    document.querySelectorAll("[data-award]").forEach(symbol => {
        symbol.hidden = symbol.dataset.award !== award;
    });
    document.getElementById("finish-message").textContent = messages[award];
}

function continueSession() {

    if (
        currentPosition >= sessionQueue.length ||
        currentPosition >= MAX_SESSION_LENGTH
    ) {

        sessionActive = false;
        showSessionFeedback();
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

function endPracticeEarly() {
    if (!sessionActive) return;
    if (!window.confirm("Möchtest du die Leserunde für heute beenden?")) return;

    sessionActive = false;
    resetAnswerFeedback();
    showScreen("start-screen");
}


// ------------------------------------
// BUTTONS
// ------------------------------------

document.getElementById("end-practice-button")
    .addEventListener("click", endPracticeEarly);

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
loadPendingRepeats();
renderWeeks();

alignTextToNotebook();
window.addEventListener("resize", alignTextToNotebook);
document.fonts.ready.then(alignTextToNotebook);
