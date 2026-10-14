# 📸 照片整理指南

把照片放进 `photos/`，运行一条命令，网站就能直接使用。

```bash
pnpm organize-photos
```

脚本是 `scripts/organize-photos.ts`，可以放心重复运行：已经处理过的照片不会再被改动。

## 它做了什么

对 `photos/` 里的每张 JPG/PNG：

1. **重命名**（仅限新照片）：读取 EXIF 拍摄时间（`DateTimeOriginal`，其次 `DateTime`），
   没有 EXIF 时用文件修改时间，改名为 `p-YYYY-MM-DD-HH-MM-SS-000-N.jpg`。
   同一秒的多张照片用 `N` 区分（`-1`、`-2`…），不会覆盖已有文件。
2. **压缩**：长边缩到 1440px，JPEG 质量 80（mozjpeg）。能省 10% 以上才写回，所以重复运行不会反复压缩。
   同时会**去掉所有元数据（包括 GPS 位置）**，照片方向会先按 EXIF 转正。
3. **生成说明文件**：创建同名 `.json`，并自动补上 `blurhash`（加载时的模糊占位图）。

## 文件名格式

`p-2025-04-04-06-04-06-000-1.jpg`

| 部分                  | 含义                            |
| --------------------- | ------------------------------- |
| `p-`                  | 照片前缀                        |
| `2025-04-04-06-04-06` | 拍摄时间（本地时间，24 小时制） |
| `000`                 | 毫秒（预留，暂未使用）          |
| `1`                   | 序号（同一秒的多张照片）        |

## 说明文件（.json）

```json
{
  "text": "New York City - China Town, Jan 2025",
  "lang": "en",
  "blurhash": "UHF#?%rqIU-p}so#NGr?8_Nd%gaJ9FRkxuxt"
}
```

- `text`：照片说明，会显示在相册和预览里。新照片默认是 `Photo from 原文件名`，记得改。
- `lang`：说明文字的语言（`en`、`zh`、`ja`…）。
- `blurhash`：脚本自动生成，不用手动填写。

## 在网站中使用

- `/photos` 页面会自动显示 `photos/` 里的所有照片（`photos/data.ts` 负责读取）。
- 在文章里展示几张照片：按文件名从 `photos/data.ts` 里挑出来，再交给 `<PhotoSlide>`
  （照片打包后网址带哈希，所以不能直接写 `/photos/xxx.jpg`）：

```markdown
<script setup>
import photos from '../../photos/data'

const trip = photos.filter(p => ['p-2025-01-24-02-23-32-000-1', 'p-2025-01-24-02-24-14-000-1'].includes(p.name))
</script>

<PhotoSlide :photos="trip" />
```

## 注意事项

- RAW 格式（.ARW/.CR2/.NEF/.DNG）要先导出成 JPG/PNG。
- 原图不会保留：压缩后的文件直接替换原文件（旧版本仍在 git 历史里）。
- 运行后用 `pnpm build && pnpm verify` 检查；超过 500 kB 的图片会让检查失败。
