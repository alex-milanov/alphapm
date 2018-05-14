#!/bin/bash
# multiplatform open script
if hash open 2>/dev/null; then
	open ${1};
elif hash xdg-open 2>/dev/null; then
	xdg-open ${1};
else
	echo "works only on lunux or osc";
fi
