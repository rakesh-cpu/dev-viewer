# 📝 Elegant Markdown Viewer

A beautiful, modern web-based Markdown file viewer built with **pure JavaScript** and **CSS** - no frameworks, no dependencies, no backend required!

## ✨ Features

### 🎨 Beautiful Design
- **Modern, Premium UI** with smooth gradients and glassmorphism effects
- **Dark Mode Support** with elegant color transitions
- **Responsive Design** that works on all devices
- **Custom Typography** using Inter and JetBrains Mono fonts

### 📄 Markdown Support
- **Full Markdown Syntax** including:
  - Headers (H1-H6)
  - Bold, Italic, Strikethrough
  - Links and Images
  - Code blocks with syntax highlighting
  - Blockquotes
  - Ordered and Unordered Lists
  - Horizontal Rules
  - Tables
- **Pure JavaScript Parser** - no external markdown libraries needed!

### 🚀 User Experience
- **Drag & Drop** file upload
- **Real-time Rendering** of markdown content
- **Reading Time Estimation** based on word count
- **File Size Display**
- **Adjustable Font Sizes** (4 levels)
- **Export to HTML** - download rendered content
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + D` - Toggle dark mode
  - `Ctrl/Cmd + +` - Increase font size
  - `Ctrl/Cmd + -` - Decrease font size

### 💾 Smart Features
- **LocalStorage Persistence** - remembers your theme and font size preferences
- **No Database Required** - everything runs client-side
- **Privacy First** - files never leave your browser
- **Fast & Lightweight** - instant loading and rendering

## 🎯 Use Cases

Perfect for:
- Reading documentation files
- Previewing README files
- Reviewing markdown notes
- Presenting markdown content elegantly
- Quick markdown file inspection

## 🚀 Getting Started

### Option 1: Direct File Access
Simply open `index.html` in your browser - that's it!

### Option 2: Local Server (Recommended)
For the best experience, serve the files using a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### Option 3: Deploy to AWS (S3 + CloudFront)

Deploy this application to AWS for global access with CloudFront CDN.

#### 📚 Deployment Guide

Follow the comprehensive step-by-step guide to deploy via AWS Console:

**[AWS Setup Guide](./aws-setup-guide.md)** - Complete manual deployment instructions including:
- Creating IAM user with bucket-level permissions only
- S3 bucket configuration for static website hosting
- CloudFront distribution setup
- File upload and verification

**[IAM Permissions Guide](./IAM-PERMISSIONS-GUIDE.md)** - Understanding the exact permissions needed

**[IAM Policy File](./iam-policy-complete.json)** - Ready-to-use IAM policy JSON

#### 💰 Cost Estimate

- **S3 Storage**: ~$0.023/GB/month (app is <1MB = negligible)
- **CloudFront**: First 1TB free per month
- **Total**: ~$0-1/month for low to moderate traffic

#### 🔒 Security Features

- Bucket-level IAM permissions (no access to other S3 buckets)
- CloudFront-only access (S3 bucket not publicly accessible)
- HTTPS enforced by default
- Block all public access on S3

## 📖 How to Use

1. **Open the Application** in your browser
2. **Upload a Markdown File** by:
   - Clicking "Browse Files" button
   - Dragging and dropping a .md file onto the upload area
3. **Read and Enjoy** the beautifully rendered content
4. **Customize Your Experience**:
   - Toggle dark mode with the 🌙 button
   - Adjust font size with A- and A+ buttons
   - Download as HTML with the ⬇️ button
   - Clear and start over with the 🗑️ button

## 🛠️ Technical Details

### Architecture
- **index.html** - Main HTML structure
- **styles.css** - Complete design system with CSS variables
- **markdown-parser.js** - Custom markdown parser implementation
- **app.js** - Application logic and event handling

### Core JavaScript Concepts Used
- **Classes & OOP** - MarkdownParser and MarkdownViewerApp classes
- **Regular Expressions** - For parsing markdown syntax
- **File API** - FileReader for reading uploaded files
- **LocalStorage API** - For persisting user preferences
- **DOM Manipulation** - Dynamic content rendering
- **Event Handling** - File upload, drag & drop, keyboard shortcuts
- **Blob API** - For HTML export functionality

### CSS Techniques
- **CSS Variables** - Complete design system
- **Flexbox & Grid** - Responsive layouts
- **CSS Transitions** - Smooth animations
- **Media Queries** - Mobile responsiveness
- **Custom Properties** - Theme switching
- **Backdrop Filters** - Modern glassmorphism effects

## 🎨 Customization

### Changing Colors
Edit the CSS variables in `styles.css`:

```css
:root {
    --accent-primary: #6366f1;  /* Primary accent color */
    --accent-secondary: #8b5cf6; /* Secondary accent color */
    /* ... more variables */
}
```

### Adding New Markdown Features
Extend the `MarkdownParser` class in `markdown-parser.js`:

```javascript
// Add new pattern
this.patterns.yourFeature = /your-regex/g;

// Add parsing method
parseYourFeature(text) {
    return text.replace(this.patterns.yourFeature, '<your-html>$1</your-html>');
}
```

## 🌟 Browser Support

Works on all modern browsers:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)

## 📝 License

Free to use for personal and commercial projects!

## 🤝 Contributing

Feel free to enhance this project! Some ideas:
- Add table support
- Implement syntax highlighting for code blocks
- Add export to PDF functionality
- Create a split-view editor mode
- Add markdown templates

---

**Built with ❤️ using vanilla JavaScript & CSS**
