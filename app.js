// ------------------------------------
// GRUNDEINSTELLUNGEN
// ------------------------------------

const SESSION_LENGTH = 10;
const MAX_SESSION_LENGTH = 15;
const MAX_CARRIED_REPEATS = 5;
const ANSWER_FEEDBACK_MS = 1000;

let pendingRepeats = new Set();
let sessionActive = false;
let answerFeedbackTimer = null;
let hadUncertainAnswer = false;
let sessionUnresolved = new Set();
let sessionPracticed = new Set();

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


// Wochenexport und -import ohne persönlichen Wiederholungsstand.
function setTransferStatus(message) {
    document.getElementById("transfer-status").textContent = message;
    alignTextToNotebook();
}

function exportWeeks() {
    readWeeksFromForm();
    const backup = { format: "silbenapp-wochen", version: 1, weeks, selectedWeeks };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "silbenapp-wochen.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Browsern Zeit lassen, den Download zu übernehmen.
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    setTransferStatus("Export bereitgestellt: silbenapp-wochen.json");
}

function parseWeeksBackup(text) {
    const backup = JSON.parse(text.replace(/^\uFEFF/, ""));
    if (!backup || backup.format !== "silbenapp-wochen" || backup.version !== 1 ||
        !Array.isArray(backup.weeks) || backup.weeks.length === 0 ||
        !backup.weeks.every(week => Array.isArray(week) && week.every(value =>
            typeof value === "string" && value.trim().length > 0 && !value.includes(",")
        )) || !Array.isArray(backup.selectedWeeks) ||
        !backup.selectedWeeks.every(index => Number.isInteger(index) &&
            index >= 0 && index < backup.weeks.length)) {
        throw new Error("Ungültiges Wochenformat");
    }
    return {
        weeks: backup.weeks.map(week => week.map(value =>
            value.trim().replace(/\s*-\s*/g, "-").toLowerCase()
        )),
        selectedWeeks: [...new Set(backup.selectedWeeks)].sort((a, b) => a - b)
    };
}

async function importWeeks(event) {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;

    const button = document.getElementById("import-weeks-button");
    button.disabled = true;
    try {
        let backup;
        try {
            backup = parseWeeksBackup(await file.text());
        } catch {
            setTransferStatus("Import nicht möglich. Bitte eine gültige Silben-App-Wochendatei der Version 1 auswählen.");
            return;
        }
        if (!window.confirm("Alle vorhandenen Wochen und ihre Auswahl durch die Datei ersetzen? Auch ungespeicherte Eingaben werden ersetzt.")) {
            setTransferStatus("Import abgebrochen. Deine Wochen bleiben unverändert.");
            return;
        }

        const keys = ["readingWeeks", "readingSelectedWeeks"];
        const oldValues = keys.map(key => localStorage.getItem(key));
        try {
            localStorage.setItem(keys[0], JSON.stringify(backup.weeks));
            localStorage.setItem(keys[1], JSON.stringify(backup.selectedWeeks));
        } catch {
            // Bei einem Speicherfehler keine halbfertige Auswahl hinterlassen.
            keys.forEach((key, index) => {
                if (localStorage.getItem(key) === oldValues[index]) return;
                if (oldValues[index] === null) localStorage.removeItem(key);
                else localStorage.setItem(key, oldValues[index]);
            });
            throw new Error("Speichern fehlgeschlagen");
        }
        weeks = backup.weeks;
        selectedWeeks = backup.selectedWeeks;
        renderWeeks();
        setTransferStatus("Wochen und Auswahl wurden importiert und gespeichert.");
    } catch {
        setTransferStatus("Import konnte nicht gespeichert werden. Bitte den Browserspeicher prüfen.");
    } finally {
        input.value = "";
        button.disabled = false;
    }
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
        sessionQueue.splice(1 + index * 2, 0, { syllable, isRepeat: true });
    });

    currentPosition = 0;
    sessionProgress = 0;
    renderProgress();
    resetAnswerFeedback();
    hadUncertainAnswer = false;
    sessionUnresolved = new Set();
    sessionPracticed = new Set();
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
    renderReadingText(card, syllable);

    // Ein leeres Inline-Element markiert die tatsächliche Schriftgrundlinie.
    const baseline = document.createElement("span");
    baseline.className = "baseline-marker";
    baseline.setAttribute("aria-hidden", "true");
    card.appendChild(baseline);

    renderProgress();

    alignTextToNotebook();
}

