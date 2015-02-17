/**
 * Get url-parameter.
 *
 * @sParam the name of the parameter
 * @sDefault the default-value
 */
function GetURLParameter(sParam, sDefault) {
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) {
      var parameterValue = sParameterName[1]
            .replace(/\+/gi,' ')
            .replace(/%23/gi,'#')
            .replace(/%24/gi,'$')
            .replace(/%26/gi,'&')
            .replace(/%2B/gi,'+')
            .replace(/%2C/gi,',')
            .replace(/%2F/gi,'/')
            .replace(/%3A/gi,':')
            .replace(/%3B/gi,';')
            .replace(/%3D/gi,'=')
            .replace(/%3F/gi,'?');
      try {
        return decodeURI(parameterValue);
      }
      catch (e) {
        return parameterValue;
      }
    }
  }
  return sDefault;
}

/**
 * Assemble url-parameters:
 *
 * add parameters from dict to url (overwrite existing values).
 * @param url the url
 * @param d the dictionary of parameters to be added to the url.
 */
function AssembleUrlParameter(url,d) {
  if (url.indexOf("?") > 0) {
    var sPageURL = url.substr(url.indexOf("?")+1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
      var sURLVariable = sURLVariables[i].split('=');
      var sParameterName = sURLVariable[0];
      var sParameterValue = sURLVariable[1];
      if (typeof d[sParameterName]=="undefined") {
        d[sParameterName] = sParameterValue;
      }
    }
    url = url.substr(0,url.indexOf("?"));
  }
  var dl = "?";
  for (var sParameterName in d) {
    url += dl + sParameterName + "=" + d[sParameterName];
    dl = "&";
  } 
  return url;
}

/**
 * Get pagination.
 *
 * @param fn the function to assemble url for page-index.
 * @param size the total number of records.
 * @param pageSize the number of records on each page.
 * @param pageIndex the index of the current-page.
 */
function GetPagination(fn, size, pageSize, pageIndex) {
  var html = '';
  if (size > pageSize) {
    var pageCount = Math.floor(((size-1)/pageSize)+1);
    html += ''
      + '<ul class="pagination">';
    html += ''
      + '<li class="'+(pageIndex==0?"disabled":"")+'">'
      + '<a href="'+(pageIndex==0?'javascript:;':fn(pageIndex-1))+'">'+$ZMI.icon('icon-chevron-left')+'</span></a>'
      + '</li>';
    for (var page = 0; page < pageCount; page++) {
      if (pageCount>=10 && page==pageCount-1 && pageIndex<pageCount-(3+1)-1) {
        html += '<li class="disabled"><span>...</span></li>';
      }
      if (pageCount<10 || (page==0) || (page>=pageIndex-3 && page<=pageIndex+3) || (page==pageCount-1)) {
        html += ''
          + '<li class="' + (pageIndex==page?"active":"") + '">'
          + '<a href="'+(pageIndex==page?'javascript:;':fn(page))+'">'+(page+1)+'</a>'
          + '</li>';
      }
      if (pageCount>=10 && page==0 && pageIndex>(3+1)) {
        html += '<li class="disabled"><span>...</span></li>';
      } 
    }
    html += ''
      + '<li class="last' + (pageIndex==pageCount-1?" disabled":"") + '">'
      + '<a href="'+(pageIndex==pageCount-1?'javascript:;':fn(pageIndex+1))+'">'+$ZMI.icon('icon-chevron-right')+'</a>'
      + '</li>'
      + '</ul><!-- .pagination -->';
  }
  $(".pagination").replaceWith(html);
}

/**
 * manage_search.js
 */

$(function() {
    var q = GetURLParameter("search",null);
    if (q == null) {
      return;
    }
    $("#search_results").show();
    q = q.trim();
    var pageSize = 10;
    var pageIndex = parseInt(GetURLParameter('pageIndex:int','0'));
    $("input[name=search]").val(q).change();
    $(".line.row:first").html('');
    $(".line.row:gt(0)").remove();
    var p = {};
    p['q'] = q;
    p['page_size'] = pageSize;
    p['page_index'] = pageIndex;
    var baseurl = zmiParams['base_url'];
    if (baseurl.indexOf("/content")>0) {
      baseurl = baseurl.substr(0,baseurl.indexOf("/content")+"/content".length);
    }
    $.ajax({
      url:baseurl+"/zcatalog_adapter/search_xml",
      data:p,
      timeout:5000,
      error: function (xhr, ajaxOptions, thrownError) {
          $("#search_results .small-head").html(''
            + 'Die Suchfunktion steht vor&uuml;bergehend nicht zur Verf&uuml;gung<hr/> '
            + '<code>' + xhr.status + ': ' + thrownError + '</code>');
          // TODO $.get()
      },
      success:function(xmlDoc) {
        // Filter categories
        var $xml = $(xmlDoc);
        var abs = 0;
        var total = 0;
        var code = parseInt($("code",$xml).text());
        var message = $("message",$xml).text();
        var html = "";
        if (code == 0) {
          $("#search_results .small-head").html(getZMILangStr('SEARCH_YOURQUERY').replace('%s','<span id="q"></span>')+' '+getZMILangStr('SEARCH_NORESULTS'));
          $("#search_results .small-head #q").text(q);
        }
        else {
          abs = $("abs",$xml).text();
          abs = abs.length==0?0:parseInt(abs);
          total = $("total",$xml).text();
          total = total.length==0?0:parseInt(total);
          $("#search_results .small-head").html(getZMILangStr('SEARCH_YOURQUERY').replace('%s','<span id="q"></span>')+' '+getZMILangStr('SEARCH_RETURNEDRESULTS')+':');
          $("#search_results .small-head #q").text(q);
          var $url = $("result",$xml);
          var c = 0;
          var sid = $("results",$xml).attr("id");
          $url.each(function() {
              var $this = $(this);
              var did = $(">id",$this).text();
              var uid = $(">uid",$this).text();
              var loc = $(">loc",$this).text();
              var href = $("custom>href",$this).text();
              var title = $(">title",$this).text();
              var breadcrumb = '';
              var cb = 0;
              $("custom>breadcrumbs>breadcrumb",$this).each(function() {
                  var title = $(">title",this).text();
                  var loc = $(">loc",this).text();
                  breadcrumb += breadcrumb.length==0?'':' &raquo; '
                  breadcrumb += '<a href="'+loc+'">'+title+'</a>';
                });
              var snippet = $(">snippet",$this).text();
              html += ''
                + '<div class="line row'+(c%2==0?" gray":"")+'">'
                + '<div class="'+(breadcrumb.length==0?'':'has-breadcrumb')+' col-md-8 col-ns-9">'
                + '<h2><a href="'+loc+'">'+title+'</a></h2>'
                + (breadcrumb.length==0?'':'<div class="breadcrumb">'+breadcrumb+'</div><!-- .breadcrumb -->')
                + '<p>'+snippet+'</p>'
                + '</div>'
                + '<div class="list-actions col-md-4">'
                + (href.length==0?'':'<a href="'+href+'"'+onclick+' class="btn btn-turq'+(download.length==0?' botmargin':'')+'">Herunterladen</a>')
                + '</div>'
                + '</div><!-- .line.row -->';
              c++;
            });
          // Pagination
          var fn = function(pageIndex) {
            var url = window.location.href;
            return AssembleUrlParameter(url,{"pageIndex:int":pageIndex});
          }
          GetPagination(fn,total,pageSize,pageIndex);
        }
        $(".line.row:first").replaceWith(html);
      }});
    return false;
  });