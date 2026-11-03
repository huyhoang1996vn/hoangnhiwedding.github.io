# Chuyển ngôn ngữ thiệp — Mini Spec

## Goal
Thiệp `index.html` mở bằng tiếng Việt. Một thẻ `p` cố định góc trên bên trái đổi giữa tiếng Việt và tiếng Anh; nhãn luôn là ngôn ngữ kia và có gạch dưới.

## Acceptance criteria
- Lần tải đầu: `html lang="vi"`, toàn bộ copy trên thiệp là tiếng Việt.
- Góc trên trái có `<p>` gạch dưới. Bản Việt hiện “English”; bản Anh hiện “Tiếng Việt”. Bấm (hoặc Enter/Space) thì đổi ngôn ngữ và đổi nhãn.
- Đổi được các đoạn chữ trên thiệp (intro, hero, lịch, countdown, lễ, dress code, story, timeline, venue, RSVP, footer) và chữ do JS tạo (từ nối tên khách, toast RSVP, hộp xác nhận lịch, aria nhạc).
- Tên riêng, địa chỉ, giờ, số và markup bên trong (icon, `span.font-num`) giữ nguyên. Nút nhạc góc phải vẫn hoạt động.
- Không lưu ngôn ngữ qua lần tải sau. Mỗi lần mở lại vẫn là tiếng Việt.

## Out of scope
- Trang `guests/index.html`.
- Sửa nội dung tiếng Anh hiện có (kể cả “Addess”).
- `localStorage`, query `?lang=`, hoặc bản dịch file lịch `.ics` / Google Calendar.
- Đổi `name` của form RSVP hoặc payload API.

## Blast radius
- Files/modules dự kiến: `index.html`, `css/custom.css`, `js/main.js`.

## Approach
Hai lớp chữ trên cùng một node, CSS chọn lớp theo `html[lang]`. Không đổi `textContent` vì nhiều đoạn có `span` số và SVG inline.

```html
<p id="lang-toggle" class="lang-toggle" role="button" tabindex="0">English</p>

<p>
  <span class="lang-vi">Chạm để mở</span>
  <span class="lang-en">Tap to open</span>
</p>
```

```css
.lang-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 200;
  margin: 0;
  text-decoration: underline;
  cursor: pointer;
}
html[lang="vi"] .lang-en { display: none; }
html[lang="en"] .lang-vi { display: none; }
```

`js/main.js`: một object `UI` cho chuỗi không nằm trong HTML.

```js
const UI = {
  vi: { and: 'và', toggle: 'English', toastRequired: 'Vui lòng điền các mục bắt buộc.' },
  en: { and: 'and', toggle: 'Tiếng Việt', toastRequired: 'Please fill in all required fields.' }
};
let lang = 'vi';

function applyLang(next) {
  lang = next;
  document.documentElement.lang = next;
  document.getElementById('lang-toggle').textContent = UI[next].toggle;
}
```

Click `#lang-toggle` gọi `applyLang(lang === 'vi' ? 'en' : 'vi')` và `stopPropagation()` để không kích hoạt intro video. `renderInviteeNames` dùng `UI[lang].and`. Toast và `window.confirm` lịch đọc `UI[lang]`.

Copy tiếng Việt để điền vào `.lang-vi` (bản nháp, chờ duyệt): “Chạm để mở”, “Trân trọng kính mời”, “cùng”, “Đến chung vui ngày trọng đại của chúng mình”, “Thứ Bảy, 9 tháng 1 năm 2027”, “Tháng 1”, “CN T2 T3 T4 T5 T6 T7”, “Đếm ngược”, “Ngày / Giờ / Phút”, “Lễ cưới & Tiệc”, “Lễ · 16:00”, “Tiệc · 18:30”, “Địa chỉ: Nguyễn Tất Thành, Hải Vân, Đà Nẵng”, “Đi vào phía nhà hàng Nami”, “Mở bản đồ”, “Thêm vào lịch”, “Trang phục”, “Tiệc nhiều màu sắc”, “Our Story” → “Chuyện của chúng mình”, “Timeline” → “Chương trình”, “Địa điểm”, “Bạn sẽ đến chứ?”, “Gửi”. Giữ nguyên Hoang, Nhi, Mikazuki, Nami Hall, giờ PM có thể viết 16:00 / 18:30.
