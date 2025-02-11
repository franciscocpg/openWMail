;(function () {

  var realFs = require('fs')
  var gracefulFs = require('graceful-fs')
  gracefulFs.gracefulify(realFs)

  const {ipcMain, dialog, app, shell} = require('electron')

  let windowManager
  const quitting = app.makeSingleInstance(function (commandLine, workingDirectory) {
    const argv = require('yargs').parse(commandLine)
    if (windowManager) {
      if (argv.hidden || argv.hide) {
        windowManager.mailboxesWindow.hide()
      } else {
        if (argv.mailto) {
          windowManager.mailboxesWindow.openMailtoLink(argv.mailto)
        }
        const index = argv._.findIndex((a) => a.indexOf('mailto') === 0)
        if (index !== -1) {
          windowManager.mailboxesWindow.openMailtoLink(argv._[index])
          argv._.splice(1)
        }
        windowManager.mailboxesWindow.show()
        windowManager.mailboxesWindow.focus()
      }
    }
    return true
  })
  if (quitting) {
    app.quit()
    return
  }

  const argv = require('yargs').parse(process.argv)
  const MailboxesWindow = require('./windows/MailboxesWindow')
  const ContentWindow = require('./windows/ContentWindow')
  const pkg = require('../package.json')
  const AppPrimaryMenu = require('./AppPrimaryMenu')
  const KeyboardShortcuts = require('./KeyboardShortcuts')
  const WindowManager = require('./windows/WindowManager')
  const constants = require('../shared/constants')
  const storage = require('./storage')
  const settingStore = require('./stores/settingStore')

  Object.keys(storage).forEach((k) => storage[k].checkAwake())

  /* ****************************************************************************/
  // Commandline switches & launch args
  /* ****************************************************************************/

  if (settingStore.app.ignoreGPUBlacklist) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')
  }
  if (settingStore.app.disableSmoothScrolling) {
    app.commandLine.appendSwitch('disable-smooth-scrolling', 'true')
  }
  if (!settingStore.app.enableUseZoomForDSF) {
    app.commandLine.appendSwitch('enable-use-zoom-for-dsf', 'false')
  }
  const openHidden = (function () {
    if (settingStore.ui.openHidden) { return true }
    if (process.platform === 'darwin' && app.getLoginItemSettings().wasOpenedAsHidden) { return true }
    if (argv.hidden || argv.hide) { return true }
    return false
  })()

  /* ****************************************************************************/
  // Global objects
  /* ****************************************************************************/

  const mailboxesWindow = new MailboxesWindow()
  windowManager = new WindowManager(mailboxesWindow)
  const selectors = {
    fullQuit: () => {
      windowManager.quit()
    },
    closeWindow: () => {
      const focused = windowManager.focused()
      focused ? focused.close() : undefined
    },
    showWindow: () => {
      windowManager.mailboxesWindow.show()
      windowManager.mailboxesWindow.focus()
    },
    fullscreenToggle: () => {
      const focused = windowManager.focused()
      focused ? focused.toggleFullscreen() : undefined
    },
    sidebarToggle: () => {
      windowManager.mailboxesWindow.toggleSidebar()
    },
    menuToggle: () => {
      windowManager.mailboxesWindow.toggleAppMenu()
    },
    preferences: () => {
      windowManager.mailboxesWindow.launchPreferences()
    },
    reload: () => {
      const focused = windowManager.focused()
      focused ? focused.reload() : undefined
    },
    devTools: () => {
      const focused = windowManager.focused()
      focused ? focused.openDevTools() : undefined
    },
    learnMoreGithub: () => { shell.openExternal(constants.GITHUB_URL) },
    learnMore: () => { shell.openExternal(constants.WEB_URL) },
    privacy: () => { shell.openExternal(constants.PRIVACY_URL) },
    bugReport: () => { shell.openExternal(constants.GITHUB_ISSUE_URL) },
    zoomIn: () => { windowManager.mailboxesWindow.mailboxZoomIn() },
    zoomOut: () => { windowManager.mailboxesWindow.mailboxZoomOut() },
    zoomReset: () => { windowManager.mailboxesWindow.mailboxZoomReset() },
    changeMailbox: (mailboxId) => {
      windowManager.mailboxesWindow.show()
      windowManager.mailboxesWindow.focus()
      windowManager.mailboxesWindow.switchMailbox(mailboxId)
    },
    prevMailbox: () => {
      windowManager.mailboxesWindow.show()
      windowManager.mailboxesWindow.focus()
      windowManager.mailboxesWindow.switchPrevMailbox()
    },
    nextMailbox: () => {
      windowManager.mailboxesWindow.show()
      windowManager.mailboxesWindow.focus()
      windowManager.mailboxesWindow.switchNextMailbox()
    },
    cycleWindows: () => { windowManager.focusNextWindow() },
    aboutDialog: () => {
      dialog.showMessageBox({
        title: pkg.humanName,
        message: pkg.humanName,
        detail: [
          'Version: ' + pkg.version + (pkg.prerelease ? ' prerelease' : ''),
          'openWMail, like wmail before it, is licensed under the Mozilla Public License 2.0.',
          '\n',
          'Made with ♥ by openWMail Community.'
        ].join('\n'),
        buttons: [ 'Done', 'Website' ]
      }, (index) => {
        if (index === 1) {
          shell.openExternal(constants.GITHUB_URL)
        }
      })
    },
    creditsDialog: () => {
      dialog.showMessageBox({
        title: pkg.humanName,
        message: 'Credits',
        detail: [
          'The community project known as openWMail would not be possible without the many years of tireless work by Thomas Beverley (Thomas101 on GitHub) on the original wmail. His hundreds of commits & thousands of lines of code, days and nights spent reproducing bugs, and commitment to this community are manifested in the polished product with which we were able to begin.',
          '\n',
          'Thanks again Thomas!'
        ].join('\n'),
        buttons: [ 'Done', 'Thomas101 on GitHub' ]
      }, (index) => {
        if (index === 1) {
          shell.openExternal(constants.THOMAS_URL)
        }
      })
    },
    find: () => { windowManager.mailboxesWindow.findStart() },
    findNext: () => { windowManager.mailboxesWindow.findNext() },
    mailboxNavBack: () => { windowManager.mailboxesWindow.navigateMailboxBack() },
    mailboxNavForward: () => { windowManager.mailboxesWindow.navigateMailboxForward() }
  }
  const appMenu = new AppPrimaryMenu(selectors)
  const keyboardShortcuts = new KeyboardShortcuts(selectors)

  /* ****************************************************************************/
  // IPC Events
  /* ****************************************************************************/

  ipcMain.on('new-window', (evt, body) => {
    const mailboxesWindow = windowManager.mailboxesWindow
    const copyPosition = !mailboxesWindow.window.isFullScreen() && !mailboxesWindow.window.isMaximized()
    const windowOptions = copyPosition ? (() => {
      const position = mailboxesWindow.window.getPosition()
      const size = mailboxesWindow.window.getSize()
      return {
        x: position[0] + 20,
        y: position[1] + 20,
        width: size[0],
        height: size[1]
      }
    })() : undefined
    const window = new ContentWindow()
    windowManager.addContentWindow(window)
    window.start(body.url, body.partition, windowOptions)
  })

  ipcMain.on('focus-app', (evt, body) => {
    windowManager.focusMailboxesWindow()
  })

  ipcMain.on('toggle-mailbox-visibility-from-tray', (evt, body) => {
    windowManager.toggleMailboxWindowVisibilityFromTray()
  })

  ipcMain.on('quit-app', (evt, body) => {
    windowManager.quit()
  })

  ipcMain.on('relaunch-app', (evt, body) => {
    app.relaunch()
    windowManager.quit()
  })

  ipcMain.on('prepare-webview-session', (evt, data) => {
    mailboxesWindow.sessionManager.startManagingSession(data.partition)
  })

  ipcMain.on('mailboxes-js-loaded', (evt, data) => {
    if (argv.mailto) {
      windowManager.mailboxesWindow.openMailtoLink(argv.mailto)
      delete argv.mailto
    } else {
      const index = argv._.findIndex((a) => a.indexOf('mailto') === 0)
      if (index !== -1) {
        windowManager.mailboxesWindow.openMailtoLink(argv._[index])
        argv._.splice(1)
      }
    }
  })

  /* ****************************************************************************/
  // App Events
  /* ****************************************************************************/

  app.on('ready', () => {
    appMenu.updateApplicationMenu()
    windowManager.mailboxesWindow.start(openHidden)
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  app.on('activate', () => {
    windowManager.mailboxesWindow.show()
  })

  // Keyboard shortcuts in Electron need to be registered and unregistered
  // on focus/blur respectively due to the global nature of keyboard shortcuts.
  // See  https://github.com/electron/electron/issues/1334
  app.on('browser-window-focus', () => {
    keyboardShortcuts.register()
  })
  app.on('browser-window-blur', () => {
    keyboardShortcuts.unregister()
  })

  app.on('before-quit', () => {
    keyboardShortcuts.unregister()
    windowManager.forceQuit = true
  })

  app.on('open-url', (evt, url) => { // osx only
    evt.preventDefault()
    windowManager.mailboxesWindow.openMailtoLink(url)
  })

  /* ****************************************************************************/
  // Exceptions
  /* ****************************************************************************/

  // Send crash reports
  process.on('uncaughtException', (err) => {
    console.error(err)
    console.error(err.stack)
  })
})()
