# Line Filter (Local)

Trang web lọc dòng theo từ khoá (hoặc Regex). Chạy hoàn toàn trong trình duyệt.

## Cách dùng
1. Mở `index.html` (hoặc Live Server trong VS Code).
2. Chọn file `.json/.txt/.log/...`.
3. Nhập từ/cụm từ cần lọc.
4. Bấm **Lọc** → kết quả hiển thị các dòng khớp kèm số dòng.

## Tuỳ chọn
- **Phân biệt hoa/thường**
- **Dùng Regex** (JavaScript RegExp)
- **Lọc ngược**: lấy các dòng *không* chứa từ khoá
- **Giới hạn kết quả** để tránh treo trình duyệt

## Ghi chú
- File không bị upload lên mạng.
- Với file rất lớn, trình duyệt có thể chậm. Hãy giảm giới hạn kết quả hoặc chia nhỏ file.
