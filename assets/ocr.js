'use strict';
console.log('ocr.js is ver.0.2.3');
const canvas1 = createCanvas(false, 1280, 720);
const canvas2 = createCanvas(false, 230 * 2, 25 * 2);
const canvas3 = createCanvas(false, 230 * 2, 25 * 2 * 12);
const canvas4 = createCanvas(false, 54 * 2, 25 * 2 * 12);
const canvas5 = createCanvas(false, 100, 100);
const canvas6 = createCanvas(false, 66, 623);
/** scanGameScreen(img, callback)
 */
function scanGameScreen(img, callback) {
  /** parseNameImage(img, canvas, i, sx, sy, sw, sh)
   * 順位imgから文字の部分を切り抜いてcanvasに写す
   */
  const parseNameImage = function(img, canvas, i, sx, sy, sw, sh) {
    /** fill(k, rgb)
     * kマス目をrgbで塗りつぶす
     */
    const fill = function(k, rgb) {
      imagedata.data[k + 0] = rgb;
      imagedata.data[k + 1] = rgb;
      imagedata.data[k + 2] = rgb;
    }
    /** isYellowZone(w, h)
     * 黄色いゾーンですか？
     */
    const isYellowZone = function(w, h) {
      let p = 0;
      let x, y;
      for (y = 0, y = 0; y < h; y++) p += getYellowPoint(x, y, w);
      for (x = 0, y = 0; x < w; x++) p += getYellowPoint(x, y, w);
      return (p > 100);
    }
    /** getYellowPoint(x, y, w)
     * 黄色っぽさを取得する
     */
    const getYellowPoint = function(x, y, w) {
      const k = 4 * (x + y * w);
      const r = imagedata.data[k + 0];
      const g = imagedata.data[k + 1];
      const b = imagedata.data[k + 2];
      return (r > 180 && g > 180 && b < 100) ? 1 : 0;
    }
    const w = canvas.width;
    const h = canvas.height;
    canvas.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const imagedata = canvas.ctx.getImageData(0, 0, w, h);
    const f = isYellowZone(w, h);
    let x; let y; let k; let r; let g; let b; let
      p;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        k = 4 * (x + y * w);
        r = imagedata.data[k + 0];
        g = imagedata.data[k + 1];
        b = imagedata.data[k + 2];
        if (f) {
          p = 550 - r - g - b; // 黄色との距離
          if (p < 120) r = 255;
          fill(k, r);
        } else {
          p = 765 - r - g - b; // 白との距離
          if (p > 500) r = 255;
          else r = 255 - (r + g + b) / 3;
          fill(k, r);
        }
      }
    }
    return imagedata;
  }
  /** do */
  console.log('- recognizing 1st - 12th player names');
  canvas1.ctx.burnImage(img, 0, 0, canvas1.width, canvas1.height);
  let i; let j; let len; let imagedata; const
    scanedNameArray = [];
  for (i = 0; i < 12; i++) {
    canvas2.width = canvas3.width;
    imagedata = parseNameImage(canvas1, canvas2, i, 678, 62 + i * 52, 230, 25);
    len = imagedata.width * imagedata.height;
    const rs = new Uint8Array(new ArrayBuffer(len));
    for (j = 0; j < len; j++) {
      rs[j] = imagedata.data[j * 4];
    }
    scanedNameArray.push(rs);
    canvas3.ctx.putImageData(imagedata, 0, i * 25 * 2);
  }
  for (i = 0; i < 12; i++) {
    canvas2.width = canvas4.width;
    imagedata = parseNameImage(canvas1, canvas2, i, 1164, 65 + i * 52, 54, 25);
    canvas4.ctx.putImageData(imagedata, 0, i * 25 * 2);
  }
  const rects = [];
  for (i = 0; i < 12; i++) {
    rects.push({
      top: 50 * i, left: 0, width: 460, height: 50,
    });
  }
  if (typeof callback === 'function') callback(scanedNameArray);
}
/** getTeamRankArray(scanedNameArr)
 */
