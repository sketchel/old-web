#!/bin/bash
# Btw, this will probably only work using Ubuntu.
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs
npm i
npm i -g nodemon
nodemon index.js
