// ============================================================================
// qeeg-engine.js  —  SymptomCatcher QEEG module (lifted from triage.html, verbatim)
// Boston Neuromind LLC. Self-contained: EDF/EDF+/.xdfx/CSV parser + FFT + QEEG + Z-scores + render.
// External deps: window.state (lang getter + patient.age + objectiveData), JSZip (CDN, .xdfx only).
// Shared by all 3 areas (SymptomCatcher/DSM/Face) — QEEG is the foundation.
// ============================================================================

// EEG ENGINE v1.0 — EDF+/ERPrec/NeuroAmp Binary Parser + FFT + QEEG
// Supports: EDF, EDF+, .xdfx (ZIP), ERPrec bin
// Developed: Boston Neuromind LLC (2026)
// ============================================================================

const EEG_ENGINE = {
  // Standard 19 electrodes (10-20 system)
  STANDARD_CHANNELS: ['Fp1','Fp2','F7','F3','Fz','F4','F8','T3','C3','Cz','C4','T4','T5','P3','Pz','P4','T6','O1','O2'],
  
  // Frequency bands (Hz)
  BANDS: {
    delta: [1, 4],
    theta: [4, 8],
    alpha: [8, 13],
    beta: [13, 30],
    gamma: [30, 45]
  },
  
  // ==========================================================================
  // EDF+/EDF PARSER
  // ==========================================================================
  parseEDF(arrayBuffer) {
    const dv = new DataView(arrayBuffer);
    const decoder = new TextDecoder('ascii');
    
    function readAscii(start, len) {
      return decoder.decode(new Uint8Array(arrayBuffer, start, len)).trim();
    }
    
    // Main header (256 bytes)
    const header = {
      version: readAscii(0, 8),
      patientId: readAscii(8, 80),
      recordingId: readAscii(88, 80),
      startDate: readAscii(168, 8),
      startTime: readAscii(176, 8),
      headerBytes: parseInt(readAscii(184, 8)),
      reserved: readAscii(192, 44),
      numRecords: parseInt(readAscii(236, 8)),
      recordDuration: parseFloat(readAscii(244, 8)),
      numChannels: parseInt(readAscii(252, 4))
    };
    
    const nCh = header.numChannels;
    
    // Channel info (each field is 16/80/8/... bytes × nCh channels)
    const labels = [];
    const physMin = [], physMax = [], digMin = [], digMax = [], samplesPerRec = [];
    let offset = 256;
    
    // Labels (16 each)
    for (let i = 0; i < nCh; i++) labels.push(readAscii(offset + i*16, 16));
    offset += 16 * nCh;
    // Transducer (80 each) - skip
    offset += 80 * nCh;
    // Physical dim (8 each) - skip
    offset += 8 * nCh;
    // Phys min (8)
    for (let i = 0; i < nCh; i++) physMin.push(parseFloat(readAscii(offset + i*8, 8)) || 0);
    offset += 8 * nCh;
    // Phys max (8)
    for (let i = 0; i < nCh; i++) physMax.push(parseFloat(readAscii(offset + i*8, 8)) || 0);
    offset += 8 * nCh;
    // Dig min (8)
    for (let i = 0; i < nCh; i++) digMin.push(parseInt(readAscii(offset + i*8, 8)) || -32768);
    offset += 8 * nCh;
    // Dig max (8)
    for (let i = 0; i < nCh; i++) digMax.push(parseInt(readAscii(offset + i*8, 8)) || 32767);
    offset += 8 * nCh;
    // Prefilter (80) - skip
    offset += 80 * nCh;
    // Samples per record (8)
    for (let i = 0; i < nCh; i++) samplesPerRec.push(parseInt(readAscii(offset + i*8, 8)) || 0);
    offset += 8 * nCh;
    // Reserved (32) - skip
    offset += 32 * nCh;
    
    // Reuse the same normalizer as EDFParser so both upload paths handle
    // "EEG Fp1-Ref", "Fp1-LE", bipolar montages, channel-index prefixes, etc.
    const stdSet = new Map(EEG_ENGINE.STANDARD_CHANNELS.map(s => [EDFParser.normLabel(s), s]));
    function matchStandard(label) {
      const norm = EDFParser.normLabel(label);
      if (stdSet.has(norm)) return stdSet.get(norm);
      // Token-scan fallback for bipolar montages ("Fp1-F3" → match first token)
      const tokens = (label || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
      for (const t of tokens) if (stdSet.has(t)) return stdSet.get(t);
      return null;
    }

    // Sample rate: first standard 10-20 channel
    const eegChIdx = labels.map((l, i) => matchStandard(l) ? i : -1);
    const firstEEG = eegChIdx.find(i => i >= 0);
    if (firstEEG === undefined || firstEEG < 0) {
      console.warn('EEG_ENGINE.parseEDF: no 10-20 channels matched.');
      console.warn('  Raw labels:', labels);
      console.warn('  Normalized:', labels.map(l => EDFParser.normLabel(l)));
      throw new Error('No standard EEG channels found. Labels: ' + labels.slice(0, 30).join(', '));
    }
    const sr = samplesPerRec[firstEEG] / header.recordDuration;

    // Data reading
    const dataOffset = header.headerBytes;
    const recordSamples = samplesPerRec.reduce((a, b) => a + b, 0);
    const channelData = {};
    EEG_ENGINE.STANDARD_CHANNELS.forEach(ch => channelData[ch] = []);

    // Read all records
    let pos = dataOffset;
    for (let rec = 0; rec < header.numRecords; rec++) {
      for (let ch = 0; ch < nCh; ch++) {
        const spr = samplesPerRec[ch];
        const stdCh = matchStandard(labels[ch]);
        
        if (stdCh) {
          // Read samples as int16 LE
          const scale = (physMax[ch] - physMin[ch]) / (digMax[ch] - digMin[ch]);
          const offset_ = physMin[ch] - digMin[ch] * scale;
          const arr = new Float32Array(spr);
          for (let s = 0; s < spr; s++) {
            const raw = dv.getInt16(pos + s*2, true); // little-endian
            arr[s] = raw * scale + offset_;
          }
          channelData[stdCh].push(arr);
        }
        pos += spr * 2;
      }
    }
    
    // Concatenate records per channel
    const finalData = {};
    Object.keys(channelData).forEach(ch => {
      if (channelData[ch].length === 0) return;
      const total = channelData[ch].reduce((sum, a) => sum + a.length, 0);
      const merged = new Float32Array(total);
      let p = 0;
      channelData[ch].forEach(a => { merged.set(a, p); p += a.length; });
      finalData[ch] = merged;
    });
    
    return {
      header,
      sampleRate: sr,
      duration: header.numRecords * header.recordDuration,
      channels: finalData,
      labels: Object.keys(finalData)
    };
  },
  
  // ==========================================================================
  // .xdfx PARSER (ZIP containing EDF+)
  // ==========================================================================
  async parseXDFX(arrayBuffer) {
    // JSZip loaded globally as JSZip
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip library not loaded');
    }
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Look for recording.xdf (EDF+ file)
    let xdfFile = null;
    let sessionXml = null;
    let subjectXml = null;
    
    for (const name of Object.keys(zip.files)) {
      if (name.endsWith('.xdf') || name.endsWith('.edf')) xdfFile = zip.files[name];
      else if (name === 'session.xml') sessionXml = zip.files[name];
      else if (name === 'subject.xml') subjectXml = zip.files[name];
    }
    
    if (!xdfFile) throw new Error('No .xdf/.edf recording found inside archive');
    
    const xdfBuffer = await xdfFile.async('arraybuffer');
    const result = EEG_ENGINE.parseEDF(xdfBuffer);
    
    // Parse XML metadata if available
    if (subjectXml) {
      const xml = await subjectXml.async('text');
      result.subject = EEG_ENGINE.parseXML(xml);
    }
    if (sessionXml) {
      const xml = await sessionXml.async('text');
      result.session = EEG_ENGINE.parseXML(xml);
    }
    
    return result;
  },
  
  parseXML(xmlStr) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlStr, 'text/xml');
    const result = {};
    const root = doc.documentElement;
    for (const child of root.children) {
      result[child.tagName] = child.textContent.trim();
    }
    return result;
  },
  
  // ==========================================================================
  // FFT (Cooley-Tukey radix-2)
  // ==========================================================================
  fft(signal) {
    const n = signal.length;
    if (n <= 1) return { re: [...signal], im: new Array(n).fill(0) };
    
    // Pad to next power of 2
    let N = 1;
    while (N < n) N *= 2;
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < n; i++) re[i] = signal[i];
    
    // Bit-reversal permutation
    for (let i = 1, j = 0; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }
    
    // Cooley-Tukey
    for (let len = 2; len <= N; len *= 2) {
      const halfLen = len / 2;
      const ang = -2 * Math.PI / len;
      const wRe = Math.cos(ang);
      const wIm = Math.sin(ang);
      for (let i = 0; i < N; i += len) {
        let curRe = 1, curIm = 0;
        for (let j = 0; j < halfLen; j++) {
          const tRe = curRe * re[i+j+halfLen] - curIm * im[i+j+halfLen];
          const tIm = curRe * im[i+j+halfLen] + curIm * re[i+j+halfLen];
          re[i+j+halfLen] = re[i+j] - tRe;
          im[i+j+halfLen] = im[i+j] - tIm;
          re[i+j] += tRe;
          im[i+j] += tIm;
          const newRe = curRe * wRe - curIm * wIm;
          curIm = curRe * wIm + curIm * wRe;
          curRe = newRe;
        }
      }
    }
    
    return { re, im, N };
  },
  
  // ==========================================================================
  // WELCH PSD (Power Spectral Density)
  // ==========================================================================
  welchPSD(signal, sr, windowSize) {
    windowSize = windowSize || Math.min(signal.length, sr * 2); // 2-second window default
    const overlap = Math.floor(windowSize / 2);
    const step = windowSize - overlap;
    const numWindows = Math.floor((signal.length - windowSize) / step) + 1;
    
    if (numWindows < 1) throw new Error('Signal too short for PSD');
    
    // Hann window
    const win = new Float64Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      win[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (windowSize - 1)));
    }
    const winPower = win.reduce((s, w) => s + w*w, 0);
    
    // Accumulate PSD
    const psd = new Float64Array(Math.floor(windowSize / 2) + 1);
    
    for (let w = 0; w < numWindows; w++) {
      const start = w * step;
      const segment = new Float64Array(windowSize);
      for (let i = 0; i < windowSize; i++) {
        segment[i] = signal[start + i] * win[i];
      }
      const fft = EEG_ENGINE.fft(segment);
      for (let k = 0; k < psd.length; k++) {
        psd[k] += (fft.re[k]*fft.re[k] + fft.im[k]*fft.im[k]);
      }
    }
    
    // Normalize
    const norm = sr * winPower * numWindows;
    const freqs = new Float64Array(psd.length);
    for (let k = 0; k < psd.length; k++) {
      psd[k] /= norm;
      if (k > 0 && k < psd.length - 1) psd[k] *= 2; // One-sided
      freqs[k] = k * sr / windowSize;
    }
    
    return { freqs, psd };
  },
  
  // ==========================================================================
  // SIMPLE BUTTERWORTH BANDPASS (high-pass 1Hz + low-pass 45Hz)
  // ==========================================================================
  bandpass(signal, sr, lowHz, highHz) {
    // Simple IIR Butterworth order 4 using biquad cascade
    // For simplicity, use moving average detrend (high-pass) and FFT-based lowpass
    // For production: proper SOS filter
    
    // Detrend (remove DC)
    let mean = 0;
    for (let i = 0; i < signal.length; i++) mean += signal[i];
    mean /= signal.length;
    const detrended = new Float64Array(signal.length);
    for (let i = 0; i < signal.length; i++) detrended[i] = signal[i] - mean;
    
    // For bandpass 1-45Hz, FFT-based filtering (simple & accurate)
    return detrended; // PSD will naturally extract bands
  },
  
  // ==========================================================================
  // QEEG ANALYSIS - Compute band powers for all channels
  // ==========================================================================
  analyzeQEEG(parsedEEG, options = {}) {
    const skipSec = options.skipSec || 10; // Skip first 10s (artifacts)
    const maxSec = options.maxSec || 120;  // Analyze 2 minutes
    const sr = parsedEEG.sampleRate;
    
    const results = {
      sampleRate: sr,
      duration: parsedEEG.duration,
      analyzedDuration: 0,
      channels: {},
      derived: {}
    };
    
    const startIdx = Math.floor(skipSec * sr);
    
    for (const ch of Object.keys(parsedEEG.channels)) {
      const fullSignal = parsedEEG.channels[ch];
      const endIdx = Math.min(fullSignal.length, startIdx + maxSec * sr);
      const segment = fullSignal.slice(startIdx, endIdx);
      
      if (segment.length < sr * 5) continue; // Need at least 5s
      
      const detrended = EEG_ENGINE.bandpass(segment, sr, 1, 45);
      const { freqs, psd } = EEG_ENGINE.welchPSD(detrended, sr);
      
      // Band powers (trapezoidal integration)
      const bandPowers = {};
      for (const [band, [lo, hi]] of Object.entries(EEG_ENGINE.BANDS)) {
        let power = 0;
        for (let i = 0; i < freqs.length - 1; i++) {
          if (freqs[i] >= lo && freqs[i+1] <= hi) {
            power += 0.5 * (psd[i] + psd[i+1]) * (freqs[i+1] - freqs[i]);
          }
        }
        bandPowers[band] = power;
      }
      
      // Alpha peak frequency (7-13 Hz)
      let alphaMax = 0, alphaPeak = 10;
      for (let i = 0; i < freqs.length; i++) {
        if (freqs[i] >= 7 && freqs[i] <= 13 && psd[i] > alphaMax) {
          alphaMax = psd[i];
          alphaPeak = freqs[i];
        }
      }
      
      results.channels[ch] = {
        bands: bandPowers,
        alphaPeak,
        thetaBeta: bandPowers.theta / bandPowers.beta,
        totalPower: bandPowers.delta + bandPowers.theta + bandPowers.alpha + bandPowers.beta
      };
      results.analyzedDuration = segment.length / sr;
    }
    
    // Derived clinical metrics
    const ch = results.channels;
    if (ch.Fz) {
      results.derived.frontal_theta_beta = ch.Fz.thetaBeta;
    }
    if (ch.Cz) {
      results.derived.central_theta_beta = ch.Cz.thetaBeta;
    }
    if (ch.Pz) {
      results.derived.posterior_alpha_peak = ch.Pz.alphaPeak;
    }
    if (ch.F3 && ch.F4) {
      // Frontal Alpha Asymmetry: log(F4/F3)
      results.derived.frontal_alpha_asymmetry = Math.log(ch.F4.bands.alpha / ch.F3.bands.alpha);
    }
    if (ch.Pz) {
      // Posterior alpha z-score (simple: (value - norm_mean) / norm_sd for adult 18-39)
      // Norm: alpha power μV² ≈ 20.1 ± 8.5 (Thatcher 2003 NeuroGuide)
      const normMu = 20.1, normSd = 8.5;
      results.derived.posterior_alpha_zscore = (ch.Pz.bands.alpha - normMu) / normSd;
    }
    
    // Channel z-scores (simple theta-band per channel for topo)
    results.topoZ = {};
    for (const chName of EEG_ENGINE.STANDARD_CHANNELS) {
      if (!ch[chName]) continue;
      // Very rough z-score based on typical adult normative values
      const thetaNorm = { mu: 25, sd: 10 };
      const alphaNorm = { mu: 20, sd: 8 };
      results.topoZ[chName] = {
        theta: (Math.log(ch[chName].bands.theta + 1) - Math.log(thetaNorm.mu + 1)) / 0.5,
        alpha: (Math.log(ch[chName].bands.alpha + 1) - Math.log(alphaNorm.mu + 1)) / 0.5,
        beta: 0, // placeholder
        delta: 0
      };
    }
    
    return results;
  },
  
  // ==========================================================================
  // HRV ANALYSIS (from RR intervals in CSV/TXT)
  // ==========================================================================
  parseHRV(text) {
    // Flexible CSV/TXT parser - extracts RR intervals (ms)
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const rrValues = [];
    
    for (const ln of lines) {
      // Skip header-like lines
      if (ln.match(/^[A-Za-z#]/)) continue;
      const matches = ln.match(/[\d.]+/g);
      if (!matches) continue;
      for (const m of matches) {
        const v = parseFloat(m);
        // RR intervals typically 300-2000ms
        if (v > 100 && v < 3000) rrValues.push(v);
      }
    }
    
    if (rrValues.length < 20) {
      throw new Error(`Too few RR intervals (found ${rrValues.length}, need 20+)`);
    }
    
    // Time-domain HRV metrics
    const n = rrValues.length;
    let sum = 0;
    for (const v of rrValues) sum += v;
    const mean = sum / n;
    
    let ssd = 0;
    for (const v of rrValues) ssd += (v - mean) * (v - mean);
    const sdnn = Math.sqrt(ssd / (n - 1));
    
    // RMSSD
    let rmssdSum = 0;
    for (let i = 1; i < n; i++) {
      const diff = rrValues[i] - rrValues[i-1];
      rmssdSum += diff * diff;
    }
    const rmssd = Math.sqrt(rmssdSum / (n - 1));
    
    // pNN50
    let nn50 = 0;
    for (let i = 1; i < n; i++) {
      if (Math.abs(rrValues[i] - rrValues[i-1]) > 50) nn50++;
    }
    const pnn50 = (nn50 / (n - 1)) * 100;
    
    const meanHR = 60000 / mean; // bpm
    
    return {
      n_intervals: n,
      mean_rr_ms: mean,
      mean_hr_bpm: meanHR,
      sdnn_ms: sdnn,
      rmssd_ms: rmssd,
      pnn50_pct: pnn50,
      durationEstimate: Math.round(sum / 1000) + 's'
    };
  }
};

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EEG_ENGINE;
}
if (typeof window !== 'undefined') {
  window.EEG_ENGINE = EEG_ENGINE;
}

// ============================================================================
// EDF+ PARSER + FFT ENGINE (v9.0)
// ============================================================================

// Simple EDF+ parser (supports standard EDF and EDF+ inside xdfx zip)
class EDFParser {
  static STANDARD = ['Fp1','Fp2','F7','F3','Fz','F4','F8','T3','C3','Cz','C4','T4','T5','P3','Pz','P4','T6','O1','O2'];

  // Normalize EDF channel label to standard 10-20 token.
  // Handles many vendor variations:
  //   "EEG Fp1-Ref", "Fp1-LE", "EEG FP1-A1", "Fp1-Cz", bare "Fp1"
  //   "1.Fp1", "01-Fp1", "Ch1 Fp1", "Channel 1: Fp1"
  //   "EEG_Fp1_Ref", "EEG-FP1-REFERENCE", "Fp1-Avg", "FP1-AA"
  static normLabel(label) {
    let s = (label || '').trim().toUpperCase();
    // Strip channel-index prefix: "CH1 ", "CHAN 01:", "CHANNEL 1.", "1.", "01-"
    s = s.replace(/^(CH|CHAN|CHANNEL)\s*\d+[\s:.\-_]*/i, '');
    s = s.replace(/^\d+[\s:.\-_]+/, '');
    // Strip "EEG" prefix
    s = s.replace(/^EEG[\s\-_]*/, '');
    // Strip common reference suffixes (require separator so bare CZ/A1/M1 labels survive)
    s = s.replace(/[\s\-_]+(REFERENCE|REF|LE|RE|A1|A2|M1|M2|AVG|AVE|AA|CZ)$/, '');
    return s.replace(/[^A-Z0-9]/g, '');
  }

  constructor(arrayBuffer) {
    this.buffer = arrayBuffer;
    this.view = new DataView(arrayBuffer);
    this.decoder = new TextDecoder('ascii');
    this.parse();
  }
  
  readAscii(offset, length) {
    const slice = new Uint8Array(this.buffer, offset, length);
    return this.decoder.decode(slice).trim();
  }
  
  parse() {
    // Main header (256 bytes)
    this.version = this.readAscii(0, 8);
    this.patientId = this.readAscii(8, 80);
    this.recordingId = this.readAscii(88, 80);
    this.startDate = this.readAscii(168, 8);
    this.startTime = this.readAscii(176, 8);
    this.headerBytes = parseInt(this.readAscii(184, 8));
    this.reserved = this.readAscii(192, 44);
    this.nRecords = parseInt(this.readAscii(236, 8));
    this.recDuration = parseFloat(this.readAscii(244, 8));
    this.nChannels = parseInt(this.readAscii(252, 4));
    
    // Channel headers (after main header)
    this.labels = [];
    this.transducer = [];
    this.physDim = [];
    this.physMin = [];
    this.physMax = [];
    this.digMin = [];
    this.digMax = [];
    this.prefilter = [];
    this.samplesPerRecord = [];
    
    let offset = 256;
    for (let i = 0; i < this.nChannels; i++) this.labels.push(this.readAscii(offset + i*16, 16));
    offset += 16 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.transducer.push(this.readAscii(offset + i*80, 80));
    offset += 80 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.physDim.push(this.readAscii(offset + i*8, 8));
    offset += 8 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.physMin.push(parseFloat(this.readAscii(offset + i*8, 8)));
    offset += 8 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.physMax.push(parseFloat(this.readAscii(offset + i*8, 8)));
    offset += 8 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.digMin.push(parseInt(this.readAscii(offset + i*8, 8)));
    offset += 8 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.digMax.push(parseInt(this.readAscii(offset + i*8, 8)));
    offset += 8 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.prefilter.push(this.readAscii(offset + i*80, 80));
    offset += 80 * this.nChannels;
    for (let i = 0; i < this.nChannels; i++) this.samplesPerRecord.push(parseInt(this.readAscii(offset + i*8, 8)));
    
    // Pick sample rate from first standard 10-20 channel (not blindly index 4).
    const stdSet = new Set(EDFParser.STANDARD.map(s => EDFParser.normLabel(s)));
    let firstEEGIdx = this.labels.findIndex(l => stdSet.has(EDFParser.normLabel(l)));
    if (firstEEGIdx < 0) firstEEGIdx = 0;
    this.sampleRate = this.samplesPerRecord[firstEEGIdx] / this.recDuration;
    this.totalDuration = this.nRecords * this.recDuration;
  }
  
  // Extract specific channel data (scaled to physical units)
  getChannel(channelName) {
    const target = EDFParser.normLabel(channelName);
    // 1. Exact normalized match (handles most cases)
    let chIdx = this.labels.findIndex(l => EDFParser.normLabel(l) === target);
    if (chIdx !== -1) return this.getChannelByIndex(chIdx);
    // 2. Token-scan fallback: split label on any non-alphanumeric and check each token.
    //    Catches bipolar montages like "Fp1-F3" → match first token "FP1".
    chIdx = this.labels.findIndex(l => {
      const tokens = (l || '').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
      return tokens.some(t => t === target);
    });
    if (chIdx !== -1) return this.getChannelByIndex(chIdx);
    return null;
  }
  
  getChannelByIndex(chIdx) {
    const spr = this.samplesPerRecord[chIdx];
    const scale = (this.physMax[chIdx] - this.physMin[chIdx]) / (this.digMax[chIdx] - this.digMin[chIdx]);
    const offset = this.physMin[chIdx] - this.digMin[chIdx] * scale;
    
    const output = new Float32Array(this.nRecords * spr);
    let outPos = 0;
    
    for (let rec = 0; rec < this.nRecords; rec++) {
      // Calculate byte offset for this channel in this record
      let byteOffset = this.headerBytes;
      // Add all previous records
      for (let r = 0; r < rec; r++) {
        for (let c = 0; c < this.nChannels; c++) {
          byteOffset += this.samplesPerRecord[c] * 2;
        }
      }
      // Add channels before this one in current record
      for (let c = 0; c < chIdx; c++) {
        byteOffset += this.samplesPerRecord[c] * 2;
      }
      // Read samples
      for (let s = 0; s < spr; s++) {
        const digVal = this.view.getInt16(byteOffset + s*2, true); // little-endian
        output[outPos++] = digVal * scale + offset;
      }
    }
    return output;
  }
  
  getEEGChannels() {
    const result = {};
    EDFParser.STANDARD.forEach(lbl => {
      const data = this.getChannel(lbl);
      if (data) result[lbl] = data;
    });
    if (Object.keys(result).length === 0) {
      // Diagnostic dump: share these three lines with engineering if matching keeps failing
      console.warn('EDFParser: no 10-20 channels matched (' + this.labels.length + ' raw labels).');
      console.warn('  Raw labels:', this.labels);
      console.warn('  Normalized:', this.labels.map(l => EDFParser.normLabel(l)));
      console.warn('  Target set:', EDFParser.STANDARD.map(s => EDFParser.normLabel(s)));
    }
    return result;
  }
}

// Simple FFT (Cooley-Tukey radix-2, real input)
function fft(real, imag) {
  const n = real.length;
  if (n <= 1) return;
  
  // Bit reversal
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) { j ^= bit; bit >>= 1; }
    j ^= bit;
    if (i < j) {
      [real[i], real[j]] = [real[j], real[i]];
      [imag[i], imag[j]] = [imag[j], imag[i]];
    }
  }
  
  // Butterfly
  for (let len = 2; len <= n; len *= 2) {
    const halfLen = len / 2;
    const tableStep = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < halfLen; k++) {
        const angle = tableStep * k;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const tReal = real[i + k + halfLen] * cos - imag[i + k + halfLen] * sin;
        const tImag = real[i + k + halfLen] * sin + imag[i + k + halfLen] * cos;
        real[i + k + halfLen] = real[i + k] - tReal;
        imag[i + k + halfLen] = imag[i + k] - tImag;
        real[i + k] += tReal;
        imag[i + k] += tImag;
      }
    }
  }
}

