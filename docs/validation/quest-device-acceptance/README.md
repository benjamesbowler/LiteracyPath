# Sound Seekers Device Evidence

This folder contains integrity-sealed JSON records produced by the Sound Seekers release preview. A release record is accepted only when it names a physical device and operator, runs for at least 20 minutes, collects at least 100 samples, exercises real input, includes an offline/reconnect cycle, and passes the current evidence policy.

Required profiles are `ipad`, `chromebook`, `android-tablet`, `voiceover`, `nvda`, and `switch`.

For a pixel-device run, open a release-preview deployment with parameters in this form:

```text
/preview/quest.html?view=world&stop=s1&display=pixel&active=0&soak=release&profile=ipad&physical=1&operator=NAME&model=MODEL&os=OS&browser=BROWSER
```

For VoiceOver, NVDA, or switch runs, use `display=2d`, the matching profile, and `at=VoiceOver`, `at=NVDA`, or `at=Switch`.

During every release run:

1. Play normally across multiple tasks.
2. Disconnect and reconnect the network once, allowing the queued save to recover.
3. Continue until the recorder reaches at least 20 minutes.
4. Select **End and save test**.
5. Place the downloaded JSON record in this folder.
6. Run `npm run check:quest-device-acceptance`.

The evidence hash detects edits after export. It is an integrity seal, not a cryptographic identity signature; the named operator remains responsible for the physical-device declaration.
