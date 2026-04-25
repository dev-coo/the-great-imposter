# The Great Imposter

사진을 올리면 4×4 픽셀 임포스터가 몰래 숨어드는 웹 앱.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local의 GEMINI_API_KEY 채우기 (https://aistudio.google.com/app/apikey)
npm run dev
```

http://localhost:3000

## 테스트

```bash
npm run test
```

## 배포 (Vercel)

1. Vercel에 프로젝트 임포트
2. 환경 변수 `GEMINI_API_KEY` 설정
3. 자동 배포 (region: `icn1`)

## 설계 문서

- `docs/plans/2026-04-25-the-great-imposter-design.md`
- `docs/superpowers/plans/2026-04-25-the-great-imposter.md`