function getTeamRankArray(scanedNameArr, sampleTeamData) {
  /** getNameSimilarity(_name, _sampleName)
   */
  const getNameSimilarity = function(_name, _sampleName) {
    let score = 0;
    for (let i = 0; i < _name.length; i++) {
      score -= Math.abs(_name[i] - _sampleName[i]);
    }
    return score;
  }
  /** do */
  const arr = [];
  // 名前の配列要素それぞれについて
  scanedNameArr.forEach((name, i) => {
    // 見本を一周して似ている順位に並べて「候補配列」を作る
    const candidates = [];
    sampleTeamData.forEach((sampleData) => {
      const score = getNameSimilarity(name, sampleData.name);
      candidates.push({ score, team: sampleData.teamName });
    });
    //「候補配列」は類似度が高い順に並べる
    candidates.sort((a, b) => (a.score > b.score) ? -1 : 1);
    //「候補配列」を含むオブジェクトをarrに放り込む
    arr.push({
      name,
      rank: i + 1,
      topTeam: candidates[0].team,
      topScore: candidates[0].score,
      candidates,
    });
  });
  // 「候補配列内の最高類似度」が高い順に並べる
  arr.sort((a, b) => (a.topScore > b.topScore) ? -1 : 1);
  // 名前を確定していく
  // 重複が生じないように未決定のチーム名をleftoverTeamNamesで管理する
  const leftoverTeamNames = [];
  sampleTeamData.forEach(sampleData => leftoverTeamNames.push(sampleData.teamName));
  // 名前を確定していく
  arr.forEach((obj) => {
    for (let i = 0; i < obj.candidates.length; i++) {
      const cnd = obj.candidates[i];
      // まだleftoverTeamNamesに残っているなら
      const idx = leftoverTeamNames.indexOf(cnd.team);
      if (idx >= 0) {
        obj.topTeam = cnd.team;
        obj.topScore = cnd.score;
        leftoverTeamNames.splice(idx, 1);
        break;
      }
    }
  });
  // rankの数値が低い順（＝順位が高い順）に並べて
  // チームタグを新規配列に放り込んでいく
  arr.sort((a, b) => (a.rank < b.rank) ? -1 : 1);
  const teamArr = [];
  arr.forEach(obj => teamArr.push(obj.topTeam));
  return teamArr;
}
/** checkScanable(ssImage, callback)
 */
