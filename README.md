# baadjie website

Static website for baadjie with Google Sheets product uploads.

## Setup

1. Upload these files to GitHub:
   - index.html
   - styles.css
   - script.js
   - config.js
   - assets/baadjie-bg.png

2. Create a Google Sheet with these columns:

```txt
name, category, size, condition, price, status, image, description, whatsappText
```

3. Publish the sheet:
   File → Share → Publish to web → choose the product sheet → CSV

4. Paste the CSV link into config.js:

```js
SHEET_CSV_URL: "PASTE_YOUR_CSV_LINK_HERE"
```

5. Replace the WhatsApp number in config.js.

## Notes

- Use direct image links in the image column.
- Set status to Available or Sold.
- Categories currently used by the filters: Jackets, Puffers, Streetwear.
