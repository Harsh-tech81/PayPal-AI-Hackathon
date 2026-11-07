/**
 * PayShield AI - Cloud Database Connection Sanitizer & Pool Manager
 * Automatically sanitizes connection strings for Supabase/PostgreSQL and MongoDB Atlas.
 * Resolves URI parsing issues with unencoded special characters in cloud passwords.
 */

export interface SanitizedPostgresConfig {
  connectionString: string;
  isCloud: boolean;
  ssl?: { rejectUnauthorized: boolean };
}

export function sanitizePostgresUrl(raw?: string): SanitizedPostgresConfig {
  const fallback = "postgresql://postgres:postgrespassword@localhost:5432/payshield_db";
  const urlToParse = (raw || process.env.DIRECT_URL || process.env.DATABASE_URL || fallback).trim();

  try {
    const schemeIndex = urlToParse.indexOf("://");
    const lastAt = urlToParse.lastIndexOf("@");

    if (schemeIndex === -1 || lastAt === -1 || lastAt < schemeIndex) {
      const isCloud = isCloudHost(urlToParse);
      return {
        connectionString: urlToParse,
        isCloud,
        ssl: isCloud ? { rejectUnauthorized: false } : undefined,
      };
    }

    const prefix = urlToParse.slice(0, schemeIndex + 3);
    const userPass = urlToParse.slice(schemeIndex + 3, lastAt);
    const rest = urlToParse.slice(lastAt + 1);

    const firstColon = userPass.indexOf(":");
    let user = userPass;
    let pass = "";

    if (firstColon !== -1) {
      user = userPass.slice(0, firstColon);
      pass = userPass.slice(firstColon + 1);
    }

    // Safely percent-encode password and username (properly handles '@', '!', '#', '$' in passwords)
    const encodedUser = user.includes("%") ? user : encodeURIComponent(decodeURIComponent(user));
    const encodedPass = pass.includes("%") ? pass : encodeURIComponent(decodeURIComponent(pass));

    const sanitizedUrl = `${prefix}${encodedUser}:${encodedPass}@${rest}`;
    const isCloud = isCloudHost(sanitizedUrl);

    return {
      connectionString: sanitizedUrl,
      isCloud,
      ssl: isCloud ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return {
      connectionString: fallback,
      isCloud: false,
    };
  }
}

function isCloudHost(str: string): boolean {
  return (
    str.includes("supabase.com") ||
    str.includes("supabase.co") ||
    str.includes("neon.tech") ||
    str.includes("render.com") ||
    str.includes("aws") ||
    str.includes("pooler.supabase") ||
    str.includes("sslmode=require")
  );
}

export interface SanitizedMongoConfig {
  isValid: boolean;
  uri?: string;
  databaseName: string;
  errorMessage?: string;
}

export function sanitizeMongoUri(raw?: string): SanitizedMongoConfig {
  let uri = (raw || process.env.MONGODB_URI || "").trim();

  // Strip wrapping quotes if present
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  if (!uri) {
    return {
      isValid: false,
      databaseName: "payshield",
      errorMessage: "MONGODB_URI is not set",
    };
  }

  try {
    const schemeIndex = uri.indexOf("://");
    if (schemeIndex === -1) {
      return {
        isValid: false,
        databaseName: "payshield",
        errorMessage: "Invalid MongoDB URI format: missing scheme (mongodb:// or mongodb+srv://)",
      };
    }

    const scheme = uri.slice(0, schemeIndex + 3);
    const afterScheme = uri.slice(schemeIndex + 3);
    const lastAt = afterScheme.lastIndexOf("@");

    if (lastAt === -1) {
      // Direct host without credentials
      return {
        isValid: true,
        uri,
        databaseName: extractDbName(uri),
      };
    }

    const userPass = afterScheme.slice(0, lastAt);
    let hostAndQuery = afterScheme.slice(lastAt + 1);

    const firstColon = userPass.indexOf(":");
    let user = userPass;
    let pass = "";
    if (firstColon !== -1) {
      user = userPass.slice(0, firstColon);
      pass = userPass.slice(firstColon + 1);
    }

    // Safely percent-encode credentials for special characters (#, @, !, $, etc.)
    const encodedUser = user.includes("%") ? user : encodeURIComponent(decodeURIComponent(user));
    const encodedPass = pass.includes("%") ? pass : encodeURIComponent(decodeURIComponent(pass));

    const queryIdx = hostAndQuery.indexOf("?");
    let host = hostAndQuery;
    let query = "";
    if (queryIdx !== -1) {
      host = hostAndQuery.slice(0, queryIdx);
      query = hostAndQuery.slice(queryIdx);
    }

    // Strip forbidden port number from SRV hosts
    if (scheme === "mongodb+srv://" && host.includes(":")) {
      const parts = host.split("/");
      parts[0] = parts[0].split(":")[0];
      host = parts.join("/");
    }

    // Ensure database name is present before query params
    if (!host.includes("/") || host.endsWith("/")) {
      const cleanedHost = host.replace(/\/+$/, "");
      host = `${cleanedHost}/payshield`;
    }

    const sanitizedUri = `${scheme}${encodedUser}:${encodedPass}@${host}${query}`;
    return {
      isValid: true,
      uri: sanitizedUri,
      databaseName: extractDbName(sanitizedUri),
    };
  } catch (err: any) {
    return {
      isValid: false,
      databaseName: "payshield",
      errorMessage: err.message,
    };
  }
}

function extractDbName(uri: string): string {
  try {
    const pathPart = uri.split("?")[0].split("/").pop();
    return pathPart && pathPart !== "" ? pathPart : "payshield";
  } catch {
    return "payshield";
  }
}
