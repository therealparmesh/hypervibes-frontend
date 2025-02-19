import { ensureHttpsUri, extractIpfsHash, fetchIpfsJson } from './ipfs';

export interface Metadata {
  name: string;
  description: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
}

// resolve metadata give a token URI
export const resolveMetadata = async (uri: string) => {
  // base64 encoded
  if (uri.match(/^data:application\/json;/)) {
    return parseBase64MetadataUri(uri);
  }

  // ipfs-style metadata
  const hash = extractIpfsHash(uri);

  let fetched: any;

  // use throttled ipfs fetch if ipfs, else str8 fetch it
  if (hash) {
    fetched = await fetchIpfsJson(hash);
  } else {
    const resp = await fetch(uri);
    fetched = await resp.json();
  }

  const projected: Metadata = {
    name: fetched.name ?? '',
    description: fetched.description ?? '',
    image: fetched.image ? ensureHttpsUri(fetched.image) : undefined,
    animationUrl: fetched.animation_url
      ? ensureHttpsUri(fetched.animation_url)
      : undefined,
    externalUrl: fetched.external_url ?? undefined,
  };

  return projected;
};

// parse base64 encoded URI schemes
const parseBase64MetadataUri = (uri: string): Metadata => {
  const [, encoded] = uri.match(/^data:application\/json;base64,(.*)$/) ?? [];
  const payload = JSON.parse(atob(encoded));

  const metadata: Metadata = {
    name: payload.name ?? '',
    description: payload.description ?? '',
    image: payload.image ?? undefined,
    animationUrl: payload.animation_url ?? undefined,
    externalUrl: payload.external_url ?? undefined,
  };

  return metadata;
};
