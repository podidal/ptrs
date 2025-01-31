// Logging system
const logLevels = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

function addLogEntry(level, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };

    // Add to UI
    const logsContainer = document.getElementById('logsContainer');
    if (logsContainer) {
        const logElement = document.createElement('div');
        logElement.className = `log-entry log-${level}`;
        
        let logText = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        if (data) {
            logText += '\nData: ' + JSON.stringify(data, null, 2);
        }
        
        logElement.textContent = logText;
        logsContainer.insertBefore(logElement, logsContainer.firstChild);
        
        // Limit number of visible logs
        while (logsContainer.children.length > 50) {
            logsContainer.removeChild(logsContainer.lastChild);
        }
    }

    // Also log to console
    console[level](message, data || '');
}

// Clear logs
function clearLogs() {
    const logsContainer = document.getElementById('logsContainer');
    if (logsContainer) {
        logsContainer.innerHTML = '';
    }
}

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const startRecordButton = document.getElementById('startRecordButton');
const stopRecordButton = document.getElementById('stopRecordButton');
const settingsButton = document.getElementById('settingsButton');
const settingsPanel = document.getElementById('settingsPanel');
const chatModelSelect = document.getElementById('chatModelSelect');
const ttsModelSelect = document.getElementById('ttsModelSelect');
const languageSelect = document.getElementById('languageSelect');
const responseFormat = document.getElementById('responseFormat');
const temperature = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperatureValue');
const prompt = document.getElementById('prompt');
const voiceSelect = document.getElementById('voiceSelect');
const stability = document.getElementById('stability');
const similarityBoost = document.getElementById('similarityBoost');
const speakingRate = document.getElementById('speakingRate');
const style = document.getElementById('style');
const stabilityValue = document.getElementById('stabilityValue');
const similarityBoostValue = document.getElementById('similarityBoostValue');
const speakingRateValue = document.getElementById('speakingRateValue');
const styleValue = document.getElementById('styleValue');
const sampleTextSelect = document.getElementById('sampleTextSelect');
const testText = document.getElementById('testText');
const testVoiceButton = document.getElementById('testVoiceButton');

// API Keys
const GROQ_API_KEY = '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';
const ELEVEN_LABS_API_KEY = 'sk_4e58bee845f09873a10f0856585a2fdf62d81b667474b952';

// Get tab elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Tab switching
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        button.classList.add('active');
        document.getElementById(button.dataset.tab).classList.add('active');
    });
});

// Settings panel toggle
settingsButton.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
});

// Temperature slider value display
temperature.addEventListener('input', (e) => {
    temperatureValue.textContent = e.target.value;
});

// Update value displays for all sliders
stability.addEventListener('input', (e) => {
    stabilityValue.textContent = e.target.value;
});

similarityBoost.addEventListener('input', (e) => {
    similarityBoostValue.textContent = e.target.value;
});

speakingRate.addEventListener('input', (e) => {
    speakingRateValue.textContent = e.target.value;
});

style.addEventListener('input', (e) => {
    styleValue.textContent = e.target.value;
});

// Sample texts in different languages
const sampleTexts = {
    en: "Hello! This is a sample text to test the voice settings. How does it sound?",
    uk: "Привіт! Це тестовий текст для перевірки налаштувань голосу. Як це звучить?"
};

// Update test text when language is changed
sampleTextSelect.addEventListener('change', () => {
    testText.value = sampleTexts[sampleTextSelect.value];
});

// Initialize with default sample text
testText.value = sampleTexts[sampleTextSelect.value];

// Test voice button click handler
testVoiceButton.addEventListener('click', () => {
    if (testText.value.trim()) {
        playTextToSpeech(testText.value);
    }
});

