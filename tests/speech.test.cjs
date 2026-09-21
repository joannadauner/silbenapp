const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const original = readFileSync(resolve(__dirname, '../speech-worker.js'), 'utf8');
const importCall = "import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js')";
assert.ok(original.includes(importCall));

test('speech worker processes audio locally and blocks fetch after loading', async () => {
    const messages = [];
    let calls = 0, supplied;
    const self = { fetch: async () => { calls++; }, postMessage: m => messages.push(m) };
    const context = vm.createContext({ self, performance: { now: () => 0 },
        library: {
            env: { backends: { onnx: { wasm: {} } } },
            pipeline: async (task, model, options) => {
                assert.equal(task, 'automatic-speech-recognition');
                assert.equal(options.device, 'wasm');
                assert.equal(options.dtype, 'q8');
                assert.equal(options.session_options.enableCpuMemArena, false);
                assert.equal(options.session_options.enableMemPattern, false);
                await self.fetch('model-file');
                return async (audio, settings) => {
                    supplied = audio;
                    assert.equal(settings.language, 'german');
                    assert.equal(settings.max_new_tokens, 12);
                    return { text: 'Mi' };
                };
            }
        }
    });
    vm.runInContext(original.replace(importCall, 'Promise.resolve(library)'), context);
    await self.onmessage({ data: { type: 'load' } });
    assert.equal(messages.at(-1).type, 'ready');
    await assert.rejects(self.fetch('https://example.com/upload'), /Network disabled/);
    const audio = new Float32Array([0.1, 0.2]);
    await self.onmessage({ data: { type: 'recognize', audio } });
    assert.equal(supplied, audio);
    assert.equal(calls, 1);
    assert.equal(messages.at(-1).text, 'Mi');
});

test('model errors report failure without a remote recognition fallback', async () => {
    const messages = [];
    const self = { fetch() { throw Error('Unexpected network'); }, postMessage: m => messages.push(m) };
    const context = vm.createContext({ self, library: {
        env: { backends: { onnx: { wasm: {} } } },
        pipeline: async () => { throw Error('Unsupported runtime'); }
    } });
    vm.runInContext(original.replace(importCall, 'Promise.resolve(library)'), context);
    await self.onmessage({ data: { type: 'load' } });
    assert.equal(messages.at(-1).type, 'error');
});
