#!/usr/bin/env bash

generators=("app" "api" "controller" "model" "service")

[[ $generators =~ (^| )$1($| ) ]] && yo flug:$1 "${@:2}" || yo flug "$@"
