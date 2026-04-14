# @atlex/config

> Centralized configuration management with .env support and type-safe dot-notation access.

[![npm](https://img.shields.io/npm/v/@atlex/config.svg?style=flat-square&color=7c3aed)](https://www.npmjs.com/package/@atlex/config)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-7c3aed.svg?style=flat-square)](https://www.typescriptlang.org/)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=flat-square&logo=buy-me-a-coffee)](https://buymeacoffee.com/khamazaspyan)

## Installation

```bash
npm install @atlex/config
# or
yarn add @atlex/config
```

## Quick Start

```typescript
import { config, env, loadEnv } from '@atlex/config'

// Load environment variables from .env file
loadEnv()

// Access configuration with dot notation
const appName = config('app.name')
const dbHost = config('database.host')

// Get environment variables
const nodeEnv = env('NODE_ENV', 'development')

// Check if configuration exists
if (config.has('api.secret')) {
  const secret = config('api.secret')
}

// Get all configuration
const allConfig = config.all()
```

## Features

- **Dot-Notation Access**: Access nested configuration using familiar dot notation syntax
- **.env File Support**: Automatically load environment variables from `.env` files
- **Type-Safe Getters**: Retrieve configuration with type coercion and default values
- **Wildcard Queries**: Query configuration hierarchies with wildcard patterns
- **Configuration Caching**: Cache configuration in memory for improved performance
- **Environment Casting**: Automatic type casting for environment variables
- **File-Based Loaders**: Load configuration from various file formats

## Configuration Loading

### Loading Environment Variables

```typescript
import { loadEnv } from '@atlex/config'

// Load from .env file in the root directory
loadEnv()

// Load from a specific .env file
loadEnv('.env.local')

// Load from multiple files with precedence
loadEnv('.env')
loadEnv('.env.local') // Overrides .env values
```

### Checking Environment Variables

```typescript
import { hasEnv, envs } from '@atlex/config'

// Check if an environment variable exists
if (hasEnv('DATABASE_URL')) {
  console.log('Database is configured')
}

// Get all environment variables as an object
const allEnvs = envs()
console.log(allEnvs)
```

## ConfigRepository API

### Dot-Notation Access

```typescript
import { config } from '@atlex/config'

// Get single value with dot notation
const appName: string = config('app.name')
const dbHost: string = config('database.host')
const dbPort: number = config('database.port')

// Get with default value
const apiTimeout = config('api.timeout', 30000)

// Get with type coercion
const debugMode = config.string('app.debug') // Converts to string
const maxConnections = config.integer('database.maxConnections')
const enableCache = config.boolean('cache.enabled')
```

### Checking Configuration

```typescript
import { config } from '@atlex/config'

// Check if a configuration key exists
if (config.has('api.key')) {
  console.log('API key is configured')
}

// Check multiple keys
const hasAllRequired = config.has('database.host', 'database.name')
```

### Wildcard Queries

```typescript
import { config } from '@atlex/config'

// Get all database configuration
const dbConfig = config('database.*')
// Returns: { host: 'localhost', port: 5432, name: 'myapp' }

// Get all values at any depth
const allMailSettings = config('mail.**')
```

### Setting Configuration

```typescript
import { config } from '@atlex/config'

// Set a configuration value at runtime
config.set('api.timeout', 60000)

// Set nested values
config.set('database', {
  host: 'localhost',
  port: 5432,
  name: 'production_db',
})

// Set multiple values
config.set({
  'app.name': 'My App',
  'app.version': '1.0.0',
  debug: false,
})
```

### Getting All Configuration

```typescript
import { config } from '@atlex/config'

// Get entire configuration object
const allConfig = config.all()

// Merge with additional values
const merged = {
  ...config.all(),
  runtime: {
    startTime: Date.now(),
  },
}
```

## Environment Casting

```typescript
import { EnvCaster } from '@atlex/config'

const caster = new EnvCaster()

// Cast to string
const appName = caster.asString('APP_NAME')

// Cast to integer
const port = caster.asInteger('PORT', 3000)

// Cast to boolean
const debug = caster.asBoolean('DEBUG')

// Cast to array (comma-separated or custom)
const allowedHosts = caster.asArray('ALLOWED_HOSTS', 'localhost,127.0.0.1')

// Cast to JSON
const dbPool = caster.asJson('DB_POOL', { min: 2, max: 10 })
```

## File-Based Configuration

### Using FileConfigLoader

```typescript
import { FileConfigLoader } from '@atlex/config'
import path from 'path'

const loader = new FileConfigLoader(path.join(__dirname, '../config'))

// Load all .js or .ts files from config directory
const appConfig = loader.load('app') // Loads app.js/app.ts
const databaseConfig = loader.load('database') // Loads database.js/database.ts
const mailConfig = loader.load('mail') // Loads mail.js/mail.ts

// Example config file structure:
// config/app.ts
export default {
  name: process.env.APP_NAME || 'Atlex App',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.APP_DEBUG === 'true',
  url: process.env.APP_URL || 'http://localhost:3000',
}
```

## Configuration Caching

```typescript
import { readCachedConfigSync, writeConfigCacheSync, clearConfigCacheSync } from '@atlex/config'

// Read from cache (returns null if not cached)
const cached = readCachedConfigSync()
if (cached) {
  console.log('Using cached configuration')
}

// Write configuration to cache
import { config } from '@atlex/config'
writeConfigCacheSync(config.all())

// Clear cache
clearConfigCacheSync()
```

## Complete Example

```typescript
import { config, env, loadEnv } from '@atlex/config'
import { FileConfigLoader } from '@atlex/config'
import path from 'path'

// 1. Load environment variables
loadEnv()

// 2. Load configuration files
const loader = new FileConfigLoader(path.join(__dirname, '../config'))

// 3. Set up configuration structure
config.set({
  app: {
    name: loader.load('app').name,
    environment: env('NODE_ENV', 'development'),
    debug: env('APP_DEBUG') === 'true',
  },
  database: {
    host: env('DB_HOST', 'localhost'),
    port: env('DB_PORT', 5432),
    name: env('DB_NAME', 'atlex'),
    user: env('DB_USER'),
    password: env('DB_PASSWORD'),
  },
  api: {
    timeout: env.integer('API_TIMEOUT', 30000),
    retries: env.integer('API_RETRIES', 3),
  },
})

// 4. Use configuration throughout your app
console.log(`Running ${config('app.name')} in ${config('app.environment')} mode`)

if (config('app.debug')) {
  console.log('Debug mode is enabled')
}

const dbPool = {
  host: config('database.host'),
  port: config('database.port'),
  database: config('database.name'),
  user: config('database.user'),
  password: config('database.password'),
}

console.log('Database configured:', dbPool)
```

## API Overview

### ConfigRepository

| Method                        | Description                               |
| ----------------------------- | ----------------------------------------- |
| `get(key, defaultValue?)`     | Get configuration value with dot notation |
| `set(key, value)`             | Set configuration value(s)                |
| `has(...keys)`                | Check if configuration key(s) exist       |
| `all()`                       | Get entire configuration object           |
| `string(key, defaultValue?)`  | Get value as string                       |
| `integer(key, defaultValue?)` | Get value as integer                      |
| `boolean(key, defaultValue?)` | Get value as boolean                      |
| `array(key, defaultValue?)`   | Get value as array                        |

### EnvCaster

| Method                          | Description                              |
| ------------------------------- | ---------------------------------------- |
| `asString(key, defaultValue?)`  | Cast environment variable to string      |
| `asInteger(key, defaultValue?)` | Cast environment variable to integer     |
| `asBoolean(key, defaultValue?)` | Cast environment variable to boolean     |
| `asArray(key, defaultValue?)`   | Cast environment variable to array       |
| `asJson(key, defaultValue?)`    | Cast environment variable to JSON object |

### Helper Functions

| Function                       | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| `config(key, defaultValue?)`   | Get configuration value (same as ConfigRepository.get) |
| `env(key, defaultValue?)`      | Get environment variable                               |
| `envs()`                       | Get all environment variables                          |
| `hasEnv(key)`                  | Check if environment variable exists                   |
| `loadEnv(file?)`               | Load environment variables from .env file              |
| `readCachedConfigSync()`       | Read cached configuration                              |
| `writeConfigCacheSync(config)` | Write configuration to cache                           |
| `clearConfigCacheSync()`       | Clear configuration cache                              |

## Configuration

### Environment Variables

| Variable       | Description                  | Default       |
| -------------- | ---------------------------- | ------------- |
| `NODE_ENV`     | Application environment      | `development` |
| `APP_DEBUG`    | Enable debug mode            | `false`       |
| `CONFIG_CACHE` | Enable configuration caching | `false`       |

### .env File Format

```env
# Application
APP_NAME="My Application"
APP_DEBUG=true
APP_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_db
DB_USER=postgres
DB_PASSWORD=secret

# API
API_TIMEOUT=30000
API_RETRIES=3

# Feature Flags
FEATURE_NEW_DASHBOARD=true
FEATURE_BETA_API=false
```

## Documentation

For complete documentation, visit [https://atlex.dev/guide/config](https://atlex.dev/guide/config)

## License

MIT
