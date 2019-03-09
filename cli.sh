#!/usr/bin/env bash

if [[ $1 =~ ^(app|api|model|controller|service)$ ]]
  then
    yo flugzeug:"$1" "${@:2}"
  else
    echo ""
    echo "Usage: flug <command>"
    echo ""
    echo "where <command> is one of:"
    echo "    app, api, model, controller, service"
    echo ""
    exit 0
fi

