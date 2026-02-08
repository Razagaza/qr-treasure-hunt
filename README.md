# QR Treasure Hunt (Group Edition)

A group-based QR treasure hunt application where teams compete to find treasures by scanning encrypted QR codes.

## 🚀 Features

### 1. Group Access (`/`)
-   **Teams**: Join Team A, B, C, or D.
-   **Identity**: Enter your name to identify yourself within the team.
-   **Persistence**: Uses Cookies to keep you logged in.

### 2. QR Scanning (`/scan`)
-   **Encrypted QRs**: Codes are encrypted to prevent cheating.
-   **Smart Mapping**: The *same* QR code gives *different* treasures to different groups (Offset Logic).
-   **Interactive Solving**: Scan -> Answer Question -> Get Points & Hints.
-   **Timer**: Some treasures have a time limit!

### 3. Dashboard (`/dashboard`)
-   View Team Score and Username.
-   See list of found treasures.
-   Review unlocked hints.

### 4. Admin (`/admin`)
-   **Dashboard**: Live view of all groups (A, B, C, D) with real-time scores and progress.
-   **Reset Game**: Wipes all progress for a fresh start.
-   *Note*: QR code generation is done via seeding, not this UI anymore.

---

## 📖 How to Access & Play

### 1. Initial Setup (Admin)
1.  Go to `/api/admin/seed` to generate initial data if needed.
2.  Use the Admin Dashboard (`/admin`) to monitor progress.

### 2. User User Flow
1.  **Login**:
    -   Select Team & Enter Name.
    -   **Confirm** your choice before joining.
2.  **Play**:
    -   Scan QRs.
    -   **Unlimited Time**: Some treasures have no time limit (Close button available).
    -   **One Strike**: Wrong answers fail the treasure permanently!
3.  **Solve**:
    -   Answer the question presented.
    -   If correct, you get points and a hint!

---

## 🔧 Troubleshooting

### "Failed to load data" or "No group selected"
If you see this error on the Dashboard:

1.  **Cookies are disabled**: Ensure your browser allows cookies. The app uses `treasure-group` and `treasure-username` cookies.
2.  **Deployment Issue (Vercel/Netlify)**:
    -   This app uses **File-Based Storage** (`data/` folder).
    -   On serverless platforms like Vercel, the filesystem is **Read-Only** and **Ephemeral** (resets on redeploy).
    -   **Solution**: This app is best run on a **VPS** (DigitalOcean, AWS EC2) or locally (`localhost`) for persistent data.
    -   *However*, I have added a "Memory Fallback" mode. If the file cannot be written, it will try to keep data in memory (will reset if the server restarts).
3.  **Try Re-login**: Go back to `/` and login again.

### Technical Stack
-   **Framework**: Next.js 16 (App Router)
-   **Database**: JSON Files (in `/data`) + In-Memory Fallback
-   **Auth**: Cookies
-   **Scanning**: html5-qrcode

### Data Logic
-   **QR Mapping**: `getTreasureIdByQr` reads from `data/qr_codes.json`. This file is **created** during the seeding process (`saveQrCodeMapping`), not during the lookup.
-   **Storage**:
    -   `data/groups/*.json`: Stores group progress and members.
    -   `data/treasures/*.json`: Stores treasure data.
    -   `data/qr_codes.json`: Maps encrypted strings to IDs.
