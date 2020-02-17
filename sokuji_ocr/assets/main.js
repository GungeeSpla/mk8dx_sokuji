/*
 * makeDebugArea(elm)
 */
window.isDebugMode = false;
window.debugArea = null;
function makeDebugArea(elm) {
  if (typeof elm === 'string') elm = document.querySelector(elm);
  debugArea = elm;
  isDebugMode = true;
}

/* 
 * makeTesseract(callback)
 */
window.isEnabledTesseractLog = true;
function makeTesseract(img, callback) {
  if (typeof img === 'string') img = document.querySelector(img);
  var isVisibleCanvas = false;
  window.canvas1 = createCanvas(isVisibleCanvas, 1280, 720);
  window.canvas2 = createCanvas(isVisibleCanvas, 230 * 2, 25 * 2);
  window.canvas3 = createCanvas(isVisibleCanvas, 230 * 2, 25 * 2 * 12);
  window.canvas4 = createCanvas(isVisibleCanvas,  54 * 2, 25 * 2 * 12);
  window.canvas5 = createCanvas(isVisibleCanvas, 100, 100);
  window.canvas6 = createCanvas(isVisibleCanvas, 66, 623);
  return runTesseract(img, callback);

  /*
   * runTesseract()
   * https://github.com/naptha/tesseract.js/blob/master/docs/api.md#worker-set-parameters
   */
  function runTesseract(img, callback) {
    var hrefSplit = window.location.href.split('/');
    hrefSplit.pop();
    var parentDir = hrefSplit.join('/');
    window.tesseract = Tesseract.createWorker({
      corePath  : parentDir + '/tesseract/tesseract-core.wasm.js',
      workerPath: parentDir + '/tesseract/worker.min.js',
      langPath  : parentDir + '/tesseract/',
      logger: (mes) => {
        if (isEnabledTesseractLog) {
          var p = (mes.progress * 100).toFixed(0);
          console.log(mes.status + ' ' + p + '%');
        }
      }
    });
    (async () => {
      await tesseract.load();
      await tesseract.loadLanguage('jpn');
      await tesseract.initialize('jpn');
      var ret = await tesseract.recognize(img);
      console.log(img.src + ' is recognized as ' + ret.data.text.replace(/\n/g, ''));
      console.log('tesseract is ready!');
      if (callback) callback();
    })();
    /*
    tesseract.setParameters({
      tessedit_char_whitelist: '0123456789',
    });
    */
  }
}

/* 
 * scanGameScreen(img, callback)
 */