function checkScanable(ssImage, callback) {
  if (typeof ssImage === 'string') ssImage = document.querySelector(ssImage);
  console.log('- checking necessity of trimming');
  const canvas = canvas5;
  const w = ssImage.naturalWidth;
  const h = ssImage.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.ctx.globalAlpha = '1';
  canvas.ctx.globalCompositeOperation = 'source-over';
  canvas.ctx.drawImage(ssImage, 0, 0);
  const scale = w / 1280;
  const _rect = {};
  const rect = {
      x: 555, y: 50, w: 66, h: 623,
    };
  canvas6.width = rect.w;
  canvas6.height = rect.h;
  Object.keys(rect).forEach((key) => {
    _rect[key] = rect[key];
    rect[key] = Math.round(rect[key] * scale);
  });
  canvas6.ctx.fillStyle = '#000';
  canvas6.ctx.clearRect(0, 0, _rect.w, _rect.h);
  canvas6.ctx.burnImage(ssImage, rect.x, rect.y, rect.w, rect.h, 0, 0, _rect.w, _rect.h);
  const lineHeight = Math.round(_rect.h / 12);
  const marginBottom = 5;
  const blackHeight = 6;
  let isFindedYellow = false;
  let i, x, y, k, r, g, b, d, db, dw, p, f, r1, g1, b1, r2, g2, b2, _w;
  for (i = 0; i < 12; i++) {
    const imagedata = canvas6.ctx.getImageData(0, i * lineHeight, _rect.w, lineHeight);
    f = false;
    _w = _rect.w;
    if (!isFindedYellow) {
      k = 4 * (4 + 25 * _w);
      r = imagedata.data[k + 0];
      g = imagedata.data[k + 1];
      b = imagedata.data[k + 2];
      p = 100;
      d = 510 - r - g + b;
      if (d < p) {
        f = true;
        isFindedYellow = true;
      }
    }
    for (y = 0; y < h; y++) {
      for (x = 0; x < _w; x++) {
        k = 4 * (x + y * _w);
        r = imagedata.data[k + 0];
        g = imagedata.data[k + 1];
        b = imagedata.data[k + 2];
        db = r + g + b;
        dw = 765 - r - g - b;
        if (f) {
          if (db < p) r = g = b = 255;
          else r = g = b = 0;
        } else if (dw < p) r = g = b = 255;
        else if (db < p) r = g = b = 0;
        else r = g = b = 255;
        imagedata.data[k + 0] = r;
        imagedata.data[k + 1] = g;
        imagedata.data[k + 2] = b;
      }
    }
    canvas6.ctx.putImageData(imagedata, 0, i * lineHeight);
  }
  for (i = 0; i < 12; i++) {
    canvas6.ctx.fillRect(0, i * lineHeight - marginBottom, _rect.w, blackHeight);
  }
  const sampleImage = document.querySelector('#rank-image-mono');
  const imagedata1 = canvas6.ctx.getImageData(0, 0, _rect.w, _rect.h);
  canvas6.ctx.drawImage(sampleImage, 0, 0);
  const imagedata2 = canvas6.ctx.getImageData(0, 0, _rect.w, _rect.h);
  d = 0;
  _w = _rect.w;
  for (y = 0; y < h; y++) {
    for (x = 0; x < _w; x++) {
      k = 4 * (x + y * _w);
      r1 = imagedata1.data[k + 0];
      g1 = imagedata1.data[k + 1];
      b1 = imagedata1.data[k + 2];
      r2 = imagedata2.data[k + 0];
      g2 = imagedata2.data[k + 1];
      b2 = imagedata2.data[k + 2];
      if (r1 === r2 && g1 === g2 && b1 === b2) {
      } else {
        d++;
      }
    }
  }
  const isScanable = (d < 2000);
  if (isScanable) console.log('- no need to trim');
  else console.log('- please trim');
  return isScanable;
}
/** trimGameScreen(ssImage, success, error)
 */
function trimGameScreen(ssImage, success, error) {
  if (typeof ssImage === 'string') {
    const _ssImage = new Image();
    _ssImage.src = ssImage;
    ssImage = _ssImage;
  }
  const isScanable = checkScanable(ssImage);
  if (isScanable) {
    if (typeof success === 'function') success(ssImage, false);
  } else {
    trimGameScreenByRect(ssImage, success, error);
  }
}
/** getWindowWidth()
 */
const getWindowWidth = () => window.innerWidth
    || (document.body ? document.body.clientWidth : false)
    || document.documentElement.clientWidth;
/** getWindowHeight()
 */
const getWindowHeight = () => window.innerHeight
    || (document.body ? document.body.clientHeight : false)
    || document.documentElement.clientHeight;
/** makeZoomImage(img)
 */
