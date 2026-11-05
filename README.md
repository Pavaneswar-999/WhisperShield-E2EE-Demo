# WhisperShield 🛡️
### Industrial-Grade, Post-Compromise Resilient End-to-End Encrypted (E2EE) Messaging Engine

[![Signal Protocol](https://img.shields.io/badge/Protocol-Signal%20X3DH%20%2B%20Double%20Ratchet-285C70.svg)](https://signal.org/docs/)
[![AEAD Encryption](https://img.shields.io/badge/AEAD-AES--256--GCM%20%2B%20AAD-60899B.svg)](https://tools.ietf.org/html/rfc5116)
[![Key Exchange](https://img.shields.io/badge/KEM-Curve25519%20%26%20Ed25519-1C3E4E.svg)](https://cr.yp.to/ecdh.html)
[![Verification](https://img.shields.io/badge/Tests-8%2F8%20Passing%20(100%25)-16303D.svg)](https://vitest.dev)
[![Zero-Knowledge Relay](https://img.shields.io/badge/Relay-SQLite%20WAL%20Zero--Knowledge-517380.svg)](https://sqlite.org/wal.html)

---

## 📌 Executive Overview

**WhisperShield** is a zero-trust, post-compromise resilient End-to-End Encrypted (E2EE) messaging application implementing the **Signal Protocol specification**. It combines asynchronous key agreement via **Extended Triple Diffie-Hellman (X3DH)** with continuous forward-secrecy state transitions using the **Double Ratchet**, authenticated payload binding via **AES-256-GCM AEAD**, and out-of-band Man-in-the-Middle (MitM) auditing through **60-digit iterative SHA-512 Safety Numbers**.

All cryptographic operations run native **SubtleCrypto** and **TweetNaCl** in the client environment. The backend relay server functions strictly as an untrusted, zero-knowledge store-and-forward blind router backed by SQLite Write-Ahead Logging (WAL), retaining zero master secrets, zero Diffie-Hellman outputs, and zero plaintexts.

---

## 🔑 Cryptographic Architecture & Key Hierarchy

```
                                      [ Identity Key (IK) ]
                                   (Curve25519 & Ed25519)
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
           [ Signed PreKey (SPK) ]                       [ One-Time PreKeys (OPK) ]
           (Medium-term Curve25519)                      (Pool of Single-Use Keys)
           Cryptographically signed                      Consumed atomically upon
           by Ed25519 Identity Key                       session handshake (X3DH)
                     |                                               |
                     +-----------------------+-----------------------+
                                             |
                               [ Ephemeral Key (EK) ]
                              (Fresh Per Handshake Turn)
                                             |
                                  [ Shared Secret (SK) ]
                                             |
                                    [ Double Ratchet ]
                                             |
                         +-------------------+-------------------+
                         |                                       |
                [ Diffie-Hellman Ratchet ]               [ Symmetric Ratchets ]
                Fresh entropy per turn                  One-way KDF per message
                Post-Compromise Security                 Forward Secrecy
```

### 1. Extended Triple Diffie-Hellman (X3DH)
- **Mutual Identity Authentication**: $DH_1 = X25519(IK_A.\text{secretKey}, SPK_B)$
- **Forward Secrecy Guarantee**: $DH_2 = X25519(EK_A.\text{secretKey}, IK_B)$
- **Signed PreKey Agreement**: $DH_3 = X25519(EK_A.\text{secretKey}, SPK_B)$
- **Single-Use Session Isolation**: $DH_4 = X25519(EK_A.\text{secretKey}, OPK_B)$
- **Master Secret (SK)** derived via HKDF-SHA256 (RFC 5869):
  $$SK = \text{HKDF-SHA256}(0^{32}, DH_1 \parallel DH_2 \parallel DH_3 \parallel DH_4, \text{"WhisperRatchetMaster"}, 32)$$

### 2. Double Ratchet State Machine
- **Symmetric KDF Chains (Forward Secrecy)**: Advances one-way hash chains per message:
  $$MK = \text{HMAC-SHA256}(CK_{\text{curr}}, \text{0x01})$$
  $$CK_{\text{next}} = \text{HMAC-SHA256}(CK_{\text{curr}}, \text{0x02})$$
  Message keys ($MK$) are immediately wiped from memory after a single AES-256-GCM payload encryption.
- **Asymmetric DH Ratchet (Post-Compromise Security / Break-in Recovery)**: Samples fresh Curve25519 entropy on every conversational turn. If device memory is temporarily compromised at step $t$, the next turn permanently locks out the attacker.
- **Authenticated Additional Data (AAD) Header Binding**: Enforces canonical JSON binding of $\{ \text{dhRatchetPublicKey}, n, pn \}$ into the AES-256-GCM authentication tag. Any transit tampering immediately triggers `CryptographicVerificationError`.
- **Bounded Skip Cache**: Out-of-order messages are handled through a bounded skipped-key cache capped at $N = 200$ keys, mitigating memory-exhaustion denial-of-service.

### 3. Out-of-Band 60-Digit Safety Numbers
- Identity keys sorted lexicographically: $[K_1, K_2] = \text{sort}(IK_A, IK_B)$.
- Processed through **5,200 sequential iterations of SHA-512 proof-of-work** key stretching to eliminate relay collision attacks.
- Rendered as 12 5-digit decimal blocks and deterministic QR codes for optical validation.

---

## 🛡️ Threat Model & Security Invariants

| Threat Vector | Adversary Capability | WhisperShield Mitigation Mechanism |
| :--- | :--- | :--- |
| **Server Database Compromise** | Attacker has read access to SQLite database. | Zero-knowledge blind routing. Server stores only public prekey bundles and AES-256-GCM ciphertext blobs. |
| **Active Man-in-the-Middle (MitM)** | Adversary intercepts traffic and substitutes keys. | SPK is signed by permanent Ed25519 identity key. Verified out-of-band using 60-digit SHA-512 Safety Numbers or QR. |
| **Device Compromise (Past)** | Attacker steals local device memory today. | **Forward Secrecy**: Message keys $MK$ are deleted immediately after decryption. Past messages cannot be decrypted. |
| **Device Compromise (Future)** | Attacker steals local device memory and Root Key. | **Break-in Recovery (Post-Compromise Security)**: Next turn samples fresh Curve25519 entropy, re-seeding $RK$ and cutting off the attacker. |
| **Replay & Frame Injection** | Attacker replays historical ciphertext frames or alters sequence numbers. | AES-256-GCM binds message counters $n$ and $pn$ into Authenticated Additional Data (AAD). Tag mismatch rejects forged frames. |
| **Denial-of-Service / Memory Exhaustion** | Attacker injects frames with forged counter $n = 10^8$. | Hard skip window limit enforced at $N = 200$. Frames exceeding threshold are aborted prior to computing HMAC iterations. |

---

## 💻 Tech Stack

### Client Side (Frontend)
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Custom Charcoal, Japanese Indigo, Steel Teal & Star Dust Palette)
- **Cryptography**: Native Web Crypto API (SubtleCrypto AES-256-GCM, HKDF-SHA256, SHA-512), TweetNaCl (Curve25519, Ed25519)
- **UI & Motion**: Framer Motion, 3D Gyroscopic Tilt (`TiltCard`), `TextPressure` variable typography, `JellyRadio` spring selectors, and `PatternWaves` silk canvas
- **Testing**: Vitest integration test suite (8 cryptographic verification suites)

### Server Side (Backend)
- **Runtime**: Node.js + Express + TypeScript
- **Database**: SQLite WAL via `better-sqlite3` (Atomic single-use OPK transactions)
- **Real-Time Communication**: Native WebSocket (`ws`) blind store-and-forward relay

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Pavaneswar-999/WhisperShield-E2EE-Demo.git
   cd WhisperShield-E2EE-Demo
   ```

2. **Install Server Dependencies**:
   ```bash
   cd whisper-shield/server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

### Running Locally

1. **Start the Zero-Knowledge Relay Server** (Port `8080`):
   ```bash
   cd whisper-shield/server
   npm run dev
   ```

2. **Start the Web Client** (Port `5173`):
   ```bash
   cd whisper-shield/client
   npm run dev
   ```

3. Open your browser at **`http://localhost:5173`**.

---

## 🧪 Running Cryptographic Integration Tests

WhisperShield includes full integration tests verifying mathematical invariants across both endpoints:

```bash
cd whisper-shield/client
npm run test
```

### Verified Test Suites:
1. `✓ 1. Executes full X3DH Initial Key Agreement with matching Master Secret`
2. `✓ 2. Normal alternating conversational flow across multiple ratchet turns`
3. `✓ 3. Burst message delivery (multiple sequential messages before reply)`
4. `✓ 4. Out-of-order message delivery via bounded skipped-key cache`
5. `✓ 5. Hard skip window enforcement (rejects skipping > 200 keys)`
6. `✓ 6. Integrity failure detection (tampered ciphertext or header AAD throws tag error)`
7. `✓ 7. Deterministic Safety Number derivation across endpoints (5,200 rounds SHA-512)`
8. `✓ 8. X3DH invalid signature rejection`

---

## 🎓 Viva & Academic Defense Quick Reference

- **Q: Why combine X3DH and Double Ratchet?**
  *A: X3DH solves the asynchronous rendezvous problem (endpoints communicate without both being online simultaneously). Double Ratchet takes over once established, ratcheting symmetric keys per-message and asymmetric keys per-turn.*
- **Q: What is the difference between Forward Secrecy and Post-Compromise Security?**
  *A: Forward Secrecy protects past messages if current keys are compromised (via one-way hash chains). Post-Compromise Security heals future communications after compromise (via fresh asymmetric DH turns).*
- **Q: Why bind headers into AEAD Authenticated Additional Data?**
  *A: To prevent transit manipulation of sequence numbers ($n$, $pn$) and ratchet keys. Manipulation causes tag authentication failure before state corruption occurs.*
- **Q: Why 5,200 rounds of SHA-512 for Safety Numbers?**
  *A: Implements proof-of-work key stretching, rendering relay brute-force collision attacks computationally infeasible.*

---

## 📄 License
MIT License. Free for educational, academic, and open-source use.

