# GitLock

*Verifiable, Trustless Code Escrow & Deployment Binding Platform.*

---

### **1. The "Why?" (Problem Statement)**

In the freelance software world, there is a fundamental "Deadlock of Trust":

* **The Developer's Risk:** "If I deliver the source code first, the client might steal it and never pay."
* **The Client's Risk:** "If I pay first, the developer might ghost me, or deliver broken code that doesn't match the demo."
* **The "Demo" Scam:** A developer might show a working demo hosted on `vercel.app` but deliver an empty or broken zip file.

**GitLock Solution:** An impartial, automated middleman. It cryptographically guarantees that the **Source Code** (in the Vault) matches the **GitHub Commit** (History) which matches the **Live Deployment** (The Demo). No trust required—just math.

---

### **2. The Workflow (The "Happy Path")**

This workflow is designed to be **immutable**. Once a version is locked, it cannot be secretly changed.

#### **Phase 1: The Binding (Developer Action)**

1. **Upload:** Developer uploads `source_code.zip` to GitLock.
2. **Encryption:** The system immediately **Encrypts** this file (AES-256) and stores it safely.
3. **Hash Generation:** The system calculates the `UPLOAD_HASH` (SHA-256) of the file.
4. **GitHub Link:** The Developer selects the specific **GitHub Commit** associated with this work via OAuth.
5. **Verification I (Source Integrity):**
* GitLock fetches the *official* source code archive for that commit directly from GitHub.
* It computes `GITHUB_HASH`.
* **Check:** `UPLOAD_HASH == GITHUB_HASH`. If they don't match, the upload is rejected. (Prevents uploading a fake zip file).



#### **Phase 2: The Discovery (System Action)**

6. **Verification II (Deployment Integrity):**
* GitLock queries the GitHub API for **Deployments** linked to that specific commit SHA.
* It automatically discovers the live URL (e.g., `https://project-demo.vercel.app`) from the CI/CD status.
* *Result:* The Client knows for a fact that the website they are viewing was built from the exact code locked in the vault.



#### **Phase 3: The Exchange (Client Action)**

7. **Review:** Client logs in. They cannot download the code yet (Status: 🔒 **LOCKED**).
8. **Proof:** Client sees the "Verified Deployment" link. They click it and test the live site.
9. **Payment:** Client clicks **"Unlock & Pay"**.
* A **Razorpay (Test Mode)** modal appears.
* Client completes the mock transaction.


10. **Release:**
* GitLock backend verifies the **HMAC Digital Signature** of the payment webhook.
* Status updates to **PAID**.
* The "Download" button unlocks, decrypting the zip file on-the-fly.



---

### **3. Implementation Plan (Tech Stack)**

You are using a pure JavaScript stack(Strictly No Typescript, Just plain Javascript) (MERN/PERN) optimized for this specific lab.

* **Frontend:** Next.js (App Router), Tailwind CSS (for the "Cyber" aesthetic).
* **Backend:** Express.js (Node.js).
* **Database:** PostgreSQL (via Supabase).
* **Integrations:**
* **GitHub API (Octokit):** For fetching commits and deployment statuses.
* **Google OAuth**: For Continue with Google while logging/signing up

* **GitHub OAuth**: For Continue with GitHub while logging in/signing up
* **Razorpay (Test Mode):** For simulating the payment gateway.



---

### **4. Security Architecture**



| **Component**             | **Feature in GitLock**               | **Technical Implementation**                                                                                                                                     |
| ------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Authentication**     | **Secure Login**                     | JWT (JSON Web Tokens) stored in **HTTP-Only cookies**. Passwords hashed using `bcrypt`. Supports **Google** and **GitHub OAuth**.                                |
| **1. MFA (Multi-Factor)** | **Payment MFA** (for critical steps) | Before the **Pay** modal opens, the user must enter an **Email OTP** to verify identity before a financial action.                                               |
| **2. Authorization**      | **RBAC (Role-Based Access Control)** | **Access Matrix:**<br>• **Dev:** Write Code, Read Status<br>• **Client:** Read Preview, Write Approval<br>• **System:** Write Deployment Status (non-human role) |
| **3. Encryption**         | **Data Privacy**                     | **AES-256** encryption. `source_code.zip` is stored as an encrypted buffer in PostgreSQL: `Buffer.from(encryptedData, 'hex')`.                                   |
| **4. Hashing**            | **Data Integrity**                   | **SHA-256 comparison** between uploaded file hash and GitHub Commit Archive hash. Mismatch → **Reject upload**.                                                  |
| **4. Digital Signature**  | **Authenticity**                     | **HMAC-SHA256** verification of `x-razorpay-signature` webhook header to confirm genuine payment success.                                                        |
| **5. Encoding**           | **Visual Proof**                     | **Base64 encoding** of `README.md` to render a **Preview Card** on the dashboard without downloading the file.                                                   |
