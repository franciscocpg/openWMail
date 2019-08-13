#!/bin/bash
set -e

# depends=(electron)
# makedepends=(git npm python2)

pkgname=openwmail
pkgname_version="$pkgname-$pkgver"
tmp_build="/tmp/build/openWMail-linux-x64"

build() {
  yarn && \
  yarn install-all && \
  yarn rebuild:electron && \
  yarn package:linux
}

package() {
  echo "Installing package"

  sudo rm -rf "/opt/$pkgname" && \
  sudo cp -r "$tmp_build" "/opt/$pkgname" && \
  sudo cp assets/icons/app.png /opt/$pkgname/resources && \

  sudo install -Dm644 install/$pkgname.desktop "/usr/share/applications/$pkgname.desktop" && \

  echo "Package installed"
}

build && package
