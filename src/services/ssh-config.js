// src/services/ssh-config.js — Parse ~/.ssh/config into structured host entries

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Default host group assignments. Comment headers in ssh config are used as hints,
 * but this mapping provides explicit control.
 */
const DEFAULT_GROUPS = {
  wayfarer: 'VPS',
  sirius: 'VPS',
  volcano: 'VPS',
  agamemnon: 'NAS',
  manticore: 'Proxmox',
  minotaur: 'Proxmox',
  hexapuma: 'HomeLab VM',
  'prince-adrian': 'HomeLab VM',
  'trevors-star': 'HomeLab LXC',
  cardones: 'HomeLab LXC',
  linnet: 'HomeLab LXC',
  unifi: 'Network',
  desktop: 'Client',
  laptop: 'Client',
};

/**
 * Parse an SSH config file into structured host entries.
 * @param {string} [configPath] — path to SSH config (default: ~/.ssh/config)
 * @returns {Array<object>} parsed host entries
 */
export function parseSSHConfig(configPath) {
  const filePath = configPath || join(homedir(), '.ssh', 'config');
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const hosts = [];
  let currentHost = null;
  let currentGroupHint = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track comment section headers as group hints
    // e.g., "# --- VPS Hosts ---" → "VPS Hosts"
    const groupMatch = trimmed.match(/^#\s*---\s*(.+?)\s*---/);
    if (groupMatch) {
      currentGroupHint = groupMatch[1].trim();
      continue;
    }

    // Skip comments and empty lines
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // Host line starts a new entry
    if (trimmed.startsWith('Host ')) {
      // Save previous host if exists
      if (currentHost) {
        hosts.push(finalizeHost(currentHost, currentGroupHint));
      }

      const aliases = trimmed.slice(5).trim().split(/\s+/);

      // Skip wildcard entries
      if (aliases.includes('*')) {
        currentHost = null;
        continue;
      }

      // First non-IP alias is the primary name
      const primaryName = aliases.find(a => !isIP(a)) || aliases[0];
      currentHost = {
        name: primaryName,
        aliases: aliases.filter(a => a !== primaryName),
        hostname: null,
        user: null,
        identityFile: null,
        _groupHint: currentGroupHint,
      };
      continue;
    }

    // Indented config lines belong to current host
    if (currentHost && trimmed.includes(' ')) {
      const spaceIdx = trimmed.indexOf(' ');
      const key = trimmed.slice(0, spaceIdx).trim();
      const value = trimmed.slice(spaceIdx + 1).trim();

      switch (key) {
        case 'HostName':
          currentHost.hostname = value;
          break;
        case 'User':
          currentHost.user = value;
          break;
        case 'IdentityFile':
          currentHost.identityFile = value;
          break;
      }
    }
  }

  // Don't forget the last host
  if (currentHost) {
    hosts.push(finalizeHost(currentHost, currentGroupHint));
  }

  // Add localhost (reliant) as implicit host
  const hasLocalhost = hosts.some(h => h.isLocal);
  if (!hasLocalhost) {
    hosts.unshift({
      name: 'reliant',
      aliases: ['localhost'],
      hostname: '127.0.0.1',
      user: 'claude',
      identityFile: null,
      group: 'Local',
      isLocal: true,
    });
  }

  return hosts;
}

function finalizeHost(host, _fallbackGroupHint) {
  const group = DEFAULT_GROUPS[host.name] || inferGroup(host._groupHint) || 'Other';
  const { _groupHint, ...rest } = host;
  return {
    ...rest,
    group,
    isLocal: host.hostname === '127.0.0.1' || host.hostname === '192.168.150.120',
  };
}

function inferGroup(hint) {
  if (!hint) return null;
  // Strip trailing "s" for plurals: "VPS Hosts" → "VPS"
  return hint.replace(/\s*Hosts?\s*$/i, '').trim() || null;
}

function isIP(str) {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(str);
}
