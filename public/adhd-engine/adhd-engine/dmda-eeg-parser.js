/* ============================================================
   DMDA qEEG PARSER — ASCII / CSV / TSV / Neuroguide / Mitsar / HBI
   ============================================================
   Strategy:
   1. Detect delimiter (comma, tab, whitespace, semicolon)
   2. Detect header row + column meaning (site, band, condition, value)
   3. Support three layouts:
      (a) LONG format:    site, band, [condition], value (one row per cell)
      (b) WIDE matrix:    site as row, bands as columns
      (c) Neuroguide ASCII: structured with section headers
   4. Site name normalization (FP1↔Fp1, F7↔F7, etc.)
   5. Band name normalization (delta/θ/theta/Theta1/SlowDelta etc.)
   ============================================================ */

(function(global){
  'use strict';

  // ⭐ Canonical 19 sites (10-20 system) + variants
  const CANONICAL_SITES = ['Fp1','Fp2','F3','F4','Fz','F7','F8','C3','C4','Cz','P3','P4','Pz','T3','T4','T5','T6','O1','O2'];
  // Aliases — normalize to canonical
  const SITE_ALIASES = {
    'FP1':'Fp1','FP2':'Fp2','fp1':'Fp1','fp2':'Fp2',
    'FZ':'Fz','CZ':'Cz','PZ':'Pz',
    // 10-10 system → closest 10-20
    'T7':'T3', 'T8':'T4', 'P7':'T5', 'P8':'T6'
  };

  // ⭐ Canonical bands (matches engine.html EEG_BANDS)
  const CANONICAL_BANDS = ['delta','theta','alpha','beta','hibeta'];
  const BAND_ALIASES = {
    // Greek + Korean
    'δ':'delta', 'θ':'theta', 'α':'alpha', 'β':'beta',
    '델타':'delta','세타':'theta','알파':'alpha','베타':'beta',
    // Common variants
    'highbeta':'hibeta','high_beta':'hibeta','high-beta':'hibeta',
    'beta_high':'hibeta','beta2':'hibeta','b2':'hibeta',
    'slow_delta':'delta','delta1':'delta','delta2':'delta',
    'theta1':'theta','theta2':'theta',
    'alpha1':'alpha','alpha2':'alpha','low_alpha':'alpha','high_alpha':'alpha',
    'beta1':'beta','low_beta':'beta','smr':'beta',  // SMR ~ low beta
    // Gamma not in canonical 5 — ignored
  };

  // ⭐ Condition aliases
  const COND_ALIASES = {
    'ec':'eyes_closed', 'EC':'eyes_closed', 'closed':'eyes_closed',
    'eyes_closed':'eyes_closed','eyesclosed':'eyes_closed','eyes-closed':'eyes_closed',
    '눈감음':'eyes_closed','감음':'eyes_closed',
    'eo':'eyes_open', 'EO':'eyes_open', 'open':'eyes_open',
    'eyes_open':'eyes_open','eyesopen':'eyes_open','eyes-open':'eyes_open',
    '눈뜸':'eyes_open','뜸':'eyes_open',
    'task':'eyes_open' // task condition treated as EO-like
  };

  function normalizeSite(s){
    if (!s) return null;
    const trimmed = String(s).trim();
    if (CANONICAL_SITES.includes(trimmed)) return trimmed;
    if (SITE_ALIASES[trimmed]) return SITE_ALIASES[trimmed];
    // Try uppercase first letter pattern (Fp1 from fP1)
    const upper = trimmed.toUpperCase();
    if (SITE_ALIASES[upper]) return SITE_ALIASES[upper];
    // Try canonical case
    const cap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    if (CANONICAL_SITES.includes(cap)) return cap;
    return null;
  }

  function normalizeBand(b){
    if (!b) return null;
    const k = String(b).trim().toLowerCase().replace(/[\s_-]+/g, '_').replace(/[()]/g, '');
    if (CANONICAL_BANDS.includes(k)) return k;
    if (BAND_ALIASES[k]) return BAND_ALIASES[k];
    if (BAND_ALIASES[k.replace(/_/g, '')]) return BAND_ALIASES[k.replace(/_/g, '')];
    // Pattern: "delta (1-4)" → "delta"
    const base = k.split('_')[0];
    if (CANONICAL_BANDS.includes(base)) return base;
    if (BAND_ALIASES[base]) return BAND_ALIASES[base];
    return null;
  }

  function normalizeCondition(c){
    if (!c) return null;
    const k = String(c).trim().toLowerCase().replace(/[\s_-]+/g, '_');
    if (COND_ALIASES[k]) return COND_ALIASES[k];
    if (COND_ALIASES[c]) return COND_ALIASES[c]; // case-sensitive fallback
    return null;
  }

  /* ============================================================
     DELIMITER DETECTION
     ============================================================ */
  function detectDelimiter(text){
    const sampleLines = text.split(/\r?\n/).slice(0, 20).filter(l => l.trim());
    const counts = { ',': 0, '\t': 0, ';': 0, '|': 0, ' ': 0 };
    sampleLines.forEach(line => {
      counts[','] += (line.match(/,/g) || []).length;
      counts['\t'] += (line.match(/\t/g) || []).length;
      counts[';'] += (line.match(/;/g) || []).length;
      counts['|'] += (line.match(/\|/g) || []).length;
      // Multi-space (column-aligned ASCII)
      counts[' '] += (line.match(/  +/g) || []).length;
    });
    const sorted = Object.entries(counts).sort(([,a],[,b]) => b-a);
    if (sorted[0][1] === 0) return null;
    const winner = sorted[0][0];
    return winner === ' ' ? /\s{2,}|\t/ : winner;
  }

  function splitLine(line, delim){
    if (delim instanceof RegExp) return line.trim().split(delim);
    return line.split(delim).map(c => c.trim());
  }

  /* ============================================================
     PARSE — main entry
     ============================================================ */
  function parseFile(text, filename){
    const result = {
      filename,
      detected_format: 'unknown',
      detected_condition: null,  // inferred from filename if possible
      bands_found: new Set(),
      sites_found: new Set(),
      cells: [],   // {site, band, value, condition?, extra: {z, rel_power, etc}}
      warnings: [],
      raw_preview: text.slice(0, 500)
    };

    // ⭐ Step 1: Try to infer condition from filename
    const fnLower = filename.toLowerCase();
    if (/eyes?[\s_-]*closed|_ec[._]|^ec[._]|closed|-ec-/i.test(fnLower)) result.detected_condition = 'eyes_closed';
    else if (/eyes?[\s_-]*open|_eo[._]|^eo[._]|open|-eo-/i.test(fnLower)) result.detected_condition = 'eyes_open';

    // ⭐ Step 1.5: Binary file detection (HBImed .eeg / Mitsar raw / EDF 등) — unsupported ❌
    const isBinaryExt = /\.(eeg|edf|bdf|gdf|cnt|nrg|ng3|ngb|set|fif|dat)$/i.test(fnLower);
    const sample = text.slice(0, 200);
    let nonPrintable = 0;
    for (let i = 0; i < sample.length; i++) {
      const code = sample.charCodeAt(i);
      if (code === 0 || (code < 32 && code !== 9 && code !== 10 && code !== 13) || code > 126) {
        nonPrintable++;
      }
    }
    const isBinaryContent = nonPrintable > sample.length * 0.15;

    if (isBinaryExt || isBinaryContent) {
      result.detected_format = 'binary_unsupported';
      result.warnings.push('⚠️ 이 파일은 raw EEG 바이너리입니다 (HBImed .eeg / Mitsar / EDF 등). 브라우저에서는 직접 처리할 수 없습니다 ❌.');
      result.warnings.push('✅ 해결 방법 — 사용하는 qEEG 시스템에서 ASCII로 export 하세요:');
      result.warnings.push('• HBImed: Functional Analysis → Spectra View → 우클릭 → "Export to text"');
      result.warnings.push('• Mitsar WinEEG: Spectra → File → "Save Spectra as Text"');
      result.warnings.push('• Neuroguide: Analysis Report → File → "Export ASCII Report"');
      result.warnings.push('그렇게 만든 .txt 파일을 여기에 drag-drop 하면 됩니다 ✅');
      return finalizeResult(result);
    }

    // ⭐ Step 2: Detect Neuroguide format (often has signature headers)
    if (/neuroguide|NEUROGUIDE|Power Absolute|Power Relative|Z-Score/i.test(text)) {
      result.detected_format = 'neuroguide_ascii';
      parseNeuroguide(text, result);
      return finalizeResult(result);
    }

    // ⭐ Step 3: Detect delimiter + generic parse
    const delim = detectDelimiter(text);
    if (!delim) {
      result.warnings.push('Could not detect column delimiter');
      return finalizeResult(result);
    }

    const lines = text.split(/\r?\n/).filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('//'));
    if (lines.length < 2) {
      result.warnings.push('Not enough rows to parse');
      return finalizeResult(result);
    }

    // Parse all rows
    const rows = lines.map(l => splitLine(l, delim));

    // ⭐ Step 4: Try to identify header row + layout
    const layout = detectLayout(rows, result);
    if (layout === 'long') {
      parseLong(rows, result);
    } else if (layout === 'wide') {
      parseWide(rows, result);
    } else {
      // Heuristic last-resort: try long format with column 0 = site
      parseFallback(rows, result);
    }

    return finalizeResult(result);
  }

  function finalizeResult(result){
    result.bands_found = Array.from(result.bands_found);
    result.sites_found = Array.from(result.sites_found);
    result.cell_count = result.cells.length;
    return result;
  }

  /* ============================================================
     LAYOUT DETECTION
     ============================================================ */
  function detectLayout(rows, result){
    if (rows.length === 0) return 'unknown';
    const firstRow = rows[0].map(c => String(c).toLowerCase());

    // LONG format signatures: header includes "site"+"band"+"value/power"
    const hasSiteCol = firstRow.some(c => /^(site|channel|electrode|elec)$/i.test(c));
    const hasBandCol = firstRow.some(c => /^(band|frequency|freq)$/i.test(c));
    const hasValCol = firstRow.some(c => /^(value|power|abs|rel|z|magnitude|amp)/i.test(c));

    if (hasSiteCol && hasBandCol) {
      result.detected_format = 'long_csv';
      return 'long';
    }

    // WIDE format: first column = site, rest = bands
    // Check: row[0][0] is a site name? Headers contain band names?
    const headerBands = firstRow.filter(c => normalizeBand(c) !== null);
    if (headerBands.length >= 3) {
      // Check if first non-header column values are sites
      const firstColVals = rows.slice(1, 10).map(r => r[0]);
      const siteHits = firstColVals.filter(v => normalizeSite(v) !== null).length;
      if (siteHits >= 3) {
        result.detected_format = 'wide_matrix';
        return 'wide';
      }
    }

    // Check if first row is data (no header)
    const r0Site = normalizeSite(rows[0][0]);
    if (r0Site && rows[0].length >= 2) {
      result.detected_format = 'wide_matrix_noheader';
      return 'wide';
    }

    result.detected_format = 'unknown_layout';
    return 'unknown';
  }

  /* ============================================================
     LONG FORMAT — site, band, [condition], value
     ============================================================ */
  function parseLong(rows, result){
    const header = rows[0].map(c => String(c).toLowerCase().trim());
    const findCol = (patterns) => header.findIndex(h => patterns.some(p => p.test(h)));

    const siteIdx = findCol([/^(site|channel|electrode|elec)$/i]);
    const bandIdx = findCol([/^(band|frequency|freq)$/i]);
    const valIdx  = findCol([/^(value|power|abs.*power|magnitude|amp)/i]);
    const condIdx = findCol([/^(condition|state|cond|task)$/i]);
    const zIdx    = findCol([/^z$/i, /^z.score$/i, /^z_score$/i]);
    const relIdx  = findCol([/^rel/i, /relative/i]);

    if (siteIdx < 0 || bandIdx < 0) {
      result.warnings.push('LONG format: missing site or band column');
      return;
    }

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[siteIdx] || !r[bandIdx]) continue;

      const site = normalizeSite(r[siteIdx]);
      const band = normalizeBand(r[bandIdx]);
      if (!site || !band) continue;

      let value = null, valueSource = null;
      if (valIdx >= 0) { value = parseFloat(r[valIdx]); valueSource = 'absolute'; }
      else if (relIdx >= 0) { value = parseFloat(r[relIdx]); valueSource = 'relative'; }
      else if (zIdx >= 0) { value = parseFloat(r[zIdx]); valueSource = 'z_score'; }
      if (isNaN(value)) continue;

      const condition = condIdx >= 0 ? normalizeCondition(r[condIdx]) : result.detected_condition;

      const extras = {};
      if (zIdx >= 0 && zIdx !== valIdx) extras.z = parseFloat(r[zIdx]);
      if (relIdx >= 0 && relIdx !== valIdx) extras.relative = parseFloat(r[relIdx]);

      result.cells.push({ site, band, value, condition, value_source: valueSource, extras });
      result.sites_found.add(site);
      result.bands_found.add(band);
    }
  }

  /* ============================================================
     WIDE FORMAT — site as row, bands as columns
     ============================================================ */
  function parseWide(rows, result){
    let headerRow, startIdx;
    const r0Site = normalizeSite(rows[0][0]);
    if (r0Site && rows[0].length >= 2) {
      // No header — synthesize from first row position
      result.warnings.push('No header detected; assuming columns are delta/theta/alpha/beta/hibeta');
      headerRow = ['site', ...CANONICAL_BANDS];
      startIdx = 0;
    } else {
      headerRow = rows[0].map(c => String(c).trim());
      startIdx = 1;
    }

    // Map columns to canonical bands
    const colMap = headerRow.map((h, i) => {
      if (i === 0) return null; // site column
      const band = normalizeBand(h);
      return band ? { idx: i, band } : null;
    }).filter(Boolean);

    if (colMap.length === 0) {
      result.warnings.push('WIDE format: no band columns recognized');
      return;
    }

    for (let i = startIdx; i < rows.length; i++) {
      const r = rows[i];
      const site = normalizeSite(r[0]);
      if (!site) continue;

      colMap.forEach(({idx, band}) => {
        const value = parseFloat(r[idx]);
        if (isNaN(value)) return;
        result.cells.push({
          site, band, value,
          condition: result.detected_condition,
          value_source: 'absolute',
          extras: {}
        });
        result.sites_found.add(site);
        result.bands_found.add(band);
      });
    }
  }

  /* ============================================================
     NEUROGUIDE — has section headers like "Absolute Power", "Z-Scores"
     ============================================================ */
  function parseNeuroguide(text, result){
    const blocks = text.split(/\n\s*\n/);  // blocks separated by blank lines
    let currentSection = 'absolute_power';
    let currentCondition = result.detected_condition;

    blocks.forEach(block => {
      const lines = block.split(/\r?\n/).filter(l => l.trim());
      if (lines.length === 0) return;

      // Look for section header in first line
      const first = lines[0].toLowerCase();
      if (/absolute.*power/i.test(first)) currentSection = 'absolute_power';
      else if (/relative.*power/i.test(first)) currentSection = 'relative_power';
      else if (/z.score/i.test(first)) currentSection = 'z_score';
      else if (/coherence/i.test(first)) currentSection = 'coherence';
      else if (/phase/i.test(first)) currentSection = 'phase';

      // Look for condition in headers
      if (/eyes?[\s_-]*closed/i.test(first)) currentCondition = 'eyes_closed';
      else if (/eyes?[\s_-]*open/i.test(first)) currentCondition = 'eyes_open';

      // Skip coherence/phase blocks (different structure)
      if (currentSection === 'coherence' || currentSection === 'phase') return;

      // Detect delimiter for this block
      const delim = detectDelimiter(block);
      if (!delim) return;

      const rows = lines.map(l => splitLine(l, delim));
      // Find header row (contains band names)
      let headerIdx = -1;
      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const bandsInRow = rows[i].filter(c => normalizeBand(c)).length;
        if (bandsInRow >= 2) { headerIdx = i; break; }
      }
      if (headerIdx < 0) return;

      const header = rows[headerIdx];
      const colMap = header.map((h, i) => {
        const band = normalizeBand(h);
        return band ? { idx: i, band } : null;
      }).filter(Boolean);

      for (let i = headerIdx + 1; i < rows.length; i++) {
        const r = rows[i];
        const site = normalizeSite(r[0]);
        if (!site) continue;

        colMap.forEach(({idx, band}) => {
          const value = parseFloat(r[idx]);
          if (isNaN(value)) return;
          // Skip relative/z sections for primary value if absolute is preferred
          // Add as cell with source label
          result.cells.push({
            site, band, value,
            condition: currentCondition,
            value_source: currentSection,
            extras: {}
          });
          result.sites_found.add(site);
          result.bands_found.add(band);
        });
      }
    });
  }

  /* ============================================================
     FALLBACK — last-resort heuristic
     ============================================================ */
  function parseFallback(rows, result){
    result.warnings.push('Layout unclear — trying heuristic parse');
    // Try wide layout assuming first row is header
    parseWide(rows, result);
    if (result.cells.length > 0) return;

    // Try treating every row as a long-format (site, band, value) triple
    rows.forEach(r => {
      if (r.length < 3) return;
      const site = normalizeSite(r[0]);
      const band = normalizeBand(r[1]);
      const value = parseFloat(r[2]);
      if (site && band && !isNaN(value)) {
        result.cells.push({
          site, band, value,
          condition: result.detected_condition,
          value_source: 'absolute',
          extras: {}
        });
        result.sites_found.add(site);
        result.bands_found.add(band);
      }
    });
  }

  /* ============================================================
     APPLY parsed cells into the engine.html EEG inputs
     ============================================================ */
  function applyToInputs(parseResults, options){
    options = options || {};
    // If multiple files: prefer absolute_power source, fallback to first available
    const allCells = [];
    parseResults.forEach(r => {
      r.cells.forEach(c => allCells.push({ ...c, source_file: r.filename }));
    });

    // Prefer absolute over relative/z for fill
    const preferredCells = {};
    allCells.forEach(c => {
      const key = `${c.condition || 'unknown'}:${c.site}:${c.band}`;
      const priority = {
        'absolute_power': 4, 'absolute': 3, 'relative_power': 2,
        'relative': 2, 'z_score': 1
      }[c.value_source] || 2;
      const existing = preferredCells[key];
      if (!existing || priority > (existing._priority || 0)) {
        preferredCells[key] = { ...c, _priority: priority };
      }
    });

    let filled = 0;
    Object.values(preferredCells).forEach(c => {
      const condShort = c.condition === 'eyes_closed' ? 'ec' :
                        c.condition === 'eyes_open' ? 'eo' : null;
      if (!condShort) return;
      const selector = `input[data-site="${c.site}"][data-band="${c.band}"][data-cond="${condShort}"]`;
      const input = document.querySelector(selector);
      if (input) {
        input.value = c.value;
        filled++;
      }
    });

    return { filled, total_cells: allCells.length };
  }

  global.DMDA_EEG_PARSER = {
    CANONICAL_SITES,
    CANONICAL_BANDS,
    parseFile,
    applyToInputs,
    normalizeSite,
    normalizeBand,
    normalizeCondition
  };
})(typeof window !== 'undefined' ? window : globalThis);
