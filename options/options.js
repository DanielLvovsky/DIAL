

var xhr = function(url, callback) {
  var req = new XMLHttpRequest()
  req.onload = function() {
    var response = this.responseText
    callback(response)
  }
  req.open("get", url, true)
  req.send()
}

if (window.top !== window) {
  document.body.classList.add("iframe");
}

var settings = {}

var defaultSettings
xhr(chrome.extension.getURL("/consts/default_settings.json"), function(res) {
  defaultSettings = JSON.parse(res).default_settings

  var bgPreview = document.getElementById("bgpreview")
  var bgPresetsSelect = document.getElementById("bgopt")
  var bgURL = document.getElementById("custombg")
  var bgLocal = document.getElementById("bglocal")

  document.getElementById("resetdefaults").onclick = function() {
    this.textContent = chrome.i18n.getMessage("optionsButtonRestoreDefaultsConfirm")
    this.onclick = function() {
      localStorage.clear()
      chrome.storage.sync.clear(function() {
        chrome.storage.local.clear()
        chrome.storage.sync.set({
          firstRun: false
        }, function() {
          window.top.location.reload()
        })
      })
    }
  }

  // version label next to title
  document.querySelector("#vno").innerHTML = "v" + chrome.runtime.getManifest().version

  // background preview
  bgPresetsSelect.oninput = bgPresetsSelect.onchange = function() {
    if (this.value !== this.children[0].textContent) {
      bgPreview.style.backgroundImage = "url(/img/" + this.value + ".png)"
    }
  }

  bgURL.onchange = function() {
    if (this.value.indexOf(":") <= 5) { 
      bgPreview.style.backgroundImage = "url(" + this.value + ")"
    } else { 
      bgPreview.style.backgroundImage = "url(http://" + this.value + ")"
    }
  }

  bgLocal.onchange = function() {
    var file = this.files[0]
    if (file.size < 4294967296) { 
      var reader = new FileReader()
      reader.onloadend = function(e) {
        if (e.target.readyState === reader.DONE) {
          var dataURL = e.target.result
          bgPreview.style.backgroundImage = "url(" + dataURL + ")"
        }
      }
      reader.readAsDataURL(file)
    } else {
      this.value = null
      alert("The image is chose is too big. Please choose a file less than 4gb in size.")
    }
  }

  document.getElementById("bgblur").addEventListener("change", function() {
    if (this.checked) {
      bgPreview.classList.add("blurred")
    } else {
      bgPreview.classList.remove("blurred")
    }
  })

  
  function resizeBgPreview() {
    bgPreview.style.height = 300 * window.top.innerHeight / window.top.innerWidth + "px"
  }
  window.top.addEventListener("resize", resizeBgPreview)
  resizeBgPreview()

  Array.prototype.valueIs = function(key, value) {
    for (i = 0; i < this.length; i++) {
      if (this[i][key] === value) {
        return this[i]
      }
    }
  }

  Array.prototype.alphaSort = function(key) {
    var array = this
    array.sort(function(a, b) {
      if (a[key].toLowerCase() < b[key].toLowerCase()) return -1
      if (a[key].toLowerCase() > b[key].toLowerCase()) return 1
      return 0
    })
    return array
  }

  function readOption(key, callback) {
    // console.log("read option '%s'", key);
    var val = defaultSettings[key]
    if (settings[key] !== undefined) {
      val = settings[key]
    }
    callback(val)
  }

  chrome.storage.sync.get(null, function(sr) {
    settings = sr
    chrome.storage.local.get("backgroundURL", function(lr) {
      if (lr.backgroundURL !== undefined) {
        settings.backgroundURL = lr.backgroundURL
      }

      /* main stuff */
      
      readOption("showBookmarks", function(val) {
        document.getElementById("showbookmarks").checked = val
      })
      readOption("topSiteCount", function(val) {
        document.getElementById("topsitecount").value = val
      })
      readOption("recSiteCount", function(val) {
        document.getElementById("recsitecount").value = val
      })
      readOption("showAllBookmarks", function(val) {
        document.getElementById("showallbookmarks").checked = val
      })
      readOption("bgBlur", function(val) {
        document.getElementById("bgblur").checked = val
        if (val) {
          bgPreview.classList.add("blurred")
        } else {
          bgPreview.classList.remove("blurred")
        }
      })
      readOption("useFahrenheit", function(val) {
        document.getElementById("usefahrenheit").checked = val
      })
      readOption("noAnimation", function(val) {
        document.getElementById("disableanimation").checked = val
      })
      readOption("autoClose", function(val) {
        document.getElementById("autoclose").checked = val
      })
      readOption("sidebarEnabled", function(val) {
        document.getElementById("sidebarenabled").checked = val
      })
      readOption("appsgridstyle", function(val) {
        document.getElementById("appsgridstyle").checked = val
      })
      readOption("feedurls", function(val) {
        document.getElementById("feedurls").value = val.join("\n")
      })
      readOption("appIconBorderRadius", function(val) {
        document.getElementById("app_icon_border_radius").value = Number(val)
      })
      readOption("useFixedGrid", function(val) {
        document.getElementById("use_fixed_grid").checked = val
      })
      readOption("fixedGridCols", function(val) {
        document.getElementById("fixed_grid_cols").value = val
      })
      readOption("fixedGridRows", function(val) {
        document.getElementById("fixed_grid_rows").value = val
      })
      readOption("overrideWxLocation", function(val) {
        document.getElementById("override_wx_location").checked = val
      })
      readOption("wxCoordsLat", function(val) {
        document.getElementById("wx_coords_lat").value = val
      })
      readOption("wxCoordsLong", function(val) {
        document.getElementById("wx_coords_long").value = val
      })
      

      chrome.storage.local.get("background", function(result) {
        var imageURI = result.background.images[0].uri || defaultSettings.background.images[0].uri
        bgPreview.style.backgroundImage = "url(" + imageURI + ")"

        let urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g
        
        if (imageURI.match(urlPattern)) {
          document.getElementById("custombg").value = imageURI
        }
      })
    })
  })

  document.getElementById("save").onclick = function() {
    var newSettings = defaultSettings

    delete newSettings.backgroundURL
    delete newSettings.apps
    delete newSettings.slotCount

    
    newSettings.showBookmarks = document.getElementById("showbookmarks").checked
    newSettings.topSiteCount = Number(document.getElementById("topsitecount").value)
    newSettings.recSiteCount = Number(document.getElementById("recsitecount").value)
    newSettings.showAllBookmarks = document.getElementById("showallbookmarks").checked
    newSettings.bgBlur = document.getElementById("bgblur").checked
    newSettings.useFahrenheit = document.getElementById("usefahrenheit").checked
    newSettings.noAnimation = document.getElementById("disableanimation").checked
    newSettings.autoClose = document.getElementById("autoclose").checked
    newSettings.sidebarEnabled = document.getElementById("sidebarenabled").checked
    newSettings.appsgridstyle = document.getElementById("appsgridstyle").checked
    newSettings.feedurls = document.getElementById("feedurls").value.split("\n")
    newSettings.appIconBorderRadius = Number(document.getElementById("app_icon_border_radius").value)
    newSettings.useFixedGrid = document.getElementById("use_fixed_grid").checked
    newSettings.fixedGridCols = Number(document.getElementById("fixed_grid_cols").value) || 5
    newSettings.fixedGridRows = Number(document.getElementById("fixed_grid_rows").value) || 5
    newSettings.overrideWxLocation = document.getElementById("override_wx_location").checked
    newSettings.wxCoordsLat = Number(document.getElementById("wx_coords_lat").value) || 0
    newSettings.wxCoordsLong = Number(document.getElementById("wx_coords_long").value) || 0
    

    var syncDone = false
    var localDone = false

    chrome.storage.sync.set(newSettings, function() {
      syncDone = true
      if (syncDone && localDone) {
        window.top.location.reload()
      }
    })

    chrome.storage.local.get("background", function(results) {
      var newBackground = results.background

      var newImageUri = bgPreview.style.backgroundImage.substring(4, bgPreview.style.backgroundImage.length - 1)
      if (newImageUri[0] === "\"" && newImageUri[newImageUri.length - 1] === "\"") {
        newImageUri = newImageUri.substring(1, newImageUri.length - 1)
      }

      newBackground.images[0].uri = newImageUri

      chrome.storage.local.set({
        background: newBackground
      }, function() {
        localDone = true
        if (syncDone && localDone) {
          window.top.location.reload()
        }
      })
    })
  }
  document.querySelector("#bglocalfacade").onclick = function() {
    document.querySelector("#bglocal").click()
  }
  if (chrome.i18n.getUILanguage().split("-")[0] === "en") {
    window.easterEgg = function() {
      let h1Elem = document.getElementsByTagName("h1")[0]

      if (window.eggIndex === undefined) {
        window.eggIndex = 0
      }

      if (window.eggTitles === undefined) {
        window.eggTitles = [
          
        ]
      }

      if (eggIndex === eggTitles.length) {
        h1Elem.innerHTML = "DIAL"
        h1Elem.classList.remove("easter-egged")
      } else {
        h1Elem.innerHTML = eggTitles[eggIndex]
        h1Elem.classList.add("easter-egged")
        eggIndex += 1
      }
    }
  } else {
    window.easterEgg = function() {}
  }

  document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault()
  })

  document.getElementById("edit-apps-btn").addEventListener("click", function(e) {
    if (window.top === window) { 
      alert("Please click the Options icon on the new tab page to edit shortcuts.")
    } else {
      window.top.document.querySelector("#optionbutton").click()
      setTimeout(window.top.openAppsEditor, 300)
    }
  })
})