function scanGameScreen(img, callback) {
  console.log('recognizing 1st - 12th player names');
  canvas1.ctx.burnImage(img, 0, 0, canvas1.width, canvas1.height);
  canvas1.debugImage('焼き付け結果');
  var i, imagedata;
  for (i = 0; i < 12; i++) {
    canvas2.width = canvas3.width;
    imagedata = parseNameImage(canvas1, canvas2, i, 678, 62+i*52, 230, 25);
    canvas3.ctx.putImageData(imagedata, 0, i * 25 * 2);
  }
  for (i = 0; i < 12; i++) {
    canvas2.width = canvas4.width;
    imagedata = parseNameImage(canvas1, canvas2, i, 1164, 65+i*52, 54, 25);
    canvas4.ctx.putImageData(imagedata, 0, i * 25 * 2);
  }
  canvas3.debugImage('順位部分');
  var rects = [];
  for (i = 0; i < 12; i++) {
    rects.push({
      top: 50 * i, left: 0, width: 460, height: 50
    });
  }
  console.time('scan');
  canvas3.tesseract(function(ret) {
    var scanedNameArray = ret.data.text
    .replace(/\n+/g, '\n')  // 複数の改行を1個の改行に
    .replace(/( |　)/g, '') // 半角または全角のスペースを削除
    .replace(/^\n/g, '')    // 行頭および行末の改行を削除
    .replace(/\n$/g, '')
    .split('\n');           // 改行でsplit
    for (var i = 0; i < scanedNameArray.length; i++) {
      console.log((i + 1) + ': ' + scanedNameArray[i]);
    }
    console.timeEnd('scan');
    if (typeof callback === 'function') callback(scanedNameArray);
  });
  /*
  (async () => {
    var scanedNameArray = [];
    isEnabledTesseractLog = false;
    for (var i = 0; i < 12; i++) {
      var ret = await tesseract.recognize(canvas3, {rectangles: [
        {left: 0, top: i * 50, width: 459, height: 50}
      ]});
      var text = ret.data.text
      .replace(/\s+/g, '');
      scanedNameArray[i] = text;
      console.log((i + 1) + ': ' + text);
    }
    console.timeEnd('scan');
    if (typeof callback === 'function') callback(scanedNameArray);
  })();
  */
  return;
  
  // 順位imgから文字の部分を切り抜いてcanvasに写す
  function parseNameImage(img, canvas, i, sx, sy, sw, sh) {
    var w = canvas.width;
    var h = canvas.height;
    canvas.ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    var imagedata = canvas.ctx.getImageData(0, 0, w, h);
    var f = isYellowZone(w, h);
    var x, y, k, r, g, b, p;
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
    // kマス目をrgbで塗りつぶす
    function fill(k, rgb) {
      imagedata.data[k + 0] = rgb;
      imagedata.data[k + 1] = rgb;
      imagedata.data[k + 2] = rgb;
    }
    // 黄色いゾーンですか？
    function isYellowZone(w, h) {
      var p = 0;
      for (var y = 0, y = 0; y < h; y++) p += getYellowPoint(x, y, w);
      for (var x = 0, y = 0; x < w; x++) p += getYellowPoint(x, y, w);
      return (p > 100);
    }
    // 黄色っぽさを取得する
    function getYellowPoint(x, y, w) {
      var k = 4 * (x + y * w);
      var r = imagedata.data[k + 0];
      var g = imagedata.data[k + 1];
      var b = imagedata.data[k + 2];
      return (r > 180 && g > 180 && b < 100) ? 1 : 0;
    }
  }
}

/*
 * getTeamRankArray(scanedNameArr)
 */
function getTeamRankArray(scanedNameArr, sampleTeamData) {
  var sampleArray = Object.keys(sampleTeamData);
  var arr = [];
  // 名前の配列要素それぞれについて
  scanedNameArr.forEach((name, i) => {
    // 見本を一周して似ている順位に並べて候補配列を作る
    // 候補配列は類似度が高い順
    var candidates = [];
    sampleArray.forEach(sampleName => {
      var score = getNameSimilarity(name, sampleName);
      candidates.push({
        name: sampleName,
        score: score
      });
    });
    candidates.sort(function(a, b) {
      if (a.score > b.score) return -1;
      else return 1;
    });
    arr.push({
      name: name,
      rank: i + 1,
      topName: candidates[0].name,
      topScore: candidates[0].score,
      candidates: candidates,
    });
  });
  //「候補配列内の最高類似度」が高い順に並べる
  arr.sort(function(a, b) {
    if (a.topScore > b.topScore) return -1;
    else return 1;
  });
  // 名前を確定していく
  // 重複が生じないように決定済みの名前をdeterminedNamesで管理する
  var determinedNames = [];
  arr.forEach(obj => {
    for (var i = 0; i < obj.candidates.length; i++) {
      var cnd = obj.candidates[i];
      if (determinedNames.indexOf(cnd.name) < 0) {
        obj.topName = cnd.name;
        obj.topScore = cnd.score;
        obj.team = sampleTeamData[cnd.name];
        determinedNames.push(cnd.name);
        break;
      }
    };
  });
  // rankの数値が低い順（＝順位が高い順）に並べて
  // チームタグを新規配列に放り込んでいく
  arr.sort(function(a, b) {
    if (a.rank < b.rank) return -1;
    else return 1;
  });
  var teamArr = [];
  arr.forEach(obj => {
    teamArr.push(obj.team);
  });
  return teamArr;

  /*
   * getNameSimilarity(_name, _sampleName)
   */
  function getNameSimilarity(_name, _sampleName) {
    var score = 0;
    
    //「あ→ぁ」のように文字を小さくする
    var name = parseSmallerStr(_name);
    var sampleName = parseSmallerStr(_sampleName);
    
    // 字数の差が少ないほうが似ている
    var lengthScore = 10 - Math.abs(name.length - sampleName.length);
    
    // 名前を構成する各文字がサンプルに含まれていれば加点する
    // しかも文字の位置も似ているならさらに加点する
    var charScore = 0;
    var chars = name.split('');
    chars.forEach((c, i) => {
      var j = sampleName.indexOf(c);
      if (j > -1) {
        charScore += 1;
        if (Math.abs(i - j) < 3) {
          charScore += 1;
        }
      }
    });
    
    // lengthScoreとcharScoreの和が得点になる
    return lengthScore + charScore;
    
    // 文字を小さくする関数
    function parseSmallerStr(str) {
      var arr = [
        [/あ/g, 'ぁ'],
        [/い/g, 'ぃ'],
        [/う/g, 'ぅ'],
        [/え/g, 'ぇ'],
        [/お/g, 'ぉ'],
        [/か/g, 'ゕ'],
        [/く/g,  '<'],
        [/つ/g, 'っ'],
        [/や/g, 'ゃ'],
        [/ゆ/g, 'ゅ'],
        [/よ/g, 'ょ'],
        [/わ/g, 'ゎ'],
        [/ぱ/g, 'ば'],
        [/ぴ/g, 'び'],
        [/ぷ/g, 'ぶ'],
        [/ぺ/g, 'べ'],
        [/ぽ/g, 'ぼ'],
        [/パ/g, 'バ'],
        [/ピ/g, 'ビ'],
        [/プ/g, 'ブ'],
        [/ペ/g, 'ベ'],
        [/ポ/g, 'ボ'],
        [/わ/g, 'ゎ'],
        [/「/g,  'r'],
        [ /C/g,  'c'],
        [ /K/g,  'k'],
        [ /S/g,  's'],
        [ /U/g,  'u'],
        [ /V/g,  'v'],
        [ /W/g,  'w'],
        [ /X/g,  'x'],
        [ /Z/g,  'z'],
        [ /O/g,  'o'],
        [ /0/g,  'o'],
        [/。/g,  'o']
      ];
      arr.forEach(item => {
        str = str.replace(item[0], item[1]);
      });
      return str;
    }
  }
}

