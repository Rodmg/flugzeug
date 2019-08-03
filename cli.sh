#!/usr/bin/env bash

if [[ $1 =~ ^(app|api|model|controller|service|-v|--version|version)$ ]]
  then
    if [[ $1 =~ ^(-v|--version|version)$ ]]
      then
        yo flugzeug:version
      else
        yo flugzeug:"$1" "${@:2}"
    fi
  else
    echo ""
    echo "Usage: flug <command>"
    echo ""
    echo "where <command> is one of:"
    echo "    app, api, model, controller, service, version"
    echo ""
    exit 0
fi

