# Sync ~/.pi/agent -> this repo (GitHub backup).
# Usage:  powershell -ExecutionPolicy Bypass -File sync.ps1
# Then review with git status/diff and commit.
#
# Excluded by design (secrets / personal / generated):
#   auth.json, trust.json, sessions/, models-store.json,
#   node_modules, .venv, __pycache__, browser .profile, *.bak-*

$ErrorActionPreference = "Stop"
$src = "$env:USERPROFILE\.pi\agent"
$dst = $PSScriptRoot

# Exact mirrors (source is truth; deletions propagate)
robocopy "$src\agents"  "$dst\agents"  /MIR /NJH /NJS /NDL /NFL | Out-Null
robocopy "$src\prompts" "$dst\prompts" /MIR /NJH /NJS /NDL /NFL | Out-Null

# Additive copies (deletions handled by hand)
robocopy "$src\extensions" "$dst\extensions" /E /XD node_modules .profile /NJH /NJS /NDL /NFL | Out-Null
robocopy "$src\skills"     "$dst\skills"     /E /XD node_modules .venv __pycache__ /NJH /NJS /NDL /NFL | Out-Null

# Single files
Copy-Item "$src\PRIME.md"          "$dst\PRIME.md"          -Force
Copy-Item "$src\settings.json"     "$dst\settings.json"     -Force
Copy-Item "$src\npm\package.json"      "$dst\npm\package.json"      -Force
Copy-Item "$src\npm\package-lock.json" "$dst\npm\package-lock.json" -Force

Write-Host "Synced. Next: git add -A && git commit && git push"
