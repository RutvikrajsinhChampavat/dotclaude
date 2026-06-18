#!/bin/sh
input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
model=$(echo "$input" | jq -r '.model.display_name // ""')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
five=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

dir=$(basename "$cwd")

parts="$dir  $model"

if [ -n "$used" ]; then
  parts="$parts  ctx:$(printf '%.0f' "$used")%"
fi

if [ -n "$five" ] || [ -n "$week" ]; then
  limits=""
  [ -n "$five" ] && limits="5h:$(printf '%.0f' "$five")%"
  [ -n "$week" ] && limits="${limits:+$limits }7d:$(printf '%.0f' "$week")%"
  parts="$parts  $limits"
fi

printf "\033[2m%s\033[0m" "$parts"
