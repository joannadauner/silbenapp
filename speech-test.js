const loadButton = document.getElementById('load-model');
const recordButton = document.getElementById('record');
const stopButton = document.getElementById('stop');
const cancelButton = document.getElementById('cancel');
const statusText = document.getElementById('speech-status');
const resultText = document.getElementById('speech-result');
let worker, stream, recorder, audioContext, recordTimer, watchdog;
let generation = 0;
let state = 'idle';
// Store only a technical phase, never audio or recognized text.
const diagnosticKey = 'speechTestPhase';
function phase(value) {
    try {
        if (value) localStorage.setItem(diagnosticKey, value);
        else localStorage.removeItem(diagnosticKey);
    } catch { /* Diagnostic storage is optional. */ }
}
try {
    const previous = localStorage.getItem(diagnosticKey);
    if (previous) statusText.textContent = `Voriger Test wurde unterbrochen bei: ${previous}. Ursache noch unbekannt.`;
} catch { /* Private storage may be unavailable. */ }
function controls(next) {
    state = next;
    loadButton.disabled = next !== 'idle';
    recordButton.disabled = next !== 'ready';
    stopButton.disabled = next !== 'recording';
    cancelButton.disabled = next === 'idle';
}
function releaseMicrophone() {
    clearTimeout(recordTimer);
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
}
function reset(message) {
    generation++;
    phase(null);
    if (recorder?.state === 'recording') recorder.stop();
    recorder = null;
    releaseMicrophone();
    audioContext?.close().catch(() => {});
    audioContext = null;
    clearTimeout(watchdog);
    worker?.terminate();
    worker = null;
    resultText.textContent = '';
    statusText.textContent = message;
    controls('idle');
}
loadButton.onclick = () => {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        statusText.textContent = 'Dieser Browser unterstützt den Test hier nicht. Bitte über HTTPS in Safari öffnen.';
        return;
    }
    controls('loading');
    phase('Modell laden');
    statusText.textContent = 'Modell wird geladen. Bitte warten …';
    try {
        worker = new Worker('./speech-worker.js?v=2', { type: 'module' });
        watchdog = setTimeout(() => reset('Laden dauert zu lange. Bitte erneut im WLAN versuchen.'), 180000);
        worker.onerror = () => reset('Der lokale Sprachtest konnte nicht gestartet werden. Es gibt keinen Cloud-Fallback.');
        worker.onmessage = ({ data }) => {
            if (data.type === 'phase') {
                phase(data.phase);
                statusText.textContent = 'Sprachmodell wertet lokal aus …';
            }
            if (data.type === 'progress') statusText.textContent = `Modelldatei wird geladen: ${data.percent} %`;
            if (data.type === 'ready') {
                clearTimeout(watchdog);
                phase(null);
                controls('ready');
                statusText.textContent = 'Bereit. Du kannst jetzt auch WLAN ausschalten und lokal testen.';
            }
            if (data.type === 'result') {
                clearTimeout(watchdog);
                phase(null);
                controls('ready');
                resultText.textContent = data.text.trim() ? `Erkannt: ${data.text.trim()}` : 'Kein Text erkannt.';
                statusText.textContent = `Lokal ausgewertet in ${data.seconds.toFixed(1)} Sekunden. Keine automatische Bewertung.`;
            }
            if (data.type === 'error') reset('Lokale Verarbeitung fehlgeschlagen. Bitte erneut laden. Es wurde keine Cloud-Erkennung verwendet.');
        };
        worker.postMessage({ type: 'load' });
    } catch { reset('Der lokale Sprachtest ist in diesem Browser nicht verfügbar.'); }
};
recordButton.onclick = async () => {
    if (state !== 'ready') return;
    const attempt = ++generation;
    controls('permission');
    resultText.textContent = '';
    statusText.textContent = 'Mikrofonfreigabe wird angefragt …';
    try {
        // Create/resume on user gesture for Safari.
        audioContext = new AudioContext();
        await audioContext.resume();
        if (attempt !== generation) return;
        const input = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (attempt !== generation) { input.getTracks().forEach(track => track.stop()); return; }
        stream = input;
        const chunks = [];
        const recording = new MediaRecorder(stream);
        recorder = recording;
        recording.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recording.onerror = () => reset('Aufnahme fehlgeschlagen. Bitte erneut versuchen.');
        recording.onstop = async () => {
            if (attempt !== generation) return;
            releaseMicrophone();
            recorder = null;
            controls('processing');
            phase('Audio dekodieren');
            statusText.textContent = 'Aufnahme wird ausschließlich auf diesem Gerät ausgewertet …';
            watchdog = setTimeout(() => reset('Auswertung abgebrochen: zu langsam für diesen Versuch.'), 90000);
            try {
                const buffer = await new Blob(chunks, { type: recording.mimeType }).arrayBuffer();
                chunks.length = 0;
                if (attempt !== generation) return;
                let decoded = await audioContext.decodeAudioData(buffer);
                await audioContext.close(); audioContext = null;
                if (attempt !== generation) return;
                phase('Audio auf 16 kHz umrechnen');
                const offline = new OfflineAudioContext(1, Math.ceil(Math.min(decoded.duration, 4) * 16000), 16000);
                const source = offline.createBufferSource();
                source.buffer = decoded; source.connect(offline.destination); source.start();
                const rendered = await offline.startRendering();
                if (attempt !== generation) return;
                source.disconnect();
                source.buffer = null;
                decoded = null;
                const audio = rendered.getChannelData(0);
                phase('Auswertung an Worker übergeben');
                worker.postMessage({ type: 'recognize', audio }, [audio.buffer]);
            } catch { if (attempt === generation) reset('Diese Aufnahme konnte lokal nicht verarbeitet werden.'); }
        };
        recording.start();
        controls('recording');
        statusText.textContent = 'Jetzt einen Eintrag vorlesen …';
        recordTimer = setTimeout(() => { if (recording.state === 'recording') recording.stop(); }, 4000);
    } catch { if (attempt === generation) reset('Mikrofon nicht verfügbar oder Freigabe abgelehnt.'); }
};
stopButton.onclick = () => { if (recorder?.state === 'recording') recorder.stop(); };
cancelButton.onclick = () => reset('Test beendet. Mikrofon aus, Modell und Ergebnis freigegeben.');
window.addEventListener('pagehide', () => reset('Test beendet.'));
document.addEventListener('visibilitychange', () => {
    if (document.hidden) reset('Test beim Verlassen unterbrochen. Bitte erneut laden.');
});
