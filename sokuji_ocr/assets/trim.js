/* 
 * trimGameScreenByRect(ssImage, success, error)
** 
*/
function trimGameScreenByRect(ssImage, success, error) {
  if (typeof ssImage === 'string')
    ssImage = document.querySelector(ssImage);
  
  console.log('trimming the game screen');
  var canvas = canvas5;
  var w = ssImage.naturalWidth;
  var h = ssImage.naturalHeight;
  console.info('the image is (w, h) = (' + w + ', ' + h + ')');
  canvas.init(w, h, ssImage);
  
  var recordNum = 2;
  var linePropertiesNum = 2;
  var horizontalStraightLines = getStraightLines('horizontal');
  var verticalStraightLines = getStraightLines('vertical');
  if (isDebugMode) {
    canvas.fill('#000');
    drawStraightLines('horizontal', horizontalStraightLines);
    canvas.debugImage('ピクセルが無変化な直線部を白色化(横)');
    canvas.fill('#000');
    drawStraightLines('vertical', verticalStraightLines);
    canvas.debugImage('ピクセルが無変化な直線部を白色化(縦)');
    canvas.fill('#000');
    drawStraightLines('vertical', verticalStraightLines);
    canvas.debugImage('ピクセルが無変化な直線部を白色化(縦+横)');
  }
  
  var slipValueRate = 15;
  var slipValueW = Math.floor(w * slipValueRate / 100);
  var slipValueH = Math.floor(h * slipValueRate / 100);
  var [doubtfulXs, doubtfulStartXs, doubtfulEndXs] = 
    getDoubtfulPoints('vertical', verticalStraightLines, slipValueW);
  var [doubtfulYs, doubtfulStartYs, doubtfulEndYs] = 
    getDoubtfulPoints('horizontal', horizontalStraightLines, slipValueH);
  if (isDebugMode) {
    drawDoubtfulPoints('vertical', doubtfulStartXs, '#f0f');
    drawDoubtfulPoints('horizontal', doubtfulStartYs, '#f0f');
    drawDoubtfulPoints('vertical', doubtfulEndXs, '#f00');
    drawDoubtfulPoints('horizontal', doubtfulEndYs, '#f00');
    canvas.debugImage('怪しい輪郭部を赤色の直線で表示');
  }
    
  var doubtfulRects = getDoubtfulRects(doubtfulXs, doubtfulYs);
  if (isDebugMode) {
    drawDoubtfulRects(doubtfulRects);
    canvas.debugImage('怪しい矩形を表示（青色）');
  }
  
  var narrowDownNum = 3;
  var narrowDownedRects = narrowDownDoubtfulRects(doubtfulRects);
  if (isDebugMode) {
    drawDoubtfulRects(narrowDownedRects, 'hsl(120, 100%, 70%)');
    canvas.debugImage('怪しい矩形を絞り込む（緑色）');
    console.log(narrowDownedRects);
  }
  
  var widenedRects = widenDoubtfulRects(doubtfulRects, doubtfulStartXs,
    doubtfulEndXs, doubtfulStartYs, doubtfulEndYs);
  var bestRect = widenedRects[0];
    
  if (isDebugMode) {
    canvas.ctx.globalAlpha = '0.8';
    canvas.ctx.fillStyle = '#ff0';
    canvas.ctx.fillRect(bestRect.x, bestRect.y, bestRect.w, bestRect.h);
    canvas.ctx.globalAlpha = '1';
    canvas.debugImage('ゲーム画面と思われる領域（黄色）');
    
    canvas.ctx.drawImage(ssImage, 0, 0, w, h);
    canvas.ctx.globalAlpha = '0.4';
    canvas.ctx.fillStyle = '#ff0';
    canvas.ctx.fillRect(bestRect.x, bestRect.y, bestRect.w, bestRect.h);
    canvas.ctx.globalAlpha = '1';
    canvas.debugImage('元画像に重ねる');
  }
  
  if (bestRect) {
    canvas6.width = 1280;
    canvas6.height = 720;
    canvas6.ctx.drawImage(ssImage, bestRect.x, bestRect.y, bestRect.w, bestRect.h,
      0, 0, 1280, 720);
    console.log('trimed the game screen');
    console.log('the game screen is (x, y, w, h) = (' +
      bestRect.x + ', ' + bestRect.y + ', ' + bestRect.w + ', ' + bestRect.h + ')');
    if (typeof success === 'function') success(canvas6, true);
  } else {
    console.log('sorry, trimming failed');
    if (typeof error === 'function') error();
  }
  return;
  
  /*
   * getStraightLines(direction)
   */
  function getStraightLines(direction) {
    var isVertical = (direction === 'vertical');
    var _w, _h, w = canvas.width, h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    var imagedata = canvas.ctx.getImageData(0, 0, w, h);
    var x, y, k, r, g, b;
    var straightLines = createInt16Array(recordNum * _w * linePropertiesNum);
    for (x = 0; x < _w; x++) {
      var _r = -1, _g = -1, _b = -1;
      var whiteStart = 0;
      var whiteLength = 0;
      var maxWhiteStarts = createArray(recordNum, 0);
      var maxWhiteLengths = createArray(recordNum, 0);
      var maxWhiteStart = 0;
      var maxWhiteLength = 0;
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
      for (var j = 0; j < recordNum; j++) {
        straightLines[0 + (x * recordNum + j) * linePropertiesNum] = maxWhiteStarts[j];
        straightLines[1 + (x * recordNum + j) * linePropertiesNum] = maxWhiteLengths[j];
      }
    }
    return straightLines;
    
    function update() {
      for (var i = 0; i < recordNum; i++) {
        if (whiteLength > maxWhiteLengths[i]) {
          for (var j = i; j + 1 < recordNum; j++) {
            maxWhiteLengths[j + 1] = maxWhiteLengths[j];
            maxWhiteStarts[j + 1] = maxWhiteStarts[j];
          }
          maxWhiteLengths[i] = whiteLength;
          maxWhiteStarts[i] = whiteStart;
          break;
        }
      };
      whiteLength = 0;
      whiteStart = y + 1;
    }
  }
  
  /*
   * drawStraightLines(direction, data)
   */
  function drawStraightLines(direction, data) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.ctx.fillStyle = '#fff';
    canvas.ctx.globalAlpha = '1';
    var isVertical = (direction === 'vertical');
    var _w, _h, w = canvas.width, h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    for (var i = 0; i < _w; i++) {
      for (var j = 0; j < recordNum; j++) {
        var start  = data[0 + (i * recordNum + j) * linePropertiesNum];
        var length = data[1 + (i * recordNum + j) * linePropertiesNum];
        if (j === 0) canvas.ctx.fillStyle = '#fff';
        else canvas.ctx.fillStyle = '#eee';
        if (isVertical) canvas.ctx.fillRect(i, start, 1, length);
        else canvas.ctx.fillRect(start, i, length, 1);
      }
    }
  }
  
  /*
   * getDoubtfulPoints(direction, data, slipValue)
   */
  function getDoubtfulPoints(direction, data, slipValue) {
    var isVertical = (direction === 'vertical');
    var _w, _h, w = canvas.width, h = canvas.height;
    if (isVertical) { _w = w; _h = h; } else { _w = h; _h = w; }
    var doubtfulPoints = [-1]
    var doubtfulStartPoints = [-1];
    var doubtfulEndPoints = [];
    var _length;
    var dataLength = data.length / (linePropertiesNum * recordNum);
    for (var i = 0; i < dataLength; i++) {
      var length = 0;
      for (var j = 0; j < recordNum; j++) {
        length += data[1 + (i * recordNum + j) * linePropertiesNum];
      }
      if (i > 0 && Math.abs(length - _length) > slipValue) {
        var p = {};
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
  }
  
  /*
   * drawDoubtfulPoints(direction, color)
   */
  function drawDoubtfulPoints(direction, points, color) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.ctx.fillStyle = color;
    canvas.ctx.globalAlpha = '1';
    var isVertical = (direction === 'vertical');
    if (isVertical) {
      _w = w; _h = h;
    } else {
      _w = h; _h = w;
    }
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      if (isVertical) canvas.ctx.fillRect(p, 0, 1, _w);
      else canvas.ctx.fillRect(0, p, _h, 1);
    }
  }
  
  /*
   * getDoubtfulRects(Xs, Ys)
   */
  function getDoubtfulRects(Xs, Ys) {
    var doubtfulRects = [];
    var minRectWidth = Math.floor(w * 0.05);
    var minRectHeight = Math.floor(h * 0.05);
    for (var i = 0; i + 1 < Xs.length; i++) {
      var x1 = Xs[i + 0] + 1;
      var x2 = Xs[i + 1];
      var rw = x2 - x1;
      if (rw > minRectWidth) {
        for (var j = 0; j + 1 < Ys.length; j++) {
          var y1 = doubtfulYs[j + 0] + 1;
          var y2 = doubtfulYs[j + 1];
          var rh = y2 - y1;
          if (rh > minRectHeight) {
            doubtfulRects.push({
              x: x1, y: y1, w: rw, h: rh, s: rw * rh
            });
          }
        }
      }
    }
    doubtfulRects.sort(function(a, b) {
      if (a.s > b.s) return -1;
      else return 1;
    });
    return doubtfulRects;
  }
  
  /*
   * drawDoubtfulRects(rects)
   */
  function drawDoubtfulRects(rects, color) {
    canvas.ctx.globalCompositeOperation = 'source-over';
    if (color) {
      canvas.ctx.globalAlpha = '0.7';
      canvas.ctx.fillStyle = color;
    } else {
      canvas.ctx.globalAlpha = '0.5';
      canvas.ctx.fillStyle = 'hsl(220, 50%, 50%)';
    
    }
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      canvas.ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    canvas.ctx.globalAlpha = '1';
  }
  
  /*
   * narrowDownDoubtfulRects(rects)
   */
  function narrowDownDoubtfulRects(rects) {
    narrowDownNum = Math.min(rects.length, narrowDownNum);
    var targetRects = [];
    for (var i = 0; i < rects.length; i++) {
      var rect = rects[i];
      var isUnique = true;
      for (var j = 0; j < targetRects.length; j++) {
        var tRect = targetRects[j];
        var f1 = (tRect.x === rect.x && tRect.w === rect.w);
        var f2 = (tRect.y === rect.y && tRect.h === rect.h);
        if (f1 || f2) {
          isUnique = false;
          break;
        }
      }
      if (isUnique) {
        targetRects.push(rect);
      }
      if (targetRects.length >= narrowDownNum) {
        break;
      }
    }
    return targetRects;
  }
  
  /*
   * widenDoubtfulRects(rects, startXs, endXs, startYs, endYs)
   */
  function widenDoubtfulRects(rects, startXs, endXs, startYs, endYs) {
    var w = canvas.width, h = canvas.height;
    var minRectWidth = Math.floor(w * 0.05);
    var minRectHeight = Math.floor(h * 0.05);
    var newRects = [];
    for (i = 0; i < rects.length; i++) {
      var rect = rects[i];
      newRects.push(rect);
      widen(true, newRects, rect, startXs, endXs);
      widen(false, newRects, rect, startYs, endYs);
    }
    calc(newRects);
    sort(newRects);
    return newRects;
    
    function sort(rects) {
      rects.sort(function(a, b) {
        if (a.score > b.score) return -1;
        else return 1;
      });
    }
    function calc(rects) {
      var targetRatio = 9 / 16;
      rects.forEach(rect => {
        var ratio = rect.h / rect.w;
        var difRatio = Math.abs(targetRatio - ratio);
        if (ratio < targetRatio) difRatio = difRatio * 2;
        /*
        var vMax = -1;
        for (var x = rect.x, xEnd = rect.x + rect.w; x < xEnd; x++) {
          var _v = vLines[1 + (x * recordNum * linePropertiesNum)];
          if (_v > vMax) vMax = _v;
        }
        var hMax = -1;
        for (var y = rect.y, yEnd = rect.y + rect.h; y < yEnd; y++) {
          var _h = hLines[1 + (y * recordNum * linePropertiesNum)];
          if (_h > hMax) hMax = _h;
        }
        */
        rect.score = (rect.w / w) - (difRatio * 100)
      });
    }
    function widen(doWidenX, rects, originRect, startPoints, endPoints) {
      for (var isp = 0; isp < startPoints.length; isp++) {
        var startPoint = startPoints[isp] + 1;
        for (var iep = 0; iep < endPoints.length; iep++) {
          var endPoint = endPoints[iep];
          var pointRange = endPoint - startPoint;
          var newRect;
          if (doWidenX) {
            newRect = {
              x: startPoint,
              y: originRect.y,
              w: pointRange,
              h: originRect.h,
              s: pointRange * originRect.h
            };
          } else {
            newRect = {
              x: originRect.x,
              y: startPoint,
              w: originRect.w,
              h: pointRange,
              s: pointRange * originRect.w
            };
          }
          if (newRect.w > minRectWidth && newRect.h > minRectHeight &&
              newRect.w > newRect.h && newRect.w < newRect.h * 2) {
            rects.push(newRect);
          }
        }
      }
    }
  }
  
  
}





