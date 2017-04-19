/*!
*	@Author: 	Erik Schlegel
*	@Ver: 		1.0.1
*	@GitHub: 	https://github.com/Erik-Schlegel/shrinkable/new/master
*	@Site: 		erikschlegel.io
*/

/*
Intent:
	Provide a performant method for auto-scaling css values in relation to an specified parent element's scale.
	--Typically used in responsive web design where elements are sized using percentages and max / min width.
*/

(
	function(root, factory)
	{
		if (typeof define === 'function' && define.amd)
		{
			define([], factory);
		}
		else if (typeof module === 'object' && module.exports)
		{
			module.exports = factory();
		}
		else
		{
			root.Shrinkable = factory();
		}
	}(
		this,
		function()
		{


			var Shrinkable = function(el, fullWidth, minScale, watchStyles)
			{
				///<param name="el" type="HTMLElement">The element to which to apply shrinking-content functionality.</param>
				///<param name="fullWidth" type="int">The pre-shrinkage pixel-width of el.</param>
				///<param name="minScale" type="number">The scale below which shrinking will not progress.</param>
				///<param name="watchStyles" type="string[]" optional="true">The css styles (keys only) to which to apply shrinkage.</param>

				var	_el = el,
					_fullWidth = fullWidth,
					_minScale = minScale,
					_watchStyles = watchStyles || ['font-size','line-height','padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left','top','right','bottom','left'],

					_encapsulatingFontSize = null,
					_encapsulatingFontUnits = null,
					_pxInRem = null;


				var _recurseElement = function(element, parentEmSize)
				{
					///<summary>Recursively walk through an element's children.</summary>
					///<param name="element" type="HTMLElement">The element to recurse.</param>
					///<param name="parentEmSize" type="int" optional="true">Number of pixels in one em. Note the first call to this function should not supply this value.</param>

					if(element.nodeType === 1)
					{
						var pxInEm = _getPixelsInOneEm(element);
						for(var i=0, len=element.childNodes.length; i < len; i++)
						{
							if(pxInEm > 0)
							{
								_recurseElement(element.childNodes[i], pxInEm);
							}
						}

						if(parentEmSize) //not the starting / root element
						{
							_convertStylesToEm(element, parentEmSize);
							// debugger;
							if(element.style &&
								element.style.lineHeight != '' &&
								element.style.fontSize != '')
							{
								element.style.lineheight = (parseFloat(element.style.fontSize) / parseFloat(element.style.lineHeight)) + 'em';
							}
						}
					}
				};


				var _getAppliedCSS = function(el)
				{
					///<summary>Get CSS applied to a supplied element.</summary>
					///<param name="el" type="HTMLElement">The element for which applied CSS should be retrieved.</param>
					///<returns type="string"></returns>

					var	sheets = document.styleSheets,
						cssArray = [];

					el.matches = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector || el.msMatchesSelector || el.oMatchesSelector;
					for (var i in sheets)
					{
						var rules = sheets[i].rules || sheets[i].cssRules;
						for (var r in rules)
						{
							try {
								if (el.matches(rules[r].selectorText))
								{
									cssArray.push(rules[r].cssText);
								}
							}
							catch(ex)
							{
								//IOS Chrome errors at '::' pseudo selectors.
							}
						}
					}
					return cssArray.join('');
				};


				var _enable = function()
				{
					///<summary>Enable content-shrinking behavior.</summary>

					window.addEventListener('resize', _shrink);
					_shrink();
					return this;
				};


				var _disable = function()
				{
					///<summary>Disable content-shrinking behavior.</summary>

					window.removeEventListener('resize', _shrink);
					_normalize();
					return this;
				};


				var _shrink = function()
				{
					///<summary>Resize HTML content with respect to the parent's percent width change. </summary>

					_el.style.fontSize = _encapsulatingFontSize * _getScale(_fullWidth, _el.clientWidth) + _encapsulatingFontUnits;
				};


				var _normalize = function()
				{
					///<summary>Restore HTML content to its original scale</summary>

					_el.style.fontSize = _encapsulatingFontSize + _encapsulatingFontUnits;
				}


				var _getScale = function(baseValue, scaledValue)
				{
					///<summary>Get the percent by which a base value must increase or decrease to arrive at a second value.</summary>
					///<param name="baseValue" type="number">The starting value from which percentage change will be evaluated.</param>
					///<param name="scaledValue" type="number">The value to which a baseValue is scaled.</param>
					///<returns type="number"></summary>

					return (0 >= baseValue) ?
						0 :
						parseFloat((100 * scaledValue / baseValue).toFixed(2)) / 100
				};


				var _getPixelsInOneEm = function(el)
				{
					///<summary>Calculate and retrieve the number of pixels to which one em evaluates in a given element's context.</summary>
					///<param name="el" type="HTMLElement"></param>
					///<returns type="int"></returns>

					return _getPxSizeOfTestElement(el, 'em');
				};


				var _getPixelsInOneRem = function()
				{
					///<summary>Calculate and retrieve the number of pixels to which one rem evaluates.</summary>
					///<returns type="int"></returns>

					if(!_pxInRem)
					{
						_pxInRem = _getPxSizeOfTestElement(document.documentElement, 'rem');
					}
					return _pxInRem;
				};


				var _getPxSizeOfTestElement = function(el, unitType)
				{
					///<summary>Get the pixel-height of a single font-unit measurement as evaluated in a given HTML context.</summary>
					///<param name="el" type="HTMLElement">HTMLElement context in which to evaluate the unit size.</param>
					///<param name="unitType" type="string">The font unit type to evaluate. Commonly: rem or em.</param>
					///<returns type="int"></returns>

					var htmlString = '<div style=" font-size:1' + unitType + '; position:absolute; left:-10000px; margin:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0; padding:0; padding-top:0; padding-right:0; padding-bottom:0; padding-left:0; line-height:1; border:0; bottom:initial; right:initial">ToEm</div>';
					var testEl = _appendHtmlNode(el, htmlString);
					var answer = testEl.clientHeight;
					_removeHtmlNode(testEl);
					return answer;
				};


				var _convertStylesToEm = function(element, parentEmSize)
				{
					///<summary>Convert an element's applied style values to 'em' units.</summary>
					///<param name="element" type="HTMLElement">The element whose styles will be converted.</param>
					///<param name="parentEmSize" type="number">The number of pixels 1em evaluates to in the parent element.</param>

					var computedValue = window.getComputedStyle(element);
					var cssAppliedStyles = _getAppliedCSS(element);
					var value, emValue;

					for(var i=0, len=_watchStyles.length; i<len; i++)
					{

						//if element is actually set (vs just computed) in CSS.
						if(cssAppliedStyles.indexOf(_watchStyles[i]) > -1)
						{
							value = computedValue[_watchStyles[i]];
							emValue = _getStyleValueInEm(value, parentEmSize);

							if(value != emValue)
							{

								//rectify line-height against any updated font-size em value;
								if(_watchStyles[i] == 'line-height')
								{
									emValue = (parseFloat(emValue) / parseFloat(element.style.fontSize)) + 'em';
								}

								element.style[_watchStyles[i]] = emValue;
							}
						}
					}

				};


				var _getStyleValueInEm = function(styleValue, parentEmSize)
				{
					///<summary>Convert a css value string to em units.</summary>
					///<param name="styleValue" type="string">The style value to convert.</param>
					///<param name="parentEmSize" type="number">The number of pixels to which one 'em' evaluates in the parent element.</param>
					///<returns type="string"></returns>

					var value = parseInt(styleValue);
					if(value)
					{
						//TODO: handle complex values like "0 0 0 0 !important"
						return (value/parentEmSize).toFixed(2)+'em';
					}
					return styleValue;
				};


				var _appendHtmlNode = function(parent, html)
				{
					///<summary>Appends a new element stub to the specified parentElement and returns the result.</summary>
					///<param name="parent"></param>
					///<param name="html"></param>
					///<returns type="HTMLElement"></returns>

					var stubNode = document.createElement("div");
					stubNode.innerHTML += html;
					var nodeReference = stubNode.children[0];
					parent.appendChild(nodeReference);
					return nodeReference;
				};


				var _removeHtmlNode = function(nodeReference)
				{
					///<summary>Remove a specified HTMLElement from the document.</summary>
					///<param name="nodeReference" type="HTMLElement"></param>
					///<returns>void</returns>

					if(nodeReference)
					{
						nodeReference.parentNode.removeChild(nodeReference);
					}
				};


				var _initialize = function()
				{
					if(!_watchStyles['font-size'])
					{
						_watchStyles.push('font-size');
					}
					var encapsulatingFont = window.getComputedStyle(_el)['font-size'];
					_encapsulatingFontSize = encapsulatingFont.match(/\d+/)[0];
					_encapsulatingFontUnits = encapsulatingFont.match(/[a-z]+/i)[0];
					_recurseElement(_el);
				}();


				return {
					Shrink: _shrink,
					Enable: _enable,
					Disable: _disable
				}


			};

			return Shrinkable;

		}

	)
);
