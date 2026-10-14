# Photos Workflow

- Put JPG/PNG files into photos/, then run `pnpm organize-photos`. It renames them by capture
  time, compresses them to 1440px (metadata incl. GPS stripped) and writes a `.json` sidecar
  with a blurhash. Edit each sidecar's `text` for the caption.
- Export RAW (e.g. .ARW/.CR2/.NEF/.DNG) to JPG/PNG first.
- See ORGANIZE_PHOTOS.md for details.
