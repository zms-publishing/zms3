// GLOBALS
// Remember the zmslightboxed object
var zmslightbox_obj;
var viewport = $('meta[name="viewport"]').attr('content');

// CONSTRUCTION
function add_zmslightbox(hiurl) {
	$('body').wrapInner('<section id="zmslightbox-mask"></section>')
	$('body').append('<figure id="zmslightbox">\
			<div id="zmslightbox-bg" onclick="remove_zmslightbox()"></div>\
			<div id="zmslightbox-controls" onclick="remove_zmslightbox()"><span id="close-zmslightbox">Close Lightbox</span></div>\
			<div id="zmslightbox-wrapper"><img src="'+hiurl+'" /></div>\
		</figure>');
	$('#zmslightbox-wrapper img').on('click', function() {
			$(this).toggleClass('fullimage');
			// console.log($(this).width() + ' x ' + $(this).height());
			if ( $(this).width() > $(window).width() || $(this).height() > $(window).height() ){
				release_zmslightbox();
				$(window).scrollLeft($(window).width()/2);
				$(window).scrollTop($(window).height()/2);
			} else {
			 	$(this).addClass('fullscreen');
			};
			center_zmslightbox($('#zmslightbox-wrapper img'));
	});
	$('#zmslightbox-wrapper img').hide();
	$('body').addClass('zmslightbox');
	handle_zmslightbox_history();
};

// REMOVAL
function remove_zmslightbox(evt_from_history) {
	evt_from_history = evt_from_history || false;
	$('meta[name="viewport"]').attr('content',viewport);
	$('#zmslightbox').remove();
	$('body > #zmslightbox-mask').contents().unwrap();
	$('body').removeClass('zmslightbox');
	$('body').removeClass('masked');
	$('html, body').scrollTop( zmslightbox_obj.offset().top );
	if (!evt_from_history) { history.back() };
};

// CENTERING
function center_zmslightbox(imgobj) {
	var ww = $(window).width();
	var wh = $(window).height();
	var wt = $(window).scrollTop();
	var cx = ww/2;
	var cy = wt + wh/2;
	var iw = imgobj.width();
	var ih = imgobj.height();
	// console.log('imgobj.height: ' + ih);
	if ( wh > $('body').height() ) {
		$('#zmslightbox-bg').css('height', wh+'px');
	} else {
		$('#zmslightbox-bg').css('height',$('body').height()+'px');
	};
	if ( ih > wh && !( imgobj.hasClass('fullimage') ) ) {
		imgobj.css('height',$(window).height() + 'px');
		iw = imgobj.width();
		ih = imgobj.height();
	} else {
		imgobj.css('height','auto');
	};
	var c_il = cx-(0.5*iw);
	var c_it = cy-(0.5*ih);
	$('#zmslightbox-wrapper').css('top',c_it + 'px');
	if ( ih + c_it > $(window).height() && $('body').hasClass('masked') ) {
		$('#zmslightbox-wrapper').css('top',0);
	};
	$('#zmslightbox-wrapper img').show('slow');
};

// SUPERSIZING
// Show modal content exclusively to allow window scrolling
function release_zmslightbox(){
	if ($('meta[name="viewport"]')) {
		$('meta[name="viewport"]').attr('content','width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
	} else {
		$('head').append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />');
	}
	$('body').addClass('masked');
	$('body > #zmslightbox-mask').hide();
	$('#zmslightbox-wrapper').css('top',0);
	$('#zmslightbox-bg').css('height','100%');
};

// HANDLE WINDOW EVENTS:
// Resize, Device Rotation, History-Back
$(window).resize(function() {
	try {
		center_zmslightbox($('#zmslightbox-wrapper img'))
	} catch(err) {
		return false;
	}
});
window.onorientationchange = function() {
	try {
		center_zmslightbox($('#zmslightbox-wrapper img'))
	} catch(err) {
		return false;
	}
};
$(document).on('keyup',function(evt) {
	if (evt.keyCode ==27 || evt.keyCode == 8 ) {
		remove_zmslightbox();
	};
});
function handle_zmslightbox_history() {
	if (typeof history.pushState === 'function') {
		history.pushState(null, 'ZMSLightBox', null);
		window.onpopstate = function () {
			if ($('#zmslightbox') ) {
				// HISTORY.BACK TO CONTENT PAGE
				remove_zmslightbox(evt_from_history=true);
			};
		};
	};
};


// #################################
// EXECUTION
// #################################
function show_zmslightbox(img) {
	zmslightbox_obj = img;
	add_zmslightbox(img.attr('data-hiresimg'));
	$('#zmslightbox-wrapper img').load( function() {
		center_zmslightbox($('#zmslightbox-wrapper img'));
	});
};
