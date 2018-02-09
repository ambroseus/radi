(function () { 'use strict';
  if (typeof radi === 'undefined') { console.warn('[Radi.js Router] Err: Radi.js package not found'); return false; }

	const COLON = ':'.charCodeAt(0)
  var cr, crg, lr, ld

	var parseRoute = function parseRoute(route) {
		var parts = route.split('/'), end = [], p = []
		for (var i = 0; i < parts.length; i++) {
			if (COLON === parts[i].charCodeAt(0)) {
				end.push('([^\/]+?)')
				p.push(parts[i].substr(1))
			} else if (parts[i] !== '') {
				end.push(parts[i])
			}
		}
		return [new RegExp('^/' + end.join('/') + '(?:\/(?=$))?$', 'i'), p]
	}

	var parseAllRoutes = function parseAllRoutes(arr) {
		var len = arr.length, ret = new Array(len)
		for (var i = len - 1; i >= 0; i--) {
			ret[i] = parseRoute(arr[i])
		}
		return ret
	}

	class Route {
		constructor(curr, match, routes, key) {
			var m = curr.match(match[0])
			this.path = curr
			this.key = key
			this.params = {}
			for (var i = 0; i < match[1].length; i++) {
				this.params[match[1][i]] = m[i + 1]
			}
			this.cmp = routes[key]
		}
	}

  radi.router = function(ro) {

  	function getRoute(curr) {
  		if (lr === curr) return ld
  		if (!cr) cr = Object.keys(ro.routes)
  		if (!crg) crg = parseAllRoutes(cr)

  		for (var i = 0; i < crg.length; i++) {
  			if (crg[i][0].test(curr)) {
  				ld = new Route(curr, crg[i], ro.routes, cr[i])
  				break
  			}
  		}
  		return ld
  	}

    window.r_routes = ro.routes
    window.r_before = ro.beforeEach || true
    window.r_after = ro.afterEach || null

    var conds = ''
    for (var route in ro.routes) {
      conds = conds.concat(`cond(
        l(this.active === '${route}' && (r_before === true || r_before('${route}',2))),
        function () { var ret = r('div', new r_routes['${route}']()); if(r_after)r_after(); return ret; }
      ).`)
    }
    if (conds !== '') conds = conds.concat('else(\'Error 404\')')

    var fn = `return r('div', ${conds})`

    return radi.component({
      name: 'radi-router',
      view: new Function(fn),
      state: {
        // _radi_no_debug: true,
        location: window.location.hash.substr(1),
        active: null
      },
      actions: {
        onMount() {
          window.onhashchange = this.hashChange
          this.hashChange()
        },
        hashChange() {
          this.location = window.location.hash.substr(1)
          var a = getRoute(this.location)
          if (a) {
            this.active = a.key
          }
          console.log('[radi-router] Route change', a)
        }
      }
    })
  };

})();