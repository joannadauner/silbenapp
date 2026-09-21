const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const { resolve } = require('node:path');

// Run the actual functions without browser startup and event registration.
const source = readFileSync(resolve(__dirname, '../app.js'), 'utf8');
const boundary = source.indexOf('// BUTTONS');
assert.ok(boundary > 0, 'App function boundary must exist');

function app(saved = {}) {
    const storage = new Map(Object.entries(saved));
    const elements = new Map();
    const timers = new Map();
    let timerId = 0;
    const context = vm.createContext({
        document: { getElementById(id) {
            if (!elements.has(id)) elements.set(id, { disabled: false, textContent: '' });
            return elements.get(id);
        } },
        localStorage: {
            getItem: key => storage.get(key) ?? null,
            setItem: (key, value) => storage.set(key, String(value)),
            removeItem: key => storage.delete(key)
        },
        window: { confirm: () => true }, alert() {},
        setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
        clearTimeout(id) { timers.delete(id); }
    });
    const run = code => vm.runInContext(code, context);
    run(source.slice(0, boundary));
    // Fixed seed makes test failures reproducible.
    run(`let testSeed = 12345; Math.random = () => {
        testSeed = (testSeed * 1664525 + 1013904223) >>> 0;
        return testSeed / 4294967296;
    };`);
    // Only visual rendering is replaced; queue, answers, timing and storage are real.
    run(`renderProgress = () => {}; alignTextToNotebook = () => {};
        renderWeeks = () => {}; showCurrentSyllable = () => {};
        showScreen = () => {}; showSessionFeedback = () => {};
        document.querySelectorAll = () => [];
        weeks = [['ma', 'mi', 'o-mi']]; selectedWeeks = [0];`);
    return {
        run, storage, context,
        value: code => JSON.parse(run(`JSON.stringify(${code})`)),
        answer(name) {
            run(`${name}()`);
            const entry = timers.entries().next().value;
            assert.ok(entry, 'Answer schedules feedback completion');
            timers.delete(entry[0]); entry[1]();
        }
    };
}

test('a clean round contains ten tasks and finishes with full progress', () => {
    const a = app(); a.run('createSession()');
    assert.equal(a.value('sessionQueue.length'), 10);
    for (let i = 0; i < 10; i++) a.answer('answerCorrect');
    assert.equal(a.value('sessionActive'), false);
    assert.equal(a.value('currentPosition'), 10);
    assert.equal(a.value('sessionProgress'), 1);
});

test('repeated uncertainty ends at fifteen and persists unfinished work across reload', () => {
    const a = app(); a.run('createSession()');
    for (let i = 0; i < 15; i++) a.answer('repeatLater');
    assert.equal(a.value('sessionActive'), false);
    assert.equal(a.value('currentPosition'), 15);
    assert.equal(a.value('sessionProgress'), 1);
    const saved = a.storage.get('readingPendingRepeats');
    assert.ok(JSON.parse(saved).length > 0);
    const b = app({ readingPendingRepeats: saved });
    b.run('loadPendingRepeats(); createSession()');
    assert.ok(b.value('sessionQueue.some(task => task.isRepeat)'));
    assert.equal(b.value('sessionQueue.length'), 10);
});

for (const syllable of ['Ma', 'ma', 'O-mi', 'o-mi']) {
    test(`repeat preserves exact spelling ${syllable} and waits three to five tasks`, () => {
        const a = app(); a.run('createSession()');
        a.run(`sessionQueue[0].syllable = ${JSON.stringify(syllable)}`);
        a.answer('repeatLater');
        const queue = a.value('sessionQueue');
        const position = queue.findIndex(t => t.isRepeat && t.syllable === syllable);
        assert.ok(position >= 4 && position <= 6);
        a.run(`currentPosition = ${position}`);
        a.answer('repeatLater');
        assert.deepEqual(a.value('[...pendingRepeats]'), [syllable]);
        assert.equal(a.value('sessionQueue.filter((t,i) => i >= currentPosition && t.isRepeat).length'), 1);
    });
}

test('correct answer clears only its exact spelling, preserving round history', () => {
    const a = app(); a.run(`createSession(); sessionQueue[0].syllable = 'Ma'`);
    a.answer('repeatLater');
    a.run(`pendingRepeats.add('ma'); sessionQueue[currentPosition].syllable = 'Ma'`);
    a.answer('answerCorrect');
    assert.deepEqual(a.value('[...pendingRepeats]'), ['ma']);
    assert.deepEqual(a.value('[...sessionPracticed]'), ['Ma']);
    assert.equal(a.value('sessionUnresolved.size'), 0);
    assert.equal(a.value("sessionQueue.slice(currentPosition).some(t => t.isRepeat && t.syllable === 'Ma')"), false);
});

test('only selected weeks are used; unselected repeats wait and deleted entries are pruned', () => {
    const a = app();
    a.run(`weeks = [['ma'], ['so'], ['mu']]; selectedWeeks = [0,2];
        pendingRepeats = new Set(['So', 'Mu', 'deleted']); createSession()`);
    assert.ok(a.value("sessionQueue.every(t => ['ma','mu'].includes(t.syllable.toLowerCase()))"));
    assert.deepEqual(a.value('[...pendingRepeats]'), ['So', 'Mu']);
    a.run('selectedWeeks = [];');
    assert.equal(a.run('createSession()'), false);
});

