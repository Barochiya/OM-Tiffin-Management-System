"""OM Tiffin code-only release puller; never imports or modifies a database."""
import hashlib, json, os, pathlib, re, ssl, sys, urllib.request, zipfile, tempfile, subprocess, shutil

PRIVATE = pathlib.Path('/home1/maapn1f6/omtiffin-private')
PUBLIC = pathlib.Path('/home1/maapn1f6/omtiffinservices.com')
REPO = 'Barochiya/OM-Tiffin-Management-System'

def download(url, limit):
    request = urllib.request.Request(url, headers={'User-Agent': 'OM-Tiffin-BigRock-Deployment', 'Accept': 'application/vnd.github+json'})
    with urllib.request.urlopen(request, timeout=60, context=ssl.create_default_context()) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise ValueError('Release download exceeds size limit')
    return data

def validate(archive, revision):
    if not re.fullmatch(r'[a-f0-9]{40}', revision):
        raise ValueError('Invalid release revision')
    total = 0
    with zipfile.ZipFile(archive) as package:
        seen = set()
        for item in package.infolist():
            path = pathlib.PurePosixPath(item.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in item.filename or item.filename in seen:
                raise ValueError('Unsafe or duplicate release path')
            seen.add(item.filename)
            if not path.parts or path.parts[0] not in ('web', 'php', 'render', 'manifest.json'):
                raise ValueError('Unexpected release content')
            if any(p in ('private', 'backups', '.git') for p in path.parts) or path.name.startswith('.env') or path.name == 'config.local.json' or path.suffix in ('.sql', '.bson'):
                raise ValueError('Runtime data is forbidden in deployment packages')
            mode = item.external_attr >> 16
            if mode & 0o170000 == 0o120000:
                raise ValueError('Release symlinks are forbidden')
            total += item.file_size
            if total > 250 * 1024 * 1024:
                raise ValueError('Expanded release exceeds size limit')
        manifest = json.loads(package.read('manifest.json'))
        if manifest != dict(project='omtiffinservices.com', revision=revision, format=1, codeOnly=True):
            raise ValueError('Release identity mismatch')
        for required in ('web/index.php', 'web/index.html', 'web/.htaccess', 'php/entry.php', 'php/config.php', 'render/renderer.cjs'):
            if required not in seen:
                raise ValueError('Required application file missing')
    return manifest

def install(archive, revision):
    validate(archive, revision)
    private_target = PRIVATE / 'releases' / revision
    public_target = PUBLIC / 'releases' / revision
    if private_target.exists() or public_target.exists():
        raise ValueError('Release already exists; immutable releases are never overwritten')
    (PRIVATE / 'releases').mkdir(parents=True, exist_ok=True, mode=0o700)
    (PUBLIC / 'releases').mkdir(parents=True, exist_ok=True, mode=0o755)
    private_stage = pathlib.Path(tempfile.mkdtemp(prefix='.pending-', dir=PRIVATE / 'releases'))
    public_stage = pathlib.Path(tempfile.mkdtemp(prefix='.pending-', dir=PUBLIC / 'releases'))
    try:
        (PUBLIC / 'releases').chmod(0o755)
        public_stage.chmod(0o755)
        with zipfile.ZipFile(archive) as package:
            for item in package.infolist():
                parts = pathlib.PurePosixPath(item.filename).parts
                if parts[0] == 'manifest.json':
                    continue
                target = (public_stage if parts[0] == 'web' else private_stage).joinpath(*parts)
                permissions = 0o755 if parts[0] == 'web' else 0o700
                target.parent.mkdir(parents=True, exist_ok=True, mode=permissions)
                if parts[0] == 'web':
                    parent = target.parent
                    while parent != PUBLIC:
                        parent.chmod(0o755)
                        parent = parent.parent
                if item.is_dir():
                    target.mkdir(exist_ok=True, mode=permissions)
                else:
                    with target.open('xb') as output:
                        output.write(package.read(item))
                    target.chmod(0o644 if parts[0] == 'web' else 0o600)
        environment = os.environ.copy()
        environment['OMTIFFIN_CONFIG'] = str(PRIVATE / 'private/config.local.json')
        for source in (private_stage / 'php').glob('*.php'):
            subprocess.run(['/usr/local/bin/php', '-l', str(source)], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=20)
        check = subprocess.run(['/usr/local/bin/php', str(private_stage / 'php/health.php')], env=environment, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
        if check.stdout.strip() != b'OM_TIFFIN_RELEASE_HEALTH_OK':
            raise ValueError('Pre-activation release health check failed')
        os.replace(private_stage, private_target)
        try:
            os.replace(public_stage, public_target)
        except Exception:
            os.replace(private_target, private_stage)
            raise
    finally:
        # Only delete fresh temporary directories created by this invocation.
        for staging in (private_stage, public_stage):
            if staging.exists():
                shutil.rmtree(staging)
    current = PUBLIC / 'current'
    if current.exists() and not current.is_symlink():
        raise ValueError('Refusing to replace a non-symlink website directory')
    if current.is_symlink():
        (PRIVATE / 'previous-release.txt').write_text(os.readlink(current), encoding='utf-8')
    candidate = PUBLIC / ('current-next-' + revision)
    candidate.symlink_to(public_target / 'web', target_is_directory=True)
    os.replace(candidate, current)
    (PRIVATE / 'current-release.txt').write_text(revision, encoding='ascii')
    print('OM Tiffin code release activated: ' + revision + '; database/config/uploads untouched')

def main():
    import fcntl
    os.umask(0o077)
    if not (PRIVATE / 'deploy.enabled').is_file():
        return
    with (PRIVATE / 'deploy.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return
        release = json.loads(download('https://api.github.com/repos/' + REPO + '/releases/latest', 1024 * 1024))
        tag = release.get('tag_name', '')
        if not re.fullmatch(r'bigrock-[a-f0-9]{40}', tag) or release.get('body', '').strip() != 'OM_TIFFIN_CODE_ONLY_RELEASE_V1':
            raise ValueError('Latest release is not an approved OM Tiffin code package')
        revision = tag[len('bigrock-'):]
        current = PRIVATE / 'current-release.txt'
        if current.exists() and current.read_text().strip() == revision:
            return
        base = 'https://github.com/' + REPO + '/releases/download/' + tag + '/'
        expected = download(base + 'omtiffin-release.sha256', 1024).decode('ascii').split()[0]
        payload = download(base + 'omtiffin-release.zip', 50 * 1024 * 1024)
        if not re.fullmatch(r'[a-f0-9]{64}', expected) or not hashlib.sha256(payload).hexdigest() == expected:
            raise ValueError('Release archive checksum mismatch')
        with tempfile.NamedTemporaryFile(dir=PRIVATE, suffix='.zip') as archive:
            archive.write(payload)
            archive.flush()
            install(archive.name, revision)

if __name__ == '__main__':
    main()
