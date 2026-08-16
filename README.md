# Signal Yard

Signal Yard is an interactive teleoperation network simulator. You control a small excavator, change the network, and watch commands and feedback move through the system.

## What this project teaches

- Why the full feedback loop matters more than outbound command delay alone
- How latency, jitter, packet loss, and limited bandwidth change remote control
- Why old commands can be dangerous
- How heartbeats help detect a lost connection
- Why immediate safety decisions need to run near the machine
- How local assistance reduces dependence on a fast network

## How to run it

You need a current version of Node.js.

```bash
npm install
npm run dev
```

Open the local address shown in the terminal.

## How the simulator works

The operator sends a command packet. The network adds delay and may drop it. The edge computer checks the command, the machine reacts, and delayed telemetry and visual feedback travel back.

The machine view shows two states:

- The solid excavator is the machine now.
- The faded excavator is the operator's last visual update.

The gap between them makes feedback delay visible.

## Project structure

```text
src/
  app/                         page composition and styles
  features/teleoperation/
    components/                simulator UI
    events/                    event history
    hooks/                     React connection to the simulator
    learning/                  short explanations
    machine/                   movement rules
    network/                   packet delay, jitter, and loss
    safety/                    heartbeat and command checks
    simulation/                simulation coordinator and clock
    types.ts                   shared domain types
  shared/components/           reusable UI controls
```

The network, machine, and safety rules do not depend on React. Future modules can replace a simulated part without rewriting the page.

## What is simulated

- Command, telemetry, feedback, and heartbeat packets
- Round-trip latency and uneven packet timing
- Packet loss and disconnects
- Visual update rate under limited bandwidth
- Sequence numbers, timestamps, and stale command rejection
- Heartbeat timeout, safe stop, degraded mode, and speed limits
- Direct, assisted, and simple supervised control

## What is simplified

There is no real video codec, WebRTC, gRPC, backend, or production machine physics. The thresholds are examples for learning, not real safety limits.

This is an educational simulation. It does not represent TerraFirma's private architecture or real construction equipment safety rules.

## Tests

```bash
npm test
```

The tests cover packet delay, jitter, loss, disconnects, stale commands, heartbeats, reconnects, and control-mode behavior.

## What's next

Later modules can add real transport tools such as WebRTC and gRPC while keeping this simulator as the networking foundation.