// Play text to speech with proper error handling
async function playTextToSpeech(text) {
    if (!text || !ELEVEN_LABS_API_KEY) return;
    
    const button = document.querySelector('.speak-button');
    if (button) button.disabled = true;
    
    try {
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceSelect.value, {
            method: 'POST',
            headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': ELEVEN_LABS_API_KEY
            },
            body: JSON.stringify({
                text: text.trim().substring(0, 2000), // ElevenLabs has a limit
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75,
                    style: 0.5,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('TTS API Error:', errorData);
            throw new Error(errorData.detail?.message || 'Помилка генерації аудіо');
        }

        const audioBlob = await response.blob();
        if (audioBlob.size === 0) {
            throw new Error('Отримано порожній аудіофайл');
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (button) button.disabled = false;
                resolve();
            };
            
            audio.onerror = (e) => {
                URL.revokeObjectURL(audioUrl);
                if (button) button.disabled = false;
                reject(new Error('Помилка відтворення аудіо: ' + e.message));
            };
            
            audio.play().catch(error => {
                URL.revokeObjectURL(audioUrl);
                if (button) button.disabled = false;
                reject(error);
            });
        });
        
    } catch (error) {
        console.error('TTS error:', error);
        if (button) button.disabled = false;
        throw error;
    }
}

// Global variables for recording state
let mediaRecorder = null;
let recordingStream = null;

// Recording settings
const recordingSettings = {
    silenceThreshold: 10, // Audio level threshold to detect silence
    silenceTimeout: 2000, // Time in ms to wait before stopping after silence
    maxDuration: 30000, // Maximum recording duration in ms
    sampleRate: 16000, // Audio sample rate
    channelCount: 1, // Mono audio
    bitsPerSecond: 128000 // Audio quality
};

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('recordingSettings', JSON.stringify(recordingSettings));
}

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('recordingSettings');
    if (saved) {
        Object.assign(recordingSettings, JSON.parse(saved));
        updateSettingsUI();
    }
}

// Update settings UI
function updateSettingsUI() {
    const silenceTimeoutInput = document.getElementById('silenceTimeout');
    const maxDurationInput = document.getElementById('maxDuration');
    if (silenceTimeoutInput) silenceTimeoutInput.value = recordingSettings.silenceTimeout;
    if (maxDurationInput) maxDurationInput.value = recordingSettings.maxDuration;
}

// Handle settings change
function handleSettingsChange(event) {
    const { id, value } = event.target;
    recordingSettings[id] = parseInt(value, 10);
    saveSettings();
}

// Handle audio transcription
async function handleTranscription(audioBlob) {
    try {
        addLogEntry(logLevels.INFO, 'Preparing audio for transcription', {
            size: audioBlob.size,
            type: audioBlob.type
        });

        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'uk');
        
        addLogEntry(logLevels.INFO, 'Sending request to Groq API');
        
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            addLogEntry(logLevels.ERROR, 'Transcription API Error', errorData);
            throw new Error(errorData.error?.message || 'Помилка транскрипції');
        }

        const data = await response.json();
        addLogEntry(logLevels.INFO, 'Received transcription', { text: data.text });
        return data.text;
    } catch (error) {
        addLogEntry(logLevels.ERROR, 'Transcription error', { message: error.message });
        updateStatus('Помилка транскрипції: ' + error.message);
        throw error;
    }
}