let $viewerWrapper;
let $viewerClose;
let $viewerInner;
let $viewerImage;
let $viewerRank;
let $viewerRankPs;
let $viewerButton;
let $viewerButtonRB;
let $viewerButtonMake;
let $viewerButtonRead;
let $viewerButtonClose;
let $viewerButtonPs;
let footerNotice;
let noticeTimer;
function makeZoomImage() {
  $viewerWrapper = document.querySelector('#image-viewer-wrapper');
  $viewerInner = document.querySelector('#image-viewer-inner');
  $viewerImage = document.querySelector('#image-viewer-image');
  $viewerRank = document.querySelector('#image-viewer-rank');
  $viewerRankPs = document.querySelectorAll('#image-viewer-rank p');
  $viewerButton = document.querySelector('#image-viewer-button');
  $viewerButtonRB = document.querySelector('#image-viewer-button-rb');
  $viewerButtonMake = document.querySelector('#image-viewer-button-make');
  $viewerButtonRead = document.querySelector('#image-viewer-button-read');
  $viewerButtonClose = document.querySelector('#image-viewer-button-close');
  $viewerButtonPs = document.querySelectorAll('#image-viewer-button p');
  footerNotice = document.querySelector('#footer-notice');
  const close = () => {
    $viewerWrapper.style.setProperty('opacity', '0');
    setTimeout(() => {
      $viewerWrapper.style.setProperty('display', 'none');
    }, 300);
  };
  // 閉じるボタン
  $viewerButtonClose.addEventListener(mousedownEvent, close);
  // 読み取りボタン
  $viewerButtonRead.addEventListener(mousedownEvent, () => {
    let race = parseInt($viewerImage.getAttribute('race'));
    let ret = scanTeamData(race);
    if (ret) {
      close();
    }
  });
  // 標本作成ボタン
  $viewerButtonMake.addEventListener(mousedownEvent, () => {
    let race = parseInt($viewerImage.getAttribute('race'));
    let ret = makeSampleTeamData(race);
    if (ret) {
      close();
    }
  });
  // 右下固定ボタン
  $viewerButtonRB.addEventListener(mousedownEvent, () => {
    let $oldImage = document.querySelector('.fix-image-rb');
    if ($oldImage) {
      $oldImage.parentNode.removeChild($oldImage);
    }
    let $newImage = new Image();
    $newImage.src = $viewerImage.src;
    $newImage.classList.add('fix-image-rb');
    $newImage.addEventListener(mousedownEvent, (e) => {
      $newImage.parentNode.removeChild($newImage);
      e.stopPropagation();
      return false;
    });
    document.body.appendChild($newImage);
    close();
    notifyFooter('クリックで消去できます。');
  });
}
/** setEventZoomImage(img, race)
 */
function setEventZoomImage(img, race) {
  if (typeof img === 'string') img = document.querySelector(img);
  img.style.cursor = 'pointer';
  img.addEventListener(mousedownEvent, () => {
    if (race !== undefined) {
      $viewerImage.setAttribute('race', race);
      let teams = inputRankData[race - 1];
      let $ps = document.querySelectorAll('#image-viewer-rank p');
      $ps.forEach(($p, i) => {
        $p.innerText = '';
        $p.classList.add('team--1');
        $p.classList.remove('team-0');
        $p.classList.remove('team-1');
        $p.classList.remove('team-2');
        $p.classList.remove('team-3');
        $p.classList.remove('team-4');
        $p.classList.remove('team-5');
        $p.classList.remove('team-6');
        if (teams[i] !== '-1') {
          $p.classList.remove('team--1');
          $p.classList.add(`team-${teams[i]}`);
          $p.innerText = teamNames[teams[i]];
        }
      });
    }
    const windowWidth = (window.isOverlay) ? 800 : getWindowWidth();
    const windowHeight = (window.isOverlay) ? 800 : getWindowHeight();
    const innerWidthMax = windowWidth * 0.8;
    const innerHeightMax = windowHeight * 0.8;
    const innerAspect = innerWidthMax / innerHeightMax;
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    const imageAspect = imageWidth / imageHeight;
    let width; let height; let left; let top;
    if (innerAspect > imageAspect) {
      height = innerHeightMax;
      width = height * imageAspect;
    } else {
      width = innerWidthMax;
      height = width / imageAspect;
    }
    left = (windowWidth - width) / 2;
    top = (windowHeight - height * 1.1) / 2;
    $viewerInner.style.setProperty('width', `${width}px`);
    $viewerInner.style.setProperty('height', `${height}px`);
    $viewerInner.style.setProperty('top', `${top}px`);
    $viewerInner.style.setProperty('left', `${left}px`);
    $viewerButton.style.setProperty('top', `${height}px`);
    $viewerButton.style.setProperty('width', `${width}px`);
    $viewerButtonPs.forEach($p => {
      $p.style.setProperty('height', `${height * 0.11}px`);
      $p.style.setProperty('line-height', `${height * 0.11}px`);
      $p.style.setProperty('font-size', `${height * 0.05}px`);
    });
    $viewerRankPs.forEach($p => {
      $p.style.setProperty('line-height', `${height * 0.05}px`);
      $p.style.setProperty('font-size',  `${height * 0.03}px`);
    });
    $viewerImage.src = img.src;
    $viewerWrapper.style.setProperty('display', 'block');
    setTimeout(() => {
      $viewerWrapper.style.setProperty('opacity', '1');
    }, 1);
  });
}
/** notifyFooter(img)
 */