test('at most five carried repeats are included in ten starting tasks', () => {
    const a = app();
    a.run(`weeks = [['ma','mi','mu','mo','om','im']];
        pendingRepeats = new Set(['Ma','Mi','Mu','Mo','Om','Im']); createSession()`);
    assert.equal(a.value('sessionQueue.length'), 10);
    assert.equal(a.value('sessionQueue.filter(t => t.isRepeat).length'), 5);
    assert.equal(a.value('pendingRepeats.size'), 6);
});

test('highest selected week uses the 60 percent boundary, with fallback for an empty week', () => {
    const a = app();
    a.run("weeks = [['ma'], ['mi']]; selectedWeeks = [0,1]; Math.random = () => 0.59; createSession()");
    assert.ok(a.value("sessionQueue.every(t => t.syllable.toLowerCase() === 'mi')"));
    a.run('Math.random = () => 0.6; createSession()');
    assert.ok(a.value("sessionQueue.every(t => t.syllable.toLowerCase() === 'ma')"));
    a.run('weeks[1] = []; Math.random = () => 0; createSession()');
    assert.ok(a.value("sessionQueue.every(t => t.syllable.toLowerCase() === 'ma')"));
});

test('feedback blocks duplicate answers and uncertainty does not advance progress', () => {
    const a = app(); a.run('createSession(); repeatLater()');
    const length = a.value('sessionQueue.length');
    a.run('repeatLater(); answerCorrect()');
    assert.equal(a.value('sessionQueue.length'), length);
    assert.equal(a.value('currentPosition'), 0);
    assert.equal(a.value('sessionProgress'), 0);
});

const backup = { format: 'silbenapp-wochen', version: 1, weeks: [[' O - mi ']], selectedWeeks: [0] };
async function importFile(a, text) {
    a.context.fileInput = { files: [{ text: async () => text }], value: 'file' };
    await a.run('importWeeks({target: fileInput})');
    assert.equal(a.context.fileInput.value, '');
    assert.equal(a.run("document.getElementById('import-weeks-button').disabled"), false);
}
for (const invalid of ['not json', 'null', JSON.stringify({ ...backup, version: 2 }),
    JSON.stringify({ ...backup, selectedWeeks: [9] }), JSON.stringify({ ...backup, weeks: [[42]] })]) {
    test(`invalid import preserves weeks, selection and repeats: ${invalid}`, async () => {
        const a = app({ readingWeeks: '[["ma"]]', readingSelectedWeeks: '[0]', readingPendingRepeats: '["Ma"]' });
        a.run('loadWeeks(); loadPendingRepeats()');
        const before = [...a.storage];
        await importFile(a, invalid);
        assert.deepEqual([...a.storage], before);
        assert.deepEqual(a.value('weeks'), [['ma']]);
    });
}
test('cancelled import preserves data; confirmed import normalizes syllables and retains repeats', async () => {
    const a = app({ readingWeeks: '[["ma"]]', readingSelectedWeeks: '[0]', readingPendingRepeats: '["Ma"]' });
    a.run('loadWeeks(); loadPendingRepeats(); window.confirm = () => false');
    await importFile(a, JSON.stringify(backup));
    assert.deepEqual(a.value('weeks'), [['ma']]);
    a.run('window.confirm = () => true');
    await importFile(a, JSON.stringify(backup));
    assert.deepEqual(a.value('weeks'), [['o-mi']]);
    assert.equal(a.storage.get('readingPendingRepeats'), '["Ma"]');
    assert.deepEqual(JSON.parse(a.storage.get('readingWeeks')), [['o-mi']]);
});

test('storage failure during import rolls back both settings keys', async () => {
    const a = app({ readingWeeks: '[["ma"]]', readingSelectedWeeks: '[0]' });
    a.run(`loadWeeks(); const originalSet = localStorage.setItem;
        let failOnce = true; localStorage.setItem = (key, value) => {
            if (key === 'readingSelectedWeeks' && failOnce) {
                failOnce = false; throw new Error('Storage full');
            }
            originalSet(key, value);
        };`);
    await importFile(a, JSON.stringify(backup));
    assert.equal(a.storage.get('readingWeeks'), '[["ma"]]');
    assert.equal(a.storage.get('readingSelectedWeeks'), '[0]');
    assert.deepEqual(a.value('weeks'), [['ma']]);
});

test('new devices receive two selected default weeks; existing settings are preserved', () => {
    const a = app(); a.run('loadWeeks()');
    assert.deepEqual(a.value('weeks'), [
        ['mi', 'mo', 'mu', 'um', 'im'],
        ['im', 'um', 'om', 'o-mi', 'mo-mo', 'o-mo', 'i-mo', 'mi-o', 'mi-mo', 'mi-mi']
    ]);
    assert.deepEqual(a.value('selectedWeeks'), [0, 1]);
    const b = app({ readingWeeks: '[["so"]]', readingSelectedWeeks: '[]' });
    b.run('loadWeeks()');
    assert.deepEqual(b.value('weeks'), [['so']]);
    assert.deepEqual(b.value('selectedWeeks'), []);
});
