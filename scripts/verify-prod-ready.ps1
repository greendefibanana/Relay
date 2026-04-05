$ErrorActionPreference = "Stop"

$commands = @(
  @{
    Label = "Root TypeScript typecheck"
    Command = "npm.cmd"
    Args = @("run", "typecheck")
  },
  @{
    Label = "Root backend tests"
    Command = "npm.cmd"
    Args = @("test")
  },
  @{
    Label = "Rust workspace check"
    Command = "cargo"
    Args = @("check", "--workspace")
  },
  @{
    Label = "Select Anchor toolchain"
    Command = "avm"
    Args = @("use", "0.32.1")
  },
  @{
    Label = "Anchor build"
    Command = "anchor"
    Args = @("build")
  },
  @{
    Label = "Frontend tests"
    Command = "npm.cmd"
    Args = @("--prefix", "Frontend", "test", "--", "--watchAll=false", "--runInBand")
  },
  @{
    Label = "Frontend production build"
    Command = "npm.cmd"
    Args = @("--prefix", "Frontend", "run", "build")
  }
)

foreach ($entry in $commands) {
  Write-Host ""
  Write-Host "==> $($entry.Label)"
  & $entry.Command @($entry.Args)
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
