//window.localStorage.clear();
//window.localStorage.setItem('mk8dx-sokuji', '{"teamNum":6,"raceNum":12,"teamNames":["おかし","たまげた","CCC","DDD","EEE","FFF"],"shortCutKeys":["o","t","c","d","e","f"],"tallyConfig":{"onBeforeUnload":false,"isEnabledComplement":true,"latestScore":true,"latestScoreDif":false,"latestCource":true,"totalScoreDif":true,"leftRaceNum":true,"currentRank":true,"targetDistance":true,"emphasisStr":"【】","emphasisStart":"【","emphasisEnd":"】","splitStr":"／","teamSplitStr":"／","passRank":2}}');
'use strict';
console.log('main.js is ver.0.3.2');
var SCORES = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
var browser = (() => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('msie') > -1
     || userAgent.indexOf('trident') > -1) {
    return 'ie';
  } if (userAgent.indexOf('edge') > -1) {
    return 'edge';
  } if (userAgent.indexOf('chrome') > -1) {
    return 'chrome';
  } if (userAgent.indexOf('safari') > -1) {
    return 'safari';
  } if (userAgent.indexOf('firefox') > -1) {
    return 'firefox';
  } if (userAgent.indexOf('opera') > -1) {
    return 'opera';
  }
  return 'other';
})();
var os = (() => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('iphone') > -1) {
    return 'iphone';
  } if (userAgent.indexOf('ipad') > -1) {
    return 'ipad';
  } if (userAgent.indexOf('android') > -1) {
    if (userAgent.indexOf('mobile') > -1) {
      return 'android';
    }
    return 'android';
  } if (userAgent.indexOf('windows') > -1) {
    return 'windows';
  } if (userAgent.indexOf('mac os x') > -1) {
    return 'mac';
  }
  return 'other';
})();
var isPC = (os === 'windows' || os === 'mac');
var isTouchDevice = ('ontouchstart' in window);
var mousedownEvent = isTouchDevice ? 'click' : 'mousedown';
var queries = (() => {
	var queryStr = window.location.search.slice(1);
			queries = {};
	if (!queryStr) {
		return queries;
	}
	queryStr.split('&').forEach(function(queryStr) {
		var queryArr = queryStr.split('=');
		if (queryArr[1]) {
			queries[queryArr[0]] = queryArr[1];
		}
		else {
			queries[queryArr[0]] = '';
		}
	});
	return queries;
})();
var isOverlay = (queries.overlay === '1');
var playerNum = 12;
var teamTableIndex = 10;
var scKeyIndex = 20;
var correctionIndex = 30;
var rankTableIndex = 40;
var correctionValues = [0, 0, 0, 0, 0, 0];
var teamMaxNum = 6;
var currentPen = -1;
var mouseChaser;
var penDown = false;
var rightDown = false;
var isCalculating = false;
var isInitialized = false;
var inputRankData;
var scanedNameData;
var sampleTeamData = null;
var storageKey = 'mk8dx-sokuji';
var saveTargetVariables = [
  'teamNum', 'raceNum', 'teamNames', 'shortCutKeys', 'tallyConfig', 'inputRankData', 'correctionValues'
];
var isEnabledSS = isPC;
var teamNum = 2;
var raceNum = 12;
var maxRaceNum = 12;
var maxPlayerNum = 12;
var teamNames = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF'];
var shortCutKeys = ['a', 'b', 'c', 'd', 'e', 'f'];
var tallyConfig = {
  onBeforeUnload: false,     // ページ遷移時警告
  isEnabledComplement: true, // 自動補完
  isEnabledSuggest: true, // 自動補完
  latestScore: true,     // 最新レースの得点
  latestScoreDif: true,  // 最新レースの点差
  latestCource: true,    // 最新レースのコース
  totalScore: true,      // 合計得点
  totalScoreDif: true,   // 合計得点の点差
  leftRaceNum: true,     // 残りレース数
  currentRank: true,     // 現在の順位
  targetDistance: true,  // 目標順位との距離
  winDetermine: true,    // 勝利確定
  emphasisStr: '【】',   // 強調文字
  emphasisStart: '',     // 強調開始
  emphasisEnd: '',       // 強調終了
  splitStr: '／',        // 区切り文字
  teamSplitStr: '／',    // チームの区切り文字
  passRank: 2            // 目標順位
};
var overlayWindow = null;

/** onbeforeunload()
 */
window.onbeforeunload = function() {
  if (overlayWindow) {
    overlayWindow.close();
  }
  return null;
};

/** onload()
 */
window.addEventListener('load', function(){
  if (isOverlay) {
    document.body.classList.add('overlay-mode');
  }
  logger.log('document loaded');
  logger.log('initializing mk8dx-sokuji');
  initInputDataVariable();  // inputData変数
  loadStorage();            // ロード
  setEventShowMore('#input-rank-description-show');   // 説明を見るボタン
  setEventShowMore('#input-rank-description-show-2'); // 説明を見るボタン
  if (!isEnabledSS) {
    document.querySelector('#input-rank-description-show-2').style.setProperty('display', 'none');
  }
  makeRadioButtons();         // ラジオボタン
  updateInputTeamNameTable(); // チーム名入力テーブル
  makeMouseChaser();          // マウスチェイサー
  makeZoomImage();            // 通知関数や画像ズーム関数
  initConfigElements();       // 表示設定を初期化
  isInitialized = true;       // フラグをtrue
  // リセットボタン
  document.getElementById('reset-button').onclick = () => {
    if (isOverlay) {
      my_alert({
        title: '入力内容のリセット',
        message: '順位テーブルと点数補正をリセットします。よろしいですか？',
        ok: reset
      });
    } else {
      if (window.confirm('順位テーブルと点数補正をリセットします。よろしいですか？')) {
        reset();
      }
    }
    function reset() {
      sampleTeamData = null;
      initInputDataVariable();
      correctionValues = [0, 0, 0, 0, 0, 0];
      updateInputTeamNameTable();
      setSaveStorage();
    }
  };
  // オーバーレイボタン
  document.getElementById('overlay-button').onclick = () => {
    if (overlayWindow) {
      overlayWindow.close();
    }
    setTimeout(() => {
      overlayWindow = window.open('./overlay.html', 'overlay', 'width=840,height=160');
      setTimeout(() => {
        overlayWindow.document.querySelectorAll('.overlay-container').forEach($container => {
          $container.style.setProperty('display', 'none');
        });
        overlayWindow.document.querySelectorAll(`#team-num-${teamNum}`).forEach($container => {
          $container.style.setProperty('display', 'flex');
        });
        tallyForScores();
      }, 300);
    }, 300);
  };
  // タッチによる拡大の無効化
  // https://qiita.com/peutes/items/d74e5758a36478fbc039
  if (isTouchDevice) {
    var lastTouch = 0;
    document.getElementById('input-rank-area').addEventListener('touchend', event => {
      const now = window.performance.now();
      if (now - lastTouch <= 500) {
        event.preventDefault();
      }
      lastTouch = now;
    }, true);
    document.getElementById('input-rank-area').setAttribute('user-scalable', 'no');
  }
  logger.log('initialized mk8dx-sokuji');
}, false);

/** initConfigElements()
 */
function initConfigElements() {
  [
    {key: 'isEnabledComplement', id: 'cfg-auto-complement'},
    {key: 'latestScore',         id: 'cfg-latest-score'},
    {key: 'latestScoreDif',      id: 'cfg-latest-score-dif'},
    {key: 'totalScore',          id: 'cfg-total-score'},
    {key: 'totalScoreDif',       id: 'cfg-total-score-dif'},
    {key: 'latestCource',        id: 'cfg-latest-course'},
    {key: 'leftRaceNum',         id: 'cfg-left-race-num'},
    {key: 'currentRank',         id: 'cfg-current-rank'},
    {key: 'targetDistance',      id: 'cfg-target-distance'},
    {key: 'winDetermine',        id: 'cfg-win-determine'},
    {key: 'onBeforeUnload',      id: 'cfg-on-before-unload'},
    {key: 'isEnabledSuggest',    id: 'cfg-course-suggest'},
  ].map(obj => {
    var elm = document.getElementById(obj.id);
    if (tallyConfig[obj.key] === true) {
      elm.setAttribute('checked', 'checked');
      if (obj.key === 'onBeforeUnload') {
        window.onbeforeunload = function() {
          if (overlayWindow) {
            overlayWindow.close();
          }
          return '本当に他のページに移動しますか?';
        };
      }
    }
    elm.addEventListener('change', function(e) {
      tallyConfig[obj.key] = this.checked;
      setSaveStorage();
      if (this.id === 'cfg-on-before-unload') {
        if (this.checked) {
          window.onbeforeunload = function() {
            if (overlayWindow) {
              overlayWindow.close();
            }
            return '本当に他のページに移動しますか?';
          };
        } else {
          window.onbeforeunload = function() {
            if (overlayWindow) {
              overlayWindow.close();
            }
            return null;
          };
        }
      }
      if (this.id === 'cfg-course-suggest') {
        makeInputRankTable();
      } else { 
        tallyForScores();
      }
    }, false);
  });
  [
    {key: 'passRank',     className: 'cfg-pass-rank'},
    {key: 'teamSplitStr', className: 'cfg-team-split'},
    {key: 'splitStr',     className: 'cfg-split'},
    {key: 'emphasisStr',  className: 'cfg-emphasis'}
  ].map(obj => {
    var elms = document.querySelectorAll('[name=' + obj.className + ']');
    for (var i = 0; i < elms.length; i++) {
      var elm = elms[i];
      if (('' + tallyConfig[obj.key]) === elm.getAttribute('value')) {
        elm.setAttribute('checked', 'checked');
      }
      elm.addEventListener('change', function(e) {
        tallyConfig[obj.key] = this.value;
        tallyConfig.passRank = parseInt(tallyConfig.passRank);
        tallyForScores();
        setSaveStorage();
      });
    }
  });
  updatePassRank();
  document.getElementById('copy-button').addEventListener(mousedownEvent, function(e) {
    execCopyResult();
  });
}