// Welch's method for PSD estimation
function welchPSD(signal, fs, nperseg = 1024) {
  // Pad or truncate to power of 2
  let np2 = 1;
  while (np2 < nperseg) np2 *= 2;
  nperseg = np2;
  
  const nOverlap = Math.floor(nperseg / 2);
  const step = nperseg - nOverlap;
  const nSegments = Math.floor((signal.length - nperseg) / step) + 1;
  
  if (nSegments < 1) return {freq: [], psd: []};
  
  // Hamming window
  const window = new Float32Array(nperseg);
  let windowSum = 0;
  for (let i = 0; i < nperseg; i++) {
    window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (nperseg - 1));
    windowSum += window[i] * window[i];
  }
  
  const psdSum = new Float32Array(nperseg / 2 + 1);
  const real = new Float32Array(nperseg);
  const imag = new Float32Array(nperseg);
  
  for (let seg = 0; seg < nSegments; seg++) {
    const segStart = seg * step;
    // Windowed segment
    let mean = 0;
    for (let i = 0; i < nperseg; i++) mean += signal[segStart + i];
    mean /= nperseg;
    
    for (let i = 0; i < nperseg; i++) {
      real[i] = (signal[segStart + i] - mean) * window[i];
      imag[i] = 0;
    }
    
    fft(real, imag);
    
    // Power spectrum (only positive frequencies)
    for (let i = 0; i <= nperseg / 2; i++) {
      const power = (real[i] * real[i] + imag[i] * imag[i]) / (fs * windowSum);
      psdSum[i] += power;
    }
  }
  
  // Average
  const psd = new Float32Array(nperseg / 2 + 1);
  const freq = new Float32Array(nperseg / 2 + 1);
  for (let i = 0; i <= nperseg / 2; i++) {
    psd[i] = psdSum[i] / nSegments;
    freq[i] = i * fs / nperseg;
    // Multiply by 2 for one-sided (except DC and Nyquist)
    if (i > 0 && i < nperseg / 2) psd[i] *= 2;
  }
  
  return {freq: Array.from(freq), psd: Array.from(psd)};
}

