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
                , tplMenu: '<option value="#{val}" #{selected}>#{val}</option>'
                , tplWeek: '<li>#{name}</li>'
                , tplDay: '<li #{className}><a href="#"><dl><dt>#{d}</dt><dd>#{info}</dd></dl></a></li>'

                , footer: ""

                // 1983 / 10
                , yearFrom: 10
                , yearTo: 10


                , isAbbrWeek: true
                , isFromSunday: 0


                , onSwitch: noop
                , onFilterDays: function(o) {
                    return o;
                }
            }, args);

            that.yearFrom = +that.args.yearFrom;
            that.yearTo = +that.args.yearTo;
            that.pre = that.args.selectorPrefix;

            if(that.args.isFromSunday) that.args.weeks.splice(that.args.weeks.length,0,that.args.weeks.splice(0, 1)[0]);

            that.now = new Date(that.args.now).format();

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
            , render = that.render
            , yearFrom = that.yearFrom > 99 ? that.yearFrom : that.now.y - that.yearFrom
            , yearTo = that.yearTo > 99 ? that.yearTo : that.now.y + that.yearTo;

        that.$year = $el.find("." + that.pre + "_year");
        that.$month = $el.find("." + that.pre + "_month");
        that.$weeks = $el.find("." + that.pre + "_weeks");
        that.$days = $el.find("." + that.pre + "_days");
        that.$prev = $el.find("." + that.pre + "_prev");
        that.$next = $el.find("." + that.pre + "_next");
        that.$footer = $el.find("." + that.pre + "_ft");

        // render year
        that.render(that.$year, that.args.tplMenu, new Array(yearTo - yearFrom + 1), function(li, i) {
            var year = i + yearFrom;
            return {
                val: year
                , selected: year === that.now.y ? 'selected="selected"' : ""
            }
        });

        that.render(that.$month, that.args.tplMenu, new Array(12), function(li, i) {
            return {
                val: i + 1
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

    // TODO handle events.
    fn.filterDays = function(y, M, d, className, info) {
        var that = this;

        info = "农历";

        if(d == 9) {
            info = "This is a event.";
            className = 'class=' + that.pre + "-event";
        }

        if(d == 11) {
            info = "This is a holiday.";
            className = 'class=' + that.pre + "-holiday";
        }

        if(d == 13) {
            info = "This is a festival.";
            className = 'class=' + that.pre + "-festival";
        }

        return that.args.onFilterDays({
            className: className
            , d: d
            , info: info
        })
    }

    fn.renderDays = function(M, y, filter) {
        var that = this;

        that.render(that.$days, that.args.tplDay, new Array(7 * 6), function(className, d, info) {
            var begin = new Date(y, M - 1, 1).format().w - 1 - (that.args.isFromSunday ? 1 : 0)
                , total = Date.days(M, y);
            if(begin < -1) begin = begin + 7;
            d = d - begin;
            info = "";
            className = "";
            if(d < 1) {
                d = d + (M === 1 ? Date.days(12, y - 1) : Date.days(M - 1, y));
                className = 'class=' + that.pre + "-holder";
            }
            else if(d > total) {
                d = d - total;
                className = 'class=' + that.pre + "-holder";
            }
            else if(y === that.now.y && M === that.now.M && d === that.now.d) {
                console.log(d, that.now.d)
                className = 'class=' + that.pre + "-today";
            }

            return that.filterDays(y, M, d, className, info);
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
                that.args.onSwitch({
                    y: +that.$year.val()
                    , M: +that.$month.val()
                });
            };
        that.$year.change(switchHandle);
        that.$month.change(switchHandle);

        that.$prev.click(function(e) {
            e.preventDefault();
            var m = +that.$month.val();
            if(m === 1) {
                m = 13;
                that.$year.val(+that.$year.val() - 1);
            }
            that.$month.val(m - 1);
            switchHandle();
        });

        that.$next.click(function(e) {
            e.preventDefault();
            var m = +that.$month.val();
            if(m === 12) {
                m = 0;
                that.$year.val(+that.$year.val() + 1);
            }
            that.$month.val(m + 1);
            switchHandle();
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
