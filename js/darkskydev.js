var DarkSkyDev = DarkSkyDev || {}

;(function($) {

  var num_free_calls = DarkSkyDev.free_daily_calls,
      calls_per_dollar = DarkSkyDev.calls_per_dollar,
      window_resize_timeout,
      g,
      $payments = $("#payments"),
      $h2 = $payments.children("h2"),
      $table = $payments.children("table"),
      $tbody = $table.children("tbody"),
      graph_selector = '#graaph'

  var prepare_the_graph = function() {
    clearTimeout(window_resize_timeout)

    window_resize_timeout = setTimeout(function() {
      if(g && g.redraw) g.redraw()
    }, 100)
  }

  $(window).bind({ resize: prepare_the_graph })

  var setup = function() {
    $('[rel=tooltip]').tooltip()

    $('#api_key_reset_button').click(api_key_reset_confirm)

    $('#intro_alert').bind('closed', function () {
      $.cookie('intro_alert_closed', true, { expires: 365, path: '/' })
    })

    if( !$.cookie('intro_alert_closed') ) $('#intro_alert').show()

    request_payments()

    $(".date_controls button").click(function() {
      $(".date_controls").filter(":hidden").find("button").removeClass("active").filter("."+$(this).data("range-str")).addClass("active")
      update_usage_display()
    })
    setInterval(function() {
      update_usage_display()
    }, 1000)
    update_usage_display()
  }

  var request_payments = function() {
    if( !$payments[0] ) return
    $.getJSON("/users/get_payments", display_payments)
  }

  var display_payments = function(p) {

    if( !p || !p.length ) return

    $.each(p, function(key, val) {
      var tr = $("<tr />");

      $("<td />").text(p.length - key).appendTo(tr)
      $("<td />").text(moment.unix(val.date).format("MMMM D, YYYY")).appendTo(tr)
      $("<td />").text(val.refunded ? "Refunded" : (val.paid ? "Paid" : "Failed")).appendTo(tr)
      $("<td />").text("$" + val.amount / 100).addClass("quantity").appendTo(tr)

      tr.appendTo($tbody)
    })

    var height = $h2.outerHeight(true) + $table.outerHeight(true)
    $payments.delay(1000).animate({height: height})

  }

  var update_usage_display = function() {
    if( !$(graph_selector)[0] ) return

    $.getJSON('https://random.now.sh', function (apiData) {
      display_history({
        "2016-6-24": Math.floor(apiData.random * 8),
        "2016-6-25":Math.floor(5 + apiData.random * 3),
        "2016-6-26":Math.floor(apiData.random * 9),
        "2016-6-28":Math.floor(apiData.random * 13)
      })
    })
  }

  var display_date = function(date) {
    var arr = date.split("-", 3);
    if(arr[1].length === 1) arr[1] = "0" + arr[1];
    if(arr[2].length === 1) arr[2] = "0" + arr[2];
    return arr.join("-");
  };

  var display_history = function(h) {
    var days = []
    var calls_this_month = 0

    var t = new Date()
    var today_string = t.getUTCFullYear() + '-' + (t.getUTCMonth() + 1) + '-' + t.getUTCDate()
    var calls_today = 0
    var calls_in_range = 0
    var today_cost = 0

    $.each(h, function(key, val) {
      var calls, cost;

      calls = val|0;
      cost  = Math.max(0.0, (val - num_free_calls) / calls_per_dollar);

      if(key === today_string) {
        calls_today = calls;
        today_cost  = cost;
      }

      days.push({
        d: display_date(key),
        a: calls,
        c: cost,
      });
    })

    var range_str = $(".date_controls").filter(':visible').children("button.active").first().data("range-str")

    var start;
    if(range_str === "last_7_days")
      start = moment().subtract("weeks", 1);
    else if(range_str === "month_to_date")
      start = moment().startOf("month").subtract("days", 1);
    else if(range_str === "last_month")
      start = moment().subtract("months", 1);
    else if(range_str === "last_2_months")
      start = moment().subtract("months", 2);
    else if(range_str === "last_3_months")
      start = moment().subtract("months", 3);
    else if(range_str === "last_6_months")
      start = moment().subtract("months", 6);
    else
      start = moment(0);

    var range = moment().range(start, moment())
    var range_cost = 0
    var in_range = []

    var month_start = moment().startOf('month').subtract('days', 1)
    var now = moment()
    var month_range = moment().range(month_start, now)
    var month_cost = 0

    var i;

    for(i = 0; i < days.length; i++) {
      if(moment(days[i].d, "YYYY-MM-DD").within(range)) {
        in_range.push(days[i]);
        calls_in_range += days[i].a;
        range_cost += days[i].c;
      }
      if(moment(days[i].d, "YYYY-MM-DD").within(month_range)) {
        calls_this_month += days[i].a;
        month_cost += days[i].c;
      }
    }

    if(in_range.length) {
      $('#tz_note, #graph').show();

      if(g) {
        g.setData(in_range);
      }

      else {
        g = Morris.Line({
          element: 'graph',
          data: in_range,
          xkey: 'd',
          ykeys: ['a'],
          labels: ['API Calls'],
          hideHover: true,
          hoverCallback: function(index, options, content, row) {
            return content + "<div class='morris-hover-point' style='color: #7a92a3'>Cost: $" + row.c.toFixed(2) + "</div>";
          }
        });
      }
    }

    else {
      $('#tz_note, #graph').fadeTo(200, 0.0);
    }

    if( calls_today > num_free_calls ) {
      $('#today_stats').removeClass("free")
      $('#calls_today').text(calls_today).digits()
      $('#calls_today_text').text("Calls today")
      $('#cost_today').text("$"+today_cost.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
    } else {
      $('#today_stats').addClass("free")
      $('#calls_today').text(num_free_calls - calls_today + " left").digits()
      $('#calls_today_text').text("Free calls today")
      $('#cost_today').text("Free")
    }

    $('#calls_in_range').text(calls_in_range).digits()

    if (range_cost > 0)
      $('#cost_range').text("$"+range_cost.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
    else
      $('#cost_range').text("Free")

    $('#calls_this_month').text(calls_this_month).digits()

    if (month_cost > 0)
      $('#cost_month').text("$"+month_cost.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"))
    else
      $('#cost_month').text("Free")

    if( !$('#usage_stats').hasClass('visible') ) {
      if( in_range.length ) $('#tz_note, #graph, #graph svg').fadeTo(200, 1)
      $('#api_keys, #stats').fadeTo(200, 0.999, function() { if( days.length ) $('#usage_stats').addClass('visible') })
    }
  }

  var api_key_reset_confirm = function() {
    if( confirm('This will break applications relying on your old key!\n\nAre you sure you want reset your API Key?\n') )
      reset_api_key()
  }

  var reset_api_key = function() {
    $.getJSON('https://random.now.sh', function (apiData) {
      display_api_key({key: btoa(apiData.random)});
    })
  }

  var display_api_key = function(new_key) {
    var old_key = $('#api_key').val()
    if( old_key == new_key.value ) {
      reset_api_key()
      return
    }
    $('#api_key').val(new_key.value).select()
    var test_link = $('#intro_alert .api_test_link')
    test_link.prop('href', test_link.prop('href').replace(old_key, new_key.value))
    test_link.text(test_link.text().replace(old_key, new_key.value))
  }

  $(document).ready(setup)

})(jQuery);


$(document).ready(function() {

  $("#credit-card input, #credit-card select").attr("disabled", false);

  $("form:has(#credit-card)").submit(function() {
    var form = this;
    $("#user_submit").attr("disabled", true);
    $("#credit-card input, #credit-card select").attr("name", "");
    $("#credit-card-errors").hide();

    if (!$("#credit-card").is(":visible")) {
      $("#credit-card input, #credit-card select").attr("disabled", true);
      return true;
    }

    var card = {
      number:   $("#credit_card_number").val(),
      expMonth: $("#_expiry_date_2i").val(),
      expYear:  $("#_expiry_date_1i").val(),
      cvc:      $("#cvv").val()
    };


    Stripe.createToken(card, function(status, response) {
      if (status === 200) {
        $("#user_last_4_digits").val(response.card.last4);
        $("#user_stripe_token").val(response.id);
        form.submit();
      } else {
        $("#stripe-error-message").text(response.error.message);
        $("#credit-card-errors").show();
        $("#user_submit").attr("disabled", false);
      }
    });

    return false;
  });

  $("#change-card-button").click(function() {
    $("#change-card").hide();
    $("#credit-card").show();
    $("#credit_card_number").focus();
    return false;
  });

})


// jQuery plugin for putting commas every 3 digits of a number
// by Paul Creasey via http://stackoverflow.com/questions/1990512/add-comma-to-numbers-every-three-digits-using-jquery/1990590#1990590
$.fn.digits = function() {
  return this.each( function() {
    $(this).text( $(this).text().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,") )
  } )
}


/*!
 * jQuery Cookie Plugin
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
;(function($) {
    $.cookie = function(key, value, options) {

        // key and at least value given, set cookie...
        if (arguments.length > 1 && (!/Object/.test(Object.prototype.toString.call(value)) || value === null || value === undefined)) {
            options = $.extend({}, options);

            if (value === null || value === undefined) {
                options.expires = -1;
            }

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            value = String(value);

            return (document.cookie = [
                encodeURIComponent(key), '=', options.raw ? value : encodeURIComponent(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path    ? '; path=' + options.path : '',
                options.domain  ? '; domain=' + options.domain : '',
                options.secure  ? '; secure' : ''
            ].join(''));
        }

        // key and possibly options given, get cookie...
        options = value || {};
        var decode = options.raw ? function(s) { return s; } : decodeURIComponent;

        var pairs = document.cookie.split('; ');
        for (var i = 0, pair; pair = pairs[i] && pairs[i].split('='); i++) {
            if (decode(pair[0]) === key) return decode(pair[1] || ''); // IE saves cookies with empty string as "c; ", e.g. without "=" as opposed to EOMB, thus pair[1] may be undefined
        }
        return null;
    };
})(jQuery);
