# WhisperShield: Post-Compromise Resilient End-to-End Encrypted Messaging Engine
## Comprehensive Architectural Blueprint & Cryptographic Specification

### 1. Cryptographic Key Hierarchy & Roles

```
                                      [ Identity Key (IK) ]
                                   (Curve25519 & Ed25519)
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
           [ Signed PreKey (SPK) ]                       [ One-Time PreKeys (OPK) ]
           (Medium-term Curve25519)                      (Pool of 60 Single-Use Keys)
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

- **Identity Key ($IK$)**: Long-term Curve25519 key pair for DH and Ed25519 key pair for signing. Never rotated during normal operation.
- **Signed PreKey ($SPK$)**: Medium-term Curve25519 key pair authenticated under the user's $IK$ via an Ed25519 signature to prevent key substitution by an adversarial server.
- **One-Time PreKeys ($OPK_1, \dots, OPK_n$)**: A revolving pool of single-use Curve25519 keys. The zero-knowledge relay serves them atomically and evicts them immediately upon dispatch.
- **Ephemeral Key ($EK$)**: Generated freshly by the session initiator for each handshake turn, ensuring concurrent handshakes remain isolated.

---

### 2. X3DH Mathematical Derivation

When Alice initiates a session with an offline Bob:
1. Alice retrieves Bob's prekey bundle from the relay:
   $$\{ IK_B, SPK_B, \text{Sig}_{IK_B}(SPK_B), OPK_B \}$$
2. Alice verifies the Ed25519 signature:
   $$\text{Verify}(SPK_B, \text{Sig}_{IK_B}(SPK_B), IK_B) \stackrel{?}{=} \text{True}$$
3. Alice samples a fresh Curve25519 ephemeral key pair $EK_A$.
4. Alice computes up to four Diffie-Hellman agreements:
   $$\begin{aligned}
   DH_1 &= X25519(IK_A.\text{secretKey}, SPK_B) \\
   DH_2 &= X25519(EK_A.\text{secretKey}, IK_B) \\
   DH_3 &= X25519(EK_A.\text{secretKey}, SPK_B) \\
   DH_4 &= X25519(EK_A.\text{secretKey}, OPK_B) \quad \text{(omitted if OPKs exhausted)}
   \end{aligned}$$
5. Alice derives the Master Secret using HKDF-SHA256 (RFC 5869):
   $$SK = \text{HKDF-SHA256}(\text{salt}=0^{32}, \text{IKM}=DH_1 \parallel DH_2 \parallel DH_3 \,[\parallel DH_4], \text{info}=\text{"WhisperRatchetMaster"}, \text{length}=32)$$

When Bob receives Alice's initial handshake envelope containing $EK_A$, $IK_A$, and the consumed $OPK_B$ identifier:
$$\begin{aligned}
DH_1 &= X25519(SPK_B.\text{secretKey}, IK_A) \\
DH_2 &= X25519(IK_B.\text{secretKey}, EK_A) \\
DH_3 &= X25519(SPK_B.\text{secretKey}, EK_A) \\
DH_4 &= X25519(OPK_B.\text{secretKey}, EK_A)
\end{aligned}$$
Bob concatenates the identical DH outputs and derives the exact same 32-byte Master Secret $SK$.

---

### 3. Double Ratchet State Machine

Ongoing confidentiality is governed by continuous dual-ratcheting:
1. **Symmetric KDF Ratchet (Forward Secrecy per message)**:
   $$MK = \text{HMAC-SHA256}(CK_{\text{curr}}, \text{0x01})$$
   $$CK_{\text{next}} = \text{HMAC-SHA256}(CK_{\text{curr}}, \text{0x02})$$
   The message key $MK$ is used for a single AES-256-GCM payload encryption and is immediately wiped from memory.

2. **Asymmetric Diffie-Hellman Ratchet (Post-Compromise Security per turn)**:
   When an endpoint receives an updated ratchet public key $DH_{\text{remote}}$:
   $$\begin{aligned}
   DH_{\text{recv}} &= X25519(DH_{\text{local}}.\text{secretKey}, DH_{\text{remote}}) \\
   \{ RK_{\text{mid}}, CK_{\text{recv}} \} &= \text{HKDF-SHA256}(RK_{\text{curr}}, DH_{\text{recv}}, \text{"WhisperRatchetStep"}, 64) \\
   DH_{\text{local, new}} &= \text{Curve25519-KeyPair}() \\
   DH_{\text{send}} &= X25519(DH_{\text{local, new}}.\text{secretKey}, DH_{\text{remote}}) \\
   \{ RK_{\text{next}}, CK_{\text{send}} \} &= \text{HKDF-SHA256}(RK_{\text{mid}}, DH_{\text{send}}, \text{"WhisperRatchetStep"}, 64)
   \end{aligned}$$

3. **Authenticated Additional Data (AAD) Binding**:
   The plaintext header $\{ \text{dhRatchetPublicKey}, n, pn \}$ is strictly bound into the AES-256-GCM AAD:
   $$\text{Ciphertext}, \text{Tag} = \text{AES-256-GCM}(MK, \text{IV}, \text{Plaintext}, \text{AAD}=\text{canonicalJson}(\text{header}))$$
   Any tampering with sequence numbers or ratchet keys in transit invalidates the 128-bit authentication tag, throwing `CryptographicVerificationError`.

4. **Bounded Skipped-Key Storage**:
   Skipped message keys are cached in memory and IndexedDB up to a hard ceiling of $N = 200$ keys. Any message requesting a forward sequence gap $> 200$ is rejected immediately before key derivation, mitigating memory exhaustion and CPU denial-of-service.

---

### 4. Deterministic 60-Digit Safety Numbers

To detect active Man-in-the-Middle (MitM) relay substitution attacks:
1. Lexicographically sort raw public identity keys:
   $$[K_1, K_2] = \text{lexicographical\_sort}(IK_A, IK_B)$$
2. Concatenate:
   $$D_0 = K_1 \parallel K_2$$
3. Perform 5,200 sequential iterations of SHA-512 proof-of-work:
   $$D_{i} = \text{SHA-512}(D_{i-1}) \quad \text{for } i \in [1, 5200]$$
4. Extract 12 5-digit decimal blocks from the 64-byte digest:
   $$\text{Block}_j = \left( \left( \sum_{k=0}^3 D_{5200}[4j + k] \cdot 2^{8(3-k)} \right) \pmod{100000} \right)_{\text{pad5}}$$
5. Formatted into 12 5-digit monospace blocks:
   $$\text{XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX XXXXX}$$

---

### 5. Threat Model & Mitigation Matrix

| Threat Vector | Adversary Capability | WhisperShield Mitigation Mechanism |
|---|---|---|
| **Server Database Compromise** | Attacker has read access to SQLite database. | Server operates zero-knowledge blind routing. Stores only public prekey bundles and AES-256-GCM ciphertext blobs. Plaintext recovery is mathematically impossible. |
| **Active Man-in-the-Middle (MitM)** | Adversary intercepts traffic and serves substituted prekeys. | SPK is signed by permanent Ed25519 identity key. Users independently verify identity keys out-of-band using 60-digit SHA-512 Safety Numbers or QR codes. |
| **Device Compromise (Past)** | Attacker steals local device memory today. | **Forward Secrecy**: Message keys $MK$ are deleted immediately after decryption. Chain keys advance via one-way HMAC permutations. Past messages cannot be decrypted. |
| **Device Compromise (Future)** | Attacker steals local device memory and reads Root Key. | **Break-in Recovery (Post-Compromise Security)**: As soon as the uncompromised user sends a reply, the asymmetric DH ratchet samples fresh entropy, re-seeding $RK$ and cutting off the attacker. |
| **Replay & Frame Injection** | Attacker replays historical ciphertext frames or alters sequence numbers. | AES-256-GCM binds message counters $n$ and $pn$ into Authenticated Additional Data (AAD). Duplicate sequence numbers fail or trigger tag authentication failure. |
| **Denial-of-Service / Memory Exhaustion** | Attacker injects frames with forged counter $n = 10^8$. | Hard skip window limit enforced at $N = 200$. Frames exceeding threshold are aborted prior to computing HMAC iterations. |

---

### 6. Defense Viva Questions & Academic Answers

**Q1: Why does WhisperShield require both X3DH and the Double Ratchet rather than just one?**
*Answer:* X3DH solves the asynchronous rendezvous problem: mobile/web endpoints are rarely online at the same moment to execute an interactive handshake. X3DH enables Alice to establish a secure shared master secret with Bob using Bob's pre-published public keys without Bob being online. Once established, the Double Ratchet takes over ongoing conversational secrecy, continuously ratcheting symmetric and asymmetric keys to guarantee both Forward Secrecy and Post-Compromise Security.

**Q2: What is the exact mathematical difference between Forward Secrecy and Post-Compromise Security?**
*Answer:* Forward Secrecy protects past communications against future key compromise. It is achieved via one-way hash chains ($MK = \text{HMAC}(CK, 1), CK_{\text{next}} = \text{HMAC}(CK, 2)$); an attacker who steals $CK_{i}$ cannot invert the hash function to compute $CK_{i-1}$. Post-Compromise Security (Break-in Recovery) heals future communications after a temporary compromise. It is achieved via the asymmetric Diffie-Hellman ratchet; when the uncompromised party generates a new private scalar $x$ and sends $g^x$, the attacker cannot compute $g^{xy}$ without $x$, permanently terminating eavesdropping access.

**Q3: Why must the message header be bound into Authenticated Additional Data (AAD) rather than sent in the clear?**
*Answer:* If the header ($\text{dhRatchetPublicKey}, n, pn$) is sent in plaintext without AEAD authentication, an active attacker in transit can manipulate the sequence counter $n$. This would cause the receiver to desynchronize their symmetric ratchet chains or compute invalid skipped keys without triggering a ciphertext decryption error. Binding canonical JSON into the AES-256-GCM AAD ensures that any header tampering invalidates the 128-bit authentication tag.

**Q4: Why does Safety Number calculation require 5,200 iterations of SHA-512?**
*Answer:* 5,200 iterations of SHA-512 implement proof-of-work key stretching. If Safety Numbers were derived from a single SHA-256 hash, an adversarial relay server could attempt collision attacks (generating millions of ephemeral identity key pairs to find a matching visual fingerprint for a target victim). The computational cost of 5,200 SHA-512 rounds renders brute-force collision searches computationally infeasible.

