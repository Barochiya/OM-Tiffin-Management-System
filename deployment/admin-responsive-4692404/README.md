# OM Tiffin Admin responsive hotfix for BigRock release 4692404

The production React source is unavailable. This stylesheet targets the observed DOM of the current production release. It adjusts the walk-in payment-status filter, wallet approval cards and summary, WhatsApp review cards, and mobile Admin header. It preserves all production JavaScript assets and application routes.

BigRock applies one versioned stylesheet in `assets/` and links it from `index.html` in the active release. The deployment command is `python3 deploy.py apply`. Keep the stylesheet beside the script. The script verifies the active release and baseline HTML, JavaScript and stylesheet checksums, acquires the existing deployment lock, and backs up the original HTML under the private application backups directory. It installs the stylesheet before atomically replacing the HTML.

Use `python3 deploy.py rollback` to restore the verified original HTML on the same release. The stylesheet file remains available to browser sessions that already received the updated HTML. The deployment and rollback script operates on the frontend release files only.

This branch is for the BigRock CSS hotfix. Keep Draft PR #1 separate until matching React source is recovered. A future application release needs its own review of these layout fixes.