/*
 * test()
 */
function test() {
  var sampleTeamData = {
    'NX ぉまえモナー': 'NX',
    'NX*<さぁん': 'NX',
    'AST': 'LAST',
    'ALーア': 'LAST',
    'とっとこーはしるよお': 'とっとこ',
    'とっととーはしれよ!': 'とっとこ',
    'よもきさま': 'さま',
    'けけはらさま': 'さま',
    'つけめんたベたい': 'つけめん',
    'ぁぶらつけめん': 'つけめん',
    'ゃきとりディナー': 'やきとり',
    'ゃきとりは66': 'やきとり'
  };
  var sampleRaceData = [
    'よもきさま',
    'ゃきとりディナー',
    'やきとりは66',
    'AST',
    'NX ぉまえモナー',
    'ぁぶらつけめん',
    'とっととーはしれよ!',
    'けけはらさま',
    'つけめんたベたい',
    'とつとこーはしるよヵ',
    'NXー;た<さぁん',
    'ALーァ'
  ];
  getTeamRankArray(sampleRaceData, sampleTeamData);
}

/* 
 * checkScanable(ssImage, callback)
 */
function checkScanable(ssImage, callback) {
  if (typeof ssImage === 'string') ssImage = document.querySelector(ssImage);
  
  console.log('checking necessity of trimming');
  var canvas = canvas5;
  var w = ssImage.naturalWidth;
  var h = ssImage.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.ctx.globalAlpha = '1';
  canvas.ctx.globalCompositeOperation = 'source-over';
  canvas.ctx.drawImage(ssImage, 0, 0);
  
  var scale = w / 1280;
  var _rect = {}, rect = {x: 555, y: 50, w: 66, h: 623};
  canvas6.width = rect.w;
  canvas6.height = rect.h;
  Object.keys(rect).forEach(key => {
    _rect[key] = rect[key];
    rect[key] = Math.round(rect[key] * scale);
  });
  
  canvas6.ctx.fillStyle = '#000';
  canvas6.ctx.clearRect(0, 0, _rect.w, _rect.h);
  canvas6.ctx.burnImage(ssImage, rect.x, rect.y, rect.w, rect.h, 0, 0, _rect.w, _rect.h);
  var lineHeight = Math.round(_rect.h / 12);
  var marginBottom = 5;
  var blackHeight = 6;
  var isFindedYellow = false;
  for (var i = 0; i < 12; i++) {
    var imagedata = canvas6.ctx.getImageData(0, i * lineHeight, _rect.w, lineHeight);
    var x, y, k, r, g, b, d, db, dw, p, f = false, w = _rect.w;
    if (!isFindedYellow) {
      k = 4 * (4 + 25 * w);
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
      for (x = 0; x < w; x++) {
        k = 4 * (x + y * w);
        r = imagedata.data[k + 0];
        g = imagedata.data[k + 1];
        b = imagedata.data[k + 2];
        db = r + g + b;
        dw = 765 - r - g - b;
        if (f) {
          if (db < p) r = g = b = 255;
          else r = g = b = 0;
        } else {
          if (dw < p) r = g = b = 255;
          else if (db < p) r = g = b = 0;
          else r = g = b = 255;
        }
        imagedata.data[k + 0] = r;
        imagedata.data[k + 1] = g;
        imagedata.data[k + 2] = b;
      }
    }
    canvas6.ctx.putImageData(imagedata, 0, i * lineHeight);
  }
  for (var i = 0; i < 12; i++) {
    canvas6.ctx.fillRect(0, i * lineHeight - marginBottom, _rect.w, blackHeight);
  }
  
  var sampleImage = document.querySelector('#rank-image-mono');
  var imagedata1 = canvas6.ctx.getImageData(0, 0, _rect.w, _rect.h);
  canvas6.ctx.drawImage(sampleImage, 0, 0);
  var imagedata2 = canvas6.ctx.getImageData(0, 0, _rect.w, _rect.h);
  var x, y, k, r1, g1, b1, r2, g2, b2, d = 0, w = _rect.w;
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      k = 4 * (x + y * w);
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
  var isScanable = (d < 2000);
  if (isScanable) console.log('no need to trim');
  else console.log('please trim');
  return isScanable;
}

