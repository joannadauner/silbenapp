// Isolated inference worker. No audio or text is sent over the network.
let transcriber;
let ready = false;
const download = self.fetch.bind(self);
self.fetch = (...args) => {
    if (ready) return Promise.reject(new Error('Network disabled after model loading'));
    return download(...args);
};
self.onmessage = async ({ data }) => {
    try {
        if (data.type === 'load' && !transcriber) {
            const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
            env.allowLocalModels = false;
            env.backends.onnx.wasm.numThreads = 1;
            env.backends.onnx.wasm.proxy = false;
            transcriber = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
                device: 'wasm', dtype: 'q8', revision: 'ff4177021cc41f7db950912b73ea4fdf7d01d8e7',
                // Reduce retained allocator memory for the iPad experiment.
                session_options: { enableCpuMemArena: false, enableMemPattern: false },
                progress_callback: event => {
                    if (event.status === 'progress') self.postMessage({
                        type: 'progress', percent: Math.round(event.progress)
                    });
                }
            });
            ready = true;
            self.postMessage({ type: 'ready' });
        } else if (data.type === 'recognize' && ready) {
            self.postMessage({ type: 'phase', phase: 'Sprachmodell auswerten' });
            const start = performance.now();
            const result = await transcriber(data.audio, {
                language: 'german', task: 'transcribe', max_new_tokens: 12,
                do_sample: false
            });
            self.postMessage({ type: 'result', text: result.text, seconds: (performance.now() - start) / 1000 });
        }
    } catch {
        self.postMessage({ type: 'error' });
    }
};
