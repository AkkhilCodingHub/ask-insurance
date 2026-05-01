import crypto from 'crypto';

// Production URLs per Meri Pehchaan API spec v2.3
const BASE_V1   = 'https://digilocker.meripehchaan.gov.in/public/oauth2/1';
const BASE_V2   = 'https://digilocker.meripehchaan.gov.in/public/oauth2/2';
const CLIENT_ID     = process.env.DIGILOCKER_CLIENT_ID!;
const CLIENT_SECRET = process.env.DIGILOCKER_CLIENT_SECRET!;
const REDIRECT_URI  = process.env.DIGILOCKER_REDIRECT_URI!;

// openid → receive id_token; files.issueddocs → access issued document list
const SCOPE = 'openid files.issueddocs';

export interface DigiLockerTokens {
  access_token:  string;
  token_type:    string;
  expires_in:    number;
  refresh_token?: string;
  digilockerid:  string;  // 36-char UUID from DigiLocker
  name:          string;
  dob?:          string;  // DDMMYYYY format (e.g. "31121970")
  gender?:       string;
  eaadhaar?:     string;
}

export interface DigiLockerFile {
  name:        string;
  type:        string;
  size:        string;
  date:        string;
  parent:      string;
  mime:        string;
  uri:         string;
  issuer:      string;
  issuer_name: string;
  doctype:     string;
  description: string;
}

export interface DigiLockerFilesResponse {
  items: DigiLockerFile[];
}

// ── Generate auth URL ─────────────────────────────────────────────────────────

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    state,
    scope:         SCOPE,
  });
  return `${BASE_V1}/authorize?${params.toString()}`;
}

// ── Exchange code for tokens ──────────────────────────────────────────────────

export async function exchangeCode(code: string): Promise<DigiLockerTokens> {
  const body = new URLSearchParams({
    code,
    grant_type:    'authorization_code',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri:  REDIRECT_URI,
  });

  const res = await fetch(`${BASE_V1}/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiLocker token exchange failed: ${text}`);
  }

  return res.json() as Promise<DigiLockerTokens>;
}

// ── Fetch issued files list ───────────────────────────────────────────────────

export async function fetchIssuedFiles(accessToken: string): Promise<DigiLockerFile[]> {
  const res = await fetch(`${BASE_V2}/files/issued`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DigiLocker files fetch failed: ${text}`);
  }

  const data = await res.json() as DigiLockerFilesResponse;
  return data.items ?? [];
}

// ── Generate a CSRF state token ───────────────────────────────────────────────

export function generateState(userId: string): string {
  return `${userId}.${crypto.randomBytes(16).toString('hex')}`;
}

export function parseState(state: string): { userId: string } | null {
  const [userId] = state.split('.');
  if (!userId) return null;
  return { userId };
}