/* 
 * trimGameScreen(ssImage, success, error)
 */
function trimGameScreen(ssImage, success, error) {
  var isScanable = checkScanable(ssImage);
  if (isScanable) {
    if (typeof success === 'function') success(ssImage, false);
  } else {
    trimGameScreenByRect(ssImage, success, error);
  }
}


/* 
 * makeZoomImage(img)
 */
function makeZoomImage() {
  window.viewerWrapper = document.querySelector('#image-viewer-wrapper');
  window.viewerClose = document.querySelector('#image-viewer-close');
  window.viewerInner = document.querySelector('#image-viewer-inner');
  window.viewerImage = document.querySelector('#image-viewer-image');
  window.footerNotice = document.querySelector('#footer-notice');
  window.noticeTimer = null;
  viewerClose.addEventListener('click', function(e) {
    viewerWrapper.style.opacity = 0;
    setTimeout(function(){
      viewerWrapper.style.display = 'none';
    }, 300);
  });
}

/*
 * setEventZoomImage(img)
 */
function setEventZoomImage(img) {
  if (typeof img === 'string') img = document.querySelector(img);
  img.style.cursor = 'pointer';
  img.addEventListener('click', function() {
    viewerImage.src = img.src;
    viewerWrapper.style.display = 'block';
    var r1 = img.naturalHeight / img.naturalWidth;
    var r2 = viewerInner.clientHeight / viewerInner.clientWidth;
    if (r1 > r2) {
      viewerImage.style.width = 'auto';
      viewerImage.style.height = '100%';
    } else {
      viewerImage.style.width = '100%';
      viewerImage.style.height = 'auto';
    }
    setTimeout(function(){
      viewerWrapper.style.opacity = 1;
    },1);
  });
}

/*
 * notifyFooter(img)
 */
function notifyFooter(text) {
  var p = document.createElement('p');
  p.textContent = text;
  p.style.transition = 'none';
  p.style.display = 'block';
  footerNotice.innerHTML = '';
  footerNotice.appendChild(p);
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(function(){
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function(){
      p.style.transition = '';
      p.style.opacity = 0;
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(function(){
        footerNotice.innerHTML = '';
      },600);
    },2000);
  },1);
}

