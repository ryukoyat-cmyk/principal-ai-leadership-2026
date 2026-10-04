# 2026년도 교장 리더십을 위한 생성형 AI 실습

연수생에게 ‘이것만은 꼭! 준비해주세요’와 ‘강의 자료’ 링크를 제공하는 반응형 웹사이트입니다.

- 연수 페이지: https://ryukoyat-cmyk.github.io/principal-ai-leadership-2026/
- 관리자: https://ryukoyat-cmyk.github.io/principal-ai-leadership-2026/admin.html
- 관리자 로그인은 비밀번호만 입력합니다. 초기 비밀번호는 저장소에 포함하지 않습니다.

## 자료 관리

관리자 주소로 직접 접속 → 비밀번호 로그인 → 자료 추가 → 섹션·제목·링크·설명·이미지 입력 → 저장하기.
제목과 링크는 필수입니다. JPG/PNG/WebP 5MB 이하의 이미지는 최대 1600px WebP로 변환됩니다.
자료별 ↑/↓ 버튼으로 순서를 바꾸고 숨기기/공개하기로 공개 여부를 설정합니다.
이미지가 없으면 기본 그래픽을 표시합니다. 링크는 새 탭에서 열립니다.
열려 있는 연수 화면은 30초마다, 또는 화면으로 돌아올 때 새 자료를 불러옵니다.

비밀번호는 로그인 후 상단 ‘비밀번호 변경’에서 변경합니다. 비밀번호를 잃어버리면 Supabase 프로젝트 소유자가 Authentication의 관리자 계정을 복구해야 합니다. 사이트는 이메일을 수집하거나 이메일 복구를 제공하지 않습니다.

## 개발과 배포

Node.js 22 이상 권장.

```sh
npm ci
npm run dev
npm test
npm run build
npm run prepare-pages
```

GitHub Pages는 `main` 브랜치의 `/docs` 폴더를 배포합니다. 화면 코드를 수정한 경우 빌드 후 prepare-pages를 실행하고 소스와 docs를 함께 커밋합니다. 관리자에서 자료를 변경할 때는 재배포가 필요 없습니다.

## 데이터와 권한

Supabase 프로젝트 `atiuykifyywubpcgwdwd` (서울). `cards`에는 자료, `administrators`에는 허용된 관리자 1명만 저장합니다. 익명 사용자는 공개 자료만 읽을 수 있으며 데이터·이미지 쓰기 권한은 등록된 관리자에게만 있습니다. 관리자는 Supabase Auth 내부 식별자로 인증되고 이용 화면에는 이메일 입력이 없습니다.

`src/config.js`의 publishable key는 공개 클라이언트용이며, RLS 정책으로 권한을 제한합니다. 서비스 비밀키나 비밀번호는 클라이언트와 저장소에 포함하지 않습니다.

`card-images`는 공개 연수 자료 이미지 버킷입니다. 카드 숨김은 목록 노출을 제어하며, 이미 공유된 이미지 URL 자체를 비공개로 바꾸지는 않습니다. 빈 섹션에는 준비 중 안내를 표시하며 접속 실패는 재시도 안내와 구분합니다.

`database/schema.sql`은 초기 스키마 참고본입니다. 운영 프로젝트에 다시 실행하지 않습니다.

## 디자인

사용자가 제공한 회사 로고와 우주 배경을 사용합니다. 글꼴은 Noto Sans KR (Google Fonts, SIL Open Font License)입니다. 첨부 이미지의 권리는 원 소유자에게 있습니다.