/** initInputDataVariable()
 */
function initInputDataVariable() {
  inputRankData = [];
  scanedNameData = [];
  for (var i = 0; i < maxRaceNum; i++) {
    inputRankData[i] = [];
    scanedNameData[i] = [];
    for (var j = 0; j < maxPlayerNum; j++) {
      inputRankData[i][j] = '-1';
      scanedNameData[i][j] = null;
    }
  }
}

/** setEventShowMore(slc)
 */
function setEventShowMore(slc) {
  var showButton = document.querySelector(slc);
  var target = showButton.getAttribute('show');
  var targetElement = document.querySelector('#' + target);
  showButton.addEventListener(mousedownEvent, function(e) {
    if (targetElement.style.display !== 'none') {
      targetElement.style.display = 'none';
      this.textContent = this.getAttribute('text1');
    } else {
      targetElement.style.display = 'block';
      this.textContent = this.getAttribute('text2');
    }
  });
  showButton.textContent = showButton.getAttribute('text1');
}

/** makeRadioButtons()
 * ◎ レース数を選択するラジオボタン
 * ◎ チーム数を選択するラジオボタン
 * をメイクします。
 */
function makeRadioButtons() {
  setEventAll('.race-num-radio', 'raceNum');
  setEventAll('.race-type-radio', 'teamNum');
  return;
  /** setEventAll(selector, key)
   */
  function setEventAll(selector, key) {
    // それぞれのラジオボタンについてsetEventOneを呼び出す
    var radios = document.querySelectorAll(selector);
    for (var i = 0; i < radios.length; i++) {
      var radio = radios[i];
      setEventOne(radio, key);
    }
  }
  /** setEventOne(radio, key)
   */
  function setEventOne(radio, key) {
    // ラジオボタンが選択されたとき
    radio.addEventListener('change', function(e) {
      // その値でグローバル変数を上書きする
      var value = parseInt(this.value);
      if (window[key] !== value) {
        window[key] = value;
        // チーム名入力テーブルをアップデートする
        updateInputTeamNameTable();
      }
    });
    // 初期選択値の設定
    if (window[key] === parseInt(radio.value)) {
      radio.setAttribute('checked', 'checked');
    }
  }
}

/** [メモ] この関数を通過するとなぜかコピー不能バグが直る */
/** updateInputTeamNameTable()
 * チーム数やレース数を変更したときに呼ばれ、
 * ◎ チーム名/ショートカットキー/補正値の入力テーブル
 * ◎ チームパレット
 * ◎ 順位テーブル
 * ◎ 目標順位選択ボタン
 * を作り直します。
 */
function updateInputTeamNameTable() {
  logger.log('change race num / team num');
  makeInputTeamNameTable(); // チーム名/ショートカットキー/補正値の入力テーブルをメイクする
  makeInputRankPalette();   // チームパレットをメイクする
  makeInputRankTable();     // 順位テーブルをメイクする
  updatePassRank();         // 目標順位選択ボタンを更新する
  // オーバーレイもアップデート
  if (overlayWindow) {
    setOverlayVisible(overlayWindow.document);
  }
  if (isOverlay) {
    setOverlayVisible(document);
  }
  if (overlayWindow || isOverlay) {
    tallyForScores();
  }
  return;
  /** setOverlayVisible(doc)
   */
  function setOverlayVisible(doc) {
    doc.querySelectorAll('.overlay-container').forEach($container => {
      $container.style.setProperty('display', 'none');
    });
    doc.querySelectorAll(`#team-num-${teamNum}`).forEach($container => {
      $container.style.setProperty('display', 'flex');
    });
  }
}

/** updatePassRank()
 * 目標順位（1位から5位までの要素がある）のうち、
 * 表示する必要のないものを非表示にします。
 * (たとえばフォーマンセル形式では3～5位は要らない)
 */
function updatePassRank() {
  var elms = document.querySelectorAll('.cfg-pass-rank');
  for (var i = 0; i < elms.length; i++) {
    var elm = elms[i];
    if (parseInt(elm.getAttribute('rank')) >= teamNum) {
      elm.style.display = 'none';
    } else {
      elm.style.display = 'inline';
    }
  }
}

/** makeInputTeamNameTable()
 * チーム名/ショートカットキー/補正値の入力テーブルを作ります。
 */
function makeInputTeamNameTable() {
  logger.log('making team name / sc key / correction table');
  // チーム名
  var table  = document.querySelector('#table-team-name');
  table.innerHTML = '';
  var w = teamNum;
  var tr = document.createElement('tr');
  for (var x = 0; x < w; x++) {
    var td = document.createElement('td');
    var label = ['A', 'B', 'C', 'D', 'E', 'F'][x];
    var input = createInput({placeholder: label, value: teamNames[x]});
    input.setAttribute('tabIndex', teamTableIndex + x);
    input.setAttribute('id', 'input-team-name-' + x);
    input.addEventListener('input', makeInputRankPalette, false);
    td.appendChild(input);
    tr.appendChild(td);
  }
  table.appendChild(tr);
  // ショートカットキー
  var table2 = document.querySelector('#table-sc-key');
  table2.innerHTML = '';
  tr = document.createElement('tr');
  for (x = 0; x < w; x++) {
    var td = document.createElement('td');
    var label = shortCutKeys[x];
    var input = createInput({placeholder: label, value: label, maxlength: '1'});
    input.setAttribute('tabIndex', scKeyIndex + x);
    input.setAttribute('id', 'input-sc-key' + x);
    input.addEventListener('input', updateSCKey, false);
    td.appendChild(input);
    tr.appendChild(td);
  }
  table2.appendChild(tr);
  // 補正値
  var table3 = document.querySelector('#table-correction');
  table3.innerHTML = '';
  tr = document.createElement('tr');
  for (x = 0; x < w; x++) {
    var td = document.createElement('td');
    var label = correctionValues[x];
    var input = createInput({placeholder: 0, value: label});
    input.setAttribute('tabIndex', correctionIndex + x);
    input.setAttribute('id', 'input-correction' + x);
    input.addEventListener('input', updateCorrection, false);
    td.appendChild(input);
    tr.appendChild(td);
  }
  table3.appendChild(tr);
}

/** updateCorrection()
 * correctionValuesを現在のinputの値で更新します。
 */
function updateCorrection() {
  var isChange = false;
  for (var i = 0; i < teamNum; i++) {
    var inpt = document.getElementById('input-correction' + i);
    var val = inpt.value;
    var isNumber1 = !isNaN(parseInt(val));
    var val1 = 
    // 全角→半角に変換
    val = val.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(
        s.charCodeAt(0) - 65248
      );
    }).replace('ー', '-').replace('－', '-');
    var isNumber2 = !isNaN(parseInt(val));
    if (isNumber2) {
      if (correctionValues[i] !== parseInt(val)) {
        isChange = true;
      }
      correctionValues[i] = parseInt(val);
      inpt.classList.remove('error');
    } else {
      if (correctionValues[i] !== 0) {
        isChange = true;
      }
      correctionValues[i] = 0;
      inpt.classList.add('error');
    }
  }
  if (isChange) {
    var $focus = document.activeElement;
    if ($focus) {
      var selectionEnd = $focus.selectionEnd;
      tallyForScores(() => {
        $focus.focus();
        if ($focus.tagName.toLowerCase() === 'input' && $focus.getAttribute('type') === 'text') {
          $focus.setSelectionRange(selectionEnd, selectionEnd);
        }
      });
    } else {
      tallyForScores();
    }
  }
  logger.log('update correction values ' + JSON.stringify(correctionValues));
  setSaveStorage();
}

/** updateSCKey()
 * shortCutKeysを現在のinputの値で更新します。
 */
function updateSCKey() {
  for (var i = 0; i < teamNum; i++) {
    var inpt = document.getElementById('input-sc-key' + i);
    var val = inpt.value;
    shortCutKeys[i] = val;
  }
  logger.log('update short cut keys ' + JSON.stringify(shortCutKeys));
  setSaveStorage();
}

/** makeInputRankPalette()
 * チームパレットをメイクします。
 */
