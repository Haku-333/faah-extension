# Test Fail Sound

Run tests from VS Code and play a fail sound whenever test output contains "fail".

## Features

- Adds command: `Run test with fail sound`
- Runs `npm test` in a child process
- Streams test output to a VS Code output channel
- Plays `media/faaah.mp3` when failure text is detected

## Command

- `test-fail-sound.runTests`

Open Command Palette and run `Run test with fail sound`.

## Requirements

- Node.js and npm installed
- A project where `npm test` runs your tests

## Known Issues

- Detection currently triggers on text matching `fail`; it is not framework-specific.

## Release Notes

### 0.0.1

- Initial version with test command and fail-sound playback.
