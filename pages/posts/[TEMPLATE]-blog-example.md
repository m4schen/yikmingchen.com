---
title: "[TEMPLATE] Blog Post Example - Complete Guide"
date: 2026-02-22T00:00:00Z
lang: en
duration: 8min
description: "Comprehensive template showing all blog features, structure, and best practices"
---

<!--
COMPLETE BLOG POST TEMPLATE
============================
This comprehensive template shows how to write blog posts on your site.
The [TEMPLATE] prefix in the title hides it from the blog listing.

FRONTMATTER FIELDS EXPLAINED:
- title: Post title (required) - Include [TEMPLATE] to hide from listing
- date: Publication date in ISO 8601 format (required)
- lang: Language code - "en" for English, "zh" for Chinese, "ja" for Japanese
- duration: Estimated reading time (e.g., "5min", "10min")
- description: SEO meta description (optional but recommended)

KEY NOTES:
- Blog posts automatically appear in /posts sorted by date (newest first)
- Only posts with valid dates appear in listings
- Posts marked as "draft: true" are excluded from listings
- Posts with [TEMPLATE] in title are filtered out programmatically
- Use "type: blog" if you want to categorize differently (default: blog)
-->

## Understanding Blog Structure

A well-written blog post on this site follows a clear pattern.

### Frontmatter Section

Everything between the `---` markers at the top contains metadata:

```yaml
---
title: Your Post Title
date: 2026-02-22T00:00:00Z
lang: en
duration: 5min
---
```

### Content Section

Everything after the frontmatter is rendered as Markdown with Vue capabilities.

---

## Complete Feature Showcase

\_\_

### 1. Text Formatting & Basic Markdown

You can use **bold**, _italic_, ~~strikethrough~~, or `inline code`.

Create lists:

- Item one

- Item two
  - Nested item

Numbered lists:

1. First step
2. Second step
3. Third step

---

### 2. Code Blocks with Syntax Highlighting

**JavaScript/TypeScript:**

```typescript
// Complete example with TypeScript typing
interface User {
  id: number
  name: string
  email: string
}

const user: User = {
  id: 1,
  name: 'Yiming Chen',
  email: 'hi@yikmingchen.com',
}

console.log(user.name) // "Yiming Chen"
```

**Python:**

```python
def greet(name: str) -> str:
    """Greet someone with their name."""
    return f"Hello, {name}!"

result = greet("Yiming")
print(result)  # Output: Hello, Yiming!
```

**Shell/Bash:**

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to production
npm run deploy
```

**HTML/CSS:**

```html
<div class="container">
  <h1>Welcome</h1>
  <p>This is a sample HTML block</p>
</div>

<style scoped>
  .container {
    padding: 2rem;
    background-color: #f5f5f5;
  }
</style>
```

---

### 3. Embedding Vue Components

You can embed any Vue component defined in `src/components/`:

```vue
<PhotoInBlogTemplate />
```

This renders the component directly in your post. Other examples:

- `<PhotoGalleryAll :limit="10" />`
- `<YouTubeEmbed video-id="..." />`
- Custom components you create

---

### 4. Advanced Markdown Features

#### Ruby Text (for translations/pronunciation)

English with Chinese Ruby:
<ruby lang="zh">Baltimore<rp>(</rp><rt>巴尔的摩</rt><rp>)</rp></ruby>

Japanese with pronunciation:
<ruby lang="ja">東京<rp>(</rp><rt>Tokyo</rt><rp>)</rp></ruby>

#### Inline Icons

Using UnoCSS icon classes:
<span i-ri-camera-3-line /> Camera
<span i-ri-github-line /> GitHub
<span i-ri-bluesky-line /> Bluesky

#### UnoCSS Utility Classes

You can use any UnoCSS utilities directly in HTML:

<div class="text-blue-500 font-bold text-lg">
  This text is blue, bold, and large
</div>

<div class="flex gap-4 items-center">
  <div i-ri-checkbox-circle-line text-green-500 text-2xl />
  <span>Feature completed succssfully</span>
</div>

---

### 5. Internal & External Links

**Link to another blog post:**

```markdown
[Read about hello-tokyo](/posts/hello-tokyo)

