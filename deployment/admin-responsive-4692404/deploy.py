"""Apply or roll back the CSS-only OM Tiffin hotfix for BigRock release 4692404."""

import argparse
import fcntl
import hashlib
import os
from pathlib import Path
import tempfile

REVISION = "469240453a1103124417bc91a67d2122dd55a73e"
INDEX_HASH = "a67fb2e7c13d947a239654fcb536200b6c8fdd0a738a06c51b953fddcb6d7f95"
ASSET_HASH = "461d0817a5a0557ef720f488b11422bb3a9b67a41b19d2e2258ddb1526dc757f"
ASSET_PATH = "assets/index-Bf6IPQiN.js"
CSS_NAME = "admin-responsive-4692404.css"
LINK = f'<link rel="stylesheet" href="/assets/{CSS_NAME}">'.encode()
CSS_HASH = "6d8f96666bcdb518c919147a36f2523e0708d4038ff5f9f466a38447ddd83771"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic_write(path, data, mode):
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as staging:
        staged = Path(staging.name)
        try:
            os.fchmod(staging.fileno(), mode)
            staging.write(data)
            staging.flush()
            os.fsync(staging.fileno())
            os.replace(staged, path)
        finally:
            staged.unlink(missing_ok=True)


def apply(root, private, css, rollback):
    release = root / "releases" / REVISION / "web"
    if (root / "current").resolve(strict=True) != release:
        raise SystemExit("The live release has changed.")
    if (private / "current-release.txt").read_text().strip() != REVISION:
        raise SystemExit("The active release marker has changed.")

    index = release / "index.html"
    script = release / ASSET_PATH
    target = release / "assets" / CSS_NAME
    if index.is_symlink() or target.is_symlink() or digest(script.read_bytes()) != ASSET_HASH:
        raise SystemExit("Expected release files failed validation.")
    original = index.read_bytes()
    if rollback:
        if original.count(LINK) != 1 or digest(original.replace(LINK, b"", 1)) != INDEX_HASH:
            raise SystemExit("The live HTML differs from the expected hotfix.")
        atomic_write(index, original.replace(LINK, b"", 1), 0o644)
        print("OM Tiffin HTML restored. The now-unreferenced stylesheet remains for open sessions.")
        return

    if digest(original) != INDEX_HASH or original.count(b"</head>") != 1:
        raise SystemExit("The live HTML no longer matches the verified baseline.")
    if digest(css) != CSS_HASH:
        raise SystemExit("The stylesheet checksum does not match.")
    if target.exists() and target.read_bytes() != css:
        raise SystemExit("A different file already uses the stylesheet path.")

    backup_root = private / "release-backups"
    backup_root.mkdir(mode=0o700, exist_ok=True)
    backup = Path(tempfile.mkdtemp(prefix="admin-css-4692404-", dir=backup_root))
    atomic_write(backup / "index.html", original, 0o600)
    if digest((backup / "index.html").read_bytes()) != INDEX_HASH:
        raise SystemExit("The application recovery copy failed checksum verification.")
    atomic_write(target, css, 0o644)
    atomic_write(index, original.replace(b"</head>", LINK + b"</head>", 1), 0o644)
    print(f"OM Tiffin stylesheet deployed. Verified HTML backup: {backup.name}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("apply", "rollback"))
    options = parser.parse_args()
    root = Path.home() / "omtiffinservices.com"
    private = Path.home() / "omtiffin-private"
    with (private / "deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        css = Path(__file__).with_name(CSS_NAME).read_bytes() if options.action == "apply" else None
        apply(root, private, css, options.action == "rollback")


if __name__ == "__main__":
    main()
