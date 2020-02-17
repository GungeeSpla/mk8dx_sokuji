/*--------------------------------------------------------------------------*
 *  
 *  MySuggest.js
 *  
 *  MIT-style license. 
 *  
 *  2019 nocho
 *  http://kinocolog.com
 *  
 *--------------------------------------------------------------------------*/

(function($){
	
	$.fn.MySuggest = function(options){
		
		$(this).each(function(i){
			
			var MY_PARENT = $(this);
			
			MY_PARENT.css('margin-bottom', '0');
			
			var defaults = {
				msArrayList : [],
				msListCount : 10,
				msFormAutoSubmit : false,
				msAjaxUrl : '',
				msAjaxParam : 'str',
				msRegExpAll : false,
				msSpScroll : false,
				msMinLength : 1
			};
	
			var setting = $.extend(defaults, options);
			var elm_list;
			var elm_active = -1;
			var key_last_time = 0;
			var key_down_flg = false;
			var key_down_text;
			var click_flg = false;
			
			/* 19/08/27 update */
			MY_PARENT.next('[data-mysuggest]').remove();
			MY_PARENT.after('<div data-mysuggest="true"><ul></ul></div>');
			
			var msArrayListConvert = [];
			
			if(setting.msArrayList){
				$.each(setting.msArrayList, function(i, value){
					if($.isArray(value)){
						var sub_array = [];
						$.each(value, function(i2, value2){
							sub_array.push(value2.toKatakanaCase().toHankakuCase());
						});
						msArrayListConvert.push(sub_array);
					}else{
						msArrayListConvert.push(value.toKatakanaCase().toHankakuCase());
					}
				});
			}
			
			MY_PARENT.off('click');
			MY_PARENT.on('click', function(){
				if(!setting.msSpScroll) return false;
				if(_ua.Mobile){
					var position = MY_PARENT.offset().top;
					$('body,html').animate({scrollTop: (position - 10)}, 300);	
				}
			});
			
			MY_PARENT.next('[data-mysuggest]').on('touchstart', function(e){
				$(e.target).addClass('totch');
			});
			MY_PARENT.next('[data-mysuggest]').on('touchend', function(e){
				$(e.target).removeClass('totch');
			});
			
			MY_PARENT.off('input');
			MY_PARENT.on('input', function(){
				
				if(click_flg) return false;
				
				MY_PARENT.next('[data-mysuggest]').find('ul').css('width', MY_PARENT.outerWidth() + 'px');
				
				key_down_flg = false;
	
				if(MY_PARENT.val() == "" || setting.msMinLength > MY_PARENT.val().length){
					MY_PARENT.next('[data-mysuggest]').find('ul').empty();
					elm_active = -1;
					return;
				}
				
				if(setting.msArrayList.length > 0){
					
					var list = [];
					var regCheck;
					var now_word = MY_PARENT.val().toKatakanaCase().toHankakuCase();
	
					if(setting.msRegExpAll){
						regCheck = new RegExp("(" + escapeSelectorStr(now_word) + ")", "i");
					}else{
						regCheck = new RegExp("^(" + escapeSelectorStr(now_word) + ")", "i");
					}
					
					var full_match = false;
					
					$.each(msArrayListConvert, function(i, value){
						if($.isArray(value)){
							$.each(value, function(i2, value2){
								if(value2.match(regCheck)){
									list.push(setting.msArrayList[i][0]);
									return false;
								}
							});
							if(MY_PARENT.val() == value[0]){
								full_match = true;
							}
						}else{
							if(value.match(regCheck)){
								list.push(setting.msArrayList[i]);
							}
							if(MY_PARENT.val() == value){
								full_match = true;
							}
						}
					});
					
					if(full_match){
						MY_PARENT.trigger('matched', MY_PARENT.val());
					}
					
					list = list.slice(0, setting.msListCount);
					
					MY_PARENT.next('[data-mysuggest]').find('ul').empty();
					$.each(list, function(i, value){
						MY_PARENT.next('[data-mysuggest]').find('ul').append('<li>' + value + '</li>');
					});
	
				}else if(setting.msAjaxUrl && setting.msAjaxParam){
					var param = {};
					param[setting.msAjaxParam] = MY_PARENT.val();
					$.ajax({
						url : setting.msAjaxUrl,
						type : "POST",
						cache : false,
						dataType : "json",
						data : param,
						success : function(list){
							MY_PARENT.next('[data-mysuggest]').find('ul').empty();
							$.each(list, function(i, value){
								if(i >= setting.msListCount) return false;
								MY_PARENT.next('[data-mysuggest]').find('ul').append('<li>' + value + '</li>');
							});
						}
					});
				}
				
			});
			
			MY_PARENT.next('[data-mysuggest]').on('mousedown', function(e){
				click_flg = true;
				MY_PARENT.blur();
				if($(e.target).html().indexOf("<li>") == -1 && $(e.target).html().indexOf("</li>") == -1){
					MY_PARENT.val($(e.target).text());
				}
				elm_active = -1;
				MY_PARENT.next('[data-mysuggest]').find('ul').empty();
				MY_PARENT.trigger('selected', MY_PARENT.val());
			});
			
			MY_PARENT.off('blur');	
			MY_PARENT.on('blur', function(){
				setTimeout(function(){
					elm_active = -1;
					click_flg = false;
					MY_PARENT.next('[data-mysuggest]').find('ul').empty();
				}, 100);
			});
			
			MY_PARENT.off('keydown');
			MY_PARENT.on('keydown', function(evnt){
				
				if(!MY_PARENT.next('[data-mysuggest]').find('ul')) return false;
				
				if(!key_down_flg){
					key_down_flg = true;
					key_down_text = MY_PARENT.val();
				}
				
				if(evnt.keyCode == 40 || evnt.keyCode == 38){
					if(!MY_PARENT.next('[data-mysuggest]').find('ul').find('li').length) return false;
					var elm_cnt = MY_PARENT.next('[data-mysuggest]').find('ul').find('li').length;
					if(evnt.keyCode == 40){
						if((elm_cnt-1) > elm_active){
							elm_active++;
						}
					}
					if(evnt.keyCode == 38){
						if(elm_active >= 0){
							elm_active--;
						}
					}
					
					MY_PARENT.next('[data-mysuggest]').find('ul').find('li').removeClass('totch');
					
					if(elm_active >= 0){
						MY_PARENT.next('[data-mysuggest]').find('ul').find('li').eq(elm_active).addClass('totch');
					}
					
					var text = MY_PARENT.next('[data-mysuggest]').find('ul').find('li').eq(elm_active).text();
					if(evnt.keyCode == 38 && elm_active == -1) text = key_down_text;
					MY_PARENT.val(text);
				}
				
				if(evnt.keyCode == 13){
					if(elm_active >= 0){
						MY_PARENT.next('[data-mysuggest]').find('ul').empty();
						elm_active = -1;
						MY_PARENT.trigger('selected', MY_PARENT.val());
					}
				}
			});
		});
	}
	
	var _ua = (function(u){
		return {
			Tablet:(u.indexOf("windows") != -1 && u.indexOf("touch") != -1 && u.indexOf("tablet pc") == -1) 
				|| u.indexOf("ipad") != -1
				|| (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
				|| (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
				|| u.indexOf("kindle") != -1
				|| u.indexOf("silk") != -1
				|| u.indexOf("playbook") != -1,
			Mobile:(u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
				|| u.indexOf("iphone") != -1
				|| u.indexOf("ipod") != -1
				|| (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
				|| (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
				|| u.indexOf("blackberry") != -1
		}
	})(window.navigator.userAgent.toLowerCase());
	
	function escapeSelectorStr(val){
		return val.replace(/[ !"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, "\\$&");
	}
	
	// kanaXs
	// https://github.com/shogo4405/KanaXS.git
	String.prototype.toKatakanaCase=function(){for(var a,b=this.length,c=[];b--;)a=this.charCodeAt(b),c[b]=12353<=a&&12438>=a?a+96:a;return String.fromCharCode.apply(null,c)};String.prototype.toHankakuCase=function(){for(var a,b=this.length,c=[];b--;)switch(a=c[b]=this.charCodeAt(b),!0){case 65281<=a&&65374>=a:c[b]-=65248;break;case 12288==a:c[b]=32}return String.fromCharCode.apply(null,c)};

	
})(jQuery);