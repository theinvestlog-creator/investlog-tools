(function(){
  const el = id => document.getElementById(id);

  const state = {
    currency: '€',
    price: null,
    sharesB: null,
    netDebtB: null,
    waccPct: null,
    roicPct: null,
    nopatB: null
  };

  const $ = {
    currencySymbol: el('currencySymbol'),
    price: el('price'),
    sharesB: el('sharesB'),
    netDebtB: el('netDebtB'),
    wacc: el('wacc'),
    roic: el('roic'),
    nopatB: el('nopatB'),
    resetBtn: el('resetBtn'),
    copyLinkBtn: el('copyLinkBtn'),
    gOut: el('gOut'),
    badge: el('badge'),
    evOut: el('evOut'),
    reinvestOut: el('reinvestOut'),
    payoutOut: el('payoutOut'),
    chips: el('chips'),
    gSlider: el('gSlider'),
    gSliderVal: el('gSliderVal'),
    gTrialLabel: el('gTrialLabel'),
    trialPrice: el('trialPrice'),
    note: el('note')
  };

  function toNum(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
  function pct(x){ return Number.isFinite(x) ? (x*100).toFixed(2) + '%' : '—'; }
  function fmtMoneyAbbrev(sym, n){
    if(!Number.isFinite(n)) return '—';
    const abs = Math.abs(n);
    let unit = '', div = 1;
    if(abs >= 1e12){ unit='T'; div=1e12; }
    else if(abs >= 1e9){ unit='B'; div=1e9; }
    else if(abs >= 1e6){ unit='M'; div=1e6; }
    const val = (n/div).toLocaleString(undefined,{maximumFractionDigits:2});
    return `${sym}${val}${unit}`;
  }
  function fmtMoney(sym, n){
    if(!Number.isFinite(n)) return '—';
    return sym + n.toLocaleString(undefined,{maximumFractionDigits:2});
  }
  function clamp(x,min,max){ return Math.min(max, Math.max(min, x)); }

  function readUI(){
    state.currency = $.currencySymbol ? ($.currencySymbol.value || '€') : '€';
    state.price    = toNum($.price.value);
    state.sharesB  = toNum($.sharesB.value);
    state.netDebtB = toNum($.netDebtB.value);
    state.waccPct  = toNum($.wacc.value);
    state.roicPct  = toNum($.roic.value);
    state.nopatB   = toNum($.nopatB.value);
  }

  function validInputs(){
    const {price, sharesB, waccPct, roicPct, nopatB, netDebtB} = state;
    return [price, sharesB, waccPct, roicPct, nopatB, netDebtB].every(x => Number.isFinite(x));
  }

  function compute(){
    if(!validInputs()){
      renderEmpty('Fill inputs to see results.');
      return;
    }
    const sym = state.currency;
    const P = state.price;
    const shares = state.sharesB * 1e9;
    const ND = state.netDebtB * 1e9;
    const r = state.waccPct/100;
    const roic = state.roicPct/100;
    const NOPAT = state.nopatB * 1e9;

    if(!(shares > 0)){
      renderEmpty('Shares must be greater than zero.');
      return;
    }
    if(!(roic > 0)){
      renderEmpty('ROIC must be greater than zero.');
      return;
    }
    if(!(r > 0)){
      renderEmpty('WACC must be greater than zero.');
      return;
    }

    const EV = P * shares + ND;

    const denom = EV - (NOPAT/roic);
    const knife = Math.abs(denom) <= Math.max(1, Math.abs(NOPAT/roic)) * 1e-6;

    let g = NaN, badgeClass = 'calc-badge', badgeText = '—', noteMsg = '';
    if(!knife){
      g = (EV * r - NOPAT) / denom;
      if(!(g < r) || !(g < roic) || !Number.isFinite(g)){
        if(!Number.isFinite(g)) noteMsg = 'Numerical singularity. Adjust ROIC, NOPAT, or EV.';
        else if(g >= r) noteMsg = 'Infeasible: g ≥ WACC under your assumptions.';
        else if(g >= roic) noteMsg = 'Infeasible: g ≥ ROIC implies >100% reinvestment of NOPAT.';
        badgeClass = 'calc-badge bad';
        badgeText = 'Infeasible';
      } else if(g < 0){
        badgeClass = 'calc-badge warn'; badgeText = 'Decline priced';
      } else {
        badgeClass = 'calc-badge ok'; badgeText = 'Feasible';
      }
    } else {
      noteMsg = 'Knife-edge: EV ≈ NOPAT/ROIC. Tiny tweaks swing results.';
      badgeClass = 'calc-badge warn'; badgeText = 'Unstable';
    }

    const reinvest = Number.isFinite(g) && Number.isFinite(roic) ? (g/roic) : NaN;
    const payout = Number.isFinite(reinvest) ? (1 - reinvest) : NaN;

    $.gOut.textContent = Number.isFinite(g) ? (g*100).toFixed(2) + '%' : '—';
    $.badge.className = badgeClass;
    $.badge.textContent = badgeText;
    $.evOut.textContent = fmtMoneyAbbrev(sym, EV);
    $.reinvestOut.textContent = pct(reinvest);
    $.payoutOut.textContent = pct(payout);
    $.note.textContent = noteMsg || '';

    renderChips({P, shares, ND, r, roic, NOPAT});

    const cap = Math.max(-0.05, Math.min(r, roic) - 0.0005);
    const sliderMin = -0.05;
    $.gSlider.min = (sliderMin*100).toFixed(2);
    $.gSlider.max = (cap*100).toFixed(2);

    const cur = parseFloat($.gSlider.value)/100;
    const clamped = clamp(cur, sliderMin, cap);
    if(cur !== clamped) $.gSlider.value = (clamped*100).toFixed(2);
    updateTrial({shares, ND, r, roic, NOPAT, sym});
  }

  function renderChips({P, shares, ND, r, roic, NOPAT}){
    const variants = [
      {label:`WACC −1pp`, r:r-0.01},
      {label:`WACC +1pp`, r:r+0.01},
      {label:`ROIC −2pp`, roic:roic-0.02},
      {label:`ROIC +2pp`, roic:roic+0.02},
      {label:`NOPAT −10%`, NOPAT:NOPAT*0.9},
      {label:`NOPAT +10%`, NOPAT:NOPAT*1.1},
    ];
    const EV = P*shares + ND;

    $.chips.innerHTML = '';
    for(const v of variants){
      const rr = v.r ?? r;
      const ro = v.roic ?? roic;
      const np = v.NOPAT ?? NOPAT;
      const denom = EV - (np/ro);
      let cls = 'chip', text = '—';
      if(denom === 0 || !Number.isFinite(denom)){
        cls = 'chip bad'; text = `${v.label}: unstable`;
      } else {
        const g = (EV*rr - np) / denom;
        if(!(g < rr) || !(g < ro) || !Number.isFinite(g)){
          cls = 'chip bad'; text = `${v.label}: infeasible`;
        } else {
          text = `${v.label}: ${(g*100).toFixed(2)}%`;
        }
      }
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = text;
      $.chips.appendChild(span);
    }
  }

  function updateTrial({shares, ND, r, roic, NOPAT, sym}){
    const gPct = parseFloat($.gSlider.value);
    const g = gPct/100;
    const lbl = gPct.toFixed(2) + '%';
    const valid = Number.isFinite(shares) && shares > 0 && Number.isFinite(roic) && roic !== 0 && Number.isFinite(r) && r !== 0;
    const price = (valid && g < r && g < roic)
      ? ( (NOPAT * (1 - g/roic) / (r - g) - ND) / shares )
      : NaN;

    $.gSliderVal.textContent = lbl;
    $.gTrialLabel.textContent = lbl;
    $.trialPrice.textContent = Number.isFinite(price) ? fmtMoney(sym, price) : 'Infeasible g';
  }

  function renderEmpty(msg){
    $.gOut.textContent='—';
    $.badge.className='calc-badge';
    $.badge.textContent='—';
    $.evOut.textContent='—';
    $.reinvestOut.textContent='—';
    $.payoutOut.textContent='—';
    $.chips.innerHTML='';
    $.note.textContent=msg||'';
    $.trialPrice.textContent='—';
  }

  function toQuery(){
    const p = new URLSearchParams();
    p.set('cur', state.currency);
    p.set('P', state.price ?? '');
    p.set('ShB', state.sharesB ?? '');
    p.set('NDB', state.netDebtB ?? '');
    p.set('r', state.waccPct ?? '');
    p.set('roic', state.roicPct ?? '');
    p.set('NPB', state.nopatB ?? '');
    return p.toString();
  }
  function fromQuery(){
    const q = new URLSearchParams(window.location.search);
    if(q.has('cur') && document.getElementById('currencySymbol')) document.getElementById('currencySymbol').value = q.get('cur');
    if(q.has('P')) $.price.value = q.get('P');
    if(q.has('ShB')) $.sharesB.value = q.get('ShB');
    if(q.has('NDB')) $.netDebtB.value = q.get('NDB');
    if(q.has('r')) $.wacc.value = q.get('r');
    if(q.has('roic')) $.roic.value = q.get('roic');
    if(q.has('NPB')) $.nopatB.value = q.get('NPB');
  }
  function copyPermalink(){
    readUI();
    const qs = toQuery();
    const url = `${location.origin}${location.pathname}?${qs}`;
    navigator.clipboard.writeText(url).then(()=>{
      $.note.textContent = 'Permalink copied to clipboard.';
    }).catch(()=>{
      $.note.textContent = 'Copy failed. Copy from the address bar.';
    });
  }

  const inputs = ['currencySymbol','price','sharesB','netDebtB','wacc','roic','nopatB'];
  inputs.forEach(id=>{
    const node = document.getElementById(id);
    if(node){
      node.addEventListener('input', ()=>{
        readUI(); compute(); updateURL();
      });
    }
  });
  document.getElementById('gSlider').addEventListener('input', ()=>{
    readUI(); updateTrial({
      shares: state.sharesB*1e9,
      ND: state.netDebtB*1e9,
      r: state.waccPct/100,
      roic: state.roicPct/100,
      NOPAT: state.nopatB*1e9,
      sym: state.currency
    });
  });
  document.getElementById('copyLinkBtn').addEventListener('click', copyPermalink);
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    ['price','sharesB','netDebtB','wacc','roic','nopatB'].forEach(id=> {
      const node = document.getElementById(id);
      if(node) node.value='';
    });
    readUI(); compute(); history.replaceState({},'',location.pathname);
  });

  function updateURL(){
    const qs = toQuery();
    history.replaceState({}, '', `${location.pathname}?${qs}`);
  }

  fromQuery();
  readUI(); compute();
})();