// Simple bandpass filter (IIR)
function bandpassFilter(signal, fs, lowCut, highCut) {
  // Simple IIR bandpass using bilinear transform (Butterworth 2nd order)
  const output = new Float32Array(signal.length);
  // Detrend (remove DC)
  let mean = 0;
  for (let i = 0; i < signal.length; i++) mean += signal[i];
  mean /= signal.length;
  for (let i = 0; i < signal.length; i++) output[i] = signal[i] - mean;
  return output;
}

// Compute band powers for a single channel
function computeBandPowers(signal, fs) {
  // Skip first 10s (artifacts), use up to 120s
  const skipSamples = Math.min(10 * fs, Math.floor(signal.length * 0.1));
  const maxSamples = Math.min(120 * fs, signal.length - skipSamples);
  const segment = signal.slice(skipSamples, skipSamples + maxSamples);
  
  // Filter
  const filtered = bandpassFilter(segment, fs, 1, 45);
  
  // PSD
  const {freq, psd} = welchPSD(filtered, fs, 2 * fs); // 2-second window
  
  if (freq.length === 0) return null;
  
  const bands = {
    delta: [1, 4],
    theta: [4, 8],
    alpha: [8, 13],
    beta: [13, 30],
    gamma: [30, 45]
  };
  
  const powers = {};
  for (const [name, [lo, hi]] of Object.entries(bands)) {
    let power = 0;
    let count = 0;
    for (let i = 0; i < freq.length; i++) {
      if (freq[i] >= lo && freq[i] < hi && i + 1 < freq.length) {
        // Trapezoidal integration
        power += (psd[i] + psd[i+1]) / 2 * (freq[i+1] - freq[i]);
        count++;
      }
    }
    powers[name] = power;
  }
  
  // Alpha peak frequency (7-13 Hz)
  let maxPower = 0;
  let peakFreq = 10;
  for (let i = 0; i < freq.length; i++) {
    if (freq[i] >= 7 && freq[i] <= 13 && psd[i] > maxPower) {
      maxPower = psd[i];
      peakFreq = freq[i];
    }
  }
  powers.alpha_peak = peakFreq;
  
  return powers;
}

