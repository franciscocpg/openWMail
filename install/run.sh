#!/bin/bash
set -e

# depends=(electron)
# makedepends=(git npm python2)

pkgname=openwmail
pkgname_version="$pkgname-$pkgver"
tmp_build="/tmp/build/openWMail-linux-x64"

build() {
  cp install/origin-credentials.js ./src/shared/credentials.js && \
  yarn && \
  yarn install-all && \
  yarn rebuild:electron && \
  yarn package:linux
}

package() {
  echo "Installing package"

  rm -rf "/opt/$pkgname" && \
  cp -r "$tmp_build" "/opt/$pkgname" && \
  cp assets/icons/app.png /opt/$pkgname/resources && \

  install -Dm644 install/$pkgname.desktop "/usr/share/applications/$pkgname.desktop" && \

  echo "Package installed"
}

build && package