/*
 * trimGameScreenByWave(ssImage, success, error)
** 
** ピクセルの揺らぎからゲーム画面の場所を推定する。
** ピクセルの揺らぎは、幅1pxの直線上を順に走査して、
** 隣り合うピクセルの色が違えば+1、同じなら+0していった時の和として計算する。
**
** ゲーム画面（レースのリザルトシーン）は、隣り合うピクセルの色が違うことがほとんど。
** 一方で、ゲーム画面の周囲（YouTubeのWebページの背景など）は同じ色が続くことが多い。
** したがって、ピクセルの揺らぎが大きく発生している縦横比16:9の部分があれば、
** そこがゲーム画面である可能性が高い。
**
** ただしゲーム画面の周囲もゲーム画面と同じ程度のピクセルの揺らぎを持つ場合、
** この方法は使えない。
*/
function trimGameScreenByWave(ssImage, success, error) {
  if (typeof ssImage === 'string')
    ssImage = document.querySelector(ssImage);
  
  console.log('trimming the game screen');
  var canvas = canvas5;
  var w = ssImage.naturalWidth;
  var h = ssImage.naturalHeight;
  console.info('the image is (w, h) = (' + w + ', ' + h + ')');
  canvas.init(w, h, ssImage);
  
  // 縦横方向それぞれについてゆらぎを計算し
  // ゆらぎを平均化した断層データを取得する
  var slipHeight, LRCheckRange, thornRange;
  var slipHeightRate  = 4.0 / 100;
  var LRCheckRangeRate = 5.0 / 100;
  var thornRangeRate   = 0.5 / 100;
  
  console.log('* 水平方向の波を計算しています...');
  slipHeight = w * slipHeightRate;
  LRCheckRange = w * LRCheckRangeRate;
  thornRange = h * thornRangeRate;
  var horizontalWaveHeights = getWaveHeights('horizontal');
  var equalizedHWHData = getEqualizedData(horizontalWaveHeights, slipHeight, LRCheckRange);
  pluckThornOut(equalizedHWHData, thornRange, true, 1.5);
  pluckThornOut(equalizedHWHData, thornRange * 20, false, 4);
  pluckThornOut(equalizedHWHData, thornRange * 20, false, 4);
  pluckThornOut(equalizedHWHData, thornRange * 20, false, 4);
  console.log('* done.');
  
  console.log('* 垂直方向の波を計算しています...');
  slipHeight = h * slipHeightRate;
  LRCheckRange = h * LRCheckRangeRate;
  thornRange = w * thornRangeRate;
  var verticalWaveHeights = getWaveHeights('vertical');
  var equalizedVWHData = getEqualizedData(verticalWaveHeights, slipHeight, LRCheckRange);
  pluckThornOut(equalizedVWHData, thornRange, true, 1.5);
  pluckThornOut(equalizedVWHData, thornRange * 20, false, 4);
  pluckThornOut(equalizedVWHData, thornRange * 20, false, 4);
  pluckThornOut(equalizedVWHData, thornRange * 20, false, 4);
  console.log('* done.');
  
  // 断層の幅が長い順になるように並び替える
  var sortFunc = function(a, b) {
    if (a.length > b.length) return -1;
    else return 1;
  };
  equalizedHWHData.sort(sortFunc);
  equalizedVWHData.sort(sortFunc);
  
  // 縦横それぞれの断層を組み合わせて
  // 最もゲーム画面っぽくなるものを選ぶ
  var targetRatio = 16 / 9;
  var bestRects = [];
  equalizedVWHData.forEach(vdata => {
    var width = vdata.length;
    var bestRect = {wp: width / w};
    var bestDistance = 999;
    equalizedHWHData.forEach(hdata => {
      var height = hdata.length;
      var ratio = width / height;
      // dv: 縦横方向でのゆらぎの大きさの差
      // dr: 縦横比16:9との差
      // dv も dr も、ゲーム画面ならほとんど0に近くなるはず
      var dv = Math.abs(hdata.value / w - vdata.value / h);
      var dr = Math.abs(targetRatio - ratio);
      var distance = dv + dr;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestRect.x = vdata.start;
        bestRect.y = hdata.start;
        bestRect.w = width;
        bestRect.h = height;
        bestRect.dr = dr;
        bestRect.v = (hdata.value / w + vdata.value / h) / 2;
      }
    });
    if (bestRect.w > 100 && bestRect.h > 100) {
      bestRects.push(bestRect);
    }
  });
  if (bestRects.length === 0) {
    bestRects.push({x: 0, y: 0, w: w, h: h});
  }
  
  var bestRect = bestRects[0];
  if (bestRects.length >= 2) {
    var bestScore = -999;
    bestRects.forEach(rect => {
      var score = rect.wp + rect.v - rect.dr;
      if (score > bestScore) {
        bestScore = score;
        bestRect = rect;
      }
    });
  }
  
  if (isDebugMode) {
    console.log('* デバッグ用のデータを出力しています...');
    
    canvas.ctx.clear();
    canvas.ctx.drawImage(ssImage, 0, 0);
    canvas.ctx.globalCompositeOperation = 'lighter';
    var equalizedHWHs = createEqualizedWaveHeights(equalizedHWHData);
    canvas.ctx.globalAlpha = '0.7';
    canvas.ctx.fillStyle = '#f0f';
    horizontalWaveHeights.forEach((waveHeight, i) => {
      var w = waveHeight;
      canvas.ctx.fillRect(0, i, w, 1);
    });
    canvas.ctx.fillStyle = '#0ff';
    equalizedHWHs.forEach((waveHeight, i) => {
      var w = waveHeight;
      canvas.ctx.fillRect(0, i, w, 1);
    });
    canvas.ctx.globalAlpha = '1';
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.debugImage('水平方向のゆらぎ');
    
    canvas.ctx.clear();
    canvas.ctx.drawImage(ssImage, 0, 0);
    canvas.ctx.globalCompositeOperation = 'lighter';
    var equalizedVWHs = createEqualizedWaveHeights(equalizedVWHData);
    canvas.ctx.globalAlpha = '0.7';
    canvas.ctx.fillStyle = '#f0f';
    verticalWaveHeights.forEach((waveHeight, i) => {
      var h = waveHeight;
      canvas.ctx.fillRect(i, 0, 1, h);
    });
    canvas.ctx.fillStyle = '#0ff';
    equalizedVWHs.forEach((waveHeight, i) => {
      var h = waveHeight;
      canvas.ctx.fillRect(i, 0, 1, h);
    });
    canvas.ctx.globalAlpha = '1';
    canvas.ctx.globalCompositeOperation = 'source-over';
    canvas.debugImage('垂直方向のゆらぎ');
    
    canvas.ctx.clear();
    canvas.ctx.drawImage(ssImage, 0, 0);
    canvas.ctx.globalAlpha = '0.7';
    bestRects.forEach(rect => {
      var color = (rect === bestRect) ? '#0ff' : '#f0f'
      canvas.ctx.fillStyle = color;
      canvas.ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    });
    canvas.ctx.globalAlpha = '1';
    canvas.debugImage('ゲーム画面領域');
    
    console.log('* done.');
  }
  
  canvas6.width = 1280;
  canvas6.height = 720;
  canvas6.ctx.drawImage(ssImage, bestRect.x, bestRect.y, bestRect.w, bestRect.h,
    0, 0, 1280, 720);
  console.log('trimed the game screen');
  console.log('the game screen is (x, y, w, h) = (' +
    bestRect.x + ', ' + bestRect.y + ', ' + bestRect.w + ', ' + bestRect.h + ')');
  if (typeof success === 'function') success(canvas6, true);
  return;
  
  /*
   * getWaveHeights(direction)
   */
  function getWaveHeights(direction) {
    console.log('* * 波の基礎データを計算しています...');
    var isVertical = (direction === 'vertical');
    var _w, w = canvas.width;
    var _h, h = canvas.height;
    if (isVertical) {
      _w = w; _h = h;
    } else {
      _w = h; _h = w;
    }
    var imagedata = canvas.ctx.getImageData(0, 0, w, h);
    var i = 0, x, y, k, r, g, b, _r = -1, _g = -1, _b = -1;
    var waveHeights = createInt16Array(_w);
    var waveHeightMax = -1;
    for (x = 0; x < _w; x++) {
      var whiteLen = 0;
      var maxWhiteLen = 0;
      var whiteLenSum = 0;
      var waveHeight = 0;
      for (y = 0; y < _h; y++) {
        k = (isVertical) ? (x + y * w) : (y + x * w);
        k = k * 4;
        r = imagedata.data[k + 0];
        g = imagedata.data[k + 1];
        b = imagedata.data[k + 2];
        if (r === _r && g === _g && b === _b) {
          whiteLen++;
          if (isDebugMode) {
            imagedata.data[k + 0] = 255;
            imagedata.data[k + 1] = 255;
            imagedata.data[k + 2] = 255;
          }
        } else {
          if (whiteLen > maxWhiteLen) {
            if (maxWhiteLen > w * 0.05) whiteLenSum += maxWhiteLen;
            maxWhiteLen = whiteLen;
          }
          whiteLen = 0;
          waveHeight += 1;
          if (isDebugMode) {
            imagedata.data[k + 0] = 0;
            imagedata.data[k + 1] = 0;
            imagedata.data[k + 2] = 0;
          }
        }
        _r = r;
        _g = g;
        _b = b;
      }
      if (whiteLen > maxWhiteLen) {
        if (maxWhiteLen > w * 0.05) whiteLenSum += maxWhiteLen;
        maxWhiteLen = whiteLen;
      }
      if (waveHeight > waveHeightMax) {
        waveHeightMax = waveHeight;
      }
      waveHeight = waveHeight + 0.3 * _w - 0.5 * (maxWhiteLen + whiteLenSum);
      waveHeight = Math.max(0, Math.floor(waveHeight));
      waveHeights[i] = waveHeight;
      i++;
    }
    canvas.debugImage('ゆらぎの計算結果', imagedata);
    console.log('* * done.');
    return waveHeights;
  }
  
  /*
   * getEqualizedData(waveHeights, slipHeight, LRCheckRange)
   */
  function getEqualizedData(waveHeights, slipHeight, LRCheckRange) {
    console.log('* * 波の断層データを計算しています...');
    var equalizedData = [];
    var averageStart = 0;
    var averageSum = 0;
    var averageLen = 0;
    var _waveHeight = 0;
    waveHeights.forEach((waveHeight, i) => {
      // ひとつ前の波の高さとの差がpより大きければ、そこに断層がある疑いアリ
      if (i > 0 && Math.abs(waveHeight - _waveHeight) > slipHeight) {
        var beforeFaultIndex;
        if (equalizedData.length > 0) {
          beforeFaultIndex = equalizedData[equalizedData.length - 1].start;
        } else {
          beforeFaultIndex = 0;
        }
        if (isDifferentLRAverage(waveHeights, i, beforeFaultIndex)) {
          pushEqualizedData(i);
        }
      }
      averageSum += waveHeight;
      averageLen += 1;
      _waveHeight = waveHeight;
    });
    pushEqualizedData(0);
    console.log('* * done.');
    return equalizedData;
    
    function pushEqualizedData(i) {
      equalizedData.push({
        start: averageStart,
        length: averageLen,
        value: (averageSum / averageLen)|0
      });
      averageStart = i;
      averageSum = 0;
      averageLen = 0;
    }
    
    function isDifferentLRAverage(waveHeights, index, beforeFaultIndex) {
      var differentRatio = 1.5;
      LRCheckRange = Math.max(1, LRCheckRange);
      var i, sum, len, avgl, avgr;
      sum = len = 0;
      for (i = index - 1; i > index - 1 - LRCheckRange; ) {
        sum += waveHeights[i];
        len++;
        i--;
        if (i < 0 || i < beforeFaultIndex) {
          break;
        }
      }
      avgl = sum / len;
      sum = len = 0;
      for (i = index + 1; i < index + 1 + LRCheckRange; ) {
        sum += waveHeights[i];
        len++;
        i++;
        if (i >= waveHeights.length) {
          break;
        }
      }
      avgr = sum / len;
      var ratio = getRatio(avgl, avgr);
      if (ratio > differentRatio) return true;
      return false;
    }
  }
  
  /*
   * pluckThornOut(equalizedData, isTripleMarge, differentRatio)
   */
  function pluckThornOut(equalizedData, thornRange, isTripleMarge, differentRatio) {
    console.log('* * 外れ断層の処理を行っています...');
    thornRange = Math.max(1, thornRange);
    if (equalizedData.length >= 2) {
      for (var iData = 0; iData < equalizedData.length; iData++) {
        var data = equalizedData[iData];
        // 断層の幅がq以下なら
        if (0 < iData && iData < equalizedData.length - 1 &&
            0 < data.length && data.length < thornRange) {
          var target1 = equalizedData[iData - 1];
          var target2 = equalizedData[iData + 1];
          var sumlen = 0, caseType = 0;
          // 前の断層と後の断層を比べる
          // caseType 1: 前後の断層に差がある＋当該断層は「前」の断層に近い
          // caseType 2: 前後の断層に差がある＋当該断層は「後」の断層に近い
          // caseType 3: 前後の断層に差はない
          var val1 = target1.value;
          var val2 = target2.value;
          var ratio = getRatio(val1, val2);
          if (ratio > differentRatio) {
            /*
            var dif1 = Math.abs(val1 - data.value);
            var dif2 = Math.abs(val2 - data.value);
            caseType = (dif1 < dif2) ? 1 : 2;
            */
            var sumlen1 = target1.length + data.length;
            var sumlen2 = target2.length + data.length;
            var datavl = data.value * data.length;
            var height1 = (target1.value * target1.length + datavl) / sumlen1;
            var height2 = (target2.value * target2.length + datavl) / sumlen2;
            var ratio1 = getRatio(data.value, height1);
            var ratio2 = getRatio(data.value, height2);
            caseType = (ratio1 < ratio2) ? 1 : 2;
          } else {
            if (isTripleMarge) caseType = 3;
            else caseType = 0;
          }
          switch (caseType) {
          // 前の断層に吸収される
          case 1:
            sumlen = target1.length + data.length;
            target1.value =
                target1.value * target1.length / sumlen
              +   data.value *   data.length / sumlen;
            target1.length = sumlen;
            equalizedData.splice(iData, 1);
            iData--;
            break;
          // 次の断層に吸収される
          case 2:
            sumlen = target2.length + data.length;
            target2.value =
                target2.value * target2.length / sumlen
              +   data.value *   data.length / sumlen;
            target2.start = data.start;
            target2.length = sumlen;
            equalizedData.splice(iData, 1);
            iData--;
            break;
          // 前後の断層に吸収される
          case 3:
            target1 = equalizedData[iData - 1];
            target2 = equalizedData[iData + 1];
            sumlen = target1.length + data.length + target2.length;
            target1.value =
                target1.value * target1.length / sumlen
              +    data.value *    data.length / sumlen
              + target2.value * target2.length / sumlen;
            target1.length = sumlen;
            equalizedData.splice(iData, 2);
            iData--;
            break;
          }
        }
      }
      var _equalizedData = [];
      equalizedData.forEach(data => {
        if (data.length > 0) _equalizedData.push(data);
      });
      equalizedData = _equalizedData;
    }
    console.log('* * done.');
    return;
  }
  
  /*
   * createEqualizedWaveHeights(equalizedData)
   */
  function createEqualizedWaveHeights(equalizedData) {
    var waveHeights = [];
    equalizedData.forEach(data => {
      for (var i = 0; i < data.length; i++) {
        waveHeights[data.start + i] = data.value;
      }
    });
    return waveHeights;
  }
}

