"use strict"; // Defines that JavaScript code should be executed in "strict mode".
// 		i18n.js
//		Add some features --> diffrent TAGS have differend attributes

var I18n = (function($) {
	var dictionary = {};
	var language = "de";

	// returns the assosiate language text
	// key from Attribut 'data-i18n'
	function translate(key) {
		var item, text;
		if (key == undefined) {
			translateLabels();
			return;
		}
		item = dictionary[key];
		if (item) {
			text = item[language];
			if (text) {
				return text;
			}
		}
		// now text found: return KEY
		return key;
	}

	// replace text of all elements with data-i18n attribut
	function translateLabels() {
		var item, text, key;
		$("[data-i18n]").each(function() {
			key = $(this).attr("data-i18n");
			item = dictionary[key];
			if (item) {
				text = item[language];
				if (text) {
					//console.log( $(this).prop('tagName') );
					//console.log( $(this).prop('tagName') == "H1" );
					if( $(this).prop('tagName') == "H1" ) {
						$(this).prop('title', text).html(text);
					}
					else if( $(this).parent().prop('tagName') == "H1" ) {
						$(this).parent().prop('title', text);
						$(this).html(text);
					}
					else if( $(this).prop('tagName') == "IMG" ) {
						$(this).prop({title: text, alt: text});
					}
					else if( $(this).prop('tagName') == "BUTTON" ) {
						$(this).prop({alt: text}).html(text);
					}
					else if( $(this).prop('tagName') == "A" ) {
						$(this).prop({title: text, alt: text, hreflang: language}).html(text);
					}
					else {
						$(this).html(text);
					}
					return true;
				}
			}
			// if there is no ENTRY for KEY or LANGUAGE --> return KEY
			$(this).html(key);
		});
	}

	// Load languaqge definition file to var dictionary
	function load() {
		var filename = "script/i18n.txt";
		//$.ajax({ type: "POST", url: url, data: "", dataType: "text"})
		$.post(filename,"")
			.done(function(retData) {
				var jsontext = "";
				var lines = retData.split("\r\n");
				$.each(lines, function(index, line) { // iterate trough lines
					if (line.length == 0)	// no content in line
						return true;		// continue
					if (line[0] == "#")		// line is a comment
						return true;		// continue
					jsontext += line;		// lione belongs to JSON Format
				});
				dictionary = $.extend({}, $.parseJSON(jsontext));
				translate();
			})
			.fail(function() {
				console.error("Unable to load '" + filename + "' (I18n.load)");
				return false;
			}); // ajax POST()
	}

	// Set actual language and call translate() to change language in webinterface
	// Parameter:
	//	newlanguage {string}
	//		new language identifier, example: "de", "en".
	//	A valid idendiefiere is necsessary and will not proved
	function setLanguage(newlanguage) {
		// if language is allready set --> do nothing
		if (newlanguage == language) return true;
		// else set new language
		language = newlanguage;
		// call translate() to change language in webinterface 
		translateLabels();
	}

	// INITIALISIERUNG
	// determine browser language
	language = window.navigator.userLanguage || window.navigator.language;
	language = language.substr(0, 2);

	return {
		load: load,
		setLanguage: setLanguage,
		translate: translate
	}
})(jQuery)
