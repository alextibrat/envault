# envault

> A CLI tool for securely syncing and versioning `.env` files across team members using encrypted backends.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize envault in your project, then push and pull encrypted environment files with ease.

```bash
# Initialize a new vault in your project
envault init

# Push your local .env to the vault
envault push

# Pull the latest .env from the vault
envault pull

# List all stored versions
envault versions

# Restore a specific version
envault restore --version 3
```

### Configuration

On first run, `envault init` will create an `envault.config.json` file in your project root where you can configure your backend (e.g., S3, GCS, or local) and encryption settings.

```json
{
  "backend": "s3",
  "bucket": "my-team-vault",
  "region": "us-east-1",
  "encryptionKey": "your-secret-key"
}
```

> **Note:** Never commit your `envault.config.json` or `.env` files to version control. Add them to `.gitignore`.

---

## Requirements

- Node.js >= 16
- A supported backend (AWS S3, Google Cloud Storage, or local filesystem)

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](./LICENSE)