function renderReadingText(card, syllable) {
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

}

function alignTextToNotebook() {
    const spacing = parseFloat(getComputedStyle(document.body)
        .getPropertyValue("--notebook-line-spacing"));
    const lineCenter = spacing - 0.5;
    const targets = document.querySelectorAll(
        '.screen.active h1, .screen.active h2, .screen.active p, ' +
        '.screen.active #syllable-card, .screen.active summary, ' +
        '.screen.active .week-selection > span, .screen.active .week input[type="text"]'
    );

    // Transformationen ändern den Textfluss nicht. Erst alle alten Versätze löschen.
    targets.forEach(target => target.style.setProperty("--line-offset", "0px"));
    targets.forEach(target => {
        if (target.getClientRects().length === 0) return;
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
    sessionPracticed.add(syllable);

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
    renderParentOverview();
    // Nur Antworten dieser Runde zählen, nicht der gespeicherte Vorrat.
    const award = !hadUncertainAnswer ? "trophy"
        : sessionUnresolved.size === 0 ? "star" : "check";
    const messages = {
        trophy: "Leserunde super geschafft!",
        star: "Leserunde mit etwas Übung geschafft!",
        check: "Leserunde geschafft! Bleib dran!"
    };

    document.querySelectorAll("[data-award]").forEach(symbol => {
        symbol.hidden = symbol.dataset.award !== award;
    });
    document.getElementById("finish-message").textContent = messages[award];
}

function renderParentOverview() {
    document.getElementById("parent-overview").open = false;
    renderParentList("parent-practiced-list", sessionPracticed);
    document.getElementById("parent-practiced-description").textContent = sessionPracticed.size
        ? "Bei diesen Silben und Wörtern wurde in dieser Runde „Nochmal“ gewählt – auch wenn sie danach richtig gelesen wurden. Jede Schreibweise steht nur einmal in der Liste."
        : "In dieser Runde wurde alles sofort erkannt.";
    renderParentList("parent-repeat-list", pendingRepeats);
    document.getElementById("parent-repeat-description").textContent = pendingRepeats.size
        ? "Noch offene Silben und Wörter, auch aus früheren Runden. Einträge aus abgewählten Wochen warten, bis diese wieder ausgewählt sind."
        : "Es sind keine Wiederholungen mehr offen.";
}

function renderParentList(id, syllables) {
    const list = document.getElementById(id);
    list.replaceChildren();
    for (const syllable of syllables) {
        const item = document.createElement("li");
        const text = document.createElement("p");
        renderReadingText(text, syllable);
        item.appendChild(text);
        list.appendChild(item);
    }
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

document.getElementById("parent-overview").addEventListener("toggle", alignTextToNotebook);

document.getElementById("export-weeks-button").addEventListener("click", exportWeeks);
document.getElementById("import-weeks-button").addEventListener("click", () => {
    document.getElementById("import-weeks-file").click();
});
document.getElementById("import-weeks-file").addEventListener("change", importWeeks);

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

// Nach Größenänderungen erst mit den aktuellen Layoutmaßen ausrichten.
let layoutFrame = null;
let layoutSettleTimer = null;
function scheduleLayoutUpdate() {
    if (layoutFrame !== null) cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(() => {
        layoutFrame = null;
        alignTextToNotebook();
    });
}

function refreshViewportLayout() {
    scheduleLayoutUpdate();
    // Die endgültigen Maße können erst nach der Drehanimation vorliegen.
    clearTimeout(layoutSettleTimer);
    layoutSettleTimer = setTimeout(scheduleLayoutUpdate, 350);
}

refreshViewportLayout();
window.addEventListener("resize", refreshViewportLayout);
window.addEventListener("pageshow", refreshViewportLayout);
window.visualViewport?.addEventListener("resize", refreshViewportLayout);
window.screen.orientation?.addEventListener("change", refreshViewportLayout);
window.addEventListener("orientationchange", refreshViewportLayout);
// Reagiert auch auf später eintreffende Layoutmaße und Änderungen im Split View.
// Die Texttransformationen ändern die beobachteten Boxgrößen nicht.
if ("ResizeObserver" in window) {
    const layoutObserver = new ResizeObserver(scheduleLayoutUpdate);
    layoutObserver.observe(document.documentElement);
    layoutObserver.observe(document.querySelector(".app"));
}
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshViewportLayout();
});
document.fonts.ready.then(refreshViewportLayout);

// Versionsstand gehört zur geladenen Seite, nicht zum möglicherweise neueren Worker.
const versionLabel = document.querySelector(".app-version span");
if (versionLabel.textContent === "__APP_VERSION__") {
    versionLabel.textContent = "Lokal (Entwicklung)";
}

let updateRegistration = null;
let updateRequested = false;
let updateTimeout = null;
let requestedWorker = null;
let updateReloading = false;
const updatePanel = document.getElementById("app-update");
const updateButton = document.getElementById("app-update-button");
const updateStatus = document.getElementById("app-update-status");

function showAvailableUpdate() {
    updatePanel.hidden = !updateRegistration?.waiting && !requestedWorker;
    if (!updatePanel.hidden && !updateRequested) {
        updateStatus.textContent = "Update verfügbar";
    }
    scheduleLayoutUpdate();
}

function finishRequestedUpdate() {
    if (!updateRequested || updateReloading || sessionActive ||
        requestedWorker?.state !== "activated") return;
    updateReloading = true;
    clearTimeout(updateTimeout);
    location.reload();
}

updateButton.addEventListener("click", () => {
    if (sessionActive || updateRequested ||
        !document.getElementById("start-screen").classList.contains("active")) return;
    const worker = updateRegistration?.waiting || requestedWorker;
    if (!worker) {
        showAvailableUpdate();
        return;
    }
    updateRequested = true;
    requestedWorker = worker;
    updateButton.disabled = true;
    document.getElementById("start-button").disabled = true;
    document.getElementById("settings-button").disabled = true;
    updateStatus.textContent = "Wird aktualisiert …";
    updateTimeout = setTimeout(() => {
        updateRequested = false;
        updateButton.disabled = false;
        document.getElementById("start-button").disabled = false;
        document.getElementById("settings-button").disabled = false;
        updateStatus.textContent = "Update noch nicht abgeschlossen. Bitte erneut versuchen.";
    }, 10000);
    worker.addEventListener("statechange", finishRequestedUpdate);
    if (worker.state === "activated") finishRequestedUpdate();
    else worker.postMessage({ type: "ACTIVATE_UPDATE" });
});

// Auf Live Server bleibt die Entwicklung ohne Cache; lokal ist ?pwa-test=1 möglich.
if ("serviceWorker" in navigator && window.isSecureContext &&
    (location.protocol === "https:" || new URLSearchParams(location.search).has("pwa-test"))) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        // Andere offene App-Fenster dürfen keine laufende Runde neu laden.
        finishRequestedUpdate();
    });
    window.addEventListener("load", async () => {
        try {
            updateRegistration = await navigator.serviceWorker.register("./sw.js", {
                updateViaCache: "none"
            });
            showAvailableUpdate();
            const watchInstallingWorker = () => {
                const worker = updateRegistration.installing;
                worker?.addEventListener("statechange", () => {
                    showAvailableUpdate();
                });
            };
            updateRegistration.addEventListener("updatefound", watchInstallingWorker);
            watchInstallingWorker();
            const checkForUpdate = () => {
                if (!document.hidden) {
                    updateRegistration.update().catch(() => {});
                    showAvailableUpdate();
                }
            };
            window.addEventListener("online", checkForUpdate);
            document.addEventListener("visibilitychange", checkForUpdate);
            checkForUpdate();
        } catch (error) {
            console.warn("Offline-Speicherung konnte nicht eingerichtet werden:", error);
        }
    });
}