function makeInputRankPalette() {
  logger.log('making team palette');
  updateTeamNameVariable(); // teamNamesを現在のinputの値で更新
  changeInputedTeamNames(); // 順位テーブルに入力済みのチーム名を更新
  regeneratePalette();      // チームパレットを生成
  updateOverlay();          // オーバーレイのチーム名を更新します
  setSaveStorage();         // セーブ
  return;
  /** updateTeamNameVariable()
   */
  function updateTeamNameVariable() {
    for (var i = 0; i < teamNum; i++) {
      var inpt = document.getElementById('input-team-name-' + i);
      var val = inpt.value;
      teamNames[i] = val;
    }
    logger.log('update team names ' + JSON.stringify(teamNames));
  }
  /** changeInputedTeamNames()
   */
  function changeInputedTeamNames() {
    for (var race = 1; race <= raceNum; race++) {
      for (var rank = 1; rank <= playerNum; rank++) {
        var inpt = document.body.querySelector('.rank-' + rank + '.race-' + race);
        if (inpt) {
          var team = parseInt(inpt.getAttribute('team'));
          if (team !== -1) {
            inpt.value = teamNames[team];
          }
        }
      }
    }
  }
  /** regeneratePalette()
   */
  function regeneratePalette() {
    var area = document.getElementById('input-rank-palette');
    area.innerHTML = '';
    for (var i = -1; i < teamNum + 1; i++) {
      var palette = document.createElement('div');
      var str;
      if (i < 0) {
        str = 'キー入力';
      } else if (i === teamNum) {
        str = '消す';
      } else {
        str = teamNames[i];
      }
      palette.innerHTML = '<p>' + str + '</p>';
      palette.setAttribute('id', 'palette-' + i);
      palette.setAttribute('team-index', i);
      if (i === teamNum) {
        palette.classList.add('team-' + teamMaxNum);
      } else {
        palette.classList.add('team-' + i);
      }
      // パレットクリック時の挙動
      setPaletteClickEvent(palette, i);
      area.appendChild(palette);
    }
    if (!isInitialized) {
      area.querySelector('#palette--1').classList.add('selected');
    }
  }
  /** setPaletteClickEvent(elm, i)
   */
  function setPaletteClickEvent(elm, i) {
    elm.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    }, false);
    elm.addEventListener(mousedownEvent, function (e) {
      selectPalette(i);
    }, false);
  }
  /** updateOverlay()
   */
  function updateOverlay() {
    if (overlayWindow || isOverlay) {
      var $focus = document.activeElement;
      if ($focus) {
        var selectionEnd = $focus.selectionEnd;
        tallyForScores(() => {
          $focus.focus();
          if ($focus.tagName.toLowerCase() === 'input' && $focus.getAttribute('type') === 'text') {
            $focus.setSelectionRange(selectionEnd, selectionEnd);
          }
        });
      } else {
        tallyForScores();
      }
    }
  }
}

/** selectPalette(i)
 */
function selectPalette(id) {
  var area = document.getElementById('input-rank-palette');
  // 全員のクラスを剥ぐ
  var i, children = area.getElementsByTagName('div');
  for (i = 0; i < children.length; i++)
    children[i].classList.remove('selected');
  // クラスを付与する
  var self = document.getElementById('palette-' + id);
  self.classList.add('selected');
  var idx = parseInt(self.getAttribute('team-index'));
  currentPen = idx;
  if (idx > -1) {
    document.getElementById('input-rank-table').classList.add('pen-mode');
  } else {
    document.getElementById('input-rank-table').classList.remove('pen-mode');
  }
  if (mouseChaser) {
    if (idx > -1) {
      for (i = 0; i < teamMaxNum + 1; i++) mouseChaser.classList.remove('team-' + i);
      mouseChaser.classList.remove('hidden');
      if (idx === teamNum) {
        mouseChaser.textContent = '　';
        mouseChaser.classList.add('team-' + teamMaxNum);
      } else {
        mouseChaser.textContent = teamNames[idx];
        mouseChaser.classList.add('team-' + idx);
      }
    } else {
      mouseChaser.classList.add('hidden');
    }
  }
}

/** makeMouseChaser()
 */
function makeMouseChaser() {
  if (isTouchDevice) {
    return;
  }
  var area = document.getElementById('input-rank-area');
  mouseChaser = document.getElementById('mouse-chaser');
  mouseChaser.classList.add('mouse-chase');
  mouseChaser.classList.add('hidden');
  mouseChaser.textContent = 'NX';
  // マウスムーブ
  area.addEventListener('mousemove', function (e) {
    var x = e.clientX;
    var y = e.clientY;
    var w = mouseChaser.clientWidth;
    var h = mouseChaser.clientHeight;
    x -= w / 2;
    y -= h / 2 + 5;
    var css = 'translate(' + x + 'px, ' + y + 'px)';
    mouseChaser.style.transform = css;
    if (penDown && currentPen > -1) {
      getSelection().removeAllRanges();
    }
    return true;
  }, false);
  area.addEventListener('mouseenter', function (e) {
    mouseChaser.style.display = 'block';
    penDown = false;
    rightDown = false;
  });
  area.addEventListener('mouseleave', function (e) {
    mouseChaser.style.display = 'none';
    penDown = false;
    rightDown = false;
  });
}

/** makeInputRankTable()
 */
