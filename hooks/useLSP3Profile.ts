import { useState, useEffect } from 'react';

const IPFS_GATEWAY = 'https://api.universalprofile.cloud/ipfs/';
const LSP3_KEY = '0x5ef83ad9559033e6e941db7d7c495acdce616347d28e90c7ce47cbfcfcad3bc5';
const LUKSO_RPC = 'https://rpc.mainnet.lukso.network';

export interface LSP3Profile {
  name: string | null;
  description: string | null;
  avatar: string | null;
}

function resolveIpfs(url: string): string {
  if (!url) return '';
  if (url.startsWith('ipfs://')) return IPFS_GATEWAY + url.slice(7);
  return url;
}

function decodeVerifiableURI(hex: string): string | null {
  // Format: 0x0000 (2 bytes) + hashFunction (4 bytes) + hashSize (2 bytes) + hash (32 bytes) + url
  // Total prefix before URL = 2 + 4 + 2 + 32 = 40 bytes = 80 hex chars + "0x" = 82
  if (!hex || hex.length < 82) return null;
  const urlHex = hex.slice(82); // after 0x + 80 chars
  try {
    return Buffer.from(urlHex, 'hex').toString('utf8');
  } catch {
    return null;
  }
}

export function useLSP3Profile(address: string): LSP3Profile & { loading: boolean } {
  const [profile, setProfile] = useState<LSP3Profile & { loading: boolean }>({
    name: null,
    description: null,
    avatar: null,
    loading: true,
  });

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function load() {
      try {
        // Call getData(LSP3_KEY) on the UP address
        const resp = await fetch(LUKSO_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [
              {
                to: address,
                data:
                  '0x54f6127f' + // getData(bytes32) selector
                  LSP3_KEY.slice(2),
              },
              'latest',
            ],
            id: 1,
          }),
        });

        const json = await resp.json();
        const raw: string = json?.result;
        if (!raw || raw === '0x') throw new Error('No LSP3 data');

        // ABI-decode the bytes return value: offset (32 bytes) + length (32 bytes) + data
        // result is ABI-encoded bytes: 0x + 32 bytes offset + 32 bytes length + data
        const withoutPrefix = raw.slice(2);
        const dataOffset = parseInt(withoutPrefix.slice(0, 64), 16) * 2;
        const dataLength = parseInt(withoutPrefix.slice(64, 128), 16) * 2;
        const dataHex = '0x' + withoutPrefix.slice(128, 128 + dataLength);

        const ipfsUrl = decodeVerifiableURI(dataHex);
        if (!ipfsUrl) throw new Error('Could not decode VerifiableURI');

        const cid = ipfsUrl.startsWith('ipfs://') ? ipfsUrl.slice(7) : ipfsUrl;
        const metaResp = await fetch(IPFS_GATEWAY + cid);
        const meta = await metaResp.json();

        const lsp3 = meta?.LSP3Profile;
        const name = lsp3?.name ?? null;
        const description = lsp3?.description ?? null;
        const rawAvatar =
          lsp3?.profileImage?.[0]?.url ??
          lsp3?.avatar?.[0]?.url ??
          null;
        const avatar = rawAvatar ? resolveIpfs(rawAvatar) : null;

        if (!cancelled) setProfile({ name, description, avatar, loading: false });
      } catch {
        if (!cancelled) setProfile((p) => ({ ...p, loading: false }));
      }
    }

    load();
    return () => { cancelled = true; };
  }, [address]);

  return profile;
}
