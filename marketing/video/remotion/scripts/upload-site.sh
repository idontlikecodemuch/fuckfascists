#!/usr/bin/env bash
# Uploads files to fckfascists.com over FTPS (Bluehost).
#   scripts/upload-site.sh <local>[=<remote/path>] ...   [--to <remote-subdir>]
# Without "=remote/path" a file goes to <remote-subdir>/<basename> (default subdir video;
# --to "" = site root). Credentials come only from the main checkout's .env
# (BLUHST_FCKFCOM_USER / _PW / _SERVER); the FTP account is pointed at public_html, so a
# remote path maps to https://fckfascists.com/<remote path>. fckapp.com redirects only the root.
# TLS: the login goes over TLS on the control channel (--ftp-ssl-control; Bluehost's cert is
# for *.bluehost.com, not the ftp hostname, so name checking is off with -k). The DATA channel
# is plain: with TLS on data, Bluehost keeps only the first 16-32 KB and never sends the final
# 226, which truncated files (Sep 28-29). Everything uploaded here is public site content.
# Never send the password in the clear (no plain ftp://).
# Safety + Bluehost quirks: every file is sent as .upload-<name>.tmp and renamed into place
# only after the served byte count matches, so a stalled transfer can never truncate a live
# file (this blanked index.html once). Bluehost stalls new FTP sessions that follow the
# previous one too quickly, so ALL files of a run share one session for the transfers and
# one for the renames, and a stalled run waits GAP seconds (default 60) before retrying.
set -euo pipefail
ENV_FILE=${ENV_FILE:-/Users/christophershannon/fuckfascists/.env}
GAP=${GAP:-30}
to=video; specs=()
while [ $# -gt 0 ]; do case $1 in --to) to=$2; shift 2;; *) specs+=("$1"); shift;; esac; done
[ ${#specs[@]} -gt 0 ] || { echo "usage: $0 <local>[=<remote/path>] ... [--to <remote-subdir>]" >&2; exit 1; }
netrc=$(mktemp); trap 'rm -f "$netrc"' EXIT; chmod 600 "$netrc"
python3 - "$ENV_FILE" "$netrc" <<'PY'
import re, sys
v = {}
for l in open(sys.argv[1]):
    m = re.match(r'\s*BLUHST_FCKFCOM_(USER|PW|SERVER)\s*=\s*(.*?)\s*$', l)
    if m:
        val = m.group(2)
        if len(val) >= 2 and val[0] == val[-1] and val[0] in '"\'': val = val[1:-1]
        v[m.group(1)] = val
missing = [k for k in ('USER', 'PW', 'SERVER') if k not in v]
if missing: sys.exit(f'missing BLUHST_FCKFCOM_{missing[0]} in {sys.argv[1]}')
host = re.sub(r'^[a-z]+://', '', v['SERVER']).split('/')[0].split(':')[0]
open(sys.argv[2], 'w').write(f"machine {host} login {v['USER']} password {v['PW']}\n")
PY
host=$(awk '{print $2}' "$netrc")
locals=(); remotes=()
for s in "${specs[@]}"; do
  if [[ "$s" == *=* ]]; then locals+=("${s%%=*}"); remotes+=("${s#*=}"); else locals+=("$s"); remotes+=("${to:+$to/}$(basename "$s")"); fi
done
served_size() { curl -sS -m 60 -H 'Cache-Control: no-cache' "https://fckfascists.com/$1?v=$RANDOM" 2>/dev/null | wc -c | tr -d ' '; }

for try in 1 2 3 4; do
  # one session: every file to its temp name (--ftp-create-dirs makes new folders)
  args=(); for i in "${!locals[@]}"; do d=$(dirname "${remotes[$i]}"); [ "$d" = . ] && d=""; args+=(-T "${locals[$i]}" "ftp://$host/${d:+$d/}.upload-$(basename "${remotes[$i]}").tmp"); done
  if curl -sS --netrc-file "$netrc" --ftp-ssl-control -k -m 1800 --ftp-create-dirs "${args[@]}" 2>/dev/null; then
    sleep 3
    # one session: rename each temp into place
    q=(); for i in "${!locals[@]}"; do d=$(dirname "${remotes[$i]}"); [ "$d" = . ] && d=""; t="${d:+$d/}.upload-$(basename "${remotes[$i]}").tmp"; q+=(-Q "RNFR $t" -Q "RNTO ${remotes[$i]}"); done
    if curl -sS --netrc-file "$netrc" --ftp-ssl-control -k -m 120 "${q[@]}" "ftp://$host/" -o /dev/null 2>/dev/null; then
      ok=1
      for i in "${!locals[@]}"; do
        want=$(stat -f %z "${locals[$i]}"); got=$(served_size "${remotes[$i]}")
        if [ "$got" = "$want" ]; then echo "ok  https://fckfascists.com/${remotes[$i]} ($want bytes)"; else echo "MISMATCH ${remotes[$i]}: served $got, local $want" >&2; ok=0; fi
      done
      [ $ok = 1 ] && exit 0
    fi
  fi
  echo "  run stalled (try $try), waiting ${GAP}s" >&2; sleep "$GAP"
done
echo "FAILED after 4 tries; live files untouched except any reported ok" >&2; exit 1