function makeInputRankTable() {
  logger.log('making rank table');
  var table = document.getElementById('input-rank-table');
  table.innerHTML = '';
  var MARGIN_TOP = 2;
  var MARGIN_LEFT = 1;
  var MARGIN_BOTTOM = isEnabledSS ? 5 : 3;
  var COURSE_LINE = 0;
  var LOCK_LINE = 1;
  var STATE_LINE = 2;
  var PASTE_LINE = 3;
  var PASTED_IMAGE_LINE = 4;
  var w = raceNum + MARGIN_LEFT;
  var h = playerNum + MARGIN_TOP + MARGIN_BOTTOM;
  for (var y = 0; y < h; y++) {
    var tr = document.createElement('tr');
    if (y === playerNum + MARGIN_TOP) tr.classList.add('rank-end-tr');
    for (var x = 0; x < w; x++) {
      if ((y === 0 && x > 1) || (x === 0 && y === 1)) {
      } else {
        var td = document.createElement('td');
        var input, str = '', caseType = '';
        var race = 1 + x - MARGIN_LEFT;
        var rank = 1 + y - MARGIN_TOP;
        var num = (race - 1) * (playerNum + 1) + (rank - 1);
        // 順位部分
        if (x >= MARGIN_LEFT && y >= MARGIN_TOP && y < playerNum + MARGIN_TOP) {
          makeRank(td, rank, race, num);
        } else if (x === 0 && y === 0) {
          td.setAttribute('rowspan', 2);
          str = '順位';
        } else if (x === 1 && y === 0) {
          td.setAttribute('colspan', 12);
          str = 'レース番号';
        } else if (y === 1 && x >= MARGIN_LEFT) {
          str = x;
        } else if (x === 0 && y >= MARGIN_TOP && y < playerNum + MARGIN_TOP) {
          str = y - 1;
        }
        // ロック
        else if (x === 0 && y === playerNum + MARGIN_TOP + LOCK_LINE) {
          str = '　';
        }
        else if (x  >  0 && y === playerNum + MARGIN_TOP + LOCK_LINE) {
          str = '';
          makeLock(td, rank, race, num);
        }
        // OK!かどうか
        else if (x === 0 && y === playerNum + MARGIN_TOP + STATE_LINE) {
        }
        else if (x  >  0 && y === playerNum + MARGIN_TOP + STATE_LINE) {
          makeState(td, rank, race, num);
        }
        // コース
        else if (x === 0 && y === playerNum + MARGIN_TOP + COURSE_LINE) {
          str = 'コース';
        }
        else if (x  >  0 && y === playerNum + MARGIN_TOP + COURSE_LINE) {
          makeCource(td, rank, race, num);
        }
        // スクショ
        else if (x === 0 && y === playerNum + MARGIN_TOP + PASTE_LINE) {
          str = 'スクショ';
        }
        else if (x  >  0 && y === playerNum + MARGIN_TOP + PASTE_LINE) {
          makePaste(td, rank, race, num);
        }
        // ペーストされた画像
        else if (x === 0 && y === playerNum + MARGIN_TOP + PASTED_IMAGE_LINE) {
          str = '　';
          td.classList.add('scanable-state');
        }
        else if (x  >  0 && y === playerNum + MARGIN_TOP + PASTED_IMAGE_LINE) {
          makePastedImage(td, rank, race, num);
        }
        if (str) {
          td.textContent = str;
          td.classList.add('label');
        }
        if (y >= 1) {
          td.classList.add('race-' + race);
          td.setAttribute('race', race);
        }
        tr.appendChild(td);
      }
    }
    table.appendChild(tr);
  }
  if (tallyConfig.isEnabledSuggest) {
    $('input.course-cell').MySuggest({
      msArrayList: MK8DX_COURSES
    });
  }
  var rankEndTr = document.querySelector('.rank-end-tr');
  var hr = document.createElement('hr');
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  td.setAttribute('colspan', w);
  td.appendChild(hr);
  tr.appendChild(td);
  rankEndTr.parentNode.insertBefore(tr, rankEndTr);
  for (var i = 1; i <= raceNum; i++) {
    updateRace(i, false);
  }
  tallyForScores();
  return;
  /** makeState(td, rank, race, num)
   */
  function makeState(td, rank, race, num) {
    setEventDisablePen(td);
    td.classList.add('state-cell');
    td.setAttribute('state-type', 'lack');
    var stateImage = document.createElement('img');
    stateImage.setAttribute('src-complete', 'assets/state-complete.png');
    stateImage.setAttribute('src-error', 'assets/state-error.png');
    stateImage.setAttribute('src-lack', 'assets/transparent.png');
    stateImage.setAttribute('src', stateImage.getAttribute('src-lack'));
    td.appendChild(stateImage);
  }
  /** makeLock(td, rank, race, num)
   */
  function makeLock(td, rank, race, num) {
    setEventDisablePen(td);
    var lockImage = document.createElement('img');
    var src1 = 'assets/lock-1.png';
    var src2 = 'assets/lock-2.png';
    lockImage.src = src1;
    td.appendChild(lockImage);
    td.classList.add('lock-cell');
    td.addEventListener("click", function(e) {
      var race = this.getAttribute('race');
      var all = document.querySelectorAll('.race-' + race);
      for (var i = 0; i < all.length; i++) {
        if (!all[i].classList.contains('locked')) {
          this.querySelector('img').src = src2;
          all[i].classList.add('locked');
        } else {
          this.querySelector('img').src = src1;
          all[i].classList.remove('locked');
        }
      }
    }, true);
  }
  /** makePaste(td, rank, race, num)
   */
  function makePaste(td, rank, race, num) {
    setEventDisablePen(td);
    input = document.createElement('div');
    input.setAttribute('race', 1+x - 1);
    input.classList.add('paste-input');
    input.classList.add('race-' + race);
    input.setAttribute('placeholder', 'paste');
    setEventPasteImage(input, function(pastedImage, input) {
      logger.log('🏞️image pasted');
      var race = parseInt(input.getAttribute('race'));
      var selector = '.pasted-image-cell.race-' + race + ' img';
      var targetImg = document.querySelector(selector);
      if (isCalculating) {
        notifyFooter('計算中のプロセスがあります。');
        return;
      }
      isCalculating = true;
      document.getElementById('mask-notice').style.setProperty('display', 'block');
      setTimeout(() => {
        // ゲーム画面をトリミングする
        trimGameScreen(pastedImage, (trimedCanvas) => {
          // ゲーム画面をスキャンする
          scanGameScreen(trimedCanvas, (scanedNameArr) => {
            isCalculating = false;
            document.getElementById('mask-notice').style.setProperty('display', 'none');
            // スキャンできた！
            // scanedNameDataに放り込む
            scanedNameData[race - 1] = scanedNameArr;
            // 画像ソースを代入する
            targetImg.style.setProperty('display', 'block');
            targetImg.src = trimedCanvas.toDataURL();
            var imageCell = document.querySelector(`.pasted-image-cell.race-${race}`);
            if (imageCell.classList.contains('specimen')) {
              sampleTeamData = null;
              imageCell.classList.remove('specimen');
            }
            if (existsSampleTeamData()) {
              scanTeamData(race);
            }
          });
        }, () => {
          alert('ゲーム画面の抽出に失敗しました。');
          isCalculating = false;
          document.getElementById('mask-notice').style.setProperty('display', 'none');
        });
      }, 50);
    });
    td.appendChild(input);
  }
  /** makePastedImage(td, rank, race, num)
   */
  function makePastedImage(td, rank, race, num) {
    setEventDisablePen(td);
    td.classList.add('pasted-image-cell');
    var img = document.createElement('img');
    setEventZoomImage(img, race);
    td.appendChild(img);
  }
  /** makeCource(td, rank, race, num)
   */
  function makeCource(td, rank, race, num) {
    setEventDisablePen(td);
    input = createInput({
      className: 'race-' + race + ' ' + 'course-cell',
      id: 'rank-input-' + num,
      race: race,
      placeholder: 'コース',
      tabIndex: rankTableIndex + num,
      'rank-input-id': num,
    });
    /*
    input.addEventListener('input', function (e) {
      var selectionEnd = this.selectionEnd;
      logger.log('inputed course [race ' + race + '][' + this.value + ']', 'gray');
      tallyForScores();
      this.focus();
      this.setSelectionRange(selectionEnd, selectionEnd);
    }, false);
    */
    input.addEventListener('change', function (e) {
      setTimeout(() => {
        logger.log('changed course [race ' + race + '][' + this.value + ']', 'gray');
        tallyForScores();
      }, 100);
    }, false);
    td.appendChild(input);
  }
  /** makeRank(td, rank, race, num)
   */
  function makeRank(td, rank, race, num) {
    setEventEnablePen(td);
    input = createRankInput(rank, race, num);
    if (inputRankData[race - 1][rank - 1] !== '-1') {
      input.value = teamNames[inputRankData[race - 1][rank - 1]];
      resetRankInputClass(input, false);
    }
    td.appendChild(input);
    // セルクリック時の挙動
    var onmousedown = function (e) {
  /** [メモ1] チームを選択した状態でセルをクリック */
      switch (e.type.toLowerCase()) {
      case 'mousedown':
        penDown = true;
        break;
      case 'mousemove':
        if (!penDown) {
          return;
        }
        break;
      }
      if (!isTouchDevice && (rightDown || e.button === 2)) {
        rightDown = true;
        var input = this.querySelector('input');
        var team = parseInt(input.getAttribute('team'));
        if (team < 0) team = teamNum;
        selectPalette(team);
        return false;
      }
      if (currentPen > -1) {
        var input = this.querySelector('input');
        var isLocked = input.classList.contains('locked');
        var race = parseInt(this.getAttribute('race'));
        if (!isLocked) {
          var val;
          if (currentPen >= teamNum) val = '';
          else val = teamNames[currentPen];
          input.value = val;
          var isNull = (val === '');
          // resetRankInputClass
          resetRankInputClass(input);
          // updateRace
          var [isComplemented, isChangeState] = updateRace(race, !isNull);
          // 状態が変わったならば集計
          if (isChangeState) {
  /** [メモ5] */
            //updateInputTeamNameTable();
            //makeInputRankTable();
            tallyForScores();
          }
        }
        // デフォルトのイベントはキャンセルする
        e.preventDefault();
        return false;
      }
    };
    var onmouseup = function (e) {
      penDown = false;
      rightDown = false;
    };
    var oncontextmenu = function (e) {
      return false;
    };
    td.oncontextmenu = oncontextmenu;
    td.addEventListener(mousedownEvent, onmousedown, false);
    if (!isTouchDevice) {
      td.addEventListener('mousemove', onmousedown, false);
      td.addEventListener('mouseup', onmouseup, false);
      td.addEventListener('wheel', function (e) {
        if (currentPen < 0) {
          return true;
        }
        e.preventDefault();
        if (e.deltaY < 0){
            if (currentPen >= 1) {
              selectPalette(--currentPen);
            }
        } else {
            if (currentPen < teamNum) {
              selectPalette(++currentPen);
            }
        }
      });
    }
  }
  function setEventDisablePen(td) {
    td.addEventListener('mouseenter', () => {
      if (mouseChaser) {
        mouseChaser.style.display = 'none';
      }
    });
  }
  function setEventEnablePen(td) {
    td.addEventListener('mouseenter', () => {
      if (mouseChaser) {
        mouseChaser.style.display = 'block';
      }
    });
  }
}

/** createInput(opt)
 */
function createInput(opt) {
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('user-scalable', 'no');
  if (opt) {
    Object.keys(opt).map(key => {
      if (key === 'className') {
        opt[key].split(' ').map(cls => {
          input.classList.add(cls);
        });
      } else {
        input.setAttribute(key, opt[key]);
      }
    });
  }
  return input;
}

/** createRankInput(rank, race, num)
 */
