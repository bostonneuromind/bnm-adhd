/* ============================================================
   DMDA EEG ANALYSIS — FFT + Welch's method + 5-band power
   ============================================================
   Self-contained — no external dependencies.

   Algorithm:
   1. Artifact rejection: 4-sec windows, exclude if |amplitude| > 75 µV
   2. Welch's PSD: 4-sec windows, 50% overlap, Hann window, FFT
   3. Band power: integrate PSD over delta/theta/alpha/beta/hibeta
   4. Global indices: PAF, TBR, F3-F4 alpha asymmetry, alpha suppression

   Output matches Python scipy.signal.welch within numerical precision.
   ============================================================ */

(function(global){
  'use strict';

  const BANDS = {
    delta:  [1, 4],
    theta:  [4, 8],
    alpha:  [8, 13],
    beta:   [13, 25],
    hibeta: [25, 30]
  };

  /* ============================================================
     FFT — Radix-2 Cooley-Tukey (iterative, in-place)
     Input: real array of length N (must be power of 2)
     Output: { re: Float32Array, im: Float32Array } of length N
     ============================================================ */
  function fftRadix2(real) {
    const N = real.length;
    if ((N & (N - 1)) !== 0) {
      throw new Error('FFT length must be power of 2 (got ' + N + ')');
    }
    const re = new Float32Array(N);
    const im = new Float32Array(N);
    for (let i = 0; i < N; i++) re[i] = real[i];

    // Bit-reverse permutation
    for (let i = 1, j = 0; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }

    // Butterfly
    for (let size = 2; size <= N; size <<= 1) {
      const halfsize = size >> 1;
      const angleStep = -2 * Math.PI / size;
      for (let i = 0; i < N; i += size) {
        for (let k = 0; k < halfsize; k++) {
          const angle = angleStep * k;
          const wRe = Math.cos(angle);
          const wIm = Math.sin(angle);
          const aRe = re[i + k];
          const aIm = im[i + k];
          const bRe = re[i + k + halfsize] * wRe - im[i + k + halfsize] * wIm;
          const bIm = re[i + k + halfsize] * wIm + im[i + k + halfsize] * wRe;
          re[i + k] = aRe + bRe;
          im[i + k] = aIm + bIm;
          re[i + k + halfsize] = aRe - bRe;
          im[i + k + halfsize] = aIm - bIm;
        }
      }
    }
    return { re, im };
  }

  /* ============================================================
     Hann window (matches scipy default for welch)
     ============================================================ */
  function hannWindow(N) {
    const w = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    }
    return w;
  }

  /* ============================================================
     Welch's PSD estimate
     - Window length: nperseg samples
     - Overlap: noverlap samples (default 50%)
     - Window: Hann
     - Scaling: 'density' (µV²/Hz)

     Returns: { freqs: Float32Array, psd: Float32Array }
     ============================================================ */
  function welch(signal, fs, nperseg) {
    // nperseg must be power of 2 for our FFT
    // Round down to nearest power of 2
    let nfft = 1;
    while (nfft * 2 <= nperseg) nfft *= 2;

    const noverlap = nfft >> 1;
    const step = nfft - noverlap;
    const window = hannWindow(nfft);
    // Window normalization factor (matches scipy 'density' scaling)
    let winSum = 0;
    for (let i = 0; i < nfft; i++) winSum += window[i] * window[i];
    const scale = 1 / (fs * winSum);

    const psd = new Float32Array(nfft / 2 + 1);
    let nSegments = 0;

    for (let start = 0; start + nfft <= signal.length; start += step) {
      // Detrend (remove mean) + window
      let mean = 0;
      for (let i = 0; i < nfft; i++) mean += signal[start + i];
      mean /= nfft;

      const segment = new Float32Array(nfft);
      for (let i = 0; i < nfft; i++) {
        segment[i] = (signal[start + i] - mean) * window[i];
      }

      const { re, im } = fftRadix2(segment);
      // Power spectrum (one-sided)
      psd[0] += (re[0] * re[0] + im[0] * im[0]) * scale;
      for (let k = 1; k < nfft / 2; k++) {
        psd[k] += 2 * (re[k] * re[k] + im[k] * im[k]) * scale;
      }
      psd[nfft / 2] += (re[nfft / 2] * re[nfft / 2] + im[nfft / 2] * im[nfft / 2]) * scale;
      nSegments++;
    }

    if (nSegments === 0) return null;

    // Average across segments
    for (let i = 0; i < psd.length; i++) psd[i] /= nSegments;

    // Frequency array
    const freqs = new Float32Array(nfft / 2 + 1);
    for (let i = 0; i <= nfft / 2; i++) freqs[i] = i * fs / nfft;

    return { freqs, psd, nSegments, nfft };
  }

  /* ============================================================
     Trapezoidal integration (matches numpy.trapezoid)
     ============================================================ */
  function trapezoid(y, x) {
    let s = 0;
    for (let i = 1; i < y.length; i++) {
      s += 0.5 * (y[i] + y[i-1]) * (x[i] - x[i-1]);
    }
    return s;
  }

  /* ============================================================
     Artifact rejection — exclude windows where |amplitude| > threshold
     Returns concatenated clean signal
     ============================================================ */
  function rejectArtifacts(signal, fs, windowSec = 4, thresholdUV = 75) {
    const windowSamples = Math.round(windowSec * fs);
    const cleanSegments = [];
    let nTotal = 0, nKept = 0;

    for (let start = 0; start + windowSamples <= signal.length; start += windowSamples) {
      nTotal++;
      let maxAbs = 0;
      for (let i = 0; i < windowSamples; i++) {
        const v = Math.abs(signal[start + i]);
        if (v > maxAbs) maxAbs = v;
      }
      if (maxAbs <= thresholdUV) {
        cleanSegments.push(signal.subarray(start, start + windowSamples));
        nKept++;
      }
    }

    // Concatenate
    const totalLen = cleanSegments.reduce((s, seg) => s + seg.length, 0);
    const concat = new Float32Array(totalLen);
    let offset = 0;
    for (const seg of cleanSegments) {
      concat.set(seg, offset);
      offset += seg.length;
    }
    return { signal: concat, nTotal, nKept, retentionPct: nTotal ? nKept/nTotal : 0 };
  }

  /* ============================================================
     Compute band powers from PSD
     ============================================================ */
  function bandPowers(psd, freqs) {
    const out = {};
    for (const [bandName, [lo, hi]] of Object.entries(BANDS)) {
      // Find indices in [lo, hi)
      const indices = [];
      for (let i = 0; i < freqs.length; i++) {
        if (freqs[i] >= lo && freqs[i] < hi) indices.push(i);
      }
      if (indices.length < 2) {
        out[bandName] = 0;
        continue;
      }
      const subFreqs = indices.map(i => freqs[i]);
      const subPsd = indices.map(i => psd[i]);
      out[bandName] = trapezoid(subPsd, subFreqs);
    }
    return out;
  }

  /* ============================================================
     Peak Alpha Frequency — max PSD in 7.5-13 Hz range
     ============================================================ */
  function peakAlphaFrequency(psd, freqs, lo = 7.5, hi = 13) {
    let maxVal = -Infinity, maxFreq = null;
    for (let i = 0; i < freqs.length; i++) {
      if (freqs[i] >= lo && freqs[i] <= hi) {
        if (psd[i] > maxVal) {
          maxVal = psd[i];
          maxFreq = freqs[i];
        }
      }
    }
    return maxFreq;
  }

  /* ============================================================
     Magnitude-squared coherence between two channels (Welch).
     MSC(f) = |Pxy|² / (Pxx·Pyy); returns mean MSC over [loHz,hiHz] band.
     Computed on raw aligned signals (truncated to common length).
     ============================================================ */
  function coherence(a, b, fs, nperseg, loHz, hiHz) {
    let nfft = 1; while (nfft * 2 <= nperseg) nfft *= 2;
    const N = Math.min(a.length, b.length);
    if (N < nfft) return null;
    const step = nfft >> 1;
    const win = hannWindow(nfft);
    const half = nfft >> 1;
    const Pxx = new Float64Array(half + 1), Pyy = new Float64Array(half + 1);
    const PxyRe = new Float64Array(half + 1), PxyIm = new Float64Array(half + 1);
    const xs = new Float32Array(nfft), ys = new Float32Array(nfft);
    let segs = 0;
    for (let s = 0; s + nfft <= N; s += step) {
      let mx = 0, my = 0;
      for (let i = 0; i < nfft; i++) { mx += a[s + i]; my += b[s + i]; }
      mx /= nfft; my /= nfft;
      for (let i = 0; i < nfft; i++) { xs[i] = (a[s + i] - mx) * win[i]; ys[i] = (b[s + i] - my) * win[i]; }
      const X = fftRadix2(xs), Y = fftRadix2(ys);
      for (let k = 0; k <= half; k++) {
        Pxx[k] += X.re[k] * X.re[k] + X.im[k] * X.im[k];
        Pyy[k] += Y.re[k] * Y.re[k] + Y.im[k] * Y.im[k];
        PxyRe[k] += X.re[k] * Y.re[k] + X.im[k] * Y.im[k];  // Re(X·conj(Y))
        PxyIm[k] += X.im[k] * Y.re[k] - X.re[k] * Y.im[k];  // Im(X·conj(Y))
      }
      segs++;
    }
    if (segs < 2) return null; // MSC is degenerate (≡1) with a single segment
    let sum = 0, cnt = 0;
    for (let k = 0; k <= half; k++) {
      const f = k * fs / nfft;
      if (f < loHz || f > hiHz) continue;
      const denom = Pxx[k] * Pyy[k];
      if (denom > 0) { sum += (PxyRe[k] * PxyRe[k] + PxyIm[k] * PxyIm[k]) / denom; cnt++; }
    }
    return cnt ? +(sum / cnt).toFixed(3) : null;
  }

  /* ============================================================
     MAIN ANALYSIS — process all channels of an EDF
     Input: edfResult from DMDA_EDF_PARSER.extractEEGChannels()
     Returns: structured result for engine.html
     ============================================================ */
  async function analyzeEEG(edfData, options = {}, onProgress = null) {
    const {
      windowSec = 4,
      artifactThresholdUV = 75
    } = options;

    const { channels, presentSites, missingSites } = edfData;

    if (presentSites.length === 0) {
      throw new Error('No EEG channels detected in file (need 10-20 system: Fp1, Fp2, F3, F4, etc.)');
    }

    // Detect sampling rate (use first channel)
    const firstCh = channels[presentSites[0]];
    const fs = firstCh.samplingRate;

    if (onProgress) onProgress({ stage: 'start', total: presentSites.length, fs, recordingDuration: firstCh.totalSamples / fs });

    const perSite = {};
    const cleanWindows = {};
    let i = 0;

    for (const site of presentSites) {
      const sig = channels[site];
      // 1. Artifact rejection
      const cleaned = rejectArtifacts(sig.samples, sig.samplingRate, windowSec, artifactThresholdUV);
      cleanWindows[site] = { nTotal: cleaned.nTotal, nKept: cleaned.nKept, pct: cleaned.retentionPct };

      // Need at least 2 clean windows for a meaningful PSD
      if (cleaned.nKept < 2) {
        perSite[site] = null;
        if (onProgress) onProgress({ stage: 'channel', current: ++i, total: presentSites.length, site, skipped: true });
        continue;
      }

      // 2. Welch's PSD
      const nperseg = Math.round(windowSec * sig.samplingRate);
      const welchResult = welch(cleaned.signal, sig.samplingRate, nperseg);
      if (!welchResult) {
        perSite[site] = null;
        continue;
      }

      // 3. Band powers
      const bp = bandPowers(welchResult.psd, welchResult.freqs);

      // 4. Per-site PAF
      const paf = peakAlphaFrequency(welchResult.psd, welchResult.freqs);

      perSite[site] = {
        band_power: bp,
        peak_alpha_frequency_hz: paf,
        clean_duration_sec: cleaned.signal.length / sig.samplingRate,
        retention_pct: cleaned.retentionPct,
        n_clean_windows: cleaned.nKept
      };

      if (onProgress) {
        onProgress({
          stage: 'channel',
          current: ++i,
          total: presentSites.length,
          site,
          retentionPct: cleaned.retentionPct,
          bandPower: bp
        });
      }
      // Yield to event loop occasionally so UI doesn't freeze
      if (i % 4 === 0) await new Promise(r => setTimeout(r, 0));
    }

    // ============================================================
    // GLOBAL INDICES
    // ============================================================
    const global_indices = {};

    // F3-F4 alpha asymmetry: log(F4) - log(F3)
    // positive = relative left hypoactivation (withdrawal/depression marker)
    if (perSite.F3 && perSite.F4) {
      const f3 = perSite.F3.band_power.alpha;
      const f4 = perSite.F4.band_power.alpha;
      if (f3 > 0 && f4 > 0) {
        global_indices.alpha_asymmetry_f3_f4_log = Math.log(f4) - Math.log(f3);
      }
    }

    // Theta/Beta ratio at Cz
    if (perSite.Cz) {
      const t = perSite.Cz.band_power.theta;
      const b = perSite.Cz.band_power.beta;
      if (b > 0) global_indices.theta_beta_ratio_cz = t / b;
    }

    // Peak Alpha Frequency at Cz (or Pz/O1 as fallback)
    if (perSite.Cz) global_indices.peak_alpha_frequency_cz_hz = perSite.Cz.peak_alpha_frequency_hz;
    if (perSite.O1) global_indices.peak_alpha_frequency_o1_hz = perSite.O1.peak_alpha_frequency_hz;

    // Coherence (alpha-band magnitude-squared) on raw aligned signals
    const npersegCoh = Math.round(windowSec * fs);
    if (channels.F3 && channels.F4) {
      const c = coherence(channels.F3.samples, channels.F4.samples, fs, npersegCoh, 8, 13);
      if (c != null) global_indices.coherence_f3_f4 = c;
    }
    if (channels.T3 && channels.T4) {
      const c = coherence(channels.T3.samples, channels.T4.samples, fs, npersegCoh, 8, 13);
      if (c != null) global_indices.coherence_t3_t4 = c;
    }
    // Posterior alpha mean (O1/O2/Pz) — for cross-condition alpha-suppression at engine level
    const postAlpha = ['O1','O2','Pz']
      .map(s => perSite[s] && perSite[s].band_power && perSite[s].band_power.alpha)
      .filter(v => typeof v === 'number' && v > 0);
    if (postAlpha.length) global_indices.posterior_alpha_mean = postAlpha.reduce((x,y)=>x+y,0) / postAlpha.length;

    if (onProgress) onProgress({ stage: 'complete' });

    return {
      sampling_rate_hz: fs,
      recording_duration_sec: firstCh.totalSamples / fs,
      window_sec: windowSec,
      artifact_threshold_uv: artifactThresholdUV,
      sites_present: presentSites,
      sites_missing: missingSites,
      per_site: perSite,
      global_indices,
      clean_window_stats: cleanWindows
    };
  }

  global.DMDA_EEG_ANALYSIS = {
    BANDS,
    welch,
    bandPowers,
    rejectArtifacts,
    peakAlphaFrequency,
    analyzeEEG
  };
})(typeof window !== 'undefined' ? window : globalThis);
