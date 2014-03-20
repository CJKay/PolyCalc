/*
Redistribution and use in source and binary forms are permitted provided
that the above copyright notice and this paragraph are duplicated in all
such forms and that any documentation, advertising materials, and other
materials related to such distribution and use acknowledge that the
software was developed by the . The name of the may not be used to
endorse or promote products derived from this software without specific
prior written permission. THIS SOFTWARE IS PROVIDED ``AS IS'' AND
WITHOUT ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, WITHOUT
LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE.
*/

if(!jQuery || !CSSParser) {
	alert("PolyCalc requires jQuery and JSCSSP to function. Disabling.");
} else {
	if(typeof String.prototype.startsWith != 'function') {
		String.prototype.startsWith = function(str){
			return this.indexOf(str) == 0;
		};
	}
	
	$(document).ready(function() {
		window.PolyCalc = new function() {
			this.abort = false;
			
			this.initiate = function() {
				var parser = new CSSParser();
				var styleSheets = $("style");
				
				styleSheets.each(function() {
					parseStyleSheet(parser, $(this).html());
				});
				
				styleSheets = $("link[rel='stylesheet']");
				styleSheets.each(function() {
					$.get($(this).attr("href"), function(data){
						parseStyleSheet(parser, data);
					});
				});
				
				// Do not use inline styles if you are building for Internet Explorer!
				$("*").each(function() { // $("[style*='calc(']"); fails for Chrome
					if($(this).attr("style") === undefined)
						return;
						
					if($(this).attr("style").indexOf("calc(") != -1)
						parseInline(parser, $(this));
				});
			}
			
			var parseStyleSheet = function(parser, source) {
				var styleSheet = parser.parse(source, false, false);
				
				var selectors = styleSheet.cssRules;
				for(var i = 0; i < selectors.length; ++i) {
					var selector = selectors[i];
					
					parseSelector(selector, false);
				}
			}
			
			var parseInline = function(parser, element) {
				var source = "* { " + element.attr("style") + " }";
				var style = parser.parse(source, false, false);
				
				var properties = style.cssRules[0].declarations;
				
				for(var i = 0; i < properties.length; ++i) {
					var property = properties[i];
					
					parseProperty(element, property, true);
				}
			}
			
			var parseSelector = function(selector) {
				var properties = selector.declarations;
				
				for(var i = 0; i < properties.length; ++i) {
					var property = properties[i];
					
					parseProperty(selector, property, false);
				}
			}
			
			var parseProperty = function(selector, property, elementKnown) {
				var values = property.values;
				for(var i = 0; i < values.length; ++i) {
					var value = values[i];
					
					if(!elementKnown)
						var selectorValue = selector.selectorText();
						
					var propertyValue = property.property;
					var valueValue = value.value;
					
					if(valueValue.indexOf("calc(") !== -1) {
						if(elementKnown) {
							elements = selector;
						} else {
							elements = $(selectorValue);
						}
						
						var update = function() {
							elements.each(function() {
								var newValue = parseExpression(propertyValue, valueValue, $(this)) + "px";
								$(this).css(propertyValue, newValue);
							});
						}
						
						$(window).resize(update);
						update();
					}
				}
			}
			
			var parseExpression = function(propertyValue, expression, element) {
				var newExpression = "";
				expression = expression.match(/^calc\((.+)\)$/)[1];
				
				var value = -1;
				for(var i = 0; i < expression.length; ++i) {
					var substr = expression.substring(i);
					
					var regex = substr.match(/^[\d.]+/);
					if(regex !== null) {
						value = parseFloat(regex[0], 10);
						
						i += regex[0].length - 1;
						
						continue;
					}
					
					regex = substr.match(/^([A-Za-z]+|%)/);
					if(regex !== null) {
						value = convertUnit(regex[1], "px", value, propertyValue, element);
						if(value !== -1)
							newExpression += value;
							
						i += regex[1].length - 1;
						value = -1;
							
						continue;
					}
					
					var char = expression.charAt(i);
					
					if(char == '+' || char == '-' || char == '*' || char == '/' || char == '(' || char == ')') {
						newExpression += char;
						value = -1;
					}
				}
				
				return eval(newExpression);
			}
			
			var convertUnit = function(from, to, value, propertyValue, element) {
				switch(to) {
					case "px": {
						switch(from) {
							case "px":
								return value;
							case "%":
								value *= 0.01;
								value *= parseInt(element.parent().css(propertyValue), 10);
								return value;
							case "em":
								value *= parseInt(element.parent().css("font-size"), 10);
								return value;
							case "rem":
								value *= parseInt($("body").css("font-size"), 10);
								return value;
							case "in":
								value *= 96;
								return value;
							case "pt":
								value *= 4/3;
								return value;
							case "pc":
								value *= 16;
								return value;
							case "mm":
								value *= 9.6;
								value /= 2.54
								return value;
							case "cm":
								value *= 96;
								value /= 2.54
								return value;
						}
						
						break;
					}
				}
				
				return -1;
			}
		};
		
		PolyCalc.initiate();
	});	
}
