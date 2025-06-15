# Discord File Storage Bot

This project allows you to store files by leveraging Discord as a storage backend. It includes features like file encryption, compression, and metadata storage in a MySQL database, all with a healthy dose of humor and self-awareness about its "limitations."

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [File Encryption Flow](#file-encryption-flow)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Features

- **Discord-Powered Storage**: Turns Discord into your personal file archive. Imagine the possibilities!
- **File Encryption**: Encrypts files using a user-provided password and a randomly generated initialization vector (IV) for enhanced security.
- **File Compression**: Compresses files using gzip before encryption to optimize storage space.
- **Metadata Storage**: Stores file metadata (filename, encryption status, timestamps, parts, message IDs, user, size, type) in a MySQL database.
- **Email Notifications (Optional)**: Can be configured to send email notifications for file generation, especially for larger files.

---

## Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: Download and install **Node.js version 20**.
2.  **MySQL**: Download and install **MySQL version 8.0.37**.
3.  **MONGO DB** : For user auth

---

## Installation

Follow these steps to get the project up and running:

1.  **Create MySQL Database and Table**:
    First, create the `discord_storage_bot` database and the `Discord_Files_Messages` table within it.

    ```sql
    CREATE DATABASE discord_storage_bot;

    USE discord_storage_bot;

    CREATE TABLE Discord_Files_Messages (
      filename VARCHAR(50) NOT NULL,
      is_Encrypted BOOLEAN NOT NULL DEFAULT 0,
      datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      totalParts INT NOT NULL,
      attachmentsMessageID JSON NOT NULL,
      hashedPassword VARCHAR(64) NOT NULL,
      fromUser VARCHAR(20),
      downloaded VARCHAR(20) NOT NULL DEFAULT 0,
      filesize BIGINT NOT NULL,
      filetype VARCHAR(20) NOT NULL,
      INDEX filename_idx (filename)
    );
    ```

2.  **Create `.env` file**:
    Create a file named `.env` in the root directory of your project and populate it with the following environment variables:

    ```env
    PORT = 8080
    TOKEN = your_discord_bot_token_from_discord_dev_portal
    CHANNEL_ID = discord_channel_id_for_file_storage (make sure your bot has permissions in this channel)

    // For Authentication
    MONGO_URI = your_local_or_atlas_mongo_db_uri
    REFRESH_TOKEN_SECRET = secret_for_JWT_refresh_token
    ACCESS_TOKEN_SECRET = secret_for_JWT_access_token

    // For Storing File Metadata
    SQL_PASSWORD = your_sql_password (default user is "root"; if you use a different user, update src/config/sqlconfig.js)

    // To enable file generation email notification (Optional)
    WEBSITELINK = "returdbot.duckdns.org:8080" # This is mostly irrelevant unless you want to use the email service and interact with the bot via Discord commands. It sends this link to download files.
    EMAIL = gmail_for_sending_notification_emails (you can use any email service provider, ensure API sending is enabled)
    PASSWORD = that_gmail_password
    GMAIL_API_CLIENT_ID = client_id_for_google_apis
    GMAIL_API_CLIENT_SECRET = client_secret_for_google_apis
    GMAIL_API_REFRESH_TOKEN = refresh_token_for_google_apis
    ```

3.  **Install Packages**:
    Navigate to your project's root directory in the terminal and install the necessary npm packages:

    ```bash
    npm install
    ```

4.  **Run the Project**:
    After successful installation, you can start the project. (Specific command to start the project goes here, e.g., `npm start` or `node index.js`)

---

## File Encryption Flow

The file encryption process follows these steps:

1.  **Password Hashing and IV Generation**: The user-provided password is **hashed (without any salt)** using SHA-256. Simultaneously, a random **Initialization Vector (IV)** is generated.
2.  **File Compression**: The original file is **compressed using gzip**.
3.  **Encryption**: The 64-character (32 bytes) hashed password and the generated IV are used to **encrypt the compressed file**.
4.  **IV Prepending**: The 16-byte IV is then **prepended onto the encrypted file**.
5.  **Hashed Password Storage**: The hashed password (without the IV) is **resolved and stored in the MySQL database** (handled in `index.js`).

The IV is saved within the first 16 bytes of the encrypted file itself. Note: You can specify a custom password during upload. If no password is provided, the default password **"turd"** will be used. YOU CAN CHANGE THIS PASSWORD IN src/drive/upload.js and download.js

---

## Disclaimer

**Do NOT make this your primary storage solution.** Discord might decide to play 'delete everything' at any moment. Only upload content you're comfortable losing.

---

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for more details.

---

For any questions or issues, feel free to open an issue on the GitHub repository.
