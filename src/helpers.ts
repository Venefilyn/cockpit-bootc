
export function splitRepoBranch(image: string) {
    // OStree repos look like "local:fedora/x86_64/coreos/testing"
    // OCI repos like 'ostree-unverified-registry:quay.io/fedora/fedora-coreos:stable'
    const parts = image.split(':');
    const origin: {remote: string, branch: string|null} = { remote: image, branch: null };

    if (parts.length > 1) {
      origin.remote = parts.slice(0, -1).join(':');
      origin.branch = parts[parts.length - 1]
    }

    return origin;
}