function createRankInput(rank, race, num) {
  var input = document.createElement('input');
  setAttributes(input);
  setEvents(input);
  return input;
  /** setAttributes(input)
   */
  function setAttributes(input) {
    input.setAttribute('type', 'text');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('team', '-1');
    input.setAttribute('tabIndex', rankTableIndex + num);
    input.setAttribute('rank-input-id', num);
    input.setAttribute('id', 'rank-input-' + num);
    input.setAttribute('placeholder', rank);
    input.setAttribute('race', race);
    input.setAttribute('rank', rank);
    input.setAttribute('user-scalable', 'no');
    input.classList.add('race-' + race);
    input.classList.add('rank-' + rank);
  }
  /** setEvents(input)
   */
  function setEvents(input) {
    // clickイベント
    input.addEventListener(mousedownEvent, function (e) {
      if (this.classList.contains('locked')) {
        this.blur();
      }
    }, false);
    // inputイベント
    input.addEventListener('input', function(e) {
      logger.log('inputed [' + e.data + ']', 'gray');
      var selectionEnd = this.selectionEnd;
      var isNull = (e.data === null);
      var isParsed = applyShortCutKey(this, e.data);
      if (isParsed) {
        logger.log('parsed input [' + e.data + '] -> [' + this.value + ']', 'gray');
      } else {
        var index = teamNames.indexOf(this.value);
        if (index < 0) {
          var oldValue = this.value;
          isParsed = complementUpperCase(this);
          if (isParsed) {
            logger.log('parsed name [' + oldValue + '] -> [' + this.value + ']', 'gray');
          }
        }
      }
      var isInputedTeam = resetRankInputClass(this);
      var [isComplemented, isChangeState] = updateRace(race, !isNull);
      if (isChangeState) {
    /** [メモ6] */
        var selectionEnd = this.selectionEnd;
        tallyForScores();
        this.focus();
        this.setSelectionRange(selectionEnd, selectionEnd);
        this.blur();
        //tallyForScores();
        //this.blur();
      } else {
        if (isComplemented) {
          this.blur();
        } else if (isInputedTeam) {
          focusDownRankInput(this);
        } else {
          this.focus();
          this.setSelectionRange(selectionEnd, selectionEnd);
        }
      }
    });
    // keydownイベント
    input.addEventListener('keydown', function (e) {
      switch (e.keyCode) {
      case 13:
        focusNextRankInput(this);
        break;
      case 40:
        focusDownRankInput(this);
        break;
      case 38:
        focusUpRankInput(this);
        break;
      }
    }, false);
    // applyShortCutKey(input, str)
    function applyShortCutKey(input, str) {
      var index = shortCutKeys.indexOf(str);
      //var str2 = replaceHankaku(str);
      //var index2 = shortCutKeys.indexOf(str2);
      if (index > -1 && index < teamNum) {
        input.value = teamNames[index];
        return true;
      }
      //else if (index2 > -1 && index2 < teamNum) {
      //  input.value = teamNames[index2];
      //  return true;
      //}
      return false;
    }
    // complementUpperCase(input)
    function complementUpperCase(input) {
      var val = input.value.toLowerCase();
      for (var i = 0; i < teamNames.length; i++) {
        var name = teamNames[i];
        if (val === name.toLowerCase()) {
          input.value = name;
          return true;
        }
      }
      return false;
    }
    function replaceHankaku(str) {
      var index = zenkakuStrs.indexOf(str);
      if (index > -1) {
        return hankakuStrs[index];
      }
      return str;
    }
  }
}

/** [メモ2] inputのチームクラスの付け外し */
/** resetRankInputClass(elm, isParsed)
 * inputの中身がチーム名に一致するかどうかを判定し、
 * その結果に応じてteam-0～6のクラスを付け外しします。
 */
function resetRankInputClass(elm, isLog = true) {
  // いったんクラスを全部剥ぐ
  for (var i = 0; i < teamNum + 1; i++) {
    elm.classList.remove('team-' + i);
  }
  elm.setAttribute('team', '-1');
  var race = parseInt(elm.getAttribute('race'));
  var rank = parseInt(elm.getAttribute('rank'));
  // チームタグ一覧に一致したら
  var val = elm.value;
  var idx = teamNames.indexOf(val);
  var isMatched = (0 <= idx && idx < teamNum);
  if (isMatched) {
    elm.classList.add('team-' + idx);        // team-Nを付け
    elm.setAttribute('team', idx);           // team属性を付け
    inputRankData[race - 1][rank - 1] = idx; // inputRankDataを更新する
  }
  var rankStr = rankStrs[rank - 1];
  if (isLog) {
    logger.log('inputed team [race ' + race + '][' +
      rankStr + '][' + elm.value + ']', 'gray');
  }
  setSaveStorage();
  return isMatched;
}

/** focusNextRankInput(elm)
 */
function focusNextRankInput(elm) {
  var id = parseInt(elm.getAttribute('rank-input-id'));
  var next = document.getElementById('rank-input-' + (id + 1));
  if (next) next.focus();
}

/** focusUpRankInput(elm)
 */
function focusUpRankInput(elm) {
  var next, id = parseInt(elm.getAttribute('rank-input-id'));
  if (id % (playerNum + 1) > 0)
    next = document.getElementById('rank-input-' + (id - 1));
  if (next) next.focus();
}

/** focusDownRankInput(elm)
 */
function focusDownRankInput(elm) {
  var next, id = parseInt(elm.getAttribute('rank-input-id'));
  if (id % (playerNum + 1) < playerNum - 1)
    next = document.getElementById('rank-input-' + (id + 1));
  if (next) next.focus();
}

/** [メモ3] レースの入力状況の見直し */
/** updateRace(race, doComplement)
 * 特定のレースについて、
 * ◎ 入力補完が可能かどうか
 * ◎ 1位から12位までの入力が完了しているか
 * ◎ "入力が完了しているか"の状態に変更があったか
 * を調べます。入力補完が可能なら補完を行います。
 */
function updateRace(race, doComplement) {
  if (doComplement === undefined) doComplement = true;
  doComplement = doComplement && window.tallyConfig.isEnabledComplement;
  var stateTd = document.body.querySelector('.state-cell.race-' + race);
  if (!stateTd) {
    return;
  }
  var stateImage = stateTd.querySelector('img');
  var beforeStateType = stateTd.getAttribute('state-type');
  // 正しく入力されているチームタグの数を数える
  var inputedRankNum = 0;
  var notInputedElements = [];
  var teamCounts = createArray(teamNum, 0);
  for (var rank = 1; rank <= playerNum; rank++) {
    var inpt = document.body.querySelector('.rank-' + rank + '.race-' + race);
    var team = inpt.getAttribute('team');
    inputRankData[race - 1][rank - 1] = team;
    if (team === '-1') {
      notInputedElements.push(inpt);
    } else {
      inputedRankNum++;
      teamCounts[parseInt(team)]++;
    }
  }
  // 補完可能かどうか調べる
  var isCanComplement = doComplement;
  if (doComplement) {
    var teamMenberNum = playerNum / teamNum; // eg. 4 = 12 / 3;
    var canComplementNum = teamMenberNum * (teamNum - 1); // eg. 8 = 4 * (3 - 1);
    var complementTeam = -1, complementTeamName;
    if (inputedRankNum >= canComplementNum && inputedRankNum < playerNum) {
      for (var i = 0; i < teamNum; i++) {
        if (teamCounts[i] === teamMenberNum) {
        } else if (teamCounts[i] < teamMenberNum) {
          if (complementTeam === -1) {
            complementTeam = i;
            complementTeamName = teamNames[complementTeam];
          } else {
            isCanComplement = false;
            break;
          }
        }
      }
    } else {
      isCanComplement = false;
    }
    if (isCanComplement) {
      logger.log('complemented ranks');
      notInputedElements.map(elm => {
        elm.value = complementTeamName;
        resetRankInputClass(elm);
        teamCounts[complementTeam]++;
      });
    }
  }
  // 入力が完了しているかどうか調べる
  // プレイヤーと同じ数のチームタグが入力されており
  // どのチームタグの数も等しいなら入力が完了している
  var stateType;
  if (isCanComplement) {
    stateType = 'complete';
  } else if (inputedRankNum === playerNum) {
    stateType = 'complete';
    for (i = 1; i < teamNum; i++) {
      if (teamCounts[0] !== teamCounts[i]) {
        stateType = 'error';
        break;
      }
    }
  } else {
    stateType = 'lack';
  }
  var isChangeState = (beforeStateType !== stateType);
  if (isChangeState) {
    logger.log('changed [race ' + race + '] state [' +
      beforeStateType + '] -> [' + stateType + ']');
  }
  var theRaceTds = document.querySelectorAll('.race-' + race);
  var len = Math.min(theRaceTds.length - 4);
  for (var i = 0; i < len; i++) {
    theRaceTds[i].classList.remove('complete');
    theRaceTds[i].classList.remove('error');
    theRaceTds[i].classList.remove('lack');
    theRaceTds[i].classList.add(stateType);
  }
  stateTd.setAttribute('state-type', stateType);
  stateImage.setAttribute('src', stateImage.getAttribute('src-' + stateType));
  stateTd.setAttribute('inputed', (stateType === 'complete') ? 'inputed' : '');
  return [isCanComplement, isChangeState];
}

/** [メモ4] 集計 */
/** tallyForScores(callback)
 * 集計を行います。この関数は次のシーンで呼ばれます。
 * ◎ 順位セルをチームペンでクリックしたとき
 * ◎ 順位セルにキー入力を行ったとき
 * ◎ コースセルにキー入力を行ったとき
 * ◎ コースセルに予測変換結果が代入されたとき
 * ◎ 順位テーブルを作り直したとき
 * ◎ オーバーレイ有効時にチームパレットを作り直したとき
 * ◎ 表示設定を変えたとき
 */