// Start recording
async function startRecording() {
    try {
        // If already recording, stop it
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            addLogEntry(logLevels.INFO, 'Stopping current recording');
            stopRecording();
            return;
        }

        addLogEntry(logLevels.INFO, 'Starting new recording');

        // Check supported MIME types
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm';
            
        addLogEntry(logLevels.DEBUG, 'Using MIME type', { mimeType });

        // Request microphone access with specific constraints
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: recordingSettings.channelCount,
                sampleRate: recordingSettings.sampleRate,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        addLogEntry(logLevels.INFO, 'Microphone access granted', {
            sampleRate: recordingSettings.sampleRate,
            channelCount: recordingSettings.channelCount
        });

        // Create audio context for processing
        const audioContext = new AudioContext({
            sampleRate: recordingSettings.sampleRate
        });
        
        // Create media recorder
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: mimeType,
            audioBitsPerSecond: recordingSettings.bitsPerSecond
        });

        const audioChunks = [];
        let isRecording = true;

        // Handle incoming audio data
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
                addLogEntry(logLevels.DEBUG, 'Audio chunk received', { 
                    size: event.data.size,
                    chunks: audioChunks.length
                });
            }
        };

        // Handle recording stop
        mediaRecorder.onstop = async () => {
            try {
                addLogEntry(logLevels.INFO, 'Recording stopped, processing audio');
                
                // Create audio blob
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                addLogEntry(logLevels.DEBUG, 'Audio blob created', { 
                    size: audioBlob.size,
                    type: audioBlob.type
                });
                
                updateStatus('Обробка аудіо...');

                // Convert to WAV format
                const arrayBuffer = await audioBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                addLogEntry(logLevels.DEBUG, 'Audio decoded', {
                    duration: audioBuffer.duration,
                    sampleRate: audioBuffer.sampleRate,
                    channels: audioBuffer.numberOfChannels
                });
                
                // Create WAV buffer
                const wavBuffer = audioBufferToWav(audioBuffer);
                const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                
                addLogEntry(logLevels.INFO, 'Audio converted to WAV', {
                    size: wavBlob.size
                });
                
                updateStatus('Транскрибування...');
                
                // Get transcription
                const transcript = await handleTranscription(wavBlob);
                
                if (transcript) {
                    addLogEntry(logLevels.INFO, 'Transcription successful');
                    // Update UI with transcript
                    updateTranscript(transcript, true);
                    
                    // Process chat response
                    await handleChat(transcript);
                }
            } catch (error) {
                addLogEntry(logLevels.ERROR, 'Processing error', { 
                    message: error.message 
                });
                updateStatus('Помилка обробки: ' + error.message);
            } finally {
                // Clean up resources
                if (recordingStream) {
                    recordingStream.getTracks().forEach(track => track.stop());
                    recordingStream = null;
                }
                audioContext.close();
                isRecording = false;
                mediaRecorder = null;
                
                addLogEntry(logLevels.INFO, 'Resources cleaned up');
                
                // Update button text
                const recordButton = document.getElementById('recordButton');
                if (recordButton) {
                    recordButton.textContent = 'Почати запис';
                }
            }
        };
        
        // Start recording
        mediaRecorder.start(1000); // Collect data every second
        updateStatus('Говоріть...');
        
        // Update button text
        const recordButton = document.getElementById('recordButton');
        if (recordButton) {
            recordButton.textContent = 'Зупинити запис';
        }

        // Add volume meter
        const source = audioContext.createMediaStreamSource(recordingStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        // Monitor audio level for silence detection
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let silenceStart = null;
        
        function checkAudioLevel() {
            if (!isRecording) return;
            
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
            
            if (average < recordingSettings.silenceThreshold) {
                if (!silenceStart) {
                    silenceStart = Date.now();
                } else if (Date.now() - silenceStart > recordingSettings.silenceTimeout) {
                    stopRecording();
                    return;
                }
            } else {
                silenceStart = null;
            }
            
            requestAnimationFrame(checkAudioLevel);
        }
        
        checkAudioLevel();

        // Maximum recording duration
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, recordingSettings.maxDuration);

    } catch (error) {
        console.error('Recording error:', error);
        updateStatus('Помилка запису: ' + error.message);
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        updateStatus('Обробка...');
    }
}

// Convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }
    
    return encodeWAV(result, format, sampleRate, numChannels, bitDepth);
}

// Interleave two channels of audio data
function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    
    return result;
}

// Encode audio data to WAV format
function encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * bytesPerSample, true);
    
    // Write audio data
    floatTo16BitPCM(view, 44, samples);
    
    return buffer;
}

// Write string to DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Convert float audio data to 16-bit PCM
function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

// Update transcript display
function updateTranscript(text, isFinal) {
    const transcriptDiv = document.getElementById('transcript');
    if (transcriptDiv) {
        transcriptDiv.textContent = text + (isFinal ? '' : '...');
        if (isFinal) {
            addMessage(text, true);
        }
    }
}

// Update status
function updateStatus(text) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.textContent = text;
    }
}