function notifyFooter(text) {
  const p = document.createElement('p');
  p.textContent = text;
  p.style.setProperty('transition', 'none');
  p.style.setProperty('display', 'block');
  footerNotice.innerHTML = '';
  footerNotice.appendChild(p);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => {
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      p.style.setProperty('transition', '');
      p.style.setProperty('opacity', '0');
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => {
        footerNotice.innerHTML = '';
      }, 600);
    }, 5000);
  }, 1);
}
/** setEventPasteImage(elm, img)
 * https://qiita.com/tatesuke/items/00de1c6be89bad2a6a72
 */
function setEventPasteImage(elm, callback) {
  if (typeof elm === 'string') elm = document.querySelector(elm);
  const defaultText = '<span>paste</span>';
  elm.setAttribute('contenteditable', 'true');
  elm.innerHTML = defaultText;
  elm.addEventListener('paste', function (e) {
    const self = this;
    if (!e.clipboardData
      || !e.clipboardData.types
      || (e.clipboardData.types.length != 1)
      || (e.clipboardData.types[0] != 'Files')) {
      return true;
    }
    const imageFile = e.clipboardData.items[0].getAsFile();
    const fr = new FileReader();
    fr.onload = function (e) {
      const base64 = e.target.result;
      const img = document.createElement('img');
      img.onload = function (e) {
        img.onload = null;
        if (callback) callback(this, self);
      };
      img.setAttribute('src', base64);
    };
    fr.readAsDataURL(imageFile);
    this.innerHTML = defaultText;
    return false;
  });
  elm.addEventListener('input', function (e) {
    const self = this;
  	const temp = document.createElement('div');
  	temp.innerHTML = this.innerHTML;
  	const pastedImage = temp.querySelector('img');
  	if (pastedImage) {
      if (callback) callback(pastedImage, self);
  	} else {
  	  notifyFooter('画像データではありません。');
  	}
    this.innerHTML = defaultText;
  });
}
/** createTitledImage(img, title)
 */
function createTitledImage(img, title) {
  const div = document.createElement('div');
  div.classList.add('titled-image-wrapper');
  const p = document.createElement('p');
  p.textContent = title;
  div.appendChild(img);
  div.appendChild(p);
  return div;
}
/** createCanvas(w, h)
 */