function tallyForScores(callback) {
    logger.log('tallied scores', 'blue');
    // ◎ 残りレース数
    // ◎ 最新レースのコース名
    // ◎ 入力されているレース番号の配列
    // を取得する
    var states = document.body.querySelectorAll('.state-cell');
    var i;
    var sum = 0;
    var latestRace;
    var inputedRaces = [];
    for (i = 0; i < states.length; i++) {
      if (states[i].getAttribute('inputed') === 'inputed') {
        var race = states[i].getAttribute('race');
        latestRace = race;
        inputedRaces.push(race);
        sum++;
      }
    }
    var leftRace = raceNum - sum;
    var lastCourseStr = '';
    var lastCourse = document.body.querySelector('.course-cell.race-' + latestRace);
    if (lastCourse) lastCourseStr = lastCourse.value;
    // 点数を計算する準備
    var totalScores = [];
    var latestScores = [];
    var sortedScoreObjects = [];
    for (i = 0; i < teamNum; i++) {
      totalScores.push(0);
      latestScores.push(0);
      sortedScoreObjects.push({
        teamIndex: i,
        teamName: teamNames[i],
        totalScore: 0,
        latestScore: 0,
        isCorrected: false
      });
    }
    // ◎ 入力されているレース番号の配列
    // を用いて
    // ◎ スコアオブジェクトの配列
    // を計算する
    inputedRaces.map((race, raceIndex) => {
      for (var i = 1; i <= playerNum; i++) {
        //var inpt = document.body.querySelector('.rank-' + i + '.race-' + race);
        //var team = parseInt(inpt.getAttribute('team'));
        var team = parseInt(inputRankData[race - 1][i - 1]);
        if (team > -1) {
          var point = SCORES[i - 1];
          totalScores[team] += point;
          sortedScoreObjects[team].totalScore += point;
          if (raceIndex === inputedRaces.length - 1) {
            latestScores[team] += point;
            sortedScoreObjects[team].latestScore += point;
          }
        }
      }
    });
    // 点数補正
    sortedScoreObjects.map((scoreObj, i) => {
      if (correctionValues[i] !== 0) {
        scoreObj.totalScore += correctionValues[i];
        scoreObj.isCorrected = true;
      }
    });
    // 最新レースのチーム0 vs. チーム1の点差
    sortedScoreObjects[0].latestScoreDif =
      sortedScoreObjects[0].latestScore - sortedScoreObjects[1].latestScore;
    // 合計得点が多い順 (合計得点が同じならばチーム番号が若い順) に並べる
    sortedScoreObjects.sort((a, b) => {
      if (a.totalScore > b.totalScore) {
        return -1;
      } else if (a.totalScore < b.totalScore) {
        return 1;
      } else {
        return (a.teamIndex < b.teamIndex) ? -1 : 1;
      }
    });
    // 順位はindex+1
    sortedScoreObjects.map((scoreObj, i) => scoreObj.teamRank = i + 1);
    // 目標順位との点差を計算
    sortedScoreObjects.map((scoreObj, teamIndex) => {
      calcTargetDistance(sortedScoreObjects, teamIndex, tallyConfig.passRank)
    });
    // タイの計算
    var tieObj = sortedScoreObjects[0];
    var tieRank = sortedScoreObjects[0].teamRank;
    var tieScore = sortedScoreObjects[0].totalScore;
    sortedScoreObjects[0].isTie = false;
    sortedScoreObjects[0].teamRankTie = 1;
    sortedScoreObjects.map((scoreObj, i) => {
      if (i > 0) {
        if (tieScore === scoreObj.totalScore) {
          tieObj.isTie = true;
          scoreObj.isTie = true;
          scoreObj.teamRankTie = tieRank;
        } else {
          scoreObj.isTie = false;
          scoreObj.teamRankTie = scoreObj.teamRank;
          tieObj = scoreObj;
          tieRank = scoreObj.teamRank;
          tieScore = scoreObj.totalScore;
        }
      }
    });
    // ◎ スコアオブジェクトの配列
    // ◎ 残りレース数
    // ◎ 最新レースのコース名
    // を用いて集計結果を文字列にする
    var tallyText = createTallyText(sortedScoreObjects, lastCourseStr, leftRace);
    // #result に文字列を代入する
    document.getElementById('result').textContent = tallyText;
    // コピーを実行する
    if (isInitialized) {
      execCopy(tallyText);
    }
    if (callback) callback();
}

/** getScoreObject(sortedScoreObjects, teamIndex)
 */
function getScoreObject(sortedScoreObjects, teamIndex) {
  for (var i = 0; i < teamNum; i++) {
    if (sortedScoreObjects[i].teamIndex === teamIndex) {
      return sortedScoreObjects[i];
    }
  }
}

/** calcTargetDistance(sortedScoreObjects, teamIndex, passRank)
 */
function calcTargetDistance(sortedScoreObjects, teamIndex, passRank) {
  var scoreObj = getScoreObject(sortedScoreObjects, teamIndex);
  var myRank = scoreObj.teamRank;
  passRank = Math.max(1, Math.min(teamNum - 1, passRank));
  var targetRank;
  if (myRank <= passRank) targetRank = passRank + 1; // eg. 現在2位, 3組通過 → 4位との差
  else targetRank = passRank;                        // eg. 現在4位, 3組通過 → 3位との差
  scoreObj.targetDistance = sortedScoreObjects[myRank - 1].totalScore -
    sortedScoreObjects[targetRank - 1].totalScore;
  scoreObj.targetDistanceStr = targetRank + '位との点差:' +
    parseSignedNum(scoreObj.targetDistance);
}

/** [メモ4] 集計文字列の作成 */
/** createTallyText(sortedScoreObjects, lastCourseStr, leftRace)
 */