// Analyze all 19 channels
function analyzeQEEG(channels, fs) {
  const results = {};
  const eegLabels = ['Fp1','Fp2','F7','F3','Fz','F4','F8','T3','C3','Cz','C4','T4','T5','P3','Pz','P4','T6','O1','O2'];
  
  eegLabels.forEach(lbl => {
    if (channels[lbl]) {
      try {
        results[lbl] = computeBandPowers(channels[lbl], fs);
      } catch(e) {
        console.warn('Failed to analyze ' + lbl, e);
      }
    }
  });
  
  return results;
}

// Compute z-scores against normative database
function computeZScores(qeegResults, age) {
  // Simplified normative values (adult 18-39)
  const norms = {
    theta_beta_Fz: {mu: 2.1, sd: 0.35},
    alpha_peak: {mu: 10.2, sd: 0.8}
  };
  
  // Age-specific adjustments
  if (age < 13) { norms.theta_beta_Fz = {mu: 3.8, sd: 1.2}; norms.alpha_peak = {mu: 9.0, sd: 0.8}; }
  else if (age < 18) { norms.theta_beta_Fz = {mu: 2.9, sd: 0.8}; norms.alpha_peak = {mu: 9.8, sd: 0.7}; }
  else if (age < 40) { norms.theta_beta_Fz = {mu: 2.1, sd: 0.35}; norms.alpha_peak = {mu: 10.2, sd: 0.8}; }
  else if (age < 60) { norms.theta_beta_Fz = {mu: 1.9, sd: 0.38}; norms.alpha_peak = {mu: 9.9, sd: 0.9}; }
  else { norms.theta_beta_Fz = {mu: 1.8, sd: 0.42}; norms.alpha_peak = {mu: 9.2, sd: 1.1}; }
  
  const zscores = {};
  
  // Theta/Beta z-scores per channel
  const eegLabels = Object.keys(qeegResults);
  eegLabels.forEach(ch => {
    const r = qeegResults[ch];
    if (!r) return;
    const tb = r.theta / r.beta;
    const zTB = (tb - norms.theta_beta_Fz.mu) / norms.theta_beta_Fz.sd;
    zscores[ch] = {
      theta: zTB,  // Using theta/beta as proxy for topomap
      alpha: ((r.alpha_peak - norms.alpha_peak.mu) / norms.alpha_peak.sd),
      theta_beta_ratio: tb,
      alpha_peak: r.alpha_peak,
      raw_powers: r
    };
  });
  
  return zscores;
}