/*
 * trimGameScreenByYellowZone(ssImage, success, error)
** 
** スクリーンショット上にある「黄色いゾーン」からゲーム画面を推定する。
**
** マリオカート8DXのレースリザルト画面では、自分の順位が黄色く強調されている。
** したがって、スクリーンショット上の黄色い部分を探索して、
** 得られた矩形のデータからゲーム画面の位置や大きさを推定することができる。
** 
** ただし、リザルト画面に自分の順位以外の黄色いもの（例: ワリオの帽子など）が映りこんでいて、
** しかもそれが自分の順位部分に繋がっている場合、
** 順位部分の矩形を正しく認識できず、この方法は使えない。
*/
function trimGameScreenByYellowZone(ssImage, success, error) {
  if (typeof ssImage === 'string')
    ssImage = document.querySelector(ssImage);
  
  console.log('trimming the game screen');
  var canvas = canvas5;
  var w = ssImage.naturalWidth;
  var h = ssImage.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  // スクリーンショットを焼き付けてくっきりさせる
  canvas.ctx.burnImage(ssImage, 0, 0);
  canvas.debugImage('画像の焼き付け', imagedata);
  console.info('the image is (w, h) = (' + w + ', ' + h + ')');
  
  // 黄色いところを #ff0 そうでないところを #000 で2値化
  var imagedata = canvas.ctx.getImageData(0, 0, w, h);
  var x, y, k, r, g, b, d, p;
  for (y = 0; y < h; y++) {
    for (x = 0; x < w; x++) {
      k = 4 * (x + y * w);
      r = imagedata.data[k + 0];
      g = imagedata.data[k + 1];
      b = imagedata.data[k + 2];
      p = 30;
      d = 510 - r - g + b;
      //d = Math.abs(220 - r) + Math.abs(220 - g) + Math.abs(40 - b);
      if (d < p) {
        r = 255; g = 255; b = 0;
      } else {
        r = 0; g = 0; b = 0;
      }
      imagedata.data[k + 0] = r;
      imagedata.data[k + 1] = g;
      imagedata.data[k + 2] = b;
    }
  }
  // 黒と黄色で2値化した時点のimagedata
  canvas.debugImage('黄色と黒の2値化', imagedata);
  
  // 全体をざっくり走査して、黄色い塊＝アメーバを抽出
  var amebas = [];
  for (y = 20; y < h; y += 20) {
    for (x = 50; x < w; x += 200) {
      var arr = runRecursive(search, x, y, []);
      if (arr.length > 1000) amebas.push({
        pixels: arr
      });
    }
  }
  // アメーバがひとつもなければそもそもゲーム画面が映っていない
  if (amebas.length === 0) {
    console.log('trimming failed');
    if (typeof error === 'function') error();
    return;
  }
  // アメーバを整理
  // ameba.pixelsにアメーバの全ピクセルの座標が入っている
  // それを単純なx, y, w, hの矩形データに変換する
  amebas.forEach((ameba, i) => {
    var minX = 9999, minY = 9999, maxX = -1, maxY = -1;
    ameba.pixels.forEach(pixel => {
      if (pixel.x < minX) minX = pixel.x;
      if (pixel.y < minY) minY = pixel.y;
      if (pixel.x > maxX) maxX = pixel.x;
      if (pixel.y > maxY) maxY = pixel.y;
    });
    ameba.id = i;
    ameba.x = minX;
    ameba.y = minY;
    ameba.w = maxX - minX;
    ameba.h = maxY - minY;
    ameba.r = ameba.w / ameba.h;
    ameba.d = Math.abs(14.5 - ameba.r);
    // rx, ry, rw, rh は順位の数字部分の矩形
    // あとで順位を読み取るときに使う
    ameba.rx = (ameba.x + ameba.h * 0.1)|0;
    ameba.ry = (ameba.y + ameba.h * 0.07)|0;
    ameba.rh = (ameba.h * 0.9)|0;
    ameba.rw = (ameba.h * 1.3)|0;
    delete ameba.pixels;
  });
  // 縦横比14.5からの距離が最も小さいものをベストアメーバとする
  amebas.sort(function(a,b){
    if (a.d < b.d) return -1;
    else return 1;
  });
  // アメーバの調整
  // 順位部分のワルイージの顔がアメーバを分断してしまうケースがあったのでその対策
  // 二つのアメーバを引っ付けて新アメーバを作ったら、
  // ベストアメーバよりも縦横比14.5に近づくのでは？ということを検査する
  var bestAmeba = amebas[0];
  if (bestAmeba.d > 0.5) {
    amebas.forEach(ameba => {
      if (bestAmeba.id !== ameba.id) {
        var newAmeba = {};
        var minX = Math.min(bestAmeba.x, ameba.x);
        var maxX = Math.max(bestAmeba.x + bestAmeba.w, ameba.x + ameba.w);
        var minY = Math.min(bestAmeba.y, ameba.y);
        var maxY = Math.max(bestAmeba.y + bestAmeba.h, ameba.y + ameba.h);
        newAmeba.x = minX;
        newAmeba.y = minY;
        newAmeba.w = maxX - minX;
        newAmeba.h = maxY - minY;
        newAmeba.r = newAmeba.w / newAmeba.h;
        newAmeba.d = Math.abs(14.5 - newAmeba.r);
        if (newAmeba.d < bestAmeba.d) {
          bestAmeba = newAmeba;
          bestAmeba.rx = (bestAmeba.x + bestAmeba.h * 0.1)|0;
          bestAmeba.ry = (bestAmeba.y + bestAmeba.h * 0.07)|0
          bestAmeba.rh = (bestAmeba.h * 0.9)|0
          bestAmeba.rw = (bestAmeba.h * 1.3)|0;
        }
      }
    });
  }
  console.info('yellow area is (x, y, w, h. w/h) = (' + bestAmeba.x + ', ' + bestAmeba.y +
    ', ' + bestAmeba.w + ', ' + bestAmeba.h + ', ' + bestAmeba.r.toFixed(2) + ')');
  canvas.debugImage('黄色部分の探索結果', imagedata);
  
  // リザルトの視点のプレイヤーの順位を読み取る
  console.log('recognizing this player\'s rank');
  return canvas.tesseract(function (ret) {
    var rank = parseInt(ret.text.replace(/[\n|\s]+/g, ''));
    rank = Math.min(12, Math.max(1, rank || 1));
    console.log(rank + '位.');
    var scale = bestAmeba.w / 722;
    var gameW = (1364 * scale)|0;
    var gameH = (gameW * 9/16)|0;
    var gameX = (bestAmeba.x - 585 * scale)|0;
    var gameY = (bestAmeba.y - ((50 + 610 * (rank - 1) / 11)) * scale)|0;
    console.log('trimed the game screen');
    console.info('the game screen is (x, y, w, h) = (' +
      gameX + ', ' + gameY + ', ' + gameW + ', ' + gameH + ')');
    canvas6.width = 1280;
    canvas6.height = 720;
    canvas6.ctx.drawImage(ssImage, gameX, gameY, gameW, gameH,
     0, 0, 1280, 720);
    if (typeof success === 'function') success(canvas6, true);
  });
  
  /*
   * isYellowXY(x, y)
   */
  function isYellowXY(x, y) {
    return (imagedata.data[4 * (x + y * w) + 0] > 0);
  }
  
  /*
   * isVisitedXY(x, y)
   */
  function isVisitedXY(x, y) {
    return (imagedata.data[4 * (x + y * w) + 2] > 0);
  }
  
  /*
   * serach(x, y, arr)
   * https://qiita.com/uhyo/items/21e2dc2b9b139473d859
   */
  function* search(x, y, arr) {
    if (isVisitedXY(x, y)) {
      return arr;
    }
    if (isYellowXY(x, y)) {
      imagedata.data[4 * (x + y * w) + 0] = 0;
      imagedata.data[4 * (x + y * w) + 1] = 255;
      imagedata.data[4 * (x + y * w) + 2] = 255;
    } else {
      imagedata.data[4 * (x + y * w) + 0] = 255;
      imagedata.data[4 * (x + y * w) + 1] = 0;
      imagedata.data[4 * (x + y * w) + 2] = 255;
      return arr;
    }
    arr.push({x: x, y: y});
    // 上下左右を探索
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx;
      const ny = y + dy;
      // はみ出したら次の方向へ
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
        continue;
      }
      // 再帰呼出しはyieldで行う
      arr = yield [nx, ny, arr];
    }
    return arr;
  }
  /*
   * runRecursive(func, ...args)
   * https://qiita.com/uhyo/items/21e2dc2b9b139473d859
   */
  function runRecursive(func, ...args) {
    // 最終結果を受け取るオブジェクトを用意
    const rootCaller = {
      lastReturnValue: null
    };
    // 自前のコールスタックを用意
    const callStack = [];
    // 最初の関数呼び出しを追加
    callStack.push({
      iterator: func(...args),
      lastReturnValue: null,
      caller: rootCaller
    });
    while (callStack.length > 0) {
      const stackFrame = callStack[callStack.length - 1];
      const { iterator, lastReturnValue, caller } = stackFrame;
      // 関数の実行を再開
      const { value, done } = iterator.next(lastReturnValue);
      if (done) {
        // 関数がreturnしたので親に返り値を記録
        caller.lastReturnValue = value;
        callStack.pop();
      } else {
        // 関数がyieldした（valueは再帰呼び出しの引数リスト）
        callStack.push({
          iterator: func(...value),
          lastReturnValue: null,
          caller: stackFrame
        });
      }
    }
    return rootCaller.lastReturnValue;
  }
}