function createTallyText(sortedScoreObjects, lastCourseStr, leftRace) {
  /*
  var tallyConfig = {
    latestScore: true,     // 最新レースの得点
    latestScoreDif: true,  // 最新レースの点差
    latestCource: true,    // 最新レースのコース
    totalScoreDif: true,   // 合計得点の点差
    leftRaceNum: true,     // 残りレース数
    currentRank: true,     // 現在の順位
    targetDistance: true,  // 目標順位との距離
    emphasisStr: '【】',   // 強調開始
    splitStr: '／',        // 区切り文字
    teamSplitStr: '／',    // チームの区切り文字
    passRank: 2,
  };
  */
  var cfg = tallyConfig;
  var tallyStrs = [];
  var myScoreObj = getScoreObject(sortedScoreObjects, 0);
  if (cfg.emphasisStr.length >= 2) {
    cfg.emphasisStart = cfg.emphasisStr.charAt(0);
    cfg.emphasisEnd = cfg.emphasisStr.charAt(1);
  } else {
    cfg.emphasisStart = '';
    cfg.emphasisEnd = '';
  }
  // 最新レースのスコア
  if (teamNum === 2) {
    var latestScoreStr = '';
    if (cfg.latestScore) {
      for (i = 0; i < teamNum; i++) {
        //var scoreObj = sortedScoreObjects[i];
        var scoreObj = getScoreObject(sortedScoreObjects, i);
        var latestScore = scoreObj.latestScore;
        if (i > 0) latestScoreStr += '-';
        latestScoreStr += latestScore;
      }
      if (cfg.latestScoreDif) {
        latestScoreStr += ' (' + parseSignedNum(myScoreObj.latestScoreDif) + ')';
      }
    } else if (cfg.latestScoreDif) {
      latestScoreStr += parseSignedNum(myScoreObj.latestScoreDif);
    }
    if (latestScoreStr) tallyStrs.push(latestScoreStr);
  }
  // 合計スコア
  var totalScoreStr = '';
  if (teamNum === 2) {
    // 66(交流戦)の場合
    if (cfg.totalScore) {
      totalScoreStr += '合計: ';
      for (i = 0; i < teamNum; i++) {
        //var scoreObj = sortedScoreObjects[i];
        var scoreObj = getScoreObject(sortedScoreObjects, i);
        var name = scoreObj.teamName;
        //if (scoreObj.teamIndex === 0) name = '【' + name + '】';
        //else name = name + ' ';
        var score = scoreObj.totalScore;
        var scoreStr = name + ' ' + score;
        if (i > 0) totalScoreStr += '-';
        if (i > 0) scoreStr = score + ' ' + name;
        totalScoreStr += scoreStr;
      }
    }
  } else {
    if (cfg.totalScore || cfg.totalScoreDif) {
      // タッグ/トリプルス/フォーマンの場合
      for (var i = 0; i < teamNum; i++) {
        var scoreObj = sortedScoreObjects[i];
        //var scoreObj = getScoreObject(sortedScoreObjects, i);
        var name = scoreObj.teamName;
        if (scoreObj.teamIndex === 0) {
          name = cfg.emphasisStart + name + cfg.emphasisEnd;
          if (i > 0 && cfg.emphasisStart !== '【' && cfg.teamSplitStr.charAt(0) === ' ') name = ' ' + name;
          if (cfg.emphasisEnd !== '】') name += ' ';
        } else {
          if (i > 0 && cfg.teamSplitStr.charAt(0) === ' ') name = ' ' + name;
          name += ' ';
        }
        var score = scoreObj.totalScore;
        var difScore = myScoreObj.totalScore - scoreObj.totalScore;
        difScore = (difScore > 0) ? '+' + difScore : (difScore === 0) ? '±0' : '' + difScore;
        if (cfg.totalScore) {
          if (cfg.totalScoreDif) {
            if (myScoreObj !== scoreObj) {
              score = score + ' (' + difScore + ')';
            }
          }
        } else {
          if (cfg.totalScoreDif) {
            if (myScoreObj !== scoreObj) {
              score = difScore;
            }
          }
        }
        var scoreStr = name + score;
        if (i > 0) totalScoreStr += cfg.teamSplitStr;
        totalScoreStr += scoreStr;
      }
    }
  }
  if (totalScoreStr) {
    tallyStrs.push(totalScoreStr);
  }
  if (teamNum === 2) {
    // 点差 66(交流戦)のみ
    if (cfg.totalScoreDif) {
      tallyStrs.push('点差: ' + parseSignedNum(myScoreObj.targetDistance));
    }
  } else {
    // 現在順位と目標距離 タッグ/トリプルス/フォーマンのみ
    if (cfg.currentRank) {
      var myRankStr;
      if (myScoreObj.isTie) {
        myRankStr = '現在同' + myScoreObj.teamRankTie + '位';
      } else {
        myRankStr = '現在' + myScoreObj.teamRank + '位';
      }
      tallyStrs.push(myRankStr);
    }
    if (cfg.targetDistance) {
      tallyStrs.push(myScoreObj.targetDistanceStr);
    }
  }
  // コース名と残りレース数
  var leftRaceStr = '';
  if (cfg.latestCource) {
    leftRaceStr += lastCourseStr;
  }
  if (cfg.leftRaceNum) {
    leftRaceStr += '＠' + leftRace;
  }
  if (leftRaceStr) tallyStrs.push(leftRaceStr);
  // 1レースで付きうる最大の点差
  var oneRaceMaxDif = 0;
  switch (teamNum) {
    case 2: // 2チーム:交流戦
      oneRaceMaxDif = 40; // (15+12+10+9+8+7)-(1+2+3+4+5+6)
      break;
    case 3: // 3チーム:フォーマンセル
      oneRaceMaxDif = 36; // (15+12+10+9)-(1+2+3+4)
      break;
    case 4: // 4チーム:トリプルス
      oneRaceMaxDif = 31; // (15+12+10)-(1+2+3)
      break;
    case 6: // 6チーム:タッグ
      oneRaceMaxDif = 24; // (15+12)-(1+2)
      break;
  }
  // 残りのレースで付きうる最大の点差
  var possibleMaxDif = leftRace * oneRaceMaxDif;
  var isWinDetermine = false;
  if (myScoreObj.teamRank === 1) {
    var dif = sortedScoreObjects[0].totalScore - sortedScoreObjects[1].totalScore;
    if (dif > possibleMaxDif) {
      if (cfg.winDetermine) {
        isWinDetermine = true;
        tallyStrs.push('勝利確定!');
      }
    }
  }
  if (overlayWindow) {
    setOverlayValue(overlayWindow.document);
  }
  if (isOverlay) {
    setOverlayValue(document);
  }
  function setOverlayValue(doc) {
    doc.querySelectorAll(`#team-num-${teamNum}`).forEach($container => {
      if (teamNum === 2) {
        $container.querySelectorAll('.score').forEach(($score, i) => {
          $score.innerText = getScoreObject(sortedScoreObjects, i).totalScore;
        });
        $container.querySelectorAll('.team-span').forEach(($team, i) => {
          $team.innerText = getScoreObject(sortedScoreObjects, i).teamName;
        });
        $container.querySelectorAll('.score-dif').forEach(($dif, i) => {
          $dif.classList.remove('plus');
          $dif.classList.remove('minus');
          $dif.classList.add((myScoreObj.teamRank === 1) ? 'plus' : 'minus');
          $dif.innerText = parseSignedNum(myScoreObj.targetDistance);
        });
        $container.querySelectorAll('.win').forEach(($win, i) => {
          $win.style.setProperty('display', isWinDetermine ? 'block' : 'none');
        });
        $container.querySelectorAll('.left-race').forEach(($race, i) => {
          $race.innerText = `残レース:${leftRace}`;
        });
      } else {
        $container.querySelectorAll('.score').forEach(($score, i) => {
          $score.innerText = sortedScoreObjects[i].totalScore;
        });
        $container.querySelectorAll('.team-span').forEach(($team, i) => {
          $team.innerText = sortedScoreObjects[i].teamName;
        });
        $container.querySelectorAll('.dif').forEach(($dif, i) => {
          $dif.innerText = parseSignedNum(sortedScoreObjects[i].totalScore - sortedScoreObjects[i + 1].totalScore);
        });
        $container.querySelectorAll('.left-race').forEach(($race, i) => {
          $race.innerText = `残${leftRace}`;
        });
      }
      $container.querySelectorAll('.team-span').forEach($span => {
        var $parent = $span.parentNode;
        var scaleX = 1;
        var translateX = 0;
        if ($span.offsetWidth > ($parent.offsetWidth - 20)) {
          scaleX = ($parent.offsetWidth - 20) / $span.offsetWidth;
          translateX = 10;
        }
        $span.style.setProperty('transform', `translateX(${translateX}px) scaleX(${scaleX})`);
      });
    });
  }
  var isCorrected = false;
  sortedScoreObjects.forEach(scoreObj => {
    if (scoreObj.isCorrected) {
      isCorrected = true;
    }
  });
  if (isCorrected) {
    tallyStrs.push('補正込み');
  }
  // join
  if (cfg.splitStr === ' /') {
    cfg.splitStr = ' / ';
  }
  var tallyText = tallyStrs.join(cfg.splitStr);
  return tallyText;
}

/** parseSignedNum()
 */
function parseSignedNum(num) {
  var sign = (num > 0) ? '+' : (num === 0) ? '±' : '';
  return sign + num;
}

/** logger()
 */
window.logger = {
  log: (str, colorKey) => {
    if (colorKey) {
      str = '%c' + str;
      var css = 'color: ' + logger.color[colorKey] + ';';
      console.log(str, css)
    }
    else console.log(str);
  },
  color: {
    'black': '#000',
    'gray': '#aaa',
    'blue': '#00f'
  }
};

/** execCopy(str)
 * https://qiita.com/simiraaaa/items/2e7478d72f365aa48356
 */
function execCopy(str) {
  var tmp = document.createElement('div');
  var pre = document.createElement('pre');
  pre.style.webkitUserSelect = 'auto';
  pre.style.userSelect = 'auto';
  tmp.appendChild(pre).textContent = str;
  var s = tmp.style;
  s.position = 'fixed';
  s.right = '200%';
  document.body.appendChild(tmp);
  document.getSelection().selectAllChildren(tmp);
  var result = document.execCommand('copy');
  document.body.removeChild(tmp);
  if (result) {
    notifyFooter('コピーしました: ' + str);
  }
  return result;
}

/** execCopyResult()
 */
function execCopyResult() {
  var copyText = document.getElementById('result').textContent;
  execCopy(copyText);
}

/** trigger(element, eventType)
 */
function trigger(element, eventType) {
  var event = document.createEvent("Event");
  event.initEvent(eventType, true, true);
  element.dispatchEvent(event);
}

/** setSaveStorage()
 */
var saveStorageTimer = null;
function setSaveStorage() {
  clearTimeout(saveStorageTimer);
  saveStorageTimer = setTimeout(function(){
    saveStorage();
  }, 1000);
}

/** saveStorage()
 */
function saveStorage() {
  var saveDataObj = {};
  saveTargetVariables.map(varName => {
    saveDataObj[varName] = window[varName];
  });
  var jsonStr = JSON.stringify(saveDataObj);
  //logger.log(jsonStr);
  localStorage.setItem(storageKey, jsonStr);
  logger.log('set storage data');
}

/** loadStorage()
 */
function loadStorage() {
  var jsonStr = localStorage.getItem(storageKey);
  if (jsonStr !== null) {
    logger.log('storage data exist');
    logger.log('merging variables to window');
    //logger.log(jsonStr);
    var saveDataObj = JSON.parse(jsonStr);
    saveTargetVariables.map(varName => {
      if (saveDataObj[varName] !== undefined) {
        if (varName === 'tallyConfig') {
          Object.keys(saveDataObj[varName]).forEach(key => {
            window[varName][key] = saveDataObj[varName][key];
          });
        } else {
          window[varName] = saveDataObj[varName];
        }
      }
    });
  } else {
    logger.log('storage data doesn\'t exist');
  }
}

/** scanTeamData(race)
 */
function scanTeamData(race) {
  if (!existsSampleTeamData()) {
    alert('標本の作成が済んでいません。');
    return false;
  }
  logger.log(`scaning race ${race}...`);
  var scanedNameArr = scanedNameData[race - 1];
  var teamArr = getTeamRankArray(scanedNameArr, sampleTeamData);
  logger.log('scaned!');
  logger.log(teamArr);
  for (var rank = 1; rank <= 12; rank++) {
    var slc = '.race-' + race + '.rank-' + rank;
    var input = document.querySelector(slc);
    input.value = teamArr[rank - 1];
    resetRankInputClass(input);
  }
  updateRace(race);
  tallyForScores();
  return true;
}