function createCanvas(flag, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.ctx = canvas.getContext('2d');
  canvas.ctx.clear = function () {
    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  canvas.ctx.myDrawImage = function (img) {
    canvas.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  canvas.ctx.burnImage = function (img) {
    const args = arguments;
    draw('source-over', 1);
    draw('multiply', 5);
    draw('overlay', 5);
    draw('source-over', 0);
    function draw(mode, len) {
      if (mode !== undefined) canvas.ctx.globalCompositeOperation = mode;
      if (len === undefined) len = 1;
      for (let i = 0; i < len; i++) {
        canvas.ctx.drawImage.apply(canvas.ctx, args);
      }
    }
  };
  canvas.fill = function (color) {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
  };
  canvas.init = function (w, h, img) {
    this.width = w;
    this.height = h;
    this.ctx.globalAlpha = '1';
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.clear();
    this.ctx.drawImage(img, 0, 0, w, h);
  };
  if (flag) document.body.appendChild(canvas);
  return canvas;
}
/** createArray(length, value)
 */
function createArray(length, value) {
  const arr = [];
  for (let i = 0; i < length; i++) {
    arr[i] = value;
  }
  return arr;
}
/** createInt16Array(length)
 * https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
 */
function createInt16Array(length) {
  const buffer = new ArrayBuffer(length << 1);
  const int16View = new Int16Array(buffer);
  for (let i = 0; i < int16View.length; i++) {
    int16View[i] = 0;
  }
  return int16View;
}
/** getRatio(a, b)
 */
function getRatio(a, b) {
  const isBigA = (a > b);
  const max = 64;
  const big = isBigA ? a : b;
  const small = isBigA ? b : a;
  return (small * max < big) ? max : big / small;
}
/** trimGameScreenByRect(ssImage, success, error)
*/
function trimGameScreenByRect(ssImage, success, error) {
  if (typeof ssImage === 'string') ssImage = document.querySelector(ssImage);
  console.log('- trimming the game screen');
  const canvas = canvas5;
  const w = ssImage.naturalWidth;
  const h = ssImage.naturalHeight;
  console.log(`- the image is (w, h) = (${w}, ${h})`);
  canvas.init(w, h, ssImage);
  const recordNum = 2;
  const linePropertiesNum = 2;
  const slipValueRate = 15;
  const slipValueW = Math.floor(w * slipValueRate / 100);
  const slipValueH = Math.floor(h * slipValueRate / 100);
  const narrowDownNum = 3;
  /** getStraightLines(direction)
   */
  const getStraightLines = function (direction) {
    let whiteStart, whiteLength, maxWhiteStarts, maxWhiteLengths;
    let _w, _h, x, y, k, r, g, b;
    /** update() */
    const update = function () {
      for (let i = 0; i < recordNum; i++) {
        if (whiteLength > maxWhiteLengths[i]) {
          for (let j = i; j + 1 < recordNum; j++) {
            maxWhiteLengths[j + 1] = maxWhiteLengths[j];
            maxWhiteStarts[j + 1] = maxWhiteStarts[j];
          }
          maxWhiteLengths[i] = whiteLength;
          maxWhiteStarts[i] = whiteStart;
          break;
        }
      }
      whiteLength = 0;
      whiteStart = y + 1;
    };
    const isVertical = (direction === 'vertical');
    const w = canvas.width;
    const h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    const imagedata = canvas.ctx.getImageData(0, 0, w, h);
    const straightLines = createInt16Array(recordNum * _w * linePropertiesNum);
    for (x = 0; x < _w; x++) {
      let _r = -1, _g = -1, _b = -1;
      whiteStart = 0;
      whiteLength = 0;
      maxWhiteStarts = createArray(recordNum, 0);
      maxWhiteLengths = createArray(recordNum, 0);
      const maxWhiteStart = 0;
      const maxWhiteLength = 0;
      for (y = 0; y < _h; y++) {
        k = (isVertical) ? (x + y * w) * 4 : (y + x * w) * 4;
        r = imagedata.data[k + 0];
        g = imagedata.data[k + 1];
        b = imagedata.data[k + 2];
        if (r === _r && g === _g && b === _b) {
          whiteLength++;
        } else {
          if (whiteLength) update();
          _r = r; _g = g; _b = b;
        }
      }
      update();
      for (let j = 0; j < recordNum; j++) {
        straightLines[0 + (x * recordNum + j) * linePropertiesNum] = maxWhiteStarts[j];
        straightLines[1 + (x * recordNum + j) * linePropertiesNum] = maxWhiteLengths[j];
      }
    }
    return straightLines;
  };
  /** drawStraightLines(direction, data)
   */
  const drawStraightLines = function (direction, data) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.ctx.fillStyle = '#fff';
    canvas.ctx.globalAlpha = '1';
    const isVertical = (direction === 'vertical');
    let _w; let _h; const w = canvas.width; const
      h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    for (let i = 0; i < _w; i++) {
      for (let j = 0; j < recordNum; j++) {
        const start = data[0 + (i * recordNum + j) * linePropertiesNum];
        const length = data[1 + (i * recordNum + j) * linePropertiesNum];
        if (j === 0) canvas.ctx.fillStyle = '#fff';
        else canvas.ctx.fillStyle = '#eee';
        if (isVertical) canvas.ctx.fillRect(i, start, 1, length);
        else canvas.ctx.fillRect(start, i, length, 1);
      }
    }
  };
  /** getDoubtfulPoints(direction, data, slipValue)
   */
  const getDoubtfulPoints = function (direction, data, slipValue) {
    const isVertical = (direction === 'vertical');
    let _w; let _h; const w = canvas.width; const
      h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    const doubtfulPoints = [-1];
    const doubtfulStartPoints = [-1];
    const doubtfulEndPoints = [];
    let _length;
    const dataLength = data.length / (linePropertiesNum * recordNum);
    for (let i = 0; i < dataLength; i++) {
      let length = 0;
      for (let j = 0; j < recordNum; j++) {
        length += data[1 + (i * recordNum + j) * linePropertiesNum];
      }
      if (i > 0 && Math.abs(length - _length) > slipValue) {
        const p = {};
        if (length < _length) {
          doubtfulPoints.push(i - 1);
          doubtfulStartPoints.push(i - 1);
        } else {
          doubtfulPoints.push(i);
          doubtfulEndPoints.push(i);
        }
      }
      _length = length;
    }
    doubtfulPoints.push(_w + 1);
    doubtfulEndPoints.push(_w + 1);
    return [doubtfulPoints, doubtfulStartPoints, doubtfulEndPoints];
  };
  /** drawDoubtfulPoints(direction, color)
   */
  const drawDoubtfulPoints = function (direction, points, color) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.ctx.fillStyle = color;
    canvas.ctx.globalAlpha = '1';
    const isVertical = (direction === 'vertical');
    if (isVertical) {
      _w = w; _h = h;
    } else {
      _w = h; _h = w;
    }
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (isVertical) canvas.ctx.fillRect(p, 0, 1, _w);
      else canvas.ctx.fillRect(0, p, _h, 1);
    }
  };
  /** getDoubtfulRects(Xs, Ys)
   */
  const getDoubtfulRects = function (Xs, Ys) {
    const doubtfulRects = [];
    const minRectWidth = Math.floor(w * 0.05);
    const minRectHeight = Math.floor(h * 0.05);
    for (let i = 0; i + 1 < Xs.length; i++) {
      const x1 = Xs[i + 0] + 1;
      const x2 = Xs[i + 1];
      const rw = x2 - x1;
      if (rw > minRectWidth) {
        for (let j = 0; j + 1 < Ys.length; j++) {
          const y1 = doubtfulYs[j + 0] + 1;
          const y2 = doubtfulYs[j + 1];
          const rh = y2 - y1;
          if (rh > minRectHeight) {
            doubtfulRects.push({
              x: x1, y: y1, w: rw, h: rh, s: rw * rh,
            });
          }
        }
      }
    }
    doubtfulRects.sort((a, b) => {
      if (a.s > b.s) return -1;
      return 1;
    });
    return doubtfulRects;
  };
  /** drawDoubtfulRects(rects)
   */
  const drawDoubtfulRects = function (rects, color) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    if (color) {
      canvas.ctx.globalAlpha = '0.7';
      canvas.ctx.fillStyle = color;
    } else {
      canvas.ctx.globalAlpha = '0.5';
      canvas.ctx.fillStyle = 'hsl(220, 50%, 50%)';
    }
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      canvas.ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    canvas.ctx.globalAlpha = '1';
  };
  /** narrowDownDoubtfulRects(rects)
   */
  const narrowDownDoubtfulRects = function (rects) {
    const maxNarrowDownNum = Math.min(rects.length, narrowDownNum);
    const targetRects = [];
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      let isUnique = true;
      for (let j = 0; j < targetRects.length; j++) {
        const tRect = targetRects[j];
        const f1 = (tRect.x === rect.x && tRect.w === rect.w);
        const f2 = (tRect.y === rect.y && tRect.h === rect.h);
        if (f1 || f2) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        targetRects.push(rect);
      }
      if (targetRects.length >= maxNarrowDownNum) {
        break;
      }
    }
    return targetRects;
  };
  /** widenDoubtfulRects(rects, startXs, endXs, startYs, endYs)
   */
  const widenDoubtfulRects = function (rects, startXs, endXs, startYs, endYs) {
    /** sort(rects) */
    const sort = function (rects) {
      rects.sort((a, b) => {
        if (a.score > b.score) return -1;
        return 1;
      });
    };
    /** calc(rects) */
    const calc = function (rects) {
      const targetRatio = 9 / 16;
      rects.forEach((rect) => {
        const ratio = rect.h / rect.w;
        let difRatio = Math.abs(targetRatio - ratio);
        if (ratio < targetRatio) difRatio *= 2;
        rect.score = (rect.w / w) - (difRatio * 100);
      });
    };
    /** widen(doWidenX, rects, originRect, startPoints, endPoints) */
    const widen = function (doWidenX, rects, originRect, startPoints, endPoints) {
      for (let isp = 0; isp < startPoints.length; isp++) {
        const startPoint = startPoints[isp] + 1;
        for (let iep = 0; iep < endPoints.length; iep++) {
          const endPoint = endPoints[iep];
          const pointRange = endPoint - startPoint;
          let newRect;
          if (doWidenX) {
            newRect = {
              x: startPoint,
              y: originRect.y,
              w: pointRange,
              h: originRect.h,
              s: pointRange * originRect.h,
            };
          } else {
            newRect = {
              x: originRect.x,
              y: startPoint,
              w: originRect.w,
              h: pointRange,
              s: pointRange * originRect.w,
            };
          }
          if (newRect.w > minRectWidth && newRect.h > minRectHeight
              && newRect.w > newRect.h && newRect.w < newRect.h * 2) {
            rects.push(newRect);
          }
        }
      }
    };
    const w = canvas.width; const
      h = canvas.height;
    const minRectWidth = Math.floor(w * 0.05);
    const minRectHeight = Math.floor(h * 0.05);
    const newRects = [];
    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      newRects.push(rect);
      widen(true, newRects, rect, startXs, endXs);
      widen(false, newRects, rect, startYs, endYs);
    }
    calc(newRects);
    sort(newRects);
    return newRects;
  };
  /** do */
  const horizontalStraightLines = getStraightLines('horizontal');
  const verticalStraightLines = getStraightLines('vertical');
  const [doubtfulXs, doubtfulStartXs, doubtfulEndXs] = getDoubtfulPoints('vertical', verticalStraightLines, slipValueW);
  const [doubtfulYs, doubtfulStartYs, doubtfulEndYs] = getDoubtfulPoints('horizontal', horizontalStraightLines, slipValueH);
  const doubtfulRects = getDoubtfulRects(doubtfulXs, doubtfulYs);
  const narrowDownedRects = narrowDownDoubtfulRects(doubtfulRects);
  const widenedRects = widenDoubtfulRects(doubtfulRects, doubtfulStartXs,
    doubtfulEndXs, doubtfulStartYs, doubtfulEndYs);
  const bestRect = widenedRects[0];
  if (bestRect) {
    canvas6.width = 1280;
    canvas6.height = 720;
    canvas6.ctx.drawImage(ssImage, bestRect.x, bestRect.y, bestRect.w, bestRect.h,
      0, 0, 1280, 720);
    console.log('- trimed the game screen');
    console.log(`- the game screen is (x, y, w, h) = (${
      bestRect.x}, ${bestRect.y}, ${bestRect.w}, ${bestRect.h})`);
    if (typeof success === 'function') success(canvas6, true);
  } else {
    console.log('- sorry, trimming failed');
    if (typeof error === 'function') error();
  }
}
