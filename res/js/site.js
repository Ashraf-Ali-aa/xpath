
// Javascript by Hakan Bilgin (c) 2013-2015

$(function() {
	'use strict';

	var app = {
		init: function() {
			// fast references
			this.win   = $(window);
			this.body  = $('body');
			this.nav   = this.body.find('nav');
			this.cover = this.body.find('.cover');

			// initate app
			for (var n in this) {
				if (typeof(this[n].init) === 'function') {
					this[n].init();
				}
			}
			// bind handlers
			this.body.on('click', '.nolink, [data-cmd]', this.doEvent);
			this.win.on('mouseout', this.doEvent);
			this.nav.on('mouseover', '> ul > li', this.doEvent);
			this.nav.on('mouseover', this.doEvent);
			this.cover.on('mouseover', this.doEvent);
			
			// post parse gists
			this.doEvent('/post-parse-xslt-gist/');
		},
		doEvent: function(event, el) {
			var self = app,
				cmd  = (typeof(event) === 'string')? event : event.type,
				cmd_target = self,
				cmd_parts,
				twLite = TweenLite,
				srcEl,
				height;

			switch(cmd) {
				// native events
				case 'click':
					// prevent default behaviour
					if (this.nodeName === 'A') event.preventDefault();

					srcEl = $((this.nodeName === 'A')? this : event.target);
					if (srcEl.hasClass('disabled') || srcEl.parent().hasClass('disabled')) return;
					cmd = this.getAttribute('href') || this.getAttribute('data-cmd');
					// fint target object/function
					cmd_parts = cmd.slice(1,-1).split('/');
					if (cmd_parts[0] === 'goto') {
						var section = $('[data-section="'+ cmd_parts[1] +'"]');
						$('html, body').animate({scrollTop: section.offset().top - 17}, 500);
						return;
					}
					cmd_parts.filter(function(sub) {
						if (cmd_target[sub]) cmd_target = cmd_target[sub];
					});
					// call target command
					cmd_target.doEvent(cmd, srcEl, event);
					break;
				case 'mouseover':
					if (this === self.nav[0]) {
						self.nav.addClass('hover');
						return;
					}
					if (this === self.cover[0]) {
						srcEl = self.nav.find('.submenu');
						twLite.to(srcEl, 0.075, {height: 0});
						self.nav.removeClass('hover');
						return;
					}
					srcEl  = $('.submenu', this);
					if (srcEl.length) {
						height = this.childNodes[3].scrollHeight;
						twLite.to(srcEl[0], 0.075, {height: height});
					}
					break;
				// custom events
				case '/post-parse-xslt-gist/':
					var jq    = $,
						gists = jq('.gist-code.type-xslt'),
						len   = gists.length,
						str,
						node,
						lines,
						ll;
					// iterate gists
					while (len--) {
						lines  = jq('div.line', gists[len]);
						ll     = lines.length;
						// iterate lines
						while (ll--) {
							node = jq(lines[ll]);
							if (node.text().trim().indexOf('<') === 0) {
								// reset string
								str = node.text().replace(/&#160;/g, '&amp;#160;')
												.replace(/</g, '&lt;')
												.replace(/>/g, '&gt;');
								// attributes
								str = str.replace(/([\w-]+)="(.*?)"/g, '<span class="na">$1</span>="<span class="s">$2</span>"');
								// xsl tags
								str = str.replace(/(\&lt;xsl\:[\w-]+)(.*?)(\&gt;|\/\&gt;)/g, '<span class="xsl"><span class="xnt">$1</span>$2<span class="xnt">$3</span></span>');
								str = str.replace(/(\&lt;\/xsl\:[\w-]+\&gt;)/g, '<span class="xnt">$1</span>');
								str = str.replace(/(\&lt;\/xsl\:[\w-]+\&gt;)/g, '<span class="xsl">$1</span>');
								// html tags
								str = str.replace(/(\&lt;[\w\d]+\&gt;|\&lt;\/[\w\d]+\&gt;|\&lt;[\w\d]+\/\&gt;)/g, '<span class="nt">$1</span>');
								str = str.replace(/(\&lt;\w+ )(.*?)(\&gt;)/g, '<span class="nt">$1</span>$2<span class="nt">$3</span>');
								// comments
								str = str.replace(/(\&lt;!--.*?--\&gt;)/g, '<span class="c">$1</span>');
								// replace with new format
								node.html( str );
							}
						}
					}
					break;
			}
		},
		evaluator: {
			init: function() {
				// fast references
				this.evaluator   = $('.xpath-evaluator');
				this.structure   = this.evaluator.find('.structure');
				this.examples    = this.evaluator.find('.examples');
				this.textor      = this.evaluator.find('.textor');
				this.error_json  = this.evaluator.find('.error-json');
				this.error_xml   = this.evaluator.find('.error-xml');
				this.btn_row     = this.evaluator.next('.btn-row');
				this.input       = this.btn_row.find('input');
				this.btn_xml     = this.btn_row.find('a.button[href="/evaluator/switch-to-xml/"]');
				this.btn_json    = this.btn_row.find('a.button[href="/evaluator/switch-to-json/"]');
				this.btn_edit    = this.btn_row.find('a.button[href="/evaluator/toggle-edit/"]');
				this.btn_samples = this.btn_row.find('a.button[href="/evaluator/xpath-samples/"]');
				this.tab_str     = '   ';

				// some defaults
				this.mode     = 'json';
				this.snapshot = Defiant.getSnapshot(json_data);
				this.search('//book[3]');

				// bind handlers
				this.input.on('keyup', this.doEvent)
					.val(this.xpath);

				// init evaluator
				this.doEvent('/evaluator/xpath-samples/');
			//	this.doEvent('/evaluator/toggle-edit/');

				setTimeout(function() {
			//		app.evaluator.textor.val('{price: 12.99}');
			//		app.evaluator.btn_edit.trigger('click');
				}, 200);
			},
			doEvent: function(event, el, eOriginal) {
				var root = app,
					self = root.evaluator,
					cmd  = (typeof(event) === 'string')? event : event.type,
					dialog,
					srcEl,
					xpath;

				switch(cmd) {
					// native events
					case 'keyup':
						xpath = self.input.val();
						try {
							JSON.search(self.snapshot, xpath);
						} catch(e) {
							self.input.addClass('error');
							return;
						}
						self.search(xpath);
						self.input.removeClass('error');
						break;
					// custom events
					case '/evaluator/toggle-edit/':
						var is_edit = self.btn_edit.hasClass('active'),
							str,
							test,
							valid_json;
						
						if (is_edit) {
							str = self.textor.val().replace(/\n|\t/g, '');
							valid_json = self.try_parse_json(str);
							if (!valid_json) return;

							// store valid json in the global scope
							json_data = valid_json;

							self.snapshot = Defiant.getSnapshot(json_data);
							self.search(self.xpath);

							self.btn_samples.removeClass('disabled');
							self.btn_edit.removeClass('active');
							self.textor.removeClass('active');
							self.doEvent('/evaluator/xpath-samples/');
						} else {
							str = (self.mode === 'json')?
									JSON.stringify(json_data, null, '\t').replace(/\t/g, self.tab_str) :
									Defiant.node.prettyPrint( JSON.toXML(json_data) );
							self.textor.val(str);

							self.btn_samples.addClass('disabled');
							self.btn_edit.addClass('active');
							self.textor.addClass('active');
							self.doEvent('/evaluator/xpath-samples/', true);

							setTimeout(function() {
								self.textor.focus();
							},10);
						}
						break;
					case '/evaluator/eval-xpath/':
						if (el.hasClass('nolink')) {
							xpath = el.text();
						}
						if (el.hasClass('button')) {
							xpath = self.input.val();
						}
						self.input.val(xpath);
						self.search(xpath);
						break;
					case '/evaluator/switch-to-json/':
						if (self.btn_json.hasClass('active')) return;
						self.btn_edit.removeClass('disabled');
						self.btn_xml.removeClass('active');
						self.btn_json.addClass('active');
						self.mode = 'json';
						// render json
						self.search(self.xpath);
						break;
					case '/evaluator/switch-to-xml/':
						if (self.btn_xml.hasClass('active')) return;
						self.btn_edit.addClass('disabled');
						self.btn_xml.addClass('active');
						self.btn_json.removeClass('active');
						self.mode = 'xml';
						// render xml
						self.search(self.xpath);
						break;
					case '/evaluator/xpath-samples/':
						var do_hide = arguments[1] === true;
						if (self.examples.hasClass('show') || do_hide) {
							self.examples.removeClass('show');
							self.btn_samples.removeClass('active');
						} else {
							self.examples.addClass('show');
							self.btn_samples.addClass('active');
						}
						break;
				}
			},
			search: function(xpath) {
				var jss;
				this.xpath = xpath;

				switch (this.mode) {
					case 'json':
						jss = JSON.search(this.snapshot, xpath);
						this.render_json(json_data, jss);
						// Developer hint
						console.log('DEV HINT! Try XPath from the console directly by pasting this in to edit field:\n',
									'JSON.search(json_data, "'+ xpath +'")', '->', jss);
						break;
					case 'xml':
						var doc  = JSON.toXML(json_data),
							xres = Defiant.node.selectNodes(doc, xpath),
							uniq = this.simple_id(),
							i    = 0,
							il   = xres.length,
							ll;
						for (; i<il; i++) {
							if (xres[i].ownerDocument.documentElement === xres[i]) continue;
							switch (xres[i].nodeType) {
								case 1: // type: node
									ll = Defiant.node.prettyPrint(xres[i]).match(/\n/g);
									ll = (ll === null) ? 0 : ll.length;
									xres[i].setAttribute(uniq, ll);
									break;
								case 2: // type: attribute
									xres[i].ownerElement.setAttribute(uniq, xres[i].name);
									break;
								case 3: // type: text
									xres[i].parentNode.setAttribute(uniq, '#text');
									break;
							}
						}
						this.uniq = uniq;
						this.render_xml(doc);
						// Developer hint
						console.log('DEV HINT! Try XPath from the console directly by pasting this in to edit field:\n',
									'JSON.search(json_data, "'+ xpath +'")', '->', jss);
						break;
				}
			},
			render_json: function(matches) {
				var obj    = json_data,
					str    = JSON.stringify(obj, null, '\t'),
					_trace = JSON.trace || [],
					lines  = str.split('\n'),
					gutter = '',
					ld     = '',
					i      = 0,
					j      = 0,
					il     = lines.length,
					jl     = _trace.length,
					hl     = [],
					ls,
					mlc,
					htm;
				
				for (; j<jl; j++) {
					for (var k=0; k<_trace[j][1]+1; k++) {
						hl.push(_trace[j][0]+k-1);
					}
				}
				for (; i<il; i++) {
					mlc = '';
					// highlighting
					ls = lines[i].replace(/\t/g, this.tab_str);
					// key-value pairs
					ls = ls.replace(/(".*?"): (".*?"|[\d\.]{1,})/ig, '<span class="s1">$1</span>: <span class="s2">$2</span>');
					ls = ls.replace(/(   )(".*?"|".*?",)$/igm, '$1<span class="s2">$2</span>');
					ls = ls.replace(/(".*?"): (\W)/ig, '<span class="s1">$1</span>: $2');
					// highlight matching lines
					if (hl.indexOf(i) > -1) {
						mlc = 'ml';
						ls = '<span class="ml">'+ ls +'</span>';
					}
					// prepare html
					ld += '<div class="line '+ mlc +'">'+ ls +'</div>';
					gutter += '<span class="'+ mlc +'">'+ (i+1) +'</span>';
				}
				htm = '<table><tr>'+
					  '<td class="gutter">'+ gutter +'</td>'+
					  '<td class="line-data"><pre>'+ ld +'</pre></td>'+
					  '</tr></table>';
				this.structure.html(htm);
				this.mode = 'json';

				//$('textarea.paste_data').val(str.replace(/\t/g, this.tab_str));
			},
			render_xml: function(obj) {
				var doc    = (obj.constructor === Object) ? JSON.toXML(obj) : obj,
					str    = Defiant.node
									.prettyPrint(doc)
									.replace(/</g, '&lt;')
									.replace(/>/g, '&gt;'),
					lines  = str.split('\n'),
					gutter = '',
					ld     = '',
					i      = 0,
					il     = lines.length,
					hl     = {
						index : 0,
						rgx   : new RegExp('( '+ this.uniq +')="(.*?)"'),
						attr  : false,
						check : false
					},
					ls,
					mlc,
					htm;
				for (; i<il; i++) {
					mlc = '';
					// highlighting
					ls = lines[i].replace(/\t/g, this.tab_str);
					// xml declaration
					ls = ls.replace(/(&lt;\?.*?\?&gt;)/i, '<span class="dc">$1</span>');
					if (i > 0) {
						// collect info; matching lines
						hl.check = ls.match(hl.rgx);
						if (hl.check !== null) {
							hl.line    = +hl.check[2];
							hl.attr    = isNaN(hl.line);
							hl.is_text = hl.check[2] === '#text';
							hl.index   = i + hl.line + 1;
							ls         = ls.replace(hl.rgx, '');
						}
						// attributes
						ls = ls.replace(/([\w-\:]+)="(.*?)"/g, '<span class="na">$1</span>="<span class="s">$2</span>"');
						// nodes
						ls = ls.replace(/(\&lt;[\w\d:]+\&gt;|\&lt;\/[\w\d:]+\&gt;|\&lt;[\w\d:]+\/\&gt;)/g, '<span class="nt">$1</span>');
						ls = ls.replace(/(\&lt;\w+ )(.*?)(\&gt;)/g, '<span class="nt">$1</span>$2<span class="nt">$3</span>');
						ls = ls.replace(/(\&lt;|\&gt;)/g, '<span class="p">$1</span>');
						// highlight matching lines
						if (hl.is_text) {
							ls = ls.replace(/(<\/span><\/span>)(.*?)(<span class="nt"><span)/, '$1<span class="mal">$2</span>$3');
							hl.is_text = false;
						} else if (hl.check !== null && hl.attr) {
							hl.rx2 = new RegExp('(<span class="na">'+ hl.check[2] +'<.span>="<span .*?<.span>")', 'i');
							ls = ls.replace(hl.rx2, '<span class="mal">$1</span>');
						} else if (hl.check !== null || i < hl.index) {
							mlc = 'ml';
							ls = '<span class="ml">'+ ls +'</span>';
						}
					}
					if (i > 0 && this.xpath === '//*') {
						mlc = 'ml';
						if (ls.indexOf(' class="ml"') === -1) {
							ls = '<span class="ml">'+ ls +'</span>';
						}
					}
					// prepare html
					ld     += '<div class="line '+ mlc +'">'+ ls +'</div>';
					gutter += '<span>'+ (i+1) +'</span>';
				}
				htm = '<table><tr>'+
					  '<td class="gutter">'+ gutter +'</td>'+
					  '<td class="line-data"><pre>'+ ld +'</pre></td>'+
					  '</tr></table>';
				this.structure.html( htm );
				this.mode = 'xml';
				// making xml global - see notes in the begining of this file
				xml_data = doc;

				//str = Defiant.node.prettyPrint(doc).replace(/\t/g, this.tab_str);
				//$('textarea.paste_data').val( str );
			},
			try_parse_json: function(str, is_second_try) {
				var self = this,
					repair,
					test;
				// try parsing string
				try {
					test = JSON.parse(str);
				} catch (e) {
					if (!is_second_try) {
						// try repairing JSON
						repair = str.replace(/(\w+):/g, '"$1":');
						return self.try_parse_json(repair, true);
					}
					// show error message
					self.error_json.fadeIn(120);
					// hide error message
					setTimeout(function() {
						self.error_json.fadeOut(300);
					}, 2000);
					return;
				}
				return test;
			},
			simple_id: function() {
				var s = 'abcdefghijklmnopqrstuvwxyz',
					b = +(Math.random().toString().slice(2)),
					t = ((new Date()).valueOf() + b).toString(),
					u = '';
				s = s + s.toUpperCase();
				for (var i=0, l, n; i<(t.length/2); i++) {
					l = i*2;
					n = +(t.slice(l, l+2));
					u += s.charAt(n%s.length);
				}
				return u;
			}
		}
	};

	app.init();

	// publish object
	window.app = app;

});

/*
 * The variable "json_data" is made global.
 * This is in case the visitor wants to make searches via the console.
 * 
 * The variable "xml_data" will be set when json_data is parsed.
 */
var xml_data,
	json_data = { "store": {
		"book": [ 
			{
				"title": "Sword of Honour",
				"category": "fiction",
				"author": "Evelyn Waugh",
				"@price": 12.99
			},
			{
				"title": "Moby Dick",
				"category": "fiction",
				"author": "Herman Melville",
				"isbn": "0-553-21311-3",
				"@price": 8.99
			},
			{
				"title": "Sayings of the Century",
				"category": "reference",
				"author": "Nigel Rees",
				"@price": 8.95
			},
			{
				"title": "The Lord of the Rings",
				"category": "fiction",
				"author": "J. R. R. Tolkien",
				"isbn": "0-395-19395-8",
				"@price": 22.99
			}
		],
			"bicycle": {
				"brand": "Cannondale",
				"color": "red",
				"@price": 19.95
			}
		}
	};

	// enable search trace, for visual highlighting
	Defiant.env = 'development';
