# PulseTelemetry — Live System Monitoring Dashboard

A production-grade, high-performance **Real-Time Monitoring Dashboard** built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**.

Simulates real-time distributed telemetry streams (10 to 500+ events/sec) with an enterprise architectural focus on **high-frequency backpressure handling**, **bounded memory safety**, **resilient exponential backoff reconnection**, **strict runtime type-guard validation**, and **zero-XSS rendering**.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack & Rationale](#tech-stack--rationale)
3. [Quick Start & Installation](#quick-start--installation)
4. [System Architecture](#system-architecture)
5. [Real-Time Streaming Engine](#real-time-streaming-engine)
6. [High-Frequency Performance Strategy](#high-frequency-performance-strategy)
7. [Resilience & Exponential Backoff](#resilience--exponential-backoff)
8. [Security & XSS Defense](#security--xss-defense)
9. [Stress Testing & Assessment Controls](#stress-testing--assessment-controls)
10. [Test Suite](#test-suite)

---

## 1. Project Overview

Modern cloud platforms generate telemetry at high velocities. Naive React implementations that commit every incoming socket event directly to component state cause catastrophic render cascading, DOM lockups, and memory leaks.

This project demonstrates a production-quality frontend streaming architecture capable of handling **high-frequency telemetry (10–500 events/second)** without sacrificing a fluid **60 FPS** user experience:

- **Decoupled Stream Client**: Emulates a resilient WebSocket/SSE transport with realistic service metrics, status distributions, and failure scenarios.
- **Backpressure Buffer**: Accumulates incoming raw events in an unrendered ref buffer, flushed to React state at a controlled cadence (every 150ms).
- **Strict Runtime Validation**: Rejects malformed, out-of-range, or corrupted payloads before they pollute application state.
- **Bounded Memory**: Enforces strict caps (`MAX_EVENTS = 500`, `MAX_CHART_POINTS = 60`) to prevent runaway garbage collection and heap bloat.
- **DOM Virtualization**: Employs `react-window` to render only the visible rows, guaranteeing zero rendering lag even during high-velocity bursts.

---

## 2. Tech Stack & Rationale

| Technology | Purpose | Rationale |
| :--- | :--- | :--- |
| **React 18+** | UI Framework | Functional components, concurrent mode features, hooks (`useRef`, `useMemo`, `useCallback`, `memo`). |
| **TypeScript 5.7+** | Type Safety | Strict typing, runtime type guards (`is MonitoringEvent`), zero `any` policy. |
| **Vite 6** | Build & Dev Tooling | Lightning-fast HMR, lean bundle output, ES module loading. |
| **Tailwind CSS** | Styling | Utility-first, zero runtime CSS-in-JS overhead, enterprise dark theme styling. |
| **Recharts** | Time-Series Graph | Composable SVG area charts. Optimized by disabling animations on live series to eliminate CPU spikes. |
| **react-window** | List Virtualization | Limits DOM nodes to only visible viewport rows; essential for handling high-volume event streams. |
| **Vitest & RTL** | Testing | Fast in-memory unit and integration testing of validation, streaming, and custom hooks. |

---

## 3. Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd suadeo

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Verification & Production Build

```bash
# Run unit & integration tests
npm run test:run

# Run TypeScript typecheck
npm run typecheck

# Build for production
npm run build
```

---

## 4. System Architecture

The codebase strictly enforces the **Single Responsibility Principle**, keeping business logic, transport mechanisms, and presentation isolated:

```text
src/
├── components/
│   ├── Header.tsx           # Global brand header with live clock & telemetry indicators
│   ├── ConnectionBar.tsx    # Connection state (Live, Connecting, Reconnecting, Paused, Error)
│   ├── KpiCards.tsx         # Memoized grid computing derived telemetry metrics
│   ├── KpiCard.tsx          # Reusable atomic KPI card with badges and trends
│   ├── LiveChart.tsx        # Bounded time-series AreaChart with warning/critical threshold lines
│   ├── FilterBar.tsx        # Service, status, time window, and debounced text filters
│   ├── EventsList.tsx       # Virtualized table container using react-window
│   ├── EventRow.tsx         # Memoized table row with XSS-safe text rendering & latency gauge
│   ├── Loading.tsx          # Initial connection fallback state
│   ├── EmptyState.tsx       # Accessible empty state when no events match filters
│   ├── ErrorState.tsx       # Accessible connection failure alert with retry trigger
│   └── DemoControls.tsx     # Technical review sandbox (frequency slider, burst & malformed injectors)
│
├── hooks/
│   ├── useLiveStream.ts     # Core ingestion engine, non-state buffer, flush scheduler, backoff logic
│   └── useDebounce.ts       # Debounce hook for smooth text filtering without render stalls
│
├── services/
│   └── streamClient.ts      # Mock WebSocket/SSE transport with subscriptions, burst & fault simulation
│
├── types/
│   └── event.ts             # TypeScript domain interfaces: MonitoringEvent, Status, Filters, KPIs
│
├── utils/
│   ├── validate.ts          # Strict type guards and sanitizers for untrusted stream data
│   ├── helpers.ts           # Number, date, rate calculations, and chart downsampling algorithms
│   └── constants.ts         # Centralized configuration (MAX_EVENTS, BATCH_INTERVAL_MS, SERVICES)
│
├── test/
│   ├── setup.ts             # Vitest environment setup
│   ├── validate.test.ts     # Boundary and type-guard validation tests
│   ├── streamClient.test.ts # StreamClient lifecycle and subscriber tests
│   ├── helpers.test.ts      # KPI math and chart aggregation tests
│   └── useLiveStream.test.ts# Batching, backpressure, and backoff integration tests
│
├── App.tsx                  # Root layout orchestration and derived filter pipeline
├── main.tsx                 # React DOM mount point
└── index.css                # Tailwind directives and custom scrollbar styles
```

---

## 5. Real-Time Streaming Engine

The streaming layer in `src/services/streamClient.ts` operates as an event emitter mimicking a WebSocket/SSE connection:

- **Realistic Telemetry Generation**: Generates synthetic events from distributed microservices (`API Gateway`, `Authentication`, `Payments`, `Database`, `Notifications`, `Search Service`).
- **Statistical Distribution**:
  - Healthy (75%): Metrics 15–100ms (normal latency)
  - Warning (18%): Metrics 160–550ms (elevated latency / pool pressure)
  - Critical (7%): Metrics 600–3000ms (timeout / failover)
- **Lifecycle API**:
  - `connect()`: Simulates network handshake and starts emission.
  - `disconnect()`: Teardown timers and clean up event listeners.
  - `pause()` / `resume()`: Halts/resumes generator emissions.
  - `burst(count)`: Injects an instantaneous burst of N events.
  - `simulateError(msg)`: Disconnects the socket to trigger reconnect logic.
  - `injectMalformed()`: Dispatches corrupted objects to test validator resilience.

---

## 6. High-Frequency Performance Strategy

### The 10–500 Events/Sec Challenge
Updating React state on every single event at 50 eps would trigger 50 re-renders per second, starving the browser's main thread and causing severe UI freeze.

### How We Solve It:

1. **Non-State Reference Buffer (`useRef`)**:
   Incoming events bypass React state entirely and are pushed into `rawBufferRef.current`. This operation has $O(1)$ complexity and triggers zero component reconciliations.

2. **Controlled Batch Interval (`BATCH_INTERVAL_MS = 150ms`)**:
   A periodic scheduler ticks every 150ms:
   - Drains the raw buffer in one operation.
   - Runs validation and sanitization on each item.
   - Prepends valid events to the bounded array.
   - Commits **one single React state update** per interval (~6 updates per second max), preserving full 60 FPS UI fluidity.

3. **Bounded Memory Allocations**:
   - `MAX_EVENTS = 500`: The recent event list retains only the latest 500 records (`slice(0, 500)`). Older records are discarded, preventing JavaScript heap exhaustion.
   - `MAX_BUFFER_CAPACITY = 2000`: If an extreme burst occurs while the UI is rendering, the buffer drops the oldest events and logs a drop counter rather than exhausting browser RAM.
   - `MAX_CHART_POINTS = 60`: Chart points are downsampled into 60 buckets.

4. **DOM Virtualization with `react-window`**:
   Rather than mounting 500 complex DOM tree nodes, `EventsList` renders only the ~11 rows visible in the viewport. As the user scrolls, rows are reused dynamically.

5. **Targeted Memoization**:
   - `React.memo`: Wraps `KpiCards`, `LiveChart`, `FilterBar`, and `EventRow` to prevent re-renders when parent state changes unrelated properties.
   - `useMemo`: Computes filtered event lists, KPI aggregates, and chart buckets only when the underlying dataset or filter criteria change.
   - `isAnimationActive={false}` on `Recharts Area`: SVG entry animations on streaming data create massive layout recalculations. Disabling animation maintains constant frame times.

---

## 7. Resilience & Exponential Backoff

Network interruptions are handled by an automated reconnection state machine in `src/hooks/useLiveStream.ts`:

1. **State Machine**:
   - `connecting`: Initial network negotiation.
   - `live`: Active ingestion at current rate.
   - `paused`: Suspended by user; preserves current view.
   - `reconnecting`: Network failed; backoff timer in progress.
   - `error`: Fatal error or manual drop.

2. **Exponential Backoff Formula**:
   $$\text{Delay} = \min(\text{INITIAL\_DELAY} \times \text{FACTOR}^{\text{retry}-1}, \text{MAX\_DELAY}) \times \text{Jitter}$$
   - Initial delay: `1,000ms`
   - Factor: `2` (1s $\to$ 2s $\to$ 4s $\to$ 8s $\to$ 16s $\to$ 30s cap)
   - Jitter: $\pm 20\%$ randomized variation to prevent thundering herd.

3. **Safety Invariants**:
   - **No Duplicate Loops**: Any existing reconnect timeout is cleared before scheduling a new attempt.
   - **Counter Reset**: Successful connection resets the attempt counter back to 0.
   - **Unmount Cleanliness**: Component unmounting clears all timers (`isMountedRef`) to prevent memory leaks and setState warnings on unmounted components.

---

## 8. Security & XSS Defense

All streamed telemetry is treated as **untrusted, hostile external input**:

1. **Runtime Type-Guard Validation (`src/utils/validate.ts`)**:
   Every incoming event must pass `isValidMonitoringEvent(data: unknown)`:
   - Must be a non-null object (not array or primitive).
   - `id`: Non-empty string, length $\le 64$.
   - `timestamp`: Finite positive number within a sane temporal window (2020 to $+24$h).
   - `service`: Non-empty string, length $\le 64$.
   - `status`: Must strictly match `'healthy' | 'warning' | 'critical'`.
   - `metric`: Finite positive number between $0$ and $100,000$.
   - `message`: String with maximum length of $512$ characters.

2. **Zero `dangerouslySetInnerHTML`**:
   Messages are rendered strictly using native React JSX text interpolation:
   ```tsx
   <span>{event.message}</span>
   ```
   Payloads such as `<script>alert('xss')</script>` or `<img src=x onerror=alert(1)>` are displayed verbatim as harmless text strings.

3. **No Hardcoded Secrets**:
   No tokens, keys, passwords, or secrets exist in the codebase. Configurable parameters are exposed via `.env.example`.

---

## 9. Stress Testing & Assessment Controls

A dedicated collapsible **Technical Assessment & Stress Testing Sandbox** is embedded at the bottom of the dashboard:

- **Rate Adjustment**: Toggle stream rates between **10/s**, **25/s**, **100/s**, and **500/s**.
- **Burst Injection**: Trigger instant spikes of **+50**, **+200**, or **+500** events to evaluate buffer capacity and virtualization stability.
- **Simulate Network Drop**: Triggers a simulated transport failure to observe real-time exponential backoff and automatic recovery.
- **Inject Bad Data**: Dispatches malformed and corrupted objects to verify that the validation layer drops them without UI disruption (check the *Dropped/Rejected* counter).

---

## 10. Test Suite

The test suite is powered by **Vitest** and **React Testing Library**:

```bash
npm run test:run
```

### Tested Capabilities:
- `validate.test.ts`: Rejection of missing keys, non-finite numbers, invalid status enums, XSS payload handling, and sanitization formatting.
- `streamClient.test.ts`: Connection handshake, pausing, resuming, burst emissions, subscriber callbacks, and simulated errors.
- `helpers.test.ts`: Pure KPI calculations, status determination thresholds, and time-series bucketing algorithms.
- `useLiveStream.test.ts`: Buffer accumulation, 150ms batch commit verification, rejection of malformed objects, user pause isolation, and exponential backoff retry.
