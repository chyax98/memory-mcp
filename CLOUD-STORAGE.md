# Using Simple Memory MCP with Cloud Storage

## ⚠️ Cloud Storage Warning

**SQLite + OneDrive/Dropbox = Problems**

- WAL mode creates 3 files that sync at different times → corruption risk
- File locking conflicts cause "database locked" errors
- 2-10x slower performance due to sync monitoring

## Solutions

### Option 1: Local + Backup (Recommended)

Store database locally, backup to cloud automatically:

```json
{
  "env": {
    "MEMORY_DB": "C:\\Users\\YourName\\AppData\\Local\\MCP-Memories\\memory.db",
    "MEMORY_BACKUP_PATH": "C:\\Users\\YourName\\OneDrive\\MCP-Memories\\backups",
    "MEMORY_BACKUP_INTERVAL": "60",
    "MEMORY_BACKUP_KEEP": "24"
  }
}
```

✅ **Best of both worlds:** Fast local storage + cloud backups

### Option 2: Cloud-Safe Mode

If you must store directly in cloud storage:

```json
{
  "env": {
    "MEMORY_DB": "C:\\Users\\YourName\\OneDrive\\MCP-Memories\\memory.db",
    "MEMORY_CLOUD_SAFE": "true"
  }
}
```

⚠️ **30-50% slower** but safer (uses DELETE journal instead of WAL)

## Summary

| Storage | Performance | Safety | Recommendation |
|---------|-------------|--------|----------------|
| **Local + Backup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Best |
| **Cloud + Safe Mode** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⚠️ OK |
| **Cloud + WAL Mode** | ⭐⭐⭐⭐ | ⭐ | ❌ Risky |

See README.md for configuration details.
