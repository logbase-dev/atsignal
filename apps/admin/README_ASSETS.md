# Admin 앱 Assets 파일 위치 안내

## CSS 및 JS 파일 배치 위치

Admin 페이지에서 사용할 CSS와 JS 파일들은 다음 경로에 배치해주세요:

### 파일 구조

```
apps/admin/public/
├── assets/
│   ├── css/
│   │   └── style.css                    # 메인 CSS 파일
│   ├── js/
│   │   └── main.js                      # 메인 JS 파일
│   ├── img/
│   │   ├── logo.png                     # 로고 이미지
│   │   ├── favicon.png                  # 파비콘
│   │   └── apple-touch-icon.png         # Apple 터치 아이콘
│   └── vendor/
│       ├── bootstrap/
│       │   ├── css/
│       │   │   ├── bootstrap.min.css
│       │   │   └── bootstrap-icons.css
│       │   └── js/
│       │       └── bootstrap.bundle.min.js
│       ├── boxicons/
│       │   └── css/
│       │       └── boxicons.min.css
│       ├── quill/
│       │   ├── quill.snow.css
│       │   ├── quill.bubble.css
│       │   └── quill.js
│       ├── remixicon/
│       │   └── remixicon.css
│       ├── simple-datatables/
│       │   ├── style.css
│       │   └── simple-datatables.js
│       ├── apexcharts/
│       │   └── apexcharts.min.js
│       ├── chart.js/
│       │   └── chart.umd.js
│       ├── echarts/
│       │   └── echarts.min.js
│       ├── tinymce/
│       │   └── tinymce.min.js
│       └── php-email-form/
│           └── validate.js
```

### 접근 경로

Next.js의 `public` 폴더는 루트 경로(`/`)에서 직접 접근 가능합니다.

- CSS: `/assets/css/style.css`
- JS: `/assets/js/main.js`
- 이미지: `/assets/img/logo.png`
- Vendor 파일: `/assets/vendor/bootstrap/css/bootstrap.min.css`

### 참고사항

1. **public 폴더 생성**: `apps/admin/public/assets/` 폴더를 생성하고 위 구조대로 파일을 배치하세요.

2. **경로 유지**: HTML에서 사용한 경로(`assets/...`)를 그대로 유지하되, Next.js에서는 `/assets/...`로 접근합니다.

3. **빌드 시 포함**: `public` 폴더의 파일들은 빌드 시 자동으로 포함되며, 프로덕션에서도 동일한 경로로 접근 가능합니다.

4. **이미지 최적화**: Next.js의 `Image` 컴포넌트를 사용하려면 `/assets/img/` 경로를 사용하거나, `next.config.js`에서 이미지 도메인을 설정할 수 있습니다.