/** makeSampleTeamData(race)
 */
function makeSampleTeamData(race) {
  logger.log(`making specimen with race ${race}...`);
  //var stateElm = document.querySelector('.scanable-state');
  //stateElm.textContent = '　';
  // そのレースの順位が入力済みかチェック
  var stateRace = document.body.querySelector(`.state-cell.race-${race}`);
  var isInputedRace = (stateRace.getAttribute('inputed') === 'inputed');
  if (!isInputedRace) {
    // 順位が入力済みでないなら
    logger.log(`error! race ${race} rank is missing.`);
    alert('順位の入力が済んでいません。');
    return false;
  } else {
    // 順位が入力済みなら
    // スキャンデータがあるかどうかチェック
    var names = scanedNameData[race - 1];
    var isScanedNamesRace = true;
    for (var i = 0; i < names.length; i++) {
      if (names[i] === null) {
        isScanedNamesRace = false;
        break;
      }
    }
    if (!isScanedNamesRace) {
      // スキャンデータがないなら
      logger.log(`error! race ${race} scan data is missing.`);
      alert('スキャンデータがありません。');
      return false;
    } else {
      // スキャンデータがあるなら
      var teams = inputRankData[race - 1];
      sampleTeamData = [];
      names.forEach((name, i) => {
        sampleTeamData.push({
          id: i,
          name: name,
          teamName: teamNames[teams[i]]
        });
      });
      logger.log('maked!');
      logger.log(sampleTeamData);
      var $specimen = document.querySelector('.specimen');
      if ($specimen) {
        $specimen.classList.remove('specimen');
      }
      document.querySelector(`.pasted-image-cell.race-${race}`).classList.add('specimen');
      return true;
    }
  }
}

/** existsSampleTeamData()
 */
function existsSampleTeamData() {
  return (sampleTeamData !== null);
}

/** constants
 */
var rankStrs = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
var hankakuStrs = ['1',  '2',  '3',  '4',  '5',  '6',  '7',  '8',  '9',  '0',  '-',  '^', '\\',  'q',  'w',  'e',  'r',  't',  'y',  'u',  'i',  'o',  'p',  '[',  'a',  's',  'd',  'f',  'g',  'h',  'j',  'k',  'l',  ';',  ':',  ']',  'z',  'x',  'c',  'v',  'b',  'n',  'm',  ',',  '.',  ',',  '.',  '/', '\\',  'a',  'i',  'u',  'e',  'o'];
var zenkakuStrs = ['１', '２', '３', '４', '５', '６', '７', '８', '９', '０', '－', '＾', '￥', 'ｑ', 'ｗ', 'ｅ', 'ｒ', 'ｔ', 'ｙ', 'ｕ', 'ｉ', 'ｏ', 'ｐ', '「', 'ａ', 'ｓ', 'ｄ', 'ｆ', 'ｇ', 'ｈ', 'ｊ', 'ｋ', 'ｌ', '；', '：', '」', 'ｚ', 'ｘ', 'ｃ', 'ｖ', 'ｂ', 'ｎ', 'ｍ', '，', '．', '、', '。', '・', '￥', 'あ', 'い', 'う', 'え', 'お'];
var MK8DX_COURSES = [
  ['マリカス', 'marikasu'],
  ['ウォタパ', 'whotapa', 'ulotapa', 'uxotapa'],
  ['ドッスン', 'dossun'],
  ['遺跡', 'いせき', 'iseki'],
  ['新マリサ', 'しんまりさ', 'まりさ', 'marisa', 'sinmarisa', 'shinmarisa'],
  ['ねじれ', 'nejire', 'nejire'],
  ['ヘイ鉱', 'へいこう', 'heikou'],
  ['ヘイホー', 'heiho'],
  ['空港', 'くうこう', 'kuukou'],
  ['ドルみ', 'dorumi'],
  ['岬', 'みさき', 'misaki'],
  ['エレドロ', 'eredoro'],
  ['ワリスノ', 'warisuno'],
  ['雪山', 'ゆきやま', 'yukiyama'],
  ['スカガ', 'sukaga'],
  ['ホネホネ', 'honoehone'],
  ['骨々', 'ほねほね', 'honehone'],
  ['クパキャ', 'kupakya'],
  ['新虹', 'しんにじ', 'shinniji', 'sinniji'],
  ['ヨシサ', 'yoshisa', 'yosisa'],
  ['エキバ', 'ekiba'],
  ['ドラロ', 'doraro'],
  ['ミュート', 'myu-to'],
  ['ベビパ', 'bebipa'],
  ['チーズ', 'ti-zu', 'chi-zu'],
  ['ネイチャー', 'neitya-', 'neicha-'],
  ['どう森', 'doumori'],
  ['モモカン', 'momokan'],
  ['スイキャニ', 'suikyani'],
  'GBA',
  ['プクビ', 'pukubi'],
  ['プクプク', 'pukupuku'],
  ['ハイウェイ', 'haiwei'],
  ['カラカラ', 'karakara'],
  ['平野', 'へいや', 'heiya'],
  ['ピチサ', 'pitisa', 'pichisa'],
  'DKJ',
  ['ハーバー', 'ha-ba-'],
  ['ジャングル', 'janguru', 'zyanguru'],
  ['ワリスタ', 'warisuta'],
  ['シャベ', 'shabe', 'syabe'],
  ['シャベラン', 'shaberan', 'syaberan'],
  ['ミューパ', 'myu-pa'],
  ['ヨシバ', 'yoshiba', 'yosiba'],
  ['チクタク', 'chikutaku', 'tikutaku'],
  ['パクスラ', 'pakusura'],
  ['火山', 'かざん', 'kazan'],
  ['グラグラ', 'guragura'],
  '64虹',
  ['ワリ鉱', 'warikou'],
  'SFC虹',
  ['ツルツル', 'turuturu', 'tsurutsuru'],
  ['ハイラル', 'hairaru'],
  ['ネオパ', 'neopa'],
  ['リボン', 'ribon'],
  ['メトロ', 'metoro'],
  ['リンメト', 'rinmeto'],
  ['リンリン', 'rinrin'],
  'BB',
  ['ビッグブルー', 'bigguburu-'],
];

/* 
 * my_alert(opt)
 */
function my_alert(opt) {
  var dom = {};
  var click_event = 'onclick';
  dom.alert_wrapper = document.querySelector('.alert-wrapper');
  dom.alert_outer = document.querySelector('.alert-outer');
  dom.alert_inner = document.querySelector('.alert-inner');
  dom.alert_title = document.querySelector('.alert-title');
  dom.alert_message = document.querySelector('.alert-message');
  dom.alert_ok = document.querySelector('.alert-button-wrapper-ok-cancel .alert-button-ok');
  dom.alert_cancel = document.querySelector('.alert-button-wrapper-ok-cancel .alert-button-cancel');
  dom.alert_only_ok = document.querySelector('.alert-button-wrapper-only-ok .alert-button-ok');
  dom.alert_ok_cancel_wrapper = document.querySelector('.alert-button-wrapper-ok-cancel');
  dom.alert_only_ok_wrapper = document.querySelector('.alert-button-wrapper-only-ok');
  if (opt === undefined) opt = {};
  if (opt.title === undefined) opt.title = 'Title';
  if (opt.message === undefined) opt.message = '';
  if (opt.ok === undefined) {
    opt.is_only_ok = true;
  } else {
    opt.is_only_ok = false;
  }
  var time = 200;
  var hide = () => {
    dom.alert_inner.style.transform = 'scale(0.95)';
    dom.alert_wrapper.style.opacity = 0;
    setTimeout(() => {
      dom.alert_wrapper.style.display = 'none';
    }, time);
  };
  var show = () => {
    dom.alert_wrapper.style.display = 'block';
    setTimeout(() => {
      dom.alert_inner.style.transform = 'scale(1)';
      dom.alert_wrapper.style.opacity = 1;
    },10);
  };
  var cancel = () => {
    hide();
  };
  var return_false = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  var ok = () => {
    if (opt.ok) opt.ok();
    hide();
  };
  if (opt.is_only_ok) {
    dom.alert_only_ok_wrapper.style.display = 'flex';
    dom.alert_ok_cancel_wrapper.style.display = 'none';
  } else {
    dom.alert_only_ok_wrapper.style.display = 'none';
    dom.alert_ok_cancel_wrapper.style.display = 'flex';
  
  }
  dom.alert_title.innerHTML = opt.title;
  dom.alert_message.innerHTML = opt.message;
  dom.alert_outer[click_event] = cancel;
  dom.alert_inner[click_event] = return_false;
  dom.alert_ok[click_event] = ok;
  dom.alert_cancel[click_event] = cancel;
  dom.alert_only_ok[click_event] = cancel;
  show();
}