const fs = require('fs')

class Injector {
  /* **************************************************************************/
  // Lifecycle
  /* **************************************************************************/

  constructor () {
    this.scripts = { pending: [], interval: null }
    this.headFunctions = { pending: [], interval: null }
    this.bodyEvents = { pending: [], interval: null }
  }

  /* **************************************************************************/
  // Script injection
  /* **************************************************************************/

  /**
  * Injects an element into the dom
  * @param el: the element to inject
  * @param callback=undefined: executed when injected
  */
  injectScriptElement (el, callback) {
    if (document.head) {
      document.head.appendChild(el)
      if (callback) { callback() }
    } else {
      this.scripts.pending.push([el, callback])
      if (this.scripts.interval === null) {
        this.scripts.interval = setInterval(() => {
          if (document.head) {
            clearInterval(this.scripts.interval)
            this.scripts.interval = null
            this.scripts.pending.forEach((inf) => {
              document.head.appendChild(inf[0])
              if (inf[1]) { inf[1]() }
            })
            this.scripts.pending = []
          }
        }, 10)
      }
    }
  }

  /**
  * Injects javascript into the head
  * @param js: the js code to inject
  * @param callback=undefined: executed when injected
  */
  injectJavaScript (js, callback) {
    const el = document.createElement('script')
    el.type = 'text/javascript'
    el.innerHTML = js
    this.injectScriptElement(el, callback)
  }

  /**
  * Injects a stylesheet into the head
  * @param css: the css code to inject
  * @param callback=undefined: executed when injected
  */
  injectStyle (css, callback) {
    const el = document.createElement('style')
    el.innerHTML = css
    this.injectScriptElement(el, callback)
  }

  /**
  * Injects a client module
  * @param path: the path (ideally fully resolved)
  * @param config=undefined: any configuration to pass into the client module. Must be json serializable
  * @param callback=undefined: executed when injected
  */
  injectClientModule (path, config = undefined, callback = undefined) {
    fs.readFile(path, 'utf8', (err, js) => {
      if (err) { throw new Error(`Module ${path} not loaded`) }
      this.injectJavaScript(`
        ;(function (WAVEBOX_CONFIG) {
          ${js}
        })(${config ? JSON.stringify(config) : 'undefined'});
      `, callback)
    })
  }

  /* **************************************************************************/
  // Event injection
  /* **************************************************************************/

  /**
  * Injects a body event listener
  * @param eventName: the name of the event
  * @param fn: the function to call
  */
  injectBodyEvent (eventName, fn) {
    if (document.body) {
      document.body.addEventListener(eventName, fn, false)
    } else {
      this.bodyEvents.pending.push([eventName, fn])
      if (this.bodyEvents.interval === null) {
        this.bodyEvents.interval = setInterval(() => {
          if (document.body) {
            clearInterval(this.bodyEvents.interval)
            this.bodyEvents.interval = null
            this.bodyEvents.pending.forEach((inf) => {
              document.body.addEventListener(inf[0], inf[1], false)
            })
            this.bodyEvents.pending = []
          }
        }, 100)
      }
    }
  }

  /* **************************************************************************/
  // Function injection
  /* **************************************************************************/

  /**
  * Runs a function after the head has become available
  * @param fn: the function to call
  */
  injectHeadFunction (fn) {
    if (document.head) {
      document.head.appendChild(fn)
    } else {
      this.headFunctions.pending.push(fn)
      if (this.headFunctions.interval === null) {
        this.headFunctions.interval = setInterval(() => {
          if (document.head) {
            clearInterval(this.headFunctions.interval)
            this.headFunctions.interval = null
            this.headFunctions.pending.forEach((fn) => {
              fn()
            })
            this.headFunctions.pending = []
          }
        }, 10)
      }
    }
  }
}

module.exports = new Injector()