// Handle real-time transcription
async function handleRealTimeTranscription(formData) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Transcription API Error:', errorData);
            throw new Error(errorData.error?.message || 'Помилка транскрипції');
        }

        const data = await response.json();
        if (!data.text) {
            throw new Error('Текст не отримано');
        }

        return data.text;
    } catch (error) {
        console.error('Transcription error:', error);
        updateStatus('Помилка транскрипції: ' + error.message);
        throw error;
    }
}

// Handle chat with real-time updates
async function handleChat(text) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {
                        role: "system",
                        content: prompt.value || "Ви - український продавець-консультант. Відповідайте професійно та коротко українською мовою."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                temperature: 0.7,
                max_tokens: 4096,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const messageDiv = addMessage('', false);
        const messageContent = messageDiv.querySelector('.message-content');
        let fullResponse = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() === '' || line === 'data: [DONE]') continue;

                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(5));
                        if (data.choices?.[0]?.delta?.content) {
                            const content = data.choices[0].delta.content;
                            fullResponse += content;
                            messageContent.textContent = fullResponse;
                        }
                    } catch (error) {
                        console.debug('Skipping incomplete chunk');
                    }
                }
            }
        }

        if (fullResponse) {
            await playTextToSpeech(fullResponse);
        }

        return fullResponse;
    } catch (error) {
        console.error('Chat error:', error);
        return `Помилка: ${error.message}`;
    }
}

// Add performance metrics
let metrics = {
    sttLatency: [],
    llmLatency: [],
    ttsLatency: [],
    timeToFirstByte: []
};

// Update metrics display
function updateMetricsDisplay() {
    const calcAverage = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    
    const elements = {
        sttLatency: document.getElementById('sttLatency'),
        llmLatency: document.getElementById('llmLatency'),
        ttsLatency: document.getElementById('ttsLatency')
    };
    
    if (elements.sttLatency) elements.sttLatency.textContent = calcAverage(metrics.sttLatency);
    if (elements.llmLatency) elements.llmLatency.textContent = calcAverage(metrics.llmLatency);
    if (elements.ttsLatency) elements.ttsLatency.textContent = calcAverage(metrics.ttsLatency);
}

// Update chat model options
const chatModelOptions = {
    'whisper-large-v3-turbo': 'Whisper Large V3 Turbo (Fast, Multilingual)',
    'whisper-large-v3': 'Whisper Large V3 (High Accuracy, Multilingual)',
    'distil-whisper-large-v3-en': 'Distil-Whisper English (Fast, English-only)'
};

// Initialize chat model select
Object.entries(chatModelOptions).forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    chatModelSelect.appendChild(option);
});

startRecordButton.addEventListener('click', startRecording);

// Text input handlers
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (!message) return;
    userInput.value = '';
    handleChat(message);
});

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = userInput.value.trim();
        if (!message) return;
        userInput.value = '';
        handleChat(message);
    }
});

function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    const messageControls = document.createElement('div');
    messageControls.className = 'message-controls';
    
    if (!isUser) {
        const speakButton = document.createElement('button');
        speakButton.className = 'speak-button';
        speakButton.innerHTML = '&#x1F50A;';
        speakButton.title = 'Play text-to-speech';
        speakButton.onclick = () => playTextToSpeech(content);
        messageControls.appendChild(speakButton);
    }
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageControls);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageDiv;
}

// Initialize default settings
document.addEventListener('DOMContentLoaded', function() {
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
        // Set default Ukrainian voice
        voiceSelect.value = 'IKne3meq5aSn9XLyUdCD'; // Anton as default
    }
    
    // Set default language to Ukrainian
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = 'uk';
    }

    // Check for API key
    if (!ELEVEN_LABS_API_KEY) {
        console.warn('ElevenLabs API key is not set');
        const voiceSettings = document.querySelector('.voice-settings');
        if (voiceSettings) {
            const errorDiv = voiceSettings.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = '⚠️ Для роботи з голосом потрібен API ключ ElevenLabs';
            }
        }
    }
});
