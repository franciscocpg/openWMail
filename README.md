# openWMail

An always free, always open-source fork of [wmail](https://github.com/Thomas101/wmail) maintained by a volunteer community.

[![Rocket.Chat](https://openwmail.rocket.chat/api/v1/shield.svg?type=channel&channel=general)](https://openwmail.rocket.chat/channel/general)
[![Download](https://img.shields.io/github/downloads/openWMail/openWMail/total.svg)](https://github.com/openWMail/openWMail/releases)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

The missing desktop client for Gmail & Google Inbox. Bringing the Gmail & Google Inbox experience to your desktop in a neatly packaged app

[Raise an issue or request a feature](https://github.com/openWMail/openWMail/issues)

![Screenshot](https://raw.githubusercontent.com/openWMail/openWMail/master/.github/screenshot.png "Screenshot")

### Installing
openWMail is available on Windows, Mac OSX, and Linux

[Download releases](https://github.com/openWMail/openWMail/releases)

#### Snap Install
```
sudo snap install openwmail
```

#### Arch
openWMail is also available in the [Arch AUR](https://aur.archlinux.org/packages/openwmail/).  Installable with your favorite aur package manager.
```
sudo yaourt -S openwmail
```

### License

openWMail, like wmail before it, is licensed under the [Mozilla Public License 2.0](./LICENSE).

### Building from source

#### Creating credentials

1. [Create a new gcloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
2. [Create OAuth credentials for this project](https://support.google.com/cloud/answer/6158849?hl=pt-BR)
3. Next create `src/shared/credentials.js` with your Google client ID and
secret like so...
    ```js
    module.exports = Object.freeze({
      GOOGLE_CLIENT_ID : '<Your google client id>',
      GOOGLE_CLIENT_SECRET: '<Your google client secret>'
    })
    ```
4. Follow these [steps](https://cloud.google.com/endpoints/docs/openapi/enable-api#enabling_an_api)
to enable access to `Gmail API` and `Google+ API` (tip: use the search field to
find these two libraries).

#### Building

Then run the following...

```
npm install webpack -g
npm run-script install-all
npm run-script rebuild:electron
npm start
```

### Packaging Builds

To package builds. (Note packaging osx builds can only be done from osx)
```
brew install msitools
npm install
npm rebuild
npm run-script package
```

### Installing in arch linux using this fork

Follow the [Creating credentials](#creating-credentials) steps and then run:
```bash
install/run.sh
```

You should be able to open openWMail in terminal typing
`/opt/openwmail/openWMail` or searching for `openWMAil` at your
applications menu.
