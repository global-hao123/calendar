/**
 * jQuery calendar plugin
 * @author yuji@baidu.com
 * @update 2013/10/17
 *
 * Compatibility:
 * 1. IE 6-10, Firefox, Opera, Chrome, Safari
 * 2. ltr/rtl
 * 3. Windows / Mac
 *
 * TODO:
 *
 */
!function(WIN, DOC, $, undef) {

    $ = $ || window.require && require("common:widget/ui/jquery/jquery.js");

    if (!$) return;
    var noop = function() {}
        , replaceTpl = window.require && require("common:widget/ui/helper/helper.js").replaceTpl || function(tpl, data, label) {
            var s = label || /#\{([^}]*)\}/mg,
                trim = function (str) {
                        return str.replace(/^\s+|\s+$/g, '')
                    };
            return (tpl + "").replace(s, function (value, name) {
                return value = data[trim(name)] || "";
            });
        }
        , calendar = function($el, args) {

            var that = this;

            that.$el = $el;
            that.el = $el[0];

            that.args = $.extend({
                now: new Date
                , selectorPrefix: "mod-calendar"
                , weeks: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                , tplMenu: '<option value="#{val}" #{selected}>#{name}</option>'
                , tplWeek: '<li>#{name}</li>'
                , tplDay: '<li #{className}><a href="#{url}" class="#{noLink}"><dl><dt>#{d}</dt><dd>#{info}</dd></dl></a></li>'

                , footer: ""

                // 1983 / 10
                , yearFrom: 10
                , yearTo: 10

                , isAbbrWeek: true
                // , isFromSunday: 0
                , beginDay: 1

                , switchLoop: false

                , onSwitch: noop
                , onFilterDays: function(o) {
                    return o;
                }
            }, args);

            that.pre = that.args.selectorPrefix;

            that.args.weeks = that.args.weeks.splice(that.args.beginDay, that.args.weeks.length).concat(that.args.weeks.splice(0, that.args.beginDay + 1));

            that.now = new Date(that.args.now).format();

            that.yearFrom = (that.yearFrom = +that.args.yearFrom) > 99 ? that.yearFrom : that.now.y - that.yearFrom;

            that.yearTo = (that.yearTo = +that.args.yearTo) > 99 ? that.yearTo : that.now.y + that.yearTo;

            that.state = {};

            that.init();
        }

        , fn = calendar.prototype;

    /**
     * Initialization
     * @return {[type]} [description]
     */
    fn.init = function() {
        var that = this
            , $el = that.$el
            , render = that.render;

        that.$year = $el.find("." + that.pre + "_year");
        that.$month = $el.find("." + that.pre + "_month");
        that.$weeks = $el.find("." + that.pre + "_weeks");
        that.$days = $el.find("." + that.pre + "_days");
        that.$prev = $el.find("." + that.pre + "_prev");
        that.$next = $el.find("." + that.pre + "_next");
        that.$footer = $el.find("." + that.pre + "_ft");

        // render year
        that.render(that.$year, that.args.tplMenu, new Array(that.yearTo - that.yearFrom + 1), function(li, i) {
            var year = i + that.yearFrom
                , name = year;
            if(that.args.fixYear) name = that.args.fixYear(year);
            return {
                val: year
                , name: name
                , selected: year === that.now.y ? 'selected="selected"' : ""
            }
        });

        that.render(that.$month, that.args.tplMenu, new Array(12), function(li, i) {
            var name = i + 1;
            if(that.args.fixMonth) name = that.args.fixMonth(i);
            return {
                val: i + 1
                , name: name
                , selected: i + 1 === that.now.M ? 'selected="selected"' : ""
            }
        });

        that.render(that.$weeks, that.args.tplWeek, that.args.weeks, function(li, i) {
            return {
                name: that.args.isAbbrWeek ? li.slice(0, 3).toUpperCase() : li
            }
        });

        that.$footer.html(that.args.footer);

        that.renderDays(that.now.M, that.now.y);
        that.bindEvents();
    }

    // handle events.
    fn.filterDays = function(y, M, d, className, info, url) {
        var that = this;
        return that.args.onFilterDays.call(that, {
            className: className
            , d: d
            , y: y
            , M: M
            , info: info
            , url: url || "#"
        });
    }

    fn.renderDays = function(M, y, filter) {
        var that = this;

        that.render(that.$days, that.args.tplDay, new Array(7 * 6), function(className, d, info) {

            var begin = new Date(y, M - 1, 1).format().w - 1 - that.args.beginDay
                , total = Date.days(M, y)
                , _M = M;

            if(begin < -1) begin = begin + 7;
            d = d - begin;
            info = "";
            className = "";

             // fix month
            if(d < 1) {
                _M = M - 1;
                d = d + (!_M ? Date.days(12, y - 1) : Date.days(_M, y));
                className = 'class=' + that.pre + "-holder";
            }
            else if(d > total) {
                d = d - total;
                _M = M + 1;
                className = 'class=' + that.pre + "-holder";
            }
            else if(y === that.now.y && _M === that.now.M && d === that.now.d) {
                className = 'class=' + that.pre + "-today";
            }

            return that.filterDays(y, _M, d, className, info);
        });
    }

    fn.render = function($el, tpl, data, filter) {
        data = $.isArray(data) ? data : [data];
        var ret = [];
        $.map(data, function(li, i) {
            ret.push(replaceTpl(tpl, filter ? filter(li, i) : data));
        });
        $el.html(ret.join(""));
    }

    fn.bindEvents = function() {
        var that = this
            , switchHandle = function(e) {
                that.renderDays(+that.$month.val(), +that.$year.val());
                that.args.onSwitch.call(that, {
                    y: +that.$year.val()
                    , M: +that.$month.val()
                }, that.$year, that.$month);
            };
        that.$year.change(switchHandle);
        that.$month.change(switchHandle);

        that.$prev.click(function(e) {
            e.preventDefault();
            var m = +that.$month.val()
                , y = +that.$year.val();
            switchHandle();
            $(that.$next).removeClass("mod-calendar-disable");
            if(m === 1) {
                if(y === that.yearFrom) {
                    if(that.args.switchLoop) {
                        that.$month.val(12);
                        that.$year.val(that.yearTo);
                    }
                    else {
                        $(this).addClass("mod-calendar-disable");
                    }
                }
                else {
                    that.$month.val(12);
                    that.$year.val(y - 1);
                }
            }
            else {
                that.$month.val(m - 1);
            }
        });

        that.$next.click(function(e) {
            e.preventDefault();
            var m = +that.$month.val()
                , y = +that.$year.val();
            switchHandle();
            $(that.$prev).removeClass("mod-calendar-disable");
            if(m === 12) {
                if(y === that.yearTo) {
                    if(that.args.switchLoop) {
                        that.$month.val(1);
                        that.$year.val(that.yearFrom);
                    }
                    else {
                        $(this).addClass("mod-calendar-disable");
                    }
                }
                else {
                    that.$month.val(1);
                    that.$year.val(y + 1);
                }
            }
            else {
                that.$month.val(m + 1);
            }
        });
    }

    // jQuery plugin wraper
    $.fn.extend({
        /**
         * plugin
         *
         * @param {Object} argument comment
         */
        calendar: function(args) {
            return new calendar(this, args);
        }
    });

}(window, document, window.jQuery);
