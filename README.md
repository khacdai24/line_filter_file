# Line Filter (Local)
Website filters lines by keywords (or Regex). Run entirely in the browser.

(When i use this tool??? When i get some cookie file, attach file in this tool, write text i want to filter (i use , and | to seperate keywords) push filter button and it will show me the result (or use regex) then i can save it as JSON file. Download Cookie Edit Tool, import cookie file and login directly in the account)

## Usage
1. Open `index.html` (or Live Server in VS Code).
2. Select file `.json/.txt/.log/...`.
3. Enter the keyword/phrase to filter.
4. Click **Filter** → the result will display the matching lines along with the line numbers.

## Options
- **Case sensitive**
- **Use Regex** (JavaScript RegExp)
- **Inverse filtering**: get the lines that *do not* contain the keyword
- **Limit results** to avoid browser hanging

## Note
- File is not uploaded to the network.
- With very large files, the browser may be slow. Reduce the result limit or split the file.
