# Auth emails

`magic-link.html` is the body of the sign-in letter with the one-time code.

Supabase → Authentication → Emails → Magic Link:

- Subject: `Код для входу: {{ .Token }}`
- Body: the whole of `magic-link.html`. Copy it from an editor, not with `pbcopy`: without a UTF-8
  locale `pbcopy` reads the file as Mac Roman and the Cyrillic arrives garbled.

Custom templates need a custom SMTP sender on the free plan (Authentication → SMTP Settings, Resend).

The aurora is CSS radial gradients in the header, not an image, so there is never a broken-image
icon or a "load remote content" prompt. Apple Mail and most clients draw it; Gmail drops gradients
and keeps the forest-green header with the name on it.