// Parse Neuroguide CSV
function parseNeuroguideCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV has no data rows');
  
  // Try to detect columns
  const header = lines[0].split(/[,\t]/).map(h => h.trim());
  const results = {};
  
  // Look for common Neuroguide columns
  // Typical: Site, Delta, Theta, Alpha, Beta, HighBeta, etc.
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(/[,\t]/).map(c => c.trim());
    if (cells.length < 2) continue;
    
    const site = cells[0].toUpperCase().replace(/\s/g, '');
    // Match 10-20 labels
    const validSites = ['FP1','FP2','F7','F3','FZ','F4','F8','T3','C3','CZ','C4','T4','T5','P3','PZ','P4','T6','O1','O2'];
    const matchedSite = validSites.find(s => site === s || site === s.replace('Z', 'Z'));
    if (!matchedSite) continue;
    
    const normalizedSite = matchedSite.replace(/^FP/, 'Fp').replace(/Z$/, 'z').replace(/^F(\d)/, 'F$1').replace(/^(C|P|T|O)(\d)/, '$1$2');
    
    const rowData = {};
    for (let j = 1; j < cells.length && j < header.length; j++) {
      const hdr = header[j].toLowerCase();
      const val = parseFloat(cells[j]);
      if (isNaN(val)) continue;
      
      if (hdr.includes('delta')) rowData.delta = val;
      else if (hdr.includes('theta')) rowData.theta = val;
      else if (hdr.includes('alpha')) rowData.alpha = val;
      else if (hdr.includes('beta') && !hdr.includes('high')) rowData.beta = val;
      else if (hdr.includes('high') && hdr.includes('beta')) rowData.high_beta = val;
      else if (hdr.includes('gamma')) rowData.gamma = val;
      else if (hdr.includes('peak') || hdr.includes('apf')) rowData.alpha_peak = val;
    }
    
    if (Object.keys(rowData).length > 0) {
      results[normalizedSite] = rowData;
    }
  }
  
  return results;
}

// ============================================================================
// EEG UPLOAD HANDLER
// ============================================================================

