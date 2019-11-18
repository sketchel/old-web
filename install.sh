#!/bin/bash
# Btw, this will probably only work using Ubuntu.
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
npm i
npm i -g nodemon
npm run css-build
npm run dark-build
npm run css-watch
npm run dark-watch
nodemon index.js