[Another post](./another-post) <!-- relative link -->
```

**Link to other pages:**

```markdown
[Projects](/projects)
[Photos](/photos)
[About](/use)
```

**External links:**

```markdown
[Anthony Fu's blog](https://antfu.me)
[Vue.js Official](https://vuejs.org)
```

---

### 6. Social Mentions & Automatic Linking

Use `@` prefix to mention people/organizations (auto-links):

- {@m4schen} - Links to your GitHub profile
- {@NuxtLabs} - Links to organization
- {@antfu} - Links to Anthony Fu's profile

The system automatically converts these to clickable links if profiles are found.

---

---

### 7. B l ockquotes

> This is a blo ckquot e . Use it for important quotes, tips, or highlighted text.
>
> It can s p an multiple p aragraphs.

> **Pro tip:** Always include examples in your blog posts for clarity.

---

### 8. Tables

| Feature          | Blog                   | Note                    |
| ---------------- | ---------------------- | ----------------------- |
| Length           | Long form (5+ min)     | Short form (quick read) |
| Appears On       | /posts                 | /notes                  |
| Date Required    | Yes                    | Yes                     |
| Frontmatter Type | `type: blog` (default) | `type: note`            |
| Use Case         | Deep dives             | Quick tips              |

---

### 9. HTML in Markdown

You can write raw HTML when needed:

<div class="bg-yellow-100 border border-yellow-400 p-4 rounded">
  <strong>⚠️ Warning:
</strong> This is an important notice using HTML.
</div>

<div class="flex items-center justify-between p-4 bg-blue-50 rounded">
  <span>Custom HTML component</span>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Action

  </button>
</div>

---

## Writing Best Pract

ices

### Content Structure

- Start with a compelling hook or introduction
- Use headers to organize thoughts (only one H1 per article)
- Break long paragraph
  s (max 3-4 sentences each)
- End with a conclusion or call-to-action

### SEO & Metadata

- Write descriptive titles (40-60 characters)
- Include a `description` field (160 characters max)
- Use headers semantically (H2, H3, not H1)
- Add keywords naturally throughout

### Reader Experience

- Include visual breaks (images, code blocks, lists)
- Link to related content
- Use examples and real-world scenarios
- Tell a story when possible

### Technical Accuracy

- Test code examples before publishing
- Link to references and sources
- Update posts if information becomes outdated
- Use `[Updated: 2026-02-22]` if refreshing old posts

---

## Publication Checklist

Before publishing, ensure:

- [ ] Title is accurate and compelling
- [ ] `date` is set to publication date (ISO 8601 format)
- [ ] `lang` is set correctly (en/zh/ja)
- [ ] `duration` is reasonable estimate
- [ ] All code examples work correctly
- [ ] All links are valid and tested
- [ ] Images/components load properly
- [ ] Content is proofread (grammar, spelling)
- [ ] [TEMPLATE] is removed from filename and title
- [ ] Frontmatter is complete and valid YAML

---

## Publishing Steps

1. **Rename the file:** Remove `[TEMPLATE]-` prefix

   ```

   [TEMPLATE]-blog-example.md → my-awesome-blog-post.md
   ```

2. **Update frontmatter:**
   - Change title (remove [TEMPLATE] marker)
   - Set date to today (YYYY-MM-DD
     THH:MM:SSZ)
   - Review lang, duration, description

3. **Write your content:** Replace this template with your article

4. **Deploy:** Commit and pus
   h to trigger auto-deployment

5. **Verify:** Visit `/posts` to confirm it appears in the list

---

## Troubleshooting

**Post doesn't appear in /posts:**

- Check that `date` is valid ISO 8601 format
- Verify `draft: true` is not in frontmatter
- Confirm title doesn't contain `[TEMPLATE]`
- Check that the file is in `/pages/posts/` directory

**Code highlighting not working:**

- Ensure language identifier is correct (typescript, python, javascript, etc.)
- Check for unclosed backticks
- Verify the code block syntax is correct

**Components not rendering:**

- Check component name is exact match (case-sensitive)
- Verify component is registered in auto-imports
- Test component independently first

---

**Remember:** Your blog is your voice. Write authentically, share knowledge generously, and enjoy the process! 📝✨