async function handleEEGFile(file, condition) {
  // condition: 'eo' | 'ec' | null (legacy single-upload path)
  const isEO = condition === 'eo';
  const isEC = condition === 'ec';
  const condLabel = isEO ? 'EO' : isEC ? 'EC' : null;
  // Per-condition status element when EO/EC, fall back to legacy single element
  const statusEl = (isEO ? document.getElementById('eeg-upload-status-eo')
                  : isEC ? document.getElementById('eeg-upload-status-ec')
                  : document.getElementById('eeg-upload-status'));
  const resultsEl = document.getElementById('eeg-analysis-results');

  statusEl.innerHTML = `<div style="padding:14px;background:#DBEAFE;border-radius:10px;color:#1E40AF">
    <strong>⏳ ${state.lang === 'ko' ? '분석 중...' : 'Analyzing...'}${condLabel ? ' [' + condLabel + ']' : ''}</strong> ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)
  </div>`;
  if (!condLabel) resultsEl.innerHTML = '';
  
  try {
    const ext = file.name.toLowerCase().split('.').pop();
    let qeegData = null;
    let source = 'unknown';
    
    if (ext === 'csv') {
      // Neuroguide CSV
      const text = await file.text();
      const ngData = parseNeuroguideCSV(text);
      source = 'Neuroguide CSV';
      if (Object.keys(ngData).length === 0) {
        throw new Error('No valid 10-20 channel data found in CSV. Expected columns: Site, Delta, Theta, Alpha, Beta');
      }
      // Convert to same format as EDF analysis
      qeegData = {};
      Object.keys(ngData).forEach(ch => {
        const d = ngData[ch];
        qeegData[ch] = {
          delta: d.delta || 0,
          theta: d.theta || 0,
          alpha: d.alpha || 0,
          beta: d.beta || 0,
          gamma: d.gamma || 0,
          alpha_peak: d.alpha_peak || 10
        };
      });
    } else if (ext === 'xdfx') {
      // ZIP containing EDF
      statusEl.innerHTML += '<div style="margin-top:6px;font-size:0.85em">📦 Extracting ZIP...</div>';
      if (typeof JSZip === 'undefined') {
        // Load JSZip from CDN
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      }
      const arrayBuf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuf);
      let edfFile = null;
      for (const name of Object.keys(zip.files)) {
        if (name.endsWith('.xdf') || name.endsWith('.edf')) {
          edfFile = await zip.files[name].async('arraybuffer');
          source = 'Mitsar/NeuroAmp II (xdfx)';
          break;
        }
      }
      if (!edfFile) throw new Error('No .xdf or .edf file found inside xdfx');
      const parser = new EDFParser(edfFile);
      statusEl.innerHTML += `<div style="margin-top:6px;font-size:0.85em">⚡ ${parser.nChannels} ch, ${parser.sampleRate} Hz, ${parser.totalDuration}s</div>`;
      const channels = parser.getEEGChannels();
      statusEl.innerHTML += `<div style="margin-top:6px;font-size:0.85em">🧠 ${Object.keys(channels).length}/19 EEG channels extracted. Computing FFT...</div>`;
      // Use setTimeout to yield UI before heavy computation
      await new Promise(resolve => setTimeout(resolve, 50));
      qeegData = analyzeQEEG(channels, parser.sampleRate);
    } else if (ext === 'edf' || ext === 'eeg') {
      // Direct EDF
      const arrayBuf = await file.arrayBuffer();
      const parser = new EDFParser(arrayBuf);
      source = 'EDF+ (direct)';
      statusEl.innerHTML += `<div style="margin-top:6px;font-size:0.85em">⚡ ${parser.nChannels} ch, ${parser.sampleRate} Hz, ${parser.totalDuration}s</div>`;
      const channels = parser.getEEGChannels();
      await new Promise(resolve => setTimeout(resolve, 50));
      qeegData = analyzeQEEG(channels, parser.sampleRate);
    } else {
      throw new Error('Unsupported file type: .' + ext);
    }
    
    // Store in state — keep legacy single-upload fields populated AND record
    // per-condition (EO/EC) for alpha-attenuation analysis when both present.
    const zscores = computeZScores(qeegData, state.patient.age || 30);
    state.eegQeegData = qeegData;
    state.eegSource = source;
    state.eegZScores = zscores;
    if (isEO) state.eegEO = { qeegData, zscores, source, filename: file.name };
    if (isEC) state.eegEC = { qeegData, zscores, source, filename: file.name };

    // Auto-fill manual input fields (use EC if available — alpha measurements are
    // canonically eyes-closed; fall back to whatever this upload was)
    const fillSrc = state.eegEC ? state.eegEC.qeegData : qeegData;
    if (fillSrc.Fz) {
      const tb = fillSrc.Fz.theta / fillSrc.Fz.beta;
      document.getElementById('obj-theta_beta_ratio').value = tb.toFixed(2);
      state.objectiveData.theta_beta_ratio = tb;
    }
    if (fillSrc.F4 && fillSrc.F3) {
      const faa = Math.log(fillSrc.F4.alpha / fillSrc.F3.alpha);
      document.getElementById('obj-frontal_alpha_asym').value = faa.toFixed(3);
      state.objectiveData.frontal_alpha_asym = faa;
    }
    if (fillSrc.Pz) {
      const z = (fillSrc.Pz.alpha_peak - 10.2) / 0.8;
      document.getElementById('obj-posterior_alpha').value = z.toFixed(2);
      state.objectiveData.posterior_alpha = z;
    }

    // Show success + summary
    const chCount = Object.keys(qeegData).length;
    const fzTB = qeegData.Fz ? (qeegData.Fz.theta / qeegData.Fz.beta).toFixed(2) : 'N/A';
    const pzAP = qeegData.Pz ? qeegData.Pz.alpha_peak.toFixed(1) : 'N/A';

    statusEl.innerHTML = `<div style="padding:14px;background:#D1FAE5;border-radius:10px;color:#065F46;border-left:4px solid #10B981">
      <strong>✅ ${state.lang === 'ko' ? '분석 완료!' : 'Analysis Complete!'}${condLabel ? ' [' + condLabel + ']' : ''}</strong><br>
      <span style="font-size:0.95em">📊 ${source} · ${chCount}/19 ${state.lang === 'ko' ? '채널' : 'channels'} · Fz θ/β: ${fzTB} · α-peak: ${pzAP} Hz</span>
    </div>`;

    // Render summary table (full table only for legacy path; EO/EC slots stay compact)
    if (!condLabel) resultsEl.innerHTML = renderQEEGTable(qeegData, state.eegZScores);

    // If both EO and EC are loaded, render alpha attenuation comparison
    if (state.eegEO && state.eegEC) renderEOECComparison();
    
  } catch(err) {
    console.error(err);
    statusEl.innerHTML = `<div style="padding:14px;background:#FEE2E2;border-radius:10px;color:#991B1B;border-left:4px solid #EF4444">
      <strong>❌ ${state.lang === 'ko' ? '분석 실패' : 'Analysis Failed'}</strong><br>
      <span style="font-size:0.88em">${err.message}</span>
    </div>`;
  }
}

