@echo off
title Guard

:run
node .
echo Bot crashed! Restarting...
goto run
