# Music

The game plays music from `audio/music/`. No music files are included: add your own and list them in `tracks.json`.

```json
{
  "hub": ["pokemon-center.mp3", "city.mp3"],
  "battle": ["wild-battle.mp3"],
  "gym": ["gym-leader.mp3"],
  "elite": [],
  "champion": ["champion.mp3"],
  "rival": []
}
```

- `hub`: the title screen, drafts, shop and every menu between battles.
- `battle`: every battle. `gym`, `elite`, `champion` and `rival` are used for those opponents; when one is empty the game uses `battle`.
- Several files in one list: one is picked at random each time.
- Any format your browser plays (`.mp3`, `.ogg`, `.m4a`). Tracks loop. Start with short, loopable files.
- Use only music you have the right to use. A public GitHub Pages site is public distribution.
- The ♪ button in the corner of the game turns the music on and off (saved on this device).