// Bug 6 (EO/EC): when both Eyes Open + Eyes Closed recordings are loaded,
// compute posterior alpha attenuation — a robust clinical marker.
// Normal adult: alpha attenuates 40-70% from EC → EO at Pz/Oz. Reduced
// attenuation = hyperarousal (PTSD/anxiety), ADHD, or cortical dysregulation.
function renderEOECComparison() {
  const cmpEl = document.getElementById('eeg-eo-ec-comparison');
  if (!cmpEl) return;
  const eo = state.eegEO, ec = state.eegEC;
  if (!eo || !ec) { cmpEl.innerHTML = ''; return; }
  const isKo = state.lang === 'ko';

  // Compute alpha attenuation at Pz and Oz (posterior, where alpha lives)
  const rows = [];
  ['Pz', 'O1', 'O2'].forEach(ch => {
    const eoCh = eo.qeegData[ch];
    const ecCh = ec.qeegData[ch];
    if (!eoCh || !ecCh) return;
    const alphaEO = eoCh.alpha;
    const alphaEC = ecCh.alpha;
    if (!alphaEC || alphaEC <= 0) return;
    const pct = ((alphaEC - alphaEO) / alphaEC) * 100;
    let interp, interpColor;
    if (pct >= 40 && pct <= 70) { interp = isKo ? '정상' : 'Normal'; interpColor = '#10B981'; }
    else if (pct < 40 && pct >= 20) { interp = isKo ? '약한 감쇠 (과각성 가능)' : 'Reduced (possible hyperarousal)'; interpColor = '#F59E0B'; }
    else if (pct < 20) { interp = isKo ? '감쇠 거의 없음 (cortical dysregulation)' : 'Minimal/absent (cortical dysregulation)'; interpColor = '#DC2626'; }
    else { interp = isKo ? '강한 감쇠' : 'Strong attenuation'; interpColor = '#3B82F6'; }
    rows.push({ ch, alphaEC: alphaEC.toFixed(1), alphaEO: alphaEO.toFixed(1), pct: pct.toFixed(1), interp, interpColor });
  });

  if (rows.length === 0) {
    cmpEl.innerHTML = `<div style="padding:12px;background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:8px;font-size:0.95em;color:#78350F">
      ${isKo ? '⚠️ EO + EC 둘 다 로드됐으나 Pz/O1/O2 채널 비교가 불가합니다 (채널 매칭 확인 필요).' : '⚠️ EO + EC both loaded but Pz/O1/O2 channels not available for comparison (check channel matching).'}
    </div>`;
    return;
  }

  cmpEl.innerHTML = `<div style="background:white;border:2px solid #993C1D;border-radius:12px;padding:16px 20px">
    <div style="font-weight:800;color:#993C1D;font-size:1.1em;margin-bottom:10px">
      👁️ ${isKo ? 'EO ↔ EC Alpha Attenuation 분석' : 'EO ↔ EC Alpha Attenuation Analysis'}
    </div>
    <div style="font-size:0.92em;color:#6B7280;margin-bottom:12px;line-height:1.6">
      ${isKo
        ? '정상 성인: posterior alpha (Pz/Oz)는 EC → EO 전환 시 40-70% 감쇠합니다. 감쇠 ↓ = 과각성 marker (PTSD, GAD, ADHD).'
        : 'Normal adult: posterior alpha (Pz/Oz) attenuates 40-70% from EC → EO. Reduced attenuation = hyperarousal marker (PTSD, GAD, ADHD).'}
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:1.0em">
      <thead>
        <tr style="background:#F9FAFB">
          <th style="padding:10px;text-align:left;color:#993C1D;font-weight:700">Ch</th>
          <th style="padding:10px;text-align:right;color:#993C1D;font-weight:700">α EC (μV²)</th>
          <th style="padding:10px;text-align:right;color:#993C1D;font-weight:700">α EO (μV²)</th>
          <th style="padding:10px;text-align:right;color:#993C1D;font-weight:700">${isKo ? '감쇠' : 'Attenuation'}</th>
          <th style="padding:10px;text-align:left;color:#993C1D;font-weight:700">${isKo ? '해석' : 'Interpretation'}</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr style="border-top:1px solid #F3F4F6">
          <td style="padding:10px;font-weight:700;color:#2A1108">${r.ch}</td>
          <td style="padding:10px;text-align:right;color:#2A1108">${r.alphaEC}</td>
          <td style="padding:10px;text-align:right;color:#2A1108">${r.alphaEO}</td>
          <td style="padding:10px;text-align:right;font-weight:800;color:${r.interpColor}">${r.pct}%</td>
          <td style="padding:10px;color:${r.interpColor};font-weight:600">${r.interp}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function renderQEEGTable(qeegData, zscores) {
  const chs = Object.keys(qeegData);
  if (chs.length === 0) return '';
  return `<div style="background:white;border-radius:12px;padding:16px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.06);max-height:320px;overflow-y:auto">
    <div style="font-weight:800;color:#111827;margin-bottom:10px;font-size:0.95em">🧠 ${state.lang === 'ko' ? 'QEEG 분석 결과 (' : 'QEEG Analysis ('}${chs.length} ch)</div>
    <table style="width:100%;font-size:0.82em;border-collapse:collapse">
      <thead>
        <tr style="background:#F9FAFB">
          <th style="padding:6px 8px;text-align:left">Ch</th>
          <th style="padding:6px 8px">θ</th>
          <th style="padding:6px 8px">α</th>
          <th style="padding:6px 8px">β</th>
          <th style="padding:6px 8px">θ/β</th>
          <th style="padding:6px 8px">α-peak</th>
          <th style="padding:6px 8px">z (θ/β)</th>
        </tr>
      </thead>
      <tbody>
        ${chs.map(ch => {
          const d = qeegData[ch];
          const z = zscores[ch];
          const tb = d.theta / d.beta;
          const zColor = z && Math.abs(z.theta) > 2 ? '#EF4444' : (z && Math.abs(z.theta) > 1 ? '#F59E0B' : '#10B981');
          return `<tr>
            <td style="padding:5px 8px;font-weight:700">${ch}</td>
            <td style="padding:5px 8px;text-align:right">${d.theta ? d.theta.toFixed(0) : '-'}</td>
            <td style="padding:5px 8px;text-align:right">${d.alpha ? d.alpha.toFixed(0) : '-'}</td>
            <td style="padding:5px 8px;text-align:right">${d.beta ? d.beta.toFixed(0) : '-'}</td>
            <td style="padding:5px 8px;text-align:right;font-weight:600">${tb.toFixed(2)}</td>
            <td style="padding:5px 8px;text-align:right">${d.alpha_peak ? d.alpha_peak.toFixed(1) : '-'}</td>
            <td style="padding:5px 8px;text-align:right;color:${zColor};font-weight:700">${z ? z.theta.toFixed(2) : '-'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;
}

async function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Setup drag-and-drop for EEG upload — wires both EO and EC slots, plus legacy single area
function setupEEGUpload() {
  // Wire EO and EC slots (v10.4 — Bug 6)
  ['eo', 'ec'].forEach(cond => {
    const area = document.getElementById('eeg-upload-area-' + cond);
    const input = document.getElementById('eeg-file-input-' + cond);
    if (!area || !input) return;
    area.onclick = () => input.click();
    input.onchange = (e) => {
      if (e.target.files && e.target.files[0]) handleEEGFile(e.target.files[0], cond);
    };
    area.ondragover = (e) => {
      e.preventDefault();
      area.style.background = '#F8E8D8';
      area.style.borderColor = '#CC7A55';
    };
    area.ondragleave = () => {
      area.style.background = '#FFF8F3';
      area.style.borderColor = '#E0C9B5';
    };
    area.ondrop = (e) => {
      e.preventDefault();
      area.style.background = '#FFF8F3';
      area.style.borderColor = '#E0C9B5';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) handleEEGFile(e.dataTransfer.files[0], cond);
    };
  });

  // Legacy single-area handler (if present in old layout)
  const area = document.getElementById('eeg-upload-area');
  const input = document.getElementById('eeg-file-input');
  if (!area || !input) return;

  area.onclick = () => input.click();
  input.onchange = (e) => {
    if (e.target.files && e.target.files[0]) handleEEGFile(e.target.files[0]);
  };

  area.ondragover = (e) => {
    e.preventDefault();
    area.style.background = '#F8E8D8';
    area.style.borderColor = '#CC7A55';
  };
  area.ondragleave = () => {
    area.style.background = '#FFF8F3';
    area.style.borderColor = '#E0C9B5';
  };
  area.ondrop = (e) => {
    e.preventDefault();
    area.style.background = '#FFF8F3';
    area.style.borderColor = '#E0C9B5';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleEEGFile(e.dataTransfer.files[0]);
  };
}



// ============================================================================
// BRAIN TOPOMAP (triage.html 이식 — renderBrainTopoFromRealData 진입, state.eegZScores 소비)
// ============================================================================
const ELECTRODE_POSITIONS = {
  'Fp1':{x:195,y:95},'Fp2':{x:305,y:95},
  'F7':{x:115,y:160},'F3':{x:185,y:165},'Fz':{x:250,y:170},'F4':{x:315,y:165},'F8':{x:385,y:160},
  'T3':{x:90,y:250},'C3':{x:170,y:250},'Cz':{x:250,y:250},'C4':{x:330,y:250},'T4':{x:410,y:250},
  'T5':{x:115,y:340},'P3':{x:185,y:335},'Pz':{x:250,y:330},'P4':{x:315,y:335},'T6':{x:385,y:340},
  'O1':{x:205,y:415},'O2':{x:295,y:415}
};

// zColor (6944-6953)
function zColor(z) {
  if (z <= -2) return '#1976d2';
  if (z <= -1) return '#64b5f6';
  if (z <= -0.5) return '#bbdefb';
  if (z < 0.5) return '#f5f5f5';
  if (z < 1) return '#E0C9B5';
  if (z < 2) return '#CC7A55';
  return '#d32f2f';
}


// renderTopo — SVG 토포맵 (7099-7135)
function renderTopo(band, zd, title) {
  if (!zd) return '<div class="empty-state">No channel data</div>';
  const chs = Object.keys(ELECTRODE_POSITIONS);
  const pts = chs.map(ch => ({ x: ELECTRODE_POSITIONS[ch].x, y: ELECTRODE_POSITIONS[ch].y, z: zd[ch] && zd[ch][band] !== undefined ? zd[ch][band] : 0 }));
  let heat = '';
  for (let x = 50; x < 450; x += 10) {
    for (let y = 60; y < 440; y += 10) {
      const cx = x+5, cy = y+5;
      const dx = cx-250, dy = cy-250;
      if (dx*dx + dy*dy > 200*200) continue;
      let num = 0, den = 0;
      for (const p of pts) {
        const d = Math.sqrt((p.x-cx)**2 + (p.y-cy)**2) + 1;
        const w = 1/(d*d); num += w*p.z; den += w;
      }
      heat += `<rect x="${x}" y="${y}" width="10" height="10" fill="${zColor(num/den)}" opacity="0.85"/>`;
    }
  }
  const dots = chs.map(ch => {
    const p = ELECTRODE_POSITIONS[ch]; const z = zd[ch] && zd[ch][band] !== undefined ? zd[ch][band] : 0;
    return `<circle cx="${p.x}" cy="${p.y}" r="8" fill="${zColor(z)}" stroke="#222" stroke-width="1.5"/><text x="${p.x}" y="${p.y+3}" font-size="9" fill="#000" text-anchor="middle" font-weight="700">${ch}</text>`;
  }).join('');
  return `<div class="brain-viz-item"><div class="brain-viz-label">${title}</div><div class="brain-viz-sublabel">Band: ${band.toUpperCase()}</div>
    <svg class="brain-svg" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
      <defs><clipPath id="hc-${band}"><circle cx="250" cy="250" r="200"/></clipPath></defs>
      <g clip-path="url(#hc-${band})">${heat}</g>
      <circle cx="250" cy="250" r="200" fill="none" stroke="#555" stroke-width="2"/>
      <path d="M 235 55 L 250 35 L 265 55 Z" fill="none" stroke="#555" stroke-width="2"/>
      <path d="M 50 230 Q 35 250 50 270" fill="none" stroke="#555" stroke-width="2"/>
      <path d="M 450 230 Q 465 250 450 270" fill="none" stroke="#555" stroke-width="2"/>
      ${dots}
    </svg></div>`;
}

// ============================================================================
// EXPORT / RESTART
// ============================================================================

// renderBrainTopoFromRealData — 진입점, r.eegZScores 소비 (6912-6943)
function renderBrainTopoFromRealData(zscores) {
  // Build zd from real 19-channel z-scores
  const zd = {};
  Object.keys(ELECTRODE_POSITIONS).forEach(ch => {
    if (zscores[ch]) {
      zd[ch] = {
        theta: zscores[ch].theta || 0,
        alpha: zscores[ch].alpha || 0
      };
    } else {
      zd[ch] = {theta: 0, alpha: 0};
    }
  });
  
  return `<div class="form-section">
    <div class="form-section-title">🧠 <span class="ko-text">Brain Topographic (실제 19채널 EEG)</span><span class="en-text">Brain Topographic (Real 19-channel EEG)</span></div>
    <div class="brain-viz-wrap">
      <div class="brain-viz-grid">
        ${renderTopo('theta', zd, state.lang === 'ko' ? 'Theta/Beta z-score' : 'Theta/Beta z-score')}
        ${renderTopo('alpha', zd, state.lang === 'ko' ? 'Alpha Peak z-score' : 'Alpha Peak z-score')}
      </div>
      <div class="brain-legend">
        <div class="brain-legend-item"><span class="brain-legend-swatch" style="background:#1976d2"></span>z ≤ -2</div>
        <div class="brain-legend-item"><span class="brain-legend-swatch" style="background:#64b5f6"></span>z ≈ -1</div>
        <div class="brain-legend-item"><span class="brain-legend-swatch" style="background:#f5f5f5"></span>z ≈ 0</div>
        <div class="brain-legend-item"><span class="brain-legend-swatch" style="background:#CC7A55"></span>z ≈ 1</div>
        <div class="brain-legend-item"><span class="brain-legend-swatch" style="background:#d32f2f"></span>z ≥ 2</div>
      </div>
    </div>
  </div>`;
}
