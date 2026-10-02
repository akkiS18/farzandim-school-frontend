# School improvements test branch

Branch: `test/school-improvements` (base: `master`). Deploy only with the backend branch of the same name, after tenant migration 000041.

## Validation

- `npx tsc --noEmit`
- `npm run build` (requires access to the project's existing Google Fonts)
- Mocked browser check at 375px: MAIN_TEACHER subject filtering, navigation request/empty state, no page overflow or runtime errors.
- Backend regression and timetable SQL scenarios are documented in the backend repository's matching test guide.

## Acceptance checklist

1. Teachers: select one required primary subject on create/edit. The teachers list displays it. On class assignment it is preselected and marked as suggested; another subject can be selected.
2. Announcements: select up to 10 JPEG/PNG images, remove unwanted ones, submit. Check admin, teacher and parent image galleries. Use only a dedicated test Telegram bot/chat when testing delivery.
3. Journal: MAIN_TEACHER and SUBJECT_TEACHER see only their own assigned class subjects. An assigned secondary subject must still be available regardless of the profile's primary subject.
4. Journal header: inspect at 375px and desktop widths. Class, complete subject name, lesson period, full weekday and date should be readable without duplicated class/subject headings. Each weekday has a consistent color and a written label.
5. Previous/next lesson: stays in the same class and subject; includes repeated periods on the same day; skips holidays/cancellations; observes schedule changes. Saving grades disables navigation.
6. Reports: list and preview show AI / automatic template / unknown source. Hover over a badge to inspect model or sanitized failure reason. Historical reports without source metadata remain unknown.

No production deployment or main/master merge is included.
