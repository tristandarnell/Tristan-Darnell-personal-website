#!/usr/bin/env bash
set -Eeuo pipefail

on_error() {
  local exit_code="$1"
  local line_no="$2"
  echo
  echo "Spotify token script failed (line $line_no, exit $exit_code)."
  echo "If this keeps failing, send this full terminal output."
}

trap 'on_error "$?" "$LINENO"' ERR

prompt_if_empty() {
  local var_name="$1"
  local prompt_text="$2"
  local secret="${3:-0}"
  if [[ -z "${!var_name:-}" ]]; then
    if [[ "$secret" == "1" ]]; then
      read -r -s -p "$prompt_text: " input
      echo
    else
      read -r -p "$prompt_text: " input
    fi
    printf -v "$var_name" "%s" "$input"
  fi
}

urlencode() {
  node -e 'console.log(encodeURIComponent(process.argv[1] ?? ""))' "$1"
}

extract_query_param() {
  local full_url="$1"
  local key="$2"
  node -e 'const u = new URL(process.argv[1]); console.log(u.searchParams.get(process.argv[2]) ?? "");' "$full_url" "$key"
}

prompt_if_empty "SPOTIFY_CLIENT_ID" "Enter SPOTIFY_CLIENT_ID"
prompt_if_empty "SPOTIFY_CLIENT_SECRET" "Enter SPOTIFY_CLIENT_SECRET" "1"

default_redirect="${SPOTIFY_REDIRECT_URI:-https://example.com/callback}"
read -r -p "Redirect URI [$default_redirect]: " redirect_input
REDIRECT_URI="${redirect_input:-$default_redirect}"

scope="user-top-read user-read-private"
state="$(node -e 'const c=require("crypto");console.log(c.randomBytes(12).toString("hex"));')"

auth_url="https://accounts.spotify.com/authorize?client_id=$(urlencode "$SPOTIFY_CLIENT_ID")&response_type=code&redirect_uri=$(urlencode "$REDIRECT_URI")&scope=$(urlencode "$scope")&state=$state&show_dialog=true"

echo
echo "1) In Spotify Dashboard, make sure this exact Redirect URI is added:"
echo "   $REDIRECT_URI"
echo "   (Spotify requires exact match.)"
echo
echo "2) Open this URL in your browser and approve access:"
echo "   $auth_url"
echo
read -r -p "3) Paste the full callback URL after approval: " callback_url

code="$(extract_query_param "$callback_url" "code")"
returned_state="$(extract_query_param "$callback_url" "state")"
error_param="$(extract_query_param "$callback_url" "error")"

if [[ -n "$error_param" ]]; then
  echo "Spotify returned error: $error_param"
  exit 1
fi

if [[ -z "$code" ]]; then
  echo "Could not find auth code in callback URL."
  exit 1
fi

if [[ -n "$returned_state" && "$returned_state" != "$state" ]]; then
  echo "Warning: state mismatch detected. Aborting for safety."
  exit 1
fi

basic_auth="$(printf "%s:%s" "$SPOTIFY_CLIENT_ID" "$SPOTIFY_CLIENT_SECRET" | base64)"

token_response="$(curl -sS -X POST "https://accounts.spotify.com/api/token" \
  -H "Authorization: Basic $basic_auth" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=$code" \
  --data-urlencode "redirect_uri=$REDIRECT_URI")"

refresh_token="$(printf "%s" "$token_response" | node -e 'let raw="";process.stdin.on("data",d=>raw+=d);process.stdin.on("end",()=>{try{const json=JSON.parse(raw);if(!json.refresh_token){console.error(raw);process.exit(1);}console.log(json.refresh_token);}catch{console.error(raw);process.exit(1);}});')"

echo
echo "Refresh token generated successfully."
echo "Set this in Vercel:"
echo "SPOTIFY_REFRESH_TOKEN=$refresh_token"
echo

if command -v pbcopy >/dev/null 2>&1; then
  printf "%s" "$refresh_token" | pbcopy
  echo "Copied refresh token to clipboard."
fi
