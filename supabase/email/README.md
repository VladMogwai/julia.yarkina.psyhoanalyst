# Auth emails

`magic-link.html` is the body of the sign-in letter: the one-time code and an "Увійти" button. The button
leads back to the page the code was asked on, on the site's own domain, with `?token_hash=…&type=email`;
the page finishes the sign-in (`completeLinkSignIn` in `src/premium/access.ts`). Keeping every link on the
sender's domain helps the letter stay out of spam. Deploy the site before pasting a template with the button.

Supabase → Authentication → Emails → Magic Link:

- Subject: `Код для входу: {{ .Token }}`
- Body: the whole of `magic-link.html`. Copy it from an editor, not with `pbcopy`: without a UTF-8
  locale `pbcopy` reads the file as Mac Roman and the Cyrillic arrives garbled.

Custom templates need a custom SMTP sender on the free plan (Authentication → SMTP Settings, Resend).

The aurora is CSS radial gradients in the header, not an image, so there is never a broken-image
icon or a "load remote content" prompt. Apple Mail and most clients draw it; Gmail drops gradients
and keeps the forest-green header with the name on it.
