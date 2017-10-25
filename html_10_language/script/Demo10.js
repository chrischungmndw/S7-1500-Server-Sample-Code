// i18n.js

// Variable declaration
var load_ind = true; // load_ind = false;
var elements = {};

$(window).load(function(){ // every time if the DOM refresh
$.ajaxSetup({
				mimeType : "text/plain", // to supress JSON Failure
				cache : false // avoid caching of JSON Files
			});
	$.init();

})
// Switch "language" by using the buttons
// Elements.language includes all elements with class="language"
$.init = function(){
	elements.language = $(".language");
	elements.button1 = $("#textByJavaButton1");
	elements.button2 = $("#textByJavaButton2");
	elements.output = $("#textByJava");
	
	
	//If the language is not defined set the language to english
	if($.cookie("siemens_automation_language") == null) {
		$.cookie("siemens_automation_language", "en", { path : '/'})//the cookie "siemens_automation_language" is also used by the standard webpages		
	}
	I18n.setLanguage($.cookie("siemens_automation_language"));
	
	
	// if an element with the class="language" was clicked, the language is set to the language saved in "data-lang" and the actual language is saved in the cookie "siemens_automation_language"
	elements.language.click(function () {
		I18n.setLanguage( $(this).attr("data-lang") );
		$.cookie("siemens_automation_language", $(this).attr("data-lang"), { path : '/'})
	});
	
	// Read language definition in Javascript and use it their for further tasks
	elements.button1.click(function () {
		elements.output.html( I18n.translate( "java.output1" ) );	//Change the text in the element
		elements.output.attr("data-i18n","java.output1");			//Change the property "data-i18n" of the element to the ID "java.output1"
	});
	elements.button2.click(function () {
		elements.output.html( I18n.translate( "java.output2" ) );	//Change the text in the element
		elements.output.attr("data-i18n","java.output2");			//Change the property "data-i18n" of the element to the ID "java.output1"
	});
		
	// Languagemodul initialisation
	I18n.load();
}