/*
 * setEventPasteImage(elm, img)
 * https://qiita.com/tatesuke/items/00de1c6be89bad2a6a72
 */
function setEventPasteImage(elm, callback) {
  if (typeof elm === 'string')
    elm = document.querySelector(elm);
  
  var defaultText = '<span>paste</span>';
  elm.setAttribute('contenteditable', 'true');
  elm.innerHTML = defaultText;
  
  elm.addEventListener("paste", function(e){
    var self = this;
    if (!e.clipboardData 
      || !e.clipboardData.types
      || (e.clipboardData.types.length != 1)
      || (e.clipboardData.types[0] != "Files")) {
      return true;
    }
    var imageFile = e.clipboardData.items[0].getAsFile();
    var fr = new FileReader();
    fr.onload = function(e) {
      var base64 = e.target.result;
      var img = document.createElement('img');
      img.onload = function(e) {
        img.onload = null;
        if (callback) callback(this, self);
      }
      img.setAttribute('src', base64);
    };
    fr.readAsDataURL(imageFile);
    this.innerHTML = defaultText;
    return false;
  });
  
  elm.addEventListener('input', function(e){
    var self = this;
  	var temp = document.createElement('div');
  	temp.innerHTML = this.innerHTML;
  	var pastedImage = temp.querySelector('img');
  	if (pastedImage) {
      if (callback) callback(pastedImage, self);
  	} else {
  	  notifyFooter('画像データではありません.');
  	}
    this.innerHTML = defaultText;
  })
}


/* 
 * createTitledImage(img, title)
 */
function createTitledImage(img, title) {
  var div = document.createElement('div');
  div.classList.add('titled-image-wrapper');
  var p = document.createElement('p');
  p.textContent = title;
  div.appendChild(img);
  div.appendChild(p);
  return div;
}

/*
 * createCanvas(w, h)
 */
function createCanvas(flag, w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.ctx = canvas.getContext('2d');
  canvas.ctx.clear = function(){
    canvas.ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  canvas.ctx.myDrawImage = function(img){
    canvas.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  canvas.ctx.burnImage = function(img) {
    var args = arguments;
    draw("source-over", 1);
    draw("multiply",    5);
    draw("overlay",     5);
    draw("source-over", 0);
    function draw(mode, len) {
      if (mode !== undefined) canvas.ctx.globalCompositeOperation = mode;
      if (len  === undefined) len = 1;
      for (var i = 0; i < len; i++) {
        canvas.ctx.drawImage.apply(canvas.ctx, args);
      }
    }
  };
  canvas.fill = function(color) {
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
  canvas.tesseract = function(callback) {
    tesseract.recognize(canvas)
    .then(callback);
  };
  canvas.debugImage = function(str, imageData) {
    if (!isDebugMode) return;
    if (imageData) this.ctx.putImageData(imageData, 0, 0);
    var img = document.createElement('img');
    img.onload = function() {
      if (this.naturalWidth / this.naturalHeight < 16 / 9) {
        this.style.height = '100%';
        this.style.width = 'auto';
      }
      setEventZoomImage(this);
      var div = createTitledImage(this, str);
      debugArea.appendChild(div);
    }
    img.src = this.toDataURL();
  };
  if (flag) document.body.appendChild(canvas);
  return canvas;
}

/*
 * createArray(length, value)
 */
function createArray(length, value) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = value;
  }
  return arr;
}

/*
 * createInt16Array(length)
 * https://developer.mozilla.org/ja/docs/Web/JavaScript/Typed_arrays
 */
function createInt16Array(length) {
  var buffer = new ArrayBuffer(length << 1);
  var int16View = new Int16Array(buffer);
  for (var i = 0; i < int16View.length; i++) {
    int16View[i] = 0;
  }
  return int16View;
}

/*
 * getRatio(a, b)
 */
function getRatio(a, b) {
  var isBigA = (a > b);
  var max = 64;
  var big   = isBigA ? a : b;
  var small = isBigA ? b : a;
  return (small * max < big) ? max : big / small;
}